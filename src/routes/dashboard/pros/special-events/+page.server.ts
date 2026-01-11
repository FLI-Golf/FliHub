import type { PageServerLoad, Actions } from './$types';
import { SpecialEventRepo } from '$lib/infra/pocketbase/repositories';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;
	const eventRepo = new SpecialEventRepo(pb);

	const status = url.searchParams.get('status');
	const eventType = url.searchParams.get('type');

	try {
		let events;
		if (status) {
			events = await eventRepo.findAll({
				filter: `status = '${status}'`,
				sort: '-eventDate'
			});
		} else if (eventType) {
			events = await eventRepo.findByType(eventType);
		} else {
			events = await eventRepo.findAll({
				sort: '-eventDate',
				perPage: 100
			});
		}

		return {
			events: events.items,
			currentStatus: status,
			currentType: eventType
		};
	} catch (error) {
		console.error('Error loading special events:', error);
		return {
			events: [],
			currentStatus: null,
			currentType: null
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();

		const data = {
			name: formData.get('name') as string,
			eventType: formData.get('eventType') as string,
			eventDate: formData.get('eventDate') as string,
			location: formData.get('location') as string || undefined,
			description: formData.get('description') as string || undefined,
			status: (formData.get('status') as string) || 'scheduled',
			notes: formData.get('notes') as string || undefined
		};

		try {
			const event = await pb.collection('special_events').create(data);
			return { success: true, event };
		} catch (error: any) {
			console.error('Error creating special event:', error);
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		const data = {
			name: formData.get('name') as string,
			eventType: formData.get('eventType') as string,
			eventDate: formData.get('eventDate') as string,
			location: formData.get('location') as string || undefined,
			description: formData.get('description') as string || undefined,
			status: formData.get('status') as string,
			notes: formData.get('notes') as string || undefined
		};

		try {
			const event = await pb.collection('special_events').update(id, data);
			return { success: true, event };
		} catch (error: any) {
			console.error('Error updating special event:', error);
			return fail(400, { error: error.message });
		}
	},

	delete: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('special_events').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting special event:', error);
			return fail(400, { error: error.message });
		}
	}
};
