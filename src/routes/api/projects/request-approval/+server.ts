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

		// Get project ID from request
		const { projectId, comments } = await request.json();

		if (!projectId) {
			return json({ error: 'projectId is required' }, { status: 400 });
		}

		// Get project details
		const project = await pb.collection('projects').getOne(projectId);

		// Check if approval already exists
		const existingApprovals = await pb.collection('approvals').getFullList({
			filter: `entityType = "project" && entityId = "${projectId}" && status = "pending"`
		});

		if (existingApprovals.length > 0) {
			return json({ 
				error: 'Approval already exists for this project',
				approvalId: existingApprovals[0].id
			}, { status: 400 });
		}

		// Create approval record
		const approvalData = {
			entityType: 'project',
			entityId: projectId,
			status: 'pending',
			requestedBy: userProfile.id,
			requestedDate: new Date().toISOString(),
			amount: project.project_budget || 0,
			comments: comments || '<p>Project approval requested.</p>'
		};

		const approval = await pb.collection('approvals').create(approvalData);

		console.log(`✅ Created project approval ${approval.id} for project ${projectId}`);

		return json({ 
			success: true, 
			message: 'Project approval request created successfully',
			approval
		});
	} catch (error: any) {
		console.error('Error creating project approval:', error);
		return json({ 
			error: 'Failed to create project approval', 
			details: error.message 
		}, { status: 500 });
	}
};
