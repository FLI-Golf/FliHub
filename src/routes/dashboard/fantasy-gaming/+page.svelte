<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Gamepad2, TrendingUp, Users, DollarSign, Zap, Globe, ChevronRight, Info, BarChart3, Tv } from 'lucide-svelte';

	// ── Data ─────────────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		fantasyUsers: number;
		premiumSubs: number;
		premiumRevenue: number;
		microTxSpend: number;
		microTxRevenue: number;
		totalFantasy: number;
		viewers: number;
		bettors: number;
		gamblingRevenue: number;
		total: number;
		phase: string;
	};

	const rows: YearRow[] = [
		{
			year: 2027, fantasyUsers: 25_000,  premiumSubs: 6_250,   premiumRevenue: 156_250,   microTxSpend: 8,  microTxRevenue: 200_000,    totalFantasy: 356_250,
			viewers: 0,          bettors: 0,       gamblingRevenue: 0,          total: 356_250,    phase: 'Launch'
		},
		{
			year: 2028, fantasyUsers: 60_000,  premiumSubs: 15_000,  premiumRevenue: 375_000,   microTxSpend: 12, microTxRevenue: 720_000,    totalFantasy: 1_095_000,
			viewers: 1_200_000,  bettors: 96_000,  gamblingRevenue: 3_456_000,  total: 4_551_000,  phase: 'Betting Begins'
		},
		{
			year: 2029, fantasyUsers: 150_000, premiumSubs: 37_500,  premiumRevenue: 937_500,   microTxSpend: 18, microTxRevenue: 2_700_000,  totalFantasy: 3_637_500,
			viewers: 3_000_000,  bettors: 240_000, gamblingRevenue: 8_640_000,  total: 12_277_500, phase: 'Scale'
		},
		{
			year: 2030, fantasyUsers: 300_000, premiumSubs: 75_000,  premiumRevenue: 1_875_000, microTxSpend: 25, microTxRevenue: 7_500_000,  totalFantasy: 9_375_000,
			viewers: 6_000_000,  bettors: 480_000, gamblingRevenue: 17_280_000, total: 26_655_000, phase: 'International'
		},
		{
			year: 2031, fantasyUsers: 500_000, premiumSubs: 125_000, premiumRevenue: 3_125_000, microTxSpend: 32, microTxRevenue: 16_000_000, totalFantasy: 19_125_000,
			viewers: 10_000_000, bettors: 800_000, gamblingRevenue: 28_800_000, total: 47_925_000, phase: 'Global Scale'
		}
	];

	const phaseColor: Record<string, string> = {
		'Launch':          'bg-blue-500/10 text-blue-400 border-blue-500/30',
		'Betting Begins':  'bg-amber-500/10 text-amber-400 border-amber-500/30',
		'Scale':           'bg-orange-500/10 text-orange-400 border-orange-500/30',
		'International':   'bg-violet-500/10 text-violet-400 border-violet-500/30',
		'Global Scale':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const maxTotal    = Math.max(...rows.map(r => r.total));
	const maxFantasy  = Math.max(...rows.map(r => r.totalFantasy));
	const maxGambling = Math.max(...rows.map(r => r.gamblingRevenue));

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		if (n === 0) return '—';
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

	let selectedYear = $state(2029);
	const sel = $derived(rows.find(r => r.year === selectedYear)!);

	const gamblingShare = $derived(sel.total > 0 ? Math.round((sel.gamblingRevenue / sel.total) * 100) : 0);
	const fantasyShare  = $derived(100 - gamblingShare);
</script>

<svelte:head><title>Fantasy & Gaming Revenue - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Fantasy &amp; Gaming Revenue</h1>
		<p class="text-muted-foreground">
			Digital revenue model · FY 2027–2031 · Fantasy platform + sportsbook partnerships
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each rows as row}
				{@const colorMap: Record<string,string> = { 'Launch':'text-blue-400','Betting Begins':'text-amber-400','Scale':'text-orange-400','International':'text-violet-400','Global Scale':'text-emerald-400' }}
				<button class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors {selectedYear === row.year ? 'bg-muted/40' : ''}" onclick={() => selectedYear = row.year}>
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">{row.year}</span>
						<span class="text-xs px-1.5 py-0.5 rounded-full border {phaseColor[row.phase]}">{row.phase}</span>
					</div>
					<p class="text-lg font-bold {colorMap[row.phase]}">{fmtM(row.total)}</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Stacked bar chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Revenue — Fantasy vs Gambling
			</h2>
			<div class="space-y-3">
				{#each rows as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor[row.phase]}">{row.phase}</span>
							{#if row.year === 2028}
								<span class="text-xs text-amber-400 flex items-center gap-0.5"><ChevronRight class="size-3" />Betting activates</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.total)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-violet-500 transition-all" style="width:{pct(row.totalFantasy, maxTotal)}"></div>
							{#if row.gamblingRevenue > 0}
								<div class="bg-emerald-500 transition-all" style="width:{pct(row.gamblingRevenue, maxTotal)}"></div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-violet-500"></div>Fantasy Platform</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-emerald-500"></div>Gambling / Sportsbook</div>
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel.year} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColor[sel.phase]}">{sel.phase}</span>
			</div>

			<!-- Split donut-style bar -->
			{#if sel.gamblingRevenue > 0}
				<div class="flex h-4 rounded-full overflow-hidden gap-px">
					<div class="bg-violet-500" style="width:{fantasyShare}%"></div>
					<div class="bg-emerald-500" style="width:{gamblingShare}%"></div>
				</div>
				<div class="flex justify-between text-xs text-muted-foreground">
					<span class="text-violet-400">Fantasy {fantasyShare}%</span>
					<span class="text-emerald-400">Gambling {gamblingShare}%</span>
				</div>
			{/if}

			<div class="space-y-2 text-sm">
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Fantasy Users</span>
					<span class="font-semibold">{sel.fantasyUsers.toLocaleString()}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Premium Subs (25%)</span>
					<span class="font-semibold">{sel.premiumSubs.toLocaleString()}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Premium Revenue</span>
					<span class="font-semibold text-violet-400">{fmt(sel.premiumRevenue)}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Micro-tx (${sel.microTxSpend}/user)</span>
					<span class="font-semibold text-violet-400">{fmt(sel.microTxRevenue)}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border font-semibold">
					<span class="text-muted-foreground">Total Fantasy</span>
					<span class="text-violet-400">{fmtM(sel.totalFantasy)}</span>
				</div>
				{#if sel.gamblingRevenue > 0}
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Viewers</span>
						<span class="font-semibold">{(sel.viewers / 1_000_000).toFixed(1)}M</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Bettors (8%)</span>
						<span class="font-semibold">{sel.bettors.toLocaleString()}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-border font-semibold">
						<span class="text-muted-foreground">Gambling Revenue</span>
						<span class="text-emerald-400">{fmtM(sel.gamblingRevenue)}</span>
					</div>
				{:else}
					<div class="rounded-lg bg-muted/30 p-2 text-xs text-muted-foreground">
						<Info class="size-3.5 inline mr-1" />Betting activates in 2028
					</div>
				{/if}
				<div class="flex justify-between pt-2 font-bold text-base">
					<span>Total</span>
					<span>{fmtM(sel.total)}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Fantasy deep-dive + gambling deep-dive -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<!-- Fantasy platform -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<Gamepad2 class="size-4 text-violet-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fantasy Platform Growth</h2>
			</div>
			<div class="space-y-2.5">
				{#each rows as row}
					<div>
						<div class="flex justify-between text-xs mb-1">
							<span class="text-muted-foreground">{row.year} · {row.fantasyUsers.toLocaleString()} users</span>
							<span class="font-semibold {row.year === selectedYear ? 'text-violet-400' : ''}">{fmtM(row.totalFantasy)}</span>
						</div>
						<div class="flex h-3 rounded overflow-hidden gap-px">
							<div class="bg-violet-600 transition-all" style="width:{pct(row.premiumRevenue, maxFantasy)}"></div>
							<div class="bg-violet-400 transition-all" style="width:{pct(row.microTxRevenue, maxFantasy)}"></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="flex gap-4 mt-3 pt-3 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2 rounded-sm bg-violet-600"></div>Premium ($25/yr)</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2 rounded-sm bg-violet-400"></div>Micro-tx</div>
			</div>
			<div class="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
				<p>• 25% premium conversion rate (constant)</p>
				<p>• Micro-tx spend: $8 → $32/user as engagement deepens</p>
				<p>• Includes: cards, packs, skins, logos, collectibles</p>
			</div>
		</Card>

		<!-- Gambling -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gambling / Sportsbook Growth</h2>
			</div>
			<div class="space-y-2.5">
				{#each rows.filter(r => r.gamblingRevenue > 0) as row}
					<div>
						<div class="flex justify-between text-xs mb-1">
							<span class="text-muted-foreground">{row.year} · {(row.viewers/1_000_000).toFixed(1)}M viewers · {(row.bettors/1_000).toFixed(0)}K bettors</span>
							<span class="font-semibold {row.year === selectedYear ? 'text-emerald-400' : ''}">{fmtM(row.gamblingRevenue)}</span>
						</div>
						<div class="h-3 rounded overflow-hidden bg-muted">
							<div class="h-full rounded bg-emerald-500 transition-all" style="width:{pct(row.gamblingRevenue, maxGambling)}"></div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
				<p>• 8% bettor conversion (conservative vs industry)</p>
				<p>• $6 revenue per bettor per event × 6 events = $36/yr</p>
				<p>• Live betting, props, and intl markets not included</p>
				<p>• Revenue-sharing agreements with licensed sportsbooks</p>
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
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-violet-400 uppercase tracking-wider">Premium Rev</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-violet-300 uppercase tracking-wider">Micro-tx Rev</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-violet-200 uppercase tracking-wider">Total Fantasy</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Viewers</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">Gambling Rev</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}" onclick={() => selectedYear = row.year}>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<span class="font-semibold">{row.year}</span>
									<span class="text-xs px-1.5 py-0.5 rounded-full border {phaseColor[row.phase]}">{row.phase}</span>
								</div>
							</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.fantasyUsers.toLocaleString()}</td>
							<td class="px-4 py-3 text-right text-violet-300">{fmt(row.premiumRevenue)}</td>
							<td class="px-4 py-3 text-right text-violet-300/70">{fmt(row.microTxRevenue)}</td>
							<td class="px-4 py-3 text-right font-semibold text-violet-200">{fmtM(row.totalFantasy)}</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.viewers > 0 ? `${(row.viewers/1_000_000).toFixed(1)}M` : '—'}</td>
							<td class="px-4 py-3 text-right text-emerald-300">{fmtM(row.gamblingRevenue)}</td>
							<td class="px-4 py-3 text-right font-bold">{fmtM(row.total)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Strategic insights + upside -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2031 Position</h2>
			</div>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-3">
				<p class="text-xs text-muted-foreground mb-1">Total Digital Revenue</p>
				<p class="text-3xl font-bold text-emerald-400">$47.9M</p>
				<p class="text-xs text-muted-foreground mt-1">Largest single revenue vertical in FGL</p>
			</div>
			<ul class="space-y-1.5 text-xs text-muted-foreground">
				<li class="flex items-start gap-2"><span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Higher margins than live events, merch, or physical ops</li>
				<li class="flex items-start gap-2"><span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Software + data-driven revenue engine</li>
				<li class="flex items-start gap-2"><span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Scales with broadcast reach, not headcount</li>
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Tv class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Comparable Ecosystems</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					{ label: 'DraftKings / FanDuel', desc: 'Betting + fantasy hybrid models' },
					{ label: 'EA Sports Ultimate Team', desc: 'Microtransaction-driven digital economies' },
					{ label: 'Sorare', desc: 'Collectible + fantasy crossover' }
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>
						<div><span class="font-medium text-foreground">{item.label}</span> — {item.desc}</div>
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Zap class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upside Not in Model</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Premium analytics tiers',
					'Higher bettor conversion rates',
					'International sportsbook expansion',
					'Fantasy esports competitions',
					'NFT / digital collectibles',
					'Subscription upgrades',
					'Live betting & prop markets'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
		</Card>
	</div>

</div>
