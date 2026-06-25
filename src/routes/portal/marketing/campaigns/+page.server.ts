import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('marketing', 'marketing_lead', 'admin', 'leader');

	const adminPb = await getAdminPocketBase();

	const campaigns = await adminPb.collection('campaigns').getFullList({
		sort: '-created',
		perPage: 100,
	}).catch(() => []);

	return { campaigns };
};
