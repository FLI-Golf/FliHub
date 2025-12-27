import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const task = await pb.collection('tasks').create({
			title: data.title,
			description: data.description || '',
			status: data.status,
			priority: data.priority || 'medium',
			startDate: data.startDate || null,
			dueDate: data.dueDate || null,
			estimatedHours: data.estimatedHours || null,
			actualHours: 0,
			notes: data.notes || '',
			createdBy: pb.authStore.model?.id
		});

		return json(task, { status: 201 });
	} catch (error) {
		console.error('Error creating task:', error);
		return json(
			{ message: 'Failed to create task', error: String(error) },
			{ status: 500 }
		);
	}
};
