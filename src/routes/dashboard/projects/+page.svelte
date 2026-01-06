<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import AddProjectModal from '$lib/components/projects/add-project-modal.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { 
		FolderKanban, 
		DollarSign, 
		TrendingUp, 
		AlertTriangle,
		Calendar,
		Plus,
		Search,
		FileText,
		ClipboardList,
		PlayCircle,
		CheckCircle2,
		XCircle,
		Trophy,
		Zap,
		PartyPopper,
		Megaphone
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let showAddModal = $state(false);
	
	let projects = $derived(data?.projects || []);
	let stats = $derived(data?.stats || {
		total: 0,
		byStatus: { draft: 0, planned: 0, in_progress: 0, completed: 0, cancelled: 0 },
		byType: { tournament: 0, activation: 0, event: 0, campaign: 0 },
		budget: { total: 0, forecasted: 0, actual: 0, variance: 0, remaining: 0 }
	});
	let alerts = $derived(data?.alerts || { overBudget: 0, nearingBudget: 0 });
	
	let statusFilter = $state<string>('all');
	let typeFilter = $state<string>('all');
	let searchQuery = $state('');
	
	// Filter projects based on selected tabs and search
	let filteredProjects = $derived(projects.filter(project => {
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const name = project.name?.toLowerCase() || '';
			const description = project.description?.toLowerCase() || '';
			const matchesSearch = name.includes(query) || description.includes(query);
			if (!matchesSearch) return false;
		}
		
		// Status and type filters
		const statusMatch = statusFilter === 'all' || project.status === statusFilter;
		const typeMatch = typeFilter === 'all' || project.type === typeFilter;
		return statusMatch && typeMatch;
	}));
	
	// Calculate filtered totals
	let filteredBudget = $derived(filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0));
	let filteredActual = $derived(filteredProjects.reduce((sum, p) => sum + (p.actualExpenses || 0), 0));
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All', count: projects.length },
		{ value: 'draft', label: 'Draft', count: stats.byStatus.draft, icon: FileText },
		{ value: 'planned', label: 'Planned', count: stats.byStatus.planned, icon: ClipboardList },
		{ value: 'in_progress', label: 'In Progress', count: stats.byStatus.in_progress, icon: PlayCircle },
		{ value: 'completed', label: 'Completed', count: stats.byStatus.completed, icon: CheckCircle2 },
		{ value: 'cancelled', label: 'Cancelled', count: stats.byStatus.cancelled, icon: XCircle }
	]);
	
	// Build type tabs
	let typeTabs = $derived([
		{ value: 'all', label: 'All Types', count: projects.length },
		{ value: 'tournament', label: 'Tournament', count: stats.byType.tournament, icon: Trophy },
		{ value: 'activation', label: 'Activation', count: stats.byType.activation, icon: Zap },
		{ value: 'event', label: 'Event', count: stats.byType.event, icon: PartyPopper },
		{ value: 'campaign', label: 'Campaign', count: stats.byType.campaign, icon: Megaphone }
	]);
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function getBudgetPercentage(project: any): number {
		if (!project.budget || !project.actualExpenses) return 0;
		return Math.min((project.actualExpenses / project.budget) * 100, 100);
	}
	
	function getBudgetVariant(percentage: number): 'success' | 'warning' | 'danger' {
		if (percentage >= 100) return 'danger';
		if (percentage >= 80) return 'warning';
		return 'success';
	}
	
	function stripHtml(html: string): string {
		if (!html) return '';
		// Simple regex-based HTML stripping (works on both server and client)
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}
</script>

<svelte:head>
	<title>Projects - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold mb-2">Projects</h1>
			<p class="text-muted-foreground">Manage tournaments, events, activations, and campaigns</p>
		</div>
		<Button class="gap-2" onclick={() => showAddModal = true}>
			<Plus class="size-4" />
			Add Project
		</Button>
	</div>

	<!-- Add Project Modal -->
	<AddProjectModal bind:open={showAddModal} departments={data.departments || []} />

	<!-- Alerts -->
	{#if alerts.overBudget > 0 || alerts.nearingBudget > 0}
		<div class="flex gap-4">
			{#if alerts.overBudget > 0}
				<Card class="p-4 border-red-500 bg-red-50 dark:bg-red-900/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-red-600 dark:text-red-400" />
						<div>
							<p class="font-semibold text-red-900 dark:text-red-100">
								{alerts.overBudget} {alerts.overBudget === 1 ? 'project is' : 'projects are'} over budget
							</p>
							<p class="text-sm text-red-700 dark:text-red-300">Immediate attention required</p>
						</div>
					</div>
				</Card>
			{/if}
			{#if alerts.nearingBudget > 0}
				<Card class="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-yellow-600 dark:text-yellow-400" />
						<div>
							<p class="font-semibold text-yellow-900 dark:text-yellow-100">
								{alerts.nearingBudget} {alerts.nearingBudget === 1 ? 'project is' : 'projects are'} nearing budget limit
							</p>
							<p class="text-sm text-yellow-700 dark:text-yellow-300">Over 80% of budget used</p>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	{/if}

	<!-- Statistics -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				title="Total Projects"
				value={stats.total}
				subtitle="{stats.byStatus.in_progress} active"
				icon={FolderKanban}
			/>
			
			<MetricCard
				title="Total Budget"
				value={formatCurrency(stats.budget.total)}
				subtitle="Allocated across all projects"
				icon={DollarSign}
			/>
			
			<MetricCard
				title="Actual Spent"
				value={formatCurrency(stats.budget.actual)}
				subtitle="{((stats.budget.actual / stats.budget.total) * 100).toFixed(0)}% of total budget"
				icon={TrendingUp}
			/>
			
			<MetricCard
				title="Remaining Budget"
				value={formatCurrency(stats.budget.remaining)}
				subtitle="Available to spend"
				icon={DollarSign}
				variant={stats.budget.remaining > 0 ? 'success' : 'danger'}
			/>
		</div>
	</div>

	<!-- Budget Overview -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Budget Utilization</h2>
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Total Budget</span>
					<span class="font-semibold">{formatCurrency(stats.budget.total)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Forecasted</span>
					<span class="font-semibold">{formatCurrency(stats.budget.forecasted)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Actual Spent</span>
					<span class="font-semibold">{formatCurrency(stats.budget.actual)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Variance</span>
					<span class="font-semibold" class:text-green-600={stats.budget.variance > 0} class:text-red-600={stats.budget.variance < 0}>
						{stats.budget.variance > 0 ? '+' : ''}{formatCurrency(stats.budget.variance)}
					</span>
				</div>
				<ProgressBar
					value={stats.budget.actual}
					max={stats.budget.total}
					label="Budget Used"
					size="lg"
				/>
			</div>
		</Card>
	</div>

	<!-- Status Breakdown -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Project Status</h2>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Draft</p>
				<p class="text-2xl font-bold">{stats.byStatus.draft}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Planned</p>
				<p class="text-2xl font-bold">{stats.byStatus.planned}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">In Progress</p>
				<p class="text-2xl font-bold">{stats.byStatus.in_progress}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Completed</p>
				<p class="text-2xl font-bold">{stats.byStatus.completed}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Cancelled</p>
				<p class="text-2xl font-bold">{stats.byStatus.cancelled}</p>
			</Card>
		</div>
	</div>

	<!-- Projects Table with Tabs -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">All Projects</h2>
			{#if statusFilter !== 'all' || typeFilter !== 'all' || searchQuery}
				<div class="text-sm text-muted-foreground">
					Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} • 
					Budget: <span class="font-semibold">{formatCurrency(filteredBudget)}</span> • 
					Spent: <span class="font-semibold">{formatCurrency(filteredActual)}</span>
				</div>
			{/if}
		</div>
		
		<!-- Search Bar -->
		<div class="mb-4">
			<div class="relative max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search projects by name or description..."
					bind:value={searchQuery}
					class="pl-10 text-white placeholder:text-slate-400"
				/>
			</div>
		</div>
		
		<!-- Status Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="button"
			/>
		</div>

		<!-- Type Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Type</h3>
			<VisualTabs
				tabs={typeTabs}
				activeTab={typeFilter}
				onTabChange={(v) => typeFilter = v}
				variant="pill"
			/>
		</div>

		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 dark:bg-slate-900 border-b">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Project Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Budget
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Spent
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Progress
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Dates
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#if filteredProjects.length === 0}
							<tr>
								<td colspan="7" class="px-6 py-8 text-center text-foreground">
									{#if projects.length === 0}
										No projects found. Create your first project to get started.
									{:else}
										No projects match the selected filters.
									{/if}
								</td>
							</tr>
						{:else}
							{#each filteredProjects as project, i}
								<tr 
									class="hover:bg-green-800 dark:hover:bg-green-800/50 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-blue-800 dark:bg-blue-800/30' : ''}"
									onclick={() => window.location.href = `/dashboard/projects/${project.id}`}
								>
									<td class="px-6 py-4">
										<div class="font-medium">{project.name}</div>
										{#if project.description}
											<div class="text-sm text-muted-foreground truncate max-w-xs">
												{stripHtml(project.description)}
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
									<td class="px-6 py-4 text-sm font-medium">
										{project.actualExpenses ? formatCurrency(project.actualExpenses) : '-'}
									</td>
									<td class="px-6 py-4">
										{#if project.budget && project.actualExpenses}
											<div class="w-32">
												<ProgressBar
													value={project.actualExpenses}
													max={project.budget}
													showPercentage={false}
													variant={getBudgetVariant(getBudgetPercentage(project))}
													size="sm"
												/>
												<p class="text-xs text-muted-foreground mt-1">
													{getBudgetPercentage(project).toFixed(0)}%
												</p>
											</div>
										{:else}
											<span class="text-sm text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										<div class="flex items-center gap-1">
											<Calendar class="size-3" />
											{formatDate(project.startDate)} - {formatDate(project.endDate)}
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</Card>
	</div>
</div>
