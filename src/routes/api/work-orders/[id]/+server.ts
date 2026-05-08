import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	if (profile?.role !== 'admin' && profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	try {
		const body    = await request.json();
		const adminPb = await getAdminPocketBase();

		const update: Record<string, any> = {};

		// QB transaction fields
		if (body.qb_transaction_id !== undefined) update.qb_transaction_id = body.qb_transaction_id;
		if (body.qb_entered_by     !== undefined) update.qb_entered_by     = body.qb_entered_by;
		if (body.qb_entered_date   !== undefined) update.qb_entered_date   = body.qb_entered_date;
		if (body.qb_account        !== undefined) update.qb_account        = body.qb_account;
		if (body.qb_notes          !== undefined) update.qb_notes          = body.qb_notes;

		// Status update
		if (body.status   !== undefined) update.status   = body.status;
		if (body.paidDate !== undefined) update.paidDate = body.paidDate;

		const record = await adminPb.collection('work_orders').update(params.id, update);

		// When QB transaction ID is saved on a reimbursement-sourced WO, create an expense
		// record in 'submitted' status so it enters the normal approval pipeline.
		// This gives Ina a formal approval step before the payment is fully settled.
		const isQBEntry     = !!body.qb_transaction_id;
		const alreadyHadQB  = !!(await adminPb.collection('work_orders')
			.getOne(params.id, { fields: 'qb_transaction_id,source,claimId,linked_expense_id' })
			.catch(() => null));

		if (isQBEntry && record.source === 'reimbursement' && record.claimId) {
			// Only create once — skip if a linked expense already exists
			const existingExpenseId = record.linked_expense_id as string | undefined;
			if (!existingExpenseId) {
				try {
					// Load the claim and its items for the expense description
					const claim = await adminPb.collection('reimbursement_claims')
						.getOne(record.claimId, { fields: 'id,title,totalAmount,claimant,department,referenceNumber' })
						.catch(() => null);

					if (claim) {
						// Build a description from the claim title + WO number
						const description = `Reimbursement — ${claim.title} (${record.work_order_number})`;

						// Create the expense in submitted status — this auto-triggers an approval
						const expense = await adminPb.collection('expenses').create({
							description,
							amount:          claim.totalAmount ?? record.amount ?? 0,
							category:        'Reimbursement',
							status:          'submitted',
							date:            body.qb_entered_date || new Date().toISOString().slice(0, 10),
							notes:           `QB Transaction: ${body.qb_transaction_id}${body.qb_account ? ` · Account: ${body.qb_account}` : ''}${body.qb_notes ? ` · ${body.qb_notes}` : ''}`,
							submittedBy:     profile?.id || null,
							work_order_number: record.work_order_number || '',
							invoiceNumber:   record.work_order_number || '',
						});

						// Create the approval record manually (adminPb bypasses the auto-create
						// in the expenses PATCH endpoint, so we do it explicitly here)
						await adminPb.collection('approvals').create({
							entityType:    'expense',
							entityId:      expense.id,
							status:        'pending',
							requestedBy:   profile?.id || null,
							requestedDate: new Date().toISOString(),
							amount:        expense.amount,
							comments:      `<p>Reimbursement expense created from QB entry on ${record.work_order_number}. Claim: ${claim.title}. QB Txn: ${body.qb_transaction_id}.</p>`,
						});

						// Stamp the expense ID back onto the work order so we don't create duplicates
						await adminPb.collection('work_orders').update(params.id, {
							expense: expense.id,
						}).catch(() => {});

						console.log(`[wo] QB entry on ${record.work_order_number} → expense ${expense.id} submitted for approval`);

						return json({ ...record, _expenseCreated: true, _expenseId: expense.id });
					}
				} catch (e: any) {
					// Non-fatal — QB fields were saved, expense creation failed
					console.error('[wo] expense create failed:', e?.response?.data ?? e?.message);
					return json({ ...record, _expenseWarning: e?.message ?? 'Expense creation failed' });
				}
			}
		}

		return json(record);
	} catch (e: any) {
		return json({ message: e?.message ?? 'Failed' }, { status: 500 });
	}
};
