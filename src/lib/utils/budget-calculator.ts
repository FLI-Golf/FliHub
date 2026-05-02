/**
 * Budget Calculation Utilities
 *
 * Single source of truth per level:
 *   task_budget          → what was planned for this task
 *   task_actual_cost     → approved expenses against this task
 *   project_budget       → sum of task_budget (or manually set)
 *   project_actual_expenses → sum of approved expenses on this project
 *   project_forecasted_expenses → optional manual forecast
 *   department_annual_budget    → sum of project_budget
 *   department_actual_expenses  → sum of project_actual_expenses
 *
 * Approved expenses drive actuals — nothing else does.
 */

import type PocketBase from 'pocketbase';

export interface TaskBudget {
	task_budget: number;
	task_actual_cost: number;
}

export interface ProjectBudget {
	project_budget: number;
	project_actual_expenses: number;
	project_forecasted_expenses: number;
}

export interface DepartmentBudget {
	department_annual_budget: number;
	department_actual_expenses: number;
}

/**
 * Calculate project budget from its tasks
 */
export async function calculateProjectBudget(
	pb: PocketBase,
	projectId: string
): Promise<{ budget: number; actualCost: number }> {
	try {
		// Fetch all tasks for this project
		const tasks = await pb.collection('tasks').getFullList({
			filter: `projectId = "${projectId}"`
		});

		const budget = tasks.reduce((sum, task) => sum + (task.task_budget || 0), 0);
		const actualCost = tasks.reduce((sum, task) => sum + (task.task_actual_cost || 0), 0);

		return { budget, actualCost };
	} catch (error) {
		console.error('Error calculating project budget:', error);
		return { budget: 0, actualCost: 0 };
	}
}

/**
 * Calculate project actual expenses (from expenses collection)
 */
export async function calculateProjectActualExpenses(
	pb: PocketBase,
	projectId: string
): Promise<number> {
	try {
		const expenses = await pb.collection('expenses').getFullList({
			filter: `projectId = "${projectId}"`
		});

		return expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
	} catch (error) {
		console.error('Error calculating project actual expenses:', error);
		return 0;
	}
}

/**
 * Update project budget based on its tasks.
 * project_budget       = sum of task_budget
 * project_actual_expenses = sum of approved expenses
 */
export async function updateProjectBudget(
	pb: PocketBase,
	projectId: string
): Promise<void> {
	try {
		const project = await pb.collection('projects').getOne(projectId);
		const { budget: tasksBudget, actualCost } = await calculateProjectBudget(pb, projectId);
		const actualExpenses = await calculateProjectActualExpenses(pb, projectId);

		await pb.collection('projects').update(projectId, {
			project_budget: tasksBudget,
			project_actual_expenses: actualExpenses + actualCost
		});

		console.log(`[Budget] Project "${project.name}" → budget $${tasksBudget}, actual $${actualExpenses + actualCost}`);
	} catch (error) {
		console.error('Error updating project budget:', error);
		throw error;
	}
}

/**
 * Calculate department budget from its projects
 */
export async function calculateDepartmentBudget(
	pb: PocketBase,
	departmentId: string
): Promise<{ budget: number; actualExpenses: number }> {
	try {
		const projects = await pb.collection('projects').getFullList({
			filter: `department = "${departmentId}"`
		});

		const budget = projects.reduce((sum, project) => sum + (project.project_budget || 0), 0);
		const actualExpenses = projects.reduce(
			(sum, project) => sum + (project.project_actual_expenses || 0),
			0
		);

		return { budget, actualExpenses };
	} catch (error) {
		console.error('Error calculating department budget:', error);
		return { budget: 0, actualExpenses: 0 };
	}
}

/**
 * Update department budget based on its projects.
 * department_annual_budget   = sum of project_budget
 * department_actual_expenses = sum of project_actual_expenses
 */
export async function updateDepartmentBudget(
	pb: PocketBase,
	departmentId: string
): Promise<void> {
	try {
		const department = await pb.collection('departments').getOne(departmentId);
		const { budget: projectsBudget, actualExpenses } = await calculateDepartmentBudget(pb, departmentId);

		await pb.collection('departments').update(departmentId, {
			department_annual_budget: projectsBudget,
			department_actual_expenses: actualExpenses
		});

		console.log(`[Budget] Dept "${department.name}" → budget $${projectsBudget}, actual $${actualExpenses}`);
	} catch (error) {
		console.error('Error updating department budget:', error);
		throw error;
	}
}

/**
 * Recalculate entire budget hierarchy for a task
 * Call this when a task is created, updated, or deleted
 */
export async function recalculateBudgetHierarchy(
	pb: PocketBase,
	taskProjectId: string
): Promise<void> {
	try {
		// Update project budget
		await updateProjectBudget(pb, taskProjectId);

		// Get project to find its department
		const project = await pb.collection('projects').getOne(taskProjectId);

		if (project.department) {
			// Update department budget
			await updateDepartmentBudget(pb, project.department);
		}
	} catch (error) {
		console.error('Error recalculating budget hierarchy:', error);
		throw error;
	}
}

/**
 * Calculate task actual cost from hours worked
 * Assumes a default hourly rate if not specified
 */
export function calculateTaskActualCost(
	actualHours: number,
	hourlyRate: number = 50 // Default rate, can be made configurable
): number {
	return actualHours * hourlyRate;
}
