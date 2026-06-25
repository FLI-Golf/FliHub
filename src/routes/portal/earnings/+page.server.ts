import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { earnings: [], totals: { ytd: 0, pending: 0 } };

	const adminPb  = await getAdminPocketBase();
	const profileId = (ctx.profile as any)?.id ?? null;

	const earnings = await adminPb.collection('pro_payments').getFullList({
		filter: profileId ? `recipient = "${profileId}"` : '',
		sort:   '-paidAt,-created',
		expand: 'workOrder,recipient',
		perPage: 100,
	}).catch(() => []);

	const ytd = earnings
		.filter((e: any) => e.status === 'paid')
		.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);

	const pending = earnings
		.filter((e: any) => e.status !== 'paid')
		.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);

	return { earnings, totals: { ytd, pending } };
};
