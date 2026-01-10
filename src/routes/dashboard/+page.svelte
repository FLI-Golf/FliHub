<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import BudgetDonutChart from '$lib/components/charts/BudgetDonutChart.svelte';
	import ExpenseBarChart from '$lib/components/charts/ExpenseBarChart.svelte';
	import ProjectStatusChart from '$lib/components/charts/ProjectStatusChart.svelte';
	import DepartmentBudgetChart from '$lib/components/charts/DepartmentBudgetChart.svelte';
	import BurnRateChart from '$lib/components/charts/BurnRateChart.svelte';
	import FinancialHealthCard from '$lib/components/charts/FinancialHealthCard.svelte';
	import PhaseFilter from '$lib/components/filters/PhaseFilter.svelte';
	import DepartmentBreakdownTable from '$lib/components/charts/DepartmentBreakdownTable.svelte';
	import RevenueOverviewCard from '$lib/components/charts/revenue/RevenueOverviewCard.svelte';
	import SponsorTierChart from '$lib/components/charts/revenue/SponsorTierChart.svelte';
	import FranchisePipelineChart from '$lib/components/charts/revenue/FranchisePipelineChart.svelte';
	import TerritoryStatusCard from '$lib/components/charts/revenue/TerritoryStatusCard.svelte';
	import PlayerRosterCard from '$lib/components/charts/players/PlayerRosterCard.svelte';
	import PlayerStatusChart from '$lib/components/charts/players/PlayerStatusChart.svelte';
	import PlayerGeographicChart from '$lib/components/charts/players/PlayerGeographicChart.svelte';
	import CampaignPerformanceCard from '$lib/components/charts/marketing/CampaignPerformanceCard.svelte';
	import MarketingGoalsChart from '$lib/components/charts/marketing/MarketingGoalsChart.svelte';
	import CampaignTypeChart from '$lib/components/charts/marketing/CampaignTypeChart.svelte';
	import VendorSpendingCard from '$lib/components/charts/vendors/VendorSpendingCard.svelte';
	import TopVendorsChart from '$lib/components/charts/vendors/TopVendorsChart.svelte';
	import VendorCategoryChart from '$lib/components/charts/vendors/VendorCategoryChart.svelte';
	import { 
		Users, 
		ListTodo, 
		Store, 
		FolderKanban, 
		Receipt, 
		Shield, 
		DollarSign,
		TrendingUp,
		CheckCircle2,
		Clock,
		AlertCircle,
		FileText,
		ClipboardList,
		PlayCircle,
		ArrowRight,
		Building2,
		XCircle,
		Calendar,
		UserCircle,
		Database,
		RotateCcw,
		CheckSquare,
		UserCheck,
		Target,
		Package
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let role = $derived(data.userProfile?.role || 'leader');
	let isAdmin = $derived(role === 'admin');
	let userName = $derived(data.userProfile ? `${data.userProfile.firstName} ${data.userProfile.lastName}` : data.user?.email);
	
	let projectStatusTab = $state<string>('in_progress');
	let departmentStatusTab = $state<string>('active');
	
	// Main dashboard tab state
	let activeTab = $state<string>('overview');
	
	let metrics = $derived(data.metrics || {
		projects: { total: 0, draft: 0, planned: 0, active: 0, completed: 0, cancelled: 0 },
		projectsByStatus: { draft: [], planned: [], in_progress: [], completed: [], cancelled: [] },
		departments: { total: 0, active: 0, inactive: 0 },
		departmentsByStatus: { active: [], inactive: [] },
		departmentBudgets: [],
		expenses: { total: 0, totalAmount: 0, approvedAmount: 0, draft: 0, submitted: 0, approved: 0, paid: 0 },
		approvals: { total: 0, pending: 0, approved: 0, rejected: 0, revision_requested: 0 },
		budget: { total: 0, forecasted: 0, actual: 0, remaining: 0 },
		people: { total: 0 },
		phases: {
			phase1: { budget: 0, actual: 0, forecasted: 0, projectCount: 0 },
			phase2: { budget: 0, actual: 0, forecasted: 0, projectCount: 0 },
			phase3: { budget: 0, actual: 0, forecasted: 0, projectCount: 0 }
		}
	});
	
	// Phase filter state
	let selectedPhase = $state<string>('all');
	
	// Chart type toggles
	let budgetChartType = $state<'donut' | 'bar'>('donut');
	let departmentChartType = $state<'bar' | 'table'>('bar');
	
	// Calculate phase-filtered metrics
	let phaseFilteredBudget = $derived.by(() => {
		if (selectedPhase === 'all') {
			return {
				total: metrics.budget.total,
				actual: metrics.budget.actual,
				forecasted: metrics.budget.forecasted
			};
		}
		const phase = metrics.phases[selectedPhase as keyof typeof metrics.phases];
		return {
			total: phase?.budget || 0,
			actual: phase?.actual || 0,
			forecasted: phase?.forecasted || 0
		};
	});
	
	// Filter departments by phase
	let phaseFilteredDepartments = $derived.by(() => {
		if (selectedPhase === 'all') {
			return metrics.departmentBudgets;
		}
		return metrics.departmentBudgets.map(dept => {
			const phase = dept.phases?.[selectedPhase as keyof typeof dept.phases];
			return {
				...dept,
				actual: phase?.actual || 0,
				forecasted: phase?.forecasted || 0,
				projectCount: phase?.projectCount || 0
			};
		}).filter(d => d.actual > 0 || d.forecasted > 0 || d.projectCount > 0);
	});
	
	// Calculate pending expenses (draft + submitted)
	let pendingExpenses = $derived(
		(metrics.expenses.draft + metrics.expenses.submitted) * 
		(metrics.expenses.totalAmount / Math.max(metrics.expenses.total, 1))
	);
	let recentProjects = $derived(data.recentProjects || []);
	
	// Get projects for selected tab
	let filteredProjects = $derived(metrics.projectsByStatus?.[projectStatusTab] || []);
	
	// Get departments for selected tab
	let filteredDepartments = $derived(metrics.departmentsByStatus?.[departmentStatusTab] || []);
	
	// Debug: Log received data
	$effect(() => {
		console.log('=== DASHBOARD CLIENT DATA ===');
		console.log('Full data object:', data);
		console.log('Metrics object:', metrics);
		console.log('Projects:', metrics?.projects);
		console.log('Projects by status:', metrics?.projectsByStatus);
		console.log('Current tab:', projectStatusTab);
		console.log('Filtered projects:', filteredProjects);
		console.log('Departments:', metrics?.departments);
		console.log('Expenses:', metrics?.expenses);
		console.log('Budget:', metrics?.budget);
		console.log('Managers:', metrics?.managers);
	});
	
	let projectStatusFilter = $state<string>('all');
	let showProjectsModal = $state(false);
	let showDepartmentsModal = $state(false);
	let showExpensesModal = $state(false);
	let showTeamModal = $state(false);
	let seedingData = $state(false);
	let restoringData = $state(false);
	let seedingApprovals = $state(false);
	let removingApprovals = $state(false);
	let testDataMessage = $state<string>('');
	
	// Filter recent projects by status
	let filteredRecentProjects = $derived(projectStatusFilter === 'all' 
		? recentProjects 
		: recentProjects.filter(p => p.status === projectStatusFilter));
	
	// Build project status tabs
	let projectStatusTabs = $derived([
		{ value: 'all', label: 'All' },
		{ value: 'draft', label: 'Draft', icon: FileText },
		{ value: 'planned', label: 'Planned', icon: ClipboardList },
		{ value: 'in_progress', label: 'In Progress', icon: PlayCircle },
		{ value: 'completed', label: 'Completed', icon: CheckCircle2 }
	]);
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function seedTestData() {
		seedingData = true;
		testDataMessage = '⏳ Creating backup and seeding test data...';

		try {
			const response = await fetch('/api/test-data/seed', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				testDataMessage = '✅ Test data seeded successfully! Refreshing page...';
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} else {
				testDataMessage = `❌ Error: ${result.error || 'Failed to seed data'}`;
			}
		} catch (error: any) {
			testDataMessage = `❌ Error: ${error.message}`;
		} finally {
			seedingData = false;
		}
	}

	async function restoreTestData() {
		restoringData = true;
		testDataMessage = '⏳ Removing test data...';

		try {
			const response = await fetch('/api/test-data/restore', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				testDataMessage = `✅ ${result.message} Refreshing page...`;
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} else {
				testDataMessage = `❌ Error: ${result.error || 'Failed to remove test data'}`;
			}
		} catch (error: any) {
			testDataMessage = `❌ Error: ${error.message}`;
		} finally {
			restoringData = false;
		}
	}

	async function seedApprovals() {
		seedingApprovals = true;
		testDataMessage = '⏳ Creating approval workflow test data...';

		try {
			const response = await fetch('/api/test-data/seed-approvals', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				testDataMessage = '✅ Approval workflow test data seeded successfully! Refreshing page...';
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} else {
				testDataMessage = `❌ Error: ${result.error || 'Failed to seed approvals'}`;
			}
		} catch (error: any) {
			testDataMessage = `❌ Error: ${error.message}`;
		} finally {
			seedingApprovals = false;
		}
	}

	async function removeApprovals() {
		removingApprovals = true;
		testDataMessage = '⏳ Removing approval test data...';

		try {
			const response = await fetch('/api/test-data/remove-approvals', {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				testDataMessage = `✅ ${result.message} Refreshing page...`;
				setTimeout(() => {
					window.location.reload();
				}, 1500);
			} else {
				testDataMessage = `❌ Error: ${result.error || 'Failed to remove approvals'}`;
			}
		} catch (error: any) {
			testDataMessage = `❌ Error: ${error.message}`;
		} finally {
			removingApprovals = false;
		}
	}
	
	function getCountdown(endDate: string): { text: string; color: string; isOverdue: boolean } {
		if (!endDate) return { text: 'No end date', color: 'text-slate-400', isOverdue: false };
		
		const now = new Date();
		const due = new Date(endDate);
		const diffTime = due.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 0) {
			return { 
				text: `${Math.abs(diffDays)} days overdue`, 
				color: 'text-red-400', 
				isOverdue: true 
			};
		} else if (diffDays === 0) {
			return { text: 'Due today', color: 'text-orange-400', isOverdue: false };
		} else if (diffDays === 1) {
			return { text: 'Due tomorrow', color: 'text-yellow-400', isOverdue: false };
		} else if (diffDays <= 7) {
			return { text: `${diffDays} days left`, color: 'text-yellow-400', isOverdue: false };
		} else if (diffDays <= 30) {
			return { text: `${diffDays} days left`, color: 'text-green-400', isOverdue: false };
		} else {
			const weeks = Math.floor(diffDays / 7);
			return { text: `${weeks} weeks left`, color: 'text-green-400', isOverdue: false };
		}
	}
</script>

<svelte:head>
	<title>Dashboard - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-4xl font-bold mb-2 tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground text-base">Welcome to FliHub, {userName}</p>
		{#if isAdmin}
			<div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
				<Shield class="size-4" />
				Administrator
			</div>
		{/if}
	</div>

	{#if data.userDepartment}
		<Card class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800">
			<div class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold mb-1">Your Department Dashboard</h3>
						<p class="text-muted-foreground">{data.userDepartment.name}</p>
						<p class="text-xs text-muted-foreground mt-1">ID: {data.userDepartment.id}</p>
					</div>
					<Button href="/dashboard/department/{data.userDepartment.id}">
						View Department Dashboard
					</Button>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Key Metrics -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<button onclick={() => showProjectsModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Total Projects"
					value={metrics.projects.total}
					subtitle="{metrics.projects.active} in progress, {metrics.projects.completed} completed"
					icon={FolderKanban}
					class="hover:shadow-xl bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showDepartmentsModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Departments"
					value={metrics.departments.total}
					subtitle="{metrics.departments.active} active departments"
					icon={Building2}
					class="hover:shadow-xl bg-gradient-to-br from-purple-950 to-purple-900 border-purple-800 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showExpensesModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Total Expenses"
					value={formatCurrency(metrics.expenses.totalAmount)}
					subtitle="{metrics.expenses.total} transactions"
					icon={Receipt}
					class="hover:shadow-xl bg-gradient-to-br from-amber-950 to-amber-900 border-amber-800 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showTeamModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Team Members"
					value={metrics.people.total}
					subtitle="Active team members"
					icon={Users}
					class="hover:shadow-xl bg-gradient-to-br from-green-950 to-green-900 border-green-800 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
		</div>
	</div>

	<!-- Dashboard Tabs -->
	<div class="flex flex-col gap-2 mb-6">
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<FolderKanban class="size-4" />
			<span>Dashboard View</span>
		</div>
		<div class="flex flex-wrap gap-1 border-b border-border">
			<button
				onclick={() => activeTab = 'overview'}
				class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
					activeTab === 'overview'
						? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
				}"
				style={activeTab === 'overview' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
			>
				<span class="font-semibold">Overview</span>
				{#if activeTab === 'overview'}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
			{#if isAdmin && metrics.sponsors && metrics.franchises}
				<button
					onclick={() => activeTab = 'revenue'}
					class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
						activeTab === 'revenue'
							? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
					}"
					style={activeTab === 'revenue' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
				>
					<span class="font-semibold">Revenue & Sales</span>
					{#if activeTab === 'revenue'}
						<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
					{/if}
				</button>
			{/if}
			<button
				onclick={() => activeTab = 'projects'}
				class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
					activeTab === 'projects'
						? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
				}"
				style={activeTab === 'projects' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
			>
				<span class="font-semibold">Projects</span>
				{#if activeTab === 'projects'}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
			<button
				onclick={() => activeTab = 'financial'}
				class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
					activeTab === 'financial'
						? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
				}"
				style={activeTab === 'financial' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
			>
				<span class="font-semibold">Financial</span>
				{#if activeTab === 'financial'}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
			<button
				onclick={() => activeTab = 'expenses'}
				class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
					activeTab === 'expenses'
						? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
				}"
				style={activeTab === 'expenses' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
			>
				<span class="font-semibold">Expenses & Approvals</span>
				{#if activeTab === 'expenses'}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
			{#if metrics.pros && metrics.pros.total > 0}
				<button
					onclick={() => activeTab = 'pros'}
					class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
						activeTab === 'pros'
							? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
					}"
					style={activeTab === 'pros' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
				>
					<span class="font-semibold">Pros</span>
					{#if activeTab === 'pros'}
						<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
					{/if}
				</button>
			{/if}
			{#if metrics.marketing && metrics.marketing.campaigns.total > 0}
				<button
					onclick={() => activeTab = 'marketing'}
					class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
						activeTab === 'marketing'
							? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
					}"
					style={activeTab === 'marketing' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
				>
					<span class="font-semibold">Marketing</span>
					{#if activeTab === 'marketing'}
						<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
					{/if}
				</button>
			{/if}
			{#if metrics.vendors && metrics.vendors.total > 0}
				<button
					onclick={() => activeTab = 'vendors'}
					class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
						activeTab === 'vendors'
							? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
							: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
					}"
					style={activeTab === 'vendors' ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
				>
					<span class="font-semibold">Vendors</span>
					{#if activeTab === 'vendors'}
						<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'overview'}
		<!-- Overview Tab Content -->
		<div class="space-y-6">
			<!-- Phase Filter -->
			<div>
				<PhaseFilter 
					activePhase={selectedPhase}
					onPhaseChange={(phase) => selectedPhase = phase}
				/>
			</div>

			<!-- Investor Overview -->
			<div>
				<h2 class="text-2xl font-bold mb-4">
					Financial Overview
					{#if selectedPhase !== 'all'}
						<span class="text-lg font-normal text-muted-foreground">
							- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</span>
					{/if}
				</h2>
				<FinancialHealthCard 
					totalBudget={phaseFilteredBudget.total}
					actualSpent={phaseFilteredBudget.actual}
					forecasted={phaseFilteredBudget.forecasted}
				/>
			</div>

			<!-- Department Budget Allocation Chart -->
			{#if phaseFilteredDepartments.length > 0}
				<div>
					<h2 class="text-2xl font-bold mb-4">
						Budget Allocation by Department
						{#if selectedPhase !== 'all'}
							<span class="text-lg font-normal text-muted-foreground">
								- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
							</span>
						{/if}
					</h2>
					<Card class="p-6">
						<div class="flex items-center justify-between mb-6">
							<div>
								<h3 class="text-lg font-semibold">Where Your Investment Goes</h3>
								<p class="text-sm text-muted-foreground mt-1">
									{selectedPhase === 'all' 
										? 'Budget allocation and spending across all departments' 
										: `Spending breakdown for ${selectedPhase === 'phase1' ? 'Phase 1 (Jan-Sep 2026)' : selectedPhase === 'phase2' ? 'Phase 2 (Oct 2026-Mar 2027)' : 'Phase 3 (Apr-Dec 2027)'}`
									}
								</p>
							</div>
							<Building2 class="size-5 text-muted-foreground" />
						</div>
						<DepartmentBudgetChart departments={phaseFilteredDepartments} />
					</Card>
				</div>
			{/if}

			<!-- Department Breakdown Table -->
			<div>
				<h2 class="text-2xl font-bold mb-4">
					Department Performance
					{#if selectedPhase !== 'all'}
						<span class="text-lg font-normal text-muted-foreground">
							- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</span>
					{/if}
				</h2>
				<DepartmentBreakdownTable departments={phaseFilteredDepartments} />
			</div>
		</div>
	{/if}

	{#if activeTab === 'revenue'}
		<!-- Revenue Tab Content -->
		<div class="space-y-6">
			<!-- Revenue Dashboard -->
	{#if isAdmin && metrics.sponsors && metrics.franchises}
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">Revenue & Sales</h2>
				<Button href="/dashboard/franchise-sales" variant="outline">
					View Detailed Franchise Dashboard
					<ArrowRight class="size-4 ml-2" />
				</Button>
			</div>
			
			<!-- Top Row: Revenue Overview, Sponsor Pipeline, Franchise Pipeline -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
				<!-- Revenue Overview Card -->
				<RevenueOverviewCard 
					sponsorCommitted={metrics.sponsors.totalCommitted}
					sponsorPaid={metrics.sponsors.totalPaid}
					dealValue={metrics.franchises.deals.totalValue}
					dealReceived={metrics.franchises.deals.totalReceived}
				/>
				
				<!-- Sponsor Status Card -->
				<Card class="p-6 bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-white">Sponsor Pipeline</h3>
						<Store class="size-5 text-blue-400" />
					</div>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-blue-800">
							<span class="text-sm font-medium text-white">Prospects</span>
							<span class="text-lg font-bold text-white">{metrics.sponsors.byStatus.prospect}</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-blue-800">
							<span class="text-sm font-medium text-white">Negotiating</span>
							<span class="text-lg font-bold text-yellow-300">{metrics.sponsors.byStatus.negotiating}</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-blue-800">
							<span class="text-sm font-medium text-white">Active</span>
							<span class="text-lg font-bold text-green-400">{metrics.sponsors.byStatus.active}</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-blue-800">
							<span class="text-sm font-medium text-white">Renewed</span>
							<span class="text-lg font-bold text-emerald-400">{metrics.sponsors.byStatus.renewed}</span>
						</div>
					</div>
					<div class="mt-4 pt-4 border-t border-blue-800">
						<Button href="/dashboard/sponsors" class="w-full" variant="outline">
							View All Sponsors
							<ArrowRight class="size-4 ml-2" />
						</Button>
					</div>
				</Card>
				
				<!-- Franchise Pipeline Card -->
				<Card class="p-6">
					<h3 class="text-lg font-semibold mb-4">Franchise Sales Pipeline</h3>
					<FranchisePipelineChart 
						leads={metrics.franchises.pipeline.leads}
						opportunities={metrics.franchises.pipeline.opportunities}
						deals={metrics.franchises.pipeline.deals}
					/>
					<div class="mt-4 pt-4 border-t">
						<div class="grid grid-cols-3 gap-2 text-center text-xs">
							<div>
								<p class="text-muted-foreground">Leads</p>
								<p class="font-bold text-lg">{metrics.franchises.pipeline.leads}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Opportunities</p>
								<p class="font-bold text-lg">{metrics.franchises.pipeline.opportunities}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Deals</p>
								<p class="font-bold text-lg">{metrics.franchises.pipeline.deals}</p>
							</div>
						</div>
					</div>
				</Card>
			</div>
			
			<!-- Bottom Row: Sponsor Tiers, Deal Status, Territory Coverage -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<!-- Sponsor Tier Distribution -->
				<Card class="p-6">
					<h3 class="text-lg font-semibold mb-4">Sponsors by Tier</h3>
					<SponsorTierChart 
						tier_1={metrics.sponsors.byTier.tier_1}
						tier_2={metrics.sponsors.byTier.tier_2}
						tier_3={metrics.sponsors.byTier.tier_3}
						tier_4={metrics.sponsors.byTier.tier_4}
					/>
				</Card>
				
				<!-- Franchise Deal Status -->
				<Card class="p-6">
					<h3 class="text-lg font-semibold mb-4">Franchise Deal Status</h3>
					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-sm">Pending Signature</span>
							<span class="text-lg font-bold text-yellow-600">{metrics.franchises.deals.byStatus.pending_signature}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm">Signed</span>
							<span class="text-lg font-bold text-blue-600">{metrics.franchises.deals.byStatus.signed}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm">Payment Received</span>
							<span class="text-lg font-bold text-green-600">{metrics.franchises.deals.byStatus.payment_received}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm">Active</span>
							<span class="text-lg font-bold text-emerald-600">{metrics.franchises.deals.byStatus.active}</span>
						</div>
					</div>
					<div class="mt-6 pt-4 border-t">
						<div class="flex justify-between items-center">
							<span class="text-sm font-semibold">Average Deal Value</span>
							<span class="text-xl font-bold">{formatCurrency(metrics.franchises.deals.averageDealValue)}</span>
						</div>
					</div>
				</Card>
				
				<!-- Territory Coverage -->
				<TerritoryStatusCard 
					total={metrics.franchises.territories.total}
					available={metrics.franchises.territories.available}
					reserved={metrics.franchises.territories.reserved}
					sold={metrics.franchises.territories.sold}
				/>
			</div>
		</div>
	{/if}
		</div>
	{/if}

	{#if activeTab === 'projects'}
		<!-- Projects Tab Content -->
		<div class="space-y-6">
			<!-- Project & Expense Analytics -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Project & Expense Analytics</h2>
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<Card class="p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold">Project Status</h3>
							<FolderKanban class="size-5 text-muted-foreground" />
						</div>
						<ProjectStatusChart 
							draft={metrics.projects.draft}
							planned={metrics.projects.planned}
							active={metrics.projects.active}
							completed={metrics.projects.completed}
							cancelled={metrics.projects.cancelled}
						/>
					</Card>

					<Card class="p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold">Budget Utilization</h3>
							<div class="flex items-center gap-2">
								<Button 
									size="sm" 
									variant={budgetChartType === 'donut' ? 'default' : 'outline'}
									onclick={() => budgetChartType = 'donut'}
									class="h-8 px-2"
								>
									Donut
								</Button>
								<Button 
									size="sm" 
									variant={budgetChartType === 'bar' ? 'default' : 'outline'}
									onclick={() => budgetChartType = 'bar'}
									class="h-8 px-2"
								>
									Bar
								</Button>
							</div>
						</div>
						{#if budgetChartType === 'donut'}
							<BudgetDonutChart 
								actual={metrics.budget.actual}
								remaining={metrics.budget.remaining}
								total={metrics.budget.total}
							/>
						{:else}
							<BurnRateChart 
								totalBudget={metrics.budget.total}
								actualSpent={metrics.budget.actual}
								forecasted={metrics.budget.forecasted}
							/>
						{/if}
						<div class="mt-6 pt-4 border-t space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Total Budget</span>
								<span class="font-semibold">{formatCurrency(metrics.budget.total)}</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Forecasted</span>
								<span class="font-semibold">{formatCurrency(metrics.budget.forecasted)}</span>
							</div>
						</div>
					</Card>

					<Card class="p-6">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold">Expense Status</h3>
							<Receipt class="size-5 text-muted-foreground" />
						</div>
						<ExpenseBarChart 
							draft={metrics.expenses.draft}
							submitted={metrics.expenses.submitted}
							approved={metrics.expenses.approved}
							paid={metrics.expenses.paid}
						/>
					</Card>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Projects (Always Visible) -->
	{#if recentProjects.length > 0}
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">Recent Projects</h2>
				<Button href="/dashboard/projects" variant="outline" size="sm">View All</Button>
			</div>
			
			<!-- Status Filter Tabs -->
			<div class="mb-4">
				<VisualTabs
					tabs={projectStatusTabs}
					activeTab={projectStatusFilter}
					onTabChange={(v) => projectStatusFilter = v}
					variant="pill"
				/>
			</div>
			
			<Card class="overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-slate-50 dark:bg-slate-900 border-b">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Project
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Type
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Budget
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Created
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
							{#if filteredRecentProjects.length === 0}
								<tr>
									<td colspan="5" class="px-6 py-8 text-center text-foreground">
										No projects match the selected filter.
									</td>
								</tr>
							{:else}
								{#each filteredRecentProjects as project}
									<tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
										<td class="px-6 py-4">
											<div class="font-medium">{project.name}</div>
											{#if project.description}
												<div class="text-sm text-muted-foreground truncate max-w-xs">
													{project.description}
												</div>
											{/if}
										</td>
										<td class="px-6 py-4 text-sm capitalize">
											{project.type.replace('_', ' ')}
										</td>
										<td class="px-6 py-4">
											<StatusBadge status={project.status} />
										</td>
										<td class="px-6 py-4 text-sm font-medium">
											{project.project_budget ? formatCurrency(project.project_budget) : '-'}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatDate(project.created)}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	{/if}

	{#if activeTab === 'financial'}
		<!-- Financial Tab Content -->
		<div class="space-y-6">
			<!-- Phase Filter -->
			<div>
				<PhaseFilter 
					activePhase={selectedPhase}
					onPhaseChange={(phase) => selectedPhase = phase}
				/>
			</div>

			<!-- Financial Overview -->
			<div>
				<h2 class="text-2xl font-bold mb-4">
					Financial Overview
					{#if selectedPhase !== 'all'}
						<span class="text-lg font-normal text-muted-foreground">
							- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</span>
					{/if}
				</h2>
				<FinancialHealthCard 
					totalBudget={phaseFilteredBudget.total}
					actualSpent={phaseFilteredBudget.actual}
					forecasted={phaseFilteredBudget.forecasted}
				/>
			</div>

			<!-- Department Budget Allocation Chart -->
			{#if phaseFilteredDepartments.length > 0}
				<div>
					<h2 class="text-2xl font-bold mb-4">
						Budget Allocation by Department
						{#if selectedPhase !== 'all'}
							<span class="text-lg font-normal text-muted-foreground">
								- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
							</span>
						{/if}
					</h2>
					<Card class="p-6">
						<div class="flex items-center justify-between mb-6">
							<div>
								<h3 class="text-lg font-semibold">Where Your Investment Goes</h3>
								<p class="text-sm text-muted-foreground mt-1">
									{selectedPhase === 'all' 
										? 'Budget allocation and spending across all departments' 
										: `Spending breakdown for ${selectedPhase === 'phase1' ? 'Phase 1 (Jan-Sep 2026)' : selectedPhase === 'phase2' ? 'Phase 2 (Oct 2026-Mar 2027)' : 'Phase 3 (Apr-Dec 2027)'}`
									}
								</p>
							</div>
							<Building2 class="size-5 text-muted-foreground" />
						</div>
						<DepartmentBudgetChart departments={phaseFilteredDepartments} />
					</Card>
				</div>
			{/if}

			<!-- Department Breakdown Table -->
			<div>
				<h2 class="text-2xl font-bold mb-4">
					Department Performance
					{#if selectedPhase !== 'all'}
						<span class="text-lg font-normal text-muted-foreground">
							- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</span>
					{/if}
				</h2>
				<DepartmentBreakdownTable departments={phaseFilteredDepartments} />
			</div>
		</div>
	{/if}

	{#if activeTab === 'expenses'}
		<!-- Expenses Tab Content -->
		<div class="space-y-6">
			<!-- Expenses & Approvals Breakdown -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Expenses & Approvals</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Expense Status Breakdown -->
					<Card class="p-6 bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold">Expense Pipeline</h3>
							<Receipt class="size-5 text-blue-400" />
						</div>
						<div class="space-y-3">
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-gray-400"></div>
									<span class="text-sm font-medium">Draft</span>
								</div>
								<span class="text-sm font-bold">{metrics.expenses.draft}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-blue-500"></div>
									<span class="text-sm font-medium">Submitted</span>
								</div>
								<span class="text-sm font-bold">{metrics.expenses.submitted}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-green-500"></div>
									<span class="text-sm font-medium">Approved</span>
								</div>
								<span class="text-sm font-bold">{metrics.expenses.approved}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-emerald-600"></div>
									<span class="text-sm font-medium">Paid</span>
								</div>
								<span class="text-sm font-bold">{metrics.expenses.paid}</span>
							</div>
						</div>
						<div class="mt-4 pt-4 border-t border-blue-800">
							<Button href="/dashboard/expenses" class="w-full" variant="outline">
								View All Expenses
								<ArrowRight class="size-4 ml-2" />
							</Button>
						</div>
					</Card>

					<!-- Approval Status Breakdown -->
					<Card class="p-6 bg-gradient-to-br from-indigo-950 to-purple-950 border-indigo-800">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold">Approval Workflow</h3>
							<CheckSquare class="size-5 text-indigo-400" />
						</div>
						<div class="space-y-3">
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-yellow-500"></div>
									<span class="text-sm font-medium">Pending</span>
								</div>
								<span class="text-sm font-bold">{metrics.approvals.pending}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-green-500"></div>
									<span class="text-sm font-medium">Approved</span>
								</div>
								<span class="text-sm font-bold">{metrics.approvals.approved}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-red-500"></div>
									<span class="text-sm font-medium">Rejected</span>
								</div>
								<span class="text-sm font-bold">{metrics.approvals.rejected}</span>
							</div>
							<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-800">
								<div class="flex items-center gap-2">
									<div class="size-3 rounded-full bg-orange-500"></div>
									<span class="text-sm font-medium">Revision Requested</span>
								</div>
								<span class="text-sm font-bold">{metrics.approvals.revision_requested}</span>
							</div>
						</div>
						<div class="mt-4 pt-4 border-t border-indigo-800">
							<Button href="/dashboard/approvals" class="w-full" variant="outline">
								View All Approvals
								<ArrowRight class="size-4 ml-2" />
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</div>
	{/if}

	{#if activeTab === 'pros'}
		<!-- Pros Tab Content -->
		<div class="space-y-6">
			<!-- Pro Management -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Pro Roster Management</h2>
				
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<!-- Pro Roster Card -->
					<PlayerRosterCard 
						total={metrics.pros.total}
						active={metrics.pros.active}
						inactive={metrics.pros.inactive}
						retired={metrics.pros.retired}
					/>
					
					<!-- Pro Status Chart -->
					<Card class="p-6">
						<h3 class="text-lg font-semibold mb-4">Status Breakdown</h3>
						<PlayerStatusChart 
							active={metrics.pros.active}
							inactive={metrics.pros.inactive}
							retired={metrics.pros.retired}
							male={metrics.pros.byGender.male}
							female={metrics.pros.byGender.female}
						/>
					</Card>
					
					<!-- Geographic Distribution -->
					<PlayerGeographicChart 
						byCountry={metrics.pros.byCountry}
						topRanked={metrics.pros.topRanked}
						withContracts={metrics.pros.withContracts}
					/>
				</div>
			</div>

			<!-- Pro Metrics Summary -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Key Metrics</h2>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Total Pros</span>
							<Users class="size-4 text-muted-foreground" />
						</div>
						<p class="text-3xl font-bold">{metrics.pros.total}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Active Pros</span>
							<UserCheck class="size-4 text-green-600" />
						</div>
						<p class="text-3xl font-bold text-green-600">{metrics.pros.active}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{metrics.pros.total > 0 ? ((metrics.pros.active / metrics.pros.total) * 100).toFixed(0) : 0}% of roster
						</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Top 100 Ranked</span>
							<TrendingUp class="size-4 text-primary" />
						</div>
						<p class="text-3xl font-bold text-primary">{metrics.pros.topRanked}</p>
						<p class="text-xs text-muted-foreground mt-1">World rankings</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">With Contracts</span>
							<FileText class="size-4 text-blue-600" />
						</div>
						<p class="text-3xl font-bold text-blue-600">{metrics.pros.withContracts}</p>
						<p class="text-xs text-muted-foreground mt-1">Signed contracts</p>
					</Card>
				</div>
			</div>
		</div>
	{/if}

	{#if activeTab === 'marketing'}
		<!-- Marketing Tab Content -->
		<div class="space-y-6">
			<!-- Marketing Overview -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Marketing Performance</h2>
				
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<!-- Campaign Performance Card -->
					<CampaignPerformanceCard 
						total={metrics.marketing.campaigns.total}
						active={metrics.marketing.campaigns.active}
						totalBudget={metrics.marketing.campaigns.totalBudget}
						totalSpend={metrics.marketing.campaigns.totalSpend}
					/>
					
					<!-- Marketing Goals Chart -->
					<MarketingGoalsChart 
						total={metrics.marketing.goals.total}
						completed={metrics.marketing.goals.completed}
						inProgress={metrics.marketing.goals.inProgress}
						notStarted={metrics.marketing.goals.notStarted}
						completionRate={metrics.marketing.goals.completionRate}
					/>
					
					<!-- Campaign Type Distribution -->
					<Card class="p-6">
						<h3 class="text-lg font-semibold mb-4">Campaigns by Type</h3>
						<CampaignTypeChart byType={metrics.marketing.campaigns.byType} />
					</Card>
				</div>
			</div>

			<!-- Campaign Status Breakdown -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Campaign Status</h2>
				<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Planning</span>
							<Clock class="size-4 text-gray-600" />
						</div>
						<p class="text-3xl font-bold text-gray-600">{metrics.marketing.campaigns.byStatus.planning}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Active</span>
							<PlayCircle class="size-4 text-green-600" />
						</div>
						<p class="text-3xl font-bold text-green-600">{metrics.marketing.campaigns.byStatus.active}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Paused</span>
							<Clock class="size-4 text-yellow-600" />
						</div>
						<p class="text-3xl font-bold text-yellow-600">{metrics.marketing.campaigns.byStatus.paused}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Completed</span>
							<CheckCircle2 class="size-4 text-blue-600" />
						</div>
						<p class="text-3xl font-bold text-blue-600">{metrics.marketing.campaigns.byStatus.completed}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Cancelled</span>
							<XCircle class="size-4 text-red-600" />
						</div>
						<p class="text-3xl font-bold text-red-600">{metrics.marketing.campaigns.byStatus.cancelled}</p>
					</Card>
				</div>
			</div>

			<!-- Key Marketing Metrics -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Key Metrics</h2>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Total Budget</span>
							<DollarSign class="size-4 text-muted-foreground" />
						</div>
						<p class="text-2xl font-bold">{formatCurrency(metrics.marketing.campaigns.totalBudget)}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Total Spend</span>
							<TrendingUp class="size-4 text-orange-600" />
						</div>
						<p class="text-2xl font-bold text-orange-600">{formatCurrency(metrics.marketing.campaigns.totalSpend)}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{metrics.marketing.campaigns.totalBudget > 0 ? ((metrics.marketing.campaigns.totalSpend / metrics.marketing.campaigns.totalBudget) * 100).toFixed(0) : 0}% of budget
						</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Avg Campaign Budget</span>
							<DollarSign class="size-4 text-blue-600" />
						</div>
						<p class="text-2xl font-bold text-blue-600">{formatCurrency(metrics.marketing.campaigns.averageBudget)}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Goal Completion</span>
							<Target class="size-4 text-green-600" />
						</div>
						<p class="text-2xl font-bold text-green-600">{metrics.marketing.goals.completionRate.toFixed(0)}%</p>
						<p class="text-xs text-muted-foreground mt-1">
							{metrics.marketing.goals.completed} of {metrics.marketing.goals.total} goals
						</p>
					</Card>
				</div>
			</div>
		</div>
	{/if}

	{#if activeTab === 'vendors'}
		<!-- Vendors Tab Content -->
		<div class="space-y-6">
			<!-- Vendor Overview -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Vendor Management</h2>
				
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<!-- Vendor Spending Card -->
					<VendorSpendingCard 
						total={metrics.vendors.total}
						active={metrics.vendors.active}
						totalSpend={metrics.vendors.totalSpend}
						averageSpend={metrics.vendors.averageSpend}
					/>
					
					<!-- Top Vendors Chart -->
					<Card class="p-6 lg:col-span-2">
						<h3 class="text-lg font-semibold mb-4">Top Vendors by Spending</h3>
						<TopVendorsChart topVendors={metrics.vendors.topVendors} />
					</Card>
				</div>
			</div>

			<!-- Vendor Categories -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Vendor Distribution</h2>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- Category Distribution -->
					<VendorCategoryChart byCategory={metrics.vendors.byCategory} />
					
					<!-- Vendor Status -->
					<Card class="p-6">
						<h3 class="text-lg font-semibold mb-4">Vendor Status</h3>
						<div class="space-y-4">
							<div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
								<div class="flex items-center gap-3">
									<div class="w-3 h-3 rounded-full bg-green-500"></div>
									<span class="font-medium text-foreground">Active Vendors</span>
								</div>
								<span class="text-2xl font-bold text-green-600 dark:text-green-500">{metrics.vendors.active}</span>
							</div>
							
							<div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
								<div class="flex items-center gap-3">
									<div class="w-3 h-3 rounded-full bg-gray-500"></div>
									<span class="font-medium text-foreground">Inactive Vendors</span>
								</div>
								<span class="text-2xl font-bold text-gray-600 dark:text-gray-400">{metrics.vendors.inactive}</span>
							</div>
							
							<div class="pt-4 border-t">
								<div class="flex justify-between items-center">
									<span class="text-sm text-muted-foreground">Active Rate</span>
									<span class="text-xl font-bold text-foreground">
										{metrics.vendors.total > 0 ? ((metrics.vendors.active / metrics.vendors.total) * 100).toFixed(0) : 0}%
									</span>
								</div>
							</div>
						</div>
					</Card>
				</div>
			</div>

			<!-- Key Vendor Metrics -->
			<div>
				<h2 class="text-2xl font-bold mb-4">Key Metrics</h2>
				<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Total Vendors</span>
							<Package class="size-4 text-muted-foreground" />
						</div>
						<p class="text-3xl font-bold">{metrics.vendors.total}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Active Vendors</span>
							<CheckCircle2 class="size-4 text-green-600" />
						</div>
						<p class="text-3xl font-bold text-green-600">{metrics.vendors.active}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{metrics.vendors.total > 0 ? ((metrics.vendors.active / metrics.vendors.total) * 100).toFixed(0) : 0}% of total
						</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Total Spending</span>
							<DollarSign class="size-4 text-cyan-600" />
						</div>
						<p class="text-2xl font-bold text-cyan-600">{formatCurrency(metrics.vendors.totalSpend)}</p>
					</Card>
					
					<Card class="p-6">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-muted-foreground">Avg per Vendor</span>
							<TrendingUp class="size-4 text-blue-600" />
						</div>
						<p class="text-2xl font-bold text-blue-600">{formatCurrency(metrics.vendors.averageSpend)}</p>
					</Card>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions (Always Visible) -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Quick Actions</h2>
		
		{#if testDataMessage}
			<div class="mb-4 p-4 rounded-lg {testDataMessage.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}">
				{testDataMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#if !isAdmin}
				<Card class="p-6 hover:shadow-lg transition-shadow border-2">
					<div class="flex items-center gap-4 mb-4">
						<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
							<ListTodo class="size-6 stroke-[2]" />
						</div>
						<h3 class="text-xl font-bold">Tasks</h3>
					</div>
					<p class="text-muted-foreground mb-6">Business roadmap and checklists</p>
					<Button href="/dashboard/tasks" class="w-full font-semibold">View Tasks</Button>
				</Card>

				<Card class="p-6 hover:shadow-lg transition-shadow border-2">
					<div class="flex items-center gap-4 mb-4">
						<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
							<FolderKanban class="size-6 stroke-[2]" />
						</div>
						<h3 class="text-xl font-bold">Projects</h3>
					</div>
					<p class="text-muted-foreground mb-6">Tournaments, events, and campaigns</p>
					<Button href="/dashboard/projects" class="w-full font-semibold">View Projects</Button>
				</Card>

				<Card class="p-6 hover:shadow-lg transition-shadow border-2">
					<div class="flex items-center gap-4 mb-4">
						<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
							<Receipt class="size-6 stroke-[2]" />
						</div>
						<h3 class="text-xl font-bold">Expenses</h3>
					</div>
					<p class="text-muted-foreground mb-6">Financial tracking and approvals</p>
					<Button href="/dashboard/expenses" class="w-full font-semibold">View Expenses</Button>
				</Card>
			{/if}
		</div>
	</div>
</div>

<!-- Projects Modal -->
<Sheet.Root bind:open={showProjectsModal}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<FolderKanban class="size-5" />
				Projects Overview
			</Sheet.Title>
		</Sheet.Header>
		
		<div class="space-y-6">
			<!-- Status Tabs -->
			<div class="border-b border-slate-700">
				<div class="flex gap-1 overflow-x-auto">
					{#each [
						{ value: 'draft', label: 'Draft', count: metrics.projects.draft, icon: FileText },
						{ value: 'planned', label: 'Planned', count: metrics.projects.planned, icon: ClipboardList },
						{ value: 'in_progress', label: 'In Progress', count: metrics.projects.active, icon: PlayCircle },
						{ value: 'completed', label: 'Completed', count: metrics.projects.completed, icon: CheckCircle2 },
						{ value: 'cancelled', label: 'Cancelled', count: metrics.projects.cancelled, icon: XCircle }
					] as tab}
						<button
							type="button"
							onclick={() => projectStatusTab = tab.value}
							class="px-4 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap {projectStatusTab === tab.value ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
						>
							<div class="flex items-center gap-2">
								<svelte:component this={tab.icon} class="size-4" />
								<span>{tab.label}</span>
								<span class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold {projectStatusTab === tab.value ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}">
									{tab.count}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Projects List -->
			<div class="space-y-3">
				{#if filteredProjects.length === 0}
					<div class="text-center py-8 text-slate-400">
						<p>No projects in this status</p>
					</div>
				{:else}
					{#each filteredProjects as project}
						{@const countdown = getCountdown(project.endDate)}
						<div class="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
							<h4 class="font-semibold text-white mb-3">{project.name}</h4>
							
							<div class="space-y-2 text-sm">
								{#if project.startDate}
									<div class="flex items-center gap-2 text-slate-300">
										<Calendar class="size-4" />
										<span>Start: {formatDate(project.startDate)}</span>
									</div>
								{/if}
								
								{#if project.endDate}
									<div class="flex items-center gap-2 text-slate-300">
										<Calendar class="size-4" />
										<span>End: {formatDate(project.endDate)}</span>
									</div>
									<div class="flex items-center gap-2 {countdown.color}">
										<Clock class="size-4" />
										<span class="font-medium">{countdown.text}</span>
									</div>
								{/if}
								
								{#if project.project_budget}
									<div class="flex items-center gap-2 text-slate-300">
										<DollarSign class="size-4" />
										<span>Budget: {formatCurrency(project.project_budget)}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
			
			<Button href="/dashboard/projects" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				View All Projects
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Departments Modal -->
<Sheet.Root bind:open={showDepartmentsModal}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Building2 class="size-5" />
				Departments Overview
			</Sheet.Title>
		</Sheet.Header>
		
		<div class="space-y-6">
			<!-- Status Tabs -->
			<div class="border-b border-slate-700">
				<div class="flex gap-1">
					{#each [
						{ value: 'active', label: 'Active', count: metrics.departments.active },
						{ value: 'inactive', label: 'Inactive', count: metrics.departments.inactive }
					] as tab}
						<button
							type="button"
							onclick={() => departmentStatusTab = tab.value}
							class="px-4 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap {departmentStatusTab === tab.value ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
						>
							<div class="flex items-center gap-2">
								<span>{tab.label}</span>
								<span class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold {departmentStatusTab === tab.value ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}">
									{tab.count}
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- Departments List -->
			<div class="space-y-3">
				{#if filteredDepartments.length === 0}
					<div class="text-center py-8 text-slate-400">
						<p>No departments in this status</p>
					</div>
				{:else}
					{#each filteredDepartments as department}
						<div class="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
							<h4 class="font-semibold text-white mb-3">{department.name}</h4>
							
							<div class="space-y-2 text-sm">
								{#if department.department_annual_budget}
									<div class="flex items-center gap-2 text-slate-300">
										<DollarSign class="size-4" />
										<span>Annual Budget: {formatCurrency(department.department_annual_budget)}</span>
									</div>
								{/if}
								
								{#if department.expand?.headOfDepartment}
									<div class="flex items-center gap-2 text-slate-300">
										<UserCircle class="size-4" />
										<span>Head: {department.expand.headOfDepartment.firstName} {department.expand.headOfDepartment.lastName}</span>
									</div>
								{:else if department.headOfDepartment}
									<div class="flex items-center gap-2 text-slate-300">
										<UserCircle class="size-4" />
										<span>Head: Assigned</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
			
			<Button href="/dashboard/departments" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				View All Departments
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Expenses Modal -->
<Sheet.Root bind:open={showExpensesModal}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Receipt class="size-5" />
				Expenses Overview
			</Sheet.Title>
		</Sheet.Header>
		<div class="space-y-6">
			<div class="space-y-3">
				<div class="flex justify-between items-center p-4 rounded-lg bg-slate-800 border border-slate-700">
					<span class="font-medium text-slate-200">Total Amount</span>
					<span class="text-2xl font-bold text-white">{formatCurrency(metrics.expenses.totalAmount)}</span>
				</div>
				<div class="flex justify-between items-center p-4 rounded-lg bg-slate-800 border border-slate-700">
					<span class="font-medium text-slate-200">Total Transactions</span>
					<span class="text-xl font-bold text-white">{metrics.expenses.total}</span>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="p-4 rounded-lg bg-yellow-900/30 border border-yellow-700 text-center">
						<div class="text-sm text-slate-300">Draft</div>
						<div class="text-lg font-bold text-yellow-400">{metrics.expenses.draft}</div>
					</div>
					<div class="p-4 rounded-lg bg-blue-900/30 border border-blue-700 text-center">
						<div class="text-sm text-slate-300">Submitted</div>
						<div class="text-lg font-bold text-blue-400">{metrics.expenses.submitted}</div>
					</div>
					<div class="p-4 rounded-lg bg-green-900/30 border border-green-700 text-center">
						<div class="text-sm text-slate-300">Approved</div>
						<div class="text-lg font-bold text-green-400">{metrics.expenses.approved}</div>
					</div>
					<div class="p-4 rounded-lg bg-purple-900/30 border border-purple-700 text-center">
						<div class="text-sm text-slate-300">Paid</div>
						<div class="text-lg font-bold text-purple-400">{metrics.expenses.paid}</div>
					</div>
				</div>
			</div>
			<Button href="/dashboard/expenses" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				View All Expenses
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Team Modal -->
<Sheet.Root bind:open={showTeamModal}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Users class="size-5" />
				Team Overview
			</Sheet.Title>
		</Sheet.Header>
		<div class="space-y-6">
			<div class="space-y-3">
				<div class="flex justify-between items-center p-4 rounded-lg bg-slate-800 border border-slate-700">
					<span class="font-medium text-slate-200">Total Team Members</span>
					<span class="text-2xl font-bold text-white">{metrics.people.total}</span>
				</div>
				<p class="text-sm text-slate-300">
					View and manage all team members, their roles, and permissions.
				</p>
			</div>
			<Button href="/dashboard/people" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				Manage Team
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
