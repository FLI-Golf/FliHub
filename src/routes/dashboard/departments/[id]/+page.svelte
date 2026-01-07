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

	let selectedPhase = $state<string>('all');

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Calculate phase-filtered metrics
	let phaseFilteredMetrics = $derived.by(() => {
		if (selectedPhase === 'all') {
			return data.metrics;
		}
		const phase = data.metrics.phases[selectedPhase as keyof typeof data.metrics.phases];
		return {
			budget: {
				total: data.metrics.budget.total / 3, // Distribute evenly
				allocated: phase?.budget || 0,
				actual: phase?.actual || 0,
				forecasted: phase?.forecasted || 0,
				remaining: (data.metrics.budget.total / 3) - (phase?.actual || 0)
			},
			projects: {
				total: phase?.projectCount || 0,
				draft: 0,
				planned: 0,
				in_progress: 0,
				completed: 0,
				cancelled: 0
			},
			expenses: data.metrics.expenses,
			phases: data.metrics.phases
		};
	});

	// Filter projects by phase
	let phaseFilteredProjects = $derived.by(() => {
		if (selectedPhase === 'all') {
			return data.projects;
		}
		
		const PHASE1_START = new Date('2026-01-01');
		const PHASE1_END = new Date('2026-09-30');
		const PHASE2_START = new Date('2026-10-01');
		const PHASE2_END = new Date('2027-03-31');
		const PHASE3_START = new Date('2027-04-01');
		const PHASE3_END = new Date('2027-12-31');

		function getProjectPhase(project: any): string {
			const startDate = project.startDate ? new Date(project.startDate) : null;
			const name = project.name || '';
			
			if (name.match(/^P1[\s-]/i)) return 'phase1';
			if (name.match(/^P2[\s-]/i)) return 'phase2';
			if (name.match(/^P3[\s-]/i)) return 'phase3';
			
			if (startDate) {
				if (startDate >= PHASE1_START && startDate <= PHASE1_END) return 'phase1';
				if (startDate >= PHASE2_START && startDate <= PHASE2_END) return 'phase2';
				if (startDate >= PHASE3_START && startDate <= PHASE3_END) return 'phase3';
			}
			
			return 'phase1';
		}

		return data.projects.filter(p => getProjectPhase(p) === selectedPhase);
	});

	let pendingExpenses = $derived(
		(data.metrics.expenses.draft + data.metrics.expenses.submitted) * 
		(data.metrics.expenses.totalAmount / Math.max(data.metrics.expenses.total, 1))
	);
</script>

<svelte:head>
	<title>{data.department.name} - Department Details - FliHub</title>
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
					<h1 class="text-4xl font-bold mb-2 tracking-tight">{data.department.name}</h1>
					{#if data.department.code}
						<p class="text-muted-foreground text-base mb-2">Code: {data.department.code}</p>
					{/if}
					{#if data.department.expand?.headOfDepartment}
						<div class="flex items-center gap-2 text-muted-foreground">
							<Users class="size-4" />
							<span>
								Head: {data.department.expand.headOfDepartment.firstName} 
								{data.department.expand.headOfDepartment.lastName}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if data.department.description}
			<Card class="mt-4 p-4">
				<div class="prose dark:prose-invert max-w-none">
					{@html data.department.description}
				</div>
			</Card>
		{/if}
	</div>

	<!-- Phase Filter -->
	<div>
		<PhaseFilter 
			activePhase={selectedPhase}
			onPhaseChange={(phase) => selectedPhase = phase}
		/>
	</div>

	<!-- Key Metrics -->
	<div>
		<h2 class="text-2xl font-bold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground mb-1">Annual Budget</p>
						<p class="text-2xl font-bold">{formatCurrency(data.metrics.budget.total)}</p>
					</div>
					<DollarSign class="size-8 text-blue-500 opacity-50" />
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground mb-1">Total Projects</p>
						<p class="text-2xl font-bold">{phaseFilteredMetrics.projects.total}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{selectedPhase === 'all' ? 'All phases' : selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</p>
					</div>
					<FolderKanban class="size-8 text-green-500 opacity-50" />
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground mb-1">Total Expenses</p>
						<p class="text-2xl font-bold">{formatCurrency(data.metrics.expenses.totalAmount)}</p>
						<p class="text-xs text-muted-foreground mt-1">{data.metrics.expenses.total} transactions</p>
					</div>
					<Receipt class="size-8 text-orange-500 opacity-50" />
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-muted-foreground mb-1">Actual Spent</p>
						<p class="text-2xl font-bold">{formatCurrency(phaseFilteredMetrics.budget.actual)}</p>
						<p class="text-xs text-muted-foreground mt-1">
							{selectedPhase === 'all' ? 'All phases' : selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
						</p>
					</div>
					<TrendingUp class="size-8 text-purple-500 opacity-50" />
				</div>
			</Card>
		</div>
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
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Financial Health Card -->
			<FinancialHealthCard 
				totalBudget={phaseFilteredMetrics.budget.total}
				actualSpent={phaseFilteredMetrics.budget.actual}
				forecasted={phaseFilteredMetrics.budget.forecasted}
				approvedExpenses={data.metrics.expenses.approvedAmount}
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
					draft={data.metrics.projects.draft}
					planned={data.metrics.projects.planned}
					active={data.metrics.projects.in_progress}
					completed={data.metrics.projects.completed}
					cancelled={data.metrics.projects.cancelled}
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
					draft={data.metrics.expenses.draft}
					submitted={data.metrics.expenses.submitted}
					approved={data.metrics.expenses.approved}
					paid={data.metrics.expenses.paid}
				/>
			</Card>
		</div>
	</div>

	<!-- Projects List -->
	<div>
		<h2 class="text-2xl font-bold mb-4">
			Projects ({phaseFilteredProjects.length})
			{#if selectedPhase !== 'all'}
				<span class="text-lg font-normal text-muted-foreground">
					- {selectedPhase === 'phase1' ? 'Phase 1' : selectedPhase === 'phase2' ? 'Phase 2' : 'Phase 3'}
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
				No projects found for this {selectedPhase === 'all' ? 'department' : 'phase'}
			</Card>
		{/if}
	</div>
</div>
