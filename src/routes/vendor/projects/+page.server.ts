import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { vendor } = await parent();

	const [projects, myBids] = await Promise.all([
		adminFetch('projects', {
			filter: 'biddingOpen=true',
			sort:   '-created',
		}),

		vendor
			? adminFetch('bids', {
				filter: `vendorId="${vendor.id}"`,
				fields: 'id,projectId,status,amount',
			})
			: Promise.resolve([]),
	]);

	// Map projectId → my bid so the UI can show "Already bid" state
	const myBidByProject: Record<string, any> = {};
	for (const b of myBids as any[]) {
		myBidByProject[b.projectId] = b;
	}

	return { projects, myBidByProject };
};
