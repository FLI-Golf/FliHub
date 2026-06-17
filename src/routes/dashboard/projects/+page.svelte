<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
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
		Megaphone,
		ChevronUp,
		ChevronDown,
		ChevronsUpDown
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
	let budgetStatusFilter = $state<string>('in_progress');
	type SortKey = 'name' | 'type' | 'status' | 'budget' | 'description' | 'vendors' | 'startDate' | 'endDate';
	let sortKey = $state<SortKey>('name');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	
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

	let budgetStatusProjects = $derived(projects.filter((project) => {
		return budgetStatusFilter === 'all' || project.status === budgetStatusFilter;
	}));

	let scopedBudget = $derived({
		total: budgetStatusProjects.reduce((sum, p) => sum + (p.project_budget || 0), 0),
		forecasted: budgetStatusProjects.reduce((sum, p) => sum + (p.project_forecasted_expenses || 0), 0),
		actual: budgetStatusProjects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0)
	});

	let scopedVariance = $derived(scopedBudget.total - scopedBudget.actual);
	let scopedUsagePct = $derived(scopedBudget.total > 0 ? (scopedBudget.actual / scopedBudget.total) * 100 : 0);

	let activeProjects = $derived(projects.filter((p) => p.status === 'in_progress'));
	let activeBudgetTotal = $derived(activeProjects.reduce((sum, p) => sum + (p.project_budget || 0), 0));
	let activeBudgetSpent = $derived(activeProjects.reduce((sum, p) => sum + (p.project_actual_expenses || 0), 0));
	let activeBudgetRemaining = $derived(activeBudgetTotal - activeBudgetSpent);

	let sortedProjects = $derived([...filteredProjects].sort((a, b) => compareProjects(a, b, sortKey, sortDirection)));
	
	// Build status tabs
	let statusTabs = $derived([
		{
			value: 'all', label: 'All', count: projects.length,
			activeClass: '!bg-slate-700 !border-slate-500 !text-slate-100',
			inactiveClass: 'border-slate-700/70 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60',
			countActiveClass: 'bg-slate-500/40',
			countInactiveClass: 'bg-slate-500/20'
		},
		{
			value: 'draft', label: 'Draft', count: stats.byStatus.draft, icon: FileText,
			activeClass: '!bg-zinc-700 !border-zinc-500 !text-zinc-100',
			inactiveClass: 'border-zinc-700/70 bg-zinc-900/30 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50',
			countActiveClass: 'bg-zinc-500/35',
			countInactiveClass: 'bg-zinc-500/20'
		},
		{
			value: 'planned', label: 'Planned', count: stats.byStatus.planned, icon: ClipboardList,
			activeClass: '!bg-blue-700 !border-blue-500 !text-blue-100',
			inactiveClass: 'border-blue-700/70 bg-blue-900/30 text-blue-300 hover:border-blue-500 hover:bg-blue-800/50',
			countActiveClass: 'bg-blue-500/35',
			countInactiveClass: 'bg-blue-500/20'
		},
		{
			value: 'in_progress', label: 'In Progress', count: stats.byStatus.in_progress, icon: PlayCircle,
			activeClass: '!bg-amber-700 !border-amber-500 !text-amber-100',
			inactiveClass: 'border-amber-700/70 bg-amber-900/30 text-amber-300 hover:border-amber-500 hover:bg-amber-800/50',
			countActiveClass: 'bg-amber-500/35',
			countInactiveClass: 'bg-amber-500/20'
		},
		{
			value: 'completed', label: 'Completed', count: stats.byStatus.completed, icon: CheckCircle2,
			activeClass: '!bg-emerald-700 !border-emerald-500 !text-emerald-100',
			inactiveClass: 'border-emerald-700/70 bg-emerald-900/30 text-emerald-300 hover:border-emerald-500 hover:bg-emerald-800/50',
			countActiveClass: 'bg-emerald-500/35',
			countInactiveClass: 'bg-emerald-500/20'
		},
		{
			value: 'cancelled', label: 'Cancelled', count: stats.byStatus.cancelled, icon: XCircle,
			activeClass: '!bg-rose-700 !border-rose-500 !text-rose-100',
			inactiveClass: 'border-rose-700/70 bg-rose-900/30 text-rose-300 hover:border-rose-500 hover:bg-rose-800/50',
			countActiveClass: 'bg-rose-500/35',
			countInactiveClass: 'bg-rose-500/20'
		}
	]);
	
	// Build type tabs
	let typeTabs = $derived([
		{
			value: 'all', label: 'All Types', count: projects.length,
			activeClass: '!bg-slate-700 !text-slate-100',
			inactiveClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700/70',
			countActiveClass: 'bg-slate-500/35',
			countInactiveClass: 'bg-slate-500/20'
		},
		{
			value: 'tournament', label: 'Tournament', count: stats.byType.tournament, icon: Trophy,
			activeClass: '!bg-indigo-700 !text-indigo-100',
			inactiveClass: 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50',
			countActiveClass: 'bg-indigo-500/35',
			countInactiveClass: 'bg-indigo-500/20'
		},
		{
			value: 'activation', label: 'Activation', count: stats.byType.activation, icon: Zap,
			activeClass: '!bg-orange-700 !text-orange-100',
			inactiveClass: 'bg-orange-900/30 text-orange-300 hover:bg-orange-800/50',
			countActiveClass: 'bg-orange-500/35',
			countInactiveClass: 'bg-orange-500/20'
		},
		{
			value: 'event', label: 'Event', count: stats.byType.event, icon: PartyPopper,
			activeClass: '!bg-fuchsia-700 !text-fuchsia-100',
			inactiveClass: 'bg-fuchsia-900/30 text-fuchsia-300 hover:bg-fuchsia-800/50',
			countActiveClass: 'bg-fuchsia-500/35',
			countInactiveClass: 'bg-fuchsia-500/20'
		},
		{
			value: 'campaign', label: 'Campaign', count: stats.byType.campaign, icon: Megaphone,
			activeClass: '!bg-cyan-700 !text-cyan-100',
			inactiveClass: 'bg-cyan-900/30 text-cyan-300 hover:bg-cyan-800/50',
			countActiveClass: 'bg-cyan-500/35',
			countInactiveClass: 'bg-cyan-500/20'
		}
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

	function excerpt(text: string, max = 180): string {
		if (!text) return '-';
		return text.length > max ? `${text.slice(0, max)}...` : text;
	}

	function getVendorNames(project: any): string[] {
		const vendorRecords = project?.expand?.vendors;
		if (!Array.isArray(vendorRecords)) return [];
		return vendorRecords.map((v: any) => v?.name).filter(Boolean);
	}

	function getVendorIds(project: any): string[] {
		return Array.isArray(project?.vendors) ? project.vendors : [];
	}

	function clearFilters() {
		statusFilter = 'all';
		typeFilter = 'all';
		searchQuery = '';
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
			return;
		}

		sortKey = key;
		sortDirection = 'asc';
	}

	function sortState(key: SortKey): 'asc' | 'desc' | 'none' {
		if (sortKey !== key) return 'none';
		return sortDirection;
	}

	function compareProjects(a: any, b: any, key: SortKey, direction: 'asc' | 'desc'): number {
		const multiplier = direction === 'asc' ? 1 : -1;
		const aValue = getSortValue(a, key);
		const bValue = getSortValue(b, key);

		if (typeof aValue === 'number' && typeof bValue === 'number') {
			return (aValue - bValue) * multiplier;
		}

		return String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' }) * multiplier;
	}

	function getSortValue(project: any, key: SortKey): string | number {
		switch (key) {
			case 'name':
				return project.name || '';
			case 'type':
				return project.type || '';
			case 'status':
				return project.status || '';
			case 'budget':
				return project.project_budget || 0;
			case 'description':
				return stripHtml(project.description || '');
			case 'vendors': {
				const names = getVendorNames(project);
				if (names.length > 0) return names.join(', ');
				const ids = getVendorIds(project);
				return ids.length;
			}
			case 'startDate':
				return project.startDate ? new Date(project.startDate).getTime() : 0;
			case 'endDate':
				return project.endDate ? new Date(project.endDate).getTime() : 0;
			default:
				return '';
		}
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

	function typeToneClass(type: string): string {
		switch (type) {
			case 'tournament': return 'border-indigo-700/50 bg-indigo-900/30 text-indigo-300';
			case 'activation': return 'border-orange-700/50 bg-orange-900/30 text-orange-300';
			case 'event': return 'border-fuchsia-700/50 bg-fuchsia-900/30 text-fuchsia-300';
			case 'campaign': return 'border-cyan-700/50 bg-cyan-900/30 text-cyan-300';
			default: return 'border-slate-700/50 bg-slate-900/30 text-slate-300';
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
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
			<Card class="p-5 border-indigo-700/50 bg-gradient-to-br from-indigo-950/50 to-slate-900/50">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-indigo-200">Total Projects</p>
					<FolderKanban class="size-5 text-indigo-300" />
				</div>
				<p class="text-2xl font-bold text-indigo-50">{stats.total}</p>
				<p class="text-xs text-indigo-200/80 mt-1">{stats.byStatus.in_progress} active</p>
			</Card>

			<Card class="p-5 border-emerald-700/50 bg-gradient-to-br from-emerald-950/50 to-slate-900/50">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-emerald-200">Total Budget</p>
					<DollarSign class="size-5 text-emerald-300" />
				</div>
				<p class="text-2xl font-bold text-emerald-50">{formatCurrency(stats.budget.total)}</p>
				<p class="text-xs text-emerald-200/80 mt-1">Allocated across all projects</p>
			</Card>

			<Card class="p-5 border-amber-700/50 bg-gradient-to-br from-amber-950/50 to-slate-900/50">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-amber-200">Actual Spent</p>
					<TrendingUp class="size-5 text-amber-300" />
				</div>
				<p class="text-2xl font-bold text-amber-50">{formatCurrency(stats.budget.actual)}</p>
				<p class="text-xs text-amber-200/80 mt-1">{stats.budget.total > 0 ? `${((stats.budget.actual / stats.budget.total) * 100).toFixed(0)}% of total budget` : 'No budget set'}</p>
			</Card>

			<Card class="p-5 border-violet-700/50 bg-gradient-to-br from-violet-950/50 to-slate-900/50">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-violet-200">Active Budget</p>
					<PlayCircle class="size-5 text-violet-300" />
				</div>
				<p class="text-2xl font-bold text-violet-50">{formatCurrency(activeBudgetTotal)}</p>
				<p class="text-xs text-violet-200/80 mt-1">{formatCurrency(activeBudgetRemaining)} remaining in active projects</p>
			</Card>

			<Card class="p-5 border-cyan-700/50 bg-gradient-to-br from-cyan-950/50 to-slate-900/50">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-cyan-200">Remaining Budget</p>
					<DollarSign class="size-5 text-cyan-300" />
				</div>
				<p class="text-2xl font-bold text-cyan-50">{formatCurrency(stats.budget.remaining)}</p>
				<p class="text-xs text-cyan-200/80 mt-1">Available to spend</p>
			</Card>
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

	<!-- Budget Overview (Collapsible) -->
	<details class="group" aria-label="Budget Utilization">
		<summary class="list-none cursor-pointer">
			<Card class="p-4 border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
				<div class="flex items-center justify-between gap-3">
					<div>
						<h2 class="text-xl font-semibold">Budget Utilization</h2>
						<p class="text-xs text-slate-400 mt-1">Collapsed by default. Expand for budget breakdown and status filter.</p>
					</div>
					<div class="text-slate-400 text-xs group-open:hidden">Show</div>
					<div class="text-slate-400 text-xs hidden group-open:block">Hide</div>
				</div>
			</Card>
		</summary>
		<div class="pt-3">
			<Card class="p-6">
				<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
					<p class="text-sm text-slate-400">Status scope</p>
					<select
						bind:value={budgetStatusFilter}
						class="h-9 rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200"
					>
						<option value="all">All ({projects.length})</option>
						<option value="draft">Draft ({stats.byStatus.draft})</option>
						<option value="planned">Planned ({stats.byStatus.planned})</option>
						<option value="in_progress">In Progress ({stats.byStatus.in_progress})</option>
						<option value="completed">Completed ({stats.byStatus.completed})</option>
						<option value="cancelled">Cancelled ({stats.byStatus.cancelled})</option>
					</select>
				</div>

				<div class="space-y-4">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Total Budget</span>
						<span class="font-semibold">{formatCurrency(scopedBudget.total)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Forecasted</span>
						<span class="font-semibold">{formatCurrency(scopedBudget.forecasted)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Actual Spent</span>
						<span class="font-semibold">{formatCurrency(scopedBudget.actual)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Variance</span>
						<span class="font-semibold" class:text-green-600={scopedVariance > 0} class:text-red-600={scopedVariance < 0}>
							{scopedVariance > 0 ? '+' : ''}{formatCurrency(scopedVariance)}
						</span>
					</div>
					<ProgressBar
						value={scopedBudget.actual}
						max={scopedBudget.total}
						label={`Budget Used ${scopedUsagePct.toFixed(0)}%`}
						size="lg"
					/>
				</div>
			</Card>
		</div>
	</details>



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
		
		<!-- Compact Filters Row -->
		<div class="mb-4 rounded-xl border border-slate-700 bg-slate-900/30 p-4">
			<div class="flex flex-wrap items-start gap-4">
				<div class="min-w-[280px] flex-1">
					<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Filters · Status</h3>
					<VisualTabs
						tabs={statusTabs}
						activeTab={statusFilter}
						onTabChange={(v) => statusFilter = v}
						variant="button"
					/>
				</div>
				<div class="min-w-[280px] flex-1">
					<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Filters · Type</h3>
					<VisualTabs
						tabs={typeTabs}
						activeTab={typeFilter}
						onTabChange={(v) => typeFilter = v}
						variant="pill"
					/>
				</div>
			</div>
		</div>

		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-900 border-b border-slate-700">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('name')}>
									Project Name
									{#if sortState('name') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('name') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('type')}>
									Type
									{#if sortState('type') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('type') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('status')}>
									Status
									{#if sortState('status') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('status') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('budget')}>
									Budget
									{#if sortState('budget') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('budget') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('description')}>
									Description
									{#if sortState('description') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('description') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('vendors')}>
									Vendors
									{#if sortState('vendors') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('vendors') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('startDate')}>
									Start Date
									{#if sortState('startDate') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('startDate') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('endDate')}>
									End Date
									{#if sortState('endDate') === 'asc'}
										<ChevronUp class="size-3.5" />
									{:else if sortState('endDate') === 'desc'}
										<ChevronDown class="size-3.5" />
									{:else}
										<ChevronsUpDown class="size-3.5 text-slate-500" />
									{/if}
								</button>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#if sortedProjects.length === 0}
							<tr>
								<td colspan="8" class="px-6 py-8 text-center text-foreground">
									{#if projects.length === 0}
										No projects found. Create your first project to get started.
									{:else}
										No projects match the selected filters.
									{/if}
								</td>
							</tr>
						{:else}
							{#each sortedProjects as project, i}
								{@const pct = getBudgetPercentage(project)}
								{@const vendorNames = getVendorNames(project)}
								{@const vendorIds = getVendorIds(project)}
								<tr 
									class="border-l-4 {statusToneClass(project.status)} hover:bg-slate-800/60 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-slate-900/40' : ''}"
									onclick={() => window.location.href = `/dashboard/projects/${project.id}`}
								>
									<td class="px-6 py-4">
										<div class="font-medium">{project.name}</div>
										<p class="text-[11px] mt-1 {pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'}">
											Next: {nextAction(project)}
										</p>
									</td>
									<td class="px-6 py-4 text-sm capitalize">
										<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold {typeToneClass(project.type)}">
											{project.type.replace('_', ' ')}
										</span>
									</td>
									<td class="px-6 py-4">
										<StatusBadge status={project.status} />
									</td>
									<td class="px-6 py-4 text-sm font-medium">
										{project.project_budget ? formatCurrency(project.project_budget) : '-'}
									</td>
									<td class="px-6 py-4 text-sm text-slate-300 max-w-md">
										{excerpt(stripHtml(project.description || ''))}
									</td>
									<td class="px-6 py-4">
										{#if vendorNames.length > 0}
											<div class="flex flex-wrap gap-1.5 max-w-xs">
												{#each vendorNames.slice(0, 3) as vendorName}
													<span class="inline-flex items-center rounded-full border border-cyan-700/40 bg-cyan-900/30 px-2 py-0.5 text-[11px] text-cyan-200">
														{vendorName}
													</span>
												{/each}
												{#if vendorNames.length > 3}
													<span class="text-[11px] text-slate-400">+{vendorNames.length - 3} more</span>
												{/if}
											</div>
										{:else if vendorIds.length > 0}
											<span class="text-sm text-slate-300">{vendorIds.length} linked</span>
										{:else}
											<span class="text-sm text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										<div class="flex items-center gap-1">
											<Calendar class="size-3" />
											{formatDate(project.startDate)}
										</div>
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										<div class="flex items-center gap-1">
											<Calendar class="size-3" />
											{formatDate(project.endDate)}
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
