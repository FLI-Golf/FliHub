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
 * POST /api/events/[id]/payments/approve-all
 * Bulk direct-approve event payments that are under-threshold only.
 * Quorum-required payments must be approved from the approvals dashboard.
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

		const event = await pb.collection('special_events').getOne(params.id, {
			fields: 'id,name,requiresApproval,approvalThreshold'
		});
		const approvalThreshold = Number(event.approvalThreshold ?? 500);

		const payments = await pb.collection('event_payments').getFullList({
			filter: `event = "${params.id}" && status = "pending"`
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
				const amount = Number(payment.amount ?? 0);
				if (Boolean(event.requiresApproval) || amount > approvalThreshold) {
					continue;
				}

				const updated = await pb.collection('event_payments').update(payment.id, {
					status: 'approved',
					approvedAt: now,
					approvedBy
				});

				const eventRecord = payment.event
					? await pb.collection('special_events').getOne(payment.event, { fields: 'id,name' }).catch(() => null)
					: null;
				const marker = `[EP:${payment.id}]`;
				const eventName = eventRecord?.name || 'Event Payment';
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
						notes: `${marker} Auto-created from event payment bulk approval.`,
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
							comments: '<p>Bulk-approved from event payments panel (direct override).</p>',
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
								comments: '<p>Bulk direct override approval recorded from event payments panel.</p>'
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
						notes: `${marker} Bulk-approved from event payments panel.`
					}).catch(() => null);
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
