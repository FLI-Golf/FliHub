import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
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
		// qb_entered_by is a relation to user_profiles — always use the authenticated user's profile ID,
		// never trust the free-text value from the form body.
		if (body.qb_transaction_id !== undefined) update.qb_entered_by = profile?.id ?? null;
		if (body.qb_entered_date !== undefined) {
			// Normalise date: accept ISO (YYYY-MM-DD) or US format (MM/DD/YYYY)
			const raw = (body.qb_entered_date as string) ?? '';
			let iso = raw;
			const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
			if (usMatch) iso = `${usMatch[3]}-${usMatch[1].padStart(2,'0')}-${usMatch[2].padStart(2,'0')}`;
			update.qb_entered_date = iso || null;
		}
		if (body.qb_account !== undefined) update.qb_account = body.qb_account;
		if (body.qb_notes   !== undefined) update.qb_notes   = body.qb_notes;

		// Status update
		if (body.status   !== undefined) update.status   = body.status;
		if (body.paidDate !== undefined) update.paidDate = body.paidDate;

		const record = await adminPb.collection('work_orders').update(params.id, update);

		// Keep reimbursement claim lifecycle in sync with work order payment status.
		if (record.source === 'reimbursement' && record.claimId && body.status === 'paid') {
			const paidDate = body.paidDate || new Date().toISOString().slice(0, 10);
			await adminPb.collection('reimbursement_claims').update(record.claimId, {
				status: 'paid',
				paidDate,
				paidBy: profile?.id ?? null,
				reviewNotes: body.qb_transaction_id
					? `Paid in QuickBooks (Txn ${body.qb_transaction_id}).`
					: 'Paid in QuickBooks.'
			}).catch((e: any) => {
				console.warn('[wo] reimbursement claim paid sync failed:', e?.message);
			});
		}

		// When QB transaction ID is saved on a reimbursement-sourced WO, create an expense
		// record in 'submitted' status so it enters the normal approval pipeline.
		const isQBEntry = !!body.qb_transaction_id;

		if (isQBEntry && record.source === 'reimbursement' && record.claimId) {
			// Only create once — skip if a linked expense already exists
			const existingExpenseId = (record.expense || record.expenseId) as string | undefined;
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
		const status = e?.status === 404 ? 404 : 500;
		return json({ message: e?.response?.message ?? e?.message ?? 'Failed' }, { status });
	}
};
