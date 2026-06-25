import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { payments: [] };

	const adminPb  = await getAdminPocketBase();
	const profileId = (ctx.profile as any)?.id ?? null;

	const payments = await adminPb.collection('pro_payments').getFullList({
		filter: profileId ? `recipient = "${profileId}"` : '',
		sort:   '-created',
		expand: 'recipient,workOrder',
	}).catch(() => []);

	return { payments };
};
