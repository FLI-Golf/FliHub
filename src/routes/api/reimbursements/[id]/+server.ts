import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// PATCH /api/reimbursements/:id — update status, reference number, review notes, payment info
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	try {
		const update: Record<string, any> = {};
		if (body.title           !== undefined) update.title           = body.title;
		if (body.status          !== undefined) update.status          = body.status;
		if (body.referenceNumber !== undefined) update.referenceNumber = body.referenceNumber;
		if (body.notes           !== undefined) update.notes           = body.notes;
		if (body.reviewNotes     !== undefined) update.reviewNotes     = body.reviewNotes;
		if (body.paymentMethod   !== undefined) update.paymentMethod   = body.paymentMethod;
		if (body.paidDate        !== undefined) update.paidDate        = body.paidDate || null;
		if (body.paidBy          !== undefined) update.paidBy          = body.paidBy  || null;

		// Recalculate total from items if requested
		if (body.recalcTotal) {
			const items = await ctx.pb.collection('reimbursement_items')
				.getFullList({ filter: `claim = "${params.id}"`, fields: 'amount' });
			update.totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
		}

		const record = await ctx.pb.collection('reimbursement_claims').update(params.id, update);
		return json(record);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// DELETE /api/reimbursements/:id — only allowed on draft claims
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		const claim = await ctx.pb.collection('reimbursement_claims').getOne(params.id, { fields: 'id,status' });
		if (claim.status !== 'draft') {
			return json({ message: 'Only draft claims can be deleted' }, { status: 400 });
		}
		await ctx.pb.collection('reimbursement_claims').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
