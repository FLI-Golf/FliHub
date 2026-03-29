import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

const POCKETBASE_URL = env.POCKETBASE_URL;

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
  { desc: 'Event venue rental', category: 'Events', range: [5000, 20000] }
];

const SCENARIOS: any = {
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
  }
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(range: string): string {
  const ranges: any = {
    phase1: { start: new Date('2026-04-01'), end: new Date('2026-09-30') },
    phase2: { start: new Date('2026-10-01'), end: new Date('2027-01-31') },
    phase3: { start: new Date('2027-02-01'), end: new Date('2028-01-01') },
    all: { start: new Date('2026-04-01'), end: new Date('2028-01-01') }
  };

  const { start, end } = ranges[range];
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp).toISOString();
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const pb = locals.pb as PocketBase;

  // Check if user is admin
  if (!pb.authStore.isValid) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { scenario = 'quick' } = await request.json();
    const config = SCENARIOS[scenario];

    if (!config) {
      return json({ error: 'Invalid scenario' }, { status: 400 });
    }

    // Get existing projects
    const projects = await pb.collection('projects').getFullList();
    if (projects.length === 0) {
      return json({ error: 'No projects found. Run Phase 1 migration first.' }, { status: 400 });
    }

    // Create vendors
    const vendorIds: string[] = [];
    const vendorsToCreate = VENDORS.slice(0, config.vendors);

    for (const vendor of vendorsToCreate) {
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

    // Generate status distribution
    const statuses: string[] = [];
    Object.entries(config.statusMix).forEach(([status, count]) => {
      for (let i = 0; i < count as number; i++) {
        statuses.push(status);
      }
    });

    // Create expenses
    let createdExpenses = 0;
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

      if (status === 'approved' || status === 'paid') {
        expenseData.expense_approved_by = pb.authStore.model?.id;
        expenseData.expense_approved_date = date;
      }

      if (status === 'paid') {
        expenseData.expense_paid_date = date;
      }

      if (status === 'rejected') {
        expenseData.expense_rejection_reason = 'Insufficient documentation provided';
      }

      await pb.collection('expenses').create(expenseData);
      createdExpenses++;
    }

    return json({
      success: true,
      created: {
        vendors: vendorIds.length,
        expenses: createdExpenses
      }
    });

  } catch (error: any) {
    console.error('Seed data error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
