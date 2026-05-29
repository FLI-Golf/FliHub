import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		const pb = await getAdminPocketBase();
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

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const pb = await getAdminPocketBase();
		await pb.collection('event_tasks').delete(params.taskId);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to delete task' }, { status: 400 });
	}
};
