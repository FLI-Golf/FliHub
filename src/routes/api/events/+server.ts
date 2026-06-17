import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import { findOperationsDepartment } from '$lib/server/event-funding';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json();

		const operationsDepartment = await findOperationsDepartment(pb);
		const mappedBody = {
			...body,
			...(operationsDepartment?.id && !body?.department ? { department: operationsDepartment.id } : {})
		};

		let record: any;
		try {
			record = await pb.collection('special_events').create(mappedBody);
		} catch (err: any) {
			// Some environments may not yet have a `department` field on special_events.
			if (operationsDepartment?.id && !body?.department) {
				record = await pb.collection('special_events').create(body);
			} else {
				throw err;
			}
		}
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to create event' }, { status: 400 });
	}
};
