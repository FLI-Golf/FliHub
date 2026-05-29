/**
 * PATCH  /api/marketing-goals/[id]/tasks/[taskId] — update task (status, fields)
 * DELETE /api/marketing-goals/[id]/tasks/[taskId] — delete task
 *
 * Stage transitions handled here:
 *   → needs_approval  : creates an approval record
 *   → approved        : marks approval resolved, sets approvedBy/approvedAt
 *   → expense_created : creates an expense record linked to the goal
 *   → work_order      : creates a work order linked to the expense
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS = [
	'title', 'description', 'status', 'priority', 'dueDate',
	'estimatedCost', 'actualCost', 'assignedTo', 'notes'
];

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
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

		// ── needs_approval: auto-create approval record ───────────────────────
		if (newStatus === 'needs_approval' && current.status !== 'needs_approval') {
			const goal = await ctx.pb.collection('marketing_goals').getOne(params.id).catch(() => null);
			const approval = await ctx.pb.collection('approvals').create({
				entityType:    'goal_task',
				entityId:      params.taskId,
				status:        'pending',
				requestedBy:   ctx.userId,
				requestedDate: new Date().toISOString(),
				amount:        current.estimatedCost ?? patch.estimatedCost ?? 0,
				comments:      `Goal task: ${current.title}${goal ? ` (${goal.name})` : ''}`
			}).catch(() => null);
			if (approval) patch.approvalId = approval.id;
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

		// ── expense_created: create an expense record ─────────────────────────
		if (newStatus === 'expense_created' && current.status !== 'expense_created') {
			const goal = await ctx.pb.collection('marketing_goals').getOne(params.id).catch(() => null);
			const expense = await ctx.pb.collection('expenses').create({
				title:       current.title,
				description: current.description ?? '',
				amount:      current.actualCost ?? current.estimatedCost ?? 0,
				status:      'draft',
				category:    'marketing',
				notes:       `Created from goal task. Goal: ${goal?.name ?? params.id}`,
				sourceType:  'goal_task',
				sourceId:    params.taskId
			}).catch(() => null);
			if (expense) patch.expenseId = expense.id;
		}

		// ── work_order: create a work order linked to the expense ─────────────
		if (newStatus === 'work_order' && current.status !== 'work_order') {
			const expenseId = current.expenseId ?? patch.expenseId;
			const goal = await ctx.pb.collection('marketing_goals').getOne(params.id).catch(() => null);
			const wo = await ctx.pb.collection('work_orders').create({
				title:       current.title,
				description: current.description ?? '',
				status:      'pending',
				priority:    current.priority ?? 'medium',
				dueDate:     current.dueDate ?? null,
				estimatedCost: current.estimatedCost ?? 0,
				sourceType:  'goal_task',
				sourceId:    params.taskId,
				expenseId:   expenseId ?? null,
				notes:       `Created from goal task. Goal: ${goal?.name ?? params.id}`
			}).catch(() => null);
			if (wo) patch.workOrderId = wo.id;
		}

		const updated = await ctx.pb.collection('goal_tasks').update(params.taskId, patch);
		return json(updated);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		await ctx.pb.collection('goal_tasks').delete(params.taskId);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
