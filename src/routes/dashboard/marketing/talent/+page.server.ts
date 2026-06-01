import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');

	const [talent, marketingProfiles] = await Promise.all([
		adminFetch('talent', {
			filter: "status = 'primary_pro' || status = 'reserve_pro' || status = 'active'",
			fields: 'id,name,nickname,status,talentType,gender,sponsoredBy,instagram,tiktok,twitter,youtube,worldRanking,country,avatar,photo',
			sort: 'name',
		}).catch(() => []),
		adminFetch('talent_marketing', {
			sort: '-followerCount',
		}).catch(() => []),
	]);

	// Index marketing profiles by talentId
	const profileMap = Object.fromEntries(
		(marketingProfiles as any[]).map((p: any) => [p.talentId, p])
	);

	const enriched = (talent as any[]).map((t: any) => ({
		...t,
		marketing: profileMap[t.id] ?? null,
	}));

	const ambassadors = enriched.filter((t: any) => t.marketing?.ambassadorStatus === 'active');
	const prospects   = enriched.filter((t: any) => t.marketing?.ambassadorStatus === 'prospect');
	const untracked   = enriched.filter((t: any) => !t.marketing);

	return { talent: enriched, ambassadors, prospects, untracked };
};
