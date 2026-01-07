/**
 * Reset Test Data
 * 
 * Removes test data while preserving blueprint (Phases 1-3 structure)
 * 
 * Usage:
 *   npx tsx scripts/reset-test-data.ts [options]
 * 
 * Options:
 *   --all              Delete everything (expenses, vendors, test users)
 *   --expenses         Delete only expenses
 *   --vendors          Delete only vendors
 *   --keep-blueprint   Keep Phase 1-3 structure (default: true)
 *   --force            Skip confirmation prompt
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const args = process.argv.slice(2);
const deleteAll = args.includes('--all');
const deleteExpenses = args.includes('--expenses') || deleteAll;
const deleteVendors = args.includes('--vendors') || deleteAll;
const keepBlueprint = !args.includes('--no-blueprint');
const force = args.includes('--force');

async function confirm(message: string): Promise<boolean> {
  if (force) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('🗑️  Reset Test Data\n');

  if (!deleteExpenses && !deleteVendors) {
    console.log('No deletion options specified. Use:');
    console.log('  --all        Delete everything');
    console.log('  --expenses   Delete only expenses');
    console.log('  --vendors    Delete only vendors');
    process.exit(0);
  }

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    // Get current counts
    const expenses = await pb.collection('expenses').getFullList();
    const vendors = await pb.collection('vendors').getFullList();

    console.log('Current Data:');
    console.log(`  Expenses: ${expenses.length}`);
    console.log(`  Vendors: ${vendors.length}`);
    console.log();

    console.log('Will Delete:');
    if (deleteExpenses) console.log(`  ✓ ${expenses.length} expenses`);
    if (deleteVendors) console.log(`  ✓ ${vendors.length} vendors`);
    console.log();

    if (keepBlueprint) {
      console.log('Will Keep:');
      console.log('  ✓ Departments (Phase 1-3 structure)');
      console.log('  ✓ Projects (Phase 1-3 structure)');
      console.log('  ✓ Tasks (Phase 1-3 structure)');
      console.log();
    }

    // Confirm deletion
    const confirmed = await confirm('⚠️  Are you sure you want to delete this data?');
    if (!confirmed) {
      console.log('Cancelled.');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(60));
    console.log('DELETING DATA');
    console.log('='.repeat(60));

    let deletedExpenses = 0;
    let deletedVendors = 0;

    // Delete expenses
    if (deleteExpenses && expenses.length > 0) {
      console.log(`\nDeleting ${expenses.length} expenses...`);
      for (const expense of expenses) {
        await pb.collection('expenses').delete(expense.id);
        deletedExpenses++;
        if (deletedExpenses % 10 === 0) {
          console.log(`  Deleted ${deletedExpenses}/${expenses.length}...`);
        }
      }
      console.log(`✓ Deleted ${deletedExpenses} expenses`);
    }

    // Delete vendors
    if (deleteVendors && vendors.length > 0) {
      console.log(`\nDeleting ${vendors.length} vendors...`);
      for (const vendor of vendors) {
        await pb.collection('vendors').delete(vendor.id);
        deletedVendors++;
      }
      console.log(`✓ Deleted ${deletedVendors} vendors`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Deleted Expenses: ${deletedExpenses}`);
    console.log(`Deleted Vendors: ${deletedVendors}`);

    if (keepBlueprint) {
      const departments = await pb.collection('departments').getFullList();
      const projects = await pb.collection('projects').getFullList();
      const tasks = await pb.collection('tasks').getFullList();

      console.log('\nPreserved Blueprint:');
      console.log(`  Departments: ${departments.length}`);
      console.log(`  Projects: ${projects.length}`);
      console.log(`  Tasks: ${tasks.length}`);
    }

    console.log('\n✅ Reset complete!');
    console.log('\nTo generate new test data, run:');
    console.log('  npx tsx scripts/seed-test-data.ts [scenario]');

  } catch (error: any) {
    console.error('\n❌ Reset failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
