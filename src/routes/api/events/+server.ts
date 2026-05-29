import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const pb = await getAdminPocketBase();
		const body = await request.json();
		const record = await pb.collection('special_events').create(body);
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to create event' }, { status: 400 });
	}
};
