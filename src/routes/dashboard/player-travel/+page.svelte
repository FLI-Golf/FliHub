<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Plane,
		Hotel,
		Users,
		TrendingUp,
		Globe,
		MapPin,
		ChevronRight,
		Info,
		DollarSign
	} from 'lucide-svelte';

	// ── Data ────────────────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		flights: number;
		hotels: number;
		total: number;
		perPlayer: number;
		perEvent: number;
		multiplier: string | null;
		phase: string;
		phaseLabel: string;
		drivers: string[];
	};

	const years: YearRow[] = [
		{
			year: 2027,
			flights: 122_000,
			hotels: 116_000,
			total: 238_000,
			perPlayer: 6_611,
			perEvent: 39_667,
			multiplier: null,
			phase: 'Centralized',
			phaseLabel: 'Centralized Operations',
			drivers: ['Predictable domestic routes', 'Centralized travel management', '32 US + 4 international players']
		},
		{
			year: 2028,
			flights: 214_200,
			hotels: 142_800,
			total: 357_000,
			perPlayer: 9_917,
			perEvent: 59_500,
			multiplier: '1.5×',
			phase: 'Growth',
			phaseLabel: 'Controlled Growth',
			drivers: ['Increased routing complexity', 'Early multi-location planning', 'Higher flight variability']
		},
		{
			year: 2029,
			flights: 428_400,
			hotels: 285_600,
			total: 714_000,
			perPlayer: 19_833,
			perEvent: 119_000,
			multiplier: '2.0×',
			phase: 'Expansion',
			phaseLabel: 'Structural Expansion',
			drivers: ['Multi-location tournament structure', 'Increased international player movement', 'Duplication of travel cycles']
		},
		{
			year: 2030,
			flights: 642_600,
			hotels: 428_400,
			total: 1_071_000,
			perPlayer: 29_750,
			perEvent: 178_500,
			multiplier: '1.5×',
			phase: 'Global',
			phaseLabel: 'Global Scaling',
			drivers: ['Full international scheduling', 'Long-haul routing', 'Multi-region operations']
		},
		{
			year: 2031,
			flights: 642_600,
			hotels: 428_400,
			total: 1_071_000,
			perPlayer: 29_750,
			perEvent: 178_500,
			multiplier: 'Flat',
			phase: 'Stable',
			phaseLabel: 'Stabilization',
			drivers: ['Optimized routing', 'Established travel partnerships', 'Stabilized global footprint']
		}
	];

	const phaseColors: Record<string, string> = {
		Centralized: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Growth:      'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Expansion:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Global:      'bg-violet-500/10 text-violet-400 border-violet-500/30',
		Stable:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const playerDistribution = [
		{ region: 'United States', count: 32, flag: '🇺🇸' },
		{ region: 'Finland',       count: 3,  flag: '🇫🇮' },
		{ region: 'Estonia',       count: 1,  flag: '🇪🇪' }
	];

	const costControls = [
		'Airline partnerships',
		'Hotel block agreements',
		'Centralized booking systems',
		'Early scheduling optimization'
	];

	const maxTotal = Math.max(...years.map(y => y.total));

	function fmt(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}

	function pct(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let selectedYear = $state(2027);
	const selected = $derived(years.find(y => y.year === selectedYear)!);

	// flight share of total for selected year
	const flightShare = $derived(Math.round((selected.flights / selected.total) * 100));
	const hotelShare  = $derived(100 - flightShare);
</script>

<svelte:head>
	<title>Player Travel Budget - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Player Travel Budget</h1>
		<p class="text-muted-foreground">
			Flights &amp; hotels scaled model · FY 2027–2031 · 36 players · 6 events · COGS
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each years as row}
				{@const color = {
					Centralized: 'text-blue-400',
					Growth:      'text-amber-400',
					Expansion:   'text-orange-400',
					Global:      'text-violet-400',
					Stable:      'text-emerald-400'
				}[row.phase]}
				<div class="px-4 py-2 flex flex-col gap-0.5">
					<div class="flex items-center gap-1.5 text-muted-foreground">
						<span class="text-xs">{row.year}</span>
						{#if row.multiplier && row.multiplier !== 'Flat'}
							<span class="text-xs {color}">{row.multiplier}</span>
						{:else if row.multiplier === 'Flat'}
							<span class="text-xs text-muted-foreground">Flat</span>
						{/if}
					</div>
					<p class="text-xl font-bold {color}">{fmt(row.total)}</p>
					<p class="text-xs text-muted-foreground">{row.phase}</p>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Chart + detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Stacked bars by year -->
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Budget — Flights vs Hotels
			</h2>
			<div class="space-y-3">
				{#each years as row}
					{@const isSelected = row.year === selectedYear}
					{@const fShare = Math.round((row.flights / row.total) * 100)}
					{@const hShare = 100 - fShare}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.multiplier && row.multiplier !== 'Flat'}
								<span class="text-xs text-muted-foreground flex items-center gap-0.5">
									<ChevronRight class="size-3" />{row.multiplier}
								</span>
							{:else if row.multiplier === 'Flat'}
								<span class="text-xs text-muted-foreground">Flat</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(row.total)}</span>
						</div>
						<!-- Stacked bar: flights + hotels -->
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div
								class="bg-blue-500 flex items-center justify-center transition-all"
								style="width: {pct(row.flights, maxTotal)}"
							>
								{#if fShare > 15}
									<span class="text-[10px] font-bold text-white">{fShare}%</span>
								{/if}
							</div>
							<div
								class="bg-emerald-500 flex items-center justify-center transition-all"
								style="width: {pct(row.hotels, maxTotal)}"
							>
								{#if hShare > 15}
									<span class="text-[10px] font-bold text-white">{hShare}%</span>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>
			<!-- Legend -->
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-blue-500"></div>Flights
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-emerald-500"></div>Hotels
				</div>
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{selectedYear} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[selected.phase]}">{selected.phase}</span>
			</div>

			<div class="space-y-2">
				<div class="flex justify-between items-center py-2 border-b border-border">
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Plane class="size-3.5 text-blue-400" />Flights
					</div>
					<div class="text-right">
						<span class="font-semibold">{fmt(selected.flights)}</span>
						<span class="text-xs text-muted-foreground ml-1">({flightShare}%)</span>
					</div>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Hotel class="size-3.5 text-emerald-400" />Hotels
					</div>
					<div class="text-right">
						<span class="font-semibold">{fmt(selected.hotels)}</span>
						<span class="text-xs text-muted-foreground ml-1">({hotelShare}%)</span>
					</div>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Total</span>
					<span class="text-lg font-bold">{fmt(selected.total)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Per Player</span>
					<span class="font-semibold">{fmt(selected.perPlayer)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Per Event</span>
					<span class="font-semibold">{fmt(selected.perEvent)}</span>
				</div>
				{#if selected.multiplier && selected.multiplier !== 'Flat'}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">YoY Scale</span>
						<span class="font-semibold text-amber-400">{selected.multiplier}</span>
					</div>
				{/if}
			</div>

			<div class="rounded-lg bg-muted/40 p-3">
				<p class="text-xs font-semibold text-foreground mb-1">{selected.phaseLabel}</p>
				<ul class="space-y-1">
					{#each selected.drivers as d}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{d}
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	</div>

	<!-- Per-player and per-event scaling tables -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Per-Player Cost</h2>
			<div class="space-y-2.5">
				{#each years as row}
					{@const maxPP = 29_750}
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-10 shrink-0">{row.year}</span>
						<div class="flex-1 h-5 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
								style="width: {pct(row.perPlayer, maxPP)}"
							></div>
						</div>
						<span class="text-sm font-semibold w-16 text-right shrink-0">{fmt(row.perPlayer)}</span>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
				36 players · 6 events · 3 nights per event (18 nights/year)
			</p>
		</Card>

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Per-Event Cost</h2>
			<div class="space-y-2.5">
				{#each years as row}
					{@const maxPE = 178_500}
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-10 shrink-0">{row.year}</span>
						<div class="flex-1 h-5 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
								style="width: {pct(row.perEvent, maxPE)}"
							></div>
						</div>
						<span class="text-sm font-semibold w-16 text-right shrink-0">{fmt(row.perEvent)}</span>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
				Total ÷ 6 events per season
			</p>
		</Card>
	</div>

	<!-- Full breakdown table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Budget Breakdown</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Flights</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">Hotels</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Per Player</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Per Event</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Scale</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each years as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-5 py-3 font-semibold">{row.year}</td>
							<td class="px-5 py-3">
								<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							</td>
							<td class="px-5 py-3 text-right text-blue-300">{fmt(row.flights)}</td>
							<td class="px-5 py-3 text-right text-emerald-300">{fmt(row.hotels)}</td>
							<td class="px-5 py-3 text-right font-bold">{fmt(row.total)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{fmt(row.perPlayer)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{fmt(row.perEvent)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{row.multiplier ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Player distribution + cost controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Globe class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Player Distribution (2027)</h2>
			</div>
			<div class="space-y-3">
				{#each playerDistribution as p}
					<div class="flex items-center gap-3">
						<span class="text-lg">{p.flag}</span>
						<div class="flex-1">
							<div class="flex justify-between text-sm mb-1">
								<span>{p.region}</span>
								<span class="font-semibold">{p.count} players</span>
							</div>
							<div class="h-2 rounded-full bg-muted overflow-hidden">
								<div class="h-full rounded-full bg-blue-500" style="width: {pct(p.count, 36)}"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
				<Info class="size-3.5 inline mr-1" />
				International roster expands through 2030+ driving long-haul routing costs
			</p>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cost Control Opportunities</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each costControls as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
						{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-400">
				<Info class="size-3.5 inline mr-1" />
				Model remains conservative — upside potential through partnership agreements
			</div>
		</Card>
	</div>

</div>
