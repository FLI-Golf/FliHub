/**
 * Budget Calculation Utilities
 * 
 * Provides functions to calculate budgets across the hierarchy:
 * Tasks → Projects → Departments
 */

import type PocketBase from 'pocketbase';

export interface TaskBudget {
	task_budget: number;
	task_actual_cost: number;
}

export interface ProjectBudget {
	project_budget: number;
	project_forecasted_expenses: number;
	project_actual_expenses: number;
	project_manual_budget_override?: number;
}

export interface DepartmentBudget {
	department_annual_budget: number;
	department_actual_expenses: number;
	department_manual_budget_override?: number;
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
 * Update project budget based on its tasks
 */
export async function updateProjectBudget(
	pb: PocketBase,
	projectId: string
): Promise<void> {
	try {
		const project = await pb.collection('projects').getOne(projectId);
		console.log(`[Budget] Updating project: ${project.name} (mode: ${project.project_budget_mode || 'auto'})`);

		const mode = project.project_budget_mode || 'auto';
		const { budget: tasksBudget, actualCost } = await calculateProjectBudget(pb, projectId);
		const actualExpenses = await calculateProjectActualExpenses(pb, projectId);

		let finalBudget = 0;

		switch (mode) {
			case 'auto':
				// Sum all task budgets
				finalBudget = tasksBudget;
				console.log(`[Budget] Auto mode: ${finalBudget} from tasks`);
				break;

			case 'fixed':
				// Use manual override
				finalBudget = project.project_manual_budget_override || 0;
				console.log(`[Budget] Fixed mode: ${finalBudget} from manual override`);
				break;

			case 'hybrid':
				// Tasks + buffer
				const buffer = project.project_budget_buffer || 0;
				finalBudget = tasksBudget + buffer;
				console.log(`[Budget] Hybrid mode: ${tasksBudget} (tasks) + ${buffer} (buffer) = ${finalBudget}`);
				break;

			case 'capped':
				// Tasks but capped at maximum
				const cap = project.project_budget_cap || Infinity;
				finalBudget = Math.min(tasksBudget, cap);
				console.log(`[Budget] Capped mode: ${tasksBudget} (tasks) capped at ${cap} = ${finalBudget}`);
				break;

			default:
				finalBudget = tasksBudget;
		}

		await pb.collection('projects').update(projectId, {
			project_budget: finalBudget,
			project_forecasted_expenses: finalBudget,
			project_actual_expenses: actualExpenses + actualCost
		});
		
		console.log(`[Budget] Project budget updated successfully to ${finalBudget}`);
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
 * Update department budget based on its projects
 */
export async function updateDepartmentBudget(
	pb: PocketBase,
	departmentId: string
): Promise<void> {
	try {
		const department = await pb.collection('departments').getOne(departmentId);
		console.log(`[Budget] Updating department: ${department.name} (mode: ${department.department_budget_mode || 'auto'})`);

		const mode = department.department_budget_mode || 'auto';
		const { budget: projectsBudget, actualExpenses } = await calculateDepartmentBudget(pb, departmentId);

		let finalBudget = 0;

		switch (mode) {
			case 'auto':
				// Sum all project budgets
				finalBudget = projectsBudget;
				console.log(`[Budget] Auto mode: ${finalBudget} from projects`);
				break;

			case 'annual_cap':
				// Use manual override or cap
				finalBudget = department.department_manual_budget_override || department.department_budget_cap || 0;
				console.log(`[Budget] Annual cap mode: ${finalBudget}`);
				break;

			case 'allocated':
				// Use pre-allocated amount
				finalBudget = department.department_manual_budget_override || 0;
				console.log(`[Budget] Allocated mode: ${finalBudget}`);
				break;

			default:
				finalBudget = projectsBudget;
		}

		await pb.collection('departments').update(departmentId, {
			department_annual_budget: finalBudget,
			department_actual_expenses: actualExpenses
		});

		console.log(`[Budget] Department budget updated successfully to ${finalBudget}`);
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
