import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { TournamentRepo } from '$lib/infra/pocketbase/repositories/TournamentRepo';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { tournaments: [], seasons: [] };

	const adminPb = await getAdminPocketBase();
	const repo    = new TournamentRepo(adminPb);

	const [tournResult, seasons] = await Promise.allSettled([
		repo.findAll({
			sort:    'startDate',
			expand:  'seasonRef',
			perPage: 200,
		}),
		adminPb.collection('seasons').getFullList({ sort: '-year' }).catch(() => []),
	]);

	return {
		tournaments: tournResult.status === 'fulfilled' ? tournResult.value.items : [],
		seasons:     seasons.status     === 'fulfilled' ? seasons.value           : [],
	};
};
