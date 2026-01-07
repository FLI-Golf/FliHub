import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recalculateBudgetHierarchy } from '$lib/utils/budget-calculator';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		const updateData: any = {
			title: data.title,
			description: data.description || '',
			status: data.status,
			priority: data.priority || 'medium',
			startDate: data.startDate || null,
			dueDate: data.dueDate || null,
			estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : null,
			actualHours: data.actualHours !== undefined ? data.actualHours : null,
			task_budget: data.task_budget !== undefined ? parseFloat(data.task_budget) || 0 : null,
			notes: data.notes || '',
			completedDate: data.status === 'completed' ? new Date().toISOString() : null
		};

		// Only update subTasksChecklist if it's provided in the request
		if (data.subTasksChecklist !== undefined) {
			updateData.subTasksChecklist = data.subTasksChecklist;
		}

		const task = await pb.collection('tasks').update(params.id, updateData);

		// Recalculate budget hierarchy if task has a project
		console.log('Task updated:', task.title);
		console.log('Task projectId:', task.projectId);
		console.log('Task budget:', task.task_budget);
		
		if (task.projectId) {
			console.log('🔄 Recalculating budget hierarchy for project:', task.projectId);
			try {
				await recalculateBudgetHierarchy(pb, task.projectId);
				console.log('✅ Budget hierarchy recalculated successfully');
			} catch (budgetErr) {
				console.error('❌ Error recalculating budgets:', budgetErr);
				// Don't fail the task update if budget calculation fails
			}
		} else {
			console.log('⚠️  Task has no projectId, skipping budget recalculation');
		}

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
		// Get task before deleting to know which project to recalculate
		const task = await pb.collection('tasks').getOne(params.id);
		const projectId = task.projectId;

		await pb.collection('tasks').delete(params.id);

		// Recalculate budget hierarchy if task had a project
		if (projectId) {
			try {
				await recalculateBudgetHierarchy(pb, projectId);
			} catch (budgetErr) {
				console.error('Error recalculating budgets:', budgetErr);
				// Don't fail the task deletion if budget calculation fails
			}
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error deleting task:', error);
		return json(
			{ message: 'Failed to delete task', error: String(error) },
			{ status: 500 }
		);
	}
};
