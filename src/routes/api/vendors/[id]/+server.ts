import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Update the vendor in PocketBase
		const vendor = await pb.collection('vendors').update(params.id, {
			name: data.name || '',
			contact_name: data.contact_name || '',
			contact_email: data.contact_email || '',
			contact_phone: data.contact_phone || '',
			address: data.address || '',
			website: data.website || '',
			about: data.about || '',
			type: data.type || '',
			active: data.active !== undefined ? data.active : true
		});

		return json(vendor, { status: 200 });
	} catch (error) {
		console.error('Error updating vendor:', error);
		return json(
			{ message: 'Failed to update vendor', error: String(error) },
			{ status: 500 }
		);
	}
};
