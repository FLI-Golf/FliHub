import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { leads: [], opportunities: [], deals: [] };

	const adminPb = await getAdminPocketBase();

	const [leads, opps, deals] = await Promise.allSettled([
		adminPb.collection('franchise_leads').getFullList({ sort: '-created', expand: 'assignedTo' }),
		adminPb.collection('franchise_opportunities').getFullList({ sort: '-created', expand: 'leadId' }),
		adminPb.collection('franchise_deals').getFullList({ sort: '-created', expand: 'opportunityId' }),
	]);

	return {
		leads:         leads.status  === 'fulfilled' ? leads.value  : [],
		opportunities: opps.status   === 'fulfilled' ? opps.value   : [],
		deals:         deals.status  === 'fulfilled' ? deals.value  : [],
	};
};
