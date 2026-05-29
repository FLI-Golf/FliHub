import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		const pb = await getAdminPocketBase();
		const body = await request.json();
		const record = await pb.collection('special_events').update(params.id, body);
		return json(record);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to update event' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const pb = await getAdminPocketBase();
		await pb.collection('special_events').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to delete event' }, { status: 400 });
	}
};
