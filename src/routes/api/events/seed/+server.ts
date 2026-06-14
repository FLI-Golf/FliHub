/**
 * POST /api/events/seed        — seed test events
 * DELETE /api/events/seed      — clear all seed events (tagged [seed])
 *
 * Only callable in non-production environments or by admin users.
 */
import { json } from '@sveltejs/kit';
import { requireAdminNonProductionApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

const SEASON_ID = 't9yegq2db2sml8j';

const T = {
	gannon:  'caxypp9fv95sf0n',
	ricky:   'jzhlpxvrtg5cqkd',
	eagle:   'u64edbgz387b9wb',
	paige:   'y0sqz8izif7ydax',
	kristin: '4a7zof0wdg376pv',
	catrina: 'ziblxn00eqcxz0u',
	paul_u:  '7g75nzujxwz3s7r',
	kona:    'bxsq87nz5aqxunv',
	brad:    'pzaau2h1r5yeuij',
	brodie:  'b0r4zi2j1aso8c8',
};

async function clearSeed(pb: any) {
	const cols = ['event_payments', 'event_tasks', 'event_talent'];
	let deleted = 0;
	for (const col of cols) {
		const records = await pb.collection(col).getFullList({ fields: 'id' }).catch(() => []);
		for (const r of records) { await pb.collection(col).delete(r.id).catch(() => {}); deleted++; }
	}
	const events = await pb.collection('special_events').getFullList({ filter: 'notes ~ "[seed]"', fields: 'id' }).catch(() => []);
	for (const e of events) { await pb.collection('special_events').delete(e.id).catch(() => {}); deleted++; }
	return { deleted, events: events.length };
}

async function createEvent(pb: any, data: Record<string, unknown>) {
	return pb.collection('special_events').create({ ...data, notes: `${data.notes ?? ''} [seed]`.trim() });
}

async function assignTalent(pb: any, eventId: string, talentId: string, role: string, rateOverride: number | null, status = 'confirmed') {
	const event = await pb.collection('special_events').getOne(eventId);
	return pb.collection('event_talent').create({
		event: eventId, talent: talentId, role,
		rateOverride, confirmedRate: rateOverride ?? event.defaultRate ?? 0,
		status, bonusEligible: false, bonusEarned: false
	});
}

async function addTask(pb: any, eventId: string, data: Record<string, unknown>) {
	return pb.collection('event_tasks').create({ event: eventId, status: 'todo', checklist: [], ...data });
}

async function generatePayments(pb: any, eventId: string) {
	const event = await pb.collection('special_events').getOne(eventId);
	const confirmedTalent = await pb.collection('event_talent').getFullList({
		filter: `event = '${eventId}' && (status = 'confirmed' || status = 'completed')`,
		expand: 'talent'
	});
	const existing = await pb.collection('event_payments').getFullList({ filter: `event = '${eventId}' && status != 'cancelled'`, fields: 'talent' });
	const alreadyPaid = new Set(existing.map((p: any) => p.talent));
	const threshold = event.approvalThreshold ?? 500;
	const isBroadcast = event.eventType === 'tournament_broadcast';

	let seasonEventIds: string[] = [];
	if (isBroadcast && event.season && event.bonusThreshold) {
		const se = await pb.collection('special_events').getFullList({ filter: `season = '${event.season}' && eventType = 'tournament_broadcast'`, fields: 'id' });
		seasonEventIds = se.map((e: any) => e.id);
	}

	let created = 0;
	for (const et of confirmedTalent) {
		if (alreadyPaid.has(et.talent)) continue;
		const amount = et.confirmedRate ?? event.defaultRate ?? 0;
		const talent = et.expand?.talent;
		const cut = talent?.managerCutPercentage ?? 0;
		const mgAmt = cut > 0 ? Math.round(amount * (cut / 100) * 100) / 100 : 0;
		const needsApproval = event.requiresApproval || amount > threshold;
		const status = needsApproval ? 'approval_required' : 'pending';
		const route = needsApproval ? 'approval_pipeline' : 'direct';

		let bonusEligible = false;
		if (isBroadcast && seasonEventIds.length > 0 && event.bonusThreshold) {
			const attended = await pb.collection('event_talent').getList(1, 1, {
				filter: `talent = '${et.talent}' && (status = 'confirmed' || status = 'completed') && (${seasonEventIds.map((id: string) => `event = '${id}'`).join(' || ')})`
			});
			bonusEligible = attended.totalItems >= event.bonusThreshold;
			if (bonusEligible !== et.bonusEligible) await pb.collection('event_talent').update(et.id, { bonusEligible });
		}

		await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee', amount, status, approvalRoute: route, recipient: 'talent', managerCutPercentage: cut, managerAmount: mgAmt, isBonus: false });

		if (mgAmt > 0) {
			await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee', amount: mgAmt, status: event.requiresApproval || mgAmt > threshold ? 'approval_required' : 'pending', approvalRoute: event.requiresApproval || mgAmt > threshold ? 'approval_pipeline' : 'direct', recipient: 'manager', description: `Manager cut for ${talent?.name ?? et.talent}`, isBonus: false });
		}

		if (bonusEligible && !et.bonusEarned && event.bonusAmount && seasonEventIds.length > 0) {
			const existingBonus = await pb.collection('event_payments').getList(1, 1, { filter: `talent = '${et.talent}' && isBonus = true && status != 'cancelled' && (${seasonEventIds.map((id: string) => `event = '${id}'`).join(' || ')})` }).catch(() => ({ totalItems: 0 }));
			if (existingBonus.totalItems === 0) {
				await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: 'bonus', amount: event.bonusAmount, status: 'approval_required', approvalRoute: 'approval_pipeline', recipient: 'talent', description: `Attendance bonus — completed ${event.bonusThreshold} events`, isBonus: true });
			}
		}
		created++;
	}
	return created;
}

async function runSeed(pb: any) {
	const base = { approvalThreshold: 500, requiresApproval: false };

	const appearance = await createEvent(pb, { ...base, name: "Children's Hospital Appearance", eventType: 'appearance', eventDate: '2027-03-15 00:00:00.000Z', location: "Phoenix Children's Hospital, Phoenix AZ", status: 'scheduled', defaultRate: 300, budget: 700, description: '<p>Two players visit the pediatric ward for a 2-hour appearance.</p>' });
	await assignTalent(pb, appearance.id, T.gannon, 'player', null);
	await assignTalent(pb, appearance.id, T.eagle, 'player', null);
	await addTask(pb, appearance.id, { title: 'Confirm hospital contact', priority: 'high', dueDate: '2027-03-01 00:00:00.000Z' });
	await addTask(pb, appearance.id, { title: 'Order 20 discs for giveaway', priority: 'medium', hasCost: true, estimatedCost: 180 });
	await addTask(pb, appearance.id, { title: 'Send travel itinerary to players', priority: 'medium' });
	await generatePayments(pb, appearance.id);

	const clinic = await createEvent(pb, { ...base, name: 'Youth Disc Golf Clinic — Scottsdale', eventType: 'clinic', eventDate: '2027-04-05 00:00:00.000Z', location: 'Chaparral Park, Scottsdale AZ', status: 'scheduled', defaultRate: 750, budget: 1000, description: '<p>3-hour instructional clinic for youth players aged 10–18.</p>' });
	await assignTalent(pb, clinic.id, T.ricky, 'player', null);
	await addTask(pb, clinic.id, { title: 'Book park permit', priority: 'urgent', hasCost: true, estimatedCost: 75 });
	await addTask(pb, clinic.id, { title: 'Prepare clinic curriculum', priority: 'high' });
	await generatePayments(pb, clinic.id);

	const media = await createEvent(pb, { ...base, name: 'Disc Golf World Magazine Shoot', eventType: 'media', eventDate: '2027-04-20 00:00:00.000Z', location: 'Sedona, AZ', status: 'scheduled', defaultRate: 400, budget: 600, requiresApproval: true, description: '<p>Full-day photo shoot for DGW cover feature.</p>' });
	await assignTalent(pb, media.id, T.paige, 'player', null);
	await assignTalent(pb, media.id, T.kristin, 'player', 450);
	await addTask(pb, media.id, { title: 'Coordinate with photographer', priority: 'high' });
	await addTask(pb, media.id, { title: 'Arrange hair/makeup', priority: 'medium', hasCost: true, estimatedCost: 250, requiresApproval: true });
	await generatePayments(pb, media.id);

	await pb.collection('talent').update(T.gannon, { managerCutPercentage: 15, managerName: 'Scott Buhr', managerEmail: 'scott.buhr@test.com' }).catch(() => {});
	const promo = await createEvent(pb, { ...base, name: 'FLI Golf Expo Booth — Las Vegas', eventType: 'promotional', eventDate: '2027-05-10 00:00:00.000Z', location: 'Las Vegas Convention Center, NV', status: 'scheduled', defaultRate: 500, budget: 1200, description: '<p>2-day expo appearance. Players sign autographs and demo discs.</p>' });
	await assignTalent(pb, promo.id, T.gannon, 'player', null);
	await assignTalent(pb, promo.id, T.catrina, 'player', null);
	await addTask(pb, promo.id, { title: 'Ship booth materials', priority: 'high', hasCost: true, estimatedCost: 350, requiresApproval: true });
	await addTask(pb, promo.id, { title: 'Book hotel for players', priority: 'high', hasCost: true, estimatedCost: 400, requiresApproval: true });
	await generatePayments(pb, promo.id);

	const content = await createEvent(pb, { ...base, name: 'FLI Golf YouTube Series — Episode 3', eventType: 'content_creation', eventDate: '2027-05-25 00:00:00.000Z', location: 'Fountain Hills, AZ', status: 'draft', defaultRate: 200, budget: 500, description: '<p>Brodie hosts a course vlog with two pros.</p>' });
	await assignTalent(pb, content.id, T.brodie, 'broadcaster', null);
	await assignTalent(pb, content.id, T.eagle, 'player', 150);
	await addTask(pb, content.id, { title: 'Scout filming locations', priority: 'medium' });
	await addTask(pb, content.id, { title: 'Arrange drone operator', priority: 'high', hasCost: true, estimatedCost: 300, requiresApproval: true });

	const broadcastBase = { eventType: 'tournament_broadcast', season: SEASON_ID, defaultRate: 600, budget: 2500, approvalThreshold: 500, requiresApproval: false, bonusAmount: 500, bonusThreshold: 3, description: '<p>Live broadcast coverage.</p>' };
	const bc1 = await createEvent(pb, { ...broadcastBase, name: 'FLI Open Broadcast — Round 1', eventDate: '2027-06-01 00:00:00.000Z', location: 'Phoenix, AZ', status: 'completed' });
	const bc2 = await createEvent(pb, { ...broadcastBase, name: 'FLI Open Broadcast — Round 2', eventDate: '2027-06-02 00:00:00.000Z', location: 'Phoenix, AZ', status: 'completed' });
	const bc3 = await createEvent(pb, { ...broadcastBase, name: 'FLI Open Broadcast — Finals', eventDate: '2027-06-03 00:00:00.000Z', location: 'Phoenix, AZ', status: 'scheduled' });

	for (const bcId of [bc1.id, bc2.id, bc3.id]) {
		await assignTalent(pb, bcId, T.paul_u, 'broadcaster', null, bcId === bc3.id ? 'confirmed' : 'completed');
		await assignTalent(pb, bcId, T.kona, 'broadcaster', null, bcId === bc3.id ? 'confirmed' : 'completed');
	}
	await assignTalent(pb, bc1.id, T.brad, 'broadcaster', null, 'completed');
	await assignTalent(pb, bc2.id, T.brad, 'broadcaster', null, 'completed');
	await addTask(pb, bc3.id, { title: 'Set up broadcast equipment', priority: 'urgent' });
	await addTask(pb, bc3.id, { title: 'Prepare graphics package', priority: 'medium', hasCost: true, estimatedCost: 400, requiresApproval: true });

	await generatePayments(pb, bc1.id);
	await generatePayments(pb, bc2.id);
	await generatePayments(pb, bc3.id);

	return { events: 8 };
}

export const POST: RequestHandler = async ({ locals, url }) => {
	try {
		const guard = await requireAdminNonProductionApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const result = await runSeed(pb);
		return json({ ok: true, message: `Seeded ${result.events} test events` });
	} catch (err: any) {
		return json({ ok: false, message: err.message ?? 'Seed failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	try {
		const guard = await requireAdminNonProductionApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const result = await clearSeed(pb);
		return json({ ok: true, message: `Cleared ${result.events} seed events and related records` });
	} catch (err: any) {
		return json({ ok: false, message: err.message ?? 'Clear failed' }, { status: 500 });
	}
};
