import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const pb = locals.pb;
	
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

		return {
			league,
			franchises,
			deals,
			opportunities,
			sponsors,
			expenses
		};
	} catch (err) {
		throw error(404, 'League not found');
	}
};
