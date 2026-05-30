import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await RequestContext.from(locals, url);

	const workOrders = await adminFetch('work_orders', {
		filter: 'source=bid',
		sort:   '-created',
		expand: 'vendorId,project,bidId',
	});

	return { workOrders };
};
