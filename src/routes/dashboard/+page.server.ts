import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;

	console.log('=== DASHBOARD LOAD START v2.0 ===');

	// Check user role and redirect vendor/leader users
	const userId = pb.authStore.model?.id;
	if (userId) {
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		});
		const userProfile = profiles[0];

		if (userProfile?.role === 'vendor') {
			console.log('Vendor user detected, redirecting to /dashboard/vendors');
			throw redirect(303, '/dashboard/vendors');
		}

		if (userProfile?.role === 'leader') {
			console.log('Leader user detected, redirecting to department dashboard');
			if (!userProfile.departmentId) {
				throw redirect(303, '/dashboard/departments');
			}
			throw redirect(303, `/dashboard/department/${userProfile.departmentId}`);
		}
	}

	try {
		// Fetch counts and metrics with error handling for each collection
		console.log('Fetching collection counts...');
		const [projects, departments, expenses, userProfiles] = await Promise.allSettled([
			pb.collection('projects').getList(1, 1, { fields: 'id' }),
			pb.collection('departments').getList(1, 1, { fields: 'id' }),
			pb.collection('expenses').getList(1, 1, { fields: 'id' }),
			pb.collection('user_profiles').getList(1, 1, { fields: 'id' })
		]).then(results => results.map((r, i) => {
			const collectionName = ['projects', 'departments', 'expenses', 'user_profiles'][i];
			if (r.status === 'fulfilled') {
				console.log(`✓ ${collectionName}: ${r.value.totalItems} items`);
				return r.value;
			}
			console.error(`✗ Failed to fetch ${collectionName}:`, r.reason?.message || r.reason);
			return { totalItems: 0, items: [] };
		}));

		// Fetch recent projects
		console.log('Fetching recent projects...');
		let recentProjects = { items: [] };
		try {
			recentProjects = await pb.collection('projects').getList(1, 5, {
				sort: '-created',
				expand: 'managerId'
			});
			console.log(`✓ Recent projects: ${recentProjects.items.length} items`);
		} catch (err: any) {
			console.error('✗ Failed to fetch recent projects:', err.message);
		}

		// Fetch departments with full details
		console.log('Fetching departments details...');
		let allDepartments = [];
		try {
			allDepartments = await pb.collection('departments').getList(1, 100, {
				expand: 'headOfDepartment'
			});
			allDepartments = allDepartments.items;
			console.log(`✓ Departments details: ${allDepartments.length} items`);
		} catch (err: any) {
			console.error('✗ Failed to fetch departments details:', err.message);
		}

		// Fetch expenses by status
		console.log('Fetching expenses by status...');
		const expensesByStatus = await Promise.allSettled([
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
		]).then(results => results.map((r, i) => {
			const status = ['draft', 'submitted', 'approved', 'paid'][i];
			if (r.status === 'fulfilled') {
				console.log(`✓ Expenses ${status}: ${r.value.totalItems}`);
				return r.value;
			}
			console.error(`✗ Failed to fetch expenses ${status}:`, r.reason?.message);
			return { totalItems: 0 };
		}));

		// Calculate total expenses
		console.log('Fetching all expenses for totals...');
		let allExpenses = [];
		let totalExpenses = 0;
		let approvedExpenses = 0;
		try {
			allExpenses = await pb.collection('expenses').getFullList({
				fields: 'amount,status'
			});
			totalExpenses = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
			approvedExpenses = allExpenses
				.filter(exp => exp.status === 'approved' || exp.status === 'paid')
				.reduce((sum, exp) => sum + (exp.amount || 0), 0);
			console.log(`✓ Total expenses: $${totalExpenses}, Approved: $${approvedExpenses}`);
		} catch (err: any) {
			console.error('✗ Failed to fetch expenses:', err.message);
		}

		// Fetch ALL project details using the SAME method as the count query
		let projectsWithBudget = [];
		let totalBudget = 0;
		let totalForecasted = 0;
		let totalActual = 0;
		
		try {
			// Use getList with a high page size (same as the working query above)
			const fullProjectsResult = await pb.collection('projects').getList(1, 100);
			projectsWithBudget = fullProjectsResult.items;
			console.log(`Fetched ${projectsWithBudget.length} full projects`);
			
			// Calculate total budget from department annual budgets
			totalBudget = allDepartments.reduce((sum, dept) => sum + (dept.department_annual_budget || 0), 0);
			console.log(`✓ Total budget from departments: $${totalBudget}`);
			
			// Calculate forecasted and actual from projects
			totalForecasted = projectsWithBudget.reduce((sum, proj) => sum + (proj.forecastedExpenses || 0), 0);
			totalActual = projectsWithBudget.reduce((sum, proj) => sum + (proj.actualExpenses || 0), 0);
			console.log(`✓ Total forecasted: $${totalForecasted}, Total actual: $${totalActual}`);
		} catch (err: any) {
			console.error('Failed to fetch full project details:', err.message);
		}

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
			
			// Check name prefix first
			if (name.match(/^P1[\s-]/i)) return 'phase1';
			if (name.match(/^P2[\s-]/i)) return 'phase2';
			if (name.match(/^P3[\s-]/i)) return 'phase3';
			
			// Fall back to date range
			if (startDate) {
				if (startDate >= PHASE1_START && startDate <= PHASE1_END) return 'phase1';
				if (startDate >= PHASE2_START && startDate <= PHASE2_END) return 'phase2';
				if (startDate >= PHASE3_START && startDate <= PHASE3_END) return 'phase3';
			}
			
			return 'phase1'; // Default to phase 1
		}

		// Organize projects by phase
		const projectsByPhase = {
			phase1: projectsWithBudget.filter(p => getProjectPhase(p) === 'phase1'),
			phase2: projectsWithBudget.filter(p => getProjectPhase(p) === 'phase2'),
			phase3: projectsWithBudget.filter(p => getProjectPhase(p) === 'phase3')
		};

		// Calculate department budget allocations with phase breakdown
		console.log('Calculating department budget allocations...');
		const departmentBudgets = allDepartments.map(dept => {
			const deptProjects = projectsWithBudget.filter(p => p.departmentId === dept.id);
			const budget = dept.department_annual_budget || 0;
			const actual = deptProjects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0);
			const forecasted = deptProjects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0);
			
			// Calculate by phase
			const phase1Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase1');
			const phase2Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase2');
			const phase3Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase3');
			
			return {
				id: dept.id,
				name: dept.name,
				budget,
				actual,
				forecasted,
				projectCount: deptProjects.length,
				phases: {
					phase1: {
						actual: phase1Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
						forecasted: phase1Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
						projectCount: phase1Projects.length
					},
					phase2: {
						actual: phase2Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
						forecasted: phase2Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
						projectCount: phase2Projects.length
					},
					phase3: {
						actual: phase3Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
						forecasted: phase3Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
						projectCount: phase3Projects.length
					}
				}
			};
		}).filter(d => d.budget > 0 || d.actual > 0);
		console.log(`✓ Department budgets calculated: ${departmentBudgets.length} departments with budgets`);

		// Calculate phase-specific metrics
		const phaseMetrics = {
			phase1: {
				budget: totalBudget / 3, // Distribute budget evenly across phases
				actual: projectsByPhase.phase1.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
				forecasted: projectsByPhase.phase1.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
				projectCount: projectsByPhase.phase1.length
			},
			phase2: {
				budget: totalBudget / 3,
				actual: projectsByPhase.phase2.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
				forecasted: projectsByPhase.phase2.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
				projectCount: projectsByPhase.phase2.length
			},
			phase3: {
				budget: totalBudget / 3,
				actual: projectsByPhase.phase3.reduce((sum, p) => sum + (p.actualExpenses || 0), 0),
				forecasted: projectsByPhase.phase3.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0),
				projectCount: projectsByPhase.phase3.length
			}
		};

		const result = {
			metrics: {
				projects: {
					total: projects.totalItems,
					draft: projectsWithBudget.filter(p => p.status === 'draft').length,
					planned: projectsWithBudget.filter(p => p.status === 'planned').length,
					active: projectsWithBudget.filter(p => p.status === 'in_progress').length,
					completed: projectsWithBudget.filter(p => p.status === 'completed').length,
					cancelled: projectsWithBudget.filter(p => p.status === 'cancelled').length
				},
				projectsByStatus: {
					draft: projectsWithBudget.filter(p => p.status === 'draft'),
					planned: projectsWithBudget.filter(p => p.status === 'planned'),
					in_progress: projectsWithBudget.filter(p => p.status === 'in_progress'),
					completed: projectsWithBudget.filter(p => p.status === 'completed'),
					cancelled: projectsWithBudget.filter(p => p.status === 'cancelled')
				},
				departments: {
					total: departments.totalItems,
					active: allDepartments.filter(d => d.status === 'active').length,
					inactive: allDepartments.filter(d => d.status === 'inactive').length
				},
				departmentsByStatus: {
					active: allDepartments.filter(d => d.status === 'active'),
					inactive: allDepartments.filter(d => d.status === 'inactive')
				},
				departmentBudgets,
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
					total: userProfiles.totalItems
				},
				phases: phaseMetrics
			},
			recentProjects: recentProjects.items
		};
		
		console.log('=== DASHBOARD LOAD SUCCESS ===');
		console.log('Final metrics:', JSON.stringify(result.metrics, null, 2));
		console.log('Projects by status counts:', {
			draft: result.metrics.projectsByStatus.draft.length,
			planned: result.metrics.projectsByStatus.planned.length,
			in_progress: result.metrics.projectsByStatus.in_progress.length,
			completed: result.metrics.projectsByStatus.completed.length,
			cancelled: result.metrics.projectsByStatus.cancelled.length
		});
		
		return result;
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			metrics: {
				projects: { total: 0, draft: 0, planned: 0, active: 0, completed: 0, cancelled: 0 },
				departments: { total: 0, active: 0, inactive: 0 },
				expenses: { total: 0, totalAmount: 0, approvedAmount: 0, draft: 0, submitted: 0, approved: 0, paid: 0 },
				budget: { total: 0, forecasted: 0, actual: 0, remaining: 0 },
				managers: { total: 0 }
			},
			recentProjects: []
		};
	}
};
