import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	console.log('Loading vendors page...');
	console.log('Auth state:', {
		isValid: pb.authStore.isValid,
		userId: pb.authStore.model?.id
	});

	try {
		// Fetch all vendors - use -id instead of -created since created field may not exist
		console.log('Fetching vendors from PocketBase...');
		const vendors = await pb.collection('vendors').getFullList({
			sort: '-id'
		});
		console.log(`Fetched ${vendors.length} vendors`);
		if (vendors.length > 0) {
			console.log('First vendor:', vendors[0]);
		}

		// Calculate statistics
		const stats = {
			total: vendors.length,
			active: vendors.filter(v => v.active).length,
			inactive: vendors.filter(v => !v.active).length,
			withOpenInvoices: vendors.filter(v => v.open_invoices_total && v.open_invoices_total > 0).length,
			totalOpenInvoices: vendors.reduce((sum, v) => sum + (v.open_invoices_total || 0), 0)
		};

		return {
			vendors,
			stats
		};
	} catch (error) {
		console.error('Error loading vendors:', error);
		console.error('Error details:', JSON.stringify(error, null, 2));
		if (error && typeof error === 'object' && 'response' in error) {
			console.error('Response:', error.response);
		}
		return {
			vendors: [],
			stats: {
				total: 0,
				active: 0,
				inactive: 0,
				withOpenInvoices: 0,
				totalOpenInvoices: 0
			},
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
};
