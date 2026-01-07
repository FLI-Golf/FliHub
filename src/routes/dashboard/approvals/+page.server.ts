import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		throw redirect(303, '/login');
	}

	console.log('=== APPROVALS PAGE LOAD START ===');

	try {
		// Fetch all approvals with expanded relations
		const approvals = await pb.collection('approvals').getFullList({
			expand: 'requestedBy,approver',
			sort: '-requestedDate'
		});
		console.log('✓ Approvals loaded:', approvals.length);

		// Get current user profile
		const userProfiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model?.id}"`
		});
		const userProfile = userProfiles[0];

		// Calculate statistics
		const stats = {
			total: approvals.length,
			pending: approvals.filter(a => a.status === 'pending').length,
			approved: approvals.filter(a => a.status === 'approved').length,
			rejected: approvals.filter(a => a.status === 'rejected').length,
			revisionRequested: approvals.filter(a => a.status === 'revision_requested').length,
			byType: {
				expense: approvals.filter(a => a.entityType === 'expense').length,
				project: approvals.filter(a => a.entityType === 'project').length,
				budget: approvals.filter(a => a.entityType === 'budget').length
			},
			totalAmount: approvals.reduce((sum, a) => sum + (a.amount || 0), 0),
			pendingAmount: approvals
				.filter(a => a.status === 'pending')
				.reduce((sum, a) => sum + (a.amount || 0), 0)
		};

		console.log('=== APPROVALS PAGE LOAD SUCCESS ===');

		return {
			approvals,
			stats,
			userProfile
		};
	} catch (error: any) {
		console.error('Error loading approvals:', error);
		return {
			approvals: [],
			stats: {
				total: 0,
				pending: 0,
				approved: 0,
				rejected: 0,
				revisionRequested: 0,
				byType: { expense: 0, project: 0, budget: 0 },
				totalAmount: 0,
				pendingAmount: 0
			},
			userProfile: null
		};
	}
};
