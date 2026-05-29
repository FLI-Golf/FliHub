import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const pb = await getAdminPocketBase();
		const paidBy = (locals as any)?.pb?.authStore?.model?.email ?? 'admin';

		const payment = await pb.collection('event_payments').getOne(params.paymentId);
		if (payment.event !== params.id) {
			return json({ message: 'Payment does not belong to this event' }, { status: 400 });
		}
		if (payment.status === 'paid') {
			return json({ message: 'Payment already marked as paid' }, { status: 409 });
		}

		const updated = await pb.collection('event_payments').update(params.paymentId, {
			status: 'paid',
			paidAt: new Date().toISOString().split('T')[0],
			paidBy
		});

		// If this was a bonus payment, mark bonusEarned on the event_talent record
		if (payment.isBonus && payment.eventTalent) {
			await pb.collection('event_talent').update(payment.eventTalent, { bonusEarned: true }).catch(() => {});
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err.message ?? 'Failed to mark payment as paid' }, { status: 400 });
	}
};
