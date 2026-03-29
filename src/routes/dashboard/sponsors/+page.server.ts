import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;
	try {
	
	
		const [sponsors, bridges] = await Promise.all([
			pb.collection('sponsors').getFullList({ sort: '-created', expand: 'assignedTo,franchiseDealId' }).catch(() => []),
			pb.collection('sponsor_franchise_bridge').getFullList({ sort: '-created', expand: 'sponsorId,franchiseLeadId,franchiseOpportunityId,franchiseDealId,assignedSalesRep' }).catch(() => [])
		]);
	
		const metrics = {
			activeSponsors:    (sponsors as any[]).filter(s => s.status === 'active').length,
			prospectSponsors:  (sponsors as any[]).filter(s => s.status === 'prospect' || s.status === 'negotiating').length,
			convertedSponsors: (sponsors as any[]).filter(s => s.status === 'converted_to_franchise').length,
			totalRevenue:      (sponsors as any[]).filter(s => s.status === 'active' || s.status === 'renewed').reduce((sum, s) => sum + (s.totalPaid || 0), 0),
			franchiseInterested: (sponsors as any[]).filter(s => s.franchiseInterest).length,
			activeBridges:     (bridges as any[]).filter(b => b.status !== 'declined' && b.status !== 'converted').length,
			sponsorsByTier: {
				tier_1: (sponsors as any[]).filter(s => s.tier === 'tier_1').length,
				tier_2: (sponsors as any[]).filter(s => s.tier === 'tier_2').length,
				tier_3: (sponsors as any[]).filter(s => s.tier === 'tier_3').length,
				tier_4: (sponsors as any[]).filter(s => s.tier === 'tier_4').length
			}
		};
	
		return { userProfile, sponsors, bridges, metrics };
	} catch (err: any) {
		console.error('sponsors load error:', err?.message ?? err);
		return {};
	}
};
