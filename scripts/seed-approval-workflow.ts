/**
 * Seed Approval Workflow Test Data
 * 
 * Creates realistic approval requests for testing the approval workflow:
 * - Expense approvals (pending, approved, rejected)
 * - Project approvals
 * - Budget approvals
 * 
 * Usage: npx tsx scripts/seed-approval-workflow.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo: number = 30): string {
	const date = new Date();
	date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
	return date.toISOString();
}

async function main() {
	console.log('🔄 Seeding Approval Workflow Test Data\n');

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
		console.log('✓ Authenticated\n');

		// Get existing data
		const expenses = await pb.collection('expenses').getFullList();
		const projects = await pb.collection('projects').getFullList();
		const userProfiles = await pb.collection('user_profiles').getFullList();

		// Get admin and leader users
		const adminUsers = userProfiles.filter(u => u.role === 'admin');
		const leaderUsers = userProfiles.filter(u => u.role === 'leader');
		const allApprovers = [...adminUsers, ...leaderUsers];

		if (expenses.length === 0) {
			console.log('⚠️  No expenses found. Run seed-test-data.ts first.');
			return;
		}

		if (allApprovers.length === 0) {
			console.log('⚠️  No admin or leader users found.');
			return;
		}

		console.log('='.repeat(60));
		console.log('Creating Approval Requests');
		console.log('='.repeat(60));

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
			console.log(`  ✓ Created ${status} expense approval for $${expense.amount}`);
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
				console.log(`  ✓ Created ${status} project approval for ${project.name}`);
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
			console.log(`  ✓ Created ${status} budget approval for $${amount}`);
		}

		console.log('\n' + '='.repeat(60));
		console.log('✅ APPROVAL WORKFLOW SEEDING COMPLETE');
		console.log('='.repeat(60));
		console.log(`\nCreated ${approvalsCreated} approval requests:`);
		console.log(`  - Expense approvals: ${expensesToApprove.length}`);
		console.log(`  - Project approvals: ${Math.min(3, projects.length)}`);
		console.log(`  - Budget approvals: 2`);
		console.log('\nStatus breakdown:');
		console.log(`  - Pending: ${statuses.filter(s => s === 'pending').length + 1}`);
		console.log(`  - Approved: ${statuses.filter(s => s === 'approved').length + 2}`);
		console.log(`  - Rejected: ${statuses.filter(s => s === 'rejected').length}`);
		console.log(`  - Revision Requested: ${statuses.filter(s => s === 'revision_requested').length}`);

	} catch (error: any) {
		console.error('❌ Error seeding approval workflow:', error.message);
		process.exit(1);
	}
}

main();
