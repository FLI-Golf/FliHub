/**
 * POST /api/scoreboards/[id]/checklist
 * Toggle a checklist item for a scoreboard phase.
 * Body: { itemId: string, phase: string, checked: boolean }
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({}));
	const { itemId, phase, checked } = body;

	if (!itemId) return json({ message: 'itemId is required' }, { status: 400 });

	try {
		const existing = await ctx.pb.collection('scoreboard_checklist').getFullList({
			filter: `scoreboardId = "${params.id}" && itemId = "${itemId}"`
		}).catch(() => []);

		if (checked) {
			if (existing.length === 0) {
				const record = await ctx.pb.collection('scoreboard_checklist').create({
					scoreboardId: params.id,
					itemId,
					phase:        phase ?? '',
					checkedBy:    ctx.userId,
					checkedAt:    new Date().toISOString()
				});
				return json({ ok: true, record });
			}
			return json({ ok: true, record: existing[0] });
		} else {
			for (const r of existing) {
				await ctx.pb.collection('scoreboard_checklist').delete(r.id);
			}
			return json({ ok: true });
		}
	} catch (err: any) {
		return json({ message: err?.message ?? 'Server error' }, { status: 500 });
	}
};
