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

		// Get budget change details from request
		const { entityId, amount, comments, description } = await request.json();

		if (!entityId || !amount) {
			return json({ error: 'entityId and amount are required' }, { status: 400 });
		}

		// Check if approval already exists
		const existingApprovals = await pb.collection('approvals').getFullList({
			filter: `entityType = "budget" && entityId = "${entityId}" && status = "pending"`
		});

		if (existingApprovals.length > 0) {
			return json({ 
				error: 'Approval already exists for this budget change',
				approvalId: existingApprovals[0].id
			}, { status: 400 });
		}

		// Create approval record
		const approvalData = {
			entityType: 'budget',
			entityId: entityId,
			status: 'pending',
			requestedBy: userProfile.id,
			requestedDate: new Date().toISOString(),
			amount: amount,
			comments: comments || `<p>Budget change approval requested: ${description || 'Budget modification'}</p>`
		};

		const approval = await pb.collection('approvals').create(approvalData);

		console.log(`✅ Created budget approval ${approval.id} for entity ${entityId}`);

		return json({ 
			success: true, 
			message: 'Budget approval request created successfully',
			approval
		});
	} catch (error: any) {
		console.error('Error creating budget approval:', error);
		return json({ 
			error: 'Failed to create budget approval', 
			details: error.message 
		}, { status: 500 });
	}
};
