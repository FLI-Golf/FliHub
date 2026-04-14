<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Disc3, TrendingUp, Globe, DollarSign, ChevronRight, Info, Award, Repeat2, BarChart3 } from 'lucide-svelte';

	// ── Data ─────────────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		usUnits: number;
		intlUnits: number;
		totalUnits: number;
		licenseFee: number;
		fglSharePct: number;
		profitPool: number;
		fglProfit: number;
		totalFglRevenue: number;
		phase: 'Recovery' | 'Transition' | 'Mature';
	};

	const rows: YearRow[] = [
		{ year: 2026, usUnits: 5_000,  intlUnits: 0,      totalUnits: 5_000,  licenseFee: 100_000,   fglSharePct: 40,   profitPool: 75_000,  fglProfit: 30_000,   totalFglRevenue: 130_000,   phase: 'Recovery'   },
		{ year: 2027, usUnits: 10_000, intlUnits: 5_000,  totalUnits: 15_000, licenseFee: 350_000,   fglSharePct: 40,   profitPool: 225_000, fglProfit: 90_000,   totalFglRevenue: 440_000,   phase: 'Recovery'   },
		{ year: 2028, usUnits: 15_000, intlUnits: 10_000, totalUnits: 25_000, licenseFee: 600_000,   fglSharePct: 40,   profitPool: 375_000, fglProfit: 150_000,  totalFglRevenue: 750_000,   phase: 'Recovery'   },
		{ year: 2029, usUnits: 20_000, intlUnits: 15_000, totalUnits: 35_000, licenseFee: 800_000,   fglSharePct: 45,   profitPool: 525_000, fglProfit: 236_250,  totalFglRevenue: 1_036_250, phase: 'Transition' },
		{ year: 2030, usUnits: 25_000, intlUnits: 20_000, totalUnits: 45_000, licenseFee: 1_000_000, fglSharePct: 50,   profitPool: 675_000, fglProfit: 337_500,  totalFglRevenue: 1_337_500, phase: 'Mature'     },
		{ year: 2031, usUnits: 30_000, intlUnits: 25_000, totalUnits: 55_000, licenseFee: 1_200_000, fglSharePct: 50,   profitPool: 825_000, fglProfit: 412_500,  totalFglRevenue: 1_612_500, phase: 'Mature'     }
	];

	const mfrRecovery = [
		{ year: 2026, mfrShare: 45_000,  cumulative: 45_000  },
		{ year: 2027, mfrShare: 135_000, cumulative: 180_000 },
		{ year: 2028, mfrShare: 225_000, cumulative: 405_000 }
	];
	const recoveryThreshold = 250_000;
	const totalInvestment    = 500_000;

	const phaseColor = (p: string) => ({
		Recovery:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Transition: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Mature:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	}[p] ?? '');

	const maxRevenue = Math.max(...rows.map(r => r.totalFglRevenue));
	const maxUnits   = Math.max(...rows.map(r => r.totalUnits));

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

	let selectedYear = $state(2029);
	const sel = $derived(rows.find(r => r.year === selectedYear)!);
</script>

<svelte:head><title>Disc Licensing - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Official Disc Licensing</h1>
		<p class="text-muted-foreground">
			Discraft manufacturing partnership · FY 2026–2031 · 40/60 → 50/50 profit split
		</p>
	</div>

	<!-- Unit economics strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each [
				{ label: 'Retail Price',       value: '$25',  sub: 'Per disc',          color: '' },
				{ label: 'COGS',               value: '$10',  sub: 'Per disc',          color: 'text-rose-400' },
				{ label: 'Gross Profit',       value: '$15',  sub: 'Per disc (60%)',    color: 'text-emerald-400' },
				{ label: 'Phase 1 FGL Split',  value: '40%',  sub: 'Until recovery',    color: 'text-amber-400' },
				{ label: 'Phase 2 FGL Split',  value: '50%',  sub: 'Post-recovery',     color: 'text-emerald-400' }
			] as k}
				<div class="px-4 py-2 flex flex-col gap-0.5">
					<span class="text-xs text-muted-foreground">{k.label}</span>
					<p class="text-xl font-bold {k.color}">{k.value}</p>
					<p class="text-xs text-muted-foreground">{k.sub}</p>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Revenue chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				FGL Total Revenue — License Fee + Profit Share
			</h2>
			<div class="space-y-3">
				{#each rows as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor(row.phase)}">{row.phase}</span>
							{#if row.year === 2030}
								<span class="text-xs text-emerald-400 flex items-center gap-0.5"><ChevronRight class="size-3" />50/50 begins</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.totalFglRevenue)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-blue-500 transition-all"    style="width:{pct(row.licenseFee, maxRevenue)}"></div>
							<div class="bg-emerald-500 transition-all" style="width:{pct(row.fglProfit, maxRevenue)}"></div>
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-blue-500"></div>License Fee</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-emerald-500"></div>Profit Share</div>
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel.year} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor(sel.phase)}">{sel.phase}</span>
			</div>
			<div class="space-y-2 text-sm">
				{#each [
					{ label: 'US Units',          value: sel.usUnits.toLocaleString(),   color: '' },
					{ label: 'International',     value: sel.intlUnits.toLocaleString(), color: '' },
					{ label: 'Total Units',       value: sel.totalUnits.toLocaleString(),color: '' },
					{ label: 'Profit Pool (×$15)',value: fmt(sel.profitPool),            color: '' },
					{ label: `FGL Share (${sel.fglSharePct}%)`, value: fmt(sel.fglProfit), color: 'text-emerald-400' },
					{ label: 'License Fee',       value: fmt(sel.licenseFee),            color: 'text-blue-400' }
				] as r}
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">{r.label}</span>
						<span class="font-semibold {r.color}">{r.value}</span>
					</div>
				{/each}
				<div class="flex justify-between pt-2 font-bold text-base">
					<span>Total FGL Revenue</span>
					<span>{fmtM(sel.totalFglRevenue)}</span>
				</div>
			</div>
			{#if sel.phase === 'Recovery'}
				<div class="rounded-lg bg-amber-500/5 border border-amber-500/30 p-3 text-xs text-amber-300">
					<Info class="size-3.5 inline mr-1" />
					Recovery phase: 40/60 split until Discraft recoups $250K
				</div>
			{:else if sel.phase === 'Transition'}
				<div class="rounded-lg bg-orange-500/5 border border-orange-500/30 p-3 text-xs text-orange-300">
					<Info class="size-3.5 inline mr-1" />
					Blended ~45% split — recovery threshold crossed mid-cycle
				</div>
			{:else}
				<div class="rounded-lg bg-emerald-500/5 border border-emerald-500/30 p-3 text-xs text-emerald-300">
					<Info class="size-3.5 inline mr-1" />
					Mature phase: permanent 50/50 split
				</div>
			{/if}
		</Card>
	</div>

	<!-- Unit sales + recovery tracking -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Unit Sales — US vs International</h2>
			<div class="space-y-3">
				{#each rows as row}
					{@const intlPct = row.totalUnits > 0 ? Math.round((row.intlUnits / row.totalUnits) * 100) : 0}
					<div>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-xs text-muted-foreground w-10 shrink-0">{row.year}</span>
							<span class="text-xs text-muted-foreground ml-auto">{row.totalUnits.toLocaleString()} units</span>
							{#if intlPct > 0}
								<span class="text-xs text-violet-400">{intlPct}% intl</span>
							{/if}
						</div>
						<div class="flex h-4 rounded overflow-hidden gap-px">
							<div class="bg-blue-500 transition-all" style="width:{pct(row.usUnits, maxUnits)}"></div>
							{#if row.intlUnits > 0}
								<div class="bg-violet-500 transition-all" style="width:{pct(row.intlUnits, maxUnits)}"></div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-blue-500"></div>US</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-violet-500"></div>International</div>
			</div>
			<p class="text-xs text-muted-foreground mt-2">
				<Info class="size-3.5 inline mr-1" />
				~45% international by 2031 · Key markets: Finland, Sweden, Estonia, Denmark, Norway
			</p>
		</Card>

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Discraft Recovery Tracking</h2>
			<div class="mb-3 text-xs text-muted-foreground">
				Total investment: <span class="font-semibold text-foreground">{fmt(totalInvestment)}</span> ·
				Recovery target (50%): <span class="font-semibold text-amber-400">{fmt(recoveryThreshold)}</span>
			</div>
			<div class="space-y-3">
				{#each mfrRecovery as r}
					{@const exceeded = r.cumulative >= recoveryThreshold}
					<div>
						<div class="flex justify-between text-xs mb-1">
							<span class="text-muted-foreground">{r.year} · +{fmt(r.mfrShare)}</span>
							<span class="font-semibold {exceeded ? 'text-emerald-400' : 'text-amber-400'}">{fmt(r.cumulative)} cumulative</span>
						</div>
						<div class="h-3 rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full transition-all {exceeded ? 'bg-emerald-500' : 'bg-amber-500'}"
								style="width:{pct(Math.min(r.cumulative, recoveryThreshold), recoveryThreshold)}"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border bg-emerald-500/5 border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300">
				<Info class="size-3.5 inline mr-1" />
				Recovery threshold exceeded during 2028–2029 cycle → 50/50 split activates in 2030
			</div>
		</Card>
	</div>

	<!-- Full table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Revenue Model</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						{#each ['Year','Phase','Units','Profit Pool','FGL Split','FGL Profit','License Fee','Total FGL'] as h, i}
							<th class="px-4 py-3 {i === 0 || i === 1 ? 'text-left' : 'text-right'} text-xs font-semibold uppercase tracking-wider {i === 5 ? 'text-emerald-400' : i === 6 ? 'text-blue-400' : i === 7 ? 'text-slate-200' : 'text-slate-400'}">{h}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}" onclick={() => selectedYear = row.year}>
							<td class="px-4 py-3 font-semibold">{row.year}</td>
							<td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full border {phaseColor(row.phase)}">{row.phase}</span></td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.totalUnits.toLocaleString()}</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{fmt(row.profitPool)}</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.fglSharePct}%</td>
							<td class="px-4 py-3 text-right text-emerald-300">{fmt(row.fglProfit)}</td>
							<td class="px-4 py-3 text-right text-blue-300">{fmt(row.licenseFee)}</td>
							<td class="px-4 py-3 text-right font-bold">{fmtM(row.totalFglRevenue)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Enterprise value + Discraft rationale + upside -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="size-4 text-violet-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Enterprise Value Impact</h2>
			</div>
			<div class="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 mb-3">
				<p class="text-xs text-muted-foreground mb-1">2031 Recurring Revenue</p>
				<p class="text-2xl font-bold text-violet-400">$1.6M+</p>
				<p class="text-xs text-muted-foreground mt-1">Zero manufacturing risk</p>
			</div>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
				<p class="text-xs text-muted-foreground mb-1">At 6–8× revenue multiple</p>
				<p class="text-2xl font-bold text-emerald-400">$9.6M–$12.8M</p>
				<p class="text-xs text-muted-foreground mt-1">Enterprise value from discs alone</p>
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Award class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Why Discraft</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Market leadership — top-tier global brand recognition',
					'Professional player endorsements & adoption',
					'Scalable production + established logistics',
					'Deep mold library + custom release capability',
					'Strong collector & resale market performance',
					'Existing North America, Europe & global distribution'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<TrendingUp class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upside Not in Model</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					'Championship limited-run discs',
					'Player signature molds',
					'Regional collector editions',
					'Tournament-only drops',
					'Premium pricing ($28–$30)',
					'Subscription collector clubs',
					'Fantasy / digital unlock integrations'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Comparable to NBA × Nike, NFL × Wilson, NHL × Bauer licensing structures
			</div>
		</Card>
	</div>

</div>
