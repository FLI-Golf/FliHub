import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	upsertTournamentWorkOrder,
	writeAuditLogBatch,
} from '$lib/domain/services/PaymentWorkOrderService';

// ─── Static seed data ─────────────────────────────────────────────────────────

const PROS: Record<string, { id: string; name: string }> = {
	gannon:  { id: 'uzuf56knibwl68w', name: 'Gannon Buhr'     },
	ricky:   { id: 'tva49rgl955akix', name: 'Ricky Wysocki'   },
	calvin:  { id: 'ef0xzf0ue7306d9', name: 'Calvin Heimburg' },
	isaac:   { id: '16bxti7wk38j1pa', name: 'Isaac Robinson'  },
	matthew: { id: '1i61b1szvlgxaqu', name: 'Matthew Orum'    },
	niklas:  { id: 'dwp6kl08z5w3iwq', name: 'Niklas Anttila'  },
	chris:   { id: '96tcuadqc14kbmg', name: 'Chris Dickerson' },
	ezra:    { id: 'dx6jse7pyy4tdlu', name: 'Ezra Robinson'   },
	eagle:   { id: 'ylj0npw6l3815xe', name: 'Eagle McMahon'   },
	cole:    { id: '0kznvkisjzuo9rj', name: 'Cole Redalen'    },
	james:   { id: 'pljl0evg3qv45tj', name: 'James Proctor'   },
	kristin: { id: 'cdttri55nf950ln', name: 'Kristin Tattar'  },
	evelina: { id: 'bv6gn2ilyvgsd3e', name: 'Evelina Salonen' },
	ohn:     { id: '4f1fxvb74956f35', name: 'Ohn Scoggins'    },
	missy:   { id: 'u5z0w7djuht4ebi', name: 'Missy Gannon'    },
	holyn:   { id: 'pjes2nuuaba3y1v', name: 'Holyn Handley'   },
	kat:     { id: 'x6gp8fax2htqunk', name: 'Kat Mertsch'     },
	ella:    { id: '0beua1tpmo1xray', name: 'Ella Hansen'      },
	hailey:  { id: 'fnupgcb1knpxhr1', name: 'Hailey King'     },
	heidi:   { id: 'qcwwe5xt2dfu66j', name: 'Heidi Laine'     },
	paige:   { id: 'ohx3qmt4ou4gp68', name: 'Paige Pierce'    },
	natalie: { id: '29heie6mwmt4iah', name: 'Natalie Ryan'    },
	henna:   { id: 's0xjuygr0abijvs', name: 'Henna Blomroos'  },
};

const F = {
	hyzer: '4rp0eau92x1f4fk', huka: 'k8y0svelyjjaz47', flight: 'igmmd9uvl41k4px',
	birdie: 'fpukova7y6xrqid', chain: 'e13hj3uexx4a2px', jester: '8pyuqi7ofdjdojk',
	midas: 'h6ci08imhcwdtd3', seekers: 'dhwt6slnkhjazma', fairway: 'l76h2jprbd7qxbe',
	dynasty: 'sdpvhevuxi19xut', ace: 'sl1br880897tnwz', glide: '35h5y2wc53c0mib',
};

const MANAGER_DATA = [
	{ proId: PROS.gannon.id,  managerName: 'Scott Buhr',     managerEmail: 'scott.buhr@mgmt.com',     managerCutPercentage: 12 },
	{ proId: PROS.ricky.id,   managerName: 'Dave Wysocki',   managerEmail: 'dave.wysocki@mgmt.com',   managerCutPercentage: 15 },
	{ proId: PROS.calvin.id,  managerName: 'Lisa Heimburg',  managerEmail: 'lisa.heimburg@mgmt.com',  managerCutPercentage: 10 },
	{ proId: PROS.eagle.id,   managerName: 'Tom McMahon',    managerEmail: 'tom.mcmahon@mgmt.com',    managerCutPercentage: 12 },
	{ proId: PROS.kristin.id, managerName: 'Andres Tattar',  managerEmail: 'andres.tattar@mgmt.com',  managerCutPercentage: 15 },
	{ proId: PROS.paige.id,   managerName: 'Steve Pierce',   managerEmail: 'steve.pierce@mgmt.com',   managerCutPercentage: 10 },
	{ proId: PROS.evelina.id, managerName: 'Mikael Salonen', managerEmail: 'mikael.salonen@mgmt.com', managerCutPercentage: 12 },
	{ proId: PROS.natalie.id, managerName: 'Chris Ryan',     managerEmail: 'chris.ryan@mgmt.com',     managerCutPercentage: 10 },
];

type ResultRow = { pro: { id: string; name: string }; franchise: string; placement: number };

// Tournament IDs for all 6 events
const TOURNAMENT_IDS = {
	t1: '2najeglkb5rq5av',
	t2: 'olf8nz8ov6a1nma',
	t3: 'zgi3dqik3hl5szc',
	t4: '9z9t9t77m5dsawh',
	t5: 'bxbphiqpmaabkrv',
	t6: 'yk2i3io486h7oqj',
};

const RESULTS_BY_TOURNAMENT: Record<string, { men: ResultRow[]; women: ResultRow[] }> = {
	'2najeglkb5rq5av': {
		men: [
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 1  },
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 2  },
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 3  },
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 4  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 5  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 6  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 7  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 8  },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 9  },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 10 },
			{ pro: PROS.james,   franchise: F.ace,     placement: 11 },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 12 },
		],
		women: [
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 1  },
			{ pro: PROS.evelina, franchise: F.huka,    placement: 2  },
			{ pro: PROS.paige,   franchise: F.flight,  placement: 3  },
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 4  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 5  },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 6  },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 7  },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 8  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 9  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 10 },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 11 },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 12 },
		],
	},
	'olf8nz8ov6a1nma': {
		men: [
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 1  },
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 2  },
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 3  },
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 4  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 5  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 6  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 7  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 8  },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 9  },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 10 },
			{ pro: PROS.james,   franchise: F.ace,     placement: 11 },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 12 },
		],
		women: [
			{ pro: PROS.paige,   franchise: F.flight,  placement: 1  },
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 2  },
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 3  },
			{ pro: PROS.evelina, franchise: F.huka,    placement: 4  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 5  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 6  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 7  },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 8  },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 9  },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 10 },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 11 },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 12 },
		],
	},
	'zgi3dqik3hl5szc': {
		men: [
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 1  },
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 2  },
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 3  },
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 4  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 5  },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 6  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 7  },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 8  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 9  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 10 },
			{ pro: PROS.james,   franchise: F.ace,     placement: 11 },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 12 },
		],
		women: [
			{ pro: PROS.evelina, franchise: F.huka,    placement: 1  },
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 2  },
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 3  },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 4  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 5  },
			{ pro: PROS.paige,   franchise: F.flight,  placement: 6  },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 7  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 8  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 9  },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 10 },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 11 },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 12 },
		],
	},
	// Tournament #4 — Summer Showdown
	'9z9t9t77m5dsawh': {
		men: [
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 1  },
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 2  },
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 3  },
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 4  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 5  },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 6  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 7  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 8  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 9  },
			{ pro: PROS.james,   franchise: F.ace,     placement: 10 },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 11 },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 12 },
		],
		women: [
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 1  },
			{ pro: PROS.paige,   franchise: F.flight,  placement: 2  },
			{ pro: PROS.evelina, franchise: F.huka,    placement: 3  },
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 4  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 5  },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 6  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 7  },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 8  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 9  },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 10 },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 11 },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 12 },
		],
	},
	// Tournament #5 — Fall Invitational
	'bxbphiqpmaabkrv': {
		men: [
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 1  },
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 2  },
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 3  },
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 4  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 5  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 6  },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 7  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 8  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 9  },
			{ pro: PROS.james,   franchise: F.ace,     placement: 10 },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 11 },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 12 },
		],
		women: [
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 1  },
			{ pro: PROS.evelina, franchise: F.huka,    placement: 2  },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 3  },
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 4  },
			{ pro: PROS.paige,   franchise: F.flight,  placement: 5  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 6  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 7  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 8  },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 9  },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 10 },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 11 },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 12 },
		],
	},
	// Tournament #6 — FLI Golf Championship Finals
	'yk2i3io486h7oqj': {
		men: [
			{ pro: PROS.gannon,  franchise: F.hyzer,   placement: 1  },
			{ pro: PROS.eagle,   franchise: F.birdie,  placement: 2  },
			{ pro: PROS.ricky,   franchise: F.huka,    placement: 3  },
			{ pro: PROS.calvin,  franchise: F.flight,  placement: 4  },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 5  },
			{ pro: PROS.chris,   franchise: F.seekers, placement: 6  },
			{ pro: PROS.isaac,   franchise: F.chain,   placement: 7  },
			{ pro: PROS.niklas,  franchise: F.midas,   placement: 8  },
			{ pro: PROS.ezra,    franchise: F.fairway, placement: 9  },
			{ pro: PROS.cole,    franchise: F.dynasty, placement: 10 },
			{ pro: PROS.james,   franchise: F.ace,     placement: 11 },
			{ pro: PROS.matthew, franchise: F.jester,  placement: 12 },
		],
		women: [
			{ pro: PROS.paige,   franchise: F.flight,  placement: 1  },
			{ pro: PROS.kristin, franchise: F.hyzer,   placement: 2  },
			{ pro: PROS.evelina, franchise: F.huka,    placement: 3  },
			{ pro: PROS.natalie, franchise: F.birdie,  placement: 4  },
			{ pro: PROS.henna,   franchise: F.glide,   placement: 5  },
			{ pro: PROS.ella,    franchise: F.fairway, placement: 6  },
			{ pro: PROS.hailey,  franchise: F.dynasty, placement: 7  },
			{ pro: PROS.heidi,   franchise: F.ace,     placement: 8  },
			{ pro: PROS.ohn,     franchise: F.chain,   placement: 9  },
			{ pro: PROS.holyn,   franchise: F.midas,   placement: 10 },
			{ pro: PROS.missy,   franchise: F.jester,  placement: 11 },
			{ pro: PROS.kat,     franchise: F.seekers, placement: 12 },
		],
	},
};

// Male pro IDs → MPO; female → FPO
const MPO_PRO_IDS = new Set([
	PROS.gannon.id, PROS.ricky.id, PROS.calvin.id, PROS.isaac.id, PROS.matthew.id,
	PROS.niklas.id, PROS.chris.id, PROS.ezra.id, PROS.eagle.id, PROS.cole.id, PROS.james.id,
]);

function getDivision(proId: string): 'MPO' | 'FPO' {
	return MPO_PRO_IDS.has(proId) ? 'MPO' : 'FPO';
}

// ─── Payout math ──────────────────────────────────────────────────────────────

function calcPayouts(divisionPurse: number, numPlacements = 12): number[] {
	const pcts = [30.0, 20.0, 15.0];
	const remaining = 35.0;
	const remainingPlaces = numPlacements - 3;
	let decaySum = 0;
	for (let i = 0; i < remainingPlaces; i++) decaySum += Math.pow(0.85, i);
	for (let i = 0; i < remainingPlaces; i++) {
		pcts.push((Math.pow(0.85, i) / decaySum) * remaining);
	}
	return pcts.map(pct => (divisionPurse * pct) / 100);
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async () => {
	const pb = await getAdminPocketBase();

	const [tournaments, allPayments, allResults, workOrders, auditLogs] = await Promise.all([
		pb.collection('tournaments').getFullList({ sort: 'tournamentNumber' }),
		pb.collection('pro_payments').getFullList({ sort: '-created', expand: 'pro' }).catch(() => [] as any[]),
		pb.collection('tournament_results').getFullList({ sort: 'placement', expand: 'pro,franchise' }).catch(() => [] as any[]),
		pb.collection('work_orders').getFullList({ filter: `source = 'pro_payment'`, sort: '-created' }).catch(() => [] as any[]),
		pb.collection('payment_audit_log').getFullList({ sort: 'changedAt' }).catch(() => [] as any[]),
	]);

	const byTournament = tournaments.map((t: any) => {
		const results     = allResults.filter((r: any) => r.tournament === t.id);
		const payments    = allPayments.filter((p: any) => p.tournament === t.id);
		const wo          = workOrders.find((w: any) => w.projectId === t.id) ?? null;
		const proPayments = payments.filter((p: any) => p.recipient === 'pro');
		const mgrPayments = payments.filter((p: any) => p.recipient === 'manager');
		const totalPaid   = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const paymentSum  = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const mathOk      = payments.length > 0 && Math.abs(paymentSum - (t.prizePool ?? 0)) < 1;

		// Build per-pro breakdown keyed by resultId (not proId) so multi-result pros work
		const proBreakdown: any[] = [];
		for (const r of results) {
			const payments_for = { pro: null as any, mgr: null as any };
			for (const p of proPayments)  { if (p.tournamentResult === r.id) payments_for.pro = p; }
			for (const p of mgrPayments)  { if (p.tournamentResult === r.id) payments_for.mgr = p; }
			proBreakdown.push({
				resultId:             r.id,
				proId:                r.pro,
				proName:              r.expand?.pro?.name ?? r.pro,
				division:             getDivision(r.pro),
				placement:            r.placement,
				proEarnings:          r.proEarnings ?? 0,
				managerEarnings:      r.managerEarnings ?? 0,
				netProEarnings:       r.netProEarnings ?? (r.proEarnings ?? 0),
				managerCutPercentage: r.managerCutPercentage ?? 0,
				franchiseId:          r.franchise ?? '__none__',
				franchiseName:        r.expand?.franchise?.name ?? 'No Franchise',
				proPayment:           payments_for.pro,
				mgrPayment:           payments_for.mgr,
			});
		}
		proBreakdown.sort((a, b) => a.placement - b.placement);

		// Group by franchise
		const franchiseMap = new Map<string, { franchiseId: string; franchiseName: string; rows: any[] }>();
		for (const row of proBreakdown) {
			if (!franchiseMap.has(row.franchiseId)) {
				franchiseMap.set(row.franchiseId, { franchiseId: row.franchiseId, franchiseName: row.franchiseName, rows: [] });
			}
			franchiseMap.get(row.franchiseId)!.rows.push(row);
		}
		const byFranchise = Array.from(franchiseMap.values()).sort((a, b) => {
			const aTotal = a.rows.reduce((s, r) => s + (r.proEarnings || 0), 0);
			const bTotal = b.rows.reduce((s, r) => s + (r.proEarnings || 0), 0);
			return bTotal - aTotal;
		});

		return {
			tournament: t,
			results, payments, proPayments, mgrPayments,
			proBreakdown,
			byFranchise,
			wo, totalPaid, totalPending, paymentSum, mathOk,
			resultCount: results.length,
			paymentCount: payments.length,
			pendingProCount: proPayments.filter((p: any) => p.status === 'pending').length,
			pendingMgrCount: mgrPayments.filter((p: any) => p.status === 'pending').length,
			paidProCount: proPayments.filter((p: any) => p.status === 'paid').length,
			paidMgrCount: mgrPayments.filter((p: any) => p.status === 'paid').length,
		};
	});

	const seasonSummary = {
		totalPrizePool:      tournaments.reduce((s: number, t: any) => s + (t.prizePool ?? 0), 0),
		totalPayments:       allPayments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalPaid:           allPayments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalPending:        allPayments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		proPaymentTotal:     allPayments.filter((p: any) => p.recipient === 'pro').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		managerPaymentTotal: allPayments.filter((p: any) => p.recipient === 'manager').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		paymentRecords:      allPayments.length,
		workOrderCount:      workOrders.length,
		auditEntries:        auditLogs.length,
		completedCount:      tournaments.filter((t: any) => t.status === 'completed').length,
		seededCount:         tournaments.filter((t: any) => allResults.some((r: any) => r.tournament === t.id)).length,
		tournamentCount:     tournaments.length,
	};

	const auditByPayment: Record<string, any[]> = {};
	for (const e of auditLogs) {
		if (!auditByPayment[e.payment]) auditByPayment[e.payment] = [];
		auditByPayment[e.payment].push(e);
	}

	return { byTournament, seasonSummary, workOrders, auditByPayment };
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export const actions: Actions = {

	seedTournament: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const tournament = await pb.collection('tournaments').getOne(tournamentId).catch(() => null);
		if (!tournament) return fail(404, { error: 'Tournament not found' });

		const resultDefs = RESULTS_BY_TOURNAMENT[tournamentId];
		if (!resultDefs) return fail(400, { error: 'No result definitions for this tournament' });

		// Set manager data on pros
		await Promise.all(MANAGER_DATA.map(m =>
			pb.collection('talent').update(m.proId, {
				managerName: m.managerName,
				managerEmail: m.managerEmail,
				managerCutPercentage: m.managerCutPercentage,
			}).catch(() => null)
		));

		const mgrMap: Record<string, typeof MANAGER_DATA[0]> = {};
		for (const m of MANAGER_DATA) mgrMap[m.proId] = m;

		const prizePool   = tournament.prizePool ?? 500000;
		const divPurse    = prizePool / 2;
		const menPayouts  = calcPayouts(divPurse);
		const womenPayouts = calcPayouts(divPurse);

		const allRows = [
			...resultDefs.men.map(r => ({ ...r, division: 'MPO', payouts: menPayouts })),
			...resultDefs.women.map(r => ({ ...r, division: 'FPO', payouts: womenPayouts })),
		];

		const createdPaymentIds: string[] = [];
		let totalPaymentAmount = 0;

		for (const row of allRows) {
			const gross     = row.payouts[row.placement - 1] ?? 0;
			const mgr       = mgrMap[row.pro.id];
			const mgrCutPct = mgr?.managerCutPercentage ?? 0;
			const mgrAmount = mgr ? Math.round(gross * mgrCutPct) / 100 : 0;
			const proNet    = gross - mgrAmount;

			// tournament_results: only send fields that exist in the schema
			const result = await pb.collection('tournament_results').create({
				tournament:           tournamentId,
				pro:                  row.pro.id,
				franchise:            row.franchise,
				placement:            row.placement,
				proEarnings:          gross,
				managerEarnings:      mgrAmount,
				netProEarnings:       proNet,
				managerCutPercentage: mgrCutPct,
				notes:                `${row.division} | ${row.pro.name}${mgr ? ` | mgr: ${mgr.managerName}` : ''}`,
			});

			// pro_payments: paymentType is required
			const proPayment = await pb.collection('pro_payments').create({
				tournament:           tournamentId,
				pro:                  row.pro.id,
				tournamentResult:     result.id,
				paymentType:          'tournament',
				recipient:            'pro',
				amount:               proNet,
				grossAmount:          gross,
				netProAmount:         proNet,
				status:               'pending',
				description:          `${row.division} Place #${row.placement} — ${tournament.name}`,
				managerCutPercentage: mgrCutPct,
			});
			createdPaymentIds.push(proPayment.id);
			totalPaymentAmount += proNet;

			if (mgr && mgrAmount > 0) {
				const mgrPayment = await pb.collection('pro_payments').create({
					tournament:           tournamentId,
					pro:                  row.pro.id,
					tournamentResult:     result.id,
					paymentType:          'tournament',
					recipient:            'manager',
					amount:               mgrAmount,
					managerAmount:        mgrAmount,
					status:               'pending',
					description:          `Manager cut (${mgrCutPct}%) — ${row.pro.name} — ${tournament.name}`,
					managerName:          mgr.managerName,
					managerEmail:         mgr.managerEmail,
					managerCutPercentage: mgrCutPct,
				});
				createdPaymentIds.push(mgrPayment.id);
				totalPaymentAmount += mgrAmount;
			}
		}

		await upsertTournamentWorkOrder(pb, tournamentId, tournament.name, totalPaymentAmount, createdPaymentIds, 'payout-testing');
		await writeAuditLogBatch(pb, createdPaymentIds.map(pid => ({
			paymentId: pid, fromStatus: '', toStatus: 'pending',
			changedBy: 'payout-testing', notes: 'Seeded via payout testing flow',
		})));
		await pb.collection('tournaments').update(tournamentId, { status: 'completed' });

		return { success: true, seeded: createdPaymentIds.length };
	},

	markProsPaid: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const payments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${tournamentId}' && recipient = 'pro' && status = 'pending'`,
		}).catch(() => [] as any[]);

		const paidAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
		await Promise.all(payments.map((p: any) =>
			pb.collection('pro_payments').update(p.id, { status: 'paid', paidAt, paidBy: 'payout-testing' })
		));
		await writeAuditLogBatch(pb, payments.map((p: any) => ({
			paymentId: p.id, fromStatus: 'pending', toStatus: 'paid',
			changedBy: 'payout-testing', recipient: 'pro', amount: p.amount,
		})));

		return { success: true, paid: payments.length };
	},

	markManagersPaid: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const payments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${tournamentId}' && recipient = 'manager' && status = 'pending'`,
		}).catch(() => [] as any[]);

		const paidAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
		await Promise.all(payments.map((p: any) =>
			pb.collection('pro_payments').update(p.id, { status: 'paid', paidAt, paidBy: 'payout-testing' })
		));
		await writeAuditLogBatch(pb, payments.map((p: any) => ({
			paymentId: p.id, fromStatus: 'pending', toStatus: 'paid',
			changedBy: 'payout-testing', recipient: 'manager', amount: p.amount,
		})));

		return { success: true, paid: payments.length };
	},

	resetTournament: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const [results, payments, wos] = await Promise.all([
			pb.collection('tournament_results').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
			pb.collection('pro_payments').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
			pb.collection('work_orders').getFullList({ filter: `projectId = '${tournamentId}' && source = 'pro_payment'` }).catch(() => [] as any[]),
		]);

		await Promise.all([
			...results.map((r: any) => pb.collection('tournament_results').delete(r.id).catch(() => null)),
			...payments.map((p: any) => pb.collection('pro_payments').delete(p.id).catch(() => null)),
			...wos.map((w: any) => pb.collection('work_orders').delete(w.id).catch(() => null)),
		]);
		await pb.collection('tournaments').update(tournamentId, { status: 'scheduled' }).catch(() => null);

		return { success: true };
	},
};
