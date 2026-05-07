<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { MapPin, CheckCircle2, Clock, Circle, DollarSign, Users } from 'lucide-svelte';

	interface Territory {
		id: string;
		name: string;
		code?: string;
		region: string;
		city?: string;
		state?: string;
		status: string;
		price?: number;
		population?: number;
		marketSize?: string;
	}

	interface Props {
		territories: Territory[];
	}

	let { territories }: Props = $props();

	const groupedByRegion = $derived(
		territories.reduce((acc, t) => {
			const region = t.region || 'Other';
			if (!acc[region]) acc[region] = [];
			acc[region].push(t);
			return acc;
		}, {} as Record<string, Territory[]>)
	);

	const STATUS: Record<string, { card: string; badge: string; dot: string; icon: any; label: string }> = {
		sold:      { card: 'bg-emerald-950/60 border-emerald-600/60 hover:border-emerald-500',      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50', dot: 'bg-emerald-400', icon: CheckCircle2, label: 'Sold' },
		reserved:  { card: 'bg-yellow-950/40  border-yellow-600/60  hover:border-yellow-500',       badge: 'bg-yellow-900/40  text-yellow-300  border-yellow-700/50',  dot: 'bg-yellow-400',  icon: Clock,         label: 'Reserved' },
		available: { card: 'bg-blue-950/40    border-blue-600/60    hover:border-blue-500',         badge: 'bg-blue-900/40    text-blue-300    border-blue-700/50',    dot: 'bg-blue-400',    icon: Circle,        label: 'Available' },
	};

	function s(status: string) {
		return STATUS[status] ?? { card: 'bg-slate-800 border-slate-600', badge: 'bg-slate-700 text-slate-300 border-slate-600', dot: 'bg-slate-400', icon: MapPin, label: status };
	}

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	const fmtPop = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(n);
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-bold text-slate-100">Territory Map</h2>
		<div class="flex items-center gap-4 text-xs text-slate-400">
			{#each Object.values(STATUS) as st}
				<div class="flex items-center gap-1.5">
					<div class="size-2.5 rounded-full {st.dot}"></div>
					<span>{st.label}</span>
				</div>
			{/each}
		</div>
	</div>

	{#if territories.length === 0}
		<div class="text-center text-slate-500 py-12">No territories added yet</div>
	{:else}
		<div class="space-y-8">
			{#each Object.entries(groupedByRegion) as [region, regionTerritories]}
				<div>
					<div class="flex items-center gap-2 mb-3">
						<MapPin class="size-4 text-slate-400" />
						<h3 class="font-semibold text-slate-200">{region}</h3>
						<span class="text-xs text-slate-500">({regionTerritories.length})</span>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each regionTerritories as territory}
							{@const st = s(territory.status)}
							{@const Icon = st.icon}
							<div class="p-4 rounded-xl border-2 {st.card} transition-all duration-200 space-y-3">
								<!-- Header -->
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="font-semibold text-slate-100 truncate">{territory.name}</p>
										{#if territory.city || territory.state}
											<p class="text-xs text-slate-500 mt-0.5">{[territory.city, territory.state].filter(Boolean).join(', ')}</p>
										{/if}
									</div>
									<span class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border {st.badge}">
										<Icon class="size-3" />{st.label}
									</span>
								</div>

								<!-- Meta row -->
								<div class="flex items-center gap-3 text-xs text-slate-500">
									{#if territory.code}
										<span class="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{territory.code}</span>
									{/if}
									{#if territory.marketSize}
										<span class="capitalize">{territory.marketSize} market</span>
									{/if}
									{#if territory.population}
										<span class="flex items-center gap-1"><Users class="size-3" />{fmtPop(territory.population)}</span>
									{/if}
								</div>

								<!-- Price -->
								{#if territory.price}
									<div class="flex items-center gap-1 text-sm font-bold {territory.status === 'sold' ? 'text-emerald-400' : territory.status === 'reserved' ? 'text-yellow-400' : 'text-blue-400'}">
										<DollarSign class="size-3.5" />{fmt(territory.price).replace('$','')}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
