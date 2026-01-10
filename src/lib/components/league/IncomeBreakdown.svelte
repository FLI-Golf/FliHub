<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { DollarSign } from 'lucide-svelte';
	
	let {
		incomeBreakdown = {}
	}: {
		incomeBreakdown?: Record<string, number>;
	} = $props();
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	let totalIncome = $derived(
		Object.values(incomeBreakdown).reduce((sum, val) => sum + val, 0)
	);
	
	let sortedIncome = $derived(
		Object.entries(incomeBreakdown)
			.filter(([_, amount]) => amount > 0)
			.sort(([_, a], [__, b]) => b - a)
	);
	
	function getPercentage(amount: number): number {
		return totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
	}
	
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-yellow-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-orange-500'
	];
</script>

<Card class="p-6">
	<div class="flex items-center gap-3 mb-6">
		<div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
			<DollarSign class="size-5 text-green-600 dark:text-green-400" />
		</div>
		<div>
			<h3 class="text-lg font-semibold">Income Breakdown</h3>
			<p class="text-sm text-muted-foreground">Revenue by source</p>
		</div>
	</div>
	
	{#if sortedIncome.length > 0}
		<div class="space-y-4">
			{#each sortedIncome as [category, amount], index}
				{@const percentage = getPercentage(amount)}
				{@const color = colors[index % colors.length]}
				
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full {color}"></div>
							<span class="font-medium">{category}</span>
						</div>
						<div class="text-right">
							<p class="font-semibold">{formatCurrency(amount)}</p>
							<p class="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
						</div>
					</div>
					<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
						<div 
							class="{color} h-full transition-all duration-500"
							style="width: {percentage}%"
						></div>
					</div>
				</div>
			{/each}
			
			<div class="pt-4 border-t">
				<div class="flex items-center justify-between">
					<span class="font-semibold">Total Income</span>
					<span class="text-lg font-bold text-green-600 dark:text-green-400">
						{formatCurrency(totalIncome)}
					</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-muted-foreground">
			<p>No income recorded yet</p>
		</div>
	{/if}
</Card>
