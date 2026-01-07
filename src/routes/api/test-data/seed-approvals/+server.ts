import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo: number = 30): string {
	const date = new Date();
	date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
	return date.toISOString();
}

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
		console.log('Starting approval workflow seed...');
		
		// Get existing data
		const expenses = await pb.collection('expenses').getFullList();
		const projects = await pb.collection('projects').getFullList();
		const userProfiles = await pb.collection('user_profiles').getFullList();

		// Get admin and leader users
		const adminUsers = userProfiles.filter(u => u.role === 'admin');
		const leaderUsers = userProfiles.filter(u => u.role === 'leader');
		const allApprovers = [...adminUsers, ...leaderUsers];

		if (expenses.length === 0) {
			return json({ error: 'No expenses found. Seed test expenses first.' }, { status: 400 });
		}

		if (allApprovers.length === 0) {
			return json({ error: 'No admin or leader users found.' }, { status: 400 });
		}

		let approvalsCreated = 0;

		// Create expense approvals (10 requests)
		const expensesToApprove = expenses.slice(0, Math.min(10, expenses.length));
		const statuses = ['pending', 'pending', 'pending', 'pending', 'approved', 'approved', 'approved', 'rejected', 'revision_requested', 'approved'];

		for (let i = 0; i < expensesToApprove.length; i++) {
			const expense = expensesToApprove[i];
			const status = statuses[i];
			const requester = getRandomElement(userProfiles);
			const approver = status !== 'pending' ? getRandomElement(allApprovers) : null;
			const requestedDate = getRandomDate(15);

			const approvalData: any = {
				entityType: 'expense',
				entityId: expense.id,
				status: status,
				requestedBy: requester.id,
				requestedDate: requestedDate,
				amount: expense.amount || 0
			};

			if (approver && status !== 'pending') {
				approvalData.approver = approver.id;
				approvalData.reviewedDate = getRandomDate(7);
			}

			if (status === 'rejected') {
				approvalData.comments = '<p>Insufficient documentation provided. Please resubmit with receipts.</p>';
			} else if (status === 'revision_requested') {
				approvalData.comments = '<p>Please provide additional details about the business purpose.</p>';
			} else if (status === 'approved') {
				approvalData.comments = '<p>Approved. Expense is within budget and properly documented.</p>';
			}

			await pb.collection('approvals').create(approvalData);
			approvalsCreated++;
		}

		// Create project approvals (3 requests)
		if (projects.length > 0) {
			const projectsToApprove = projects.slice(0, Math.min(3, projects.length));
			const projectStatuses = ['pending', 'approved', 'approved'];

			for (let i = 0; i < projectsToApprove.length; i++) {
				const project = projectsToApprove[i];
				const status = projectStatuses[i];
				const requester = getRandomElement(leaderUsers.length > 0 ? leaderUsers : userProfiles);
				const approver = status !== 'pending' ? getRandomElement(adminUsers) : null;
				const requestedDate = getRandomDate(20);

				const approvalData: any = {
					entityType: 'project',
					entityId: project.id,
					status: status,
					requestedBy: requester.id,
					requestedDate: requestedDate,
					amount: project.project_budget || 0
				};

				if (approver && status !== 'pending') {
					approvalData.approver = approver.id;
					approvalData.reviewedDate = getRandomDate(10);
					approvalData.comments = '<p>Project approved. Budget allocation confirmed.</p>';
				}

				await pb.collection('approvals').create(approvalData);
				approvalsCreated++;
			}
		}

		// Create budget approvals (2 requests)
		const budgetStatuses = ['pending', 'approved'];
		for (let i = 0; i < 2; i++) {
			const status = budgetStatuses[i];
			const requester = getRandomElement(leaderUsers.length > 0 ? leaderUsers : userProfiles);
			const approver = status !== 'pending' ? getRandomElement(adminUsers) : null;
			const requestedDate = getRandomDate(25);
			const amount = Math.floor(Math.random() * 50000) + 10000;

			const approvalData: any = {
				entityType: 'budget',
				entityId: `budget_${Date.now()}_${i}`,
				status: status,
				requestedBy: requester.id,
				requestedDate: requestedDate,
				amount: amount
			};

			if (approver && status !== 'pending') {
				approvalData.approver = approver.id;
				approvalData.reviewedDate = getRandomDate(5);
				approvalData.comments = '<p>Budget increase approved for Q2 operations.</p>';
			} else {
				approvalData.comments = '<p>Requesting budget increase for expanded operations.</p>';
			}

			await pb.collection('approvals').create(approvalData);
			approvalsCreated++;
		}

		console.log(`✅ Created ${approvalsCreated} approval requests`);

		return json({ 
			success: true, 
			message: 'Approval workflow test data seeded successfully',
			created: {
				total: approvalsCreated,
				expenses: expensesToApprove.length,
				projects: Math.min(3, projects.length),
				budgets: 2
			}
		});
	} catch (error: any) {
		console.error('Error seeding approval workflow:', error);
		return json({ 
			error: 'Failed to seed approval workflow', 
			details: error.message 
		}, { status: 500 });
	}
};
