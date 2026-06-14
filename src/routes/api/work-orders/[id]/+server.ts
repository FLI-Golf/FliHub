import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { writeAuditLogBatch } from '$lib/domain/services/PaymentWorkOrderService';
import type { RequestHandler } from './$types';

const toPaymentStatus = (workOrderStatus: unknown): string => {
	const s = String(workOrderStatus ?? '').toLowerCase();
	if (s === 'paid') return 'paid';
	if (s === 'cancelled') return 'cancelled';
	return 'pending';
};

const accountOptionLabel = (account: any): string => {
	const code = String(account?.code ?? '').trim();
	const name = String(account?.name ?? '').trim();
	return code && name ? `${code} - ${name}` : name || code || '';
};

const resolveBankAccount = async (adminPb: any, rawAccountId: unknown, rawAccountLabel: unknown) => {
	const accountId = String(rawAccountId ?? '').trim();
	if (accountId) {
		const byId = await adminPb.collection('bank_accounts').getOne(accountId, {
			fields: 'id,code,name,allocation,notes,status'
		}).catch(() => null);
		if (byId) return byId;
	}

	const accountLabel = String(rawAccountLabel ?? '').trim();
	if (!accountLabel) return null;

	const accounts = await adminPb.collection('bank_accounts').getFullList({
		filter: 'status = "active" || status = ""',
		sort: 'sortOrder,code',
		fields: 'id,code,name,allocation,notes,status'
	}).catch(() => []);

	const normalizedLabel = accountLabel.toLowerCase();
	const parsedCode = accountLabel.match(/^([0-9]+)\s*-/)?.[1] ?? '';

	return (accounts as any[]).find((account: any) => {
		const code = String(account?.code ?? '').trim();
		const name = String(account?.name ?? '').trim();
		return code === accountLabel
			|| name.toLowerCase() === normalizedLabel
			|| accountOptionLabel(account).toLowerCase() === normalizedLabel
			|| (parsedCode !== '' && code === parsedCode);
	}) ?? null;
};

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
		const before  = await adminPb.collection('work_orders').getOne(params.id).catch(() => null);
		const wasPaid = toPaymentStatus(before?.status) === 'paid';

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
		const isNowPaid = toPaymentStatus(record.status) === 'paid';
		const shouldDeductBankAccount = !wasPaid && isNowPaid;
		let bankAccountDeducted: { id: string; label: string; amount: number; newAllocation: number } | null = null;
		let bankAccountWarning: string | null = null;

		if (shouldDeductBankAccount) {
			const paymentAmount = typeof record.amount === 'number' ? record.amount : Number(record.amount || 0);
			const account = await resolveBankAccount(adminPb, body.qb_account_id, body.qb_account ?? record.qb_account);

			if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
				bankAccountWarning = 'Paid work order has no valid amount, so no bank account deduction was recorded.';
			} else if (!account) {
				bankAccountWarning = 'Unable to resolve the selected bank account, so no bank account deduction was recorded.';
			} else {
				const currentAllocation = typeof account.allocation === 'number'
					? account.allocation
					: Number(account.allocation || 0);

				if (!Number.isFinite(currentAllocation)) {
					bankAccountWarning = `Bank account ${accountOptionLabel(account)} has an invalid allocation value.`;
				} else if (currentAllocation < paymentAmount) {
					bankAccountWarning = `Bank account ${accountOptionLabel(account)} has insufficient allocation for a ${paymentAmount.toLocaleString('en-US')} deduction.`;
				} else {
					const nextAllocation = currentAllocation - paymentAmount;
					const actor = profile?.id ?? 'system';
					const stamp = [
						`[WORK_ORDER_PAYMENT ${new Date().toISOString()}]`,
						`wo=${record.work_order_number || record.id}`,
						`amount=${paymentAmount}`,
						record.qb_transaction_id ? `txn=${record.qb_transaction_id}` : '',
						`old=${currentAllocation}`,
						`new=${nextAllocation}`,
						`by=${actor}`,
					].filter(Boolean).join(' ');
					const existingNotes = String(account.notes ?? '').trim();

					await adminPb.collection('bank_accounts').update(account.id, {
						allocation: nextAllocation,
						notes: existingNotes ? `${existingNotes}\n${stamp}` : stamp,
					});

					bankAccountDeducted = {
						id: account.id,
						label: accountOptionLabel(account),
						amount: paymentAmount,
						newAllocation: nextAllocation,
					};
				}
			}
		}

		const qbTouched = (
			body.qb_transaction_id !== undefined ||
			body.qb_entered_date !== undefined ||
			body.qb_account !== undefined ||
			body.qb_notes !== undefined ||
			body.status === 'paid'
		);

		if (qbTouched) {
			const action = body.status === 'paid' ? 'marked_paid' : 'qb_entry_saved';
			const actor = profile?.id ?? 'system';
			const stampParts = [
				`action=${action}`,
				record.work_order_number ? `wo=${record.work_order_number}` : '',
				record.qb_transaction_id ? `txn=${record.qb_transaction_id}` : '',
				record.qb_account ? `account=${record.qb_account}` : '',
				record.qb_entered_date ? `date=${record.qb_entered_date}` : '',
				`by=${actor}`,
			].filter(Boolean);
			const auditStamp = `[AUDIT ${new Date().toISOString()}] ${stampParts.join('; ')}`;

			// Keep a durable, append-only event trail directly on the work order.
			const existingNotes = String(record.notes ?? '').trim();
			const nextNotes = existingNotes ? `${existingNotes}\n${auditStamp}` : auditStamp;
			await adminPb.collection('work_orders').update(params.id, { notes: nextNotes }).catch((e: any) => {
				console.warn('[wo] audit note append failed:', e?.message);
			});
			record.notes = nextNotes;

			// For pro payout work orders, also append to the canonical payment_audit_log table.
			const paymentIds = Array.isArray(record.proPayment)
				? record.proPayment.filter((id: any) => typeof id === 'string' && id.length > 0)
				: [];

			if (paymentIds.length > 0) {
				await writeAuditLogBatch(adminPb, paymentIds.map((paymentId: string) => ({
					paymentId,
					workOrderId: record.id,
					fromStatus: toPaymentStatus(before?.status),
					toStatus: toPaymentStatus(record.status),
					changedBy: actor,
					amount: typeof record.amount === 'number' ? record.amount : Number(record.amount || 0),
					paymentMethod: 'quickbooks',
					notes: auditStamp,
				}))).catch((e: any) => {
					console.warn('[wo] payment_audit_log write failed:', e?.message);
				});
			}
		}

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

		// When QB transaction ID is saved on a reimbursement-sourced WO, create a linked
		// expense record for reporting, but do not create another approval record.
		// The reimbursement claim itself already went through approvals.
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

						// Create the expense as paid because QB entry indicates payment is complete.
						const expense = await adminPb.collection('expenses').create({
							description,
							amount:          claim.totalAmount ?? record.amount ?? 0,
							category:        'Reimbursement',
							status:          'paid',
							date:            body.qb_entered_date || new Date().toISOString().slice(0, 10),
							paidDate:        body.qb_entered_date || new Date().toISOString().slice(0, 10),
							notes:           `QB Transaction: ${body.qb_transaction_id}${body.qb_account ? ` · Account: ${body.qb_account}` : ''}${body.qb_notes ? ` · ${body.qb_notes}` : ''}`,
							submittedBy:     profile?.id || null,
							work_order_number: record.work_order_number || '',
							invoiceNumber:   record.work_order_number || '',
						});

						// Stamp the expense ID back onto the work order so we don't create duplicates
						await adminPb.collection('work_orders').update(params.id, {
							expense: expense.id,
						}).catch(() => {});

						console.log(`[wo] QB entry on ${record.work_order_number} → expense ${expense.id} recorded as paid`);

						return json({ ...record, _expenseCreated: true, _expenseId: expense.id });
					}
				} catch (e: any) {
					// Non-fatal — QB fields were saved, expense creation failed
					console.error('[wo] expense create failed:', e?.response?.data ?? e?.message);
					return json({ ...record, _expenseWarning: e?.message ?? 'Expense creation failed' });
				}
			}
		}

		return json({
			...record,
			_bankAccountDeducted: bankAccountDeducted,
			_bankAccountWarning: bankAccountWarning,
		});
	} catch (e: any) {
		const status = e?.status === 404 ? 404 : 500;
		return json({ message: e?.response?.message ?? e?.message ?? 'Failed' }, { status });
	}
};
