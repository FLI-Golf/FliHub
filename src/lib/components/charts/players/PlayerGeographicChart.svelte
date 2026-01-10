<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Globe } from 'lucide-svelte';
	
	interface Props {
		byCountry: Record<string, number>;
		topRanked: number;
		withContracts: number;
	}
	
	let { byCountry, topRanked, withContracts }: Props = $props();
	
	const topCountries = $derived(
		Object.entries(byCountry)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
	);
	
	const totalPros = $derived(
		Object.values(byCountry).reduce((sum, count) => sum + count, 0)
	);
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold">Geographic Distribution</h3>
		<Globe class="size-5 text-muted-foreground" />
	</div>

	{#if topCountries.length === 0}
		<div class="text-center text-muted-foreground py-8">
			No geographic data available
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Top Countries -->
			<div class="space-y-3">
				{#each topCountries as [country, count]}
					{@const percentage = totalPros > 0 ? (count / totalPros) * 100 : 0}
					<div class="space-y-1">
						<div class="flex justify-between text-sm">
							<span class="font-medium">{country}</span>
							<span class="text-muted-foreground">{count} pros ({percentage.toFixed(0)}%)</span>
						</div>
						<div class="w-full bg-muted rounded-full h-2">
							<div 
								class="bg-primary h-2 rounded-full transition-all duration-300" 
								style="width: {percentage}%"
							></div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Additional Stats -->
			<div class="pt-4 border-t space-y-3">
				<div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
					<span class="text-sm font-medium">Top 100 Ranked</span>
					<span class="text-lg font-bold text-primary">{topRanked}</span>
				</div>
				<div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
					<span class="text-sm font-medium">With Contracts</span>
					<span class="text-lg font-bold text-green-600">{withContracts}</span>
				</div>
			</div>
		</div>
	{/if}
</Card>
