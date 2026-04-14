<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		ShoppingBag,
		TrendingUp,
		Globe,
		DollarSign,
		ChevronRight,
		Info,
		Award,
		Repeat2,
		BarChart3
	} from 'lucide-svelte';

	// ── Core data ─────────────────────────────────────────────────────────────

	const years = [2026, 2027, 2028, 2029, 2030, 2031];

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
		phase: 'Recovery' | 'Mature';
	};

	const rows: YearRow[] = [
		{ year: 2026, usUnits: 2_000, intlUnits: 0,     totalUnits: 2_000,  licenseFee: 100_000,   fglSharePct: 40, profitPool: 130_000, fglProfit: 52_000,   totalFglRevenue: 152_000,   phase: 'Recovery' },
		{ year: 2027, usUnits: 3_000, intlUnits: 1_000, totalUnits: 4_000,  licenseFee: 350_000,   fglSharePct: 40, profitPool: 260_000, fglProfit: 104_000,  totalFglRevenue: 454_000,   phase: 'Recovery' },
		{ year: 2028, usUnits: 4_000, intlUnits: 2_000, totalUnits: 6_000,  licenseFee: 600_000,   fglSharePct: 40, profitPool: 390_000, fglProfit: 156_000,  totalFglRevenue: 756_000,   phase: 'Recovery' },
		{ year: 2029, usUnits: 5_000, intlUnits: 3_000, totalUnits: 8_000,  licenseFee: 800_000,   fglSharePct: 50, profitPool: 520_000, fglProfit: 260_000,  totalFglRevenue: 1_060_000, phase: 'Mature' },
		{ year: 2030, usUnits: 6_500, intlUnits: 3_500, totalUnits: 10_000, licenseFee: 1_000_000, fglSharePct: 50, profitPool: 650_000, fglProfit: 325_000,  totalFglRevenue: 1_325_000, phase: 'Mature' },
		{ year: 2031, usUnits: 7_000, intlUnits: 3_500, totalUnits: 10_500, licenseFee: 1_000_000, fglSharePct: 50, profitPool: 682_500, fglProfit: 341_250,  totalFglRevenue: 1_341_250, phase: 'Mature' }
	];

	// Manufacturer recovery tracking
	const mfrRecovery = [
		{ year: 2026, mfrShare: 78_000,  cumulative: 78_000  },
		{ year: 2027, mfrShare: 156_000, cumulative: 234_000 },
		{ year: 2028, mfrShare: 234_000, cumulative: 468_000 }
	];
	const recoveryThreshold = 375_000;
	const totalInvestment    = 750_000;

	const maxRevenue = Math.max(...rows.map(r => r.totalFglRevenue));
	const maxUnits   = Math.max(...rows.map(r => r.totalUnits));

	function fmt(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}
	function fmtM(n: number): string {
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(3).replace(/\.?0+$/, '')}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

	let selectedYear = $state(2029);
	const sel = $derived(rows.find(r => r.year === selectedYear)!);

	const phaseColor = (phase: string) =>
		phase === 'Recovery'
			? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
			: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
</script>

<svelte:head><title>Bag Licensing - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Official Bag Licensing</h1>
		<p class="text-muted-foreground">
			ZUCA manufacturing partnership · FY 2026–2031 · 40/60 → 50/50 profit split
		</p>
	</div>

	<!-- Unit economics strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Retail Price</span>
				<p class="text-xl font-bold">$90</p>
				<p class="text-xs text-muted-foreground">Per bag</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">COGS</span>
				<p class="text-xl font-bold text-rose-400">$25</p>
				<p class="text-xs text-muted-foreground">Per bag</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Gross Profit</span>
				<p class="text-xl font-bold text-emerald-400">$65</p>
				<p class="text-xs text-muted-foreground">Per bag (72%)</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Phase 1 FGL Split</span>
				<p class="text-xl font-bold text-amber-400">40%</p>
				<p class="text-xs text-muted-foreground">Until recovery</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Phase 2 FGL Split</span>
				<p class="text-xl font-bold text-emerald-400">50%</p>
				<p class="text-xs text-muted-foreground">Post-recovery (2029+)</p>
			</div>
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
							{#if row.year === 2029}
								<span class="text-xs text-emerald-400 flex items-center gap-0.5"><ChevronRight class="size-3" />50/50 begins</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.totalFglRevenue)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<!-- License fee portion -->
							<div class="bg-blue-500 transition-all" style="width:{pct(row.licenseFee, maxRevenue)}"></div>
							<!-- Profit share portion -->
							<div class="bg-emerald-500 transition-all" style="width:{pct(row.fglProfit, maxRevenue)}"></div>
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-blue-500"></div>License Fee
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-emerald-500"></div>Profit Share
				</div>
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel.year} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor(sel.phase)}">{sel.phase}</span>
			</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">US Units</span>
					<span class="font-semibold">{sel.usUnits.toLocaleString()}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">International Units</span>
					<span class="font-semibold">{sel.intlUnits.toLocaleString()}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Total Units</span>
					<span class="font-semibold">{sel.totalUnits.toLocaleString()}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Profit Pool (×$65)</span>
					<span class="font-semibold">{fmt(sel.profitPool)}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">FGL Share ({sel.fglSharePct}%)</span>
					<span class="font-semibold text-emerald-400">{fmt(sel.fglProfit)}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">License Fee</span>
					<span class="font-semibold text-blue-400">{fmt(sel.licenseFee)}</span>
				</div>
				<div class="flex justify-between py-1.5 font-bold text-base">
					<span>Total FGL Revenue</span>
					<span>{fmtM(sel.totalFglRevenue)}</span>
				</div>
			</div>
			{#if sel.year <= 2028}
				<div class="rounded-lg bg-amber-500/5 border border-amber-500/30 p-3 text-xs text-amber-300">
					<Info class="size-3.5 inline mr-1" />
					Recovery phase: 40/60 split until manufacturer recoups $375K
				</div>
			{:else}
				<div class="rounded-lg bg-emerald-500/5 border border-emerald-500/30 p-3 text-xs text-emerald-300">
					<Info class="size-3.5 inline mr-1" />
					Mature phase: permanent 50/50 split — recovery threshold exceeded in 2028
				</div>
			{/if}
		</Card>
	</div>

	<!-- Unit sales + recovery tracking -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<!-- Unit sales chart -->
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
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-blue-500"></div>US
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-violet-500"></div>International
				</div>
			</div>
		</Card>

		<!-- Manufacturer recovery tracking -->
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Manufacturer Recovery Tracking</h2>
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
						<div class="h-3 rounded-full bg-muted overflow-hidden relative">
							<div
								class="h-full rounded-full transition-all {exceeded ? 'bg-emerald-500' : 'bg-amber-500'}"
								style="width:{pct(Math.min(r.cumulative, recoveryThreshold), recoveryThreshold)}"
							></div>
							<!-- threshold marker -->
							<div class="absolute top-0 bottom-0 w-px bg-white/40" style="left:100%"></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border rounded-lg bg-emerald-500/5 border-emerald-500/30 p-3 text-xs text-emerald-300">
				<Info class="size-3.5 inline mr-1" />
				Recovery threshold exceeded during 2028 → 50/50 split activates in 2029
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
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Units</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Profit Pool</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">FGL Split</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">FGL Profit</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">License Fee</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total FGL</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}" onclick={() => selectedYear = row.year}>
							<td class="px-4 py-3 font-semibold">{row.year}</td>
							<td class="px-4 py-3">
								<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor(row.phase)}">{row.phase}</span>
							</td>
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

	<!-- Enterprise value + strategic cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="size-4 text-violet-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Enterprise Value Impact</h2>
			</div>
			<div class="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 mb-3">
				<p class="text-xs text-muted-foreground mb-1">Combined Equipment Revenue (2031)</p>
				<p class="text-2xl font-bold text-violet-400">$2.6M+</p>
				<p class="text-xs text-muted-foreground mt-1">Bags ~$1.34M + Discs ~$1.34M annually</p>
			</div>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
				<p class="text-xs text-muted-foreground mb-1">At 6–8× revenue multiple</p>
				<p class="text-2xl font-bold text-emerald-400">$15M–$20M</p>
				<p class="text-xs text-muted-foreground mt-1">Enterprise value added from equipment alone</p>
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Award class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Why ZUCA</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Proven disc golf presence — immediate product-market fit',
					'Premium brand alignment with FGL positioning',
					'Existing manufacturing, supply chain & distribution',
					'Customization: team editions, player models, collector drops',
					'International readiness — aligned with European expansion'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Repeat2 class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Growth Drivers</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					'30%+ international sales by 2031',
					'Tournament-driven upgrade cycles',
					'Team colorways & limited releases',
					'Player-branded editions',
					'Collector drops',
					'Fantasy unlock integrations'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Higher price point, higher margin, and stronger upgrade cycles vs discs
			</div>
		</Card>
	</div>

</div>
