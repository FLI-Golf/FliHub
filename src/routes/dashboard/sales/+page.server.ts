import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.pb.authStore.isValid) {
		throw redirect(303, '/auth/login');
	}

	// Get user profile
	const userId = locals.pb.authStore.model?.id;
	const profiles = await locals.pb.collection('user_profiles').getFullList({
		filter: `userId = "${userId}"`
	});
	const userProfile = profiles[0];

	// Only sales and admin roles can access
	if (userProfile?.role !== 'sales' && userProfile?.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	try {
		// Fetch franchise leads
		const leads = await locals.pb.collection('franchise_leads').getFullList({
			sort: '-created',
			expand: 'assignedTo'
		});

		// Fetch franchise opportunities
		const opportunities = await locals.pb.collection('franchise_opportunities').getFullList({
			sort: '-created',
			expand: 'leadId,assignedTo,projectId'
		});

		// Fetch franchise deals
		const deals = await locals.pb.collection('franchise_deals').getFullList({
			sort: '-created',
			expand: 'opportunityId,closedBy,franchiseOwnerProfileId'
		});

		// Fetch franchise territories
		const territories = await locals.pb.collection('franchise_territories').getFullList({
			sort: 'name',
			expand: 'dealId'
		});

		// Calculate metrics using new financial fields
		const totalLeads = leads.length;
		const qualifiedLeads = leads.filter((l: any) => l.status === 'qualified').length;
		const totalOpportunities = opportunities.length;
		const totalDeals = deals.filter((d: any) => d.status === 'signed' || d.status === 'active').length;
		const totalRevenue = deals
			.filter((d: any) => d.status === 'payment_received' || d.status === 'payment_completed' || d.status === 'active')
			.reduce((sum: number, d: any) => sum + (d.totalPaidToDate || d.paymentReceived || 0), 0);
		const pipelineValue = opportunities
			.filter((o: any) => o.stage !== 'closed_lost' && o.stage !== 'closed_won')
			.reduce((sum: number, o: any) => sum + (o.dealValue || 0), 0);
		const outstandingBalance = deals
			.reduce((sum: number, d: any) => sum + (d.outstandingBalance || ((d.netFranchiseValue || d.dealValue || 0) - (d.totalPaidToDate || d.paymentReceived || 0))), 0);

		return {
			userProfile,
			leads,
			opportunities,
			deals,
			territories,
			metrics: {
				totalLeads,
				qualifiedLeads,
				totalOpportunities,
				totalDeals,
				totalRevenue,
				pipelineValue,
				outstandingBalance
			}
		};
	} catch (error) {
		console.error('Error loading sales data:', error);
		return {
			userProfile,
			leads: [],
			opportunities: [],
			deals: [],
			territories: [],
			metrics: {
				totalLeads: 0,
				qualifiedLeads: 0,
				totalOpportunities: 0,
				totalDeals: 0,
				totalRevenue: 0,
				pipelineValue: 0,
				outstandingBalance: 0
			}
		};
	}
};
