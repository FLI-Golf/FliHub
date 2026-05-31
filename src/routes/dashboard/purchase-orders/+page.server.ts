import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await RequestContext.from(locals, url);

	const purchaseOrders = await adminFetch('sponsor_purchase_orders', {
		sort:   '-created',
		expand: 'sponsorId,createdBy,assignedTo',
	}).catch(() => []);

	return { purchaseOrders };
};
