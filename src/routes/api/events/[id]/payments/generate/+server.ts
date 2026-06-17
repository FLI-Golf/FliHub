/**
 * POST /api/events/[id]/payments/generate
 *
 * Generates event_payments records for all confirmed talent on an event.
 * Routing logic:
 *   - If event.requiresApproval=true OR payment amount > event.approvalThreshold
 *     → status='approval_required', approvalRoute='approval_pipeline'
 *   - Otherwise → status='pending', approvalRoute='direct'
 *
 * Also creates a manager split payment if the talent has managerCutPercentage > 0.
 * Skips talent that already have a non-cancelled payment for this event.
 *
 * Bonus eligibility: for tournament_broadcast events with a season set,
 * counts how many events in that season the talent has attended (status=completed
 * or confirmed) and flags bonusEligible=true if count >= bonusThreshold.
 */
import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import { autoAssignDirectPaymentsToDraftBundles } from '$lib/server/event-payment-bundles';
import type { RequestHandler } from './$types';

async function ensureEventPaymentApproval(pb: any, payment: any, requestedBy: string | null) {
	if (!payment?.id || payment.status !== 'approval_required') return;
	const marker = `[EP:${payment.id}]`;

	const existingExpense = await pb.collection('expenses').getFirstListItem(
		`notes ~ "${marker}"`
	).catch(() => null as any);

	const expense = existingExpense ?? await pb.collection('expenses').create({
		description: payment.description || `Event payment approval (${payment.paymentType || 'payment'})`,
		amount: Number(payment.amount) || 0,
		status: 'submitted',
		date: new Date().toISOString().slice(0, 10),
		category: 'Executive/Management Staff',
		notes: `${marker} Auto-created from event payment approval requirement.`,
		...(requestedBy ? { submittedBy: requestedBy } : {})
	}).catch((e: any) => {
		console.warn('Failed creating event payment expense:', e?.message);
		return null;
	});
	if (!expense) return;

	const existingApproval = await pb.collection('approvals').getFirstListItem(
		`entityType = "expense" && entityId = "${expense.id}" && status = "pending"`
	).catch(() => null);
	if (existingApproval) return;

	await pb.collection('approvals').create({
		entityType: 'expense',
		entityId: expense.id,
		expenseId: expense.id,
		status: 'pending',
		requestedBy,
		requestedDate: new Date().toISOString(),
		amount: Number(payment.amount) || 0,
		comments: '<p>Event payment requires approval before payout.</p>'
	}).catch(() => null);
}

export const POST: RequestHandler = async ({ locals, url, params }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const requestedBy = guard.ctx.profile?.id
			?? await pb.collection('user_profiles').getFirstListItem('id != ""', { fields: 'id' })
				.then((p: any) => p.id)
				.catch(() => null);

		const event = await pb.collection('special_events').getOne(params.id);
		const confirmedTalent = await pb.collection('event_talent').getFullList({
			filter: `event = '${params.id}' && (status = 'confirmed' || status = 'completed')`,
			expand: 'talent,talentGroup'
		}).catch(() => pb.collection('event_talent').getFullList({
			filter: `event = '${params.id}' && (status = 'confirmed' || status = 'completed')`,
			expand: 'talent'
		}));

		if (confirmedTalent.length === 0) {
			return json({ message: 'No confirmed talent to generate payments for' });
		}

		// Existing non-cancelled payments for this event (to avoid duplicates)
		const existingPayments = await pb.collection('event_payments').getFullList({
			filter: `event = '${params.id}' && status != 'cancelled'`,
			fields: 'eventTalent'
		});
		const alreadyPaid = new Set(existingPayments.map(p => p.eventTalent));

		const approvalThreshold = event.approvalThreshold ?? 500;
		const isBroadcast = event.eventType === 'tournament_broadcast';
		const paymentTypeFor = (role: string) => {
			if (role === 'broadcaster' || role === 'commentator' || role === 'analyst') return 'broadcast_fee';
			return 'appearance_fee';
		};

		// For bonus eligibility: count events attended per talent in this season
		let seasonEventIds: string[] = [];
		if (isBroadcast && event.season && event.bonusThreshold) {
			const seasonEvents = await pb.collection('special_events').getFullList({
				filter: `season = '${event.season}' && eventType = 'tournament_broadcast'`,
				fields: 'id'
			});
			seasonEventIds = seasonEvents.map(e => e.id);
		}

		let created = 0;
		let skipped = 0;
		const directPaymentIds: string[] = [];

		for (const et of confirmedTalent) {
			const talentId = et.talent;
			const talentGroupId = et.talentGroup;
			if (alreadyPaid.has(et.id)) { skipped++; continue; }

			const amount = et.confirmedRate ?? event.defaultRate ?? 0;
			const talent = et.expand?.talent;
			const talentGroup = et.expand?.talentGroup;
			const isGroupBooking = et.bookingEntityType === 'group' || !!talentGroupId;
			const managerCut = isGroupBooking ? 0 : talent?.managerCutPercentage ?? 0;
			const managerAmount = managerCut > 0 ? Math.round(amount * (managerCut / 100) * 100) / 100 : 0;

			// Determine approval routing
			const needsApproval = event.requiresApproval || amount > approvalThreshold;
			const status = needsApproval ? 'approval_required' : 'pending';
			const approvalRoute = needsApproval ? 'approval_pipeline' : 'direct';

			// Bonus eligibility check
			let bonusEligible = false;
			if (!isGroupBooking && isBroadcast && event.season && event.bonusThreshold && seasonEventIds.length > 0) {
				const attended = await pb.collection('event_talent').getList(1, 1, {
					filter: `talent = '${talentId}' && (status = 'confirmed' || status = 'completed') && (${seasonEventIds.map(id => `event = '${id}'`).join(' || ')})`
				});
				bonusEligible = attended.totalItems >= event.bonusThreshold;

				// Update bonusEligible on the event_talent record
				if (bonusEligible !== et.bonusEligible) {
					await pb.collection('event_talent').update(et.id, { bonusEligible });
				}
			}

			// Create talent payment
			const talentPayment = await pb.collection('event_payments').create({
				event: params.id,
				eventTalent: et.id,
				talent: isGroupBooking ? null : talentId,
				...(isGroupBooking ? { talentGroup: talentGroupId } : {}),
				paymentType: paymentTypeFor(et.role),
				amount,
				status,
				approvalRoute,
				recipient: 'talent',
				managerCutPercentage: managerCut,
				managerAmount,
				description: isGroupBooking ? `Group booking fee for ${talentGroup?.name ?? talentGroupId}` : undefined,
				isBonus: false
			});
			await ensureEventPaymentApproval(pb, talentPayment, requestedBy);
			if (approvalRoute === 'direct') directPaymentIds.push(String(talentPayment.id));

			// Create manager split payment if applicable
			if (managerAmount > 0 && talent?.managerEmail) {
				const mgNeedsApproval = event.requiresApproval || managerAmount > approvalThreshold;
				const managerPayment = await pb.collection('event_payments').create({
					event: params.id,
					eventTalent: et.id,
					talent: talentId,
					paymentType: paymentTypeFor(et.role),
					amount: managerAmount,
					status: mgNeedsApproval ? 'approval_required' : 'pending',
					approvalRoute: mgNeedsApproval ? 'approval_pipeline' : 'direct',
					recipient: 'manager',
					description: `Manager cut for ${talent?.name ?? talentId}`,
					isBonus: false
				});
				await ensureEventPaymentApproval(pb, managerPayment, requestedBy);
				if ((mgNeedsApproval ? 'approval_pipeline' : 'direct') === 'direct') {
					directPaymentIds.push(String(managerPayment.id));
				}
			}

			// Create bonus payment if eligible and not yet earned.
			// Guard against duplicates across all events in the season.
			if (bonusEligible && !et.bonusEarned && event.bonusAmount && seasonEventIds.length > 0) {
				const existingBonus = await pb.collection('event_payments').getList(1, 1, {
					filter: `talent = '${talentId}' && isBonus = true && status != 'cancelled' && (${seasonEventIds.map((id: string) => `event = '${id}'`).join(' || ')})`
				}).catch(() => ({ totalItems: 0 }));

				if (existingBonus.totalItems === 0) {
					const bonusPayment = await pb.collection('event_payments').create({
						event: params.id,
						eventTalent: et.id,
						talent: talentId,
						paymentType: 'bonus',
						amount: event.bonusAmount,
						status: 'approval_required',
						approvalRoute: 'approval_pipeline',
						recipient: 'talent',
						description: `Attendance bonus — completed ${event.bonusThreshold} events`,
						isBonus: true
					});
					await ensureEventPaymentApproval(pb, bonusPayment, requestedBy);
				}
			}

			created++;
		}

		let bundleAssignment = { assigned: 0, createdBundles: 0, skipped: 0, bundleIds: [] as string[] };
		if (directPaymentIds.length > 0) {
			bundleAssignment = await autoAssignDirectPaymentsToDraftBundles(pb, directPaymentIds);
		}

		return json({
			message: `Generated payments for ${created} talent member${created !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped — already have payments)` : ''}`,
			created,
			skipped,
			bundleAssignment
		});
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to generate payments' }, { status: 500 });
	}
};
