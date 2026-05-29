/**
 * GET  /api/sponsors/[id]/activity — list activity log entries for a sponsor
 * POST /api/sponsors/[id]/activity — add a new activity log entry
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	try {
		const entries = await ctx.pb.collection('sponsor_activity').getFullList({
			filter: `sponsorId = "${params.id}"`,
			sort: '-created'
		});
		return json(entries);
	} catch (err: any) {
		// Collection may not exist yet — return empty list gracefully
		return json([]);
	}
};

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));

	const { type, note } = body;
	if (!type) return json({ message: 'type is required' }, { status: 400 });
	if (!note?.trim()) return json({ message: 'note is required' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('sponsor_activity').create({
			sponsorId: params.id,
			type,
			note: note.trim(),
			createdBy: ctx.userId
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to log activity';
		return json({ message: msg }, { status: 500 });
	}
};
