import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { requiresBusinessPurposeReview, toDateOnly } from '$lib/domain/reimbursements/integrity';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import type { RequestHandler } from './$types';

async function getMaxClaimTotal(pb: any): Promise<number> {
	const setting = await pb.collection('settings')
		.getFirstListItem(`key = "${REIMBURSEMENT_MAX_TOTAL_SETTING_KEY}"`, { fields: 'value' })
		.catch(() => null);
	const parsed = Number(setting?.value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;
}

// POST /api/reimbursements/:id/items — add a line item to a claim
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	if (!body.description?.trim()) return json({ message: 'Description is required' }, { status: 400 });
	if (!body.amount || Number(body.amount) <= 0) return json({ message: 'Amount must be > 0' }, { status: 400 });

	try {
		const adminPb = await getAdminPocketBase();
		const claim = await adminPb.collection('reimbursement_claims').getOne(params.id, { fields: 'id,claimant,status' });
		const isAdministrator = ctx.role === 'admin' || ctx.role === 'leader';
		if (!isAdministrator && claim.claimant !== ctx.profile?.id) return json({ message: 'Forbidden' }, { status: 403 });
		if (claim.status !== 'draft') return json({ message: 'Line items can only be added to draft claims' }, { status: 409 });
		const date = body.date ? toDateOnly(body.date) : null;
		if (body.date && !date) return json({ message: 'Transaction date must use YYYY-MM-DD' }, { status: 400 });
		const maxClaimTotal = await getMaxClaimTotal(adminPb);
		const amount = Number(body.amount);

		const allItems = await adminPb.collection('reimbursement_items')
			.getFullList({ filter: `claim="${params.id}"`, fields: 'amount,isArchived' });
		const currentTotal = allItems.filter((item: any) => item.isArchived !== true).reduce((s, i) => s + (i.amount || 0), 0);
		const nextTotal = currentTotal + amount;

		if (nextTotal > maxClaimTotal) {
			return json({
				message: `Claim total cannot exceed $${maxClaimTotal.toFixed(2)}`,
				maxClaimTotal,
				total: nextTotal
			}, { status: 400 });
		}

		const item = await adminPb.collection('reimbursement_items').create({
			claim:       params.id,
			description: body.description.trim(),
			amount,
			date,
			category:    body.category    || 'other',
			vendor:      body.vendor?.trim()     || '',
			vendorId:    body.vendorId            || null,
			receiptUrl:  body.receiptUrl?.trim() || '',
			notes:       body.notes?.trim()      || '',
			businessPurposeStatus: requiresBusinessPurposeReview({
				vendor: body.vendor,
				description: body.description
			}) ? 'unconfirmed' : 'not_required',
			isArchived: false
		});

		await adminPb.collection('reimbursement_claims').update(params.id, { totalAmount: nextTotal });

		return json(item, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
