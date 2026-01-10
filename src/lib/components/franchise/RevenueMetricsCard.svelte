<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-svelte';
	
	interface Props {
		committed: number;
		received: number;
		outstanding: number;
		averageDealSize: number;
		collectionRate: number;
	}
	
	let { committed, received, outstanding, averageDealSize, collectionRate }: Props = $props();
	
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
</script>

<Card class="p-6 bg-gradient-to-br from-emerald-950 to-green-900 border-emerald-800">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold text-white">Revenue Metrics</h2>
		<DollarSign class="size-8 text-emerald-400" />
	</div>
	
	<div class="space-y-6">
		<!-- Committed Revenue -->
		<div>
			<p class="text-sm text-emerald-200 mb-1">Total Committed</p>
			<p class="text-4xl font-bold text-white">{formatCurrency(committed)}</p>
		</div>

		<!-- Received vs Outstanding -->
		<div class="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-800">
			<div>
				<p class="text-sm text-emerald-200 mb-1">Received</p>
				<p class="text-2xl font-bold text-green-400">{formatCurrency(received)}</p>
			</div>
			<div>
				<p class="text-sm text-emerald-200 mb-1">Outstanding</p>
				<p class="text-2xl font-bold text-yellow-400">{formatCurrency(outstanding)}</p>
			</div>
		</div>

		<!-- Collection Rate -->
		<div class="pt-4 border-t border-emerald-800">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-emerald-200">Collection Rate</span>
				<div class="flex items-center gap-2">
					{#if collectionRate >= 75}
						<TrendingUp class="size-4 text-green-400" />
					{:else if collectionRate >= 50}
						<AlertCircle class="size-4 text-yellow-400" />
					{:else}
						<TrendingDown class="size-4 text-red-400" />
					{/if}
					<span class="text-2xl font-bold text-white">{collectionRate.toFixed(1)}%</span>
				</div>
			</div>
			<div class="w-full bg-emerald-900/50 rounded-full h-2">
				<div 
					class="h-2 rounded-full transition-all duration-300 {
						collectionRate >= 75 ? 'bg-green-400' : collectionRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'
					}" 
					style="width: {Math.min(collectionRate, 100)}%"
				></div>
			</div>
		</div>

		<!-- Average Deal Size -->
		<div class="pt-4 border-t border-emerald-800">
			<div class="flex items-center justify-between">
				<span class="text-sm text-emerald-200">Avg Deal Size</span>
				<span class="text-xl font-bold text-white">{formatCurrency(averageDealSize)}</span>
			</div>
		</div>
	</div>
</Card>
