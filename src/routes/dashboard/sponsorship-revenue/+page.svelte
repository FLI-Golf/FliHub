<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Star, TrendingUp, Users, DollarSign, ChevronRight, Info, Award, ShoppingBag, Tv } from 'lucide-svelte';

	// ── Total revenue by year ─────────────────────────────────────────────────
	const years = [2027, 2028, 2029, 2030, 2031];

	const totalRevenue: Record<number, number> = {
		2027: 6_050_000,
		2028: 6_960_000,
		2029: 10_590_000,
		2030: 18_500_000,
		2031: 31_090_000
	};

	// ── Tier 1: Tournament Naming Rights ─────────────────────────────────────
	const tier1: Record<number, number> = {
		2027: 1_600_000, 2028: 1_840_000, 2029: 2_080_000, 2030: 2_400_000, 2031: 2_750_000
	};

	// ── Tier 2: Official League Partners ─────────────────────────────────────
	const tier2Categories: Record<number, number> = { 2027: 10, 2028: 10, 2029: 12, 2030: 15, 2031: 18 };
	const tier2Price: Record<number, number> = { 2027: 300_000, 2028: 345_000, 2029: 390_000, 2030: 450_000, 2031: 525_000 };
	const tier2Revenue = (yr: number) => tier2Categories[yr] * tier2Price[yr];

	// ── Tier 3: Live Event Vendors ────────────────────────────────────────────
	const tier3Vendors: Record<number, number> = { 2027: 10, 2028: 10, 2029: 15, 2030: 20, 2031: 25 };
	const tier3StdPrice: Record<number, number> = { 2027: 20_000, 2028: 23_000, 2029: 26_000, 2030: 30_000, 2031: 35_000 };
	const tier3ChampPrice: Record<number, number> = { 2027: 30_000, 2028: 34_500, 2029: 39_000, 2030: 45_000, 2031: 52_000 };
	const tier3Revenue = (yr: number) => tier3Vendors[yr] * (5 * tier3StdPrice[yr] + tier3ChampPrice[yr]);

	// ── Tier 4: Fan Grab Bag Sponsors ─────────────────────────────────────────
	const tier4Sponsors: Record<number, number> = { 2027: 20, 2028: 25, 2029: 30, 2030: 40, 2031: 50 };
	const tier4Price: Record<number, number> = { 2027: 7_500, 2028: 8_625, 2029: 9_750, 2030: 11_250, 2031: 12_750 };
	const tier4Revenue = (yr: number) => tier4Sponsors[yr] * tier4Price[yr];

	// ── Presenting Partner ────────────────────────────────────────────────────
	const presenting: Record<number, number> = {
		2026: 0, 2027: 125_000, 2028: 500_000, 2029: 1_000_000, 2030: 5_000_000, 2031: 10_000_000
	};

	// ── Advertising recognition schedule (2027 Tier 1 example) ───────────────
	const adRecognition = [
		{ period: 'Q3 2026', t1: 80_000,  t2: 240_000 },
		{ period: 'Q4 2026', t1: 80_000,  t2: 240_000 },
		{ period: 'Q1 2027', t1: 120_000, t2: 360_000 },
		{ period: 'Q2 2027', t1: 120_000, t2: 360_000 }
	];

	const adAllocations = [
		{ tier: 'Tier 1 – Naming Rights',    pct: 25, icon: Award,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
		{ tier: 'Tier 2 – League Partners',  pct: 40, icon: Users,       color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
		{ tier: 'Tier 3 – Event Vendors',    pct: 15, icon: ShoppingBag, color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
		{ tier: 'Tier 4 – Grab Bag',         pct: 60, icon: Star,        color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
		{ tier: 'Presenting Partner',        pct: 50, icon: Tv,          color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30' }
	];

	const maxTotal = Math.max(...years.map(y => totalRevenue[y]));

	function fmt(n: number): string {
		if (n === 0) return '—';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number): string {
		if (n === 0) return '—';
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

	let selectedYear = $state(2027);
	const sel = $derived(selectedYear);
</script>

<svelte:head><title>Sponsorship Revenue - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Sponsorship Revenue</h1>
		<p class="text-muted-foreground">Structure, projections &amp; ad revenue recognition · FY 2026–2031 · ASC 606</p>
	</div>

	<!-- Total revenue KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each years as yr}
				<button class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors {sel === yr ? 'bg-muted/40' : ''}" onclick={() => selectedYear = yr}>
					<span class="text-xs text-muted-foreground">{yr}</span>
					<p class="text-lg font-bold {yr >= 2030 ? 'text-violet-400' : yr >= 2029 ? 'text-amber-400' : 'text-foreground'}">{fmtM(totalRevenue[yr])}</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Total revenue bar chart + year breakdown -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Total Sponsorship Revenue</h2>
			<div class="space-y-3">
				{#each years as yr}
					{@const isSelected = yr === sel}
					{@const t1 = tier1[yr]}
					{@const t2 = tier2Revenue(yr)}
					{@const t3 = tier3Revenue(yr)}
					{@const t4 = tier4Revenue(yr)}
					{@const pp = presenting[yr]}
					{@const tot = totalRevenue[yr]}
					<button class="w-full text-left group" onclick={() => selectedYear = yr}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{yr}</span>
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(tot)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-blue-500 transition-all"    style="width:{pct(t1, maxTotal)}"></div>
							<div class="bg-emerald-500 transition-all" style="width:{pct(t2, maxTotal)}"></div>
							<div class="bg-amber-500 transition-all"   style="width:{pct(t3, maxTotal)}"></div>
							<div class="bg-violet-500 transition-all"  style="width:{pct(t4, maxTotal)}"></div>
							{#if pp > 0}<div class="bg-rose-500 transition-all" style="width:{pct(pp, maxTotal)}"></div>{/if}
						</div>
					</button>
				{/each}
			</div>
			<div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
				{#each [['Naming Rights','bg-blue-500'],['League Partners','bg-emerald-500'],['Event Vendors','bg-amber-500'],['Grab Bag','bg-violet-500'],['Presenting Partner','bg-rose-500']] as [lbl, cls]}
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<div class="size-2.5 rounded-sm {cls}"></div>{lbl}
					</div>
				{/each}
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-3">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel} Breakdown</h2>
			<div class="space-y-2">
				{#each [
					{ label: 'Naming Rights (T1)',   value: tier1[sel],          color: 'text-blue-400' },
					{ label: 'League Partners (T2)', value: tier2Revenue(sel),   color: 'text-emerald-400' },
					{ label: 'Event Vendors (T3)',   value: tier3Revenue(sel),   color: 'text-amber-400' },
					{ label: 'Grab Bag (T4)',        value: tier4Revenue(sel),   color: 'text-violet-400' },
					{ label: 'Presenting Partner',   value: presenting[sel] ?? 0, color: 'text-rose-400' }
				] as row}
					<div class="flex justify-between items-center py-1.5 border-b border-border text-sm">
						<span class="text-muted-foreground">{row.label}</span>
						<span class="font-semibold {row.color}">{fmtM(row.value)}</span>
					</div>
				{/each}
				<div class="flex justify-between items-center pt-2 text-sm font-bold">
					<span>Total</span>
					<span class="text-lg">{fmtM(totalRevenue[sel])}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Tier detail cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

		<!-- Tier 1 -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<div class="flex size-7 items-center justify-center rounded-lg bg-blue-500/20"><Award class="size-4 text-blue-400" /></div>
				<h2 class="text-sm font-semibold">Tier 1 — Naming Rights</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3">6 tournaments · 1 naming partner each</p>
			<div class="space-y-1.5 text-xs">
				<div class="flex justify-between"><span class="text-muted-foreground">Opening Event</span><span class="font-semibold">$300K</span></div>
				<div class="flex justify-between"><span class="text-muted-foreground">Championship</span><span class="font-semibold">$300K</span></div>
				<div class="flex justify-between"><span class="text-muted-foreground">4 Standard Events</span><span class="font-semibold">$250K each</span></div>
			</div>
			<div class="mt-3 pt-3 border-t border-border space-y-1">
				{#each years as yr}
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">{yr}</span>
						<span class="font-semibold {yr === sel ? 'text-blue-400' : ''}">{fmtM(tier1[yr])}</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Tier 2 -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<div class="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20"><Users class="size-4 text-emerald-400" /></div>
				<h2 class="text-sm font-semibold">Tier 2 — League Partners</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3">Category exclusivity · season-long</p>
			<div class="space-y-1.5 text-xs">
				{#each years as yr}
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">{yr}</span>
						<span class="text-muted-foreground">{tier2Categories[yr]} partners × {fmtM(tier2Price[yr])}</span>
						<span class="font-semibold {yr === sel ? 'text-emerald-400' : ''}">{fmtM(tier2Revenue(yr))}</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Tier 3 -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<div class="flex size-7 items-center justify-center rounded-lg bg-amber-500/20"><ShoppingBag class="size-4 text-amber-400" /></div>
				<h2 class="text-sm font-semibold">Tier 3 — Event Vendors</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3">Experiential activations in-stadium</p>
			<div class="space-y-1.5 text-xs">
				{#each years as yr}
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">{yr}</span>
						<span class="text-muted-foreground">{tier3Vendors[yr]} vendors</span>
						<span class="font-semibold {yr === sel ? 'text-amber-400' : ''}">{fmtM(tier3Revenue(yr))}</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Tier 4 + Presenting -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<div class="flex size-7 items-center justify-center rounded-lg bg-violet-500/20"><Star class="size-4 text-violet-400" /></div>
				<h2 class="text-sm font-semibold">Tier 4 &amp; Presenting</h2>
			</div>
			<p class="text-xs font-semibold text-muted-foreground mb-1">Grab Bag Sponsors</p>
			<div class="space-y-1 text-xs mb-3">
				{#each years as yr}
					<div class="flex justify-between">
						<span class="text-muted-foreground">{yr} · {tier4Sponsors[yr]} sponsors</span>
						<span class="font-semibold {yr === sel ? 'text-violet-400' : ''}">{fmtM(tier4Revenue(yr))}</span>
					</div>
				{/each}
			</div>
			<p class="text-xs font-semibold text-muted-foreground mb-1">Presenting Partner</p>
			<div class="space-y-1 text-xs">
				{#each [2027,2028,2029,2030,2031] as yr}
					<div class="flex justify-between">
						<span class="text-muted-foreground">{yr}</span>
						<span class="font-semibold {yr === sel ? 'text-rose-400' : ''}">{fmtM(presenting[yr])}</span>
					</div>
				{/each}
			</div>
		</Card>
	</div>

	<!-- Ad revenue recognition -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Advertising Allocation by Tier</h2>
			</div>
			<div class="space-y-3">
				{#each adAllocations as item}
					{@const Icon = item.icon}
					<div class="flex items-center gap-3">
						<div class="flex size-7 items-center justify-center rounded-lg {item.bg} border {item.border} shrink-0">
							<Icon class="size-3.5 {item.color}" />
						</div>
						<div class="flex-1">
							<div class="flex justify-between text-sm mb-0.5">
								<span class="text-muted-foreground">{item.tier}</span>
								<span class="font-bold {item.color}">{item.pct}%</span>
							</div>
							<div class="h-1.5 rounded-full bg-muted overflow-hidden">
								<div class="h-full rounded-full {item.bg.replace('/10','')}" style="width:{item.pct}%"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Advertising services begin in 2026 — revenue recognized when marketing services occur (ASC 606)
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<Tv class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2027 Recognition Schedule (T1 + T2)</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border">
							<th class="pb-2 text-left text-xs font-semibold text-muted-foreground">Period</th>
							<th class="pb-2 text-right text-xs font-semibold text-blue-400">Tier 1</th>
							<th class="pb-2 text-right text-xs font-semibold text-emerald-400">Tier 2</th>
							<th class="pb-2 text-right text-xs font-semibold text-slate-300">Total</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each adRecognition as row}
							<tr>
								<td class="py-2 text-muted-foreground">{row.period}</td>
								<td class="py-2 text-right text-blue-300">{fmt(row.t1)}</td>
								<td class="py-2 text-right text-emerald-300">{fmt(row.t2)}</td>
								<td class="py-2 text-right font-semibold">{fmt(row.t1 + row.t2)}</td>
							</tr>
						{/each}
						<tr class="font-bold border-t-2 border-slate-600">
							<td class="pt-2">Total</td>
							<td class="pt-2 text-right text-blue-300">{fmt(400_000)}</td>
							<td class="pt-2 text-right text-emerald-300">{fmt(1_200_000)}</td>
							<td class="pt-2 text-right">{fmt(1_600_000)}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
				<p>• Contracts must separate advertising and tournament deliverables</p>
				<p>• Tournament revenue recognized when events occur</p>
				<p>• Deferred revenue tracked by sponsor contract</p>
			</div>
		</Card>
	</div>

</div>
