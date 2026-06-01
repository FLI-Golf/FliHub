/**
 * GET  /api/scoreboards — list all scoreboards
 * POST /api/scoreboards — create a new scoreboard
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		const records = await ctx.pb.collection('scoreboards').getFullList({ sort: '-created' });
		return json(records);
	} catch { return json([]); }
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	if (!body.name?.trim()) return json({ message: 'name is required' }, { status: 400 });
	if (!body.displayType)  return json({ message: 'displayType is required' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('scoreboards').create({
			name:        body.name.trim(),
			displayType: body.displayType,
			stage:       'concept',
			location:    body.location ?? '',
			widthFt:     body.widthFt  ? Number(body.widthFt)  : null,
			heightFt:    body.heightFt ? Number(body.heightFt) : null,
			description: body.description ?? '',
			notes:       body.notes ?? '',
			createdBy:   ctx.userId
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
