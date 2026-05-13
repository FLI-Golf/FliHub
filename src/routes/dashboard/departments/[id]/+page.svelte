<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import PhaseFilter from '$lib/components/filters/PhaseFilter.svelte';
	import BudgetDonutChart from '$lib/components/charts/BudgetDonutChart.svelte';
	import ExpenseBarChart from '$lib/components/charts/ExpenseBarChart.svelte';
	import ProjectStatusChart from '$lib/components/charts/ProjectStatusChart.svelte';
	import BurnRateChart from '$lib/components/charts/BurnRateChart.svelte';
	import FinancialHealthCard from '$lib/components/charts/FinancialHealthCard.svelte';
	import { DepartmentProvider } from '$lib/domain/providers/DepartmentProvider.svelte';
	import { invalidateAll } from '$app/navigation';
	import EditDepartmentModal from '$lib/components/departments/edit-department-modal.svelte';
	import TaskExpenseModal from '$lib/components/expenses/task-expense-modal.svelte';
	import {
		Building2,
		Users,
		DollarSign,
		FolderKanban,
		Receipt,
		ArrowLeft,
		TrendingUp,
		Calendar,
		Pencil,
		ChevronDown,
		ChevronRight,
		CheckCircle2,
		Circle,
		Clock,
		AlertCircle
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const rollup = $derived(data.budgetRollup);

	const categoryLabels: Record<string, string> = {
		talent_payment: 'Talent Payments',
		salary:         'Salaries',
		equipment:      'Equipment',
		travel:         'Travel',
		marketing:      'Marketing',
		operations:     'Operations',
		venue:          'Venue',
		technology:     'Technology',
		other:          'Other'
	};

	// Initialise the provider — sets Svelte context so child components
	// can call DepartmentProvider.inject() without prop drilling.
	const dept = DepartmentProvider.provide(data.department);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// All derived state lives in the provider — just alias for template clarity
	const phaseFilteredMetrics  = $derived(dept.filteredMetrics);
	const phaseFilteredProjects = $derived(dept.filteredProjects);
	const pendingExpenses        = $derived(dept.pendingExpenseAmount);
	const spendPct               = $derived(dept.spendPct);
	const metrics                = $derived(dept.metrics!);

	let showEditModal = $state(false);

	// Task expense modal
	let expenseTask       = $state<any>(null);
	let showExpenseModal  = $state(false);
	const tasksByProject  = $derived(data.tasksByProject ?? {});
	$effect(() => {
		console.log('[dept] tasksByProject keys:', Object.keys(tasksByProject));
		console.log('[dept] phaseFilteredProjects ids:', phaseFilteredProjects.map((p: any) => p.id));
	});

	// Project expand/collapse
	let expandedProjects  = $state<Record<string, boolean>>({});
	function toggleProject(id: string) {
		expandedProjects = { ...expandedProjects, [id]: !expandedProjects[id] };
	}

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

	const STATUS_ICON: Record<string, { color: string }> = {
		completed:   { color: 'text-emerald-400' },
		in_progress: { color: 'text-blue-400' },
		blocked:     { color: 'text-red-400' },
		todo:        { color: 'text-slate-500' },
	};
</script>

<svelte:head>
	<title>{dept.department?.name} - Department Details - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div>
		<Button href="/dashboard/departments" variant="ghost" class="mb-4 gap-2">
			<ArrowLeft class="size-4" />
			Back to Departments
		</Button>
		
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-4">
				<div class="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30">
					<Building2 class="size-8 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h1 class="text-4xl font-bold mb-2 tracking-tight">{dept.department?.name}</h1>
					{#if dept.department?.code}
						<p class="text-muted-foreground text-base mb-2">Code: {dept.department?.code}</p>
					{/if}
					<div class="flex items-center gap-2 text-muted-foreground mt-1">
						<Users class="size-4 shrink-0" />
						<select
							class="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-sm text-slate-200 hover:border-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
							value={dept.department?.headOfDepartmentId ?? ''}
							onchange={async (e) => {
								const val = (e.target as HTMLSelectElement).value;
								await fetch(`/api/departments/${dept.department?.id}`, {
									method: 'PATCH',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ headOfDepartment: val || null })
								});
								await invalidateAll();
							}}
						>
							<option value="" class="bg-slate-800 text-slate-400">— No head assigned —</option>
							{#each data.userProfiles as profile}
								<option value={profile.id} class="bg-slate-800">{profile.firstName} {profile.lastName}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
			<Button
				variant="outline"
				class="gap-2 border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
				onclick={() => (showEditModal = true)}
			>
				<Pencil class="size-4" />
				Edit Department
			</Button>
		</div>

		{#if dept.department?.description}
			<Card class="mt-4 p-4 bg-slate-800/60 border-slate-700">
				<div class="prose dark:prose-invert max-w-none text-slate-300">
					{@html dept.department?.description}
				</div>
			</Card>
		{/if}
	</div>

	<!-- Phase Filter -->
	<div>
		<PhaseFilter 
			activePhase={dept.selectedPhase}
			onPhaseChange={(phase) => dept.setPhase(phase as any)}
		/>
	</div>

	<!-- Key Metrics -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

			<!-- Annual Budget card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-blue-500 cursor-default bg-blue-950/40 border-blue-800/50">
					<div class="flex items-center justify-between mb-3">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Annual Budget</p>
							<p class="text-2xl font-bold">{formatCurrency(metrics.budget.total)}</p>
							<p class="text-xs text-muted-foreground mt-1">
								{formatCurrency(metrics.budget.allocated)} allocated to projects
							</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 transition-transform duration-200 group-hover/card:scale-110">
							<DollarSign class="size-6 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
					{@const allocPct = Math.min(100, (metrics.budget.allocated / Math.max(metrics.budget.total, 1)) * 100)}
					<div class="space-y-1">
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>Allocated</span>
							<span>{allocPct.toFixed(0)}%</span>
						</div>
						<div class="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden">
							<div class="h-full rounded-full bg-blue-500 transition-all duration-500" style="width:{allocPct}%"></div>
						</div>
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>{formatCurrency(metrics.budget.allocated)} used</span>
							<span>{formatCurrency(metrics.budget.total - metrics.budget.allocated)} free</span>
						</div>
					</div>
				</Card>
				<!-- Hover tooltip -->
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-1">Budget Breakdown</p>
						<div class="flex justify-between">
							<span class="text-slate-400">Total Budget</span>
							<span class="font-semibold">{formatCurrency(metrics.budget.total)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Allocated</span>
							<span class="font-semibold text-blue-400">{formatCurrency(metrics.budget.allocated)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Actual Spent</span>
							<span class="font-semibold text-orange-400">{formatCurrency(metrics.budget.actual)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Forecasted</span>
							<span class="font-semibold text-purple-400">{formatCurrency(metrics.budget.forecasted)}</span>
						</div>
						<div class="h-px bg-slate-700 my-1"></div>
						<div class="flex justify-between">
							<span class="text-slate-400">Remaining</span>
							<span class="font-bold {metrics.budget.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}">
								{formatCurrency(metrics.budget.remaining)}
							</span>
						</div>
						<!-- Mini progress bar -->
						<div class="mt-1">
							<div class="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
								<div
									class="h-full rounded-full {metrics.budget.actual / Math.max(metrics.budget.total, 1) > 0.9 ? 'bg-red-500' : metrics.budget.actual / Math.max(metrics.budget.total, 1) > 0.7 ? 'bg-orange-500' : 'bg-blue-500'}"
									style="width: {Math.min(100, (metrics.budget.actual / Math.max(metrics.budget.total, 1)) * 100).toFixed(1)}%"
								></div>
							</div>
							<p class="text-[10px] text-slate-400 mt-1">
								{((metrics.budget.actual / Math.max(metrics.budget.total, 1)) * 100).toFixed(1)}% of budget used
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Total Projects card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-emerald-500 cursor-default bg-emerald-950/40 border-emerald-800/50">
					<div class="flex items-center justify-between mb-3">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Total Projects</p>
							<p class="text-2xl font-bold">{phaseFilteredMetrics.projects.total}</p>
							<p class="text-xs text-muted-foreground mt-1">
								{dept.selectedPhase === 'all' ? 'Combined' : dept.selectedPhase === 'phase1' ? 'Phase 1 — Pre-Tournaments' : 'Phase 2 — Tournaments Live'}
							</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 transition-transform duration-200 group-hover/card:scale-110">
							<FolderKanban class="size-6 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					{@const donePct = Math.min(100, (phaseFilteredMetrics.projects.completed / Math.max(phaseFilteredMetrics.projects.total, 1)) * 100)}
					{@const activePct = Math.min(100 - donePct, (phaseFilteredMetrics.projects.in_progress / Math.max(phaseFilteredMetrics.projects.total, 1)) * 100)}
					<div class="space-y-1">
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>Completion</span>
							<span>{donePct.toFixed(0)}%</span>
						</div>
						<div class="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden flex">
							<div class="h-full bg-emerald-500 transition-all duration-500" style="width:{donePct}%"></div>
							<div class="h-full bg-blue-400/70 transition-all duration-500" style="width:{activePct}%"></div>
						</div>
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>{phaseFilteredMetrics.projects.completed} done · {phaseFilteredMetrics.projects.in_progress} active</span>
							<span>{phaseFilteredMetrics.projects.total - phaseFilteredMetrics.projects.completed - phaseFilteredMetrics.projects.in_progress} planned</span>
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-1">Project Status Breakdown</p>
						{#each [
							{ label: 'In Progress', count: metrics.projects.in_progress, color: 'bg-blue-500' },
							{ label: 'Planned', count: metrics.projects.planned, color: 'bg-yellow-500' },
							{ label: 'Completed', count: metrics.projects.completed, color: 'bg-emerald-500' },
							{ label: 'Draft', count: metrics.projects.draft, color: 'bg-slate-400' },
							{ label: 'Cancelled', count: metrics.projects.cancelled, color: 'bg-red-400' }
						] as row}
							{#if row.count > 0}
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<span class="size-2 rounded-full {row.color} shrink-0"></span>
										<span class="text-slate-400">{row.label}</span>
									</div>
									<span class="font-semibold tabular-nums">{row.count}</span>
								</div>
							{/if}
						{/each}
						<div class="h-px bg-slate-700 my-1"></div>
						<div class="flex justify-between">
							<span class="text-slate-400">Phase 1 — Pre-Tournaments</span>
							<span class="font-semibold">{metrics.phases.phase1.projectCount}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Phase 2 — Tournaments Live</span>
							<span class="font-semibold">{metrics.phases.phase2.projectCount}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Total Expenses card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-orange-500 cursor-default bg-orange-950/40 border-orange-800/50">
					<div class="flex items-center justify-between mb-3">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Total Expenses</p>
							<p class="text-2xl font-bold">{formatCurrency(metrics.expenses.totalAmount)}</p>
							<p class="text-xs text-muted-foreground mt-1">{metrics.expenses.total} transactions</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 transition-transform duration-200 group-hover/card:scale-110">
							<Receipt class="size-6 text-orange-600 dark:text-orange-400" />
						</div>
					</div>
					{@const ePaid     = Math.min(100, (metrics.expenses.approvedAmount / Math.max(metrics.expenses.totalAmount, 1)) * 100)}
					{@const ePending  = Math.min(100 - ePaid, (pendingExpenses / Math.max(metrics.expenses.totalAmount, 1)) * 100)}
					<div class="space-y-1">
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>Approved</span>
							<span>{ePaid.toFixed(0)}%</span>
						</div>
						<div class="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden flex">
							<div class="h-full bg-emerald-500 transition-all duration-500" style="width:{ePaid}%"></div>
							<div class="h-full bg-yellow-400/70 transition-all duration-500" style="width:{ePending}%"></div>
						</div>
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>{formatCurrency(metrics.expenses.approvedAmount)} approved</span>
							<span>{formatCurrency(pendingExpenses)} pending</span>
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-orange-400 mb-1">Expense Status</p>
						{#each [
							{ label: 'Paid', count: metrics.expenses.paid, color: 'bg-emerald-500' },
							{ label: 'Approved', count: metrics.expenses.approved, color: 'bg-blue-500' },
							{ label: 'Submitted', count: metrics.expenses.submitted, color: 'bg-yellow-500' },
							{ label: 'Draft', count: metrics.expenses.draft, color: 'bg-slate-400' }
						] as row}
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<span class="size-2 rounded-full {row.color} shrink-0"></span>
									<span class="text-slate-400">{row.label}</span>
								</div>
								<span class="font-semibold tabular-nums">{row.count}</span>
							</div>
						{/each}
						<div class="h-px bg-slate-700 my-1"></div>
						<div class="flex justify-between">
							<span class="text-slate-400">Approved amount</span>
							<span class="font-semibold text-emerald-600">{formatCurrency(metrics.expenses.approvedAmount)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Pending amount</span>
							<span class="font-semibold text-yellow-400">{formatCurrency(pendingExpenses)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Actual Spent card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 {spendPct > 90 ? 'border-l-red-500 bg-red-950/40 border-red-800/50' : spendPct > 70 ? 'border-l-yellow-500 bg-yellow-950/40 border-yellow-800/50' : 'border-l-violet-500 bg-violet-950/40 border-violet-800/50'} cursor-default">
					<div class="flex items-center justify-between mb-3">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Actual Spent</p>
							<p class="text-2xl font-bold">{formatCurrency(phaseFilteredMetrics.budget.actual)}</p>
							<p class="text-xs text-muted-foreground mt-1">
								{dept.selectedPhase === 'all' ? 'Combined' : dept.selectedPhase === 'phase1' ? 'Phase 1 — Pre-Tournaments' : 'Phase 2 — Tournaments Live'}
							</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl {spendPct > 90 ? 'bg-red-100 dark:bg-red-900/30' : spendPct > 70 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-violet-100 dark:bg-violet-900/30'} transition-transform duration-200 group-hover/card:scale-110">
							<TrendingUp class="size-6 {spendPct > 90 ? 'text-red-600 dark:text-red-400' : spendPct > 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-violet-600 dark:text-violet-400'}" />
						</div>
					</div>
					{@const spendBar = Math.min(100, spendPct)}
					{@const barColor = spendPct > 90 ? 'bg-red-500' : spendPct > 70 ? 'bg-yellow-400' : 'bg-violet-500'}
					<div class="space-y-1">
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>of budget used</span>
							<span>{spendPct.toFixed(0)}%</span>
						</div>
						<div class="h-2 w-full rounded-full bg-slate-700/60 overflow-hidden">
							<div class="h-full rounded-full {barColor} transition-all duration-500" style="width:{spendBar}%"></div>
						</div>
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>{formatCurrency(phaseFilteredMetrics.budget.actual)} spent</span>
							<span>{formatCurrency(phaseFilteredMetrics.budget.total - phaseFilteredMetrics.budget.actual)} left</span>
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-violet-400 mb-1">Spend Analysis</p>
						<div class="flex justify-between">
							<span class="text-slate-400">Actual spent</span>
							<span class="font-semibold">{formatCurrency(phaseFilteredMetrics.budget.actual)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Forecasted</span>
							<span class="font-semibold text-purple-400">{formatCurrency(phaseFilteredMetrics.budget.forecasted)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Budget</span>
							<span class="font-semibold">{formatCurrency(phaseFilteredMetrics.budget.total)}</span>
						</div>
						<div class="h-px bg-slate-700 my-1"></div>
						<!-- Stacked bar: actual vs forecasted vs budget -->
						<div>
							<div class="flex h-2 w-full rounded-full overflow-hidden bg-slate-700 gap-px">
								<div class="bg-violet-500 rounded-l-full" style="width: {Math.min(100, spendPct).toFixed(1)}%"></div>
								<div class="bg-purple-300 dark:bg-purple-700"
									style="width: {Math.min(100 - Math.min(100, spendPct), ((phaseFilteredMetrics.budget.forecasted - phaseFilteredMetrics.budget.actual) / Math.max(phaseFilteredMetrics.budget.total, 1)) * 100).toFixed(1)}%">
								</div>
							</div>
							<div class="flex gap-3 mt-1.5 text-[10px] text-slate-400">
								<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-violet-500 inline-block"></span>Actual {spendPct.toFixed(0)}%</span>
								<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-purple-300 dark:bg-purple-700 inline-block"></span>Forecast</span>
							</div>
						</div>
						<div class="flex justify-between pt-1">
							<span class="text-slate-400">Variance</span>
							<span class="font-bold {phaseFilteredMetrics.budget.forecasted <= phaseFilteredMetrics.budget.total ? 'text-emerald-600' : 'text-red-600'}">
								{formatCurrency(phaseFilteredMetrics.budget.total - phaseFilteredMetrics.budget.forecasted)}
							</span>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>

	<!-- Expense Pipeline -->
	{#if rollup}
		{@const fmt = (n) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(n ?? 0)}
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">Expense Pipeline</h2>

			<!-- Stat tiles -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Dept Budget</div>
					<div class="text-2xl font-bold text-slate-100">{fmt(rollup.allocated)}</div>
				</div>
				<div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Paid</div>
					<div class="text-2xl font-bold text-emerald-400">{fmt(rollup.paid)}</div>
				</div>
				<div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Committed</div>
					<div class="text-2xl font-bold text-blue-400">{fmt(rollup.approved + rollup.submitted)}</div>
					<div class="text-xs text-slate-500 mt-1">{fmt(rollup.approved)} approved · {fmt(rollup.submitted)} submitted</div>
				</div>
				<div class="bg-slate-800 border border-slate-700 rounded-xl p-4">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">{rollup.remaining < 0 ? 'Over Budget' : 'Remaining'}</div>
					<div class="text-2xl font-bold {rollup.remaining < 0 ? 'text-red-400' : 'text-cyan-400'}">{fmt(Math.abs(rollup.remaining))}</div>
				</div>
			</div>

			<!-- Pipeline bar -->
			{#if rollup.allocated > 0}
				<Card class="p-5 space-y-2">
					<div class="flex items-center justify-between text-xs">
						<span class="text-muted-foreground font-medium flex items-center gap-1.5">
							<DollarSign class="size-3.5" />Expense Pipeline
						</span>
						<span class="tabular-nums text-slate-300">{fmt(rollup.allocated)}</span>
					</div>
					<div class="h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-700">
						{#if rollup.pipelinePct.paid > 0}
							<div class="h-full bg-emerald-500 shrink-0 transition-all duration-500" style="width:{rollup.pipelinePct.paid.toFixed(2)}%"></div>
						{/if}
						{#if rollup.pipelinePct.approved > 0}
							<div class="h-full bg-blue-500 shrink-0 transition-all duration-500" style="width:{rollup.pipelinePct.approved.toFixed(2)}%"></div>
						{/if}
						{#if rollup.pipelinePct.submitted > 0}
							<div class="h-full bg-amber-400 shrink-0 transition-all duration-500" style="width:{rollup.pipelinePct.submitted.toFixed(2)}%"></div>
						{/if}
						{#if rollup.pipelinePct.inTasks > 0}
							<div class="h-full bg-violet-500/80 shrink-0 transition-all duration-500" style="width:{rollup.pipelinePct.inTasks.toFixed(2)}%"></div>
						{/if}
					</div>
					<div class="flex flex-wrap gap-x-3 text-[10px]">
						<span class="flex items-center gap-1 {rollup.paid > 0 ? 'text-emerald-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Paid {rollup.paid > 0 ? fmt(rollup.paid) : '—'}</span>
						<span class="flex items-center gap-1 {rollup.approved > 0 ? 'text-blue-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-blue-500 shrink-0"></span>Approved {rollup.approved > 0 ? fmt(rollup.approved) : '—'}</span>
						<span class="flex items-center gap-1 {rollup.submitted > 0 ? 'text-amber-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-amber-400 shrink-0"></span>Submitted {rollup.submitted > 0 ? fmt(rollup.submitted) : '—'}</span>
						<span class="flex items-center gap-1 {rollup.inTasks > 0 ? 'text-violet-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-violet-500 shrink-0"></span>In Tasks {rollup.inTasks > 0 ? fmt(rollup.inTasks) : '—'}</span>
						{#if rollup.unallocated > 0}
							<span class="text-slate-500 ml-auto">{fmt(rollup.unallocated)} unallocated</span>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- Spend by category -->
			{#if Object.keys(rollup.expensesByCategory).length > 0}
				<Card class="p-5">
					<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Spend by Category</h3>
					<div class="space-y-2">
						{#each Object.entries(rollup.expensesByCategory).sort((a, b) => b[1] - a[1]) as [cat, amt]}
							{@const pct = rollup.actual > 0 ? (amt / rollup.actual) * 100 : 0}
							<div class="flex items-center gap-3">
								<div class="w-28 text-xs text-slate-400 shrink-0">{categoryLabels[cat] ?? cat}</div>
								<div class="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
									<div class="h-full bg-violet-500 rounded-full" style="width:{pct}%"></div>
								</div>
								<div class="w-24 text-right text-xs font-medium text-slate-200">{fmt(amt)}</div>
								<div class="w-10 text-right text-xs text-slate-500">{pct.toFixed(0)}%</div>
							</div>
						{/each}
					</div>
				</Card>
			{/if}
		</div>
	{/if}

	<!-- Financial Overview -->
	<div>
		<h2 class="text-2xl font-bold mb-4">
			Financial Overview
			{#if dept.selectedPhase !== 'all'}
				<span class="text-lg font-normal text-muted-foreground">
					- {dept.selectedPhase === 'phase1' ? 'Phase 1 — Pre-Tournaments' : 'Phase 2 — Tournaments Live'}
				</span>
			{/if}
		</h2>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Financial Health Card -->
			<FinancialHealthCard 
				totalBudget={rollup?.allocated ?? phaseFilteredMetrics.budget.total}
				actualSpent={rollup?.actual ?? phaseFilteredMetrics.budget.actual}
				forecasted={phaseFilteredMetrics.budget.forecasted}
				approvedExpenses={rollup?.approved ?? metrics.expenses.approvedAmount}
				pendingExpenses={rollup?.submitted ?? pendingExpenses}
			/>

			<!-- Burn Rate Analysis -->
			<Card class="p-6 bg-slate-800/60 border-slate-700">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-slate-100">Budget vs Spending</h3>
					<TrendingUp class="size-5 text-slate-400" />
				</div>
				<BurnRateChart 
					totalBudget={rollup?.allocated ?? phaseFilteredMetrics.budget.total}
					actualSpent={rollup?.actual ?? phaseFilteredMetrics.budget.actual}
					forecasted={phaseFilteredMetrics.budget.forecasted}
				/>
			</Card>
		</div>
	</div>

	<!-- Charts -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Analytics</h2>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<Card class="p-6 bg-emerald-950/30 border-emerald-800/40">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-emerald-100">Project Status</h3>
					<FolderKanban class="size-5 text-emerald-400" />
				</div>
				<ProjectStatusChart 
					draft={metrics.projects.draft}
					planned={metrics.projects.planned}
					active={metrics.projects.in_progress}
					completed={metrics.projects.completed}
					cancelled={metrics.projects.cancelled}
				/>
			</Card>

			<Card class="p-6 bg-blue-950/30 border-blue-800/40">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-blue-100">Budget Utilization</h3>
					<DollarSign class="size-5 text-blue-400" />
				</div>
				<BudgetDonutChart 
					actual={rollup?.actual ?? phaseFilteredMetrics.budget.actual}
					remaining={rollup?.remaining ?? phaseFilteredMetrics.budget.remaining}
					total={rollup?.allocated ?? phaseFilteredMetrics.budget.total}
				/>
			</Card>

			<Card class="p-6 bg-orange-950/30 border-orange-800/40">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-orange-100">Expense Status</h3>
					<Receipt class="size-5 text-orange-400" />
				</div>
				<ExpenseBarChart 
					draft={rollup?.draft ?? 0}
					submitted={rollup?.submitted ?? 0}
					approved={rollup?.approved ?? 0}
					paid={rollup?.paid ?? 0}
				/>
			</Card>
		</div>
	</div>

	<!-- Projects + Tasks -->
	<div>
		<h2 class="text-2xl font-bold mb-4">
			Projects ({phaseFilteredProjects.length})
			{#if dept.selectedPhase !== 'all'}
				<span class="text-lg font-normal text-muted-foreground">
					- {dept.selectedPhase === 'phase1' ? 'Phase 1 — Pre-Tournaments' : 'Phase 2 — Tournaments Live'}
				</span>
			{/if}
		</h2>
		{#if phaseFilteredProjects.length > 0}
			<div class="space-y-3">
				{#each phaseFilteredProjects as project (project.id)}
					{@const tasks = tasksByProject[project.id] ?? []}
					{@const isExpanded = !!expandedProjects[project.id]}
					<Card class="overflow-hidden p-0 border-slate-700">
						<!-- Project header row -->
						<button
							type="button"
							onclick={() => toggleProject(project.id)}
							class="w-full flex items-center gap-4 px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
						>
							{#if isExpanded}
								<ChevronDown class="size-4 text-slate-400 shrink-0" />
							{:else}
								<ChevronRight class="size-4 text-slate-400 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<a
									href="/dashboard/projects/{project.id}"
									onclick={(e) => e.stopPropagation()}
									class="font-semibold text-slate-100 hover:text-blue-400 transition-colors"
								>{project.name}</a>
							</div>
							<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0
								{project.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' :
								 project.status === 'completed'   ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' :
								 project.status === 'planned'     ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' :
								 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}">
								{project.status.replace('_', ' ')}
							</span>
							<div class="text-right shrink-0 hidden sm:block">
								<p class="text-xs text-slate-500">Budget</p>
								<p class="text-sm font-semibold text-slate-200">{fmt(project.budget || 0)}</p>
							</div>
							<div class="text-right shrink-0 hidden sm:block">
								<p class="text-xs text-slate-500">Tasks</p>
								<p class="text-sm font-semibold text-slate-300">{tasks.length}</p>
							</div>
						</button>

						<!-- Task rows -->
						{#if isExpanded}
							{#if tasks.length === 0}
								<p class="px-5 py-3 text-sm text-slate-500 border-t border-slate-700">No tasks for this project.</p>
							{:else}
								<div class="divide-y divide-slate-700/60 border-t border-slate-700">
									{#each tasks as task (task.id)}
										{@const s = STATUS_ICON[task.status] ?? STATUS_ICON.todo}
										<div class="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
											<!-- Status icon -->
											<div class="shrink-0">
												{#if task.status === 'completed'}
													<CheckCircle2 class="size-4 {s.color}" />
												{:else if task.status === 'in_progress'}
													<Clock class="size-4 {s.color}" />
												{:else if task.status === 'blocked'}
													<AlertCircle class="size-4 {s.color}" />
												{:else}
													<Circle class="size-4 {s.color}" />
												{/if}
											</div>
											<!-- Title -->
											<p class="flex-1 text-sm text-slate-300 truncate">{task.title}</p>
											<!-- needs_review dot -->
											{#if task.needs_review}
												<span class="relative flex size-2 shrink-0">
													<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
													<span class="relative inline-flex rounded-full size-2 bg-amber-500"></span>
												</span>
											{/if}
											<!-- Budget -->
											{#if task.task_budget}
												<span class="text-xs text-slate-500 shrink-0">{fmt(task.task_budget)}</span>
											{/if}
											<!-- Log Expense button -->
											<button
												type="button"
												onclick={() => { expenseTask = task; showExpenseModal = true; }}
												class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-600/40 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-colors"
											>
												<Receipt class="size-3" /> Log Expense
											</button>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</Card>
				{/each}
			</div>
		{:else}
			<Card class="p-8 text-center text-slate-400 bg-slate-800/40 border-slate-700">
				No projects found for this {dept.selectedPhase === 'all' ? 'department' : 'phase'}
			</Card>
		{/if}
	</div>
</div>

{#if showExpenseModal && expenseTask}
	<TaskExpenseModal
		task={expenseTask}
		bind:open={showExpenseModal}
	/>
{/if}

<EditDepartmentModal
	bind:open={showEditModal}
	department={dept.department}
	allUserProfiles={data.userProfiles}
/>
