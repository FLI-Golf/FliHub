/**
 * Set Budget Mode Defaults
 * 
 * Sets default values for the new budget mode fields on existing records
 * 
 * Usage: npx tsx scripts/set-budget-mode-defaults.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('🔧 Setting Budget Mode Defaults...\n');

	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing credentials in .env');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated\n');

		// Update Projects
		console.log('📦 Updating Projects...');
		const projects = await pb.collection('projects').getFullList();
		console.log(`  Found ${projects.length} projects`);

		let projectsUpdated = 0;
		for (const project of projects) {
			try {
				await pb.collection('projects').update(project.id, {
					project_budget_mode: 'auto'
				});
				console.log(`  ✓ ${project.name}`);
				projectsUpdated++;
			} catch (error) {
				console.error(`  ✗ Error updating ${project.name}:`, error);
			}
		}

		// Update Departments
		console.log('\n📦 Updating Departments...');
		const departments = await pb.collection('departments').getFullList();
		console.log(`  Found ${departments.length} departments`);

		let departmentsUpdated = 0;
		for (const dept of departments) {
			try {
				await pb.collection('departments').update(dept.id, {
					department_budget_mode: 'auto'
				});
				console.log(`  ✓ ${dept.name}`);
				departmentsUpdated++;
			} catch (error) {
				console.error(`  ✗ Error updating ${dept.name}:`, error);
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('📊 SUMMARY');
		console.log('='.repeat(60));
		console.log(`Projects updated: ${projectsUpdated}/${projects.length}`);
		console.log(`Departments updated: ${departmentsUpdated}/${departments.length}`);
		console.log('='.repeat(60));

		if (projectsUpdated === projects.length && departmentsUpdated === departments.length) {
			console.log('\n✅ All records updated successfully!');
		} else {
			console.log('\n⚠️  Some records had errors. Please review above.');
		}

	} catch (error) {
		console.error('\n❌ Script failed:', error);
		process.exit(1);
	}
}

main().catch(console.error);
