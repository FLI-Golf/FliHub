import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		throw redirect(303, '/auth/login');
	}

	// Get user profile to check role
	const userId = pb.authStore.model?.id;
	if (!userId) {
		throw redirect(303, '/auth/login');
	}

	try {
		const userProfile = await pb.collection('user_profiles').getFirstListItem(`userId="${userId}"`);
		const role = userProfile.role || 'leader';

		// Only admin can access franchise sales dashboard
		if (role !== 'admin') {
			throw redirect(303, '/dashboard');
		}

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
				totalValue: opportunities.reduce((sum, o) => sum + (o.estimatedValue || 0), 0)
			},
			deals: {
				total: deals.length,
				pendingSignature: deals.filter(d => d.status === 'pending_signature').length,
				signed: deals.filter(d => d.status === 'signed').length,
				paymentPending: deals.filter(d => d.status === 'payment_pending').length,
				paymentReceived: deals.filter(d => d.status === 'payment_received').length,
				onboarding: deals.filter(d => d.status === 'onboarding').length,
				active: deals.filter(d => d.status === 'active').length,
				cancelled: deals.filter(d => d.status === 'cancelled').length,
				totalValue: deals.reduce((sum, d) => sum + (d.dealValue || 0), 0),
				totalReceived: deals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0)
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

		// Calculate revenue metrics
		const revenueMetrics = {
			committed: deals.reduce((sum, d) => sum + (d.dealValue || 0), 0),
			received: deals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0),
			outstanding: deals.reduce((sum, d) => sum + ((d.dealValue || 0) - (d.paymentReceived || 0)), 0),
			averageDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + (d.dealValue || 0), 0) / deals.length : 0,
			collectionRate: deals.reduce((sum, d) => sum + (d.dealValue || 0), 0) > 0 
				? (deals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0) / deals.reduce((sum, d) => sum + (d.dealValue || 0), 0)) * 100 
				: 0
		};

		// Group deals by month for trend analysis
		const dealsByMonth = deals.reduce((acc, deal) => {
			if (deal.contractSignedDate) {
				const date = new Date(deal.contractSignedDate);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
				if (!acc[monthKey]) {
					acc[monthKey] = { count: 0, value: 0 };
				}
				acc[monthKey].count++;
				acc[monthKey].value += deal.dealValue || 0;
			}
			return acc;
		}, {} as Record<string, { count: number; value: number }>);

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
		throw redirect(303, '/dashboard');
	}
};
