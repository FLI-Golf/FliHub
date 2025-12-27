import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Create the vendor in PocketBase
		const vendor = await pb.collection('vendors').create({
			name: data.name || '',
			contact_email: data.contact_email || '',
			contact_phone: data.contact_phone || '',
			website: data.website || '',
			about: data.about || '',
			active: data.active !== undefined ? data.active : true,
			open_invoices_total: 0
		});

		return json(vendor, { status: 201 });
	} catch (error) {
		console.error('Error creating vendor:', error);
		return json(
			{ message: 'Failed to create vendor', error: String(error) },
			{ status: 500 }
		);
	}
};
