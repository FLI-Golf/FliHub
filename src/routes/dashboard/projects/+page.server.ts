import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	try {
		// Fetch all projects with expanded manager data
		const projects = await pb.collection('projects').getFullList({
			sort: '-created',
			expand: 'managerId'
		});

		// Calculate project statistics
		const stats = {
			total: projects.length,
			byStatus: {
				draft: projects.filter(p => p.status === 'draft').length,
				planned: projects.filter(p => p.status === 'planned').length,
				in_progress: projects.filter(p => p.status === 'in_progress').length,
				completed: projects.filter(p => p.status === 'completed').length,
				cancelled: projects.filter(p => p.status === 'cancelled').length
			},
			byType: {
				tournament: projects.filter(p => p.type === 'tournament').length,
				activation: projects.filter(p => p.type === 'activation').length,
				event: projects.filter(p => p.type === 'event').length,
				campaign: projects.filter(p => p.type === 'campaign').length
			},
			budget: {
				total: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
				forecasted: projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
				actual: projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0)
			}
		};

		// Calculate budget variance
		stats.budget.variance = stats.budget.forecasted - stats.budget.actual;
		stats.budget.remaining = stats.budget.total - stats.budget.actual;

		// Find projects over budget
		const overBudget = projects.filter(p => {
			if (!p.budget || !p.actualExpenses) return false;
			return p.actualExpenses > p.budget;
		});

		// Find projects nearing budget limit (>80%)
		const nearingBudget = projects.filter(p => {
			if (!p.budget || !p.actualExpenses) return false;
			const percentage = (p.actualExpenses / p.budget) * 100;
			return percentage >= 80 && percentage <= 100;
		});

		return {
			projects,
			stats,
			alerts: {
				overBudget: overBudget.length,
				nearingBudget: nearingBudget.length
			}
		};
	} catch (error) {
		console.error('Error loading projects:', error);
		return {
			projects: [],
			stats: {
				total: 0,
				byStatus: { draft: 0, planned: 0, in_progress: 0, completed: 0, cancelled: 0 },
				byType: { tournament: 0, activation: 0, event: 0, campaign: 0 },
				budget: { total: 0, forecasted: 0, actual: 0, variance: 0, remaining: 0 }
			},
			alerts: {
				overBudget: 0,
				nearingBudget: 0
			}
		};
	}
};
