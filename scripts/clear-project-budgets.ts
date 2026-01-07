/**
 * Clear Project Budget Values
 * 
 * This script clears the existing project budget values so they can be
 * recalculated from task budgets going forward.
 * 
 * Usage: npx tsx scripts/clear-project-budgets.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('🧹 Clearing Project Budget Values...\n');

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing credentials in .env');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated\n');

		// Fetch all projects
		const projects = await pb.collection('projects').getFullList();
		console.log(`Found ${projects.length} projects\n`);

		let updated = 0;
		let errors = 0;

		for (const project of projects) {
			try {
				await pb.collection('projects').update(project.id, {
					project_budget: 0,
					project_forecasted_expenses: 0,
					project_actual_expenses: 0
				});
				console.log(`✓ Cleared budgets for: ${project.name}`);
				updated++;
			} catch (error) {
				console.error(`✗ Error updating ${project.name}:`, error);
				errors++;
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('📊 SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total projects: ${projects.length}`);
		console.log(`Updated: ${updated}`);
		console.log(`Errors: ${errors}`);
		console.log('='.repeat(60));

		if (errors === 0) {
			console.log('\n✅ All project budgets cleared successfully!');
			console.log('\nBudgets will now be calculated from task budgets.');
		} else {
			console.log('\n⚠️  Some projects had errors. Please review above.');
		}

	} catch (error) {
		console.error('\n❌ Script failed:', error);
		process.exit(1);
	}
}

main().catch(console.error);
