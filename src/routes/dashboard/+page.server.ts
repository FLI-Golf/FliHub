import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	try {
		// Fetch counts and metrics
		const [projects, tasks, expenses, managers] = await Promise.all([
			pb.collection('projects').getList(1, 1, { fields: 'id' }),
			pb.collection('tasks').getList(1, 1, { fields: 'id' }),
			pb.collection('expenses').getList(1, 1, { fields: 'id' }),
			pb.collection('managers').getList(1, 1, { fields: 'id' })
		]);

		// Fetch recent projects
		const recentProjects = await pb.collection('projects').getList(1, 5, {
			sort: '-created',
			expand: 'managerId'
		});

		// Fetch tasks by status
		const tasksByStatus = await Promise.all([
			pb.collection('tasks').getList(1, 1, { 
				filter: 'status = "todo"',
				fields: 'id'
			}),
			pb.collection('tasks').getList(1, 1, { 
				filter: 'status = "in_progress"',
				fields: 'id'
			}),
			pb.collection('tasks').getList(1, 1, { 
				filter: 'status = "completed"',
				fields: 'id'
			})
		]);

		// Fetch expenses by status
		const expensesByStatus = await Promise.all([
			pb.collection('expenses').getList(1, 1, { 
				filter: 'status = "draft"',
				fields: 'id'
			}),
			pb.collection('expenses').getList(1, 1, { 
				filter: 'status = "submitted"',
				fields: 'id'
			}),
			pb.collection('expenses').getList(1, 1, { 
				filter: 'status = "approved"',
				fields: 'id'
			}),
			pb.collection('expenses').getList(1, 1, { 
				filter: 'status = "paid"',
				fields: 'id'
			})
		]);

		// Calculate total expenses
		const allExpenses = await pb.collection('expenses').getFullList({
			fields: 'amount,status'
		});

		const totalExpenses = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
		const approvedExpenses = allExpenses
			.filter(exp => exp.status === 'approved' || exp.status === 'paid')
			.reduce((sum, exp) => sum + (exp.amount || 0), 0);

		// Fetch projects with budget data
		const projectsWithBudget = await pb.collection('projects').getFullList({
			fields: 'budget,forecastedExpenses,actualExpenses,status'
		});

		const totalBudget = projectsWithBudget.reduce((sum, proj) => sum + (proj.budget || 0), 0);
		const totalForecasted = projectsWithBudget.reduce((sum, proj) => sum + (proj.forecastedExpenses || 0), 0);
		const totalActual = projectsWithBudget.reduce((sum, proj) => sum + (proj.actualExpenses || 0), 0);

		return {
			metrics: {
				projects: {
					total: projects.totalItems,
					active: projectsWithBudget.filter(p => p.status === 'in_progress').length,
					completed: projectsWithBudget.filter(p => p.status === 'completed').length
				},
				tasks: {
					total: tasks.totalItems,
					todo: tasksByStatus[0].totalItems,
					inProgress: tasksByStatus[1].totalItems,
					completed: tasksByStatus[2].totalItems
				},
				expenses: {
					total: expenses.totalItems,
					totalAmount: totalExpenses,
					approvedAmount: approvedExpenses,
					draft: expensesByStatus[0].totalItems,
					submitted: expensesByStatus[1].totalItems,
					approved: expensesByStatus[2].totalItems,
					paid: expensesByStatus[3].totalItems
				},
				budget: {
					total: totalBudget,
					forecasted: totalForecasted,
					actual: totalActual,
					remaining: totalBudget - totalActual
				},
				managers: {
					total: managers.totalItems
				}
			},
			recentProjects: recentProjects.items
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			metrics: {
				projects: { total: 0, active: 0, completed: 0 },
				tasks: { total: 0, todo: 0, inProgress: 0, completed: 0 },
				expenses: { total: 0, totalAmount: 0, approvedAmount: 0, draft: 0, submitted: 0, approved: 0, paid: 0 },
				budget: { total: 0, forecasted: 0, actual: 0, remaining: 0 },
				managers: { total: 0 }
			},
			recentProjects: []
		};
	}
};
