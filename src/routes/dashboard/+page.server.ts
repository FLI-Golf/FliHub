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
		const [projects, departments, expenses, userProfiles, approvals, sponsors, franchiseDeals, franchiseOpportunities, franchiseLeads, franchiseTerritories, pros, campaigns, marketingGoals, vendors] = await Promise.allSettled([
			pb.collection('projects').getList(1, 1, { fields: 'id' }),
			pb.collection('departments').getList(1, 1, { fields: 'id' }),
			pb.collection('expenses').getList(1, 1, { fields: 'id' }),
			pb.collection('user_profiles').getList(1, 1, { fields: 'id' }),
			pb.collection('approvals').getList(1, 1, { fields: 'id' }),
			pb.collection('sponsors').getList(1, 1, { fields: 'id' }),
			pb.collection('franchise_deals').getList(1, 1, { fields: 'id' }),
			pb.collection('franchise_opportunities').getList(1, 1, { fields: 'id' }),
			pb.collection('franchise_leads').getList(1, 1, { fields: 'id' }),
			pb.collection('franchise_territories').getList(1, 1, { fields: 'id' }),
			pb.collection('talent').getList(1, 1, { fields: 'id' }),
			pb.collection('campaigns').getList(1, 1, { fields: 'id' }),
			pb.collection('marketing_goals').getList(1, 1, { fields: 'id' }),
			pb.collection('vendors').getList(1, 1, { fields: 'id' })
		]).then(results => results.map((r, i) => {
			const collectionName = ['projects', 'departments', 'expenses', 'user_profiles', 'approvals', 'sponsors', 'franchise_deals', 'franchise_opportunities', 'franchise_leads', 'franchise_territories', 'pros', 'campaigns', 'marketing_goals', 'vendors'][i];
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
				fields: 'amount,status,category,taskId'
			});
			totalExpenses = allExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
			approvedExpenses = allExpenses
				.filter(exp => exp.status === 'approved' || exp.status === 'paid')
				.reduce((sum, exp) => sum + (exp.amount || 0), 0);
			console.log(`✓ Total expenses: $${totalExpenses}, Approved: $${approvedExpenses}`);
		} catch (err: any) {
			console.error('✗ Failed to fetch expenses:', err.message);
		}

		// Fetch approvals by status
		console.log('Fetching approvals by status...');
		const approvalsByStatus = await Promise.allSettled([
			pb.collection('approvals').getList(1, 1, { 
				filter: 'status = "pending"',
				fields: 'id'
			}),
			pb.collection('approvals').getList(1, 1, { 
				filter: 'status = "approved"',
				fields: 'id'
			}),
			pb.collection('approvals').getList(1, 1, { 
				filter: 'status = "rejected"',
				fields: 'id'
			}),
			pb.collection('approvals').getList(1, 1, { 
				filter: 'status = "revision_requested"',
				fields: 'id'
			})
		]).then(results => results.map((r, i) => {
			const status = ['pending', 'approved', 'rejected', 'revision_requested'][i];
			if (r.status === 'fulfilled') {
				console.log(`✓ Approvals ${status}: ${r.value.totalItems}`);
				return r.value;
			}
			console.error(`✗ Failed to fetch approvals ${status}:`, r.reason?.message);
			return { totalItems: 0 };
		}));

		// Fetch sponsors data
		console.log('Fetching sponsors data...');
		let allSponsors = [];
		try {
			allSponsors = await pb.collection('sponsors').getFullList();
			console.log(`✓ Fetched ${allSponsors.length} sponsors`);
		} catch (err: any) {
			console.error('✗ Failed to fetch sponsors:', err.message);
		}

		// Fetch franchise data
		console.log('Fetching franchise data...');
		let allFranchiseLeads = [];
		let allFranchiseOpportunities = [];
		let allFranchiseDeals = [];
		let allFranchiseTerritories = [];
		try {
			[allFranchiseLeads, allFranchiseOpportunities, allFranchiseDeals, allFranchiseTerritories] = await Promise.all([
				pb.collection('franchise_leads').getFullList().catch(() => []),
				pb.collection('franchise_opportunities').getFullList().catch(() => []),
				pb.collection('franchise_deals').getFullList().catch(() => []),
				pb.collection('franchise_territories').getFullList().catch(() => [])
			]);
			console.log(`✓ Fetched franchise data: ${allFranchiseLeads.length} leads, ${allFranchiseOpportunities.length} opportunities, ${allFranchiseDeals.length} deals, ${allFranchiseTerritories.length} territories`);
		} catch (err: any) {
			console.error('✗ Failed to fetch franchise data:', err.message);
		}

		// Fetch pro players data
		console.log('Fetching pro players data...');
		let allPros = [];
		try {
			allPros = await pb.collection('talent').getFullList();
			console.log(`✓ Fetched ${allPros.length} pro players`);
		} catch (err: any) {
			console.error('✗ Failed to fetch pros:', err.message);
		}

		// Fetch campaigns and marketing data
		console.log('Fetching campaigns and marketing data...');
		let allCampaigns = [];
		let allMarketingGoals = [];
		try {
			[allCampaigns, allMarketingGoals] = await Promise.all([
				pb.collection('campaigns').getFullList().catch(() => []),
				pb.collection('marketing_goals').getFullList().catch(() => [])
			]);
			console.log(`✓ Fetched marketing data: ${allCampaigns.length} campaigns, ${allMarketingGoals.length} goals`);
		} catch (err: any) {
			console.error('✗ Failed to fetch marketing data:', err.message);
		}

		// Fetch vendors data
		console.log('Fetching vendors data...');
		let allVendors = [];
		try {
			allVendors = await pb.collection('vendors').getFullList();
			console.log(`✓ Fetched ${allVendors.length} vendors`);
		} catch (err: any) {
			console.error('✗ Failed to fetch vendors:', err.message);
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
			const projectForecasted = projectsWithBudget.reduce((sum, proj) => sum + (proj.forecastedExpenses || 0), 0);
			const projectActual = projectsWithBudget.reduce((sum, proj) => sum + (proj.actualExpenses || 0), 0);
			
			// Add approved/paid expenses to actual, and submitted/approved/paid to forecasted
			totalActual = projectActual + approvedExpenses;
			totalForecasted = projectForecasted + allExpenses
				.filter(exp => exp.status === 'submitted' || exp.status === 'approved' || exp.status === 'paid')
				.reduce((sum, exp) => sum + (exp.amount || 0), 0);
			
			console.log(`✓ Total forecasted: $${totalForecasted} (projects: $${projectForecasted}, expenses: $${totalForecasted - projectForecasted})`);
			console.log(`✓ Total actual: $${totalActual} (projects: $${projectActual}, expenses: $${approvedExpenses})`);
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

		// Fetch all tasks to link expenses to departments
		console.log('Fetching tasks to link expenses...');
		let allTasks = [];
		try {
			allTasks = await pb.collection('tasks').getFullList({
				fields: 'id,projectId'
			});
			console.log(`✓ Fetched ${allTasks.length} tasks`);
		} catch (err: any) {
			console.error('✗ Failed to fetch tasks:', err.message);
		}

		// Build task -> project -> department mapping
		const taskToDept = new Map();
		allTasks.forEach(task => {
			const project = projectsWithBudget.find(p => p.id === task.projectId);
			if (project && project.department) {
				taskToDept.set(task.id, project.department);
			}
		});

		// Map expense categories to department names
		const categoryToDepartment: Record<string, string> = {
			'Marketing': 'Marketing',
			'Advertising': 'Marketing',
			'Public relations': 'Marketing',
			'Internal Tech Budget': 'Technology',
			'Tech/App Development': 'Technology',
			'Software': 'Technology',
			'Cloud hosting': 'Technology',
			'Production Studio': 'Content & Media',
			'Video production': 'Content & Media',
			'Content creation': 'Content & Media'
		};

		// Build a map of department name to ID
		const deptNameToId = new Map<string, string>();
		allDepartments.forEach(dept => {
			deptNameToId.set(dept.name, dept.id);
		});

		// Calculate department budget allocations with phase breakdown
		console.log('Calculating department budget allocations...');
		const departmentBudgets = allDepartments.map(dept => {
			const deptProjects = projectsWithBudget.filter(p => p.department === dept.id);
			const budget = dept.department_annual_budget || 0;
			
			// Calculate actual from project expenses
			const projectActual = deptProjects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0);
			
			// Add expenses linked through tasks OR category mapping
			const deptExpenses = allExpenses.filter(e => {
				// First try task linkage
				if (e.taskId && taskToDept.has(e.taskId)) {
					return taskToDept.get(e.taskId) === dept.id;
				}
				// Fall back to category mapping
				if (e.category && categoryToDepartment[e.category]) {
					const mappedDeptName = categoryToDepartment[e.category];
					const mappedDeptId = deptNameToId.get(mappedDeptName);
					return mappedDeptId === dept.id;
				}
				return false;
			});
			
			const expenseActual = deptExpenses
				.filter(e => e.status === 'approved' || e.status === 'paid')
				.reduce((sum, e) => sum + (e.amount || 0), 0);
			
			const expenseForecasted = deptExpenses
				.filter(e => e.status === 'submitted' || e.status === 'approved' || e.status === 'paid')
				.reduce((sum, e) => sum + (e.amount || 0), 0);
			
			const actual = projectActual + expenseActual;
			const forecasted = deptProjects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecasted;
			
			// Calculate by phase (distribute expenses evenly across phases for now)
			const phase1Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase1');
			const phase2Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase2');
			const phase3Projects = deptProjects.filter(p => getProjectPhase(p) === 'phase3');
			
			const expenseActualPerPhase = expenseActual / 3;
			const expenseForecastedPerPhase = expenseForecasted / 3;
			
			return {
				id: dept.id,
				name: dept.name,
				budget,
				actual,
				forecasted,
				projectCount: deptProjects.length,
				phases: {
					phase1: {
						actual: phase1Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
						forecasted: phase1Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
						projectCount: phase1Projects.length
					},
					phase2: {
						actual: phase2Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
						forecasted: phase2Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
						projectCount: phase2Projects.length
					},
					phase3: {
						actual: phase3Projects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
						forecasted: phase3Projects.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
						projectCount: phase3Projects.length
					}
				}
			};
		}).filter(d => d.budget > 0 || d.actual > 0);
		console.log(`✓ Department budgets calculated: ${departmentBudgets.length} departments with budgets`);

		// Calculate phase-specific metrics
		// For now, distribute expenses evenly across phases since expenses don't have phase info
		const expenseActualPerPhase = approvedExpenses / 3;
		const expenseForecastedPerPhase = allExpenses
			.filter(exp => exp.status === 'submitted' || exp.status === 'approved' || exp.status === 'paid')
			.reduce((sum, exp) => sum + (exp.amount || 0), 0) / 3;
		
		const phaseMetrics = {
			phase1: {
				budget: totalBudget / 3, // Distribute budget evenly across phases
				actual: projectsByPhase.phase1.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
				forecasted: projectsByPhase.phase1.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
				projectCount: projectsByPhase.phase1.length
			},
			phase2: {
				budget: totalBudget / 3,
				actual: projectsByPhase.phase2.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
				forecasted: projectsByPhase.phase2.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
				projectCount: projectsByPhase.phase2.length
			},
			phase3: {
				budget: totalBudget / 3,
				actual: projectsByPhase.phase3.reduce((sum, p) => sum + (p.actualExpenses || 0), 0) + expenseActualPerPhase,
				forecasted: projectsByPhase.phase3.reduce((sum, p) => sum + (p.forecastedExpenses || 0), 0) + expenseForecastedPerPhase,
				projectCount: projectsByPhase.phase3.length
			}
		};

		// Calculate sponsor metrics
		const sponsorMetrics = {
			total: allSponsors.length,
			byTier: {
				tier_1: allSponsors.filter(s => s.tier === 'tier_1').length,
				tier_2: allSponsors.filter(s => s.tier === 'tier_2').length,
				tier_3: allSponsors.filter(s => s.tier === 'tier_3').length,
				tier_4: allSponsors.filter(s => s.tier === 'tier_4').length
			},
			byStatus: {
				prospect: allSponsors.filter(s => s.status === 'prospect').length,
				negotiating: allSponsors.filter(s => s.status === 'negotiating').length,
				active: allSponsors.filter(s => s.status === 'active').length,
				renewed: allSponsors.filter(s => s.status === 'renewed').length,
				expired: allSponsors.filter(s => s.status === 'expired').length,
				converted_to_franchise: allSponsors.filter(s => s.status === 'converted_to_franchise').length,
				inactive: allSponsors.filter(s => s.status === 'inactive').length
			},
			byType: {
				casino: allSponsors.filter(s => s.type === 'casino').length,
				resort: allSponsors.filter(s => s.type === 'resort').length,
				hospitality: allSponsors.filter(s => s.type === 'hospitality').length,
				entertainment: allSponsors.filter(s => s.type === 'entertainment').length,
				corporate: allSponsors.filter(s => s.type === 'corporate').length,
				other: allSponsors.filter(s => s.type === 'other').length
			},
			totalCommitted: allSponsors.reduce((sum, s) => sum + (s.annualCommitment || 0), 0),
			totalPaid: allSponsors.reduce((sum, s) => sum + (s.totalPaid || 0), 0)
		};

		// Calculate franchise metrics
		const franchiseMetrics = {
			pipeline: {
				leads: allFranchiseLeads.length,
				opportunities: allFranchiseOpportunities.length,
				deals: allFranchiseDeals.length
			},
			deals: {
				total: allFranchiseDeals.length,
				byStatus: {
					pending_signature: allFranchiseDeals.filter(d => d.status === 'pending_signature').length,
					signed: allFranchiseDeals.filter(d => d.status === 'signed').length,
					payment_pending: allFranchiseDeals.filter(d => d.status === 'payment_pending').length,
					payment_received: allFranchiseDeals.filter(d => d.status === 'payment_received').length,
					onboarding: allFranchiseDeals.filter(d => d.status === 'onboarding').length,
					active: allFranchiseDeals.filter(d => d.status === 'active').length,
					cancelled: allFranchiseDeals.filter(d => d.status === 'cancelled').length
				},
				totalValue: allFranchiseDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0),
				totalReceived: allFranchiseDeals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0),
				averageDealValue: allFranchiseDeals.length > 0 
					? allFranchiseDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0) / allFranchiseDeals.length 
					: 0
			},
			territories: {
				total: allFranchiseTerritories.length,
				available: allFranchiseTerritories.filter(t => t.status === 'available').length,
				reserved: allFranchiseTerritories.filter(t => t.status === 'reserved').length,
				sold: allFranchiseTerritories.filter(t => t.status === 'sold').length
			},
			conversionRates: {
				leadToOpportunity: allFranchiseLeads.length > 0 ? allFranchiseOpportunities.length / allFranchiseLeads.length : 0,
				opportunityToDeal: allFranchiseOpportunities.length > 0 ? allFranchiseDeals.length / allFranchiseOpportunities.length : 0,
				leadToDeal: allFranchiseLeads.length > 0 ? allFranchiseDeals.length / allFranchiseLeads.length : 0
			}
		};

		// Calculate pro player metrics
		const proMetrics = {
			total: allPros.length,
			active: allPros.filter(p => p.status === 'active').length,
			inactive: allPros.filter(p => p.status === 'inactive').length,
			retired: allPros.filter(p => p.status === 'retired').length,
			byGender: {
				male: allPros.filter(p => p.gender === 'male').length,
				female: allPros.filter(p => p.gender === 'female').length,
				other: allPros.filter(p => p.gender === 'other').length
			},
			withContracts: allPros.filter(p => p.signedContract).length,
			topRanked: allPros.filter(p => p.worldRanking && p.worldRanking <= 100).length,
			byCountry: allPros.reduce((acc, p) => {
				if (p.country) {
					acc[p.country] = (acc[p.country] || 0) + 1;
				}
				return acc;
			}, {} as Record<string, number>)
		};

		// Calculate marketing metrics
		const marketingMetrics = {
			campaigns: {
				total: allCampaigns.length,
				active: allCampaigns.filter(c => c.status === 'Active').length,
				byStatus: {
					planning: allCampaigns.filter(c => c.status === 'Planning').length,
					active: allCampaigns.filter(c => c.status === 'Active').length,
					paused: allCampaigns.filter(c => c.status === 'Paused').length,
					completed: allCampaigns.filter(c => c.status === 'Completed').length,
					cancelled: allCampaigns.filter(c => c.status === 'Cancelled').length
				},
				byType: allCampaigns.reduce((acc, c) => {
					if (c.type) {
						acc[c.type] = (acc[c.type] || 0) + 1;
					}
					return acc;
				}, {} as Record<string, number>),
				totalBudget: allCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
				totalSpend: allCampaigns.reduce((sum, c) => sum + (c.actualSpend || 0), 0),
				averageBudget: allCampaigns.length > 0 
					? allCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0) / allCampaigns.length 
					: 0
			},
			goals: {
				total: allMarketingGoals.length,
				completed: allMarketingGoals.filter(g => g.status === 'Completed').length,
				inProgress: allMarketingGoals.filter(g => g.status === 'In Progress').length,
				notStarted: allMarketingGoals.filter(g => g.status === 'Not Started').length,
				completionRate: allMarketingGoals.length > 0 
					? (allMarketingGoals.filter(g => g.status === 'Completed').length / allMarketingGoals.length) * 100 
					: 0
			}
		};

		// Calculate vendor metrics
		const vendorSpending = allVendors.map(vendor => {
			const vendorExpenses = allExpenses.filter(e => e.vendorId === vendor.id);
			return {
				id: vendor.id,
				name: vendor.name,
				totalSpend: vendorExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
				expenseCount: vendorExpenses.length,
				status: vendor.status,
				category: vendor.category
			};
		}).sort((a, b) => b.totalSpend - a.totalSpend);

		const vendorMetrics = {
			total: allVendors.length,
			active: allVendors.filter(v => v.status === 'active').length,
			inactive: allVendors.filter(v => v.status === 'inactive').length,
			totalSpend: vendorSpending.reduce((sum, v) => sum + v.totalSpend, 0),
			topVendors: vendorSpending.slice(0, 10),
			byCategory: allVendors.reduce((acc, v) => {
				if (v.category) {
					acc[v.category] = (acc[v.category] || 0) + 1;
				}
				return acc;
			}, {} as Record<string, number>),
			averageSpend: vendorSpending.length > 0 
				? vendorSpending.reduce((sum, v) => sum + v.totalSpend, 0) / vendorSpending.length 
				: 0
		};

		console.log('✓ Sponsor metrics calculated:', sponsorMetrics);
		console.log('✓ Franchise metrics calculated:', franchiseMetrics);
		console.log('✓ Pro player metrics calculated:', proMetrics);
		console.log('✓ Marketing metrics calculated:', marketingMetrics);
		console.log('✓ Vendor metrics calculated:', vendorMetrics);

		const result = {
			metrics: {
				sponsors: sponsorMetrics,
				franchises: franchiseMetrics,
				pros: proMetrics,
				marketing: marketingMetrics,
				vendors: vendorMetrics,
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
				approvals: {
					total: approvals.totalItems,
					pending: approvalsByStatus[0].totalItems,
					approved: approvalsByStatus[1].totalItems,
					rejected: approvalsByStatus[2].totalItems,
					revision_requested: approvalsByStatus[3].totalItems
				},
				budget: {
					total: totalBudget,
					forecasted: totalForecasted,
					actual: totalActual,
					remaining: totalBudget - totalActual
				},
				people: {
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
				people: { total: 0 }
			},
			recentProjects: []
		};
	}
};
