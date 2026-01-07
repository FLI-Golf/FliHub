import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;
	const departmentId = params.id;

	console.log('=== DEPARTMENT DETAIL LOAD START ===');
	console.log('Department ID:', departmentId);

	try {
		// Fetch department details
		const department = await pb.collection('departments').getOne(departmentId, {
			expand: 'headOfDepartment'
		});
		console.log('✓ Department loaded:', department.name);

		// Fetch all projects for this department
		let projects = [];
		try {
			projects = await pb.collection('projects').getFullList({
				filter: `department = "${departmentId}"`
			});
			console.log('✓ Projects loaded:', projects.length);
		} catch (projectErr: any) {
			console.error('Error fetching projects:', projectErr.message);
			console.error('Full error:', JSON.stringify(projectErr, null, 2));
			// Continue with empty projects array
			projects = [];
		}

		// Fetch all expenses related to department projects
		const projectIds = projects.map(p => p.id);
		let expenses = [];
		if (projectIds.length > 0) {
			try {
				const filterString = projectIds.map(id => `project = "${id}"`).join(' || ');
				expenses = await pb.collection('expenses').getFullList({
					filter: filterString
				});
				console.log('✓ Expenses loaded:', expenses.length);
			} catch (expenseErr: any) {
				console.error('Error fetching expenses:', expenseErr.message);
				console.error('Full error:', JSON.stringify(expenseErr, null, 2));
				// Continue with empty expenses array
				expenses = [];
			}
		} else {
			console.log('✓ No projects, skipping expenses fetch');
		}

		// Calculate financial metrics
		const totalBudget = department.department_annual_budget || 0;
		const projectBudgets = projects.reduce((sum, p) => sum + (p.project_budget || 0), 0);
		const actualExpenses = projects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0);
		const forecastedExpenses = projects.reduce((sum, p) => sum + (p.project_forecasted_expenses || 0), 0);

		// Calculate expense breakdown by status
		const expensesByStatus = {
			draft: expenses.filter(e => e.status === 'draft').length,
			submitted: expenses.filter(e => e.status === 'submitted').length,
			approved: expenses.filter(e => e.status === 'approved').length,
			paid: expenses.filter(e => e.status === 'paid').length
		};

		const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
		const approvedExpenseAmount = expenses
			.filter(e => e.status === 'approved' || e.status === 'paid')
			.reduce((sum, e) => sum + (e.amount || 0), 0);

		// Calculate project breakdown by status
		const projectsByStatus = {
			draft: projects.filter(p => p.status === 'draft').length,
			planned: projects.filter(p => p.status === 'planned').length,
			in_progress: projects.filter(p => p.status === 'in_progress').length,
			completed: projects.filter(p => p.status === 'completed').length,
			cancelled: projects.filter(p => p.status === 'cancelled').length
		};

		// Define phase date ranges
		const PHASE1_START = new Date('2026-01-01');
		const PHASE1_END = new Date('2026-09-30');
		const PHASE2_START = new Date('2026-10-01');
		const PHASE2_END = new Date('2027-03-31');
		const PHASE3_START = new Date('2027-04-01');
		const PHASE3_END = new Date('2027-12-31');

		// Helper function to determine project phase
		function getProjectPhase(project: any): string {
			const startDate = project.startDate ? new Date(project.startDate) : null;
			const name = project.name || '';
			
			if (name.match(/^P1[\s-]/i)) return 'phase1';
			if (name.match(/^P2[\s-]/i)) return 'phase2';
			if (name.match(/^P3[\s-]/i)) return 'phase3';
			
			if (startDate) {
				if (startDate >= PHASE1_START && startDate <= PHASE1_END) return 'phase1';
				if (startDate >= PHASE2_START && startDate <= PHASE2_END) return 'phase2';
				if (startDate >= PHASE3_START && startDate <= PHASE3_END) return 'phase3';
			}
			
			return 'phase1';
		}

		// Calculate phase-specific metrics
		const phase1Projects = projects.filter(p => getProjectPhase(p) === 'phase1');
		const phase2Projects = projects.filter(p => getProjectPhase(p) === 'phase2');
		const phase3Projects = projects.filter(p => getProjectPhase(p) === 'phase3');

		const phaseMetrics = {
			phase1: {
				projectCount: phase1Projects.length,
				actual: phase1Projects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0),
				forecasted: phase1Projects.reduce((sum, p) => sum + (p.project_forecasted_expenses || 0), 0),
				budget: phase1Projects.reduce((sum, p) => sum + (p.project_budget || 0), 0)
			},
			phase2: {
				projectCount: phase2Projects.length,
				actual: phase2Projects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0),
				forecasted: phase2Projects.reduce((sum, p) => sum + (p.project_forecasted_expenses || 0), 0),
				budget: phase2Projects.reduce((sum, p) => sum + (p.project_budget || 0), 0)
			},
			phase3: {
				projectCount: phase3Projects.length,
				actual: phase3Projects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0),
				forecasted: phase3Projects.reduce((sum, p) => sum + (p.project_forecasted_expenses || 0), 0),
				budget: phase3Projects.reduce((sum, p) => sum + (p.project_budget || 0), 0)
			}
		};

		console.log('=== DEPARTMENT DETAIL LOAD SUCCESS ===');

		return {
			department,
			projects,
			expenses,
			metrics: {
				budget: {
					total: totalBudget,
					allocated: projectBudgets,
					actual: actualExpenses,
					forecasted: forecastedExpenses,
					remaining: totalBudget - actualExpenses
				},
				projects: {
					total: projects.length,
					...projectsByStatus
				},
				expenses: {
					total: expenses.length,
					totalAmount: totalExpenseAmount,
					approvedAmount: approvedExpenseAmount,
					...expensesByStatus
				},
				phases: phaseMetrics
			}
		};
	} catch (err: any) {
		console.error('Error loading department details:', err);
		throw error(404, 'Department not found');
	}
};
