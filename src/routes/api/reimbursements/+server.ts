import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { requiresBusinessPurposeReview, toDateOnly } from '$lib/domain/reimbursements/integrity';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import type { RequestHandler } from './$types';

// Generate next WO-NNN reference number
async function nextWorkOrderNumber(pb: any): Promise<string> {
	const existing = await pb.collection('reimbursement_claims')
		.getFullList({ fields: 'referenceNumber', sort: '-created' })
		.catch(() => []);

	let max = 0;
	for (const r of existing) {
		const match = (r.referenceNumber ?? '').match(/^WO-(\d+)$/);
		if (match) {
			const n = parseInt(match[1], 10);
			if (n > max) max = n;
		}
	}
	return `WO-${String(max + 1).padStart(3, '0')}`;
}

async function getMaxClaimTotal(pb: any): Promise<number> {
	const setting = await pb.collection('settings')
		.getFirstListItem(`key = "${REIMBURSEMENT_MAX_TOTAL_SETTING_KEY}"`, { fields: 'value' })
		.catch(() => null);
	const parsed = Number(setting?.value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;
}

// POST /api/reimbursements — create a new claim (always starts as draft)
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.title?.trim()) return json({ message: 'Title is required' }, { status: 400 });

	try {
		const adminPb = await getAdminPocketBase();
		const isAdministrator = ctx.role === 'admin' || ctx.role === 'leader';
		const claimantId = isAdministrator && body.claimant ? body.claimant : ctx.profile?.id;
		if (!claimantId) return json({ message: 'A valid user profile is required' }, { status: 403 });
		const maxClaimTotal = await getMaxClaimTotal(adminPb);
		const workOrder = await nextWorkOrderNumber(adminPb);
		const items = body.items ?? [];
		const total = (items as any[]).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
		const invalidDate = (items as any[]).find((item: any) => item.date && !toDateOnly(item.date));
		if (invalidDate) return json({ message: 'Transaction dates must use YYYY-MM-DD' }, { status: 400 });

		if (total > maxClaimTotal) {
			return json({
				message: `Claim total cannot exceed $${maxClaimTotal.toFixed(2)}`,
				maxClaimTotal,
				total
			}, { status: 400 });
		}

		// Always link new claims to the Tax-Exempt Reimbursements department
		let reimbDeptId: string | null = body.department ?? null;
		if (!reimbDeptId) {
			const dept = await adminPb.collection('departments')
				.getFirstListItem(`name="Tax-Exempt Reimbursements"`, { fields: 'id' })
				.catch(() => null);
			reimbDeptId = dept?.id ?? null;
		}

		const claim = await adminPb.collection('reimbursement_claims').create({
			title:           body.title.trim(),
			claimant:        claimantId,
			status:          'draft',
			notes:           body.notes?.trim() || '',
			referenceNumber: workOrder,
			department:      reimbDeptId,
		});

		// Create any initial items passed along with the claim
		for (const item of items) {
			if (!item.description?.trim() || !item.amount) continue;
			const businessPurposeStatus = requiresBusinessPurposeReview({
				vendor: item.vendor,
				description: item.description
			}) ? 'unconfirmed' : 'not_required';
			await adminPb.collection('reimbursement_items').create({
				claim:       claim.id,
				description: item.description.trim(),
				amount:      Number(item.amount),
				date:        toDateOnly(item.date),
				category:    item.category    || 'other',
				vendor:      item.vendor?.trim()     || '',
				vendorId:    item.vendorId            || null,
				receiptUrl:  item.receiptUrl?.trim() || '',
				notes:       item.notes?.trim()      || '',
				businessPurposeStatus,
				isArchived: false
			});
		}

		// Recalculate total
		if (items.length) {
			await adminPb.collection('reimbursement_claims').update(claim.id, { totalAmount: total });
		}

		return json(claim, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
