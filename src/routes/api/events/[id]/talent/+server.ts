/**
 * POST /api/events/[id]/talent
 * Assigns a talent member to an event. Sets confirmedRate from rateOverride
 * or falls back to the event's defaultRate.
 */
import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const { talentId, talentGroupId, entityType, role, rateOverride, status } = await request.json();
		const bookingEntityType = entityType === 'group' || talentGroupId ? 'group' : 'individual';

		if (bookingEntityType === 'individual' && !talentId) {
			return json({ message: 'talentId is required' }, { status: 400 });
		}
		if (bookingEntityType === 'group' && !talentGroupId) {
			return json({ message: 'talentGroupId is required' }, { status: 400 });
		}

		// Get event to resolve defaultRate
		const event = await pb.collection('special_events').getOne(params.id);
		const group = bookingEntityType === 'group'
			? await pb.collection('talent_groups').getOne(talentGroupId).catch(() => null)
			: null;
		const confirmedRate = rateOverride ?? group?.defaultFee ?? event.defaultRate ?? 0;

		// Check for duplicate assignment
		const existing = await pb.collection('event_talent').getList(1, 1, {
			filter: bookingEntityType === 'group'
				? `event = '${params.id}' && talentGroup = '${talentGroupId}'`
				: `event = '${params.id}' && talent = '${talentId}'`
		});
		if (existing.totalItems > 0) {
			return json({ message: 'Booking entity already assigned to this event' }, { status: 409 });
		}

		const payload: Record<string, any> = {
			event: params.id,
			talent: bookingEntityType === 'individual' ? talentId : null,
			role: role ?? 'player',
			rateOverride: rateOverride ?? null,
			confirmedRate,
			status: status ?? 'confirmed',
			bonusEligible: false,
			bonusEarned: false
		};
		if (bookingEntityType === 'group') {
			payload.talentGroup = talentGroupId;
			payload.bookingEntityType = 'group';
		}

		const record = await pb.collection('event_talent').create(payload);

		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to assign talent' }, { status: 400 });
	}
};
