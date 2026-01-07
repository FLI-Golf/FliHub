import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Vendor data
const VENDORS = [
	{ name: 'Smartboost Marketing', category: 'Marketing', contact: 'John Smith', email: 'john@smartboost.com' },
	{ name: 'Neology PR', category: 'Public Relations', contact: 'Sarah Johnson', email: 'sarah@neologypr.com' },
	{ name: 'Pure Mobile Productions', category: 'Production', contact: 'Mike Chen', email: 'mike@puremobile.com' }
];

// Expense templates
const EXPENSE_TEMPLATES = [
	{ desc: 'Monthly marketing campaign services', category: 'Marketing', range: [5000, 15000] },
	{ desc: 'Social media advertising spend', category: 'Advertising', range: [2000, 8000] },
	{ desc: 'PR campaign materials', category: 'Public relations', range: [3000, 10000] },
	{ desc: 'Video production services', category: 'Production Studio', range: [10000, 50000] },
	{ desc: 'Office supplies', category: 'Office/San Diego', range: [500, 2000] },
	{ desc: 'Software licenses', category: 'Software', range: [1000, 5000] },
	{ desc: 'Cloud hosting', category: 'Internal Tech Budget', range: [2000, 8000] },
	{ desc: 'Tech development', category: 'Tech/App Development', range: [5000, 15000] },
	{ desc: 'Travel airfare', category: 'Travel/Airefare', range: [500, 2000] },
	{ desc: 'Legal consultation', category: 'Legal', range: [2000, 10000] }
];

function getRandomElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(): string {
	const start = new Date('2026-04-01');
	const end = new Date('2026-09-30');
	const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
	return new Date(timestamp).toISOString();
}

export const POST: RequestHandler = async ({ locals }) => {
	const pb = locals.pb;
	
	// Check if user is authenticated
	if (!pb.authStore.isValid || !pb.authStore.model?.id) {
		return json({ error: 'Unauthorized - Not logged in' }, { status: 403 });
	}

	// Fetch user profile to check role
	try {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${pb.authStore.model.id}"`
		});
		const userProfile = profiles[0];

		if (!userProfile || userProfile.role !== 'admin') {
			return json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
		}
	} catch (err) {
		return json({ error: 'Failed to verify user permissions' }, { status: 403 });
	}

	try {
		console.log('Starting test data seed...');
		
		// Get existing data
		const projects = await pb.collection('projects').getFullList();
		const userProfiles = await pb.collection('user_profiles').getFullList();
		const adminUser = userProfiles.find(u => u.role === 'admin') || userProfiles[0];

		if (projects.length === 0) {
			return json({ error: 'No projects found. Cannot seed test data.' }, { status: 400 });
		}

		// Create vendors
		const vendorIds: string[] = [];
		for (const vendor of VENDORS) {
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

		// Create expenses
		const statuses = ['draft', 'draft', 'draft', 'submitted', 'submitted', 'submitted', 'submitted', 'approved', 'approved', 'paid'];
		let expensesCreated = 0;

		for (let i = 0; i < 10; i++) {
			const template = getRandomElement(EXPENSE_TEMPLATES);
			const amount = getRandomAmount(template.range[0], template.range[1]);
			const vendor = getRandomElement(vendorIds);
			const project = getRandomElement(projects);
			const status = statuses[i];
			const date = getRandomDate();

			const expenseData: any = {
				description: template.desc,
				amount: amount,
				date: date,
				vendor: vendor,
				project: project.id,
				category: template.category,
				status: status,
				notes: `Test expense for quick scenario`
			};

			if ((status === 'approved' || status === 'paid') && adminUser) {
				expenseData.approvedBy = adminUser.id;
				expenseData.approvedDate = date;
			}

			if (status === 'paid') {
				expenseData.paidDate = date;
			}

			await pb.collection('expenses').create(expenseData);
			expensesCreated++;
		}

		console.log(`✅ Created ${vendorIds.length} vendors and ${expensesCreated} expenses`);

		return json({ 
			success: true, 
			message: 'Test data seeded successfully',
			created: {
				vendors: vendorIds.length,
				expenses: expensesCreated
			}
		});
	} catch (error: any) {
		console.error('Error seeding test data:', error);
		return json({ 
			error: 'Failed to seed test data', 
			details: error.message 
		}, { status: 500 });
	}
};
