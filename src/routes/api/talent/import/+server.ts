import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

interface TalentRow {
	name: string;
	nickname?: string;
	email?: string;
	phone?: string;
	gender?: string;
	country?: string;
	talentType?: string;
	status?: string;
	bio?: string;
	height?: string;
	weight?: string;
	homeTown?: string;
}

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const { rows }: { rows: TalentRow[] } = await request.json();

	if (!Array.isArray(rows) || rows.length === 0) {
		return json({ message: 'No rows provided' }, { status: 400 });
	}

	const results = { created: 0, failed: 0, errors: [] as string[] };

	for (const row of rows) {
		if (!row.name?.trim()) {
			results.failed++;
			results.errors.push(`Skipped row — missing name`);
			continue;
		}

		// talentType can be comma-separated in CSV e.g. "player,coach"
		const talentType = row.talentType
			? row.talentType.split(',').map(t => t.trim()).filter(Boolean)
			: ['player'];

		try {
			await ctx.pb.collection('talent').create({
				name:       row.name.trim(),
				nickname:   row.nickname   ?? '',
				email:      row.email      ?? '',
				phone:      row.phone      ?? '',
				gender:     row.gender     ?? '',
				country:    row.country    ?? '',
				talentType,
				status:     row.status     ?? 'active',
				bio:        row.bio        ?? '',
				height:     row.height     ?? '',
				weight:     row.weight     ?? '',
				homeTown:   row.homeTown   ?? ''
			});
			results.created++;
		} catch (err: any) {
			results.failed++;
			results.errors.push(`"${row.name}": ${err?.response?.message ?? err?.message ?? 'Unknown error'}`);
		}
	}

	return json(results, { status: 200 });
};
