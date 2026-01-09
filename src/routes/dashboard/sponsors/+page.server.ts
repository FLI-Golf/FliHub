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

	// Admin and sales roles can access
	if (userProfile?.role !== 'admin' && userProfile?.role !== 'sales') {
		throw redirect(303, '/dashboard');
	}

	try {
		// Fetch sponsors
		const sponsors = await locals.pb.collection('sponsors').getFullList({
			sort: '-created',
			expand: 'assignedTo,franchiseDealId'
		});

		// Fetch sponsor-franchise bridges
		const bridges = await locals.pb.collection('sponsor_franchise_bridge').getFullList({
			sort: '-created',
			expand: 'sponsorId,franchiseLeadId,franchiseOpportunityId,franchiseDealId,assignedSalesRep'
		});

		// Calculate metrics
		const activeSponsors = sponsors.filter((s: any) => s.status === 'active').length;
		const prospectSponsors = sponsors.filter((s: any) => s.status === 'prospect' || s.status === 'negotiating').length;
		const convertedSponsors = sponsors.filter((s: any) => s.status === 'converted_to_franchise').length;
		const totalRevenue = sponsors
			.filter((s: any) => s.status === 'active' || s.status === 'renewed')
			.reduce((sum: any, s: any) => sum + (s.totalPaid || 0), 0);
		
		const franchiseInterested = sponsors.filter((s: any) => s.franchiseInterest).length;
		const activeBridges = bridges.filter((b: any) => 
			b.status !== 'declined' && b.status !== 'converted'
		).length;

		// Group sponsors by tier
		const sponsorsByTier = {
			tier_1: sponsors.filter((s: any) => s.tier === 'tier_1').length,
			tier_2: sponsors.filter((s: any) => s.tier === 'tier_2').length,
			tier_3: sponsors.filter((s: any) => s.tier === 'tier_3').length,
			tier_4: sponsors.filter((s: any) => s.tier === 'tier_4').length
		};

		return {
			userProfile,
			sponsors,
			bridges,
			metrics: {
				activeSponsors,
				prospectSponsors,
				convertedSponsors,
				totalRevenue,
				franchiseInterested,
				activeBridges,
				sponsorsByTier
			}
		};
	} catch (error) {
		console.error('Error loading sponsor data:', error);
		return {
			userProfile,
			sponsors: [],
			bridges: [],
			metrics: {
				activeSponsors: 0,
				prospectSponsors: 0,
				convertedSponsors: 0,
				totalRevenue: 0,
				franchiseInterested: 0,
				activeBridges: 0,
				sponsorsByTier: {
					tier_1: 0,
					tier_2: 0,
					tier_3: 0,
					tier_4: 0
				}
			}
		};
	}
};
