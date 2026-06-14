import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json();
		const record = await pb.collection('event_tasks').create({
			...body,
			event: params.id,
			status: body.status ?? 'todo',
			checklist: body.checklist ?? []
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to create task' }, { status: 400 });
	}
};
