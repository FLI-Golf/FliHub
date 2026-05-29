/**
 * GET  /api/content — list all content production items
 * POST /api/content — create a new content production item
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		const items = await ctx.pb.collection('content_production').getFullList({
			sort: '-created',
			expand: 'assignedTo,talent'
		});
		return json(items);
	} catch {
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));

	if (!body.title?.trim()) return json({ message: 'title is required' }, { status: 400 });
	if (!body.contentType) return json({ message: 'contentType is required' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('content_production').create({
			title:        body.title.trim(),
			contentType:  body.contentType,
			stage:        'brief',
			description:  body.description ?? '',
			talent:       body.talent ?? [],
			assignedTo:   body.assignedTo ?? null,
			dueDate:      body.dueDate ?? null,
			budget:       body.budget ? Number(body.budget) : null,
			requiresApproval: body.requiresApproval ?? false,
			notes:        body.notes ?? '',
			createdBy:    ctx.userId
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
