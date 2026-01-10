<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { DollarSign, TrendingUp, Users, Target, Award, Percent } from 'lucide-svelte';
	import ProfitLossStatement from './ProfitLossStatement.svelte';
	import IncomeBreakdown from './IncomeBreakdown.svelte';
	import ExpenseBreakdown from './ExpenseBreakdown.svelte';
	
	let {
		league,
		franchises = [],
		deals = [],
		opportunities = []
	}: {
		league: any;
		franchises?: any[];
		deals?: any[];
		opportunities?: any[];
	} = $props();
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatPercent(value: number): string {
		return `${value.toFixed(1)}%`;
	}
	
	let metrics = $derived({
		totalValue: league.totalFranchiseValue || 0,
		totalPaid: league.totalPaidToDate || 0,
		outstanding: league.totalOutstanding || 0,
		pipeline: league.pipelineValue || 0,
		collectionRate: league.financialMetrics?.revenueMetrics?.collectionRate || 0,
		franchises: {
			total: league.totalFranchises || 0,
			sold: league.soldFranchises || 0,
			available: league.availableFranchises || 0
		},
		deals: {
			active: league.activeFranchiseDeals || 0,
			total: deals.length
		}
	});
</script>

<div class="space-y-6">
	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Franchise Value -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-muted-foreground">Total Franchise Value</p>
					<p class="text-2xl font-bold mt-2">{formatCurrency(metrics.totalValue)}</p>
					<p class="text-xs text-muted-foreground mt-1">
						{metrics.franchises.total} franchises × $10M
					</p>
				</div>
				<div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
					<DollarSign class="size-6 text-blue-600 dark:text-blue-400" />
				</div>
			</div>
		</Card>

		<!-- Total Paid -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-muted-foreground">Total Paid</p>
					<p class="text-2xl font-bold mt-2 text-green-600 dark:text-green-400">
						{formatCurrency(metrics.totalPaid)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						{formatPercent(metrics.collectionRate)} collection rate
					</p>
				</div>
				<div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
					<TrendingUp class="size-6 text-green-600 dark:text-green-400" />
				</div>
			</div>
		</Card>

		<!-- Outstanding Balance -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-muted-foreground">Outstanding</p>
					<p class="text-2xl font-bold mt-2 text-orange-600 dark:text-orange-400">
						{formatCurrency(metrics.outstanding)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						Remaining balance
					</p>
				</div>
				<div class="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
					<Target class="size-6 text-orange-600 dark:text-orange-400" />
				</div>
			</div>
		</Card>

		<!-- Pipeline Value -->
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-muted-foreground">Pipeline Value</p>
					<p class="text-2xl font-bold mt-2 text-purple-600 dark:text-purple-400">
						{formatCurrency(metrics.pipeline)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">
						{opportunities.length} opportunities
					</p>
				</div>
				<div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
					<Award class="size-6 text-purple-600 dark:text-purple-400" />
				</div>
			</div>
		</Card>
	</div>

	<!-- Franchise Breakdown -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Franchise Status -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">Franchise Status</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-3 h-3 rounded-full bg-green-500"></div>
						<span class="text-sm">Sold</span>
					</div>
					<div class="text-right">
						<p class="font-semibold">{metrics.franchises.sold}</p>
						<p class="text-xs text-muted-foreground">
							{formatPercent((metrics.franchises.sold / metrics.franchises.total) * 100)}
						</p>
					</div>
				</div>
				
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-3 h-3 rounded-full bg-blue-500"></div>
						<span class="text-sm">Available</span>
					</div>
					<div class="text-right">
						<p class="font-semibold">{metrics.franchises.available}</p>
						<p class="text-xs text-muted-foreground">
							{formatPercent((metrics.franchises.available / metrics.franchises.total) * 100)}
						</p>
					</div>
				</div>

				<div class="pt-3 border-t">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Total Franchises</span>
						<span class="font-bold">{metrics.franchises.total}</span>
					</div>
				</div>
			</div>
		</Card>

		<!-- Deal Activity -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">Deal Activity</h3>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<span class="text-sm">Active Deals</span>
					<span class="font-semibold">{metrics.deals.active}</span>
				</div>
				
				<div class="flex items-center justify-between">
					<span class="text-sm">Total Deals</span>
					<span class="font-semibold">{metrics.deals.total}</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm">Opportunities</span>
					<span class="font-semibold">{opportunities.length}</span>
				</div>

				{#if league.sponsorConversions}
					<div class="pt-3 border-t">
						<div class="flex items-center justify-between">
							<span class="text-sm">Sponsor Conversions</span>
							<span class="font-semibold text-green-600 dark:text-green-400">
								{league.sponsorConversions}
							</span>
						</div>
						{#if league.totalSponsorDiscounts}
							<p class="text-xs text-muted-foreground mt-1">
								{formatCurrency(league.totalSponsorDiscounts)} in discounts
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</Card>
	</div>

	<!-- Revenue Progress Bar -->
	<Card class="p-6">
		<h3 class="text-lg font-semibold mb-4">Revenue Collection Progress</h3>
		<div class="space-y-3">
			<div class="flex items-center justify-between text-sm">
				<span class="text-muted-foreground">Collected</span>
				<span class="font-medium">{formatPercent(metrics.collectionRate)}</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
				<div 
					class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
					style="width: {metrics.collectionRate}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>{formatCurrency(metrics.totalPaid)} paid</span>
				<span>{formatCurrency(metrics.outstanding)} outstanding</span>
			</div>
		</div>
	</Card>

	<!-- Financial Reporting Section -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- P&L Statement -->
		<ProfitLossStatement
			totalIncome={league.totalIncome || 0}
			totalExpenses={league.totalExpenses || 0}
			grossProfit={league.grossProfit || 0}
			netProfit={league.netProfit || 0}
			profitMargin={league.profitMargin || 0}
		/>

		<!-- Income Breakdown -->
		<IncomeBreakdown
			incomeBreakdown={league.financialMetrics?.incomeBreakdown || {}}
		/>

		<!-- Expense Breakdown -->
		<ExpenseBreakdown
			expenseBreakdown={league.financialMetrics?.expenseBreakdown || {}}
		/>
	</div>
</div>
