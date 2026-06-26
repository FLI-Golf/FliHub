import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { vendor } = await parent();

	if (!vendor) return { bids: [] };

	const bids = await adminFetch('bids', {
		filter: `vendorId="${vendor.id}"`,
		sort: '-created',
		expand: 'projectId,taskId',
		fields: 'id,projectId,taskId,amount,materialsAmount,laborAmount,logisticsAmount,otherAmount,referenceNumber,timeline,scope,status,created,submittedAt,notes',
	});

	return { bids };
};
