<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
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
		UserCircle
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let role = $derived(data.userProfile?.role || 'leader');
	let isAdmin = $derived(role === 'admin');
	let userName = $derived(data.userProfile ? `${data.userProfile.firstName} ${data.userProfile.lastName}` : data.user?.email);
	
	let projectStatusTab = $state<string>('in_progress');
	let departmentStatusTab = $state<string>('active');
	
	let metrics = $derived(data.metrics || {
		projects: { total: 0, draft: 0, planned: 0, active: 0, completed: 0, cancelled: 0 },
		projectsByStatus: { draft: [], planned: [], in_progress: [], completed: [], cancelled: [] },
		departments: { total: 0, active: 0, inactive: 0 },
		departmentsByStatus: { active: [], inactive: [] },
		expenses: { total: 0, totalAmount: 0, approvedAmount: 0, draft: 0, submitted: 0, approved: 0, paid: 0 },
		budget: { total: 0, forecasted: 0, actual: 0, remaining: 0 },
		managers: { total: 0 }
	});
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
					class="hover:shadow-xl hover:bg-slate-600 dark:hover:bg-slate-600 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showDepartmentsModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Departments"
					value={metrics.departments.total}
					subtitle="{metrics.departments.active} active departments"
					icon={Building2}
					class="hover:shadow-xl hover:bg-slate-600 dark:hover:bg-slate-600 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showExpensesModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Total Expenses"
					value={formatCurrency(metrics.expenses.totalAmount)}
					subtitle="{metrics.expenses.total} transactions"
					icon={Receipt}
					class="hover:shadow-xl hover:bg-slate-600 dark:hover:bg-slate-600 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
			
			<button onclick={() => showTeamModal = true} class="text-left cursor-pointer">
				<MetricCard
					title="Team Members"
					value={metrics.managers.total}
					subtitle="Active team members"
					icon={Users}
					class="hover:shadow-xl hover:bg-slate-600 dark:hover:bg-slate-600 hover:scale-[1.02] transition-all duration-200"
				/>
			</button>
		</div>
	</div>

	<!-- Budget Overview -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Budget Overview</h2>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Budget Utilization</h3>
					<DollarSign class="size-5 text-muted-foreground" />
				</div>
				<div class="space-y-4">
					<div>
						<div class="flex justify-between text-sm mb-2">
							<span class="text-muted-foreground">Total Budget</span>
							<span class="font-semibold">{formatCurrency(metrics.budget.total)}</span>
						</div>
						<div class="flex justify-between text-sm mb-2">
							<span class="text-muted-foreground">Actual Spent</span>
							<span class="font-semibold">{formatCurrency(metrics.budget.actual)}</span>
						</div>
						<div class="flex justify-between text-sm mb-2">
							<span class="text-muted-foreground">Remaining</span>
							<span class="font-semibold text-green-600 dark:text-green-400">
								{formatCurrency(metrics.budget.remaining)}
							</span>
						</div>
					</div>
					<ProgressBar
						value={metrics.budget.actual}
						max={metrics.budget.total}
						label="Budget Used"
						size="lg"
					/>
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Expense Status</h3>
					<Receipt class="size-5 text-muted-foreground" />
				</div>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Clock class="size-4 text-slate-500" />
							<span class="text-sm">Draft</span>
						</div>
						<span class="font-semibold">{metrics.expenses.draft}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<AlertCircle class="size-4 text-blue-500" />
							<span class="text-sm">Submitted</span>
						</div>
						<span class="font-semibold">{metrics.expenses.submitted}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<CheckCircle2 class="size-4 text-green-500" />
							<span class="text-sm">Approved</span>
						</div>
						<span class="font-semibold">{metrics.expenses.approved}</span>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<DollarSign class="size-4 text-green-600" />
							<span class="text-sm">Paid</span>
						</div>
						<span class="font-semibold">{metrics.expenses.paid}</span>
					</div>
				</div>
			</Card>
		</div>
	</div>

	<!-- Recent Projects -->
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
											{project.budget ? formatCurrency(project.budget) : '-'}
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

	<!-- Quick Actions -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Quick Actions</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
								
								{#if project.budget}
									<div class="flex items-center gap-2 text-slate-300">
										<DollarSign class="size-4" />
										<span>Budget: {formatCurrency(project.budget)}</span>
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
								{#if department.annualBudget}
									<div class="flex items-center gap-2 text-slate-300">
										<DollarSign class="size-4" />
										<span>Annual Budget: {formatCurrency(department.annualBudget)}</span>
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
					<span class="text-2xl font-bold text-white">{metrics.managers.total}</span>
				</div>
				<p class="text-sm text-slate-300">
					View and manage all team members, their roles, and permissions.
				</p>
			</div>
			<Button href="/dashboard/managers" class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				Manage Team
				<ArrowRight class="size-4 ml-2" />
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
