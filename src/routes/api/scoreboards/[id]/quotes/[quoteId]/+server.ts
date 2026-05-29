/**
 * PATCH  /api/scoreboards/[id]/quotes/[quoteId] — select/update a quote
 * DELETE /api/scoreboards/[id]/quotes/[quoteId] — remove a quote
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));

	try {
		// Selecting this quote deselects all others
		if (body.selected) {
			const others = await ctx.pb.collection('scoreboard_vendor_quotes').getFullList({
				filter: `scoreboardId = "${params.id}" && selected = true && id != "${params.quoteId}"`
			}).catch(() => []);
			for (const q of others) {
				await ctx.pb.collection('scoreboard_vendor_quotes').update(q.id, { selected: false }).catch(() => {});
			}
		}

		const updated = await ctx.pb.collection('scoreboard_vendor_quotes').update(params.quoteId, body);

		// Sync scoreboard vendorName + quotedCost when a quote is selected
		if (body.selected) {
			await ctx.pb.collection('scoreboards').update(params.id, {
				vendorName: updated.vendorName,
				quotedCost: updated.amount
			}).catch(() => {});
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		await ctx.pb.collection('scoreboard_vendor_quotes').delete(params.quoteId);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
