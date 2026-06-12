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
	let filteredBudget = $derived(filteredProjects.reduce((sum, p) => sum + (p.project_budget || 0), 0));
	let filteredActual = $derived(filteredProjects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0));
	let filteredOverBudget = $derived(filteredProjects.filter((p) => getBudgetPercentage(p) >= 100).length);
	let filteredNearingBudget = $derived(filteredProjects.filter((p) => {
		const pct = getBudgetPercentage(p);
		return pct >= 80 && pct < 100;
	}).length);
	
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
		if (!project.project_budget || !project.project_actual_expenses) return 0;
		return Math.min((project.project_actual_expenses / project.project_budget) * 100, 100);
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

	function clearFilters() {
		statusFilter = 'all';
		typeFilter = 'all';
		searchQuery = '';
	}

	function statusToneClass(status: string): string {
		switch (status) {
			case 'draft': return 'border-l-slate-500';
			case 'planned': return 'border-l-blue-500';
			case 'in_progress': return 'border-l-amber-500';
			case 'completed': return 'border-l-emerald-500';
			case 'cancelled': return 'border-l-rose-500';
			default: return 'border-l-slate-600';
		}
	}

	function nextAction(project: any): string {
		const pct = getBudgetPercentage(project);
		if (project.status === 'draft') return 'Define budget, owner, and kickoff date';
		if (project.status === 'planned') return 'Confirm scope and move to in progress';
		if (project.status === 'in_progress' && pct >= 100) return 'Freeze spend and approve budget correction';
		if (project.status === 'in_progress' && pct >= 80) return 'Review remaining spend and reprioritize tasks';
		if (project.status === 'in_progress') return 'Track execution milestones this week';
		if (project.status === 'completed') return 'Closeout financials and capture outcomes';
		if (project.status === 'cancelled') return 'Archive notes and release remaining budget';
		return 'Review current status and ownership';
	}
</script>

<svelte:head>
	<title>Projects - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<Card class="p-6 bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-emerald-950/30 border-slate-700">
		<div class="flex flex-wrap justify-between items-center gap-4">
			<div>
				<h1 class="text-3xl font-bold mb-2 text-slate-100">Projects</h1>
				<p class="text-slate-300">Manage tournaments, events, activations, and campaigns</p>
				<p class="text-xs text-slate-400 mt-1">Use filters below to focus on projects needing action this week.</p>
			</div>
			<Button class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onclick={() => showAddModal = true}>
				<Plus class="size-4" />
				Add Project
			</Button>
		</div>
	</Card>

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
				subtitle={stats.budget.total > 0 ? `${((stats.budget.actual / stats.budget.total) * 100).toFixed(0)}% of total budget` : 'No budget set'}
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

	<!-- Action Center -->
	<Card class="p-5 border-slate-700 bg-slate-900/40">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">Action Center</h2>
				<p class="text-xs text-slate-400 mt-1">Color-coded priorities based on budget pressure and delivery stage.</p>
			</div>
			<div class="flex flex-wrap gap-2 text-xs">
				<span class="px-2.5 py-1 rounded-full border border-red-700/50 bg-red-900/30 text-red-300">
					{filteredOverBudget} over budget
				</span>
				<span class="px-2.5 py-1 rounded-full border border-amber-700/50 bg-amber-900/30 text-amber-300">
					{filteredNearingBudget} near limit
				</span>
				<span class="px-2.5 py-1 rounded-full border border-blue-700/50 bg-blue-900/30 text-blue-300">
					{stats.byStatus.in_progress} in progress
				</span>
			</div>
		</div>
	</Card>

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



	<!-- Projects Table with Tabs -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">All Projects</h2>
			<div class="text-sm text-muted-foreground">
				Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} • 
				Budget: <span class="font-semibold text-slate-200">{formatCurrency(filteredBudget)}</span> • 
				Spent: <span class="font-semibold text-slate-200">{formatCurrency(filteredActual)}</span>
			</div>
		</div>
		
		<!-- Search Bar -->
		<div class="mb-4 rounded-xl border border-slate-700 bg-slate-900/30 p-4">
			<div class="flex flex-wrap gap-3 items-center justify-between">
				<div class="relative max-w-md w-full">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search projects by name or description..."
						bind:value={searchQuery}
						class="pl-10 text-white placeholder:text-slate-400"
					/>
				</div>
				{#if statusFilter !== 'all' || typeFilter !== 'all' || searchQuery}
					<Button variant="outline" class="border-slate-600 text-slate-300" onclick={clearFilters}>Clear Filters</Button>
				{/if}
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

		<!-- Legends -->
		<div class="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-3">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Status</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 bg-slate-800/70"><span class="size-2 rounded-full bg-slate-400"></span>Draft</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-blue-700/50 text-blue-300 bg-blue-900/30"><span class="size-2 rounded-full bg-blue-400"></span>Planned</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-amber-700/50 text-amber-300 bg-amber-900/30"><span class="size-2 rounded-full bg-amber-400"></span>In Progress</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/30"><span class="size-2 rounded-full bg-emerald-400"></span>Completed</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-rose-700/50 text-rose-300 bg-rose-900/30"><span class="size-2 rounded-full bg-rose-400"></span>Cancelled</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Budget Risk</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/30"><span class="size-2 rounded-full bg-emerald-400"></span>Healthy (&lt;80%)</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-amber-700/50 text-amber-300 bg-amber-900/30"><span class="size-2 rounded-full bg-amber-400"></span>Nearing Limit (80-99%)</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-red-700/50 text-red-300 bg-red-900/30"><span class="size-2 rounded-full bg-red-400"></span>Over Budget (100%+)</span>
			</div>
		</div>

		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-900 border-b border-slate-700">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Project Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Budget
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Spent
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Progress
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
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
								{@const pct = getBudgetPercentage(project)}
								<tr 
									class="border-l-4 {statusToneClass(project.status)} hover:bg-slate-800/60 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-slate-900/40' : ''}"
									onclick={() => window.location.href = `/dashboard/projects/${project.id}`}
								>
									<td class="px-6 py-4">
										<div class="font-medium">{project.name}</div>
										{#if project.description}
											<div class="text-sm text-muted-foreground truncate max-w-xs">
												{stripHtml(project.description)}
											</div>
										{/if}
										<p class="text-[11px] mt-1 {pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}">
											Next: {nextAction(project)}
										</p>
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
									<td class="px-6 py-4 text-sm font-medium">
										{project.project_actual_expenses ? formatCurrency(project.project_actual_expenses) : '-'}
									</td>
									<td class="px-6 py-4">
										{#if project.project_budget && project.project_actual_expenses}
											<div class="w-32">
												<ProgressBar
													value={project.project_actual_expenses}
													max={project.project_budget}
													showPercentage={false}
													variant={getBudgetVariant(pct)}
													size="sm"
												/>
												<p class="text-xs mt-1 {pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}">
													{pct.toFixed(0)}%
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
