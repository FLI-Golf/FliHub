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

// PATCH /api/reimbursements/:id/items/:itemId
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();
	try {
		const adminPb = await getAdminPocketBase();
		const maxClaimTotal = await getMaxClaimTotal(adminPb);

		const existingItem = await ctx.pb.collection('reimbursement_items').getOne(params.itemId, { fields: 'id,amount' });
		const nextAmount = body.amount !== undefined ? Number(body.amount) : Number(existingItem.amount || 0);

		const allItems = await ctx.pb.collection('reimbursement_items')
			.getFullList({ filter: `claim = "${params.id}"`, fields: 'id,amount' });
		const nextTotal = allItems.reduce((s, i) => {
			if (i.id === params.itemId) return s + nextAmount;
			return s + (i.amount || 0);
		}, 0);

		if (nextTotal > maxClaimTotal) {
			return json({
				message: `Claim total cannot exceed $${maxClaimTotal.toFixed(2)}`,
				maxClaimTotal,
				total: nextTotal
			}, { status: 400 });
		}

		const update: Record<string, any> = {};
		if (body.description !== undefined) update.description = body.description;
		if (body.amount      !== undefined) update.amount      = nextAmount;
		if (body.date        !== undefined) update.date        = body.date || null;
		if (body.category    !== undefined) update.category    = body.category;
		if (body.vendor      !== undefined) update.vendor      = body.vendor;
		if (body.vendorId    !== undefined) update.vendorId    = body.vendorId || null;
		if (body.receiptUrl  !== undefined) update.receiptUrl  = body.receiptUrl;
		if (body.notes       !== undefined) update.notes       = body.notes;

		const item = await ctx.pb.collection('reimbursement_items').update(params.itemId, update);

		await ctx.pb.collection('reimbursement_claims').update(params.id, { totalAmount: nextTotal });

		return json(item);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// DELETE /api/reimbursements/:id/items/:itemId
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		const claim = await ctx.pb.collection('reimbursement_claims')
			.getOne(params.id, { fields: 'id,status,department,totalAmount' });
		const item = await ctx.pb.collection('reimbursement_items')
			.getOne(params.itemId, { fields: 'id,amount' });
		const removedAmount = Number(item.amount || 0);

		await ctx.pb.collection('reimbursement_items').delete(params.itemId);

		// Recalculate claim total
		const allItems = await ctx.pb.collection('reimbursement_items')
			.getFullList({ filter: `claim = "${params.id}"`, fields: 'amount' });
		const total = allItems.reduce((s, i) => s + (i.amount || 0), 0);

		// Keep paid-claim accounting in sync when admin removes non-business items.
		if (claim.status === 'paid' && removedAmount > 0) {
			if (claim.department) {
				const dept = await ctx.pb.collection('departments')
					.getOne(claim.department, { fields: 'id,department_actual_expenses' })
					.catch(() => null);
				if (dept) {
					const current = Number(dept.department_actual_expenses || 0);
					const next = Math.max(0, current - removedAmount);
					await ctx.pb.collection('departments').update(dept.id, {
						department_actual_expenses: next
					});
				}
			}
		}

		// If this was the final line item, remove the empty claim entirely.
		if (allItems.length === 0) {
			const workOrders = await ctx.pb.collection('work_orders').getFullList({
				filter: `claimId = "${params.id}"`,
				fields: 'id'
			}).catch(() => []);

			for (const wo of workOrders) {
				await ctx.pb.collection('work_orders').delete(wo.id).catch(() => {});
			}

			await ctx.pb.collection('reimbursement_claims').delete(params.id);
			return json({ ok: true, claimDeleted: true });
		}

		await ctx.pb.collection('reimbursement_claims').update(params.id, { totalAmount: total });

		if (claim.status === 'paid') {
			const workOrders = await ctx.pb.collection('work_orders').getFullList({
				filter: `claimId = "${params.id}"`,
				fields: 'id,amount'
			}).catch(() => []);

			for (const wo of workOrders) {
				await ctx.pb.collection('work_orders').update(wo.id, {
					amount: total
				}).catch(() => {});
			}
		}

		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
