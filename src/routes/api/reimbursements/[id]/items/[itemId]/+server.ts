import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// PATCH /api/reimbursements/:id/items/:itemId
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();
	try {
		const update: Record<string, any> = {};
		if (body.description !== undefined) update.description = body.description;
		if (body.amount      !== undefined) update.amount      = Number(body.amount);
		if (body.date        !== undefined) update.date        = body.date || null;
		if (body.category    !== undefined) update.category    = body.category;
		if (body.vendor      !== undefined) update.vendor      = body.vendor;
		if (body.vendorId    !== undefined) update.vendorId    = body.vendorId || null;
		if (body.receiptUrl  !== undefined) update.receiptUrl  = body.receiptUrl;
		if (body.notes       !== undefined) update.notes       = body.notes;

		const item = await ctx.pb.collection('reimbursement_items').update(params.itemId, update);

		// Recalculate claim total
		const allItems = await ctx.pb.collection('reimbursement_items')
			.getFullList({ filter: `claim = "${params.id}"`, fields: 'amount' });
		const total = allItems.reduce((s, i) => s + (i.amount || 0), 0);
		await ctx.pb.collection('reimbursement_claims').update(params.id, { totalAmount: total });

		return json(item);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// DELETE /api/reimbursements/:id/items/:itemId
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		await ctx.pb.collection('reimbursement_items').delete(params.itemId);

		// Recalculate claim total
		const allItems = await ctx.pb.collection('reimbursement_items')
			.getFullList({ filter: `claim = "${params.id}"`, fields: 'amount' });
		const total = allItems.reduce((s, i) => s + (i.amount || 0), 0);
		await ctx.pb.collection('reimbursement_claims').update(params.id, { totalAmount: total });

		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
