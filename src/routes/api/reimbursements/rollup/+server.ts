import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import type { RequestHandler } from './$types';

type ReimbursementItem = {
	id: string;
	amount?: number;
	date?: string;
	created?: string;
	description?: string;
	category?: string;
	vendor?: string;
	vendorId?: string;
	receiptUrl?: string;
	notes?: string;
	work_order_number?: string;
};

type BucketItem = {
	item: ReimbursementItem;
	amount: number;
	partIndex: number;
	partCount: number;
};

async function getMaxClaimTotal(pb: any): Promise<number> {
	const setting = await pb.collection('settings')
		.getFirstListItem(`key = "${REIMBURSEMENT_MAX_TOTAL_SETTING_KEY}"`, { fields: 'value' })
		.catch(() => null);
	const parsed = Number(setting?.value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;
}

function bucketItems(items: ReimbursementItem[], maxClaimTotal: number): BucketItem[][] {
	const buckets: BucketItem[][] = [];
	let current: BucketItem[] = [];
	let runningTotal = 0;

	for (const item of items) {
		let remaining = Number(item.amount || 0);
		if (remaining <= 0) continue;

		const partCount = Math.ceil(remaining / maxClaimTotal);
		for (let partIndex = 1; partIndex <= partCount; partIndex++) {
			const amount = Math.min(remaining, maxClaimTotal);

			if (runningTotal + amount > maxClaimTotal && current.length > 0) {
				buckets.push(current);
				current = [];
				runningTotal = 0;
			}

			current.push({ item, amount, partIndex, partCount });
			runningTotal += amount;
			remaining -= amount;
		}
	}

	if (current.length > 0) buckets.push(current);
	return buckets;
}

function splitNote(baseNote: string | undefined, partIndex: number, partCount: number): string {
	if (partCount <= 1) return baseNote || '';
	const suffix = `[Auto split ${partIndex}/${partCount} during rollup]`;
	return baseNote?.trim() ? `${baseNote.trim()} ${suffix}` : suffix;
}

// POST /api/reimbursements/rollup
// Body: { claimIds: string[] }
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const role = ctx.profile?.role;
	if (role !== 'admin' && role !== 'leader' && role !== 'marketing_lead' && role !== 'sales' && role !== 'franchise_owner' && role !== 'pro' && role !== 'broadcaster' && role !== 'league_owner') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}
	const isGlobalAdmin = role === 'admin' || role === 'leader';

	const body = await request.json().catch(() => ({}));
	const rawClaimIds: unknown[] = Array.isArray((body as any).claimIds) ? (body as any).claimIds : [];
	const claimIds: string[] = [...new Set(rawClaimIds)].filter(
		(id: unknown): id is string => typeof id === 'string' && id.trim().length > 0
	);

	if (claimIds.length < 2) {
		return json({ message: 'Select at least 2 claims to roll up' }, { status: 400 });
	}

	try {
		const adminPb = await getAdminPocketBase();
		const maxClaimTotal = await getMaxClaimTotal(adminPb);

		const claims = await Promise.all(
			claimIds.map((id) =>
				adminPb.collection('reimbursement_claims').getOne(id, {
					fields: 'id,title,claimant,status,department,notes,is_historical,created'
				})
			)
		);

		if (!isGlobalAdmin) {
			const ownClaimantId = ctx.profile?.id;
			const hasForeignClaim = (claims as any[]).some((c: any) => c.claimant !== ownClaimantId);
			if (hasForeignClaim) {
				return json({ message: 'Unauthorized: you can only roll up your own claims' }, { status: 403 });
			}
		}

		const claimantIds = new Set(claims.map((c: any) => c.claimant).filter(Boolean));
		if (claimantIds.size !== 1) {
			return json({ message: 'All selected claims must belong to the same claimant' }, { status: 400 });
		}

		const nonRollupStatuses = new Set(['paid', 'rejected']);
		const blocked = claims.find((c: any) => nonRollupStatuses.has(c.status));
		if (blocked) {
			return json({ message: `Claim ${blocked.id} cannot be rolled up from status "${blocked.status}"` }, { status: 400 });
		}

		const allItems = await adminPb.collection('reimbursement_items').getFullList({
			filter: claimIds.map((id) => `claim="${id}"`).join(' || '),
			sort: 'date,id'
		});

		if (!allItems.length) {
			return json({ message: 'Selected claims have no line items to roll up' }, { status: 400 });
		}

		const claimCreatedMap = new Map<string, string>();
		for (const claim of claims as any[]) claimCreatedMap.set(claim.id, claim.created || '');

		const sortedItems = [...(allItems as ReimbursementItem[])].sort((a, b) => {
			const claimA = claimCreatedMap.get((a as any).claim) || '';
			const claimB = claimCreatedMap.get((b as any).claim) || '';
			if (claimA !== claimB) return claimA.localeCompare(claimB);
			const dateA = a.date || '';
			const dateB = b.date || '';
			if (dateA !== dateB) return dateA.localeCompare(dateB);
			const createdA = a.created || '';
			const createdB = b.created || '';
			if (createdA !== createdB) return createdA.localeCompare(createdB);
			return a.id.localeCompare(b.id);
		});

		const buckets = bucketItems(sortedItems, maxClaimTotal);
		if (!buckets.length) {
			return json({ message: 'No valid line items found for rollup' }, { status: 400 });
		}

		const sourceTitle = claims[0]?.title || 'Rolled Up Claim';
		const claimantId = claims[0]?.claimant || null;
		const departmentId = claims[0]?.department || null;
		const isHistorical = claims.some((c: any) => !!c.is_historical);
		const rolledClaimIds: string[] = [];

		if (!claimantId) {
			return json({ message: 'Selected claims are missing a claimant' }, { status: 400 });
		}

		for (let i = 0; i < buckets.length; i++) {
			const bucket = buckets[i];
			const bucketTotal = bucket.reduce((sum, x) => sum + Number(x.amount || 0), 0);
			const titleSuffix = buckets.length > 1 ? ` (${i + 1}/${buckets.length})` : '';
			const createData: Record<string, any> = {
				title: `Rollup - ${sourceTitle}${titleSuffix}`,
				claimant: claimantId,
				status: 'under_review',
				totalAmount: bucketTotal,
				notes: `Rolled up from ${claimIds.length} claim(s): ${claimIds.join(', ')}`
			};
			if (departmentId) createData.department = departmentId;
			createData.is_historical = isHistorical;

			const claim = await adminPb.collection('reimbursement_claims').create(createData);

			rolledClaimIds.push(claim.id);

			for (const entry of bucket) {
				const source = entry.item;
				const nextNotes = splitNote(source.notes, entry.partIndex, entry.partCount);

				if (entry.partIndex === 1) {
					await adminPb.collection('reimbursement_items').update(source.id, {
						claim: claim.id,
						amount: entry.amount,
						notes: nextNotes
					});
				} else {
					await adminPb.collection('reimbursement_items').create({
						claim: claim.id,
						description: source.description || '',
						amount: entry.amount,
						date: source.date || null,
						category: source.category || 'other',
						vendor: source.vendor || '',
						vendorId: source.vendorId || null,
						receiptUrl: source.receiptUrl || '',
						notes: nextNotes,
						work_order_number: source.work_order_number || ''
					});
				}
			}
		}

		for (const oldClaimId of claimIds) {
			await adminPb.collection('reimbursement_claims').delete(oldClaimId).catch(() => {});
		}

		return json({
			ok: true,
			rolledClaimIds,
			sourceClaimIds: claimIds,
			itemCount: allItems.length,
			maxClaimTotal
		});
	} catch (err: any) {
		const message = err?.response?.message ?? err?.message ?? 'Failed to roll up claims';
		const details = err?.response?.data ?? null;
		return json({ message, details }, { status: 500 });
	}
};
