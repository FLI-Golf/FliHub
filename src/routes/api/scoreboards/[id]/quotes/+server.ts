/**
 * GET  /api/scoreboards/[id]/quotes — list vendor quotes
 * POST /api/scoreboards/[id]/quotes — add a vendor quote
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		const quotes = await ctx.pb.collection('scoreboard_vendor_quotes').getFullList({
			filter: `scoreboardId = "${params.id}"`,
			sort:   'amount'
		});
		return json(quotes);
	} catch { return json([]); }
};

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));

	if (!body.vendorName?.trim()) return json({ message: 'vendorName is required' }, { status: 400 });
	if (!body.amount)             return json({ message: 'amount is required' }, { status: 400 });

	try {
		// If this quote is marked selected, deselect all others first
		if (body.selected) {
			const existing = await ctx.pb.collection('scoreboard_vendor_quotes').getFullList({
				filter: `scoreboardId = "${params.id}" && selected = true`
			}).catch(() => []);
			for (const q of existing) {
				await ctx.pb.collection('scoreboard_vendor_quotes').update(q.id, { selected: false }).catch(() => {});
			}
		}

		const record = await ctx.pb.collection('scoreboard_vendor_quotes').create({
			scoreboardId: params.id,
			vendorName:   body.vendorName.trim(),
			amount:       Number(body.amount),
			leadTimeDays: body.leadTimeDays ? Number(body.leadTimeDays) : null,
			notes:        body.notes ?? '',
			selected:     body.selected ?? false,
			submittedBy:  ctx.userId
		});

		// If selected, update scoreboard's vendorName + quotedCost
		if (body.selected) {
			await ctx.pb.collection('scoreboards').update(params.id, {
				vendorName: body.vendorName.trim(),
				quotedCost: Number(body.amount)
			}).catch(() => {});
		}

		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
