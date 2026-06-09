import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

const ALLOWED_SOURCE_STATUSES = new Set(['draft', 'submitted', 'under_review']);
const MAX_TRANSACTIONS_LIMIT = 10;

function quote(value: string): string {
	return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
	if (size <= 0) return [items];
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

async function fetchClaimsByIds(adminPb: any, claimIds: string[]) {
	const claims: any[] = [];
	const missing: string[] = [];

	for (const claimId of claimIds) {
		try {
			const claim = await adminPb.collection('reimbursement_claims').getOne(claimId, {
				fields: 'id,title,status,claimant,department,is_historical,referenceNumber,totalAmount,created'
			});
			claims.push(claim);
		} catch {
			missing.push(claimId);
		}
	}

	claims.sort((a: any, b: any) => String(a.created || '').localeCompare(String(b.created || '')));
	return { claims, missing };
}

async function fetchItemsForClaims(adminPb: any, claimIds: string[]) {
	const items: any[] = [];

	for (const claimId of claimIds) {
		const claimItems = await adminPb.collection('reimbursement_items').getFullList({
			filter: `claim=${quote(claimId)}`,
			fields: 'id,claim,description,amount,date,category,vendor,vendorId,receiptUrl,notes,created'
		}).catch(() => [] as any[]);
		items.push(...claimItems);
	}

	items.sort((a: any, b: any) => {
		const byDate = String(a.date || '').localeCompare(String(b.date || ''));
		if (byDate !== 0) return byDate;
		return String(a.created || '').localeCompare(String(b.created || ''));
	});

	return items;
}

// POST /api/reimbursements/rollup
// Merges selected reimbursement claims into grouped claims with max N line items each.
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin' && ctx.role !== 'leader') {
		return json({ message: 'Only admins/leaders can roll up reimbursement claims' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({} as any));
	const claimIds = Array.from(new Set(((body?.claimIds ?? []) as unknown[])
		.map((id) => String(id || '').trim())
		.filter(Boolean)));

	if (claimIds.length < 2) {
		return json({ message: 'Select at least 2 claims to roll up' }, { status: 400 });
	}

	const requestedMax = Number(body?.maxTransactionsPerClaim ?? MAX_TRANSACTIONS_LIMIT);
	const maxTransactionsPerClaim = Number.isFinite(requestedMax)
		? Math.max(1, Math.min(MAX_TRANSACTIONS_LIMIT, Math.floor(requestedMax)))
		: MAX_TRANSACTIONS_LIMIT;

	try {
		const adminPb = await getAdminPocketBase();
		const { claims, missing } = await fetchClaimsByIds(adminPb, claimIds);

		if (missing.length) {
			return json({ message: `Some claims were not found: ${missing.join(', ')}` }, { status: 404 });
		}

		const invalidStatusClaims = (claims as any[]).filter((c: any) => !ALLOWED_SOURCE_STATUSES.has(String(c.status || '')));
		if (invalidStatusClaims.length) {
			return json({
				message: 'Only draft, pending, or under-review claims can be rolled up. Remove claims that are approved, paid, or rejected.',
				invalidClaimIds: invalidStatusClaims.map((c: any) => c.id)
			}, { status: 400 });
		}

		const claimantIds = new Set((claims as any[]).map((c: any) => String(c.claimant || '').trim()).filter(Boolean));
		if (claimantIds.size !== 1) {
			return json({ message: 'Selected claims must belong to the same claimant' }, { status: 400 });
		}

		const items = await fetchItemsForClaims(adminPb, claimIds);

		if (items.length < 2) {
			return json({ message: 'Need at least 2 transactions across selected claims to roll up' }, { status: 400 });
		}

		const claimById = new Map<string, any>();
		for (const claim of claims as any[]) claimById.set(String(claim.id), claim);

		type GroupBucket = {
			status: string;
			department: string | null;
			isHistorical: boolean;
			sourceClaimIds: string[];
			items: any[];
		};

		const groups = new Map<string, GroupBucket>();
		for (const item of items as any[]) {
			const parent = claimById.get(String(item.claim || '').trim());
			if (!parent) continue;
			const status = String(parent.status || 'draft');
			const department = parent.department ? String(parent.department) : null;
			const isHistorical = !!parent.is_historical;
			const groupKey = `${status}::${department || 'none'}::${isHistorical ? 'historical' : 'current'}`;

			if (!groups.has(groupKey)) {
				groups.set(groupKey, {
					status,
					department,
					isHistorical,
					sourceClaimIds: [],
					items: []
				});
			}

			const bucket = groups.get(groupKey)!;
			bucket.items.push(item);
			if (!bucket.sourceClaimIds.includes(String(parent.id))) {
				bucket.sourceClaimIds.push(String(parent.id));
			}
		}

		const claimant = [...claimantIds][0];
		const nowLabel = new Date().toISOString().slice(0, 10);
		const createdClaimIds: string[] = [];
		let movedItems = 0;

		for (const bucket of groups.values()) {
			const chunks = chunkArray(bucket.items, maxTransactionsPerClaim);

			for (let idx = 0; idx < chunks.length; idx++) {
				const chunk = chunks[idx];
				const totalAmount = chunk.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
				const rolledClaim = await adminPb.collection('reimbursement_claims').create({
					title: `Reimbursement Rollup ${nowLabel} (${idx + 1}/${chunks.length})`,
					claimant,
					status: bucket.status,
					totalAmount,
					notes: `Auto roll-up from claims: ${bucket.sourceClaimIds.join(', ')}`,
					department: bucket.department,
					is_historical: bucket.isHistorical
				});

				createdClaimIds.push(String(rolledClaim.id));

				for (const item of chunk) {
					await adminPb.collection('reimbursement_items').update(item.id, {
						claim: rolledClaim.id
					});
					movedItems++;
				}
			}
		}

		let deletedSourceClaims = 0;
		const deleteWarnings: string[] = [];
		for (const claimId of claimIds) {
			try {
				const relatedApprovals = await adminPb.collection('approvals').getFullList({
					filter: `entityType='expense' && entityId=${quote(claimId)}`,
					fields: 'id'
				}).catch(() => [] as any[]);

				for (const approval of relatedApprovals) {
					await adminPb.collection('approvals').delete(approval.id).catch(() => null);
				}

				await adminPb.collection('reimbursement_claims').delete(claimId);
				deletedSourceClaims++;
			} catch (err: any) {
				deleteWarnings.push(`${claimId}: ${err?.response?.message || err?.message || 'delete failed'}`);
			}
		}

		return json({
			sourceClaims: claimIds.length,
			createdClaims: createdClaimIds.length,
			movedItems,
			deletedSourceClaims,
			maxTransactionsPerClaim,
			warnings: deleteWarnings
		});
	} catch (err: any) {
		const status = Number(err?.status ?? err?.response?.status ?? 500);
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed to roll up claims' }, { status: Number.isFinite(status) ? status : 500 });
	}
};
