import { adminFetch, getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
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
	jasper:  { id: '7yv36zow37nxp2w', name: 'Jasper Vaine'    },
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

const PRO_NAME_ALIASES: Record<string, string> = {
	'kristin tattar': 'kristin latt',
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

function splitAmountAcrossMembers(totalAmount: number, memberCount: number): number[] {
	if (memberCount <= 0) return [];
	const totalCents = Math.round(totalAmount * 100);
	const baseCents = Math.floor(totalCents / memberCount);
	let remainder = totalCents - baseCents * memberCount;
	const out = new Array<number>(memberCount).fill(baseCents);
	for (let i = 0; i < out.length && remainder > 0; i += 1, remainder -= 1) out[i] += 1;
	return out.map((cents) => cents / 100);
}

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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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
			{ pro: PROS.jasper,  franchise: F.glide,   placement: 12 },
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

const LEGACY_TOURNAMENT_ID_BY_NUMBER: Record<number, string> = {
	1: '2najeglkb5rq5av',
	2: 'olf8nz8ov6a1nma',
	3: 'zgi3dqik3hl5szc',
	4: '9z9t9t77m5dsawh',
	5: 'bxbphiqpmaabkrv',
	6: 'yk2i3io486h7oqj',
};

function getResultDefinitions(tournament: any) {
	const byId = RESULTS_BY_TOURNAMENT[tournament.id];
	if (byId) return byId;

	const tournamentNumber = Number(tournament.tournamentNumber);
	const legacyId = LEGACY_TOURNAMENT_ID_BY_NUMBER[tournamentNumber];
	if (legacyId) return RESULTS_BY_TOURNAMENT[legacyId];

	return null;
}

// Male pro IDs → MPO; female → FPO
const MPO_PRO_IDS = new Set([
	PROS.gannon.id, PROS.ricky.id, PROS.calvin.id, PROS.isaac.id, PROS.matthew.id,
	PROS.niklas.id, PROS.chris.id, PROS.ezra.id, PROS.eagle.id, PROS.cole.id, PROS.james.id, PROS.jasper.id,
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

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
}

async function getTournamentFranchiseCutPercentage(pb: any, tournament: any): Promise<number> {
	let seasonRecord: any = null;
	if (tournament.seasonRef) {
		seasonRecord = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
	}
	if (!seasonRecord && tournament.season) {
		seasonRecord = await pb
			.collection('seasons')
			.getFirstListItem(`year = ${Number(tournament.season)}`)
			.catch(() => null);
	}

	return clampPercent(Number(seasonRecord?.franchiseCutPercentage ?? tournament.franchiseCutPercentage ?? 0));
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async () => {
	const pb = await getAdminPocketBase();

	const safeGetPayments = async () => {
		const rawPayments = await adminFetch('pro_payments', {
			perPage: 2000,
			fields: 'id,pro,tournament,tournamentResult,recipient,amount,status,created',
			sort: '-created',
		}).catch(() => null as any[] | null);

		if (Array.isArray(rawPayments)) {
			if (rawPayments.length > 0) {
				console.log('[payout-testing][payments-raw-fallback]', { count: rawPayments.length });
			}
			return rawPayments;
		}

		try {
			return await pb.collection('pro_payments').getFullList({ sort: '-created' });
		} catch (sdkErr) {
			console.error('[payout-testing][payments-sdk-error]', {
				sdkErr: (sdkErr as any)?.message ?? sdkErr,
			});
			return [] as any[];
		}
	};

	const [tournaments, allResults, workOrders, auditLogs, allFranchisePayouts] = await Promise.all([
		pb.collection('tournaments').getFullList({ sort: 'tournamentNumber' }),
		pb.collection('tournament_results').getFullList({ sort: 'placement', expand: 'pro,franchise' }).catch(() => [] as any[]),
		pb.collection('work_orders').getFullList({ filter: `source = 'pro_payment'`, sort: '-created' }).catch(() => [] as any[]),
		pb.collection('payment_audit_log').getFullList({ sort: 'changedAt' }).catch(() => [] as any[]),
		pb.collection('franchise_payouts').getFullList({ sort: '-created', expand: 'franchise' }).catch(() => [] as any[]),
	]);

	let allPayments = await safeGetPayments();
	const getRelId = (value: any): string | null => {
		if (!value) return null;
		if (Array.isArray(value)) return (value[0] as string) ?? null;
		return value as string;
	};

	// If a global query fails (e.g., due to malformed legacy row expansions),
	// fall back to small per-tournament queries so counts still render correctly.
	if (allPayments.length === 0 && tournaments.length > 0) {
		const perTournamentPayments = await Promise.all(
			tournaments.map((t: any) =>
				pb.collection('pro_payments').getFullList({ filter: `tournament = '${t.id}'`, sort: '-created' }).catch(() => [] as any[])
			)
		);
		allPayments = perTournamentPayments.flat();
	}

	if (allPayments.length === 0) {
		const rawPayments = await adminFetch('pro_payments', {
			perPage: 2000,
			fields: 'id,tournament,tournamentResult,recipient,amount,status,created',
		}).catch(() => [] as any[]);
		if (rawPayments.length > 0) {
			allPayments = rawPayments;
		}
	}

	const byTournament = await Promise.all(tournaments.map(async (t: any) => {
		const results     = allResults.filter((r: any) => r.tournament === t.id);
		const franchisePayouts = allFranchisePayouts.filter((p: any) => p.tournament === t.id);
		const resultIds   = new Set(results.map((r: any) => r.id));
		let payments      = allPayments.filter((p: any) => {
			const tournamentRef = getRelId(p.tournament);
			const resultRef = getRelId(p.tournamentResult);
			return tournamentRef === t.id || (resultRef && resultIds.has(resultRef));
		});

		if (payments.length === 0 && results.length > 0) {
			const fallbackByResult = await Promise.all(
				results.map((r: any) =>
					pb.collection('pro_payments').getFullList({ filter: `tournamentResult = '${r.id}'`, sort: '-created' }).catch(() => [] as any[])
				)
			);
			const byId = new Map<string, any>();
			for (const p of fallbackByResult.flat()) byId.set(p.id, p);
			payments = Array.from(byId.values());
		}

		const paymentByResultId = new Map<string, { pro: any; mgr: any }>();
		for (const p of payments) {
			const resultRef = getRelId(p.tournamentResult);
			if (!resultRef) continue;
			if (!paymentByResultId.has(resultRef)) paymentByResultId.set(resultRef, { pro: null, mgr: null });
			const slot = paymentByResultId.get(resultRef)!;
			if (p.recipient === 'pro') slot.pro = p;
			if (p.recipient === 'manager') slot.mgr = p;
		}

		const proPayments = payments.filter((p: any) => p.recipient === 'pro');
		const mgrPayments = payments.filter((p: any) => p.recipient === 'manager');
		const wo          = workOrders.find((w: any) => w.projectId === t.id) ?? null;
		const totalPaid   = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const paymentSum  = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const franchisePayoutSum = franchisePayouts.reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0);
		const franchisePending = franchisePayouts
			.filter((p: any) => p.status === 'pending')
			.reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0);
		const franchisePaid = franchisePayouts
			.filter((p: any) => p.status === 'paid')
			.reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0);
		const settledTotal = paymentSum + franchisePayoutSum;
		const mathOk = (payments.length > 0 || franchisePayouts.length > 0) && Math.abs(settledTotal - (t.prizePool ?? 0)) < 1;

		// Build per-pro breakdown keyed by resultId (not proId) so multi-result pros work
		const proBreakdown: any[] = [];
		for (const r of results) {
			const payments_for = paymentByResultId.get(r.id) ?? { pro: null as any, mgr: null as any };
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
		const byFranchise = Array.from(franchiseMap.values())
			.map((group) => {
				const placements = group.rows.map((r: any) => Number(r.placement ?? 999));
				const teamScore = placements.reduce((sum, p) => sum + p, 0);
				const bestPlacement = Math.min(...placements);
				const teamGross = group.rows.reduce((s: number, r: any) => s + (r.proEarnings || 0), 0);
				return {
					...group,
					teamScore,
					bestPlacement,
					teamGross,
				};
			})
			.sort((a, b) => {
				if (a.teamScore !== b.teamScore) return a.teamScore - b.teamScore;
				if (a.bestPlacement !== b.bestPlacement) return a.bestPlacement - b.bestPlacement;
				return b.teamGross - a.teamGross;
			})
			.map((group, idx) => ({
				...group,
				teamPlacement: idx + 1,
			}));

		return {
			tournament: t,
			results, payments, proPayments, mgrPayments,
			franchisePayouts,
			proBreakdown,
			byFranchise,
			wo,
			totalPaid,
			totalPending,
			paymentSum,
			franchisePayoutSum,
			franchisePending,
			franchisePaid,
			settledTotal,
			mathOk,
			resultCount: results.length,
			paymentCount: payments.length,
			pendingProCount: proPayments.filter((p: any) => p.status === 'pending').length,
			pendingMgrCount: mgrPayments.filter((p: any) => p.status === 'pending').length,
			pendingFranchiseCount: franchisePayouts.filter((p: any) => p.status === 'pending').length,
			paidProCount: proPayments.filter((p: any) => p.status === 'paid').length,
			paidMgrCount: mgrPayments.filter((p: any) => p.status === 'paid').length,
		};
	}));

	const openerDebug = byTournament.find((x: any) =>
		x.tournament?.tournamentNumber === 1 || String(x.tournament?.name ?? '').toLowerCase().includes('season opener')
	);
	if (openerDebug) {
		console.log('[payout-testing][opener-debug]', {
			tournamentId: openerDebug.tournament.id,
			tournamentName: openerDebug.tournament.name,
			resultCount: openerDebug.resultCount,
			paymentCount: openerDebug.paymentCount,
			proPayments: openerDebug.proPayments.length,
			managerPayments: openerDebug.mgrPayments.length,
			totalPaid: openerDebug.totalPaid,
			totalPending: openerDebug.totalPending,
			globalPaymentRows: allPayments.length,
		});
	}

	const allLoadedPayments = byTournament.flatMap((t: any) => t.payments);
const uniquePayments = Array.from(new Map(allLoadedPayments.map((p: any) => [p.id, p])).values());

	const seasonSummary = {
		totalPrizePool:      tournaments.reduce((s: number, t: any) => s + (t.prizePool ?? 0), 0),
		totalPayments:       uniquePayments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalFranchisePayouts: allFranchisePayouts.reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0),
		totalPaid:           uniquePayments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalPending:        uniquePayments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		franchisePaidTotal: allFranchisePayouts.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0),
		franchisePendingTotal: allFranchisePayouts.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.totalEarnings ?? 0), 0),
		proPaymentTotal:     uniquePayments.filter((p: any) => p.recipient === 'pro').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		managerPaymentTotal: uniquePayments.filter((p: any) => p.recipient === 'manager').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		paymentRecords:      uniquePayments.length,
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

async function resetTournamentData(pb: any, tournamentId: string) {
	const [results, directPayments, wos, franchisePayouts] = await Promise.all([
		pb.collection('tournament_results').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
		pb.collection('pro_payments').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
		pb.collection('work_orders').getFullList({ filter: `projectId = '${tournamentId}' && source = 'pro_payment'` }).catch(() => [] as any[]),
		pb.collection('franchise_payouts').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
	]);

	const resultIdSet = new Set(results.map((r: any) => r.id));
	const linkedPayments = results.length
		? await pb.collection('pro_payments').getFullList({ fields: 'id,tournamentResult' }).then((rows: any[]) =>
			rows.filter((p: any) => {
				const resultRef = Array.isArray(p.tournamentResult) ? p.tournamentResult[0] : p.tournamentResult;
				return !!resultRef && resultIdSet.has(resultRef);
			})
		).catch(() => [] as any[])
		: [] as any[];

	const paymentsById = new Map<string, any>();
	for (const p of directPayments) paymentsById.set(p.id, p);
	for (const p of linkedPayments) paymentsById.set(p.id, p);

	const paymentIds = Array.from(paymentsById.keys());
	let auditRowsToDelete: any[] = [];
	if (paymentIds.length > 0) {
		const paymentIdSet = new Set(paymentIds);
		const auditRows = await pb.collection('payment_audit_log').getFullList({ fields: 'id,payment' }).catch(() => [] as any[]);
		auditRowsToDelete = auditRows.filter((a: any) => {
			const paymentRef = Array.isArray(a.payment) ? a.payment[0] : a.payment;
			return !!paymentRef && paymentIdSet.has(paymentRef);
		});
	}

	await Promise.all([
		...Array.from(paymentsById.values()).map((p: any) => pb.collection('pro_payments').delete(p.id).catch(() => null)),
		...wos.map((w: any) => pb.collection('work_orders').delete(w.id).catch(() => null)),
		...franchisePayouts.map((fp: any) => pb.collection('franchise_payouts').delete(fp.id).catch(() => null)),
		...auditRowsToDelete.map((a: any) => pb.collection('payment_audit_log').delete(a.id).catch(() => null)),
	]);
	await Promise.all(results.map((r: any) => pb.collection('tournament_results').delete(r.id).catch(() => null)));
	await pb.collection('tournaments').update(tournamentId, { status: 'scheduled' }).catch(() => null);

	return {
		deletedResults: results.length,
		deletedPayments: paymentsById.size,
		deletedFranchisePayouts: franchisePayouts.length,
		deletedWorkOrders: wos.length,
		deletedAuditLogs: auditRowsToDelete.length,
	};
}

export const actions: Actions = {
	seedSeason: async () => {
		const pb = await getAdminPocketBase();

		const tournaments = await pb.collection('tournaments').getFullList({ sort: 'tournamentNumber' }).catch(() => [] as any[]);
		if (tournaments.length === 0) return fail(400, { error: 'No tournaments found' });

		let seededCount = 0;
		let paymentCount = 0;
		const skipped: string[] = [];

		for (const t of tournaments) {
			const defs = getResultDefinitions(t);
			if (!defs) {
				skipped.push(t.name ?? t.id);
				continue;
			}

			const seedReq = new FormData();
			seedReq.set('tournamentId', t.id);
			const result = await actions.seedTournament!({
				request: new Request('http://local.test', { method: 'POST', body: seedReq }),
			} as any);

			if ((result as any)?.status && (result as any)?.status >= 400) {
				const msg = (result as any)?.data?.error ?? 'Unknown seed error';
				return fail(400, {
					error: `Season seed stopped at ${t.name ?? t.id}: ${msg}`,
					seededTournaments: seededCount,
					seededPayments: paymentCount,
					skipped,
				});
			}

			seededCount += 1;
			paymentCount += Number((result as any)?.seeded ?? 0);
		}

		return {
			success: true,
			seededTournaments: seededCount,
			seededPayments: paymentCount,
			skipped,
		};
	},

	resetSeason: async () => {
		const pb = await getAdminPocketBase();

		const tournaments = await pb.collection('tournaments').getFullList({ sort: 'tournamentNumber' }).catch(() => [] as any[]);
		if (tournaments.length === 0) return fail(400, { error: 'No tournaments found' });

		let resetCount = 0;
		let deletedResults = 0;
		let deletedPayments = 0;
		let deletedWorkOrders = 0;
		let deletedAuditLogs = 0;

		for (const t of tournaments) {
			try {
				const stats = await resetTournamentData(pb, t.id);
				resetCount += 1;
				deletedResults += stats.deletedResults;
				deletedPayments += stats.deletedPayments;
				deletedWorkOrders += stats.deletedWorkOrders;
				deletedAuditLogs += stats.deletedAuditLogs;
			} catch (err: any) {
				return fail(400, {
					error: `Season reset stopped at ${t.name ?? t.id}: ${err?.message ?? 'Unknown reset error'}`,
					resetTournaments: resetCount,
					deletedResults,
					deletedPayments,
					deletedWorkOrders,
					deletedAuditLogs,
				});
			}
		}

		return {
			success: true,
			resetTournaments: resetCount,
			deletedResults,
			deletedPayments,
			deletedWorkOrders,
			deletedAuditLogs,
		};
	},

	seedTournament: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const tournament = await pb.collection('tournaments').getOne(tournamentId).catch(() => null);
		if (!tournament) return fail(404, { error: 'Tournament not found' });
		const franchiseCutPercentage = await getTournamentFranchiseCutPercentage(pb, tournament);

		const resultDefs = getResultDefinitions(tournament);
		if (!resultDefs) return fail(400, { error: 'No result definitions for this tournament' });

		const [existingResults, existingPayments, existingFranchisePayouts] = await Promise.all([
			pb.collection('tournament_results').getFullList({ filter: `tournament = '${tournamentId}'`, fields: 'id' }).catch(() => [] as any[]),
			pb.collection('pro_payments').getFullList({ filter: `tournament = '${tournamentId}'`, fields: 'id' }).catch(() => [] as any[]),
			pb.collection('franchise_payouts').getFullList({ filter: `tournament = '${tournamentId}'`, fields: 'id' }).catch(() => [] as any[]),
		]);
		const resultIdSet = new Set(existingResults.map((r: any) => r.id));
		const linkedPayments = existingResults.length
			? await pb.collection('pro_payments').getFullList({ fields: 'id,tournamentResult' }).then((rows: any[]) =>
				rows.filter((p: any) => p.tournamentResult && resultIdSet.has(p.tournamentResult))
			).catch(() => [] as any[])
			: [] as any[];
		const allExistingPayments = new Map<string, any>();
		for (const p of existingPayments) allExistingPayments.set(p.id, p);
		for (const p of linkedPayments) allExistingPayments.set(p.id, p);

		// Always wipe any partial seed data (results + payments) before re-seeding.
		// This recovers from previously failed runs that left orphaned records.
		if (existingResults.length > 0 || allExistingPayments.size > 0 || existingFranchisePayouts.length > 0) {
			await Promise.all([
				...Array.from(allExistingPayments.values()).map((p: any) => pb.collection('pro_payments').delete(p.id).catch(() => null)),
				...existingFranchisePayouts.map((fp: any) => pb.collection('franchise_payouts').delete(fp.id).catch(() => null)),
			]);
			await Promise.all(existingResults.map((r: any) => pb.collection('tournament_results').delete(r.id).catch(() => null)));
		}

		const talentRecords = await pb.collection('talent').getFullList({ fields: 'id,name' }).catch(() => [] as any[]);
		const talentIdByName = new Map<string, string>(
			talentRecords
				.filter((r: any) => !!r?.id && !!r?.name)
				.map((r: any) => [String(r.name).trim().toLowerCase(), String(r.id)])
		);

		const resolvedProIdByLegacyId: Record<string, string> = {};
		for (const pro of Object.values(PROS)) {
			const key = pro.name.trim().toLowerCase();
			const resolved = talentIdByName.get(key) ?? talentIdByName.get(PRO_NAME_ALIASES[key] ?? '');
			if (resolved) resolvedProIdByLegacyId[pro.id] = resolved;
		}

		const unresolvedPros = new Set<string>();
		const resolveSeedProId = (pro: { id: string; name: string }) => {
			const resolved = resolvedProIdByLegacyId[pro.id];
			if (!resolved) unresolvedPros.add(pro.name);
			return resolved;
		};

		const menRowsResolved = resultDefs.men
			.map((r) => {
				const resolvedProId = resolveSeedProId(r.pro);
				if (!resolvedProId) return null;
				return { ...r, resolvedProId, seedDivision: 'mens' as const };
			})
			.filter(Boolean) as Array<ResultRow & { resolvedProId: string; seedDivision: 'mens' }>;

		const womenRowsResolved = resultDefs.women
			.map((r) => {
				const resolvedProId = resolveSeedProId(r.pro);
				if (!resolvedProId) return null;
				return { ...r, resolvedProId, seedDivision: 'womens' as const };
			})
			.filter(Boolean) as Array<ResultRow & { resolvedProId: string; seedDivision: 'womens' }>;

		if (menRowsResolved.length === 0 || womenRowsResolved.length === 0) {
			return fail(400, {
				error: `Unable to seed this tournament. Missing talent records for: ${Array.from(unresolvedPros).join(', ')}`,
			});
		}

		const franchiseRecords = await pb.collection('franchises').getFullList({ fields: 'id' }).catch(() => [] as any[]);
		const validFranchiseIds = new Set(franchiseRecords.map((f: any) => String(f.id)));

		// Set manager data on pros
		await Promise.all(MANAGER_DATA.map(m => {
			const resolvedProId = resolvedProIdByLegacyId[m.proId] ?? m.proId;
			return pb.collection('talent').update(resolvedProId, {
				managerName: m.managerName,
				managerEmail: m.managerEmail,
				managerCutPercentage: m.managerCutPercentage,
			}).catch(() => null);
		}));

		const mgrMap: Record<string, typeof MANAGER_DATA[0]> = {};
		for (const m of MANAGER_DATA) {
			const resolvedProId = resolvedProIdByLegacyId[m.proId] ?? m.proId;
			mgrMap[resolvedProId] = m;
		}

		const prizePool = tournament.prizePool ?? 500000;
		const franchiseCutAmount = prizePool * (franchiseCutPercentage / 100);
		const proPool = prizePool - franchiseCutAmount;
		const allSeedRows = [...menRowsResolved, ...womenRowsResolved];
		const franchiseMap = new Map<
			string,
			{ franchise: string; rows: Array<ResultRow & { resolvedProId: string; seedDivision: 'mens' | 'womens' }>; totalPlacement: number; bestPlacement: number }
		>();

		for (const row of allSeedRows) {
			if (!franchiseMap.has(row.franchise)) {
				franchiseMap.set(row.franchise, {
					franchise: row.franchise,
					rows: [],
					totalPlacement: 0,
					bestPlacement: Number.POSITIVE_INFINITY,
				});
			}
			const entry = franchiseMap.get(row.franchise)!;
			entry.rows.push(row);
			entry.totalPlacement += row.placement;
			entry.bestPlacement = Math.min(entry.bestPlacement, row.placement);
		}

		const teamStandings = Array.from(franchiseMap.values()).sort((a, b) => {
			if (a.totalPlacement !== b.totalPlacement) return a.totalPlacement - b.totalPlacement;
			return a.bestPlacement - b.bestPlacement;
		});

		const teamProPayouts = calcPayouts(proPool, teamStandings.length);
		const teamFranchisePayouts = calcPayouts(franchiseCutAmount, teamStandings.length);
		const allRows = teamStandings.flatMap((team, index) => {
			const teamPlacement = index + 1;
			const teamProPayout = teamProPayouts[index] ?? 0;
			const teamFranchisePayout = teamFranchisePayouts[index] ?? 0;
			const sortedRows = [...team.rows].sort((a, b) => a.placement - b.placement);
			const perMemberPro = splitAmountAcrossMembers(teamProPayout, sortedRows.length);
			const perMemberFranchise = splitAmountAcrossMembers(teamFranchisePayout, sortedRows.length);
			return sortedRows.map((row, rowIdx) => ({
				...row,
				teamPlacement,
				proPayoutAmount: perMemberPro[rowIdx] ?? 0,
				franchisePayoutAmount: perMemberFranchise[rowIdx] ?? 0,
			}));
		});

		const createdPaymentIds: string[] = [];
		let totalPaymentAmount = 0;

		for (const row of allRows) {
			const proId = row.resolvedProId;
			const franchiseId = validFranchiseIds.has(row.franchise) ? row.franchise : undefined;
			const gross     = row.proPayoutAmount ?? 0;
			const franchiseEarnings = row.franchisePayoutAmount ?? 0;
			const mgr       = mgrMap[proId];
			const mgrCutPct = mgr?.managerCutPercentage ?? 0;
			const mgrAmount = mgr ? Math.round(gross * mgrCutPct) / 100 : 0;
			const proNet    = gross - mgrAmount;
			const division = row.seedDivision;

			let result: any;
			try {
				result = await pb.collection('tournament_results').create({
					tournament:           tournamentId,
					pro:                  proId,
					franchise:            franchiseId,
					division,
					placement:            row.placement,
					earnings:             gross + franchiseEarnings,
					franchiseEarnings:    franchiseEarnings,
					proEarnings:          gross,
					managerEarnings:      mgrAmount,
					netProEarnings:       proNet,
					managerCutPercentage: mgrCutPct,
					notes:                `Team #${row.teamPlacement} | ${row.pro.name}${mgr ? ` | mgr: ${mgr.managerName}` : ''}`,
				});
			} catch (err: any) {
				const details = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? 'Unknown error');
				return fail(400, { error: `Failed to seed result for ${row.pro.name} (place ${row.placement}): ${details}` });
			}

			// pro_payments: paymentType is required
			let proPayment: any;
			try {
				proPayment = await pb.collection('pro_payments').create({
					tournament:           tournamentId,
					pro:                  proId,
					tournamentResult:     result.id,
					paymentType:          'tournament',
					recipient:            'pro',
					amount:               proNet,
					grossAmount:          gross,
					netProAmount:         proNet,
					status:               'pending',
					description:          `${row.seedDivision} Place #${row.placement} — ${tournament.name}`,
					managerCutPercentage: mgrCutPct,
				});
			} catch (err: any) {
				const details = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? 'Unknown error');
				return fail(400, { error: `Failed to create pro payment for ${row.pro.name}: ${details}` });
			}
			createdPaymentIds.push(proPayment.id);
			totalPaymentAmount += proNet;

			if (mgr && mgrAmount > 0) {
				let mgrPayment: any = await pb.collection('pro_payments')
					.getFirstListItem(`tournamentResult = '${result.id}' && recipient = 'manager'`)
					.catch(() => null);

				if (mgrPayment) {
					try {
						mgrPayment = await pb.collection('pro_payments').update(mgrPayment.id, {
							amount:               mgrAmount,
							managerAmount:        mgrAmount,
							status:               'pending',
							description:          `Manager cut (${mgrCutPct}%) — ${row.pro.name} — ${tournament.name}`,
							managerName:          mgr.managerName,
							managerEmail:         mgr.managerEmail,
							managerCutPercentage: mgrCutPct,
						});
					} catch (err: any) {
						const details = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? 'Unknown error');
						return fail(400, { error: `Failed to update manager payment for ${row.pro.name}: ${details}` });
					}
				} else {
					const managerPayload = {
						tournament:           tournamentId,
						pro:                  proId,
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
					};

					try {
						mgrPayment = await pb.collection('pro_payments').create(managerPayload);
					} catch (err: any) {
						const relErr = err?.response?.data?.tournamentResult?.code === 'validation_missing_rel_records';
						if (!relErr) {
							const details = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? 'Unknown error');
							return fail(400, { error: `Failed to create manager payment for ${row.pro.name}: ${details}` });
						}

						// Relation occasionally lags after result creation in this environment; retry with refreshed result id.
						const latestResult = await pb.collection('tournament_results')
							.getFirstListItem(`tournament = '${tournamentId}' && pro = '${proId}' && placement = ${row.placement}`, { sort: '-created' })
							.catch(() => null);
						if (!latestResult?.id) {
							const details = err?.response?.data ? JSON.stringify(err.response.data) : (err?.message ?? 'Unknown error');
							return fail(400, { error: `Failed to create manager payment for ${row.pro.name}: ${details}` });
						}

						try {
							mgrPayment = await pb.collection('pro_payments').create({
								...managerPayload,
								tournamentResult: latestResult.id,
							});
						} catch (retryErr: any) {
							const retryRelErr = retryErr?.response?.data?.tournamentResult?.code === 'validation_missing_rel_records';
							if (!retryRelErr) {
								const details = retryErr?.response?.data ? JSON.stringify(retryErr.response.data) : (retryErr?.message ?? 'Unknown error');
								return fail(400, { error: `Failed to create manager payment for ${row.pro.name}: ${details}` });
							}

							// Final fallback: manager payments can exist without tournamentResult relation.
							try {
								mgrPayment = await pb.collection('pro_payments').create({
									...managerPayload,
									tournamentResult: undefined,
								});
							} catch (finalErr: any) {
								const details = finalErr?.response?.data ? JSON.stringify(finalErr.response.data) : (finalErr?.message ?? 'Unknown error');
								return fail(400, { error: `Failed to create manager payment for ${row.pro.name}: ${details}` });
							}
						}
					}
				}
				createdPaymentIds.push(mgrPayment.id);
				totalPaymentAmount += mgrAmount;
			}
		}

		const franchiseSummary = new Map<string, {
			franchiseId: string;
			totalEarnings: number;
			mensEarnings: number;
			womensEarnings: number;
			numberOfPros: number;
		}>();

		for (const row of allRows) {
			const franchiseId = validFranchiseIds.has(row.franchise) ? row.franchise : '';
			if (!franchiseId) continue;
			const amount = row.franchisePayoutAmount ?? 0;
			if (!franchiseSummary.has(franchiseId)) {
				franchiseSummary.set(franchiseId, {
					franchiseId,
					totalEarnings: 0,
					mensEarnings: 0,
					womensEarnings: 0,
					numberOfPros: 0,
				});
			}
			const entry = franchiseSummary.get(franchiseId)!;
			entry.totalEarnings += amount;
			entry.numberOfPros += 1;
			if (row.seedDivision === 'mens') entry.mensEarnings += amount;
			if (row.seedDivision === 'womens') entry.womensEarnings += amount;
		}

		for (const item of franchiseSummary.values()) {
			if (item.totalEarnings <= 0) continue;
			await pb.collection('franchise_payouts').create({
				franchise: item.franchiseId,
				tournament: tournamentId,
				totalEarnings: item.totalEarnings,
				mensEarnings: item.mensEarnings,
				womensEarnings: item.womensEarnings,
				numberOfPros: item.numberOfPros,
				status: 'pending',
			});
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

	markFranchisesPaid: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const payouts = await pb.collection('franchise_payouts').getFullList({
			filter: `tournament = '${tournamentId}' && status = 'pending'`,
		}).catch(() => [] as any[]);

		const paymentDate = new Date().toISOString().split('T')[0];
		await Promise.all(
			payouts.map((p: any) =>
				pb.collection('franchise_payouts').update(p.id, {
					status: 'paid',
					paymentDate,
				})
			)
		);

		return { success: true, paid: payouts.length };
	},

	resetTournament: async ({ request }) => {
		const pb = await getAdminPocketBase();
		const fd = await request.formData();
		const tournamentId = fd.get('tournamentId') as string;
		if (!tournamentId) return fail(400, { error: 'Missing tournamentId' });

		const stats = await resetTournamentData(pb, tournamentId);
		return { success: true, ...stats };
	},
};
