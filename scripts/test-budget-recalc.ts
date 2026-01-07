/**
 * Test Budget Recalculation
 * 
 * Manually trigger budget recalculation for a specific project
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { recalculateBudgetHierarchy } from '../src/lib/utils/budget-calculator';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('🧪 Testing Budget Recalculation...\n');

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing credentials');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated\n');

		const projectId = '17ktuh9139ju081'; // Operation details project
		
		console.log(`Testing recalculation for project: ${projectId}\n`);

		// Get project before
		const projectBefore = await pb.collection('projects').getOne(projectId);
		console.log('BEFORE:');
		console.log(`  Project: ${projectBefore.name}`);
		console.log(`  project_budget: ${projectBefore.project_budget}`);
		console.log(`  project_forecasted_expenses: ${projectBefore.project_forecasted_expenses}`);
		console.log(`  project_actual_expenses: ${projectBefore.project_actual_expenses}`);

		// Get tasks for this project
		const tasks = await pb.collection('tasks').getFullList({
			filter: `projectId = "${projectId}"`
		});
		console.log(`\nTasks for this project: ${tasks.length}`);
		tasks.forEach(task => {
			console.log(`  - ${task.title}: $${task.task_budget || 0}`);
		});

		// Recalculate
		console.log('\n🔄 Recalculating budgets...');
		await recalculateBudgetHierarchy(pb, projectId);

		// Get project after
		const projectAfter = await pb.collection('projects').getOne(projectId);
		console.log('\nAFTER:');
		console.log(`  Project: ${projectAfter.name}`);
		console.log(`  project_budget: ${projectAfter.project_budget}`);
		console.log(`  project_forecasted_expenses: ${projectAfter.project_forecasted_expenses}`);
		console.log(`  project_actual_expenses: ${projectAfter.project_actual_expenses}`);

		// Get department
		if (projectAfter.department) {
			const dept = await pb.collection('departments').getOne(projectAfter.department);
			console.log(`\nDepartment: ${dept.name}`);
			console.log(`  department_annual_budget: ${dept.department_annual_budget}`);
			console.log(`  department_actual_expenses: ${dept.department_actual_expenses}`);
		}

		console.log('\n✅ Test complete!');

	} catch (error) {
		console.error('\n❌ Test failed:', error);
		process.exit(1);
	}
}

main().catch(console.error);
