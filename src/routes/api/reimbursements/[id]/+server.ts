import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
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

		const adminPb = await getAdminPocketBase();

		// Recalculate total from items if requested
		if (body.recalcTotal) {
			const items = await adminPb.collection('reimbursement_items')
				.getFullList({ filter: `claim="${params.id}"`, fields: 'amount' });
			update.totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
		}

		const record = await adminPb.collection('reimbursement_claims').update(params.id, update);

		// When marking paid: create work order, stamp WO number everywhere, debit dept budget
		if (body.status === 'paid') {
			const woErrors: string[] = [];
			try {
				const woNumber = record.referenceNumber;

				if (!woNumber) {
					woErrors.push('referenceNumber is blank — work order not created');
				} else {
					// 1. Create work_orders record if not already there
					const existing = await adminPb.collection('work_orders')
						.getFullList({ filter: `work_order_number="${woNumber}"`, fields: 'id' })
						.catch(() => []);

					if (!existing.length) {
						const wo = await adminPb.collection('work_orders').create({
							work_order_number: woNumber,
							// relation fields
							claimId:       record.id,
							approver:      ctx.profile?.id || null,
							submittedBy:   record.claimant || null,
							// audit fields
							source:        'reimbursement',
							description:   record.title || '',
							amount:        record.totalAmount || 0,
							approvedDate:  new Date().toISOString(),
							paidDate:      body.paidDate || new Date().toISOString(),
							paymentMethod: body.paymentMethod || '',
							status:        'paid',
							notes:         `Reimbursement claim paid via ${(body.paymentMethod || 'bank_transfer').replace(/_/g, ' ')}`,
						});
						console.log(`[reimb] work order created: ${woNumber} (${wo.id})`);
					} else {
						console.log(`[reimb] work order already exists for ${woNumber}`);
					}

					// 2. Stamp WO number on the claim itself
					await adminPb.collection('reimbursement_claims').update(record.id, {
						work_order_number: woNumber
					}).catch((e: any) => woErrors.push('stamp claim: ' + e?.message));

					// 3. Stamp WO number on every line item
					const items = await adminPb.collection('reimbursement_items')
						.getFullList({ filter: `claim="${record.id}"`, fields: 'id' })
						.catch(() => []);
					for (const item of items) {
						await adminPb.collection('reimbursement_items').update(item.id, {
							work_order_number: woNumber
						}).catch(() => {});
					}
					console.log(`[reimb] stamped WO ${woNumber} on claim + ${items.length} items`);
				}

				// 4. Debit department actual spend
				const claimFull = await adminPb.collection('reimbursement_claims')
					.getOne(record.id, { fields: 'id,department,totalAmount' })
					.catch(() => null);

				if (claimFull?.department) {
					const dept = await adminPb.collection('departments')
						.getOne(claimFull.department, { fields: 'id,department_actual_expenses' })
						.catch(() => null);

					if (dept) {
						const current = dept.department_actual_expenses ?? 0;
						const claimTotal = claimFull.totalAmount ?? record.totalAmount ?? 0;
						await adminPb.collection('departments').update(dept.id, {
							department_actual_expenses: current + claimTotal
						});
						console.log(`[reimb] dept ${dept.id} actuals +${claimTotal} → ${current + claimTotal}`);
					}
				}

			} catch (e: any) {
				const msg = e?.response?.message ?? e?.message ?? 'Unknown error';
				console.error('[reimb] paid workflow failed:', msg, e?.response?.data ?? '');
				woErrors.push(msg);
			}

			// Surface WO errors in the response so the UI can warn the user
			if (woErrors.length) {
				return json({ ...record, _woWarnings: woErrors });
			}
		}

		return json(record);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// DELETE /api/reimbursements/:id — only allowed on draft claims
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	try {
		const adminPb = await getAdminPocketBase();
		const claim = await adminPb.collection('reimbursement_claims').getOne(params.id, { fields: 'id,status' });
		if (claim.status !== 'draft') {
			return json({ message: 'Only draft claims can be deleted' }, { status: 400 });
		}
		await adminPb.collection('reimbursement_claims').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
