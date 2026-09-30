import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { normalizeBulkItemIds } from '$lib/server/reimbursements/review';
import type { RequestHandler } from './$types';

const MAX_BULK_ITEMS = 200;

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin' && ctx.role !== 'leader') {
		return json({ message: 'Administrator access is required' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const itemIds = normalizeBulkItemIds(body.itemIds);
	if (!itemIds.length) return json({ message: 'Select at least one line item' }, { status: 400 });
	if (itemIds.length > MAX_BULK_ITEMS) {
		return json({ message: `Select at most ${MAX_BULK_ITEMS} line items per bulk delete` }, { status: 400 });
	}

	try {
		const pb = await getAdminPocketBase();
		const affectedClaims = new Set<string>();
		let deleted = 0;

		for (const itemId of itemIds) {
			const item = await pb.collection('reimbursement_items').getOne(itemId).catch(() => null);
			if (!item) {
				return json({ message: `Line item ${itemId} was not found` }, { status: 404 });
			}

			const claim = await pb.collection('reimbursement_claims').getOne(item.claim, {
				fields: 'id,claimant,status,totalAmount,department'
			}).catch(() => null);
			if (!claim) {
				return json({ message: `Claim for line item ${itemId} was not found` }, { status: 404 });
			}

			const removedAmount = Number(item.amount || 0);
			await pb.collection('reimbursement_items').delete(itemId);
			deleted += 1;
			affectedClaims.add(claim.id);

			const allItems = await pb.collection('reimbursement_items').getFullList({
				filter: `claim = "${claim.id}"`,
				fields: 'id,amount'
			}).catch(() => []);
			const total = allItems.reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0);

			if (claim.status === 'paid' && removedAmount > 0 && claim.department) {
				const dept = await pb.collection('departments')
					.getOne(claim.department, { fields: 'id,department_actual_expenses' })
					.catch(() => null);
				if (dept) {
					const current = Number(dept.department_actual_expenses || 0);
					const next = Math.max(0, current - removedAmount);
					await pb.collection('departments').update(dept.id, {
						department_actual_expenses: next
					}).catch(() => {});
				}
			}

			if (allItems.length === 0) {
				const workOrders = await pb.collection('work_orders').getFullList({
					filter: `claimId = "${claim.id}"`,
					fields: 'id'
				}).catch(() => []);
				for (const workOrder of workOrders) {
					await pb.collection('work_orders').delete(workOrder.id).catch(() => {});
				}
				await pb.collection('reimbursement_claims').delete(claim.id).catch(() => {});
				continue;
			}

			await pb.collection('reimbursement_claims').update(claim.id, { totalAmount: total }).catch(() => {});

			if (claim.status === 'paid') {
				const workOrders = await pb.collection('work_orders').getFullList({
					filter: `claimId = "${claim.id}"`,
					fields: 'id,amount'
				}).catch(() => []);
				for (const workOrder of workOrders) {
					await pb.collection('work_orders').update(workOrder.id, {
						amount: total
					}).catch(() => {});
				}
			}
		}

		return json({ ok: true, deleted, claimsUpdated: affectedClaims.size });
	} catch (error: any) {
		const detail = error?.response?.message ?? error?.message ?? 'Unknown error';
		console.error('[reimb-bulk-delete] action failed:', detail);
		return json({ message: `Unable to delete selected line items: ${detail}` }, { status: 500 });
	}
};
