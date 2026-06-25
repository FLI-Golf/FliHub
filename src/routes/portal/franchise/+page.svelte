<script lang="ts">
	import type { PageData } from './$types';
	import { Trophy, MapPin } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config      = $derived((data as any).portalConfig);
	const franchises  = $derived((data as any).franchises  ?? []);
	const territories = $derived((data as any).territories ?? []);
	const accentText  = $derived(config?.accentTw?.split(' ')[0] ?? 'text-yellow-400');
	const accentBorder= $derived(config?.accentTw?.split(' ')[1] ?? 'border-yellow-500');

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
</script>

<svelte:head><title>My Franchise — Franchise Owner Portal · FliHub</title></svelte:head>

<div class="space-y-8">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Trophy class="size-6 {accentText}" /> My Franchise
	</h1>

	<!-- Franchises -->
	{#if franchises.length > 0}
		<div>
			<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Franchises</h2>
			<div class="space-y-3">
				{#each franchises as f}
					<div class="bg-slate-900 border border-slate-800 border-l-4 {accentBorder} rounded-xl p-5">
						<div class="flex items-center justify-between gap-4 mb-2">
							<p class="text-sm font-bold text-white">{f.name}</p>
							{#if f.status}
								<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
									border border-slate-700 text-slate-400">{f.status}</span>
							{/if}
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
							{#if f.city || f.state}
								<div>
									<p class="text-slate-600 mb-0.5">Location</p>
									<p class="text-slate-300 flex items-center gap-1">
										<MapPin class="size-3" />{[f.city, f.state].filter(Boolean).join(', ')}
									</p>
								</div>
							{/if}
							{#if f.fee > 0}
								<div>
									<p class="text-slate-600 mb-0.5">Franchise Fee</p>
									<p class="{accentText} font-semibold">{fmt(f.fee)}</p>
								</div>
							{/if}
							{#if f.owner}
								<div>
									<p class="text-slate-600 mb-0.5">Owner</p>
									<p class="text-slate-300">{f.owner}</p>
								</div>
							{/if}
						</div>
						{#if f.description}
							<p class="text-xs text-slate-600 mt-3 line-clamp-2">{f.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Territories -->
	{#if territories.length > 0}
		<div>
			<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Territories</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each territories as t}
					<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-3">
						<MapPin class="size-4 {accentText} shrink-0" />
						<div class="min-w-0">
							<p class="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
							{#if t.region}<p class="text-xs text-slate-500">{t.region}</p>{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if franchises.length === 0 && territories.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<Trophy class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No franchise data available yet. Contact your admin.</p>
		</div>
	{/if}
</div>
