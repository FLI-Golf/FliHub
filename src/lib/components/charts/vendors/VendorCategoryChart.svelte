<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Layers } from 'lucide-svelte';
	
	interface Props {
		byCategory: Record<string, number>;
	}
	
	let { byCategory }: Props = $props();
	
	const categories = $derived(
		Object.entries(byCategory)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 6)
	);
	
	const total = $derived(
		Object.values(byCategory).reduce((sum, count) => sum + count, 0)
	);

	const colors = [
		'bg-blue-500',
		'bg-purple-500',
		'bg-green-500',
		'bg-yellow-500',
		'bg-red-500',
		'bg-cyan-500'
	];
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-semibold">Vendors by Category</h3>
		<Layers class="size-5 text-muted-foreground" />
	</div>

	{#if categories.length === 0}
		<div class="text-center text-muted-foreground py-8">
			No category data available
		</div>
	{:else}
		<div class="space-y-3">
			{#each categories as [category, count], i}
				{@const percentage = total > 0 ? (count / total) * 100 : 0}
				<div class="space-y-1">
					<div class="flex justify-between text-sm">
						<span class="font-medium">{category}</span>
						<span class="text-muted-foreground">{count} vendors ({percentage.toFixed(0)}%)</span>
					</div>
					<div class="w-full bg-muted rounded-full h-2">
						<div 
							class="h-2 rounded-full transition-all duration-300 {colors[i % colors.length]}" 
							style="width: {percentage}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
