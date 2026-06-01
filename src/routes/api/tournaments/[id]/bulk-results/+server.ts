/**
 * POST /api/tournaments/[id]/bulk-results
 * Import multiple tournament results at once.
 *
 * Body: { results: Array<{ proId, placement, score?, rounds?, notes? }> }
 * Skips rows where a result for that pro already exists in this tournament.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	const rows: any[] = body.results ?? [];
	if (!rows.length) return json({ message: 'No results provided' }, { status: 400 });

	// Load existing results to avoid duplicates
	const existing = await ctx.pb.collection('tournament_results').getFullList({
		filter: `tournament = "${params.id}"`,
		fields: 'id,pro,placement'
	}).catch(() => []);

	const existingProIds = new Set(existing.map((r: any) => r.pro));
	const existingPlacements = new Set(existing.map((r: any) => r.placement));

	const created: any[] = [];
	const skipped: any[] = [];
	const errors: any[] = [];

	for (const row of rows) {
		if (!row.proId || !row.placement) {
			errors.push({ row, reason: 'Missing proId or placement' });
			continue;
		}
		if (existingProIds.has(row.proId)) {
			skipped.push({ proId: row.proId, reason: 'Pro already has a result in this tournament' });
			continue;
		}

		try {
			const record = await ctx.pb.collection('tournament_results').create({
				tournament: params.id,
				pro:        row.proId,
				placement:  Number(row.placement),
				score:      row.score ?? null,
				rounds:     row.rounds ? Number(row.rounds) : null,
				notes:      row.notes ?? ''
			});
			created.push(record);
			existingProIds.add(row.proId);
		} catch (err: any) {
			errors.push({ row, reason: err.message ?? 'Create failed' });
		}
	}

	return json({ ok: true, created: created.length, skipped: skipped.length, errors });
};
