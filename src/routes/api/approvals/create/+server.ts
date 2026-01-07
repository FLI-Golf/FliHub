import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const pb = locals.pb;
	
	// Check if user is authenticated
	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Fetch user profile
	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
		});
		const userProfile = profiles[0];

		if (!userProfile) {
			return json({ error: 'User profile not found' }, { status: 403 });
		}

		// Get request data
		const { entityType, entityId, amount, comments } = await request.json();

		if (!entityType || !entityId) {
			return json({ error: 'entityType and entityId are required' }, { status: 400 });
		}

		// Validate entity type
		if (!['expense', 'project', 'budget'].includes(entityType)) {
			return json({ error: 'Invalid entityType. Must be expense, project, or budget' }, { status: 400 });
		}

		// Check if approval already exists for this entity
		const existingApprovals = await pb.collection('approvals').getFullList({
			filter: `entityType = "${entityType}" && entityId = "${entityId}" && status = "pending"`
		});

		if (existingApprovals.length > 0) {
			return json({ 
				error: 'Approval already exists for this entity',
				approvalId: existingApprovals[0].id
			}, { status: 400 });
		}

		// Create approval record
		const approvalData: any = {
			entityType,
			entityId,
			status: 'pending',
			requestedBy: userProfile.id,
			requestedDate: new Date().toISOString(),
			amount: amount || 0
		};

		if (comments) {
			approvalData.comments = comments;
		}

		const approval = await pb.collection('approvals').create(approvalData);

		console.log(`✅ Created ${entityType} approval for entity ${entityId} by ${userProfile.firstName} ${userProfile.lastName}`);

		return json({ 
			success: true, 
			message: 'Approval request created successfully',
			approval
		});
	} catch (error: any) {
		console.error('Error creating approval:', error);
		return json({ 
			error: 'Failed to create approval', 
			details: error.message 
		}, { status: 500 });
	}
};
