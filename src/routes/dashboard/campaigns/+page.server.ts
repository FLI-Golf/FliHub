import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');
	const { pb, profile: userProfile } = ctx;

	try {
		const [campaigns, mediaAssets, marketingGoals] = await Promise.all([
			pb.collection('campaigns').getFullList({ sort: '-created', expand: 'goalId' }).catch(() => []),
			pb.collection('media_assets').getFullList({ fields: 'id,title,asset_type,campaign,file,collectionId' }).catch(() => []),
			pb.collection('marketing_goals').getFullList({ sort: 'priority,deadline' }).catch(() => []),
		]);

		// Group media assets by campaign
		const assetsByCampaign: Record<string, any[]> = {};
		for (const a of mediaAssets as any[]) {
			if (a.campaign) {
				assetsByCampaign[a.campaign] ??= [];
				assetsByCampaign[a.campaign].push(a);
			}
		}

		// Enrich campaigns
		const enriched = (campaigns as any[]).map(c => ({
			...c,
			assets: assetsByCampaign[c.id] ?? [],
			budgetPct: c.budget > 0 ? Math.min(100, (c.actualSpend / c.budget) * 100) : 0,
			linkedGoal: c.expand?.goalId ?? null,
		}));

		// Summary stats
		const totalBudget   = enriched.reduce((s, c) => s + (c.budget ?? 0), 0);
		const totalSpend    = enriched.reduce((s, c) => s + (c.actualSpend ?? 0), 0);
		const byStatus: Record<string, number> = {};
		const byType: Record<string, number> = {};
		for (const c of enriched) {
			if (c.status) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
			if (c.type)   byType[c.type]     = (byType[c.type]     ?? 0) + 1;
		}

		return {
			userProfile,
			campaigns: enriched,
			stats: { total: enriched.length, totalBudget, totalSpend, byStatus, byType },
			marketingGoals,
		};
	} catch (err: any) {
		console.error('campaigns load error:', err?.message ?? err);
		return { campaigns: [], stats: null, marketingGoals: [] };
	}
};
