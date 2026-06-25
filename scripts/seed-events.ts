/**
 * Seed script for the event pipeline.
 *
 * Creates a representative set of events covering every type:
 *   - Appearance (multi-talent, below approval threshold → direct pay)
 *   - Clinic (single talent, above threshold → approval pipeline)
 *   - Media (single talent, requiresApproval forced)
 *   - Promotional (two players, manager cut)
 *   - Content Creation (single broadcaster)
 *   - Tournament Broadcast (3 broadcasters, season bonus tracking)
 *
 * Each event gets talent assignments, tasks, and generated payments.
 *
 * Run:   npx tsx scripts/seed-events.ts
 * Clear: npx tsx scripts/seed-events.ts --clear
 * Reset: npx tsx scripts/seed-events.ts --reset   (clear then seed)
 */

import * as dotenv from 'dotenv';
dotenv.config();
import PocketBase from 'pocketbase';

const PB_URL = (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// ── Real talent IDs from the DB ──────────────────────────────────────────────
const T = {
	gannon:    'caxypp9fv95sf0n', // player
	ricky:     'jzhlpxvrtg5cqkd', // player
	eagle:     'u64edbgz387b9wb', // player
	paige:     'y0sqz8izif7ydax', // player
	kristin:   '4a7zof0wdg376pv', // player
	catrina:   'ziblxn00eqcxz0u', // player
	paul_u:    '7g75nzujxwz3s7r', // broadcaster
	kona:      'bxsq87nz5aqxunv', // broadcaster
	brad:      'pzaau2h1r5yeuij', // broadcaster
	brodie:    'b0r4zi2j1aso8c8', // broadcaster
	kevin:     '70c06glx02o54zd', // broadcaster
};

const SEASON_ID = 't9yegq2db2sml8j'; // Season 2027

type TournamentRef = { id: string; name: string };

async function getTournamentRef(season: number, tournamentNumber: number): Promise<TournamentRef | null> {
	try {
		const t = await pb.collection('tournaments').getFirstListItem(`season = ${season} && tournamentNumber = ${tournamentNumber}`);
		return t ? { id: t.id, name: t.name } : null;
	} catch {
		return null;
	}
}

// ── Auth ─────────────────────────────────────────────────────────────────────
async function auth() {
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✓ Authenticated\n');
}

// ── Clear all seed data ───────────────────────────────────────────────────────
async function clearSeedData() {
	console.log('Clearing seed event data...');

	// Delete in dependency order
	for (const col of ['event_payments', 'event_tasks', 'event_talent']) {
		const records = await pb.collection(col).getFullList({ fields: 'id' }).catch(() => []);
		for (const r of records) {
			await pb.collection(col).delete(r.id).catch(() => {});
		}
		console.log(`  Deleted ${records.length} ${col} records`);
	}

	// Remove seed-created approval expenses + linked approvals.
	const seedApprovalExpenses = await pb.collection('expenses').getFullList({
		filter: `notes ~ "[EP:"`,
		fields: 'id'
	}).catch(() => []);
	let removedApprovals = 0;
	for (const expense of seedApprovalExpenses as any[]) {
		const approvals = await pb.collection('approvals').getFullList({
			filter: `entityType = "expense" && entityId = "${expense.id}"`,
			fields: 'id'
		}).catch(() => []);
		for (const a of approvals as any[]) {
			await pb.collection('approvals').delete(a.id).catch(() => {});
			removedApprovals++;
		}
		await pb.collection('expenses').delete(expense.id).catch(() => {});
	}
	console.log(`  Deleted ${seedApprovalExpenses.length} seed approval expenses`);
	console.log(`  Deleted ${removedApprovals} linked approvals`);

	// Remove any leftover legacy event_payment approvals from prior test runs.
	const legacyApprovals = await pb.collection('approvals').getFullList({
		filter: `entityType = "event_payment"`,
		fields: 'id'
	}).catch(() => []);
	for (const a of legacyApprovals as any[]) {
		await pb.collection('approvals').delete(a.id).catch(() => {});
	}
	if (legacyApprovals.length > 0) {
		console.log(`  Deleted ${legacyApprovals.length} legacy event_payment approvals`);
	}

	// Only delete events created by this seed (tagged with notes containing [seed])
	const events = await pb.collection('special_events').getFullList({
		filter: 'notes ~ "[seed]"',
		fields: 'id,name'
	}).catch(() => []);
	for (const e of events) {
		await pb.collection('special_events').delete(e.id).catch(() => {});
	}
	console.log(`  Deleted ${events.length} seed events\n`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createEvent(data: Record<string, unknown>) {
	return pb.collection('special_events').create({
		...data,
		notes: `${data.notes ?? ''} [seed]`.trim()
	});
}

async function assignTalent(eventId: string, talentId: string, role: string, rateOverride: number | null, status = 'confirmed') {
	const event = await pb.collection('special_events').getOne(eventId);
	const confirmedRate = rateOverride ?? event.defaultRate ?? 0;
	return pb.collection('event_talent').create({
		event: eventId, talent: talentId, role,
		rateOverride, confirmedRate, status,
		bonusEligible: false, bonusEarned: false
	});
}

async function addTask(eventId: string, data: Record<string, unknown>) {
	return pb.collection('event_tasks').create({
		event: eventId, status: 'todo', checklist: [], ...data
	});
}

async function generatePayments(eventId: string) {
	const event = await pb.collection('special_events').getOne(eventId);
	const confirmedTalent = await pb.collection('event_talent').getFullList({
		filter: `event = '${eventId}' && (status = 'confirmed' || status = 'completed')`,
		expand: 'talent'
	});

	const existing = await pb.collection('event_payments').getFullList({
		filter: `event = '${eventId}' && status != 'cancelled'`, fields: 'talent'
	});
	const alreadyPaid = new Set(existing.map((p: any) => p.talent));
	const approvalThreshold = event.approvalThreshold ?? 500;
	const isBroadcast = event.eventType === 'tournament_broadcast';

	let created = 0;
	const requestedBy = await pb.collection('user_profiles').getFirstListItem('id != ""', { fields: 'id' })
		.then((p: any) => p.id)
		.catch(() => null);
	for (const et of confirmedTalent) {
		if (alreadyPaid.has(et.talent)) continue;
		const amount = et.confirmedRate ?? event.defaultRate ?? 0;
		const talent = et.expand?.talent;
		const managerCut = talent?.managerCutPercentage ?? 0;
		const managerAmount = managerCut > 0 ? Math.round(amount * (managerCut / 100) * 100) / 100 : 0;
		const needsApproval = event.requiresApproval || amount > approvalThreshold;
		const status = needsApproval ? 'approval_required' : 'pending';
		const approvalRoute = needsApproval ? 'approval_pipeline' : 'direct';

		// Bonus eligibility for broadcast events
		let bonusEligible = false;
		if (isBroadcast && event.season && event.bonusThreshold) {
			const seasonEvents = await pb.collection('special_events').getFullList({
				filter: `season = '${event.season}' && eventType = 'tournament_broadcast'`, fields: 'id'
			});
			const ids = seasonEvents.map((e: any) => e.id);
			if (ids.length > 0) {
				const attended = await pb.collection('event_talent').getList(1, 1, {
					filter: `talent = '${et.talent}' && (status = 'confirmed' || status = 'completed') && (${ids.map((id: string) => `event = '${id}'`).join(' || ')})`
				});
				bonusEligible = attended.totalItems >= event.bonusThreshold;
				if (bonusEligible !== et.bonusEligible) {
					await pb.collection('event_talent').update(et.id, { bonusEligible });
				}
			}
		}

		const talentPayment = await pb.collection('event_payments').create({
			event: eventId, eventTalent: et.id, talent: et.talent,
			paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee',
			amount, status, approvalRoute, recipient: 'talent',
			managerCutPercentage: managerCut, managerAmount, isBonus: false
		});
		if (status === 'approval_required') {
			const marker = `[EP:${talentPayment.id}]`;
			const expense = await pb.collection('expenses').create({
				description: `Event payment approval (${isBroadcast ? 'broadcast_fee' : 'appearance_fee'})`,
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

		if (managerAmount > 0) {
			const managerNeedsApproval = event.requiresApproval || managerAmount > approvalThreshold;
			const managerPayment = await pb.collection('event_payments').create({
				event: eventId, eventTalent: et.id, talent: et.talent,
				paymentType: isBroadcast ? 'broadcast_fee' : 'appearance_fee',
				amount: managerAmount,
				status: managerNeedsApproval ? 'approval_required' : 'pending',
				approvalRoute: managerNeedsApproval ? 'approval_pipeline' : 'direct',
				recipient: 'manager',
				description: `Manager cut for ${talent?.name ?? et.talent}`,
				isBonus: false
			});
			if (managerNeedsApproval) {
				const marker = `[EP:${managerPayment.id}]`;
				const expense = await pb.collection('expenses').create({
					description: `Manager split approval (${isBroadcast ? 'broadcast_fee' : 'appearance_fee'})`,
					amount: Number(managerAmount) || 0,
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
					amount: Number(managerAmount) || 0,
					comments: '<p>Manager split payment requires approval before payout.</p>'
					}).catch(() => null);
				}
			}
		}

		if (bonusEligible && !et.bonusEarned && event.bonusAmount) {
			const seasonEvents = await pb.collection('special_events').getFullList({
				filter: `season = '${event.season}' && eventType = 'tournament_broadcast'`, fields: 'id'
			}).catch(() => []);
			const sIds = seasonEvents.map((e: any) => e.id);
			const existingBonus = sIds.length > 0
				? await pb.collection('event_payments').getList(1, 1, {
					filter: `talent = '${et.talent}' && isBonus = true && status != 'cancelled' && (${sIds.map((id: string) => `event = '${id}'`).join(' || ')})`
				}).catch(() => ({ totalItems: 0 }))
				: { totalItems: 0 };

			if (existingBonus.totalItems === 0) {
				const bonusPayment = await pb.collection('event_payments').create({
					event: eventId, eventTalent: et.id, talent: et.talent,
					paymentType: 'bonus', amount: event.bonusAmount,
					status: 'approval_required', approvalRoute: 'approval_pipeline',
					recipient: 'talent',
					description: `Attendance bonus — completed ${event.bonusThreshold} events`,
					isBonus: true
				});
				const marker = `[EP:${bonusPayment.id}]`;
				const expense = await pb.collection('expenses').create({
					description: 'Bonus payment approval',
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

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
	console.log('Seeding event pipeline test data...\n');

	const t1 = await getTournamentRef(2027, 1);
	const t2 = await getTournamentRef(2027, 2);
	const t3 = await getTournamentRef(2027, 3);
	const t4 = await getTournamentRef(2027, 4);
	const t5 = await getTournamentRef(2027, 5);
	const t6 = await getTournamentRef(2027, 6);

	const tn = (t: TournamentRef | null, fallback: string) => t?.name ?? fallback;

	// ── 1. APPEARANCE — Children's Hospital (2 players, below threshold → direct) ──
	console.log('1. Appearance — Children\'s Hospital');
	const appearance = await createEvent({
		name: `${tn(t1, 'FLI Golf Season Opener')} — Community Appearance`,
		...(t1 && { tournament: t1.id }),
		eventType: 'appearance',
		eventDate: '2027-03-15 00:00:00.000Z',
		location: 'Phoenix Children\'s Hospital, Phoenix AZ',
		status: 'scheduled',
		defaultRate: 300,
		budget: 700,
		approvalThreshold: 500,
		requiresApproval: false,
		description: '<p>Two players visit the pediatric ward for a 2-hour appearance. Bring discs for giveaway.</p>'
	});
	await assignTalent(appearance.id, T.gannon, 'player', null);
	await assignTalent(appearance.id, T.eagle, 'player', null);
	await addTask(appearance.id, { title: 'Confirm hospital contact', priority: 'high', dueDate: '2027-03-01 00:00:00.000Z' });
	await addTask(appearance.id, { title: 'Order 20 discs for giveaway', priority: 'medium', hasCost: true, estimatedCost: 180, requiresApproval: false });
	await addTask(appearance.id, { title: 'Send travel itinerary to players', priority: 'medium', dueDate: '2027-03-10 00:00:00.000Z' });
	const ap = await generatePayments(appearance.id);
	console.log(`   ✓ Created — ${ap} payments (direct, below $500 threshold)\n`);

	// ── 2. CLINIC — Disc Golf Clinic (single player, above threshold → approval) ──
	console.log('2. Clinic — Youth Disc Golf Clinic — San Pedro');
	const clinic = await createEvent({
		name: `${tn(t2, 'Spring Championship')} — Youth Disc Golf Clinic`,
		...(t2 && { tournament: t2.id }),
		eventType: 'clinic',
		eventDate: '2027-04-05 00:00:00.000Z',
		location: 'San Pedro, CA',
		status: 'scheduled',
		defaultRate: 750,
		budget: 1000,
		approvalThreshold: 500,
		requiresApproval: false,
		description: '<p>3-hour instructional clinic for youth players aged 10–18. Ricky leads drills and Q&A.</p>'
	});
	await assignTalent(clinic.id, T.ricky, 'player', null);
	await addTask(clinic.id, { title: 'Book park permit', priority: 'urgent', hasCost: true, estimatedCost: 75, requiresApproval: false });
	await addTask(clinic.id, { title: 'Prepare clinic curriculum', priority: 'high' });
	await addTask(clinic.id, { title: 'Arrange equipment (baskets, discs)', priority: 'medium', hasCost: true, estimatedCost: 200, requiresApproval: true });
	const cp = await generatePayments(clinic.id);
	console.log(`   ✓ Created — ${cp} payments (approval required, $750 > $500 threshold)\n`);

	// ── 3. MEDIA — Interview / Photo Shoot (requiresApproval forced) ──
	console.log('3. Media — Magazine Photo Shoot');
	const media = await createEvent({
		name: `${tn(t3, 'Mid-Season Classic')} — Media Day`,
		...(t3 && { tournament: t3.id }),
		eventType: 'media',
		eventDate: '2027-04-20 00:00:00.000Z',
		location: 'Sedona, AZ',
		status: 'scheduled',
		defaultRate: 400,
		budget: 600,
		approvalThreshold: 500,
		requiresApproval: true,
		description: '<p>Full-day photo shoot for DGW cover feature. Paige and Kristin confirmed.</p>'
	});
	await assignTalent(media.id, T.paige, 'player', null);
	await assignTalent(media.id, T.kristin, 'player', 450); // rate override
	await addTask(media.id, { title: 'Coordinate with photographer', priority: 'high' });
	await addTask(media.id, { title: 'Arrange hair/makeup', priority: 'medium', hasCost: true, estimatedCost: 250, requiresApproval: true });
	await addTask(media.id, { title: 'Review and approve final images', priority: 'low' });
	const mp = await generatePayments(media.id);
	console.log(`   ✓ Created — ${mp} payments (all approval required — forced on event)\n`);

	// ── 4. PROMOTIONAL — Disc Golf Expo Booth (two players, one with manager cut) ──
	console.log('4. Promotional — Disc Golf Expo Booth');
	// Temporarily set a manager cut on Gannon for this test
	await pb.collection('talent').update(T.gannon, { managerCutPercentage: 15, managerName: 'Scott Buhr', managerEmail: 'scott.buhr@test.com' });
	const promo = await createEvent({
		name: `${tn(t4, 'Summer Showdown')} — Fan Promo Booth`,
		...(t4 && { tournament: t4.id }),
		eventType: 'promotional',
		eventDate: '2027-05-10 00:00:00.000Z',
		location: 'Las Vegas Convention Center, NV',
		status: 'scheduled',
		defaultRate: 500,
		budget: 1200,
		approvalThreshold: 500,
		requiresApproval: false,
		description: '<p>2-day expo appearance. Players sign autographs and demo discs at the FLI booth.</p>'
	});
	await assignTalent(promo.id, T.gannon, 'player', null);
	await assignTalent(promo.id, T.catrina, 'player', null);
	await addTask(promo.id, { title: 'Ship booth materials', priority: 'high', hasCost: true, estimatedCost: 350, requiresApproval: true });
	await addTask(promo.id, { title: 'Print promotional materials', priority: 'medium', hasCost: true, estimatedCost: 120, requiresApproval: false });
	await addTask(promo.id, { title: 'Book hotel for players', priority: 'high', hasCost: true, estimatedCost: 400, requiresApproval: true });
	const pp = await generatePayments(promo.id);
	console.log(`   ✓ Created — ${pp} payments (includes manager split for Gannon)\n`);

	// ── 5. CONTENT CREATION — YouTube Series Episode ──
	console.log('5. Content Creation — YouTube Episode');
	const content = await createEvent({
		name: `${tn(t5, 'Fall Invitational')} — Content Shoot`,
		...(t5 && { tournament: t5.id }),
		eventType: 'content_creation',
		eventDate: '2027-05-25 00:00:00.000Z',
		location: 'Fountain Hills, AZ',
		status: 'scheduled',
		defaultRate: 200,
		budget: 500,
		approvalThreshold: 500,
		requiresApproval: false,
		description: '<p>Brodie hosts a course vlog with two pros. Raw footage due within 48hrs.</p>'
	});
	await assignTalent(content.id, T.brodie, 'broadcaster', null);
	await assignTalent(content.id, T.eagle, 'player', 150); // lower rate for player cameo
	await addTask(content.id, { title: 'Scout filming locations', priority: 'medium' });
	await addTask(content.id, { title: 'Arrange drone operator', priority: 'high', hasCost: true, estimatedCost: 300, requiresApproval: true });
	await addTask(content.id, { title: 'Edit and upload video', priority: 'high' });
	const ctp = await generatePayments(content.id);
	console.log(`   ✓ Created — ${ctp} payments (event is scheduled)\n`);

	// ── 6. TOURNAMENT BROADCASTS — One event per tournament ──
	console.log('6. Tournament Broadcasts — One broadcast per tournament\n');

	const TOURNAMENT_COUNT = 6;
	const BROADCAST_INFRA_TOTAL = 1_000_000;
	const EXEC_TRAVEL_2027_TOTAL = 60_000;
	const ENTERTAINMENT_2027_TOTAL = 600_000;
	const BROADCAST_BUDGET_PER_TOURNAMENT = Math.round(BROADCAST_INFRA_TOTAL / TOURNAMENT_COUNT);
	const TRAVEL_BUDGET_PER_TOURNAMENT = Math.round(EXEC_TRAVEL_2027_TOTAL / TOURNAMENT_COUNT);
	const ENTERTAINMENT_BUDGET_PER_TOURNAMENT = Math.round(ENTERTAINMENT_2027_TOTAL / TOURNAMENT_COUNT);
	const BROADCAST_EVENT_BUDGET = BROADCAST_BUDGET_PER_TOURNAMENT + TRAVEL_BUDGET_PER_TOURNAMENT + ENTERTAINMENT_BUDGET_PER_TOURNAMENT;
	const FLAT_BROADCASTER_RATE = 10_000;

	const broadcastBase = {
		eventType: 'tournament_broadcast',
		season: SEASON_ID,
		defaultRate: FLAT_BROADCASTER_RATE,
		budget: BROADCAST_EVENT_BUDGET,
		approvalThreshold: 7_500,
		requiresApproval: false,
		description: '<p>Live tournament broadcast coverage. Broadcasters handle play-by-play, analysis, social clips, and sponsor integrations.</p><p>Budget modeled from Use of Proceeds + Travel Budget + Entertainment (2027 baseline).</p>'
	};

	// Create one broadcast event per tournament, using tournament dates & names
	const broadcastEvents: Array<{ id: string; title: string }> = [];

	const createBroadcast = async (tRef: TournamentRef | null, idx: number) => {
		if (!tRef) return null;
		const t = await pb.collection('tournaments').getOne(tRef.id, { fields: 'name,startDate,location,venue' });
		const eventDate = t.startDate || `2027-0${4 + idx}-01 00:00:00.000Z`;
		const bcEvent = await createEvent({
			...broadcastBase,
			tournament: t.id,
			name: `${t.name} — Broadcast`,
			eventDate,
			location: t.location || 'TBD',
			status: 'scheduled'
		});
		broadcastEvents.push({ id: bcEvent.id, title: t.name });
		return bcEvent.id;
	};

	const bc1 = await createBroadcast(t1, 1);
	const bc2 = await createBroadcast(t2, 2);
	const bc3 = await createBroadcast(t3, 3);
	const bc4 = await createBroadcast(t4, 4);
	const bc5 = await createBroadcast(t5, 5);
	const bc6 = await createBroadcast(t6, 6);

	const allBroadcasts = [bc1, bc2, bc3, bc4, bc5, bc6].filter((id) => id !== null) as string[];

	const coreLineup = [
		{ talentId: T.paul_u, role: 'commentator' },
		{ talentId: T.kona, role: 'analyst' },
		{ talentId: T.brad, role: 'analyst' },
		{ talentId: T.brodie, role: 'broadcaster' },
		{ talentId: T.kevin, role: 'broadcaster' },
	];
	const celebrityActs = ['Riley Knox', 'Ava Sterling', 'Damon Vale', 'Nia Cross', 'Mason Hart', 'Skyler Dean'];
	const musicActs = ['Neon Valley', 'Echo Harbor', 'Velvet Current', 'Luna Drift', 'Signal Arcade', 'Copper Avenue'];

	for (let i = 0; i < allBroadcasts.length; i++) {
		const bcId = allBroadcasts[i];

		for (const slot of coreLineup) {
			await assignTalent(bcId, slot.talentId, slot.role, FLAT_BROADCASTER_RATE, 'confirmed');
		}

		// Use-of-proceeds pillar tasks
		const productionOpsCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.6);
		const mediaCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.2);
		const leagueOpsCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.12);
		const marketingReserveCost = Math.round(BROADCAST_BUDGET_PER_TOURNAMENT * 0.08);

		await addTask(bcId, {
			title: '[Event Production & Technology] Live Broadcast Truck + Scoring Feed Sync',
			priority: 'urgent',
			hasCost: true,
			estimatedCost: productionOpsCost,
			requiresApproval: true,
			description: 'Switcher, replay system, encoding, and real-time scoring data feed operations.',
			checklist: ['Truck load-in complete', 'Replay/graphics channels verified', 'Scoring feed latency < 2s']
		});

		await addTask(bcId, {
			title: '[Media & Content Buildout] Social Clips + Post-Round Highlights',
			priority: 'high',
			hasCost: true,
			estimatedCost: mediaCost,
			requiresApproval: true,
			description: 'Package short-form highlights and sponsor-tagged content from tournament day coverage.',
			checklist: ['Clip list approved', 'Sponsor tags embedded', 'Post-round recap delivered']
		});

		await addTask(bcId, {
			title: '[League Operations & Team Development] Broadcast Crew Travel + Per Diem',
			priority: 'medium',
			hasCost: true,
			estimatedCost: leagueOpsCost,
			requiresApproval: true,
			description: 'Travel, lodging, and per diem for on-site commentary and technical crew.',
			checklist: ['Flights booked', 'Hotel rooming list finalized', 'Per diem reconciled']
		});

		await addTask(bcId, {
			title: '[Marketing, Working Capital & Reserve] Sponsor Ad Insert + Contingency',
			priority: 'medium',
			hasCost: true,
			estimatedCost: marketingReserveCost,
			requiresApproval: true,
			description: 'Sponsor ad-slot integration QA and day-of contingency reserve for schedule shifts.',
			checklist: ['Ad slate validated', 'Backup creative loaded', 'Contingency reserve logged']
		});

		// Travel budget categories (2027 baseline)
		const travelAirfare = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (25_000 / 60_000));
		const travelLodging = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (15_000 / 60_000));
		const travelAuto = Math.round(TRAVEL_BUDGET_PER_TOURNAMENT * (10_000 / 60_000));
		const travelPerDiem = TRAVEL_BUDGET_PER_TOURNAMENT - travelAirfare - travelLodging - travelAuto;

		await addTask(bcId, {
			title: '[Travel Budget] Airfare Block - Broadcast Crew',
			priority: 'high',
			hasCost: true,
			estimatedCost: travelAirfare,
			requiresApproval: true,
			description: 'Executive travel budget allocation for domestic flight routing to tournament site.',
			checklist: ['Round-trip flights ticketed', 'Carrier rates benchmarked', 'Schedule buffer approved']
		});

		await addTask(bcId, {
			title: '[Travel Budget] Lodging Block + Crew Auto Rental + Per Diem',
			priority: 'medium',
			hasCost: true,
			estimatedCost: travelLodging + travelAuto + travelPerDiem,
			requiresApproval: true,
			description: 'Hotel, ground transportation, and per diem from 2027 executive travel budget model.',
			checklist: ['Hotel nights reserved', 'Rental vehicles confirmed', 'Per diem envelopes reconciled']
		});

		// Entertainment categories (2027 baseline)
		const entertainmentCelebrity = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (30_000 / 100_000));
		const entertainmentMusic = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (45_000 / 100_000));
		const entertainmentTravel = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (10_000 / 100_000));
		const entertainmentHospitality = Math.round(ENTERTAINMENT_BUDGET_PER_TOURNAMENT * (7_500 / 100_000));
		const entertainmentBookingFees = ENTERTAINMENT_BUDGET_PER_TOURNAMENT - entertainmentCelebrity - entertainmentMusic - entertainmentTravel - entertainmentHospitality;

		await addTask(bcId, {
			title: `[Entertainment] Celebrity Appearance - ${celebrityActs[i] ?? `Guest ${i + 1}`}`,
			priority: 'medium',
			hasCost: true,
			estimatedCost: entertainmentCelebrity,
			requiresApproval: true,
			description: 'Tournament trophy ceremony and sponsor meet-and-greet appearance package.',
			checklist: ['Talent rider accepted', 'Backstage call time set', 'Sponsor photo-line scheduled']
		});

		await addTask(bcId, {
			title: `[Entertainment] Music Act - ${musicActs[i] ?? `Live Act ${i + 1}`}`,
			priority: 'medium',
			hasCost: true,
			estimatedCost: entertainmentMusic,
			requiresApproval: true,
			description: 'Music performance slot to raise in-venue engagement and dwell time.',
			checklist: ['Stage plot approved', 'Soundcheck complete', 'Set timing aligned to broadcast windows']
		});

		await addTask(bcId, {
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
	for (const bcId of allBroadcasts) {
		await generatePayments(bcId);
	}
	console.log(`   ✓ Created ${allBroadcasts.length} tournament broadcast events\n`);

	const pendingEventPaymentExpenses = await pb.collection('expenses').getFullList({
		filter: `status = 'submitted' && notes ~ '[EP:'`,
		fields: 'id'
	}).catch(() => []);
	console.log(`   ✓ Created ${pendingEventPaymentExpenses.length} pending payment approvals\n`);

	console.log('── Seed complete ──────────────────────────────────────────────');
	console.log('Events created: 11 (1 appearance, 1 clinic, 1 media, 1 promo, 1 content, 6 broadcast)');
	console.log(`Payments pending approval: ${pendingEventPaymentExpenses.length}`);
	console.log('To clear: npx tsx scripts/seed-events.ts --clear');
}

// ── Entry point ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

auth().then(async () => {
	if (args.includes('--clear')) {
		await clearSeedData();
		console.log('Done.');
	} else if (args.includes('--reset')) {
		await clearSeedData();
		await seed();
	} else {
		await seed();
	}
}).catch(err => {
	console.error('Fatal:', err.message);
	process.exit(1);
});
