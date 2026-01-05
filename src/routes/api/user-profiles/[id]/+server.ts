import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('user_profiles').delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error: any) {
		console.error('Error deleting user profile:', error);
		return json(
			{ 
				error: 'Failed to delete manager',
				details: error?.message || String(error)
			},
			{ status: 500 }
		);
	}
};
