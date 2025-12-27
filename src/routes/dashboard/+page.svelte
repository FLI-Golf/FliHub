<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
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
		PlayCircle
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let role = $derived(data.userProfile?.role || 'leader');
	let isAdmin = $derived(role === 'admin');
	let userName = $derived(data.userProfile ? `${data.userProfile.firstName} ${data.userProfile.lastName}` : data.user?.email);
	let metrics = $derived(data.metrics);
	let recentProjects = $derived(data.recentProjects || []);
	
	let projectStatusFilter = $state<string>('all');
	
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

	<!-- Key Metrics -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				title="Total Projects"
				value={metrics.projects.total}
				subtitle="{metrics.projects.active} active, {metrics.projects.completed} completed"
				icon={FolderKanban}
			/>
			
			<MetricCard
				title="Tasks"
				value={metrics.tasks.total}
				subtitle="{metrics.tasks.inProgress} in progress"
				icon={ListTodo}
			/>
			
			<MetricCard
				title="Total Expenses"
				value={formatCurrency(metrics.expenses.totalAmount)}
				subtitle="{metrics.expenses.total} transactions"
				icon={Receipt}
			/>
			
			<MetricCard
				title="Team Members"
				value={metrics.managers.total}
				subtitle="Active managers"
				icon={Users}
			/>
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

	<!-- Task Progress -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-2xl font-bold">Task Progress</h2>
			<Button href="/dashboard/tasks" variant="outline" size="sm">View All Tasks</Button>
		</div>
		<Card class="p-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div>
					<div class="flex items-center gap-2 mb-2">
						<div class="size-3 rounded-full bg-slate-400"></div>
						<span class="text-sm font-medium text-muted-foreground">To Do</span>
					</div>
					<p class="text-3xl font-bold">{metrics.tasks.todo}</p>
				</div>
				<div>
					<div class="flex items-center gap-2 mb-2">
						<div class="size-3 rounded-full bg-blue-500"></div>
						<span class="text-sm font-medium text-muted-foreground">In Progress</span>
					</div>
					<p class="text-3xl font-bold">{metrics.tasks.inProgress}</p>
				</div>
				<div>
					<div class="flex items-center gap-2 mb-2">
						<div class="size-3 rounded-full bg-green-500"></div>
						<span class="text-sm font-medium text-muted-foreground">Completed</span>
					</div>
					<p class="text-3xl font-bold">{metrics.tasks.completed}</p>
				</div>
			</div>
			{#if metrics.tasks.total > 0}
				<div class="mt-6">
					<ProgressBar
						value={metrics.tasks.completed}
						max={metrics.tasks.total}
						label="Overall Completion"
						variant="success"
						size="lg"
					/>
				</div>
			{/if}
		</Card>
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
			{#if isAdmin}
				<Card class="p-6 hover:shadow-lg transition-shadow border-2 border-primary/50">
					<div class="flex items-center gap-4 mb-4">
						<div class="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
							<Users class="size-6 stroke-[2]" />
						</div>
						<h3 class="text-xl font-bold">Managers</h3>
					</div>
					<p class="text-muted-foreground mb-6">Manage user roles and permissions</p>
					<Button href="/dashboard/managers" class="w-full font-semibold">Manage Users</Button>
				</Card>
			{:else}
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
