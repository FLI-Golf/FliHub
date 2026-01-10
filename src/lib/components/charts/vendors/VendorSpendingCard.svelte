<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Package, TrendingUp } from 'lucide-svelte';
	
	interface Props {
		total: number;
		active: number;
		totalSpend: number;
		averageSpend: number;
	}
	
	let { total, active, totalSpend, averageSpend }: Props = $props();
	
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
	
	const activePercentage = $derived(total > 0 ? (active / total) * 100 : 0);
</script>

<Card class="p-6 bg-gradient-to-br from-cyan-950 to-blue-900 border-cyan-800">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-white">Vendor Overview</h3>
		<Package class="size-6 text-cyan-400" />
	</div>
	
	<div class="space-y-4">
		<!-- Total Vendors -->
		<div class="grid grid-cols-2 gap-4 pb-4 border-b border-cyan-800">
			<div>
				<p class="text-sm text-cyan-200 mb-1">Total Vendors</p>
				<p class="text-3xl font-bold text-white">{total}</p>
			</div>
			<div>
				<p class="text-sm text-cyan-200 mb-1">Active</p>
				<p class="text-3xl font-bold text-green-400">{active}</p>
				<p class="text-xs text-cyan-300 mt-1">{activePercentage.toFixed(0)}% of total</p>
			</div>
		</div>

		<!-- Total Spending -->
		<div>
			<p class="text-sm text-cyan-200 mb-2">Total Spending</p>
			<p class="text-2xl font-bold text-white mb-1">{formatCurrency(totalSpend)}</p>
			<div class="flex items-center gap-2 text-xs text-cyan-300">
				<TrendingUp class="size-3" />
				<span>Across all vendors</span>
			</div>
		</div>

		<!-- Average Spend -->
		<div class="pt-4 border-t border-cyan-800">
			<div class="flex items-center justify-between">
				<span class="text-sm text-cyan-200">Avg Spend per Vendor</span>
				<span class="text-lg font-bold text-white">{formatCurrency(averageSpend)}</span>
			</div>
		</div>
	</div>
</Card>
