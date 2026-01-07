import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const pb = locals.pb;
	
	// Check if user is authenticated
	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Fetch user profile to check role
	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
		});
		const userProfile = profiles[0];

		if (!userProfile || userProfile.role !== 'admin') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
		}
	} catch (err) {
		return json({ error: 'Failed to verify user permissions' }, { status: 403 });
	}

	try {
		console.log('Removing test approval data...');
		
		// Get all approvals
		const approvals = await pb.collection('approvals').getFullList();

		let approvalsDeleted = 0;

		// Delete all approvals
		for (const approval of approvals) {
			try {
				await pb.collection('approvals').delete(approval.id);
				approvalsDeleted++;
			} catch (err: any) {
				console.warn(`Could not delete approval ${approval.id}: ${err.message}`);
			}
		}

		console.log(`✅ Deleted ${approvalsDeleted} approval requests`);

		return json({ 
			success: true, 
			message: `Removed ${approvalsDeleted} approval requests`,
			deleted: {
				approvals: approvalsDeleted
			}
		});
	} catch (error: any) {
		console.error('Error removing approval data:', error);
		return json({ 
			error: 'Failed to remove approval data', 
			details: error.message 
		}, { status: 500 });
	}
};
