<script lang="ts">
	import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-svelte';
	import Card from '$lib/components/ui/card.svelte';

	interface Props {
		totalBudget: number;
		actualSpent: number;
		forecasted: number;
		approvedExpenses: number;
		pendingExpenses: number;
	}

	let { 
		totalBudget = 0, 
		actualSpent = 0, 
		forecasted = 0,
		approvedExpenses = 0,
		pendingExpenses = 0
	}: Props = $props();

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	// Calculate key metrics
	let burnRate = $derived(totalBudget > 0 ? (actualSpent / totalBudget) * 100 : 0);
	let remaining = $derived(totalBudget - actualSpent);
	let projectedOverrun = $derived(Math.max(0, forecasted - totalBudget));
	let efficiency = $derived(
		forecasted > 0 ? ((totalBudget - forecasted) / totalBudget) * 100 : 0
	);
	
	// Financial health status
	let isOverBudget = $derived(actualSpent > totalBudget);
	let isAtRisk = $derived(forecasted > totalBudget);
	let isWarning = $derived(burnRate > 80 && !isOverBudget);
	let isHealthy = $derived(!isOverBudget && !isAtRisk && !isWarning);

	let statusIcon = $derived(
		isOverBudget ? AlertTriangle :
		isAtRisk ? TrendingDown :
		isWarning ? AlertTriangle :
		CheckCircle2
	);

	let statusColor = $derived(
		isOverBudget ? 'text-red-600 dark:text-red-400' :
		isAtRisk ? 'text-orange-600 dark:text-orange-400' :
		isWarning ? 'text-yellow-600 dark:text-yellow-400' :
		'text-green-600 dark:text-green-400'
	);

	let statusBg = $derived(
		isOverBudget ? 'bg-red-50 dark:bg-slate-900 border-red-200 dark:border-slate-700' :
		isAtRisk ? 'bg-orange-50 dark:bg-slate-900 border-orange-200 dark:border-slate-700' :
		isWarning ? 'bg-yellow-50 dark:bg-slate-900 border-yellow-200 dark:border-slate-700' :
		'bg-green-50 dark:bg-slate-900 border-green-200 dark:border-slate-700'
	);

	let iconBg = $derived(
		isOverBudget ? 'bg-red-100 dark:bg-red-900/50' :
		isAtRisk ? 'bg-orange-100 dark:bg-orange-900/50' :
		isWarning ? 'bg-yellow-100 dark:bg-yellow-900/50' :
		'bg-green-100 dark:bg-green-900/50'
	);

	let statusText = $derived(
		isOverBudget ? 'Over Budget' :
		isAtRisk ? 'At Risk - Forecasted Overrun' :
		isWarning ? 'Warning - High Burn Rate' :
		'Healthy'
	);

	let statusMessage = $derived(
		isOverBudget ? `Currently ${formatCurrency(Math.abs(remaining))} over budget` :
		isAtRisk ? `Projected to exceed budget by ${formatCurrency(projectedOverrun)}` :
		isWarning ? `${burnRate.toFixed(1)}% of budget consumed` :
		`${remaining > 0 ? formatCurrency(remaining) : '$0'} remaining in budget`
	);
</script>

<Card class="p-6">
	<div class="space-y-4">
		<!-- Status Header -->
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold">Financial Health</h3>
			<svelte:component this={statusIcon} class="size-5 text-muted-foreground" />
		</div>
		
		<!-- Status Badge -->
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full {statusBg} border">
			<svelte:component this={statusIcon} class="size-4 {statusColor}" />
			<span class="text-sm {statusColor} font-semibold">{statusText}</span>
		</div>

		<!-- Key Metrics Grid -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="text-xs text-muted-foreground mb-1">Burn Rate</p>
				<p class="text-2xl font-bold {statusColor}">{burnRate.toFixed(1)}%</p>
			</div>
			<div>
				<p class="text-xs text-muted-foreground mb-1">Budget Remaining</p>
				<p class="text-2xl font-bold {remaining < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}">
					{formatCurrency(Math.abs(remaining))}
				</p>
			</div>
		</div>
		
		<!-- Status Message -->
		<p class="text-sm text-muted-foreground">{statusMessage}</p>

		<!-- Additional Metrics -->
		<div class="space-y-3 pt-4 border-t">
			<div class="flex items-center justify-between text-sm">
				<span class="text-foreground">Total Budget</span>
				<span class="font-semibold text-foreground">{formatCurrency(totalBudget)}</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<span class="text-foreground">Actual Spent</span>
				<span class="font-semibold text-foreground">{formatCurrency(actualSpent)}</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<span class="text-foreground">Forecasted Total</span>
				<span class="font-semibold {forecasted > totalBudget ? 'text-orange-500 dark:text-orange-400' : 'text-foreground'}">
					{formatCurrency(forecasted)}
				</span>
			</div>
			{#if projectedOverrun > 0}
				<div class="flex items-center justify-between text-sm">
					<span class="text-foreground">Projected Overrun</span>
					<span class="font-semibold text-red-500 dark:text-red-400">
						{formatCurrency(projectedOverrun)}
					</span>
				</div>
			{/if}
		</div>

		<!-- Expense Pipeline -->
		<div class="space-y-3 pt-4 border-t">
			<h4 class="text-sm font-semibold text-foreground">Expense Pipeline</h4>
			<div class="flex items-center justify-between text-sm">
				<span class="text-foreground">Approved & Paid</span>
				<span class="font-semibold text-green-500 dark:text-green-400">
					{formatCurrency(approvedExpenses)}
				</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<span class="text-foreground">Pending Approval</span>
				<span class="font-semibold text-blue-500 dark:text-blue-400">
					{formatCurrency(pendingExpenses)}
				</span>
			</div>
		</div>

		<!-- Investor Insights -->
		{#if isHealthy}
			<div class="pt-4 border-t">
				<div class="flex items-start gap-2">
					<CheckCircle2 class="size-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
					<p class="text-xs text-foreground">
						Projects are tracking within budget. Financial controls are effective.
					</p>
				</div>
			</div>
		{:else if isAtRisk}
			<div class="pt-4 border-t">
				<div class="flex items-start gap-2">
					<AlertTriangle class="size-4 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
					<p class="text-xs text-foreground">
						Forecasted expenses exceed allocated budget. Review project scopes and consider budget reallocation.
					</p>
				</div>
			</div>
		{:else if isOverBudget}
			<div class="pt-4 border-t">
				<div class="flex items-start gap-2">
					<AlertTriangle class="size-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
					<p class="text-xs text-foreground">
						Current spending exceeds budget. Immediate action required to control costs.
					</p>
				</div>
			</div>
		{/if}
	</div>
</Card>
