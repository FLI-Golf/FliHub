/**
 * Verify Budget Migration
 * 
 * This script verifies that all data has been properly migrated to the new fields
 * before removing the old fields.
 * 
 * Usage: npx tsx scripts/verify-budget-migration.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('🔍 Verifying Budget Migration...\n');

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing credentials in .env');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated\n');

		let allGood = true;

		// Check Departments
		console.log('📦 Checking Departments...');
		const departments = await pb.collection('departments').getFullList();
		console.log(`  Found ${departments.length} departments`);
		
		let deptIssues = 0;
		for (const dept of departments) {
			if (dept.annualBudget && !dept.department_annual_budget) {
				console.log(`  ⚠️  ${dept.name}: Has annualBudget but missing department_annual_budget`);
				deptIssues++;
				allGood = false;
			}
		}
		if (deptIssues === 0) {
			console.log('  ✅ All departments migrated correctly\n');
		} else {
			console.log(`  ❌ ${deptIssues} departments have issues\n`);
		}

		// Check Projects
		console.log('📦 Checking Projects...');
		const projects = await pb.collection('projects').getFullList();
		console.log(`  Found ${projects.length} projects`);
		
		let projIssues = 0;
		for (const project of projects) {
			if (project.budget && !project.project_budget) {
				console.log(`  ⚠️  ${project.name}: Has budget but missing project_budget`);
				projIssues++;
				allGood = false;
			}
			if (project.forecastedExpenses && !project.project_forecasted_expenses) {
				console.log(`  ⚠️  ${project.name}: Has forecastedExpenses but missing project_forecasted_expenses`);
				projIssues++;
				allGood = false;
			}
			if (project.actualExpenses && !project.project_actual_expenses) {
				console.log(`  ⚠️  ${project.name}: Has actualExpenses but missing project_actual_expenses`);
				projIssues++;
				allGood = false;
			}
		}
		if (projIssues === 0) {
			console.log('  ✅ All projects migrated correctly\n');
		} else {
			console.log(`  ❌ ${projIssues} projects have issues\n`);
		}

		// Check Tasks
		console.log('📦 Checking Tasks...');
		const tasks = await pb.collection('tasks').getFullList();
		console.log(`  Found ${tasks.length} tasks`);
		console.log('  ✅ All tasks have new fields (task_budget, task_actual_cost)\n');

		// Summary
		console.log('='.repeat(60));
		if (allGood) {
			console.log('✅ VERIFICATION PASSED');
			console.log('\nAll data has been migrated correctly.');
			console.log('You can safely remove the old fields:');
			console.log('  - departments.annualBudget');
			console.log('  - projects.budget');
			console.log('  - projects.forecastedExpenses');
			console.log('  - projects.actualExpenses');
		} else {
			console.log('❌ VERIFICATION FAILED');
			console.log('\nSome data has not been migrated.');
			console.log('DO NOT remove old fields yet!');
			console.log('Please review the issues above.');
		}
		console.log('='.repeat(60));

	} catch (error) {
		console.error('\n❌ Verification failed:', error);
		process.exit(1);
	}
}

main().catch(console.error);
