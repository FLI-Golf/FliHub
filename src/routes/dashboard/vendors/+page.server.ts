import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, role, profile } = ctx;

	try {
		const userRole = role ?? 'leader';
		let vendors: any[] = [];
		let stats = {
			total: 0,
			active: 0,
			inactive: 0,
			withOpenInvoices: 0,
			totalOpenInvoices: 0
		};

		// If user is a vendor, only show their assigned vendor
		if (userRole === 'vendor') {
			if (!profile?.vendorId) {
				return {
					vendors: [],
					stats,
					error: 'No vendor assigned to your account. Please contact an administrator.',
					isVendorUser: true
				};
			}

			// Fetch only the assigned vendor
			const vendor = await pb.collection('vendors').getOne(profile?.vendorId);
			vendors = [vendor];
			console.log('Fetched assigned vendor:', vendor);
		} else {
			// Admin/leader can see all vendors
			console.log('Fetching all vendors from PocketBase...');
			vendors = await pb.collection('vendors').getFullList({
				sort: '-id'
			});
			console.log(`Fetched ${vendors.length} vendors`);
		}

		// Calculate statistics
		stats = {
			total: vendors.length,
			active: vendors.filter(v => v.active).length,
			inactive: vendors.filter(v => !v.active).length,
			withOpenInvoices: vendors.filter(v => v.open_invoices_total && v.open_invoices_total > 0).length,
			totalOpenInvoices: vendors.reduce((sum, v) => sum + (v.open_invoices_total || 0), 0)
		};

		return {
			vendors,
			stats,
			isVendorUser: userRole === 'vendor'
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
			error: error instanceof Error ? error.message : 'Unknown error',
			isVendorUser: false
		};
	}
};
