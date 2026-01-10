<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Megaphone, TrendingUp, TrendingDown } from 'lucide-svelte';
	
	interface Props {
		total: number;
		active: number;
		totalBudget: number;
		totalSpend: number;
	}
	
	let { total, active, totalBudget, totalSpend }: Props = $props();
	
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
	
	const spendRate = $derived(totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0);
	const remaining = $derived(totalBudget - totalSpend);
</script>

<Card class="p-6 bg-gradient-to-br from-orange-950 to-amber-900 border-orange-800">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-white">Campaign Performance</h3>
		<Megaphone class="size-6 text-orange-400" />
	</div>
	
	<div class="space-y-4">
		<!-- Total Campaigns -->
		<div class="grid grid-cols-2 gap-4 pb-4 border-b border-orange-800">
			<div>
				<p class="text-sm text-orange-200 mb-1">Total Campaigns</p>
				<p class="text-3xl font-bold text-white">{total}</p>
			</div>
			<div>
				<p class="text-sm text-orange-200 mb-1">Active</p>
				<p class="text-3xl font-bold text-green-400">{active}</p>
			</div>
		</div>

		<!-- Budget Overview -->
		<div>
			<p class="text-sm text-orange-200 mb-2">Total Budget</p>
			<p class="text-2xl font-bold text-white mb-1">{formatCurrency(totalBudget)}</p>
			<div class="flex items-center gap-2 text-xs text-orange-300">
				<span>Spent: {formatCurrency(totalSpend)}</span>
				<span>•</span>
				<span>Remaining: {formatCurrency(remaining)}</span>
			</div>
		</div>

		<!-- Spend Rate -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-sm text-orange-200">Spend Rate</span>
				<div class="flex items-center gap-2">
					{#if spendRate > 90}
						<TrendingUp class="size-4 text-red-400" />
					{:else if spendRate > 70}
						<TrendingUp class="size-4 text-yellow-400" />
					{:else}
						<TrendingDown class="size-4 text-green-400" />
					{/if}
					<span class="text-lg font-bold text-white">{spendRate.toFixed(1)}%</span>
				</div>
			</div>
			<div class="w-full bg-orange-900/50 rounded-full h-2">
				<div 
					class="h-2 rounded-full transition-all duration-300 {
						spendRate > 90 ? 'bg-red-400' : spendRate > 70 ? 'bg-yellow-400' : 'bg-green-400'
					}" 
					style="width: {Math.min(spendRate, 100)}%"
				></div>
			</div>
		</div>
	</div>
</Card>
