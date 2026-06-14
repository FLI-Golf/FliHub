import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json();
		const record = await pb.collection('special_events').create(body);
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to create event' }, { status: 400 });
	}
};
