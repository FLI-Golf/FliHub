import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import {
	FINALIZED_STATUSES,
	findMissingSchema,
	recalculateClaimTotal
} from '$lib/server/reimbursements/review';
import type { RequestHandler } from './$types';

const ACTIONS = new Set(['keep', 'archive', 'restore', 'confirm_business_purpose', 'mark_business_purpose_unconfirmed']);

async function getMaxClaimTotal(pb: any): Promise<number> {
	const setting = await pb.collection('settings')
		.getFirstListItem(`key = "${REIMBURSEMENT_MAX_TOTAL_SETTING_KEY}"`, { fields: 'value' })
		.catch(() => null);
	const parsed = Number(setting?.value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;
}

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin' && ctx.role !== 'leader') {
		return json({ message: 'Administrator access is required' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const action = String(body.action ?? '');
	const reason = String(body.reason ?? '').trim();
	if (!ACTIONS.has(action)) return json({ message: 'Invalid review action' }, { status: 400 });
	if (!reason) return json({ message: 'A review reason is required' }, { status: 400 });

	try {
		const pb = await getAdminPocketBase();

		const missingSchema = await findMissingSchema(pb);
		if (missingSchema.length) {
			return json({
				message: 'The reimbursement integrity migration has not been applied to this database, so review actions cannot be recorded. Run "pnpm migrate:reimbursements:integrity:apply".',
				missingSchema
			}, { status: 503 });
		}

		const item = await pb.collection('reimbursement_items').getOne(params.itemId);
		const claim = await pb.collection('reimbursement_claims').getOne(item.claim, {
			fields: 'id,title,status,totalAmount,claimant'
		});
		if ((action === 'archive' || action === 'restore') && FINALIZED_STATUSES.has(claim.status)) {
			return json({ message: `Items on ${claim.status} claims are financially finalized and cannot be changed` }, { status: 409 });
		}
		if (action === 'restore' && item.isArchived === true) {
			const [activeItems, maxClaimTotal] = await Promise.all([
				pb.collection('reimbursement_items').getFullList({
					filter: `claim = "${claim.id}"`,
					fields: 'amount,isArchived'
				}),
				getMaxClaimTotal(pb)
			]);
			const restoredTotal = activeItems
				.filter((candidate: any) => candidate.isArchived !== true)
				.reduce((sum: number, candidate: any) => sum + Number(candidate.amount || 0), 0)
				+ Number(item.amount || 0);
			if (restoredTotal > maxClaimTotal) {
				return json({ message: `Restoring this item would exceed the $${maxClaimTotal.toFixed(2)} claim limit` }, { status: 409 });
			}
		}

		const eventAt = new Date().toISOString();
		const update: Record<string, unknown> = {};
		const rollback: Record<string, unknown> = {};
		if (action === 'keep') {
			update.duplicateReviewStatus = 'keep';
			rollback.duplicateReviewStatus = item.duplicateReviewStatus ?? '';
		} else if (action === 'archive') {
			update.isArchived = true;
			update.archivedAt = eventAt;
			update.archivedBy = ctx.profile?.id ?? null;
			update.archiveReason = reason;
			update.duplicateReviewStatus = 'archived';
			rollback.isArchived = item.isArchived ?? false;
			rollback.archivedAt = item.archivedAt ?? null;
			rollback.archivedBy = item.archivedBy ?? null;
			rollback.archiveReason = item.archiveReason ?? '';
			rollback.duplicateReviewStatus = item.duplicateReviewStatus ?? '';
		} else if (action === 'restore') {
			update.isArchived = false;
			update.archivedAt = null;
			update.archivedBy = null;
			update.archiveReason = '';
			update.duplicateReviewStatus = 'pending';
			rollback.isArchived = item.isArchived ?? false;
			rollback.archivedAt = item.archivedAt ?? null;
			rollback.archivedBy = item.archivedBy ?? null;
			rollback.archiveReason = item.archiveReason ?? '';
			rollback.duplicateReviewStatus = item.duplicateReviewStatus ?? '';
		} else {
			const status = action === 'confirm_business_purpose' ? 'confirmed' : 'unconfirmed';
			update.businessPurposeStatus = status;
			update.businessPurposeConfirmedAt = status === 'confirmed' ? eventAt : null;
			update.businessPurposeConfirmedBy = status === 'confirmed' ? ctx.profile?.id ?? null : null;
			rollback.businessPurposeStatus = item.businessPurposeStatus ?? '';
			rollback.businessPurposeConfirmedAt = item.businessPurposeConfirmedAt ?? null;
			rollback.businessPurposeConfirmedBy = item.businessPurposeConfirmedBy ?? null;
		}

		const updated = await pb.collection('reimbursement_items').update(item.id, update);
		let auditRecord: any = null;
		try {
			auditRecord = await pb.collection('reimbursement_item_audit').create({
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
					bankStatement: item.bankStatement
				}
			});

			if (action === 'archive' || action === 'restore') {
				await recalculateClaimTotal(pb, claim.id);
			}
		} catch (reviewError) {
			if (auditRecord?.id) {
				await pb.collection('reimbursement_item_audit').delete(auditRecord.id).catch(() => {});
			}
			await pb.collection('reimbursement_items').update(item.id, rollback).catch(() => {});
			throw reviewError;
		}

		return json({ ok: true, item: updated });
	} catch (error: any) {
		const detail = error?.response?.message ?? error?.message ?? 'Unknown error';
		console.error('[reimb-review] action failed:', detail);
		return json({ message: `Unable to complete reimbursement review action: ${detail}` }, { status: 500 });
	}
};