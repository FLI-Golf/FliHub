<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { TrendingUp, TrendingDown, DollarSign } from 'lucide-svelte';
	
	let {
		totalIncome = 0,
		totalExpenses = 0,
		grossProfit = 0,
		netProfit = 0,
		profitMargin = 0
	}: {
		totalIncome?: number;
		totalExpenses?: number;
		grossProfit?: number;
		netProfit?: number;
		profitMargin?: number;
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
	
	let isProfitable = $derived(netProfit >= 0);
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold">Profit & Loss Statement</h3>
		<div class="flex items-center gap-2">
			{#if isProfitable}
				<TrendingUp class="size-5 text-green-600 dark:text-green-400" />
			{:else}
				<TrendingDown class="size-5 text-red-600 dark:text-red-400" />
			{/if}
		</div>
	</div>
	
	<div class="space-y-4">
		<!-- Total Income -->
		<div class="flex items-center justify-between py-3 border-b">
			<div>
				<p class="font-medium">Total Income</p>
				<p class="text-xs text-muted-foreground">Revenue from all sources</p>
			</div>
			<p class="text-lg font-bold text-green-600 dark:text-green-400">
				{formatCurrency(totalIncome)}
			</p>
		</div>
		
		<!-- Total Expenses -->
		<div class="flex items-center justify-between py-3 border-b">
			<div>
				<p class="font-medium">Total Expenses</p>
				<p class="text-xs text-muted-foreground">Operating costs</p>
			</div>
			<p class="text-lg font-bold text-red-600 dark:text-red-400">
				{formatCurrency(totalExpenses)}
			</p>
		</div>
		
		<!-- Gross Profit -->
		<div class="flex items-center justify-between py-3 border-b">
			<div>
				<p class="font-medium">Gross Profit</p>
				<p class="text-xs text-muted-foreground">Income - Expenses</p>
			</div>
			<p class="text-lg font-bold {isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
				{formatCurrency(grossProfit)}
			</p>
		</div>
		
		<!-- Net Profit -->
		<div class="flex items-center justify-between py-4 bg-muted/50 rounded-lg px-4">
			<div>
				<p class="font-semibold text-lg">Net Profit</p>
				<p class="text-xs text-muted-foreground">After all adjustments</p>
			</div>
			<div class="text-right">
				<p class="text-2xl font-bold {isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
					{formatCurrency(netProfit)}
				</p>
				<p class="text-sm text-muted-foreground mt-1">
					{formatPercent(profitMargin)} margin
				</p>
			</div>
		</div>
		
		<!-- Profit Margin Indicator -->
		<div class="pt-2">
			<div class="flex items-center justify-between text-xs mb-2">
				<span class="text-muted-foreground">Profit Margin</span>
				<span class="font-medium">{formatPercent(profitMargin)}</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
				<div 
					class="h-full transition-all duration-500 {isProfitable ? 'bg-green-500' : 'bg-red-500'}"
					style="width: {Math.min(Math.abs(profitMargin), 100)}%"
				></div>
			</div>
		</div>
	</div>
</Card>
