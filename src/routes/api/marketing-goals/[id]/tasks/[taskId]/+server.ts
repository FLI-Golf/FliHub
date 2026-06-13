/**
 * PATCH  /api/marketing-goals/[id]/tasks/[taskId] — update task (status, fields)
 * DELETE /api/marketing-goals/[id]/tasks/[taskId] — delete task
 *
 * Simplified workflow:
 *   todo → in_progress → completed (creates expense + approval)
 *   
 * When status → completed:
 *   1. Creates expense record with task cost
 *   2. Creates approval record for admin quorum voting
 *   3. Task is marked as done
 *   4. Admins vote on approval via /api/approvals/approve
 *   5. When quorum is met → work order auto-generated, expense marked approved
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS = [
	'title', 'description', 'status', 'priority', 'dueDate',
	'estimatedCost', 'actualCost', 'assignedTo', 'notes', 'progressContribution'
];

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const normalized = value.replace(/[$,\s]/g, '');
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	console.log('📝 Task PATCH endpoint:', { goalId: params.id, taskId: params.taskId, body });

	const patch: Record<string, any> = {};
	for (const key of ALLOWED_FIELDS) {
		if (key in body) patch[key] = body[key];
	}
	if (!Object.keys(patch).length) return json({ message: 'Nothing to update' }, { status: 400 });

	try {
		// Load current task
		const current = await ctx.pb.collection('goal_tasks').getOne(params.taskId);
		console.log('📋 Current task:', { id: current.id, status: current.status, expenseId: current.expenseId });
		const newStatus: string | undefined = patch.status;
        const isCompletionStatus = newStatus === 'completed' || newStatus === 'done';

		// ── When moving to completed: create expense + approval for admin vote ───
		if (isCompletionStatus && current.status !== 'completed' && current.status !== 'done') {
			try {
				console.log('💰 Logging expense for task:', params.taskId);
				const goal = await ctx.pb.collection('marketing_goals').getOne(params.id).catch(() => null);
				const normalizedAmount = toNumber(current.actualCost) || toNumber(current.estimatedCost);
				if (normalizedAmount <= 0) {
					throw new Error('Set an estimated or actual cost greater than $0 before logging expense.');
				}
				const profiles = await ctx.pb.collection('user_profiles').getFullList({
					filter: `userId = "${ctx.userId}"`,
					fields: 'id,userId'
				}).catch(() => []);
				const requesterId = (profiles[0] as any)?.id ?? ctx.userId;

				const expensePayload = {
					description: (current.description ?? '').trim() || current.title,
					amount:      normalizedAmount,
					status:      'submitted',
					category:    'Marketing',
					date:        new Date().toISOString().slice(0, 10),
					notes:       `Created from goal task. Goal: ${goal?.name ?? params.id}`,
				};
				console.log('📦 Expense payload:', expensePayload);

				// Reuse existing linked expense when present; otherwise create fresh.
				const existingExpense = current.expenseId
					? await ctx.pb.collection('expenses').getOne(current.expenseId).catch(() => null)
					: null;

				let expense = existingExpense as any;
				if (!expense) {
					expense = await ctx.pb.collection('expenses').create(expensePayload);
				} else if (expense.status !== 'submitted') {
					// Best effort: move stale linked expense into submitted state, but never fail the flow.
					expense = await ctx.pb.collection('expenses').update(expense.id, {
						status: 'submitted',
						amount: expensePayload.amount,
						description: expensePayload.description,
						notes: expensePayload.notes
					}).catch(() => expense);
				}

				console.log('✅ Expense ready:', { id: expense.id, amount: expense.amount, status: expense.status });
				patch.expenseId = expense.id;

				// Create approval for this expense if one doesn't exist
				const existingApproval = await ctx.pb.collection('approvals').getFirstListItem(
					`entityType = \"expense\" && entityId = \"${expense.id}\" && status = \"pending\"`
				).catch(() => null);

				if (!existingApproval) {
					console.log('📋 Creating approval for expense:', expense.id);
					const createdApproval = await ctx.pb.collection('approvals').create({
						entityType:    'expense',
						entityId:      expense.id,
						status:        'pending',
						requestedBy:   requesterId,
						requestedDate: new Date().toISOString(),
						amount:        expense.amount ?? 0,
						comments:      `Task: ${current.title}${goal ? ` (Goal: ${goal.name})` : ''}`
					});
					patch.approvalId = createdApproval.id;
					console.log('✅ Approval created:', createdApproval.id);
				} else {
					console.log('🆗 Approval already exists:', existingApproval.id);
					patch.approvalId = existingApproval.id;
				}
			} catch (err: any) {
				console.error('❌ Expense/approval creation failed:', err.message || err);
				const pbData = err?.response?.data ? ` | ${JSON.stringify(err.response.data)}` : '';
				const detailed = `${err?.response?.message ?? err?.message ?? 'Failed to create expense approval request'}${pbData}`;
				throw new Error(detailed);
			}
		}

		// ── Recalculate goal progress when completion status changes ──────────
		const completionChanged =
			newStatus === 'completed' ||
			newStatus === 'done' ||
			((current.status === 'completed' || current.status === 'done') && newStatus && newStatus !== 'completed' && newStatus !== 'done');
		const contributionChanged = 'progressContribution' in patch;

		let updated: any;
		try {
			updated = await ctx.pb.collection('goal_tasks').update(params.taskId, patch);
		} catch (updateErr: any) {
			// Some deployed schemas may not yet include linkage fields like approvalId/expenseId.
			// Retry with only core editable fields so the workflow can proceed.
			const retryPatch: Record<string, any> = {};
			for (const key of ALLOWED_FIELDS) {
				if (key in patch) retryPatch[key] = patch[key];
			}
			for (const key of ['expenseId', 'approvalId', 'workOrderId'] as const) {
				if (key in patch) retryPatch[key] = patch[key];
			}

			// Production compatibility: some environments don't allow `completed` in goal_tasks.status.
			// In that case, fall back to `done` (legacy schema).
			const invalidStatus = updateErr?.response?.data?.status?.code === 'validation_invalid_value';
			if (invalidStatus && retryPatch.status === 'completed') {
				retryPatch.status = 'done';
			}

			if (Object.keys(retryPatch).length === 0) throw updateErr;
			updated = await ctx.pb.collection('goal_tasks').update(params.taskId, retryPatch);
		}

		if (completionChanged || contributionChanged) {
			await recalculateGoalProgress(ctx.pb, params.id);
		}

		return json(updated);
	} catch (err: any) {
		const pbData = err?.response?.data ? ` | ${JSON.stringify(err.response.data)}` : '';
		const errorMsg = `${err?.response?.message ?? err?.message ?? 'Unknown error'}${pbData}`;
		console.error('❌ Task PATCH failed:', { error: errorMsg, status: err?.status });
		return json({ message: errorMsg }, { status: err?.status || 500 });
	}
};

/**
 * Recalculate a goal's currentValue from its completed tasks.
 *
 * Strategy:
 *   - Load the goal's baselineValue (stored separately) and all completed tasks
 *     that have a progressContribution set.
 *   - Sum contributions → add to baseline → write back to currentValue.
 *   - If no tasks have contributions, leave currentValue unchanged (manual mode).
 *   - Also updates the goal's progressMode field so the UI can show which mode is active.
 */
async function recalculateGoalProgress(pb: any, goalId: string) {
	try {
		const [goal, allTasks] = await Promise.all([
			pb.collection('marketing_goals').getOne(goalId),
			pb.collection('goal_tasks').getFullList({
				filter: `goalId = "${goalId}"`
			})
		]);

		// Only tasks with a progressContribution value set participate
		const contributing = allTasks.filter(
			(t: any) => t.progressContribution != null && t.progressContribution !== 0
		);

		if (contributing.length === 0) {
			// No tasks drive progress — leave currentValue as-is (manual mode)
			await pb.collection('marketing_goals').update(goalId, {
				progressMode: 'manual'
			}).catch(() => {});
			return;
		}

		// Sum contributions from completed tasks only
		const completedContribution = contributing
			.filter((t: any) => t.status === 'completed' || t.status === 'done')
			.reduce((sum: number, t: any) => sum + (t.progressContribution ?? 0), 0);

		// Baseline: the value before any tasks contributed (stored on first switch to task-driven)
		const baseline = goal.progressBaseline ?? 0;
		const newValue = baseline + completedContribution;

		await pb.collection('marketing_goals').update(goalId, {
			currentValue:  newValue,
			progressMode:  'task_driven',
			// Store baseline on first switch so manual edits aren't lost
			progressBaseline: goal.progressBaseline ?? goal.currentValue ?? 0
		}).catch(() => {});
	} catch {
		// Non-fatal — progress recalc failure shouldn't break the task update
	}
}

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		await ctx.pb.collection('goal_tasks').delete(params.taskId);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
