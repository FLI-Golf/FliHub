/**
 * POST /api/events/[id]/talent
 * Assigns a talent member to an event. Sets confirmedRate from rateOverride
 * or falls back to the event's defaultRate.
 */
import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

function normalizeBookingRole(role: unknown): string | undefined {
	if (typeof role !== 'string' || !role.trim()) return undefined;
	if (role === 'celebrity_appearance') return 'player';
	if (role === 'music_act') return 'other';
	return role;
}

export const POST: RequestHandler = async ({ locals, url, request, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const { talentId, talentGroupId, entityType, role, rateOverride, status } = await request.json();
		const bookingEntityType = entityType === 'group' || talentGroupId ? 'group' : 'individual';
		const normalizedRole = normalizeBookingRole(role);

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
		const parsedRateOverride = Number.isFinite(Number(rateOverride)) ? Number(rateOverride) : null;
		const confirmedRate = parsedRateOverride ?? group?.defaultFee ?? event.defaultRate ?? 0;

		// Check for duplicate assignment
		const existing = await pb.collection('event_talent').getList(1, 1, {
			filter: bookingEntityType === 'group'
				? `event = '${params.id}' && talentGroup = '${talentGroupId}'`
				: `event = '${params.id}' && talent = '${talentId}'`,
			expand: 'talent,talentGroup'
		});
		if (existing.totalItems > 0) {
			const already = existing.items?.[0] ?? null;
			if (!already?.id) {
				return json({ message: 'Existing booking not found' }, { status: 404 });
			}

			const updatePayload: Record<string, any> = {
				bookingEntityType,
				role: normalizedRole ?? already.role ?? 'player',
				status: status ?? already.status ?? 'invited'
			};
			if (parsedRateOverride !== null) {
				updatePayload.rateOverride = parsedRateOverride;
				updatePayload.confirmedRate = parsedRateOverride;
			}
			if (bookingEntityType === 'group') {
				updatePayload.talentGroup = talentGroupId;
				updatePayload.talent = null;
			} else {
				updatePayload.talent = talentId;
			}

			const updated = await pb.collection('event_talent').update(already.id, updatePayload, {
				expand: 'talent,talentGroup'
			});

			return json({
				...updated,
				upserted: true,
				message: 'Booking already existed and was updated'
			}, { status: 200 });
		}

		const payload: Record<string, any> = {
			event: params.id,
			bookingEntityType,
			talent: bookingEntityType === 'individual' ? talentId : null,
			role: normalizedRole ?? 'player',
			rateOverride: parsedRateOverride ?? confirmedRate,
			confirmedRate,
			status: status ?? 'confirmed',
			bonusEligible: false,
			bonusEarned: false
		};
		if (bookingEntityType === 'group') {
			payload.talentGroup = talentGroupId;
		}

		const record = await pb.collection('event_talent').create(payload);

		return json(record, { status: 201 });
	} catch (err: any) {
		const detail = err?.response?.data
			? ` ${JSON.stringify(err.response.data)}`
			: '';
		const message = err?.response?.message ?? err?.message ?? 'Failed to assign talent';
		return json({ message: `${message}${detail}` }, { status: 400 });
	}
};
