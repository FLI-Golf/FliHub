import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx     = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin' || profile?.role === 'leader';

	if (!isAdmin) redirect(302, '/dashboard/reimbursements');

	const adminPb = await getAdminPocketBase();

	const [claims, items] = await Promise.all([
		adminPb.collection('reimbursement_claims').getFullList({
			sort:   '-id',
			expand: 'claimant,paidBy,department'
		}).catch(() => []),
		adminPb.collection('reimbursement_items').getFullList({
			sort: 'date'
		}).catch(() => []),
	]);

	const claimIds = [...new Set((claims as any[]).map((c: any) => String(c.id || '').trim()).filter(Boolean))];
	const refs = [...new Set((claims as any[])
		.map((c: any) => String(c.work_order_number || c.referenceNumber || '').trim())
		.filter(Boolean))];

	const quote = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	const eqAny = (field: string, values: string[]) => values.length
		? `(${values.map((v) => `${field}=${quote(v)}`).join(' || ')})`
		: '';

	const filterParts = [eqAny('claimId', claimIds), eqAny('work_order_number', refs)].filter(Boolean);
	const workOrderFilter = filterParts.join(' || ');

	let workOrders: any[] = [];
	try {
		workOrders = await adminPb.collection('work_orders').getFullList({
			sort: '-created'
		});
	} catch (e: any) {
		console.error('[reimb-admin] failed to load work orders', {
			message: e?.response?.message || e?.message || 'unknown error',
			data: e?.response?.data || null
		});
		workOrders = [];
	}

	if (!workOrders.length && (claimIds.length || refs.length)) {
		const byRef = await Promise.all(
			refs.map((ref) =>
				adminPb.collection('work_orders')
					.getFirstListItem(`work_order_number=${quote(ref)}`)
					.catch(() => null)
			)
		);

		const byClaim = await Promise.all(
			claimIds.map((id) =>
				adminPb.collection('work_orders')
					.getFirstListItem(`claimId=${quote(id)}`)
					.catch(() => null)
			)
		);

		const dedup = new Map<string, any>();
		for (const wo of [...byRef, ...byClaim]) {
			if (wo?.id) dedup.set(wo.id, wo);
		}
		workOrders = [...dedup.values()];

		if (dev) {
			console.log('[reimb-admin] work-order targeted fallback used', {
				refsQueried: refs.length,
				claimIdsQueried: claimIds.length,
				fallbackLoaded: workOrders.length
			});
		}
	}

	if (claimIds.length || refs.length) {
		const claimIdSet = new Set(claimIds);
		const refSet = new Set(refs.map((r) => r.toLowerCase()));
		workOrders = workOrders.filter((wo: any) => {
			const claimId = String(wo?.claimId || '').trim();
			const workOrderNumber = String(wo?.work_order_number || '').trim().toLowerCase();
			return claimIdSet.has(claimId) || refSet.has(workOrderNumber);
		});
	}

	if (dev) {
		if (!workOrders.length && (claimIds.length || refs.length)) {
			console.warn('[reimb-admin] no work orders loaded for reimbursement admin view', {
				claims: claimIds.length,
				refs: refs.length,
				workOrderFilter: workOrderFilter || null
			});
		}

		const paidClaimDiagnostics = (claims as any[])
			.filter((c: any) => c.status === 'paid')
			.map((claim: any) => {
				const ref = String(claim.work_order_number || claim.referenceNumber || '').trim();
				const byClaim = workOrders.find((wo: any) => String(wo?.claimId || '').trim() === String(claim.id || '').trim());
				const byRef = ref
					? workOrders.find((wo: any) => String(wo?.work_order_number || '').trim().toLowerCase() === ref.toLowerCase())
					: null;
				const matched = byClaim || byRef || null;
				return {
					claimId: claim.id,
					title: claim.title,
					claimRef: ref || null,
					matchStrategy: byClaim ? 'claimId' : byRef ? 'referenceNumber' : 'none',
					matchedWorkOrder: matched?.work_order_number || null,
					qbTransactionId: matched?.qb_transaction_id || null
				};
			});

		console.log('[reimb-admin] paid claim qb diagnostics', {
			workOrdersLoaded: workOrders.length,
			paidClaims: paidClaimDiagnostics.length,
			paidClaimDiagnostics
		});
	}

	const metrics = {
		total:       claims.length,
		draft:       claims.filter((c: any) => c.status === 'draft').length,
		submitted:   claims.filter((c: any) => c.status === 'submitted').length,
		under_review:claims.filter((c: any) => c.status === 'under_review').length,
		approved:    claims.filter((c: any) => c.status === 'approved').length,
		paid:        claims.filter((c: any) => c.status === 'paid').length,
		rejected:    claims.filter((c: any) => c.status === 'rejected').length,
		totalPaid:   claims.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
		totalApproved: claims.filter((c: any) => c.status === 'approved').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
		totalPending:  claims.filter((c: any) => c.status === 'submitted' || c.status === 'under_review').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
	};

	return { claims, items, workOrders, metrics, profile, isAdmin };
};
