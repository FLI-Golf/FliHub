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
	import {
		Building2,
		Users,
		DollarSign,
		FolderKanban,
		Receipt,
		ArrowLeft,
		TrendingUp,
		Calendar
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

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
					{#if dept.department?.headOfDepartmentName}
						<div class="flex items-center gap-2 text-muted-foreground">
							<Users class="size-4" />
							<span>
								Head: {dept.department?.headOfDepartmentName} 
								{dept.department?.expand.headOfDepartment.lastName}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if dept.department?.description}
			<Card class="mt-4 p-4">
				<div class="prose dark:prose-invert max-w-none">
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
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-blue-500 cursor-default">
					<div class="flex items-center justify-between">
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
				</Card>
				<!-- Hover tooltip -->
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border bg-popover text-popover-foreground shadow-xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Budget Breakdown</p>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Total Budget</span>
							<span class="font-semibold">{formatCurrency(metrics.budget.total)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Allocated</span>
							<span class="font-semibold text-blue-600">{formatCurrency(metrics.budget.allocated)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Actual Spent</span>
							<span class="font-semibold text-orange-600">{formatCurrency(metrics.budget.actual)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Forecasted</span>
							<span class="font-semibold text-purple-600">{formatCurrency(metrics.budget.forecasted)}</span>
						</div>
						<div class="h-px bg-border my-1"></div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Remaining</span>
							<span class="font-bold {metrics.budget.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}">
								{formatCurrency(metrics.budget.remaining)}
							</span>
						</div>
						<!-- Mini progress bar -->
						<div class="mt-1">
							<div class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
								<div
									class="h-full rounded-full {metrics.budget.actual / Math.max(metrics.budget.total, 1) > 0.9 ? 'bg-red-500' : metrics.budget.actual / Math.max(metrics.budget.total, 1) > 0.7 ? 'bg-orange-500' : 'bg-blue-500'}"
									style="width: {Math.min(100, (metrics.budget.actual / Math.max(metrics.budget.total, 1)) * 100).toFixed(1)}%"
								></div>
							</div>
							<p class="text-[10px] text-muted-foreground mt-1">
								{((metrics.budget.actual / Math.max(metrics.budget.total, 1)) * 100).toFixed(1)}% of budget used
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Total Projects card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-emerald-500 cursor-default">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Total Projects</p>
							<p class="text-2xl font-bold">{phaseFilteredMetrics.projects.total}</p>
							<p class="text-xs text-muted-foreground mt-1">
								{dept.selectedPhase === 'all' ? 'All phases' : dept.selectedPhase === 'phase1' ? 'Phase 1' : dept.selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
							</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 transition-transform duration-200 group-hover/card:scale-110">
							<FolderKanban class="size-6 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border bg-popover text-popover-foreground shadow-xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Project Status Breakdown</p>
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
										<span class="text-muted-foreground">{row.label}</span>
									</div>
									<span class="font-semibold tabular-nums">{row.count}</span>
								</div>
							{/if}
						{/each}
						<div class="h-px bg-border my-1"></div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Phase 1</span>
							<span class="font-semibold">{metrics.phases.phase1.projectCount}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Phase 2</span>
							<span class="font-semibold">{metrics.phases.phase2.projectCount}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Phase 3</span>
							<span class="font-semibold">{metrics.phases.phase3.projectCount}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Total Expenses card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 border-l-orange-500 cursor-default">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Total Expenses</p>
							<p class="text-2xl font-bold">{formatCurrency(metrics.expenses.totalAmount)}</p>
							<p class="text-xs text-muted-foreground mt-1">{metrics.expenses.total} transactions</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30 transition-transform duration-200 group-hover/card:scale-110">
							<Receipt class="size-6 text-orange-600 dark:text-orange-400" />
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border bg-popover text-popover-foreground shadow-xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Expense Status</p>
						{#each [
							{ label: 'Paid', count: metrics.expenses.paid, color: 'bg-emerald-500' },
							{ label: 'Approved', count: metrics.expenses.approved, color: 'bg-blue-500' },
							{ label: 'Submitted', count: metrics.expenses.submitted, color: 'bg-yellow-500' },
							{ label: 'Draft', count: metrics.expenses.draft, color: 'bg-slate-400' }
						] as row}
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<span class="size-2 rounded-full {row.color} shrink-0"></span>
									<span class="text-muted-foreground">{row.label}</span>
								</div>
								<span class="font-semibold tabular-nums">{row.count}</span>
							</div>
						{/each}
						<div class="h-px bg-border my-1"></div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Approved amount</span>
							<span class="font-semibold text-emerald-600">{formatCurrency(metrics.expenses.approvedAmount)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Pending amount</span>
							<span class="font-semibold text-yellow-600">{formatCurrency(pendingExpenses)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Actual Spent card -->
			<div class="group/card relative">
				<Card class="p-6 transition-all duration-200 group-hover/card:shadow-lg group-hover/card:-translate-y-0.5 border-l-4 {spendPct > 90 ? 'border-l-red-500' : spendPct > 70 ? 'border-l-yellow-500' : 'border-l-violet-500'} cursor-default">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm text-muted-foreground mb-1">Actual Spent</p>
							<p class="text-2xl font-bold">{formatCurrency(phaseFilteredMetrics.budget.actual)}</p>
							<p class="text-xs text-muted-foreground mt-1">
								{dept.selectedPhase === 'all' ? 'All phases' : dept.selectedPhase === 'phase1' ? 'Phase 1' : dept.selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
							</p>
						</div>
						<div class="flex size-12 items-center justify-center rounded-xl {spendPct > 90 ? 'bg-red-100 dark:bg-red-900/30' : spendPct > 70 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-violet-100 dark:bg-violet-900/30'} transition-transform duration-200 group-hover/card:scale-110">
							<TrendingUp class="size-6 {spendPct > 90 ? 'text-red-600 dark:text-red-400' : spendPct > 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-violet-600 dark:text-violet-400'}" />
						</div>
					</div>
				</Card>
				<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
					<div class="rounded-xl border bg-popover text-popover-foreground shadow-xl p-4 text-sm space-y-2.5">
						<p class="font-semibold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Spend Analysis</p>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Actual spent</span>
							<span class="font-semibold">{formatCurrency(phaseFilteredMetrics.budget.actual)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Forecasted</span>
							<span class="font-semibold text-purple-600">{formatCurrency(phaseFilteredMetrics.budget.forecasted)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Budget</span>
							<span class="font-semibold">{formatCurrency(phaseFilteredMetrics.budget.total)}</span>
						</div>
						<div class="h-px bg-border my-1"></div>
						<!-- Stacked bar: actual vs forecasted vs budget -->
						<div>
							<div class="flex h-2 w-full rounded-full overflow-hidden bg-muted gap-px">
								<div class="bg-violet-500 rounded-l-full" style="width: {Math.min(100, spendPct).toFixed(1)}%"></div>
								<div class="bg-purple-300 dark:bg-purple-700"
									style="width: {Math.min(100 - Math.min(100, spendPct), ((phaseFilteredMetrics.budget.forecasted - phaseFilteredMetrics.budget.actual) / Math.max(phaseFilteredMetrics.budget.total, 1)) * 100).toFixed(1)}%">
								</div>
							</div>
							<div class="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
								<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-violet-500 inline-block"></span>Actual {spendPct.toFixed(0)}%</span>
								<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-purple-300 dark:bg-purple-700 inline-block"></span>Forecast</span>
							</div>
						</div>
						<div class="flex justify-between pt-1">
							<span class="text-muted-foreground">Variance</span>
							<span class="font-bold {phaseFilteredMetrics.budget.forecasted <= phaseFilteredMetrics.budget.total ? 'text-emerald-600' : 'text-red-600'}">
								{formatCurrency(phaseFilteredMetrics.budget.total - phaseFilteredMetrics.budget.forecasted)}
							</span>
						</div>
					</div>
				</div>
			</div>

		</div>
	</div>

	<!-- Financial Overview -->
	<div>
		<h2 class="text-2xl font-bold mb-4">
			Financial Overview
			{#if dept.selectedPhase !== 'all'}
				<span class="text-lg font-normal text-muted-foreground">
					- {dept.selectedPhase === 'phase1' ? 'Phase 1' : dept.selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
				</span>
			{/if}
		</h2>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Financial Health Card -->
			<FinancialHealthCard 
				totalBudget={phaseFilteredMetrics.budget.total}
				actualSpent={phaseFilteredMetrics.budget.actual}
				forecasted={phaseFilteredMetrics.budget.forecasted}
				approvedExpenses={metrics.expenses.approvedAmount}
				pendingExpenses={pendingExpenses}
			/>

			<!-- Burn Rate Analysis -->
			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Budget vs Spending</h3>
					<TrendingUp class="size-5 text-muted-foreground" />
				</div>
				<BurnRateChart 
					totalBudget={phaseFilteredMetrics.budget.total}
					actualSpent={phaseFilteredMetrics.budget.actual}
					forecasted={phaseFilteredMetrics.budget.forecasted}
				/>
			</Card>
		</div>
	</div>

	<!-- Charts -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Analytics</h2>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Project Status</h3>
					<FolderKanban class="size-5 text-muted-foreground" />
				</div>
				<ProjectStatusChart 
					draft={metrics.projects.draft}
					planned={metrics.projects.planned}
					active={metrics.projects.in_progress}
					completed={metrics.projects.completed}
					cancelled={metrics.projects.cancelled}
				/>
			</Card>

			<Card class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold">Budget Utilization</h3>
					<DollarSign class="size-5 text-muted-foreground" />
				</div>
				<BudgetDonutChart 
					actual={phaseFilteredMetrics.budget.actual}
					remaining={phaseFilteredMetrics.budget.remaining}
					total={phaseFilteredMetrics.budget.total}
				/>
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

	<!-- Projects List -->
	<div>
		<h2 class="text-2xl font-bold mb-4">
			Projects ({phaseFilteredProjects.length})
			{#if dept.selectedPhase !== 'all'}
				<span class="text-lg font-normal text-muted-foreground">
					- {dept.selectedPhase === 'phase1' ? 'Phase 1' : dept.selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
				</span>
			{/if}
		</h2>
		{#if phaseFilteredProjects.length > 0}
			<Card class="overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-muted border-b">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Project Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
									Budget
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
									Actual
								</th>
								<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
									Forecasted
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
									Dates
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each phaseFilteredProjects as project}
								<tr class="hover:bg-muted/50 transition-colors">
									<td class="px-6 py-4">
										<a href="/dashboard/projects/{project.id}" class="font-medium hover:text-primary">
											{project.name}
										</a>
									</td>
									<td class="px-6 py-4">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
											{project.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
											project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
											project.status === 'planned' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
											'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}">
											{project.status.replace('_', ' ')}
										</span>
									</td>
									<td class="px-6 py-4 text-right font-medium">
										{formatCurrency(project.project_budget || 0)}
									</td>
									<td class="px-6 py-4 text-right font-semibold {(project.project_actual_expenses || 0) > (project.project_budget || 0) ? 'text-red-500' : 'text-green-500'}">
										{formatCurrency(project.project_actual_expenses || 0)}
									</td>
									<td class="px-6 py-4 text-right font-medium text-orange-500">
										{formatCurrency(project.project_forecasted_expenses || 0)}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{#if project.startDate}
											{new Date(project.startDate).toLocaleDateString()}
										{/if}
										{#if project.endDate}
											- {new Date(project.endDate).toLocaleDateString()}
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{:else}
			<Card class="p-8 text-center text-muted-foreground">
				No projects found for this {dept.selectedPhase === 'all' ? 'department' : 'phase'}
			</Card>
		{/if}
	</div>
</div>
