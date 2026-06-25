/**
 * POST /api/events/seed        — seed test events
 * DELETE /api/events/seed      — clear all seed events (tagged [seed])
 * PATCH /api/events/seed       — reset (clear + re-seed)
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
	kevin:   '70c06glx02o54zd',
};

async function clearSeed(pb: any) {
	const cols = ['event_payments', 'event_tasks', 'event_talent'];
	let deleted = 0;
	const deletedPaymentIds: string[] = [];
	const summary = {
		eventPayments: 0,
		eventTasks: 0,
		eventTalent: 0,
		seedEvents: 0,
		approvalExpenses: 0,
		linkedApprovals: 0,
		legacyApprovals: 0
	};
	for (const col of cols) {
		const records = await pb.collection(col).getFullList({ fields: 'id' }).catch(() => []);
		for (const r of records) {
			if (col === 'event_payments') deletedPaymentIds.push(r.id);
			await pb.collection(col).delete(r.id).catch(() => {});
			if (col === 'event_payments') summary.eventPayments++;
			if (col === 'event_tasks') summary.eventTasks++;
			if (col === 'event_talent') summary.eventTalent++;
			deleted++;
		}
	}
	if (deletedPaymentIds.length > 0) {
		for (const paymentId of deletedPaymentIds) {
			const marker = `[EP:${paymentId}]`;
			const expense = await pb.collection('expenses').getFirstListItem(
				`notes ~ "${marker}"`
			).catch(() => null as any);
			if (!expense) continue;
			const linkedApprovals = await pb.collection('approvals').getFullList({
				filter: `entityType = "expense" && entityId = "${expense.id}"`,
				fields: 'id'
			}).catch(() => []);
			for (const a of linkedApprovals as any[]) {
				await pb.collection('approvals').delete(a.id).catch(() => null);
				summary.linkedApprovals++;
			}
			await pb.collection('expenses').delete(expense.id).catch(() => null);
			summary.approvalExpenses++;
		}
	}

	// Safety sweep for any lingering event-payment approval records created during testing.
	const seedApprovalExpenses = await pb.collection('expenses').getFullList({
		filter: `notes ~ "[EP:"`,
		fields: 'id'
	}).catch(() => []);
	for (const expense of seedApprovalExpenses as any[]) {
		const approvals = await pb.collection('approvals').getFullList({
			filter: `entityType = "expense" && entityId = "${expense.id}"`,
			fields: 'id'
		}).catch(() => []);
		for (const a of approvals as any[]) {
			await pb.collection('approvals').delete(a.id).catch(() => null);
			summary.linkedApprovals++;
		}
		await pb.collection('expenses').delete(expense.id).catch(() => null);
		summary.approvalExpenses++;
	}

	// Cleanup legacy records from earlier event_payment approval experiments.
	const legacyApprovals = await pb.collection('approvals').getFullList({
		filter: `entityType = "event_payment"`,
		fields: 'id'
	}).catch(() => []);
	for (const a of legacyApprovals as any[]) {
		await pb.collection('approvals').delete(a.id).catch(() => null);
		summary.legacyApprovals++;
	}

	const events = await pb.collection('special_events').getFullList({ filter: 'notes ~ "[seed]"', fields: 'id' }).catch(() => []);
	for (const e of events) {
		await pb.collection('special_events').delete(e.id).catch(() => {});
		summary.seedEvents++;
		deleted++;
	}
	return { deleted, events: summary.seedEvents, summary };
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
	const requestedBy = await pb.collection('user_profiles').getFirstListItem('id != ""', { fields: 'id' })
		.then((p: any) => p.id)
		.catch(() => null);
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

		const talentPayment = await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee', amount, status, approvalRoute: route, recipient: 'talent', managerCutPercentage: cut, managerAmount: mgAmt, isBonus: false });
		if (status === 'approval_required') {
			const marker = `[EP:${talentPayment.id}]`;
			const expense = await pb.collection('expenses').create({
				description: `Event payment approval (${isBroadcast ? 'broadcast_fee' : 'appearance_fee'}) - Payee: ${talent?.name ?? et.talent}`,
				amount: Number(amount) || 0,
				status: 'submitted',
				date: new Date().toISOString().slice(0, 10),
				category: 'Executive/Management Staff',
				notes: `${marker} Auto-created from seed payment requiring approval.`,
				...(requestedBy ? { submittedBy: requestedBy } : {})
			}).catch(() => null);
			if (expense) {
				await pb.collection('approvals').create({
				entityType: 'expense',
				entityId: expense.id,
				expenseId: expense.id,
				status: 'pending',
				requestedBy,
				requestedDate: new Date().toISOString(),
				amount: Number(amount) || 0,
				comments: '<p>Event payment requires approval before payout.</p>'
				}).catch(() => null);
			}
		}

		if (mgAmt > 0) {
			const managerNeedsApproval = event.requiresApproval || mgAmt > threshold;
			const managerPayment = await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee', amount: mgAmt, status: managerNeedsApproval ? 'approval_required' : 'pending', approvalRoute: managerNeedsApproval ? 'approval_pipeline' : 'direct', recipient: 'manager', description: `Manager cut for ${talent?.name ?? et.talent}`, isBonus: false });
			if (managerNeedsApproval) {
				const marker = `[EP:${managerPayment.id}]`;
				const expense = await pb.collection('expenses').create({
					description: `Manager split approval (${isBroadcast ? 'broadcast_fee' : 'appearance_fee'})`,
					amount: Number(mgAmt) || 0,
					status: 'submitted',
					date: new Date().toISOString().slice(0, 10),
					category: 'Executive/Management Staff',
					notes: `${marker} Auto-created from seed manager payment requiring approval.`,
					...(requestedBy ? { submittedBy: requestedBy } : {})
				}).catch(() => null);
				if (expense) {
					await pb.collection('approvals').create({
					entityType: 'expense',
					entityId: expense.id,
					expenseId: expense.id,
					status: 'pending',
					requestedBy,
					requestedDate: new Date().toISOString(),
					amount: Number(mgAmt) || 0,
					comments: '<p>Manager split payment requires approval before payout.</p>'
					}).catch(() => null);
				}
			}
		}

		if (bonusEligible && !et.bonusEarned && event.bonusAmount && seasonEventIds.length > 0) {
			const existingBonus = await pb.collection('event_payments').getList(1, 1, { filter: `talent = '${et.talent}' && isBonus = true && status != 'cancelled' && (${seasonEventIds.map((id: string) => `event = '${id}'`).join(' || ')})` }).catch(() => ({ totalItems: 0 }));
			if (existingBonus.totalItems === 0) {
				const bonusPayment = await pb.collection('event_payments').create({ event: eventId, eventTalent: et.id, talent: et.talent, paymentType: 'bonus', amount: event.bonusAmount, status: 'approval_required', approvalRoute: 'approval_pipeline', recipient: 'talent', description: `Attendance bonus — completed ${event.bonusThreshold} events`, isBonus: true });
				const marker = `[EP:${bonusPayment.id}]`;
				const expense = await pb.collection('expenses').create({
					description: `Bonus payment approval - Payee: ${talent?.name ?? et.talent}`,
					amount: Number(event.bonusAmount) || 0,
					status: 'submitted',
					date: new Date().toISOString().slice(0, 10),
					category: 'Executive/Management Staff',
					notes: `${marker} Auto-created from seed bonus payment requiring approval.`,
					...(requestedBy ? { submittedBy: requestedBy } : {})
				}).catch(() => null);
				if (expense) {
					await pb.collection('approvals').create({
					entityType: 'expense',
					entityId: expense.id,
					expenseId: expense.id,
					status: 'pending',
					requestedBy,
					requestedDate: new Date().toISOString(),
					amount: Number(event.bonusAmount) || 0,
					comments: '<p>Bonus payment requires approval before payout.</p>'
					}).catch(() => null);
				}
			}
		}
		created++;
	}
	return created;
}

type TournamentRef = { id: string; name: string };

async function getTournamentRef(pb: any, season: number, tournamentNumber: number): Promise<TournamentRef | null> {
	try {
		const t = await pb.collection('tournaments').getFirstListItem(`season = ${season} && tournamentNumber = ${tournamentNumber}`);
		return t ? { id: t.id, name: t.name } : null;
	} catch {
		return null;
	}
}

async function runSeed(pb: any) {
	const base = { approvalThreshold: 500, requiresApproval: false };
	const TOURNAMENT_COUNT = 6;
	const BROADCAST_INFRA_TOTAL = 1_000_000; // from Use of Proceeds: Broadcast Infrastructure
	const EXEC_TRAVEL_2027_TOTAL = 60_000; // from dashboard/travel-budget (2027)
	const ENTERTAINMENT_2027_TOTAL = 600_000; // from dashboard/entertainment (2027)
	const BROADCAST_BUDGET_PER_TOURNAMENT = Math.round(BROADCAST_INFRA_TOTAL / TOURNAMENT_COUNT);
	const TRAVEL_BUDGET_PER_TOURNAMENT = Math.round(EXEC_TRAVEL_2027_TOTAL / TOURNAMENT_COUNT);
	const ENTERTAINMENT_BUDGET_PER_TOURNAMENT = Math.round(ENTERTAINMENT_2027_TOTAL / TOURNAMENT_COUNT);
	const BROADCAST_EVENT_BUDGET = BROADCAST_BUDGET_PER_TOURNAMENT + TRAVEL_BUDGET_PER_TOURNAMENT + ENTERTAINMENT_BUDGET_PER_TOURNAMENT;
	const FLAT_BROADCASTER_RATE = 10_000;

	// Fetch tournament references for realistic event naming + links
	const t1 = await getTournamentRef(pb, 2027, 1);
	const t2 = await getTournamentRef(pb, 2027, 2);
	const t3 = await getTournamentRef(pb, 2027, 3);
	const t4 = await getTournamentRef(pb, 2027, 4);
	const t5 = await getTournamentRef(pb, 2027, 5);
	const t6 = await getTournamentRef(pb, 2027, 6);

	const tn = (t: TournamentRef | null, fallback: string) => t?.name ?? fallback;

	const appearance = await createEvent(pb, { ...base, ...(t1 && { tournament: t1.id }), name: `${tn(t1, 'FLI Golf Season Opener')} — Community Appearance`, eventType: 'appearance', eventDate: '2027-03-15 00:00:00.000Z', location: "Phoenix Children's Hospital, Phoenix AZ", status: 'scheduled', defaultRate: 300, budget: 700, description: '<p>Two players visit the pediatric ward for a 2-hour appearance.</p>' });
	await assignTalent(pb, appearance.id, T.gannon, 'player', null);
	await assignTalent(pb, appearance.id, T.eagle, 'player', null);
	await addTask(pb, appearance.id, { title: 'Confirm hospital contact', priority: 'high', dueDate: '2027-03-01 00:00:00.000Z' });
	await addTask(pb, appearance.id, { title: 'Order 20 discs for giveaway', priority: 'medium', hasCost: true, estimatedCost: 180 });
	await addTask(pb, appearance.id, { title: 'Send travel itinerary to players', priority: 'medium' });
	await generatePayments(pb, appearance.id);

	const clinic = await createEvent(pb, { ...base, ...(t2 && { tournament: t2.id }), name: `${tn(t2, 'Spring Championship')} — Youth Disc Golf Clinic`, eventType: 'clinic', eventDate: '2027-04-05 00:00:00.000Z', location: 'San Pedro, CA', status: 'scheduled', defaultRate: 750, budget: 1000, description: '<p>3-hour instructional clinic for youth players aged 10–18.</p>' });
	await assignTalent(pb, clinic.id, T.ricky, 'player', null);
	await addTask(pb, clinic.id, { title: 'Book park permit', priority: 'urgent', hasCost: true, estimatedCost: 75 });
	await addTask(pb, clinic.id, { title: 'Prepare clinic curriculum', priority: 'high' });
	await generatePayments(pb, clinic.id);

	const media = await createEvent(pb, { ...base, ...(t3 && { tournament: t3.id }), name: `${tn(t3, 'Mid-Season Classic')} — Media Day`, eventType: 'media', eventDate: '2027-04-20 00:00:00.000Z', location: 'Sedona, AZ', status: 'scheduled', defaultRate: 400, budget: 600, requiresApproval: true, description: '<p>Full-day photo shoot for DGW cover feature.</p>' });
	await assignTalent(pb, media.id, T.paige, 'player', null);
	await assignTalent(pb, media.id, T.kristin, 'player', 450);
	await addTask(pb, media.id, { title: 'Coordinate with photographer', priority: 'high' });
	await addTask(pb, media.id, { title: 'Arrange hair/makeup', priority: 'medium', hasCost: true, estimatedCost: 250, requiresApproval: true });
	await generatePayments(pb, media.id);

	await pb.collection('talent').update(T.gannon, { managerCutPercentage: 15, managerName: 'Scott Buhr', managerEmail: 'scott.buhr@test.com' }).catch(() => {});
	const promo = await createEvent(pb, { ...base, ...(t4 && { tournament: t4.id }), name: `${tn(t4, 'Summer Showdown')} — Fan Promo Booth`, eventType: 'promotional', eventDate: '2027-05-10 00:00:00.000Z', location: 'Las Vegas Convention Center, NV', status: 'scheduled', defaultRate: 500, budget: 1200, description: '<p>2-day expo appearance. Players sign autographs and demo discs.</p>' });
	await assignTalent(pb, promo.id, T.gannon, 'player', null);
	await assignTalent(pb, promo.id, T.catrina, 'player', null);
	await addTask(pb, promo.id, { title: 'Ship booth materials', priority: 'high', hasCost: true, estimatedCost: 350, requiresApproval: true });
	await addTask(pb, promo.id, { title: 'Book hotel for players', priority: 'high', hasCost: true, estimatedCost: 400, requiresApproval: true });
	await generatePayments(pb, promo.id);

	const content = await createEvent(pb, { ...base, ...(t5 && { tournament: t5.id }), name: `${tn(t5, 'Fall Invitational')} — Content Shoot`, eventType: 'content_creation', eventDate: '2027-05-25 00:00:00.000Z', location: 'Fountain Hills, AZ', status: 'scheduled', defaultRate: 200, budget: 500, description: '<p>Brodie hosts a course vlog with two pros.</p>' });
	await assignTalent(pb, content.id, T.brodie, 'broadcaster', null);
	await assignTalent(pb, content.id, T.eagle, 'player', 150);
	await addTask(pb, content.id, { title: 'Scout filming locations', priority: 'medium' });
	await addTask(pb, content.id, { title: 'Arrange drone operator', priority: 'high', hasCost: true, estimatedCost: 300, requiresApproval: true });

	// Tournament broadcast events — one per tournament using actual dates & locations.
	// These budgets map to Use of Proceeds pillars and force realistic approval flow.
	const broadcastBase = {
		eventType: 'tournament_broadcast',
		season: SEASON_ID,
		defaultRate: FLAT_BROADCASTER_RATE,
		budget: BROADCAST_EVENT_BUDGET,
		approvalThreshold: 7_500,
		requiresApproval: false,
		description: '<p>Live tournament broadcast coverage. Broadcasters handle play-by-play, analysis, social clips, and sponsor integrations.</p><p>Budget modeled from Use of Proceeds + Travel Budget + Entertainment (2027 baseline).</p>'
	};

	const broadcastEvents: string[] = [];

	const createBroadcast = async (tRef: TournamentRef | null) => {
		if (!tRef) return null;
		const t = await pb.collection('tournaments').getOne(tRef.id, { fields: 'name,startDate,location,venue' });
		const bcEvent = await createEvent(pb, {
			...broadcastBase,
			tournament: t.id,
			name: `${t.name} — Broadcast`,
			eventDate: t.startDate || '2027-06-01 00:00:00.000Z',
			location: t.location || 'TBD',
			status: 'scheduled'
		});
		broadcastEvents.push(bcEvent.id);
		return bcEvent.id;
	};

	await createBroadcast(t1);
	await createBroadcast(t2);
	await createBroadcast(t3);
	await createBroadcast(t4);
	await createBroadcast(t5);
	await createBroadcast(t6);

	// Assign broadcasters + finance-pillar tasks to each tournament broadcast.
	const coreLineup = [
		{ talentId: T.paul_u, role: 'commentator' },
		{ talentId: T.kona, role: 'analyst' },
		{ talentId: T.brad, role: 'analyst' },
		{ talentId: T.brodie, role: 'broadcaster' },
		{ talentId: T.kevin, role: 'broadcaster' },
	];
	const celebrityActs = ['Riley Knox', 'Ava Sterling', 'Damon Vale', 'Nia Cross', 'Mason Hart', 'Skyler Dean'];
	const musicActs = ['Neon Valley', 'Echo Harbor', 'Velvet Current', 'Luna Drift', 'Signal Arcade', 'Copper Avenue'];

	for (let i = 0; i < broadcastEvents.length; i++) {
		const bcId = broadcastEvents[i];

		for (const slot of coreLineup) {
			await assignTalent(pb, bcId, slot.talentId, slot.role, FLAT_BROADCASTER_RATE, 'confirmed');
		}

		// Department tasks derived from finance section (Use of Proceeds pillar mix).
		const productionOpsCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.6);
		const mediaCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.2);
		const leagueOpsCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.12);
		const marketingReserveCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.08);

		// Travel Budget categories (2027 baseline split across 6 tournaments)
		const travelAirfare = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (25_000 / 60_000));
		const travelLodging = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (15_000 / 60_000));
		const travelAuto = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (10_000 / 60_000));
		const travelPerDiem = TRAVEL_BUDGET_PER_TOURNAMENT - travelAirfare - travelLodging - travelAuto;

		// Entertainment categories (2027 baseline per-event model)
		const entertainmentCelebrity = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (30_000 / 100_000));
		const entertainmentMusic = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (45_000 / 100_000));
		const entertainmentTravel = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (10_000 / 100_000));
		const entertainmentHospitality = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (7_500 / 100_000));
		const entertainmentBookingFees = ENTERTAINMENT_BUDGET_PER_TOURNAMENT - entertainmentCelebrity - entertainmentMusic - entertainmentTravel - entertainmentHospitality;

		await addTask(pb, bcId, {
			title: '[Event Production & Technology] Live Broadcast Truck + Scoring Feed Sync',
			priority: 'urgent',
			hasCost: true,
			estimatedCost: productionOpsCost,
			requiresApproval: true,
			description: 'Switcher, replay system, encoding, and real-time scoring data feed operations.',
			checklist: ['Truck load-in complete', 'Replay/graphics channels verified', 'Scoring feed latency < 2s']
		});

		await addTask(pb, bcId, {
			title: '[Media & Content Buildout] Social Clips + Post-Round Highlights',
			priority: 'high',
			hasCost: true,
			estimatedCost: mediaCost,
			requiresApproval: true,
			description: 'Package short-form highlights and sponsor-tagged content from tournament day coverage.',
			checklist: ['Clip list approved', 'Sponsor tags embedded', 'Post-round recap delivered']
		});

		await addTask(pb, bcId, {
			title: '[League Operations & Team Development] Broadcast Crew Travel + Per Diem',
			priority: 'medium',
			hasCost: true,
			estimatedCost: leagueOpsCost,
			requiresApproval: true,
			description: 'Travel, lodging, and per diem for on-site commentary and technical crew.',
			checklist: ['Flights booked', 'Hotel rooming list finalized', 'Per diem reconciled']
		});

		await addTask(pb, bcId, {
			title: '[Marketing, Working Capital & Reserve] Sponsor Ad Insert + Contingency',
			priority: 'medium',
			hasCost: true,
			estimatedCost: marketingReserveCost,
			requiresApproval: true,
			description: 'Sponsor ad-slot integration QA and day-of contingency reserve for schedule shifts.',
			checklist: ['Ad slate validated', 'Backup creative loaded', 'Contingency reserve logged']
		});

		await addTask(pb, bcId, {
			title: '[Travel Budget] Airfare Block - Broadcast Crew',
			priority: 'high',
			hasCost: true,
			estimatedCost: travelAirfare,
			requiresApproval: true,
			description: 'Executive travel budget allocation for domestic flight routing to tournament site.',
			checklist: ['Round-trip flights ticketed', 'Carrier rates benchmarked', 'Schedule buffer approved']
		});

		await addTask(pb, bcId, {
			title: '[Travel Budget] Lodging Block + Crew Auto Rental + Per Diem',
			priority: 'medium',
			hasCost: true,
			estimatedCost: travelLodging + travelAuto + travelPerDiem,
			requiresApproval: true,
			description: 'Hotel, ground transportation, and per diem from 2027 executive travel budget model.',
			checklist: ['Hotel nights reserved', 'Rental vehicles confirmed', 'Per diem envelopes reconciled']
		});

		await addTask(pb, bcId, {
			title: `[Entertainment] Celebrity Appearance - ${celebrityActs[i] ?? `Guest ${i + 1}`}`,
			priority: 'medium',
			hasCost: true,
			estimatedCost: entertainmentCelebrity,
			requiresApproval: true,
			description: 'Tournament trophy ceremony and sponsor meet-and-greet appearance package.',
			checklist: ['Talent rider accepted', 'Backstage call time set', 'Sponsor photo-line scheduled']
		});

		await addTask(pb, bcId, {
			title: `[Entertainment] Music Act - ${musicActs[i] ?? `Live Act ${i + 1}`}`,
			priority: 'medium',
			hasCost: true,
			estimatedCost: entertainmentMusic,
			requiresApproval: true,
			description: 'Music performance slot to raise in-venue engagement and dwell time.',
			checklist: ['Stage plot approved', 'Soundcheck complete', 'Set timing aligned to broadcast windows']
		});

		await addTask(pb, bcId, {
			title: '[Entertainment] Talent Travel/Lodging + Hospitality + Booking Fees',
			priority: 'low',
			hasCost: true,
			estimatedCost: entertainmentTravel + entertainmentHospitality + entertainmentBookingFees,
			requiresApproval: true,
			description: 'Combined entertainment support costs (travel, riders, and booking commissions).',
			checklist: ['Hospitality rider funded', 'Talent transport confirmed', 'Agency fees invoiced']
		});
	}

	// Generate payments for all broadcasts
	for (const bcId of broadcastEvents) {
		await generatePayments(pb, bcId);
	}

	const pendingApprovals = await pb.collection('expenses').getFullList({
		filter: `status = 'submitted' && notes ~ '[EP:'`,
		fields: 'id'
	}).catch(() => []);

	return { events: 6 + broadcastEvents.length, pendingApprovals: pendingApprovals.length };
}

export const POST: RequestHandler = async ({ locals, url }) => {
	try {
		const guard = await requireAdminNonProductionApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const result = await runSeed(pb);
		return json({
			ok: true,
			message: `Seeded ${result.events} test events with ${result.pendingApprovals} payments awaiting approval`,
			events: result.events,
			pendingApprovals: result.pendingApprovals
		});
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
		return json({
			ok: true,
			message: `Cleared ${result.events} seed events and related records`,
			summary: result.summary
		});
	} catch (err: any) {
		return json({ ok: false, message: err.message ?? 'Clear failed' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, url }) => {
	try {
		const guard = await requireAdminNonProductionApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		await clearSeed(pb);
		const result = await runSeed(pb);
		return json({
			ok: true,
			message: `Reset complete: seeded ${result.events} test events with ${result.pendingApprovals} payments awaiting approval`,
			events: result.events,
			pendingApprovals: result.pendingApprovals
		});
	} catch (err: any) {
		return json({ ok: false, message: err.message ?? 'Reset failed' }, { status: 500 });
	}
};
