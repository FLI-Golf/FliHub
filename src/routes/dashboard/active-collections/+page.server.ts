import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const [pos, payments, sponsors, auditLog] = await Promise.all([
		adminFetch('sponsor_purchase_orders', {
			sort:   '-created',
			expand: 'sponsorId',
		}).catch(() => []),
		adminFetch('sponsor_payments', {
			sort:   '-dueDate',
			expand: 'sponsor',
		}).catch(() => []),
		adminFetch('sponsors', {
			fields: 'id,companyName,tier,annualCommitment,assignedTo',
			expand: 'assignedTo',
			sort:   'companyName',
		}).catch(() => []),
		adminFetch('sponsor_audit_log', {
			sort: '-created',
		}).catch(() => []),
	]);

	// Index payments by poId for quick lookup
	const paymentsByPO: Record<string, any[]> = {};
	for (const p of payments as any[]) {
		const pid = p.poId;
		if (!pid) continue;
		paymentsByPO[pid] ??= [];
		paymentsByPO[pid].push(p);
	}

	// Index audit log by poId
	const auditByPO: Record<string, any[]> = {};
	for (const e of auditLog as any[]) {
		if (!e.poId) continue;
		auditByPO[e.poId] ??= [];
		auditByPO[e.poId].push(e);
	}

	// Index sponsors by id
	const sponsorMap: Record<string, any> = {};
	for (const sp of sponsors as any[]) sponsorMap[sp.id] = sp;

	// Enrich each PO
	const enriched = (pos as any[]).map(po => {
		const sid     = typeof po.sponsorId === 'object' ? po.sponsorId?.id : po.sponsorId;
		const sponsor = po.expand?.sponsorId ?? sponsorMap[sid] ?? null;
		const pmts    = paymentsByPO[po.id] ?? [];
		const received = pmts.filter((p: any) => p.status === 'received').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		return {
			...po,
			_sponsor:  sponsor,
			_payments: pmts,
			_auditLog: (auditByPO[po.id] ?? []).slice(0, 20),
			_received: received,
		};
	});

	// Stage counts for KPI strip
	const stageCounts: Record<string, number> = {};
	for (const po of enriched) {
		stageCounts[po.status] = (stageCounts[po.status] ?? 0) + 1;
	}

	// Summary totals
	const totalCommitted = enriched.reduce((s, po) => s + (po.amount ?? 0), 0);
	const totalReceived  = enriched.reduce((s, po) => s + po._received, 0);
	const totalOverdue   = enriched.filter(po => po.status === 'overdue').reduce((s, po) => s + (po.amount ?? 0), 0);
	const totalDisputed  = enriched.filter(po => po.status === 'disputed').reduce((s, po) => s + (po.amount ?? 0), 0);
	const totalWriteOff  = enriched.filter(po => ['write_off','bad_debt'].includes(po.status)).reduce((s, po) => s + (po.amount ?? 0), 0);
	const collectionRate = totalCommitted > 0 ? Math.round((totalReceived / totalCommitted) * 100) : 0;

	return {
		pos: enriched,
		stageCounts,
		summary: { totalCommitted, totalReceived, totalOverdue, totalDisputed, totalWriteOff, collectionRate },
		userRole: ctx.profile?.role ?? null,
	};
};
