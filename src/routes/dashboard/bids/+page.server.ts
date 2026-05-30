import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const [bids, projects, vendors] = await Promise.all([
		adminFetch('bids',     { sort: '-created', expand: 'projectId,vendorId' }),
		adminFetch('projects', { filter: 'biddingOpen=true', fields: 'id,name,type,project_budget', sort: 'name' }),
		adminFetch('vendors',  { fields: 'id,name,category', sort: 'name' }),
	]);

	const stageCounts: Record<string, number> = {};
	for (const b of bids as any[]) {
		stageCounts[b.status] = (stageCounts[b.status] ?? 0) + 1;
	}

	return { bids, projects, vendors, stageCounts };
};
