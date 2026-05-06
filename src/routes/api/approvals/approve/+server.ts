import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
	const pb = locals.pb;

	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
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
				const existing = await pb.collection('work_orders').getList(1, 1, {
					filter: `projectCode = "${projectCode}"`,
					sort: '-created',
					fields: 'work_order_number'
				}).catch(() => ({ items: [] })) as any;

				let seq = 1;
				if (existing.items.length > 0) {
					const last = existing.items[0].work_order_number as string;
					const parts = last.split('-');
					const lastSeq = parseInt(parts[parts.length - 1], 10);
					if (!isNaN(lastSeq)) seq = lastSeq + 1;
				}
				workOrderNumber = `WO-${projectCode}-${String(seq).padStart(4, '0')}`;

				updatePayload.comments = `<p>Approved by ${voteCount} of ${quorum} required approvers. Work Order: ${workOrderNumber}</p>`;

				// 3. Update expense: approved + work order number
				await pb.collection('expenses').update(expense.id, {
					status: 'approved',
					approvedBy: userProfile.id,
					approvedDate: new Date().toISOString(),
					work_order_number: workOrderNumber,
				}).catch((e: any) => console.warn('expense update failed:', e.message));

				// 4. Create work_orders record
				await pb.collection('work_orders').create({
					work_order_number: workOrderNumber,
					expenseId:    expense.id,
					taskId:       expense.taskId || '',
					projectId:    project?.id || '',
					projectCode,
					projectName:  project?.name || '',
					description:  expense.description || '',
					amount:       expense.amount || 0,
					approvedBy:   userProfile.id,
					approvedDate: new Date().toISOString(),
					status:       'open',
				}).catch((e: any) => console.warn('work_order create failed:', e.message));

				// 5. Flag the task for review
				if (taskRecord) {
					await pb.collection('tasks').update(taskRecord.id, {
						needs_review: true,
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
				updatePayload.comments = `<p>Approved by ${voteCount} of ${quorum} required approvers.</p>`;
				await pb.collection('projects').update(approval.entityId, {
					status: 'in_progress',
					approvedBy: userProfile.id,
				}).catch((e: any) => console.warn('project update failed:', e.message));
			} else {
				updatePayload.comments = `<p>Approved by ${voteCount} of ${quorum} required approvers.</p>`;
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
