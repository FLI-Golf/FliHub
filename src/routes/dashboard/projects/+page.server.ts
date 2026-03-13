import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	const [projects, departments, tasks] = await Promise.all([
		pb.collection('projects').getFullList({ sort: '-id' }).catch(() => []),
		pb.collection('departments').getFullList({ sort: 'name' }).catch(() => []),
		pb.collection('tasks').getFullList({ fields: 'projectId,task_actual_cost,task_budget' }).catch(() => [])
	]);

	// Aggregate task costs per project
	const taskCostByProject: Record<string, number> = {};
	for (const task of tasks) {
		if (task.projectId) {
			taskCostByProject[task.projectId] = (taskCostByProject[task.projectId] || 0) + (task.task_actual_cost || 0);
		}
	}

	// Enrich projects with computed actual expenses from tasks
	const enrichedProjects = projects.map((p: any) => ({
		...p,
		project_actual_expenses: taskCostByProject[p.id] || p.project_actual_expenses || 0
	}));

	// Calculate stats
	const byStatus = { draft: 0, planned: 0, in_progress: 0, completed: 0, cancelled: 0 } as Record<string, number>;
	const byType   = { tournament: 0, activation: 0, event: 0, campaign: 0 } as Record<string, number>;
	let totalBudget = 0, totalForecasted = 0, totalActual = 0;
	let overBudget = 0, nearingBudget = 0;

	for (const p of enrichedProjects) {
		if (p.status in byStatus) byStatus[p.status]++;
		if (p.type   in byType)   byType[p.type]++;
		totalBudget     += p.project_budget              || 0;
		totalForecasted += p.project_forecasted_expenses || 0;
		totalActual     += p.project_actual_expenses     || 0;

		if (p.project_budget > 0) {
			const pct = (p.project_actual_expenses / p.project_budget) * 100;
			if (pct >= 100) overBudget++;
			else if (pct >= 80) nearingBudget++;
		}
	}

	return {
		projects: enrichedProjects,
		departments,
		stats: {
			total: enrichedProjects.length,
			byStatus,
			byType,
			budget: {
				total:      totalBudget,
				forecasted: totalForecasted,
				actual:     totalActual,
				variance:   totalBudget - totalActual,
				remaining:  totalBudget - totalActual
			}
		},
		alerts: { overBudget, nearingBudget }
	};
};
