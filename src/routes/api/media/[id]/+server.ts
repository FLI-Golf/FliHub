import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
