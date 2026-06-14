import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json();

		// Auto-set completedDate when marking done
		if (body.status === 'completed' && !body.completedDate) {
			body.completedDate = new Date().toISOString().split('T')[0];
		}

		const record = await pb.collection('event_tasks').update(params.taskId, body);
		return json(record);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to update task' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		await pb.collection('event_tasks').delete(params.taskId);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to delete task' }, { status: 400 });
	}
};
