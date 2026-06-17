import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

/**
 * POST /api/events/[id]/payments/approve-all
 * Bulk approve all payments with status 'approval_required' for this event.
 * Used during seeding to move payments through the approval pipeline.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const guard = await requireAdminApi(locals);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const approvedBy = (locals as any)?.pb?.authStore?.model?.email ?? 'admin';

		const payments = await pb.collection('event_payments').getFullList({
			filter: `event = "${params.id}" && status = "approval_required"`
		});

		if (payments.length === 0) {
			return json({
				message: 'No payments to approve',
				approvedCount: 0
			});
		}

		const now = new Date().toISOString().split('T')[0];
		const approved = [];

		for (const payment of payments) {
			try {
				const updated = await pb.collection('event_payments').update(payment.id, {
					status: 'approved',
					approvedAt: now,
					approvedBy
				});

				const linkedExpense = await pb.collection('expenses').getFirstListItem(
					`notes ~ "[EP:${payment.id}]"`
				).catch(() => null as any);

				if (linkedExpense) {
					await pb.collection('expenses').update(linkedExpense.id, {
						status: 'approved',
						approvedDate: new Date().toISOString(),
						approvedBy
					}).catch(() => null);

					await pb.collection('approvals').getFirstListItem(
						`entityType = "expense" && entityId = "${linkedExpense.id}" && status = "pending"`
					).then((approval: any) =>
						pb.collection('approvals').update(approval.id, {
							status: 'approved',
							reviewedDate: new Date().toISOString(),
							comments: '<p>Bulk-approved from event payments panel.</p>'
						}).catch(() => null)
					).catch(() => null);
				}

				approved.push(updated);
			} catch (err: any) {
				console.warn(`Failed to approve payment ${payment.id}:`, err?.message);
			}
		}

		return json({
			message: `${approved.length} of ${payments.length} payments approved`,
			approvedCount: approved.length,
			totalCount: payments.length,
			payments: approved
		});
	} catch (err: any) {
		console.error('[event payments approve-all]', err?.message ?? err);
		return json(
			{ message: err?.message ?? 'Failed to bulk approve payments' },
			{ status: 500 }
		);
	}
};
