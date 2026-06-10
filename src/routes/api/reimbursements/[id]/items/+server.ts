import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
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
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.description?.trim()) return json({ message: 'Description is required' }, { status: 400 });
	if (!body.amount || Number(body.amount) <= 0) return json({ message: 'Amount must be > 0' }, { status: 400 });

	try {
		const adminPb = await getAdminPocketBase();
		const maxClaimTotal = await getMaxClaimTotal(adminPb);
		const amount = Number(body.amount);

		const allItems = await adminPb.collection('reimbursement_items')
			.getFullList({ filter: `claim="${params.id}"`, fields: 'amount' });
		const currentTotal = allItems.reduce((s, i) => s + (i.amount || 0), 0);
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
			date:        body.date        || null,
			category:    body.category    || 'other',
			vendor:      body.vendor?.trim()     || '',
			vendorId:    body.vendorId            || null,
			receiptUrl:  body.receiptUrl?.trim() || '',
			notes:       body.notes?.trim()      || ''
		});

		await adminPb.collection('reimbursement_claims').update(params.id, { totalAmount: nextTotal });

		return json(item, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
