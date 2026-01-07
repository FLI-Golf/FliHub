/**
 * Seed Test Data Generator
 * 
 * Generates realistic test data for FliHub including:
 * - Expenses (draft, submitted, approved, paid, rejected)
 * - Vendors
 * - Test users
 * 
 * Usage: 
 *   npx tsx scripts/seed-test-data.ts [scenario]
 * 
 * Scenarios:
 *   quick    - 10 expenses, 3 vendors (default)
 *   full     - 50 expenses, 10 vendors
 *   approval - 20 expenses with approval workflow
 *   budget   - 15 expenses testing budget limits
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const scenario = process.argv[2] || 'quick';

// Realistic vendor data
const VENDORS = [
  { name: 'Smartboost Marketing', category: 'Marketing', contact: 'John Smith', email: 'john@smartboost.com' },
  { name: 'Neology PR', category: 'Public Relations', contact: 'Sarah Johnson', email: 'sarah@neologypr.com' },
  { name: 'Pure Mobile Productions', category: 'Production', contact: 'Mike Chen', email: 'mike@puremobile.com' },
  { name: 'Go Throw Media', category: 'Media', contact: 'Lisa Brown', email: 'lisa@gothrow.com' },
  { name: 'Office Depot', category: 'Office Supplies', contact: 'Tom Wilson', email: 'tom@officedepot.com' },
  { name: 'Adobe Creative Cloud', category: 'Software', contact: 'Support', email: 'support@adobe.com' },
  { name: 'Amazon Web Services', category: 'Technology', contact: 'AWS Support', email: 'support@aws.com' },
  { name: 'FedEx', category: 'Shipping', contact: 'Local Office', email: 'local@fedex.com' },
  { name: 'Staples', category: 'Office Supplies', contact: 'Store Manager', email: 'manager@staples.com' },
  { name: 'Disc Golf Manufacturers Inc', category: 'Equipment', contact: 'Sales Team', email: 'sales@discgolf.com' }
];

// Realistic expense descriptions
const EXPENSE_TEMPLATES = [
  { desc: 'Monthly marketing campaign services', category: 'Marketing', range: [5000, 15000] },
  { desc: 'Social media advertising spend', category: 'Marketing', range: [2000, 8000] },
  { desc: 'PR campaign materials and distribution', category: 'PR', range: [3000, 10000] },
  { desc: 'Video production services', category: 'Production', range: [10000, 50000] },
  { desc: 'Office supplies and equipment', category: 'Office', range: [500, 2000] },
  { desc: 'Software licenses and subscriptions', category: 'Technology', range: [1000, 5000] },
  { desc: 'Cloud hosting and infrastructure', category: 'Technology', range: [2000, 8000] },
  { desc: 'Shipping and logistics', category: 'Operations', range: [300, 1500] },
  { desc: 'Player sponsorship payment', category: 'Player Development', range: [5000, 25000] },
  { desc: 'Event venue rental', category: 'Events', range: [5000, 20000] },
  { desc: 'Catering for event', category: 'Events', range: [1000, 5000] },
  { desc: 'Travel expenses for partnership meetings', category: 'Travel', range: [1000, 5000] },
  { desc: 'Legal consultation fees', category: 'Legal', range: [2000, 10000] },
  { desc: 'Insurance premium payment', category: 'Insurance', range: [5000, 15000] },
  { desc: 'Apparel inventory order', category: 'Merchandise', range: [3000, 10000] }
];

const STATUSES = ['draft', 'submitted', 'approved', 'paid', 'rejected'];

interface SeedConfig {
  expenses: number;
  vendors: number;
  statusMix: { [key: string]: number };
  dateRange: 'phase1' | 'phase2' | 'phase3' | 'all';
}

const SCENARIOS: { [key: string]: SeedConfig } = {
  quick: {
    expenses: 10,
    vendors: 3,
    statusMix: { draft: 3, submitted: 4, approved: 2, paid: 1, rejected: 0 },
    dateRange: 'phase1'
  },
  full: {
    expenses: 50,
    vendors: 10,
    statusMix: { draft: 10, submitted: 15, approved: 15, paid: 8, rejected: 2 },
    dateRange: 'all'
  },
  approval: {
    expenses: 20,
    vendors: 5,
    statusMix: { draft: 5, submitted: 8, approved: 5, paid: 2, rejected: 0 },
    dateRange: 'phase2'
  },
  budget: {
    expenses: 15,
    vendors: 5,
    statusMix: { draft: 3, submitted: 5, approved: 5, paid: 2, rejected: 0 },
    dateRange: 'phase1'
  }
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(range: string): string {
  const ranges = {
    phase1: { start: new Date('2026-04-01'), end: new Date('2026-09-30') },
    phase2: { start: new Date('2026-10-01'), end: new Date('2027-01-31') },
    phase3: { start: new Date('2027-02-01'), end: new Date('2028-01-01') },
    all: { start: new Date('2026-04-01'), end: new Date('2028-01-01') }
  };

  const { start, end } = ranges[range as keyof typeof ranges];
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp).toISOString();
}

async function main() {
  console.log(`🌱 Seeding Test Data - Scenario: ${scenario}\n`);

  const config = SCENARIOS[scenario];
  if (!config) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    console.log('Available scenarios: quick, full, approval, budget');
    process.exit(1);
  }

  const pb = new PocketBase(POCKETBASE_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);
    console.log('✓ Authenticated\n');

    // Get existing data
    const projects = await pb.collection('projects').getFullList();
    const departments = await pb.collection('departments').getFullList();

    if (projects.length === 0) {
      console.error('❌ No projects found. Run Phase 1 migration first.');
      process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('STEP 1: Creating Vendors');
    console.log('='.repeat(60));

    const vendorIds: string[] = [];
    const vendorsToCreate = VENDORS.slice(0, config.vendors);

    for (const vendor of vendorsToCreate) {
      console.log(`Creating vendor: ${vendor.name}`);
      const created = await pb.collection('vendors').create({
        vendor_name: vendor.name,
        vendor_category: vendor.category,
        vendor_contact_name: vendor.contact,
        vendor_email: vendor.email,
        vendor_phone: '555-0100',
        vendor_status: 'active'
      });
      vendorIds.push(created.id);
    }

    console.log(`✓ Created ${vendorIds.length} vendors\n`);

    console.log('='.repeat(60));
    console.log('STEP 2: Creating Expenses');
    console.log('='.repeat(60));

    // Generate status distribution
    const statuses: string[] = [];
    Object.entries(config.statusMix).forEach(([status, count]) => {
      for (let i = 0; i < count; i++) {
        statuses.push(status);
      }
    });

    let createdCount = 0;
    const statusCounts: { [key: string]: number } = {};

    for (let i = 0; i < config.expenses; i++) {
      const template = getRandomElement(EXPENSE_TEMPLATES);
      const amount = getRandomAmount(template.range[0], template.range[1]);
      const vendor = getRandomElement(vendorIds);
      const project = getRandomElement(projects);
      const status = statuses[i] || 'draft';
      const date = getRandomDate(config.dateRange);

      const expenseData: any = {
        expense_description: template.desc,
        expense_amount: amount,
        expense_date: date,
        expense_vendor_id: vendor,
        expense_project_id: project.id,
        expense_category: template.category,
        expense_status: status,
        expense_notes: `Test expense for ${scenario} scenario`
      };

      // Add approval data for approved/paid expenses
      if (status === 'approved' || status === 'paid') {
        expenseData.expense_approved_by = 'admin';
        expenseData.expense_approved_date = date;
      }

      // Add payment data for paid expenses
      if (status === 'paid') {
        expenseData.expense_paid_date = date;
      }

      // Add rejection reason for rejected expenses
      if (status === 'rejected') {
        expenseData.expense_rejection_reason = 'Insufficient documentation provided';
      }

      await pb.collection('expenses').create(expenseData);
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      createdCount++;

      if ((i + 1) % 10 === 0) {
        console.log(`  Created ${i + 1}/${config.expenses} expenses...`);
      }
    }

    console.log(`✓ Created ${createdCount} expenses\n`);

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Scenario: ${scenario}`);
    console.log(`Vendors: ${vendorIds.length}`);
    console.log(`Expenses: ${createdCount}`);
    console.log('\nExpense Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n✅ Seed data created successfully!');
    console.log('\nTo reset this data, run:');
    console.log('  npx tsx scripts/reset-test-data.ts');

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

main();
