import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

/**
 * POST /api/events/[id]/payments/[paymentId]/approve
 * Approve a payment that is in 'approval_required' status.
 * Transitions it to 'approved' so it can be marked as paid.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const guard = await requireAdminApi(locals);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const approvedBy = (locals as any)?.pb?.authStore?.model?.email ?? 'admin';

		const payment = await pb.collection('event_payments').getOne(params.paymentId);
		if (payment.event !== params.id) {
			return json({ message: 'Payment does not belong to this event' }, { status: 400 });
		}

		if (payment.status === 'approved') {
			return json({ message: 'Payment already approved' }, { status: 409 });
		}

		if (payment.status === 'paid') {
			return json({ message: 'Payment already paid' }, { status: 409 });
		}

		if (payment.status === 'cancelled') {
			return json({ message: 'Cannot approve cancelled payment' }, { status: 409 });
		}

		if (payment.status !== 'approval_required') {
			return json({
				message: `Payment has status '${payment.status}', expected 'approval_required' for approval`
			}, { status: 409 });
		}

		const updated = await pb.collection('event_payments').update(params.paymentId, {
			status: 'approved',
			approvedAt: new Date().toISOString().split('T')[0],
			approvedBy
		});

		const linkedExpense = await pb.collection('expenses').getFirstListItem(
			`notes ~ "[EP:${params.paymentId}]"`
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
					comments: '<p>Approved from event payments panel.</p>'
				}).catch(() => null)
			).catch(() => null);
		}

		return json(updated);
	} catch (err: any) {
		console.error('[event payments approve]', err?.message ?? err);
		return json(
			{ message: err?.message ?? 'Failed to approve payment' },
			{ status: 500 }
		);
	}
};
