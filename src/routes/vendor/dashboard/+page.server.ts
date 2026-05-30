import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile, vendor } = await parent();

	if (!vendor) return { bids: [], openProjects: [], stats: null };

	const [bids, openProjects] = await Promise.all([
		adminFetch('bids', {
			filter: `vendorId="${vendor.id}"`,
			sort:   '-created',
			expand: 'projectId',
		}),
		adminFetch('projects', {
			filter: 'biddingOpen=true',
			sort:   '-created',
			fields: 'id,name,type,description,project_budget,startDate,endDate,status',
		}),
	]);

	const stats = {
		totalBids:    bids.length,
		submitted:    (bids as any[]).filter(b => b.status === 'submitted').length,
		underReview:  (bids as any[]).filter(b => b.status === 'under_review').length,
		shortlisted:  (bids as any[]).filter(b => b.status === 'shortlisted').length,
		awarded:      (bids as any[]).filter(b => b.status === 'awarded').length,
		openProjects: openProjects.length,
	};

	return { bids, openProjects, stats };
};
