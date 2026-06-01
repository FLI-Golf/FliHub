import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');

	const [ambassadors, marketingGoals] = await Promise.all([
		adminFetch('talent_marketing', {
			filter: "ambassadorStatus = 'active'",
			sort:   '-followerCount',
		}).catch(() => []),
		adminFetch('marketing_goals', {
			sort: 'goalName',
			fields: 'id,goalName,category,status',
		}).catch(() => []),
	]);

	// Fetch talent names for each ambassador profile
	const talentIds = (ambassadors as any[]).map((a: any) => a.talentId).filter(Boolean);
	const talent = talentIds.length
		? await adminFetch('talent', {
			filter: talentIds.map((id: string) => `id = "${id}"`).join(' || '),
			fields: 'id,name,gender,status,sponsoredBy',
		  }).catch(() => [])
		: [];

	const talentMap = Object.fromEntries((talent as any[]).map((t: any) => [t.id, t]));

	const enrichedAmbassadors = (ambassadors as any[]).map((a: any) => ({
		...a,
		talent: talentMap[a.talentId] ?? null,
	}));

	return { ambassadors: enrichedAmbassadors, marketingGoals };
};
