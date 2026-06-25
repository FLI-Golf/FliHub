import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { franchises: [], territories: [] };

	const adminPb = await getAdminPocketBase();

	const [franchises, territories] = await Promise.allSettled([
		adminPb.collection('franchises').getFullList({ sort: 'name' }),
		adminPb.collection('franchise_territories').getFullList({ sort: 'name', expand: 'dealId' }),
	]);

	return {
		franchises:  franchises.status  === 'fulfilled' ? franchises.value  : [],
		territories: territories.status === 'fulfilled' ? territories.value : [],
	};
};
