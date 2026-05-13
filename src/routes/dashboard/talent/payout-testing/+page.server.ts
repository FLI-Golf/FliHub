import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb  = await getAdminPocketBase();

	// Load all tournaments with results
	const [tournaments, seasons, allPayments, allResults, workOrders, auditLogs] = await Promise.all([
		pb.collection('tournaments').getFullList({
			sort:   'tournamentNumber',
			expand: 'seasonRef',
		}),
		pb.collection('seasons').getFullList({ sort: '-year' }),
		pb.collection('pro_payments').getFullList({
			sort:   '-created',
			expand: 'pro,tournament',
		}).catch(() => []),
		pb.collection('tournament_results').getFullList({
			sort:   'placement',
			expand: 'pro,franchise,tournament',
		}).catch(() => []),
		pb.collection('work_orders').getFullList({
			filter: `source = 'pro_payment'`,
			sort:   '-created',
		}).catch(() => []),
		pb.collection('payment_audit_log').getFullList({
			sort: 'changedAt',
		}).catch(() => []),
	]);

	// Group results and payments by tournament
	const byTournament = tournaments.map((t: any) => {
		const results  = allResults.filter((r: any) => r.tournament === t.id);
		const payments = allPayments.filter((p: any) => p.tournament === t.id);
		const wo       = workOrders.find((w: any) => w.projectId === t.id) ?? null;

		const proPayments     = payments.filter((p: any) => p.recipient === 'pro');
		const managerPayments = payments.filter((p: any) => p.recipient === 'manager');

		const totalPaid    = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const totalAmount  = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

		// Per-pro breakdown
		const proMap: Record<string, any> = {};
		for (const r of results) {
			const proId   = r.pro;
			const proName = r.expand?.pro?.name ?? proId;
			if (!proMap[proId]) {
				proMap[proId] = {
					proId, proName,
					division:        r.division,
					mpoResults:      [],
					fpoResults:      [],
					proPayments:     [],
					managerPayments: [],
				};
			}
			if (r.division === 'MPO') proMap[proId].mpoResults.push(r);
			else                       proMap[proId].fpoResults.push(r);
		}
		for (const p of proPayments) {
			const proId = p.pro;
			if (proMap[proId]) proMap[proId].proPayments.push(p);
		}
		for (const p of managerPayments) {
			const proId = p.pro;
			if (proMap[proId]) proMap[proId].managerPayments.push(p);
		}

		// Math verification: sum of all pro+manager payments should equal prize pool
		const paymentSum = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const mathOk     = Math.abs(paymentSum - (t.prizePool ?? 0)) < 1;

		return {
			tournament:      t,
			results,
			payments,
			proPayments,
			managerPayments,
			proBreakdown:    Object.values(proMap),
			wo,
			totalPaid,
			totalPending,
			totalAmount,
			paymentSum,
			mathOk,
			resultCount:     results.length,
			paymentCount:    payments.length,
		};
	});

	// Season-level summary
	const seasonSummary = {
		totalPrizePool:    tournaments.reduce((s: number, t: any) => s + (t.prizePool ?? 0), 0),
		totalPayments:     allPayments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalPaid:         allPayments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		totalPending:      allPayments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		proPaymentTotal:   allPayments.filter((p: any) => p.recipient === 'pro').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		managerPaymentTotal: allPayments.filter((p: any) => p.recipient === 'manager').reduce((s: number, p: any) => s + (p.amount ?? 0), 0),
		paymentRecords:    allPayments.length,
		workOrderCount:    workOrders.length,
		auditEntries:      auditLogs.length,
		completedTournaments: tournaments.filter((t: any) => t.status === 'completed').length,
	};

	// Audit log grouped by payment
	const auditByPayment: Record<string, any[]> = {};
	for (const e of auditLogs) {
		if (!auditByPayment[e.payment]) auditByPayment[e.payment] = [];
		auditByPayment[e.payment].push(e);
	}

	return {
		byTournament,
		seasonSummary,
		workOrders,
		auditByPayment,
		seasons,
	};
};
