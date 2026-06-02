import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params }) => {
	try {
		const pb = await getAdminPocketBase();
		const body = await request.json();
		const payload: Record<string, unknown> = {};

		if (body.status) payload.status = body.status;
		if (body.role) payload.role = body.role;
		if (body.rateOverride !== undefined) {
			payload.rateOverride = body.rateOverride;
			payload.confirmedRate = body.rateOverride;
		}

		const updated = await pb.collection('event_talent').update(params.eventTalentId, payload);
		return json(updated);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to update booking' }, { status: 400 });
	}
};
