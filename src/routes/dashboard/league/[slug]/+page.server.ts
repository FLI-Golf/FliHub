import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [league, franchises, deals, opportunities, sponsors, expenses] = await Promise.all([
			pb.collection('league').getFirstListItem(`slug="${params.slug}"`, {
				expand: 'leagueOwner'
			}),
			pb.collection('franchises').getFullList(),
			pb.collection('franchise_deals').getFullList(),
			pb.collection('franchise_opportunities').getFullList(),
			pb.collection('sponsor_franchise_bridge').getFullList(),
			pb.collection('expenses').getFullList()
		]);

		// Trademark filings for the league entity + filings marked 'both'
		// (soft-fail if collection missing)
		let trademarkFilings: any[] = [];
		try {
			trademarkFilings = await pb.collection('trademark_filings').getFullList({
				filter: `franchiseId = "${league.id}" || entityType = "both"`,
				sort:   'trademarkClass,markType'
			});
		} catch { /* collection not yet created */ }

		return {
			league,
			franchises,
			deals,
			opportunities,
			sponsors,
			expenses,
			trademarkFilings
		};
	} catch (err) {
		throw error(404, 'League not found');
	}
};
