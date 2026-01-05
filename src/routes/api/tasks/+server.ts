import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Build task data, only including fields that have values
		const taskData: any = {
			title: data.title,
			status: data.status || 'todo'
		};

		// Add optional fields only if they have values
		if (data.description) taskData.description = data.description;
		if (data.priority) taskData.priority = data.priority;
		if (data.startDate && data.startDate !== '') taskData.startDate = data.startDate;
		if (data.dueDate && data.dueDate !== '') taskData.dueDate = data.dueDate;
		if (data.estimatedHours) taskData.estimatedHours = parseFloat(data.estimatedHours);
		if (data.notes) taskData.notes = data.notes;
		if (data.subTasksChecklist) taskData.subTasksChecklist = data.subTasksChecklist;
		if (data.projectId && data.projectId !== '') taskData.projectId = data.projectId;

		const task = await pb.collection('tasks').create(taskData);

		return json(task, { status: 201 });
	} catch (error: any) {
		console.error('Error creating task:', error);
		return json(
			{ 
				message: 'Failed to create task', 
				error: error?.message || String(error)
			},
			{ status: 500 }
		);
	}
};
