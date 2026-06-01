/**
 * GET  /api/marketing-goals/[id]/tasks — list tasks for a goal
 * POST /api/marketing-goals/[id]/tasks — create a task on a goal
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		const tasks = await ctx.pb.collection('goal_tasks').getFullList({
			filter: `goalId = "${params.id}"`,
			sort: 'priority'
		});
		return json(tasks);
	} catch {
		return json([]);
	}
};

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	if (!body.title?.trim()) return json({ message: 'title is required' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('goal_tasks').create({
			goalId:               params.id,
			title:                body.title.trim(),
			description:          body.description ?? '',
			status:               'todo',
			priority:             body.priority ?? 'medium',
			dueDate:              body.dueDate ?? null,
			estimatedCost:        body.estimatedCost ? Number(body.estimatedCost) : null,
			progressContribution: body.progressContribution ? Number(body.progressContribution) : null,
			notes:                body.notes ?? '',
			assignedTo:           body.assignedTo ?? '',
			createdBy:            ctx.userId
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
