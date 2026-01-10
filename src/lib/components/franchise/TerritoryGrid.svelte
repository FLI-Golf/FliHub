<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { MapPin, CheckCircle2, Clock, Circle } from 'lucide-svelte';
	
	interface Territory {
		id: string;
		name: string;
		region: string;
		status: string;
	}
	
	interface Props {
		territories: Territory[];
	}
	
	let { territories }: Props = $props();
	
	const groupedByRegion = $derived(
		territories.reduce((acc, territory) => {
			const region = territory.region || 'Other';
			if (!acc[region]) {
				acc[region] = [];
			}
			acc[region].push(territory);
			return acc;
		}, {} as Record<string, Territory[]>)
	);
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'sold':
				return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300';
			case 'reserved':
				return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300';
			case 'available':
				return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300';
			default:
				return 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-700 dark:text-gray-300';
		}
	}
	
	function getStatusIcon(status: string) {
		switch (status) {
			case 'sold':
				return CheckCircle2;
			case 'reserved':
				return Clock;
			case 'available':
				return Circle;
			default:
				return MapPin;
		}
	}
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold">Territory Map</h2>
		<div class="flex items-center gap-4 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-green-500"></div>
				<span>Sold</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-yellow-500"></div>
				<span>Reserved</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-blue-500"></div>
				<span>Available</span>
			</div>
		</div>
	</div>

	{#if territories.length === 0}
		<div class="text-center text-muted-foreground py-12">
			No territories available
		</div>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(groupedByRegion) as [region, regionTerritories]}
				<div>
					<h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
						<MapPin class="size-5 text-primary" />
						{region}
						<span class="text-sm text-muted-foreground font-normal">({regionTerritories.length})</span>
					</h3>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each regionTerritories as territory}
							{@const StatusIcon = getStatusIcon(territory.status)}
							<div class="p-3 rounded-lg border-2 {getStatusColor(territory.status)} transition-all hover:shadow-md">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<p class="font-medium">{territory.name}</p>
										<div class="flex items-center gap-1 mt-1">
											<StatusIcon class="size-3" />
											<span class="text-xs capitalize">{territory.status}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
