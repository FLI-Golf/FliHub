/**
 * Restore Data From Seed Backup
 * 
 * Restores vendors and expenses from a backup created before seeding test data.
 * This removes all test data and restores the original state.
 * 
 * Usage: 
 *   npx tsx scripts/restore-from-seed-backup.ts [backup-filename]
 *   npx tsx scripts/restore-from-seed-backup.ts latest
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

function getBackupFile(arg?: string): string {
	const backupsDir = path.resolve(process.cwd(), 'backups');
	
	if (!fs.existsSync(backupsDir)) {
		throw new Error('Backups directory not found. No backups available.');
	}

	if (!arg || arg === 'latest') {
		// Find the most recent pre-seed backup
		const files = fs.readdirSync(backupsDir)
			.filter(f => f.startsWith('pre-seed-backup-') && f.endsWith('.json'))
			.sort()
			.reverse();
		
		if (files.length === 0) {
			throw new Error('No pre-seed backup files found.');
		}
		
		return path.join(backupsDir, files[0]);
	}

	// Use specified file
	const backupFile = arg.includes('/') ? arg : path.join(backupsDir, arg);
	
	if (!fs.existsSync(backupFile)) {
		throw new Error(`Backup file not found: ${backupFile}`);
	}

	return backupFile;
}

async function main() {
	console.log('🔄 Restoring Data From Seed Backup\n');

	const backupArg = process.argv[2];
	
	try {
		const backupFile = getBackupFile(backupArg);
		console.log(`Using backup: ${path.basename(backupFile)}\n`);

		// Read backup file
		const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
		
		console.log('Backup Information:');
		console.log(`  Created: ${backupData.timestamp}`);
		console.log(`  Purpose: ${backupData.metadata.purpose}`);
		console.log(`  Vendors: ${backupData.metadata.counts.vendors}`);
		console.log(`  Expenses: ${backupData.metadata.counts.expenses}`);
		console.log(`  Projects: ${backupData.metadata.counts.projects}`);
		console.log(`  Departments: ${backupData.metadata.counts.departments}\n`);

		const pb = new PocketBase(POCKETBASE_URL);

		await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
		console.log('✓ Authenticated\n');

		console.log('='.repeat(60));
		console.log('STEP 1: Removing Current Test Data');
		console.log('='.repeat(60));

		// Get current data
		const currentVendors = await pb.collection('vendors').getFullList();
		const currentExpenses = await pb.collection('expenses').getFullList();

		console.log(`Current vendors: ${currentVendors.length}`);
		console.log(`Current expenses: ${currentExpenses.length}\n`);

		// Delete all current vendors
		console.log('Deleting vendors...');
		for (const vendor of currentVendors) {
			try {
				await pb.collection('vendors').delete(vendor.id);
			} catch (err: any) {
				console.warn(`  Warning: Could not delete vendor ${vendor.id}: ${err.message}`);
			}
		}
		console.log(`✓ Deleted ${currentVendors.length} vendors\n`);

		// Delete all current expenses
		console.log('Deleting expenses...');
		for (const expense of currentExpenses) {
			try {
				await pb.collection('expenses').delete(expense.id);
			} catch (err: any) {
				console.warn(`  Warning: Could not delete expense ${expense.id}: ${err.message}`);
			}
		}
		console.log(`✓ Deleted ${currentExpenses.length} expenses\n`);

		console.log('='.repeat(60));
		console.log('STEP 2: Restoring Original Data');
		console.log('='.repeat(60));

		// Restore vendors
		console.log('Restoring vendors...');
		let vendorsRestored = 0;
		for (const vendor of backupData.data.vendors) {
			try {
				// Remove system fields
				const { id, created, updated, collectionId, collectionName, ...vendorData } = vendor;
				await pb.collection('vendors').create(vendorData);
				vendorsRestored++;
			} catch (err: any) {
				console.warn(`  Warning: Could not restore vendor: ${err.message}`);
			}
		}
		console.log(`✓ Restored ${vendorsRestored} vendors\n`);

		// Restore expenses
		console.log('Restoring expenses...');
		let expensesRestored = 0;
		for (const expense of backupData.data.expenses) {
			try {
				// Remove system fields
				const { id, created, updated, collectionId, collectionName, ...expenseData } = expense;
				await pb.collection('expenses').create(expenseData);
				expensesRestored++;
			} catch (err: any) {
				console.warn(`  Warning: Could not restore expense: ${err.message}`);
			}
		}
		console.log(`✓ Restored ${expensesRestored} expenses\n`);

		console.log('='.repeat(60));
		console.log('✅ RESTORE COMPLETE');
		console.log('='.repeat(60));
		console.log(`\nRestored from: ${path.basename(backupFile)}`);
		console.log(`Vendors: ${vendorsRestored}/${backupData.metadata.counts.vendors}`);
		console.log(`Expenses: ${expensesRestored}/${backupData.metadata.counts.expenses}`);
		console.log('\nYour database has been restored to its pre-seed state.');

	} catch (error: any) {
		console.error('❌ Error restoring backup:', error.message);
		process.exit(1);
	}
}

main();
