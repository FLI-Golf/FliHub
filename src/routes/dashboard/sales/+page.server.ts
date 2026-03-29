import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;
	try {
	
	
		const [leads, opportunities, deals, territories] = await Promise.all([
			pb.collection('franchise_leads').getFullList({ sort: '-created', expand: 'assignedTo' }).catch(() => []),
			pb.collection('franchise_opportunities').getFullList({ sort: '-created', expand: 'leadId,assignedTo,projectId' }).catch(() => []),
			pb.collection('franchise_deals').getFullList({ sort: '-created', expand: 'opportunityId,closedBy,franchiseOwnerProfileId' }).catch(() => []),
			pb.collection('franchise_territories').getFullList({ sort: 'name', expand: 'dealId' }).catch(() => [])
		]);
	
		const metrics = {
			totalLeads:         leads.length,
			qualifiedLeads:     (leads as any[]).filter(l => l.status === 'qualified').length,
			totalOpportunities: opportunities.length,
			totalDeals:         (deals as any[]).filter(d => d.status === 'signed' || d.status === 'active').length,
			totalRevenue:       (deals as any[]).filter(d => ['payment_received','payment_completed','active'].includes(d.status)).reduce((s, d) => s + (d.totalPaidToDate || d.paymentReceived || 0), 0),
			pipelineValue:      (opportunities as any[]).filter(o => !['closed_lost','closed_won'].includes(o.stage)).reduce((s, o) => s + (o.dealValue || 0), 0),
			outstandingBalance: (deals as any[]).reduce((s, d) => s + (d.outstandingBalance || ((d.netFranchiseValue || d.dealValue || 0) - (d.totalPaidToDate || d.paymentReceived || 0))), 0)
		};
	
		return { userProfile, leads, opportunities, deals, territories, metrics };
	} catch (err: any) {
		console.error('sales load error:', err?.message ?? err);
		return {};
	}
};
