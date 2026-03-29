import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	

	// Get user profile to check role

	try {
		const userProfile = await pb.collection('user_profiles').getFirstListItem(`userId="${userId}"`);
		const role = userProfile.role || 'leader';

		// Only admin can access franchise sales dashboard

		console.log('Fetching franchise sales data...');

		// Fetch all franchise-related data
		const [leads, opportunities, deals, territories, sponsors] = await Promise.all([
			pb.collection('franchise_leads').getFullList({
				sort: '-created',
				expand: 'territory'
			}).catch(() => []),
			pb.collection('franchise_opportunities').getFullList({
				sort: '-created',
				expand: 'leadId,territory'
			}).catch(() => []),
			pb.collection('franchise_deals').getFullList({
				sort: '-created',
				expand: 'opportunityId,territory'
			}).catch(() => []),
			pb.collection('franchise_territories').getFullList({
				sort: 'name'
			}).catch(() => []),
			pb.collection('sponsors').getFullList({
				filter: 'status = "converted_to_franchise"'
			}).catch(() => [])
		]);

		console.log(`✓ Fetched: ${leads.length} leads, ${opportunities.length} opportunities, ${deals.length} deals, ${territories.length} territories`);

		// Calculate pipeline metrics
		const pipelineMetrics = {
			leads: {
				total: leads.length,
				new: leads.filter(l => l.status === 'new').length,
				contacted: leads.filter(l => l.status === 'contacted').length,
				qualified: leads.filter(l => l.status === 'qualified').length,
				disqualified: leads.filter(l => l.status === 'disqualified').length
			},
			opportunities: {
				total: opportunities.length,
				proposalSent: opportunities.filter(o => o.status === 'proposal_sent').length,
				negotiation: opportunities.filter(o => o.status === 'negotiation').length,
				closedWon: opportunities.filter(o => o.status === 'closed_won').length,
				closedLost: opportunities.filter(o => o.status === 'closed_lost').length,
				totalValue: opportunities.reduce((sum, o) => sum + (o.dealValue || o.estimatedValue || 0), 0)
			},
			deals: {
				total: deals.length,
				pendingSignature: deals.filter(d => d.status === 'pending_signature').length,
				signed: deals.filter(d => d.status === 'signed').length,
				paymentPending: deals.filter(d => d.status === 'payment_pending').length,
				paymentInProgress: deals.filter(d => d.status === 'payment_in_progress').length,
				paymentReceived: deals.filter(d => d.status === 'payment_received' || d.status === 'payment_completed').length,
				onboarding: deals.filter(d => d.status === 'onboarding').length,
				active: deals.filter(d => d.status === 'active').length,
				cancelled: deals.filter(d => d.status === 'cancelled').length,
				defaulted: deals.filter(d => d.status === 'defaulted').length,
				totalValue: deals.reduce((sum, d) => sum + (d.netFranchiseValue || d.dealValue || 0), 0),
				totalReceived: deals.reduce((sum, d) => sum + (d.totalPaidToDate || d.paymentReceived || 0), 0)
			},
			territories: {
				total: territories.length,
				available: territories.filter(t => t.status === 'available').length,
				reserved: territories.filter(t => t.status === 'reserved').length,
				sold: territories.filter(t => t.status === 'sold').length
			},
			conversion: {
				leadToOpportunity: leads.length > 0 ? (opportunities.length / leads.length) * 100 : 0,
				opportunityToDeal: opportunities.length > 0 ? (deals.length / opportunities.length) * 100 : 0,
				leadToDeal: leads.length > 0 ? (deals.length / leads.length) * 100 : 0
			}
		};

		// Calculate revenue metrics using new financial fields
		const revenueMetrics = {
			committed: deals.reduce((sum, d) => sum + (d.netFranchiseValue || d.dealValue || 0), 0),
			received: deals.reduce((sum, d) => sum + (d.totalPaidToDate || d.paymentReceived || 0), 0),
			outstanding: deals.reduce((sum, d) => sum + (d.outstandingBalance || ((d.netFranchiseValue || d.dealValue || 0) - (d.totalPaidToDate || d.paymentReceived || 0))), 0),
			averageDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + (d.netFranchiseValue || d.dealValue || 0), 0) / deals.length : 0,
			collectionRate: deals.reduce((sum, d) => sum + (d.netFranchiseValue || d.dealValue || 0), 0) > 0 
				? (deals.reduce((sum, d) => sum + (d.totalPaidToDate || d.paymentReceived || 0), 0) / deals.reduce((sum, d) => sum + (d.netFranchiseValue || d.dealValue || 0), 0)) * 100 
				: 0,
			totalDiscounts: deals.reduce((sum, d) => sum + (d.sponsorshipDiscount || 0), 0),
			sponsorConversions: deals.filter(d => d.sponsorBridgeId).length
		};

		// Group deals by month for trend analysis
		const dealsByMonth = deals.reduce((acc, deal) => {
			if (deal.contractSignedDate) {
				const date = new Date(deal.contractSignedDate);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				if (!acc[monthKey]) {
					acc[monthKey] = { count: 0, value: 0, paid: 0 };
				}
				acc[monthKey].count++;
				acc[monthKey].value += deal.netFranchiseValue || deal.dealValue || 0;
				acc[monthKey].paid += deal.totalPaidToDate || deal.paymentReceived || 0;
			}
			return acc;
		}, {} as Record<string, { count: number; value: number; paid: number }>);

		return {
			userProfile,
			role,
			leads,
			opportunities,
			deals,
			territories,
			sponsors,
			pipelineMetrics,
			revenueMetrics,
			dealsByMonth
		};
	} catch (error: any) {
		console.error('Error loading franchise sales dashboard:', error);
		}
};
