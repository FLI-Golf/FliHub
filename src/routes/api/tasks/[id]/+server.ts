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

		const updateData: any = {};

		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description || '';
		if (data.status !== undefined) updateData.status = data.status;
		if (data.priority !== undefined) updateData.priority = data.priority || 'medium';
		if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
		if (data.dueDate !== undefined) updateData.dueDate = data.dueDate || null;
		if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours ?? null;
		if (data.actualHours !== undefined) updateData.actualHours = data.actualHours ?? null;
		if (data.task_budget !== undefined) updateData.task_budget = parseFloat(data.task_budget) || 0;
		if (data.task_actual_cost !== undefined) updateData.task_actual_cost = parseFloat(data.task_actual_cost) || 0;
		if (data.tags !== undefined) updateData.tags = data.tags || '';
		if (data.notes !== undefined) updateData.notes = data.notes || '';
		if (data.completedDate !== undefined) {
			updateData.completedDate = data.completedDate || null;
		} else if (data.status !== undefined) {
			updateData.completedDate = data.status === 'completed' ? new Date().toISOString() : null;
		}

		// Only update subTasksChecklist if it's provided in the request
		if (data.subTasksChecklist !== undefined) {
			updateData.subTasksChecklist = data.subTasksChecklist;
		}
		if (data.contentProductionId !== undefined) {
			updateData.contentProductionId = data.contentProductionId || null;
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
