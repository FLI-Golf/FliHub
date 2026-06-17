import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import { checkEventFundingCapacity } from '$lib/server/event-funding';
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

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const guard = await requireAdminApi(locals);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const paidBy = (locals as any)?.pb?.authStore?.model?.email ?? 'admin';

		const payment = await pb.collection('event_payments').getOne(params.paymentId);
		if (payment.event !== params.id) {
			return json({ message: 'Payment does not belong to this event' }, { status: 400 });
		}
		if (payment.status === 'paid') {
			return json({ message: 'Payment already marked as paid' }, { status: 409 });
		}
		if (payment.status === 'approval_required') {
			return json({ message: 'Payment requires approval before payout' }, { status: 409 });
		}

		const fundingCheck = await checkEventFundingCapacity(pb, {
			eventId: payment.event,
			paymentAmount: Number(payment.amount) || 0,
			excludePaymentId: payment.id,
			mode: 'pay'
		});

		if (!fundingCheck.ok) {
			return json({
				message: 'Insufficient budget capacity for payout',
				budgetCheck: fundingCheck
			}, { status: 409 });
		}

		if (payment.status === 'approved') {
			const marker = `[EP:${payment.id}]`;
			const existingWO = await pb.collection('work_orders').getFirstListItem(
				`source = 'event_payment' && notes ~ '${marker}'`
			).catch(() => null) as any;

			if (!existingWO) {
				const allWOs = await pb.collection('work_orders').getFullList({
					fields: 'work_order_number', sort: '-created'
				}).catch(() => []) as any[];
				const seq = allWOs.length + 1;
				const eventRecord = payment.event
					? await pb.collection('special_events').getOne(payment.event, { fields: 'id,name' }).catch(() => null)
					: null;
				const eventCode = deriveCode(eventRecord?.name || 'Event Payment');
				const woNumber = `WO-${eventCode}-${String(seq).padStart(4, '0')}`;

				await pb.collection('work_orders').create({
					work_order_number: woNumber,
					source:            'event_payment',
					status:            'open',
					approver:          null,
					submittedBy:       null,
					description:       `${eventRecord?.name || 'Event'} — ${payment.paymentType || 'payment'}`.slice(0, 500),
					amount:            payment.amount || 0,
					approvedDate:      new Date().toISOString(),
					notes:             `${marker} Auto-created before paid transition.`
				}).catch(() => null);
			}
		}

		const updated = await pb.collection('event_payments').update(params.paymentId, {
			status: 'paid',
			paidAt: new Date().toISOString().split('T')[0],
			paidBy
		});

		if (fundingCheck.departmentId) {
			await pb.collection('departments').update(fundingCheck.departmentId, {
				department_actual_expenses: fundingCheck.departmentActualExpenses + (Number(payment.amount) || 0)
			}).catch((e: any) => console.warn('Failed to roll event payment into department actuals:', e?.message ?? e));
		}

		// If this was a bonus payment, mark bonusEarned on the event_talent record
		if (payment.isBonus && payment.eventTalent) {
			await pb.collection('event_talent').update(payment.eventTalent, { bonusEarned: true }).catch(() => {});
		}

		return json({
			...updated,
			budgetWarningLevel: fundingCheck.warningLevel
		});
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to mark payment as paid' }, { status: 400 });
	}
};
