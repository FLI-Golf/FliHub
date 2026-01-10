<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { DollarSign, TrendingUp, TrendingDown } from 'lucide-svelte';
	
	interface Props {
		sponsorCommitted: number;
		sponsorPaid: number;
		dealValue: number;
		dealReceived: number;
	}
	
	let { sponsorCommitted, sponsorPaid, dealValue, dealReceived }: Props = $props();
	
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
	
	const totalRevenue = sponsorCommitted + dealValue;
	const totalCollected = sponsorPaid + dealReceived;
	const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
	const outstanding = totalRevenue - totalCollected;
</script>

<Card class="p-6 bg-gradient-to-br from-green-950 to-emerald-900 border-green-800">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-white">Revenue Overview</h3>
		<DollarSign class="size-6 text-green-400" />
	</div>
	
	<div class="space-y-4">
		<!-- Total Committed -->
		<div>
			<p class="text-sm text-green-200 mb-1">Total Committed</p>
			<p class="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
			<div class="mt-2 text-xs text-green-300 space-y-1">
				<div class="flex justify-between">
					<span>Sponsors:</span>
					<span class="font-semibold">{formatCurrency(sponsorCommitted)}</span>
				</div>
				<div class="flex justify-between">
					<span>Franchises:</span>
					<span class="font-semibold">{formatCurrency(dealValue)}</span>
				</div>
			</div>
		</div>
		
		<!-- Total Collected -->
		<div class="pt-4 border-t border-green-800">
			<p class="text-sm text-green-200 mb-1">Total Collected</p>
			<p class="text-2xl font-bold text-white">{formatCurrency(totalCollected)}</p>
			<div class="mt-2 text-xs text-green-300 space-y-1">
				<div class="flex justify-between">
					<span>Sponsors:</span>
					<span class="font-semibold">{formatCurrency(sponsorPaid)}</span>
				</div>
				<div class="flex justify-between">
					<span>Franchises:</span>
					<span class="font-semibold">{formatCurrency(dealReceived)}</span>
				</div>
			</div>
		</div>
		
		<!-- Collection Rate & Outstanding -->
		<div class="pt-4 border-t border-green-800 space-y-3">
			<div class="flex items-center justify-between">
				<span class="text-sm text-green-200">Collection Rate</span>
				<div class="flex items-center gap-2">
					{#if collectionRate >= 50}
						<TrendingUp class="size-4 text-green-400" />
					{:else}
						<TrendingDown class="size-4 text-yellow-400" />
					{/if}
					<span class="text-lg font-bold text-white">{collectionRate.toFixed(1)}%</span>
				</div>
			</div>
			
			<div class="flex items-center justify-between">
				<span class="text-sm text-green-200">Outstanding</span>
				<span class="text-lg font-bold text-yellow-300">{formatCurrency(outstanding)}</span>
			</div>
		</div>
	</div>
</Card>
