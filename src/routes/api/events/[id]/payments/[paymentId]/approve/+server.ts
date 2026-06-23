import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

function deriveCode(name: string): string {
	return String(name || 'EVENT')
		.replace(/[^a-zA-Z\s]/g, '')
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join('')
		.slice(0, 6) || 'EVENT';
}

function formatPaymentTypeLabel(paymentType: string | undefined | null): string {
	switch (paymentType) {
		case 'broadcast_fee': return 'Broadcast fee';
		case 'appearance_fee': return 'Appearance fee';
		case 'bonus': return 'Attendance bonus';
		default: return paymentType ? paymentType.replace(/_/g, ' ') : 'Event payment';
	}
}

/**
 * POST /api/events/[id]/payments/[paymentId]/approve
 * Approve a payment that is in 'approval_required' status.
 * Transitions it to 'approved' so it can be marked as paid.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const guard = await requireAdminApi(locals);
		if (guard.error) return guard.error;
		const pb = await getAdminPocketBase();
		const approvedBy = (locals as any)?.pb?.authStore?.model?.email ?? 'admin';
		const approverId = guard.ctx.profile?.id ?? null;
		const fallbackRequesterId = approverId
			?? await pb.collection('user_profiles').getFirstListItem('id != ""', { fields: 'id' })
				.then((p: any) => p.id)
				.catch(() => null);

		const payment = await pb.collection('event_payments').getOne(params.paymentId);
		if (payment.event !== params.id) {
			return json({ message: 'Payment does not belong to this event' }, { status: 400 });
		}
		const event = payment.event
			? await pb.collection('special_events').getOne(payment.event, { fields: 'id,name,requiresApproval,approvalThreshold' }).catch(() => null)
			: null;

		if (payment.status === 'approved') {
			return json({ message: 'Payment already approved' }, { status: 409 });
		}

		if (payment.status === 'paid') {
			return json({ message: 'Payment already paid' }, { status: 409 });
		}

		if (payment.status === 'cancelled') {
			return json({ message: 'Cannot approve cancelled payment' }, { status: 409 });
		}

		if (payment.status === 'approval_required') {
			return json({
				message: 'This payment requires quorum approval. Approve it from the Approvals dashboard.'
			}, { status: 409 });
		}

		if (payment.status !== 'pending') {
			return json({
				message: `Payment has status '${payment.status}', only under-threshold pending payments can be approved here`
			}, { status: 409 });
		}

		const approvalThreshold = Number(event?.approvalThreshold ?? 500);
		const amount = Number(payment.amount ?? 0);
		if (Boolean(event?.requiresApproval) || amount > approvalThreshold) {
			return json({
				message: `Payment amount ${amount} exceeds direct-approve rules (threshold ${approvalThreshold}) or event requires quorum approval`
			}, { status: 409 });
		}

		const updated = await pb.collection('event_payments').update(params.paymentId, {
			status: 'approved',
			approvedAt: new Date().toISOString().split('T')[0],
			approvedBy
		});

		const marker = `[EP:${params.paymentId}]`;
		const eventName = event?.name || 'Event Payment';
		const recipientLabel = payment.recipient === 'manager' ? 'Manager' : 'Talent';
		const paymentTypeLabel = formatPaymentTypeLabel(payment.paymentType);

		const eventTalent = payment.eventTalent
			? await pb.collection('event_talent').getOne(payment.eventTalent, {
				expand: 'talent,talentGroup',
				fields: 'id,talent,talentGroup,expand.talent.name,expand.talentGroup.name'
			}).catch(() => null)
			: null;
		const payeeName = payment.recipient === 'manager'
			? (eventTalent?.expand?.talent?.name || 'Manager')
			: (eventTalent?.expand?.talentGroup?.name || eventTalent?.expand?.talent?.name || 'Talent');

		const linkedExpense = await pb.collection('expenses').getFirstListItem(
			`notes ~ "${marker}"`
		).catch(() => null as any);

		let expense = linkedExpense;
		if (!expense) {
			expense = await pb.collection('expenses').create({
				description: `${eventName} - ${recipientLabel}: ${payeeName} (${paymentTypeLabel})`,
				amount: Number(payment.amount) || 0,
				status: 'approved',
				date: new Date().toISOString().slice(0, 10),
				category: 'Executive/Management Staff',
				notes: `${marker} Auto-created from event payment approval.`,
				approvedDate: new Date().toISOString(),
				approvedBy,
				...(approverId ? { submittedBy: approverId } : {})
			}).catch(() => null);
		}

		if (expense) {
			await pb.collection('expenses').update(expense.id, {
				status: 'approved',
				approvedDate: new Date().toISOString(),
				approvedBy
			}).catch(() => null);

			const existingPendingApproval = await pb.collection('approvals').getFirstListItem(
				`entityType = "expense" && entityId = "${expense.id}" && status = "pending"`
			).catch(() => null as any);

			if (existingPendingApproval) {
				await pb.collection('approvals').update(existingPendingApproval.id, {
					status: 'approved',
					reviewedDate: new Date().toISOString(),
					comments: '<p>Approved from event payments panel (direct override).</p>',
					approver: fallbackRequesterId,
					approvers: fallbackRequesterId ? [fallbackRequesterId] : []
				}).catch(() => null);
			} else {
				const existingApprovedApproval = await pb.collection('approvals').getFirstListItem(
					`entityType = "expense" && entityId = "${expense.id}" && status = "approved"`
				).catch(() => null as any);

				if (!existingApprovedApproval) {
					await pb.collection('approvals').create({
						entityType: 'expense',
						entityId: expense.id,
						expenseId: expense.id,
						status: 'approved',
						requestedBy: fallbackRequesterId,
						requestedDate: new Date().toISOString(),
						reviewedDate: new Date().toISOString(),
						approver: fallbackRequesterId,
						approvers: fallbackRequesterId ? [fallbackRequesterId] : [],
						amount: Number(payment.amount) || 0,
						comments: '<p>Direct override approval recorded from event payments panel.</p>'
					}).catch(() => null);
				}
			}
		}

		const existingWO = await pb.collection('work_orders').getFirstListItem(
			`notes ~ '${marker}'`
		).catch(() => null as any);

		if (!existingWO) {
			const allWOs = await pb.collection('work_orders').getFullList({
				fields: 'work_order_number', sort: '-created'
			}).catch(() => []) as any[];
			const seq = allWOs.length + 1;
			const eventCode = deriveCode(eventName);
			const woNumber = `WO-${eventCode}-${String(seq).padStart(4, '0')}`;

			await pb.collection('work_orders').create({
				work_order_number: woNumber,
				source: 'expense',
				status: 'open',
				approver: approverId,
				submittedBy: approverId,
				description: `${eventName} — ${paymentTypeLabel} to ${payeeName}`.slice(0, 500),
				amount: Number(payment.amount) || 0,
				approvedDate: new Date().toISOString(),
				notes: `${marker} Approved from event payments panel.`
			}).catch(() => null);
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
