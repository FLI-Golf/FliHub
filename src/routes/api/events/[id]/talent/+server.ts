/**
 * POST /api/events/[id]/talent
 * Assigns a talent member to an event. Sets confirmedRate from rateOverride
 * or falls back to the event's defaultRate.
 */
import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const pb = await getAdminPocketBase();
		const { talentId, role, rateOverride, status } = await request.json();

		if (!talentId) return json({ message: 'talentId is required' }, { status: 400 });

		// Get event to resolve defaultRate
		const event = await pb.collection('special_events').getOne(params.id);
		const confirmedRate = rateOverride ?? event.defaultRate ?? 0;

		// Check for duplicate assignment
		const existing = await pb.collection('event_talent').getList(1, 1, {
			filter: `event = '${params.id}' && talent = '${talentId}'`
		});
		if (existing.totalItems > 0) {
			return json({ message: 'Talent already assigned to this event' }, { status: 409 });
		}

		const record = await pb.collection('event_talent').create({
			event: params.id,
			talent: talentId,
			role: role ?? 'player',
			rateOverride: rateOverride ?? null,
			confirmedRate,
			status: status ?? 'confirmed',
			bonusEligible: false,
			bonusEarned: false
		});

		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to assign talent' }, { status: 400 });
	}
};
