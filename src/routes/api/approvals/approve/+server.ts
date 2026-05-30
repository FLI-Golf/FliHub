import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

/** Derive a short project code from the project name — first letter of each word, max 6 chars, uppercase. */
function deriveProjectCode(name: string): string {
	return name
		.replace(/[^a-zA-Z\s]/g, '')
		.split(/\s+/)
		.filter(Boolean)
		.map(w => w[0].toUpperCase())
		.join('')
		.slice(0, 6) || 'WO';
}

export const POST: RequestHandler = async ({ locals, request }) => {
	const userPb = locals.pb;

	if (!userPb.authStore.isValid || !userPb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Use admin client for all DB writes so auth state never blocks work order creation
	const pb = await getAdminPocketBase();

	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${userPb.authStore.model.id}"`
		});
		const userProfile = profiles[0] as any;

		if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'leader')) {
			return json({ error: 'Unauthorized - Admin or Leader access required' }, { status: 403 });
		}

		const { approvalId } = await request.json();
		if (!approvalId) return json({ error: 'Approval ID is required' }, { status: 400 });

		// Load quorum setting (default 2)
		const settings = await pb.collection('settings').getFullList({ fields: 'key,value' }).catch(() => []);
		const quorumSetting = (settings as any[]).find((s: any) => s.key === 'approval_quorum');
		const quorum = quorumSetting ? Math.max(1, Number(quorumSetting.value)) : 2;

		const approval = await pb.collection('approvals').getOne(approvalId) as any;
		if (approval.status !== 'pending') {
			return json({ error: 'Approval is no longer pending' }, { status: 409 });
		}

		// Parse existing voters
		let voters: string[] = [];
		try {
			const raw = approval.approvers;
			if (Array.isArray(raw)) voters = raw;
			else if (typeof raw === 'string' && raw.trim().startsWith('[')) voters = JSON.parse(raw);
		} catch { /* empty */ }

		if (voters.includes(userProfile.id)) {
			return json({ error: 'You have already approved this item' }, { status: 409 });
		}

		voters = [...voters, userProfile.id];
		const voteCount = voters.length;
		const quorumMet = voteCount >= quorum;

		const updatePayload: Record<string, any> = {
			approvers: voters,
			approver: userProfile.id,
		};

		let workOrderNumber: string | null = null;

		if (quorumMet) {
			updatePayload.status = 'approved';
			updatePayload.reviewedDate = new Date().toISOString();

			// ── Side effects on quorum ────────────────────────────────────────
			if (approval.entityType === 'expense') {
				const expense = await pb.collection('expenses').getOne(approval.entityId) as any;

				// 1. Resolve project via task
				let project: any = null;
				let taskRecord: any = null;
				if (expense.taskId) {
					try {
						taskRecord = await pb.collection('tasks').getOne(expense.taskId) as any;
						const pid = typeof taskRecord.projectId === 'object'
							? taskRecord.projectId?.id
							: taskRecord.projectId;
						if (pid) project = await pb.collection('projects').getOne(pid) as any;
					} catch { /* ignore */ }
				}

				// 2. Generate Work Order number: WO-{CODE}-{NNNN}
				const projectCode = project ? deriveProjectCode(project.name) : 'GEN';

				// Sequence: count all existing work orders and add 1 (avoids filter on non-indexed field)
				const allWOs = await pb.collection('work_orders').getFullList({
					fields: 'work_order_number',
					sort: '-created'
				}).catch(() => []) as any[];
				const seq = allWOs.length + 1;
				workOrderNumber = `WO-${projectCode}-${String(seq).padStart(4, '0')}`;

				updatePayload.comments = `<p>Quorum reached — approved by ${voteCount} ${voteCount === 1 ? 'approver' : 'approvers'}. Work Order: ${workOrderNumber}</p>`;

				// 3. Update expense: approved + work order number
				await pb.collection('expenses').update(expense.id, {
					status: 'approved',
					approvedBy: userProfile.id,
					approvedDate: new Date().toISOString(),
					work_order_number: workOrderNumber,
				}).catch((e: any) => console.warn('expense update failed:', e.message));

				// 4. Create work_orders record
				try {
					const wo = await pb.collection('work_orders').create({
						work_order_number: workOrderNumber,
						// legacy text fields (kept for backwards compat)
						expenseId:    expense.id,
						taskId:       expense.taskId || '',
						projectId:    project?.id || '',
						projectCode,
						projectName:  project?.name || '',
						approvedBy:   userProfile.id,
						// proper relation fields
						expense:      expense.id,
						task:         expense.taskId || null,
						project:      project?.id || null,
						approver:     userProfile.id,
						submittedBy:  expense.submittedBy || null,
						// audit fields
						description:  expense.description || '',
						amount:       expense.amount || 0,
						approvedDate: new Date().toISOString(),
						source:       'expense',
						paymentMethod: expense.paymentMethod || '',
						status:       'open',
					});
					console.log(`✅ Work order ${workOrderNumber} created: ${wo.id}`);
				} catch (e: any) {
					console.error('❌ work_order create failed:', e.message, JSON.stringify(e.data ?? {}));
				}

				// 5. Flag the task for review
				if (taskRecord) {
					await pb.collection('tasks').update(taskRecord.id, {
						needs_review: true,
						work_order_number: workOrderNumber,
					}).catch((e: any) => console.warn('task flag failed:', e.message));
				}

				// 6. Update project actual expenses
				if (project) {
					const currentActual = project.project_actual_expenses || 0;
					await pb.collection('projects').update(project.id, {
						project_actual_expenses: currentActual + (expense.amount || 0),
					}).catch((e: any) => console.warn('project budget update failed:', e.message));
				}

			} else if (approval.entityType === 'project') {
				updatePayload.comments = `<p>Quorum reached — approved by ${voteCount} ${voteCount === 1 ? 'approver' : 'approvers'}.</p>`;
				await pb.collection('projects').update(approval.entityId, {
					status: 'in_progress',
					approvedBy: userProfile.id,
				}).catch((e: any) => console.warn('project update failed:', e.message));

			} else if (approval.entityType === 'bid') {
				// Quorum reached: approve the linked expense, generate a Work Order number,
				// create a work_order record, and update project actual expenses.

				const bid = await pb.collection('bids').getOne(approval.entityId, {
					expand: 'projectId,vendorId',
				}).catch(() => null) as any;

				const expense = approval.expenseId
					? await pb.collection('expenses').getOne(approval.expenseId).catch(() => null) as any
					: null;

				const project = bid?.expand?.projectId ?? null;
				const vendor  = bid?.expand?.vendorId  ?? null;

				// Generate Work Order number: WO-{CODE}-{NNNN}
				const projectCode = project ? deriveProjectCode(project.name) : 'VND';
				const allWOs = await pb.collection('work_orders').getFullList({
					fields: 'work_order_number', sort: '-created',
				}).catch(() => []) as any[];
				const seq = allWOs.length + 1;
				workOrderNumber = `WO-${projectCode}-${String(seq).padStart(4, '0')}`;

				// Approve the expense and stamp PO number
				if (expense) {
					await pb.collection('expenses').update(expense.id, {
						status:            'approved',
						approvedBy:        userProfile.id,
						approvedDate:      new Date().toISOString(),
						work_order_number: workOrderNumber,
					}).catch((e: any) => console.warn('bid expense update failed:', e.message));
				}

				// Create work_order / PO record
				try {
					await pb.collection('work_orders').create({
						work_order_number: workOrderNumber,
						source:            'bid',
						status:            'open',
						bidId:             approval.entityId,
						vendorId:          bid?.vendorId  ?? null,
						projectId:         bid?.projectId ?? '',
						project:           bid?.projectId ?? null,
						projectName:       project?.name  ?? '',
						projectCode:       deriveProjectCode(project?.name ?? ''),
						expenseId:         expense?.id ?? '',
						expense:           expense?.id ?? null,
						approver:          userProfile.id,
						approvedBy:        userProfile.id,
						submittedBy:       userProfile.id,
						description:       `Vendor PO — ${vendor?.name ?? 'Vendor'}: ${bid?.scope ?? ''}`.slice(0, 500),
						amount:            bid?.amount ?? expense?.amount ?? 0,
						approvedDate:      new Date().toISOString(),
						notes:             bid?.notes ?? '',
					});
					console.log(`✅ Work order ${workOrderNumber} created for bid ${approval.entityId}`);
				} catch (e: any) {
					console.error('❌ work_order create failed (bid):', e.message, JSON.stringify(e.data ?? {}));
				}

				// Update project actual expenses
				if (project && (bid?.amount ?? 0) > 0) {
					await pb.collection('projects').update(project.id, {
						project_actual_expenses: (project.project_actual_expenses ?? 0) + (bid.amount ?? 0),
					}).catch((e: any) => console.warn('project actual update failed:', e.message));
				}

				updatePayload.comments = `<p>Quorum reached — approved by ${voteCount} ${voteCount === 1 ? 'approver' : 'approvers'}. Work Order: ${workOrderNumber}</p>`;

			} else if (approval.entityType === 'goal_task') {
				// ── goal_task quorum pipeline ─────────────────────────────────
				// Mirrors the expense pipeline: generate WO number, create work_orders
				// record, update linked expense if present, flag the task as approved.

				const goalTask = await pb.collection('goal_tasks').getOne(approval.entityId).catch(() => null) as any;
				const goal = goalTask?.goalId
					? await pb.collection('marketing_goals').getOne(goalTask.goalId).catch(() => null) as any
					: null;

				// Generate WO number using goal name as code (e.g. WO-MKTG-0012)
				const goalCode = goal
					? goal.goalName
						.replace(/[^a-zA-Z\s]/g, '')
						.split(/\s+/)
						.filter(Boolean)
						.map((w: string) => w[0].toUpperCase())
						.join('')
						.slice(0, 6) || 'GOAL'
					: 'GOAL';

				const allWOs = await pb.collection('work_orders').getFullList({
					fields: 'work_order_number', sort: '-created'
				}).catch(() => []) as any[];
				const seq = allWOs.length + 1;
				workOrderNumber = `WO-${goalCode}-${String(seq).padStart(4, '0')}`;

				updatePayload.comments = `<p>Quorum reached — approved by ${voteCount} ${voteCount === 1 ? 'approver' : 'approvers'}. Work Order: ${workOrderNumber}</p>`;

				// Create work_orders record
				try {
					await pb.collection('work_orders').create({
						work_order_number: workOrderNumber,
						expenseId:    goalTask?.expenseId || '',
						taskId:       '',
						projectId:    '',
						projectCode:  goalCode,
						projectName:  goal?.goalName || '',
						approvedBy:   userProfile.id,
						expense:      goalTask?.expenseId || null,
						task:         null,
						project:      null,
						approver:     userProfile.id,
						submittedBy:  goalTask?.assignedTo || null,
						description:  goalTask?.description || goalTask?.title || '',
						amount:       goalTask?.actualCost ?? goalTask?.estimatedCost ?? 0,
						approvedDate: new Date().toISOString(),
						source:       'goal_task',
						status:       'open',
					});
					console.log(`✅ Work order ${workOrderNumber} created for goal_task ${approval.entityId}`);
				} catch (e: any) {
					console.error('❌ work_order create failed (goal_task):', e.message, JSON.stringify(e.data ?? {}));
				}

				// Update linked expense if one was created during task pipeline
				if (goalTask?.expenseId) {
					await pb.collection('expenses').update(goalTask.expenseId, {
						status:            'approved',
						approvedBy:        userProfile.id,
						approvedDate:      new Date().toISOString(),
						work_order_number: workOrderNumber,
					}).catch((e: any) => console.warn('goal_task expense update failed:', e.message));
				}

				// Mark the goal task as approved with WO reference
				if (goalTask) {
					await pb.collection('goal_tasks').update(approval.entityId, {
						status:            'approved',
						approvedBy:        userProfile.id,
						approvedAt:        new Date().toISOString(),
						workOrderId:       workOrderNumber,
					}).catch((e: any) => console.warn('goal_task update failed:', e.message));
				}

			} else {
				updatePayload.comments = `<p>Quorum reached — approved by ${voteCount} ${voteCount === 1 ? 'approver' : 'approvers'}.</p>`;
			}
		}

		const updatedApproval = await pb.collection('approvals').update(approvalId, updatePayload);

		return json({
			success: true,
			quorumMet,
			voteCount,
			quorum,
			workOrderNumber,
			message: quorumMet
				? `Approved — quorum of ${quorum} reached.${workOrderNumber ? ` Work Order ${workOrderNumber} created.` : ''}`
				: `Vote recorded (${voteCount}/${quorum}). Waiting for more approvals.`,
			approval: updatedApproval,
		});
	} catch (error: any) {
		console.error('Error approving:', error);
		return json({ error: 'Failed to process approval', details: error.message }, { status: 500 });
	}
};
