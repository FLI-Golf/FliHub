/**
 * PATCH  /api/marketing-goals/[id]/tasks/[taskId] — update task (status, fields)
 * DELETE /api/marketing-goals/[id]/tasks/[taskId] — delete task
 *
 * Stage transitions handled here:
 *   → needs_approval  : creates/submits expense + approval record
 *   → approved        : marks approval resolved, sets approvedBy/approvedAt
 *   → expense_created : creates/submits an expense record linked to the goal
 *   → work_order      : legacy stage now routed to expense approval path
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS = [
	'title', 'description', 'status', 'priority', 'dueDate',
	'estimatedCost', 'actualCost', 'assignedTo', 'notes', 'progressContribution'
];

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	const patch: Record<string, any> = {};
	for (const key of ALLOWED_FIELDS) {
		if (key in body) patch[key] = body[key];
	}
	if (!Object.keys(patch).length) return json({ message: 'Nothing to update' }, { status: 400 });

	try {
		// Load current task
		const current = await ctx.pb.collection('goal_tasks').getOne(params.taskId);
		const newStatus: string | undefined = patch.status;

		const ensureSubmittedExpenseAndApproval = async () => {
			const goal = await ctx.pb.collection('marketing_goals').getOne(params.id).catch(() => null);
			const expensePayload = {
				title:       current.title,
				description: current.description ?? '',
				amount:      current.actualCost ?? current.estimatedCost ?? 0,
				status:      'submitted',
				category:    'marketing',
				notes:       `Created from goal task. Goal: ${goal?.name ?? params.id}`,
				sourceType:  'goal_task',
				sourceId:    params.taskId
			};

			const existingExpense = current.expenseId
				? await ctx.pb.collection('expenses').getOne(current.expenseId).catch(() => null)
				: await ctx.pb.collection('expenses').getFirstListItem(
					`sourceType = \"goal_task\" && sourceId = \"${params.taskId}\"`
				).catch(() => null);

			const expense = existingExpense
				? await ctx.pb.collection('expenses').update(existingExpense.id, expensePayload)
				: await ctx.pb.collection('expenses').create(expensePayload);

			patch.expenseId = expense.id;

			const existingApproval = await ctx.pb.collection('approvals').getFirstListItem(
				`entityType = \"expense\" && entityId = \"${expense.id}\" && status = \"pending\"`
			).catch(() => null);

			if (existingApproval) {
				patch.approvalId = existingApproval.id;
				return;
			}

			const approval = await ctx.pb.collection('approvals').create({
				entityType:    'expense',
				entityId:      expense.id,
				status:        'pending',
				requestedBy:   ctx.userId,
				requestedDate: new Date().toISOString(),
				amount:        expense.amount ?? 0,
				comments:      `Goal task: ${current.title}${goal ? ` (${goal.name})` : ''}`
			}).catch(() => null);
			if (approval) patch.approvalId = approval.id;
		};

		// ── needs_approval: route through submitted expense approval ───────────
		if (newStatus === 'needs_approval' && current.status !== 'needs_approval') {
			await ensureSubmittedExpenseAndApproval();
		}

		// ── approved: resolve approval record ────────────────────────────────
		if (newStatus === 'approved' && current.status !== 'approved') {
			patch.approvedBy = ctx.userId;
			patch.approvedAt = new Date().toISOString();
			if (current.approvalId) {
				await ctx.pb.collection('approvals').update(current.approvalId, {
					status:       'approved',
					approver:     ctx.userId,
					reviewedDate: new Date().toISOString()
				}).catch(() => {});
			}
		}

		// ── expense_created: create/submit expense + approval ─────────────────
		if (newStatus === 'expense_created' && current.status !== 'expense_created') {
			await ensureSubmittedExpenseAndApproval();
		}

		// ── work_order: legacy stage, no direct work order creation ────────────
		if (newStatus === 'work_order' && current.status !== 'work_order') {
			await ensureSubmittedExpenseAndApproval();
		}

		const updated = await ctx.pb.collection('goal_tasks').update(params.taskId, patch);

		// ── Recalculate goal progress when completion status changes ──────────
		// Triggered when: status moves to/from 'completed', OR progressContribution changes.
		const completionChanged =
			newStatus === 'completed' ||
			(current.status === 'completed' && newStatus && newStatus !== 'completed');
		const contributionChanged = 'progressContribution' in patch;

		if (completionChanged || contributionChanged) {
			await recalculateGoalProgress(ctx.pb, params.id);
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
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
			.filter((t: any) => t.status === 'completed')
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
