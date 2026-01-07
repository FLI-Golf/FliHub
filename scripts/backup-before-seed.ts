/**
 * Backup Data Before Seeding Test Data
 * 
 * Creates a timestamped backup of vendors and expenses before running seed-test-data.
 * This allows you to restore the original state after testing.
 * 
 * Usage: npx tsx scripts/backup-before-seed.ts
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function main() {
	console.log('💾 Creating Backup Before Seeding Test Data\n');

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
		console.log('✓ Authenticated\n');

		// Create backups directory if it doesn't exist
		const backupsDir = path.resolve(process.cwd(), 'backups');
		if (!fs.existsSync(backupsDir)) {
			fs.mkdirSync(backupsDir, { recursive: true });
		}

		// Create timestamped backup
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
		const backupFile = path.join(backupsDir, `pre-seed-backup-${timestamp}.json`);

		console.log('Fetching current data...');
		
		// Fetch all vendors and expenses
		const vendors = await pb.collection('vendors').getFullList();
		const expenses = await pb.collection('expenses').getFullList();
		const projects = await pb.collection('projects').getFullList();
		const departments = await pb.collection('departments').getFullList();

		console.log(`✓ Vendors: ${vendors.length}`);
		console.log(`✓ Expenses: ${expenses.length}`);
		console.log(`✓ Projects: ${projects.length}`);
		console.log(`✓ Departments: ${departments.length}\n`);

		// Create backup object
		const backup = {
			timestamp: new Date().toISOString(),
			metadata: {
				purpose: 'Pre-seed backup for testing',
				pocketbaseUrl: POCKETBASE_URL,
				counts: {
					vendors: vendors.length,
					expenses: expenses.length,
					projects: projects.length,
					departments: departments.length
				}
			},
			data: {
				vendors,
				expenses,
				projects,
				departments
			}
		};

		// Save backup to file
		fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

		console.log('✅ BACKUP COMPLETE');
		console.log(`\nBackup saved to: ${backupFile}`);
		console.log('\nTo restore this backup later, run:');
		console.log(`  npx tsx scripts/restore-from-seed-backup.ts ${path.basename(backupFile)}`);
		console.log('\nYou can now safely run:');
		console.log('  npx tsx scripts/seed-test-data.ts [scenario]');

	} catch (error: any) {
		console.error('❌ Error creating backup:', error.message);
		process.exit(1);
	}
}

main();
