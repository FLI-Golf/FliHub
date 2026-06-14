import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json();
		const record = await pb.collection('special_events').update(params.id, body);
		return json(record);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to update event' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		await pb.collection('special_events').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to delete event' }, { status: 400 });
	}
};
