import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [sponsors, franchiseLeads, franchiseDeals] = await Promise.all([
			pb.collection('sponsors').getFullList({ sort: '-annualCommitment', expand: 'assignedTo' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,firstName,lastName,status,territory,netWorth,liquidCapital,created', sort: '-created' }).catch(() => []),
			pb.collection('franchise_deals').getFullList({ fields: 'id,status,franchiseFee,depositPaid,totalPaid,created', sort: '-created' }).catch(() => []),
		]);

		const s = sponsors as any[];

		// LOI sponsors — active or negotiating with an annualCommitment
		const loiSponsors    = s.filter(sp => ['active', 'negotiating', 'signed'].includes(sp.status) && (sp.annualCommitment ?? 0) > 0);
		const prospectSponsors = s.filter(sp => sp.status === 'prospect');
		const franchiseInterest = s.filter(sp => sp.franchiseInterest);

		// Revenue totals
		const totalCommitted  = loiSponsors.reduce((sum, sp) => sum + (sp.annualCommitment ?? 0), 0);
		const totalPaid       = s.reduce((sum, sp) => sum + (sp.totalPaid ?? 0), 0);
		const negotiatingValue = s.filter(sp => sp.status === 'negotiating').reduce((sum, sp) => sum + (sp.annualCommitment ?? 0), 0);

		// Tier breakdown
		const byTier: Record<string, { count: number; committed: number; paid: number }> = {};
		for (const sp of s) {
			const t = sp.tier ?? 'unknown';
			byTier[t] ??= { count: 0, committed: 0, paid: 0 };
			byTier[t].count++;
			byTier[t].committed += sp.annualCommitment ?? 0;
			byTier[t].paid      += sp.totalPaid ?? 0;
		}

		// Franchise pipeline value
		const franchisePipelineValue = (franchiseLeads as any[])
			.filter(l => !['lost', 'unqualified'].includes(l.status))
			.reduce((sum, l) => sum + (l.liquidCapital ?? 0), 0);

		const dealValue = (franchiseDeals as any[])
			.reduce((sum, d) => sum + (d.franchiseFee ?? 0), 0);

		return {
			userProfile,
			sponsors: s,
			loiSponsors,
			prospectSponsors,
			franchiseInterest,
			metrics: {
				totalSponsors: s.length,
				loiCount: loiSponsors.length,
				totalCommitted,
				totalPaid,
				negotiatingValue,
				prospectCount: prospectSponsors.length,
			},
			byTier,
			franchiseLeads,
			franchiseDeals,
			franchisePipelineValue,
			dealValue,
		};
	} catch (err: any) {
		console.error('active-income load error:', err?.message ?? err);
		return {
			sponsors: [], loiSponsors: [], prospectSponsors: [], franchiseInterest: [],
			metrics: null, byTier: {}, franchiseLeads: [], franchiseDeals: [],
			franchisePipelineValue: 0, dealValue: 0,
		};
	}
};
