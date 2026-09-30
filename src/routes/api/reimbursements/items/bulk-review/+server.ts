import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import {
	FINALIZED_STATUSES,
	duplicateSignature,
	findMissingSchema,
	planGroupArchive,
	recalculateClaimTotal
} from '$lib/server/reimbursements/review';
import type { RequestHandler } from './$types';

const MAX_BULK_ITEMS = 200;

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin' && ctx.role !== 'leader') {
		return json({ message: 'Administrator access is required' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const action = String(body.action ?? '');
	const reason = String(body.reason ?? '').trim();
	const itemIds: string[] = [...new Set(
		(Array.isArray(body.itemIds) ? body.itemIds : [])
			.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
	)];

	if (action !== 'archive' && action !== 'keep') return json({ message: 'Invalid bulk review action' }, { status: 400 });
	if (!reason) return json({ message: 'A review reason is required' }, { status: 400 });
	if (!itemIds.length) return json({ message: 'Select at least one record' }, { status: 400 });
	if (itemIds.length > MAX_BULK_ITEMS) {
		return json({ message: `Select at most ${MAX_BULK_ITEMS} records per bulk action` }, { status: 400 });
	}

	try {
		const pb = await getAdminPocketBase();

		const missingSchema = await findMissingSchema(pb);
		if (missingSchema.length) {
			return json({
				message: 'The reimbursement integrity migration has not been applied to this database, so review actions cannot be recorded. Run "pnpm migrate:reimbursements:integrity:apply".',
				missingSchema
			}, { status: 503 });
		}

		const selected = [];
		for (const itemId of itemIds) {
			const item = await pb.collection('reimbursement_items').getOne(itemId).catch(() => null);
			if (!item) return json({ message: `Line item ${itemId} was not found` }, { status: 404 });
			const claim = await pb.collection('reimbursement_claims').getOne(item.claim, {
				fields: 'id,title,status,claimant'
			}).catch(() => null);
			if (!claim) return json({ message: `Claim for line item ${itemId} was not found` }, { status: 404 });
			if (action === 'archive' && FINALIZED_STATUSES.has(claim.status)) {
				return json({
					message: `Line item ${itemId} belongs to a ${claim.status} claim and is financially finalized`
				}, { status: 409 });
			}
			selected.push({ item, claim });
		}

		let toProcess = selected;
		let retainedIds: string[] = [];

		if (action === 'archive') {
			const activeBySignature = new Map<string, number>();
			const allItems = await pb.collection('reimbursement_items').getFullList({
				fields: 'id,claim,date,amount,isArchived'
			});
			const claimantByClaim = new Map<string, string>();
			for (const { claim } of selected) claimantByClaim.set(claim.id, claim.claimant);

			const signaturesNeeded = new Set(
				selected.map(({ item, claim }) => duplicateSignature(claim.claimant, item.date, item.amount))
			);
			for (const candidate of allItems as any[]) {
				if (candidate.isArchived === true) continue;
				const claimantId = claimantByClaim.get(candidate.claim);
				if (!claimantId) continue;
				const signature = duplicateSignature(claimantId, candidate.date, candidate.amount);
				if (!signaturesNeeded.has(signature)) continue;
				activeBySignature.set(signature, (activeBySignature.get(signature) ?? 0) + 1);
			}

			const plan = planGroupArchive(
				selected
					.filter(({ item }) => item.isArchived !== true)
					.map(({ item, claim }) => ({
						id: item.id,
						signature: duplicateSignature(claim.claimant, item.date, item.amount),
						duplicateReviewStatus: item.duplicateReviewStatus,
						receiptCount: (item.receipts ?? []).length,
						hasBankStatement: !!item.bankStatement,
						created: item.created
					})),
				activeBySignature
			);

			const archiveIds = new Set(plan.archiveIds);
			retainedIds = plan.retainedIds;
			toProcess = selected.filter(({ item }) => archiveIds.has(item.id));

			if (!toProcess.length) {
				return json({
					message: 'Nothing to archive — each selected group already has only one record remaining.'
				}, { status: 409 });
			}
		}

		const eventAt = new Date().toISOString();
		const performed: Array<{ itemId: string; rollback: Record<string, unknown>; auditId?: string }> = [];
		const affectedClaimIds = new Set<string>();

		try {
			for (const { item, claim } of toProcess) {
				const update: Record<string, unknown> = action === 'archive'
					? {
						isArchived: true,
						archivedAt: eventAt,
						archivedBy: ctx.profile?.id ?? null,
						archiveReason: reason,
						duplicateReviewStatus: 'archived'
					}
					: { duplicateReviewStatus: 'keep' };

				const rollback: Record<string, unknown> = action === 'archive'
					? {
						isArchived: item.isArchived ?? false,
						archivedAt: item.archivedAt ?? null,
						archivedBy: item.archivedBy ?? null,
						archiveReason: item.archiveReason ?? '',
						duplicateReviewStatus: item.duplicateReviewStatus ?? ''
					}
					: { duplicateReviewStatus: item.duplicateReviewStatus ?? '' };

				await pb.collection('reimbursement_items').update(item.id, update);
				const audit = await pb.collection('reimbursement_item_audit').create({
					itemRecordId: item.id,
					claimRecordId: claim.id,
					action,
					performedBy: ctx.profile?.id ?? null,
					eventAt,
					reason,
					snapshot: {
						vendor: item.vendor,
						description: item.description,
						amount: item.amount,
						date: item.date,
						claimTitle: claim.title,
						claimStatus: claim.status,
						receipts: item.receipts,
						bankStatement: item.bankStatement,
						bulk: true
					}
				});

				performed.push({ itemId: item.id, rollback, auditId: audit?.id });
				affectedClaimIds.add(claim.id);
			}

			if (action === 'archive') {
				for (const claimId of affectedClaimIds) await recalculateClaimTotal(pb, claimId);
			}
		} catch (bulkError) {
			for (const entry of [...performed].reverse()) {
				if (entry.auditId) await pb.collection('reimbursement_item_audit').delete(entry.auditId).catch(() => {});
				await pb.collection('reimbursement_items').update(entry.itemId, entry.rollback).catch(() => {});
			}
			throw bulkError;
		}

		return json({
			ok: true,
			action,
			processed: performed.length,
			retained: retainedIds.length,
			claimsUpdated: affectedClaimIds.size
		});
	} catch (error: any) {
		const detail = error?.response?.message ?? error?.message ?? 'Unknown error';
		console.error('[reimb-review] bulk action failed:', detail);
		return json({ message: `Unable to complete bulk review action: ${detail}` }, { status: 500 });
	}
};
