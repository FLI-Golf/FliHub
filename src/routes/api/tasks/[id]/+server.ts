import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const task = await pb.collection('tasks').update(params.id, {
			title: data.title,
			description: data.description || '',
			status: data.status,
			priority: data.priority || 'medium',
			startDate: data.startDate || null,
			dueDate: data.dueDate || null,
			estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : null,
			actualHours: data.actualHours !== undefined ? data.actualHours : null,
			notes: data.notes || '',
			completedDate: data.status === 'completed' ? new Date().toISOString() : null
		});

		return json(task, { status: 200 });
	} catch (error) {
		console.error('Error updating task:', error);
		return json(
			{ message: 'Failed to update task', error: String(error) },
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('tasks').delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error deleting task:', error);
		return json(
			{ message: 'Failed to delete task', error: String(error) },
			{ status: 500 }
		);
	}
};
