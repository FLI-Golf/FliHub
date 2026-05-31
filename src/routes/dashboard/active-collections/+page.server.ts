import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const [payments, purchaseOrders, sponsors, auditLog] = await Promise.all([
		adminFetch('sponsor_payments', {
			sort:   '-created',
			expand: 'sponsor,recordedBy,poId',
		}).catch(() => []),
		adminFetch('sponsor_purchase_orders', {
			sort:   '-created',
			expand: 'sponsorId',
		}).catch(() => []),
		adminFetch('sponsors', {
			fields: 'id,companyName,tier,annualCommitment,status,pipeline_stage,assignedTo,totalPaid',
			expand: 'assignedTo',
			sort:   'companyName',
		}).catch(() => []),
		adminFetch('sponsor_audit_log', {
			sort:   '-created',
			expand: 'performedBy',
		}).catch(() => []),
	]);

	// Roll up per-sponsor payment totals
	const rollup: Record<string, {
		invoiced: number; scheduled: number; partial: number;
		received: number; overdue: number; disputed: number;
		write_off: number; bad_debt: number; total: number;
	}> = {};

	for (const p of payments as any[]) {
		const sid = typeof p.sponsor === 'object' ? p.sponsor?.id : p.sponsor;
		if (!sid) continue;
		rollup[sid] ??= {
			invoiced: 0, scheduled: 0, partial: 0, received: 0,
			overdue: 0, disputed: 0, write_off: 0, bad_debt: 0, total: 0,
		};
		const amt = p.amount ?? 0;
		if (!['write_off', 'bad_debt'].includes(p.status)) rollup[sid].total += amt;
		if (p.status === 'received')  rollup[sid].received  += amt;
		if (p.status === 'invoiced')  rollup[sid].invoiced  += amt;
		if (p.status === 'scheduled') rollup[sid].scheduled += amt;
		if (p.status === 'partial')   rollup[sid].partial   += amt;
		if (p.status === 'overdue')   rollup[sid].overdue   += amt;
		if (p.status === 'disputed')  rollup[sid].disputed  += amt;
		if (p.status === 'write_off') rollup[sid].write_off += amt;
		if (p.status === 'bad_debt')  rollup[sid].bad_debt  += amt;
	}

	// Enrich each sponsor
	const enriched = (sponsors as any[]).map(sp => ({
		...sp,
		_rollup: rollup[sp.id] ?? {
			invoiced: 0, scheduled: 0, partial: 0, received: 0,
			overdue: 0, disputed: 0, write_off: 0, bad_debt: 0, total: 0,
		},
		_payments: (payments as any[])
			.filter(p => {
				const sid = typeof p.sponsor === 'object' ? p.sponsor?.id : p.sponsor;
				return sid === sp.id;
			})
			.sort((a: any, b: any) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')),
		_pos: (purchaseOrders as any[])
			.filter(po => {
				const sid = typeof po.sponsorId === 'object' ? po.sponsorId?.id : po.sponsorId;
				return sid === sp.id;
			})
			.sort((a: any, b: any) => (b.created ?? '').localeCompare(a.created ?? '')),
		_auditLog: (auditLog as any[])
			.filter(e => e.sponsorId === sp.id)
			.slice(0, 30),
	}));

	// Summary totals
	const allPmts = payments as any[];
	const totalReceived  = allPmts.filter(p => p.status === 'received').reduce((s, p) => s + (p.amount ?? 0), 0);
	const totalInvoiced  = allPmts.filter(p => p.status === 'invoiced').reduce((s, p) => s + (p.amount ?? 0), 0);
	const totalOverdue   = allPmts.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount ?? 0), 0);
	const totalDisputed  = allPmts.filter(p => p.status === 'disputed').reduce((s, p) => s + (p.amount ?? 0), 0);
	const totalWriteOff  = allPmts.filter(p => ['write_off', 'bad_debt'].includes(p.status)).reduce((s, p) => s + (p.amount ?? 0), 0);
	const totalCommitted = (sponsors as any[]).reduce((s, sp) => s + (sp.annualCommitment ?? 0), 0);
	const collectionRate = totalCommitted > 0 ? Math.round((totalReceived / totalCommitted) * 100) : 0;

	const allPOs = purchaseOrders as any[];
	const totalPOOverdue  = allPOs.filter(p => p.status === 'overdue').length;
	const totalPODisputed = allPOs.filter(p => p.status === 'disputed').length;

	return {
		sponsors: enriched,
		summary: {
			totalReceived, totalInvoiced, totalOverdue,
			totalDisputed, totalWriteOff, totalCommitted, collectionRate,
			totalPOOverdue, totalPODisputed,
			sponsorCount: (sponsors as any[]).length,
		},
		userRole: ctx.profile?.role ?? null,
	};
};
