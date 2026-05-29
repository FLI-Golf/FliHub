/**
 * POST /api/tournaments/[id]/checklist — toggle a checklist item
 * Body: { itemId: string, checked: boolean }
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));
	const { itemId, checked } = body;

	if (!itemId) return json({ message: 'itemId is required' }, { status: 400 });

	try {
		const existing = await ctx.pb.collection('tournament_ops_checklist').getFullList({
			filter: `tournamentId = "${params.id}" && itemId = "${itemId}"`
		}).catch(() => []);

		if (checked) {
			if (existing.length === 0) {
				const record = await ctx.pb.collection('tournament_ops_checklist').create({
					tournamentId: params.id,
					itemId,
					checkedBy: ctx.userId,
					checkedAt: new Date().toISOString()
				});
				return json({ ok: true, record });
			}
			return json({ ok: true, record: existing[0] });
		} else {
			// Uncheck — delete the record
			for (const r of existing) {
				await ctx.pb.collection('tournament_ops_checklist').delete(r.id);
			}
			return json({ ok: true });
		}
	} catch (err: any) {
		return json({ message: err.message ?? 'Server error' }, { status: 500 });
	}
};
