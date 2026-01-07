import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
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

		if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'leader')) {
			return json({ error: 'Unauthorized - Admin or Leader access required' }, { status: 403 });
		}

		// Get approval ID from request
		const { approvalId } = await request.json();

		if (!approvalId) {
			return json({ error: 'Approval ID is required' }, { status: 400 });
		}

		// Get the approval record first
		const approval = await pb.collection('approvals').getOne(approvalId);

		// Update approval record
		const updatedApproval = await pb.collection('approvals').update(approvalId, {
			status: 'rejected',
			approver: userProfile.id,
			reviewedDate: new Date().toISOString(),
			comments: '<p>Rejected.</p>'
		});

		console.log(`✅ Approval ${approvalId} rejected by ${userProfile.firstName} ${userProfile.lastName}`);

		// Update the linked entity based on type
		try {
			if (approval.entityType === 'expense') {
				// Update expense status to rejected (or back to draft)
				await pb.collection('expenses').update(approval.entityId, {
					status: 'rejected'
				});
				console.log(`✅ Updated expense ${approval.entityId} to rejected`);
			} else if (approval.entityType === 'project') {
				// Update project status back to draft or cancelled
				await pb.collection('projects').update(approval.entityId, {
					status: 'cancelled'
				});
				console.log(`✅ Updated project ${approval.entityId} to cancelled`);
			}
			// Budget approvals don't have a direct entity to update
		} catch (entityError: any) {
			console.warn(`⚠️  Could not update ${approval.entityType} ${approval.entityId}: ${entityError.message}`);
			// Continue anyway - approval record is updated
		}

		return json({ 
			success: true, 
			message: 'Approval rejected successfully',
			approval: updatedApproval
		});
	} catch (error: any) {
		console.error('Error rejecting approval:', error);
		return json({ 
			error: 'Failed to reject approval', 
			details: error.message 
		}, { status: 500 });
	}
};
