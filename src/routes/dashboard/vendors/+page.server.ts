import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	try {
		// Fetch all vendors
		const vendors = await pb.collection('vendors').getFullList({
			sort: '-created'
		});

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
		return {
			vendors: [],
			stats: {
				total: 0,
				active: 0,
				inactive: 0,
				withOpenInvoices: 0,
				totalOpenInvoices: 0
			}
		};
	}
};
