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
			title: data.title,
			asset_type: data.asset_type,
			media_category: data.media_category || null,
			franchise: data.franchise || null,
			project: data.project || null,
			campaign: data.campaign || null,
			season: data.season || null,
			tournament: data.tournament || null,
			special_event: data.special_event || null,
			source_type: data.source_type || null,
			capture_date: data.capture_date || null,
			duration_seconds: data.duration_seconds ? Number(data.duration_seconds) : null,
			file_size_bytes: data.file_size_bytes ? Number(data.file_size_bytes) : null,
			resolution: data.resolution || '',
			status: data.status || null,
			storage_tier: data.storage_tier || null,
			usage_scope: data.usage_scope || null,
			rights_status: data.rights_status || null,
			tags: data.tags || '',
			notes: data.notes || ''
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
