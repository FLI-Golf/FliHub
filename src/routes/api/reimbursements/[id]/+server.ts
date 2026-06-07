import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

async function getNextReimbursementWorkOrderNumber(adminPb: any): Promise<string> {
	const workOrders = await adminPb.collection('work_orders')
		.getFullList({ fields: 'work_order_number', sort: '-created' })
		.catch(() => []) as any[];

	let max = 0;
	for (const workOrder of workOrders) {
		const match = String(workOrder.work_order_number ?? '').match(/^WO-(\d+)$/);
		if (match) {
			max = Math.max(max, Number(match[1]));
		}
	}

	return `WO-${String(max + 1).padStart(3, '0')}`;
}

// PATCH /api/reimbursements/:id — update status, reference number, review notes, payment info
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
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

		if (body.status === 'paid') {
			return json({ message: 'Reimbursement claims must be approved and handed off to QuickBooks through a work order before payment.' }, { status: 400 });
		}

		const requestedStatus = body.status === 'approval_submittedto' ? 'approved' : body.status;
		const shouldCreateApproval = requestedStatus === 'under_review';
		const isApprovalHandoff = requestedStatus === 'approved';
		if (isApprovalHandoff) {
			update.status = 'approved';
		}

		const adminPb = await getAdminPocketBase();

		// Recalculate total from items if requested
		if (body.recalcTotal) {
			const items = await adminPb.collection('reimbursement_items')
				.getFullList({ filter: `claim="${params.id}"`, fields: 'amount' });
			update.totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
		}

		const record = await adminPb.collection('reimbursement_claims').update(params.id, update);

		if (shouldCreateApproval) {
			console.log(`[reimb] creating approval for claim ${record.id}`);
			const existingPending = await adminPb.collection('approvals').getFullList({
				filter: `entityType='expense' && entityId='${record.id}' && status='pending'`,
				fields: 'id'
			}).catch(() => []);

			if (!existingPending.length) {
				const approvalData = {
					entityType: 'expense',
					entityId: record.id,
					status: 'pending',
					requestedBy: ctx.profile?.id ?? record.claimant ?? null,
					requestedDate: new Date().toISOString(),
					amount: record.totalAmount || 0,
					comments: '<p>Reimbursement claim submitted for approval.</p>'
				};
				const approval = await adminPb.collection('approvals').create(approvalData);
				console.log(`[reimb] approval created: ${approval.id} for claim ${record.id}`);
			} else {
				console.log(`[reimb] pending approval already exists for claim ${record.id}`);
			}
		}

		// When a claim is approved, create the reimbursement work order and
		// hand it off to QuickBooks instead of paying it directly from the claim.
		if (isApprovalHandoff) {
			const woErrors: string[] = [];
			try {
				const woNumber = record.work_order_number || record.referenceNumber || await getNextReimbursementWorkOrderNumber(adminPb);

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
							paidDate:      null,
							paymentMethod: '',
							status:        'open',
							notes:         'Reimbursement claim approved and submitted to QuickBooks for payment processing.',
						});
						console.log(`[reimb] work order created: ${woNumber} (${wo.id})`);
					} else {
						console.log(`[reimb] work order already exists for ${woNumber}`);
					}

					// 2. Stamp WO number on the claim itself
					await adminPb.collection('reimbursement_claims').update(record.id, {
						work_order_number: woNumber,
						referenceNumber: record.referenceNumber || woNumber,
						status: 'approved',
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
		const status = err?.status ?? err?.response?.status ?? 500;
		const message = err?.response?.message ?? err?.message ?? 'Failed';
		console.error('[reimb] PATCH failed', {
			claimId: params.id,
			requestedStatus: body?.status,
			message,
			data: err?.response?.data ?? null,
			status
		});
		return json({ message }, { status });
	}
};

// DELETE /api/reimbursements/:id — only allowed on draft claims
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
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
