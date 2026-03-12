import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const asset = await pb.collection('media_assets').update(params.id, {
			title:      data.title,
			asset_type: data.asset_type,
			franchise:  data.franchise  || null,
			project:    data.project    || null,
			campaign:   data.campaign   || null,
			tags:       data.tags       || '',
			notes:      data.notes      || ''
		});

		return json(asset);
	} catch (error) {
		console.error('Error updating media asset:', error);
		return json({ message: 'Failed to update media asset', error: String(error) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('media_assets').delete(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting media asset:', error);
		return json({ message: 'Failed to delete media asset', error: String(error) }, { status: 500 });
	}
};
