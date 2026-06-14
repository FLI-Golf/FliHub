import { json } from '@sveltejs/kit';
import { requireAdminNonProductionApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const guard = await requireAdminNonProductionApi(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	try {
		console.log('Removing test data...');
		
		// Get test vendors (created by seed script)
		const testVendorNames = ['Smartboost Marketing', 'Neology PR', 'Pure Mobile Productions'];
		const vendors = await pb.collection('vendors').getFullList({
			filter: testVendorNames.map(name => `vendor_name = "${name}"`).join(' || ')
		});

		// Get all expenses with "Test expense" in notes
		const expenses = await pb.collection('expenses').getFullList({
			filter: 'notes ~ "Test expense"'
		});

		let vendorsDeleted = 0;
		let expensesDeleted = 0;

		// Delete test vendors
		for (const vendor of vendors) {
			try {
				await pb.collection('vendors').delete(vendor.id);
				vendorsDeleted++;
				console.log(`Deleted vendor: ${vendor.vendor_name}`);
			} catch (err: any) {
				console.warn(`Could not delete vendor ${vendor.id}: ${err.message}`);
			}
		}

		// Delete test expenses
		for (const expense of expenses) {
			try {
				await pb.collection('expenses').delete(expense.id);
				expensesDeleted++;
			} catch (err: any) {
				console.warn(`Could not delete expense ${expense.id}: ${err.message}`);
			}
		}

		console.log(`✅ Deleted ${vendorsDeleted} test vendors and ${expensesDeleted} test expenses`);

		return json({ 
			success: true, 
			message: `Removed ${vendorsDeleted} test vendors and ${expensesDeleted} test expenses`,
			deleted: {
				vendors: vendorsDeleted,
				expenses: expensesDeleted
			}
		});
	} catch (error: any) {
		console.error('Error removing test data:', error);
		return json({ 
			error: 'Failed to remove test data', 
			details: error.message 
		}, { status: 500 });
	}
};
