import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { ProPaymentRepo } from '$lib/infra/pocketbase/repositories';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
		const paymentRepo = new ProPaymentRepo(pb);

	const status = url.searchParams.get('status');
	const proId = url.searchParams.get('pro');

	try {
		let payments;
		if (status) {
			payments = await paymentRepo.findByStatus(status);
		} else if (proId) {
			payments = await paymentRepo.findByPro(proId);
		} else {
			payments = await paymentRepo.findAll({
				expand: 'pro,tournament,specialEvent',
				perPage: 100
			});
		}

		const [pros, tournaments, specialEvents] = await Promise.all([
			pb.collection('talent').getFullList({ sort: 'name' }),
			pb.collection('tournaments').getFullList({ sort: '-season,-tournamentNumber' }),
			pb.collection('special_events').getFullList({ sort: '-eventDate' })
		]);

		return {
			payments: payments.items,
			pros,
			tournaments,
			specialEvents,
			currentStatus: status,
			currentProId: proId
		};
	} catch (error) {
		console.error('Error loading payments:', error);
		return {
			payments: [],
			pros: [],
			tournaments: [],
			specialEvents: [],
			currentStatus: null,
			currentProId: null
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();

		const data = {
			pro: formData.get('pro') as string,
			paymentType: formData.get('paymentType') as string,
			tournament: formData.get('tournament') as string || undefined,
			specialEvent: formData.get('specialEvent') as string || undefined,
			amount: parseFloat(formData.get('amount') as string),
			paymentDate: formData.get('paymentDate') as string || undefined,
			dueDate: formData.get('dueDate') as string || undefined,
			status: (formData.get('status') as string) || 'pending',
			paymentMethod: formData.get('paymentMethod') as string || undefined,
			transactionId: formData.get('transactionId') as string || undefined,
			description: formData.get('description') as string || undefined,
			notes: formData.get('notes') as string || undefined
		};

		try {
			const payment = await pb.collection('pro_payments').create(data);
			return { success: true, payment };
		} catch (error: any) {
			console.error('Error creating payment:', error);
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		const data = {
			pro: formData.get('pro') as string,
			paymentType: formData.get('paymentType') as string,
			tournament: formData.get('tournament') as string || undefined,
			specialEvent: formData.get('specialEvent') as string || undefined,
			amount: parseFloat(formData.get('amount') as string),
			paymentDate: formData.get('paymentDate') as string || undefined,
			dueDate: formData.get('dueDate') as string || undefined,
			status: formData.get('status') as string,
			paymentMethod: formData.get('paymentMethod') as string || undefined,
			transactionId: formData.get('transactionId') as string || undefined,
			description: formData.get('description') as string || undefined,
			notes: formData.get('notes') as string || undefined
		};

		try {
			const payment = await pb.collection('pro_payments').update(id, data);
			return { success: true, payment };
		} catch (error: any) {
			console.error('Error updating payment:', error);
			return fail(400, { error: error.message });
		}
	},

	markPaid: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			const payment = await pb.collection('pro_payments').update(id, {
				status: 'paid',
				paymentDate: new Date().toISOString().split('T')[0]
			});
			return { success: true, payment };
		} catch (error: any) {
			console.error('Error marking payment as paid:', error);
			return fail(400, { error: error.message });
		}
	},

	delete: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('pro_payments').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting payment:', error);
			return fail(400, { error: error.message });
		}
	}
};
