<script lang="ts">
	import TerritoryGrid from '$lib/components/franchise/TerritoryGrid.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sold      = $derived(data.territories.filter((t: any) => t.status === 'sold').length);
	const reserved  = $derived(data.territories.filter((t: any) => t.status === 'reserved').length);
	const available = $derived(data.territories.filter((t: any) => t.status === 'available').length);
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-100">Territories</h1>
			<p class="text-slate-400 text-sm mt-1">Franchise territory availability across all regions</p>
		</div>
		<Button href="/dashboard/sales" variant="outline" class="border-slate-600 text-slate-300 hover:bg-slate-700">
			← Franchise Sales
		</Button>
	</div>

	<!-- Summary -->
	<div class="grid grid-cols-3 gap-4">
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Sold</div>
			<div class="text-3xl font-bold text-emerald-300">{sold}</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Reserved</div>
			<div class="text-3xl font-bold text-yellow-300">{reserved}</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Available</div>
			<div class="text-3xl font-bold text-blue-300">{available}</div>
		</div>
	</div>

	<TerritoryGrid territories={data.territories} />
</div>
