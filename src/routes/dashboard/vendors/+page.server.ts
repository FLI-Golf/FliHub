import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	console.log('Loading vendors page...');
	console.log('Auth state:', {
		isValid: pb.authStore.isValid,
		userId: pb.authStore.model?.id
	});

	try {
		// Get current user's profile
		const userId = pb.authStore.model?.id;
		if (!userId) {
			throw redirect(303, '/auth/login');
		}

		const userProfile = await pb.collection('user_profiles').getFirstListItem(`userId="${userId}"`);
		const userRole = userProfile.role;

		console.log('User role:', userRole);
		console.log('User vendorId:', userProfile.vendorId);

		let vendors = [];
		let stats = {
			total: 0,
			active: 0,
			inactive: 0,
			withOpenInvoices: 0,
			totalOpenInvoices: 0
		};

		// If user is a vendor, only show their assigned vendor
		if (userRole === 'vendor') {
			if (!userProfile.vendorId) {
				return {
					vendors: [],
					stats,
					error: 'No vendor assigned to your account. Please contact an administrator.',
					isVendorUser: true
				};
			}

			// Fetch only the assigned vendor
			const vendor = await pb.collection('vendors').getOne(userProfile.vendorId);
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
