<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Trophy,
		TrendingUp,
		Users,
		DollarSign,
		Shield,
		Tv,
		Info,
		ChevronRight,
		Award
	} from 'lucide-svelte';

	// ── Data ────────────────────────────────────────────────────────────────────

	const yearlyPurse = [
		{ year: 2027, total: 4_000_000, perEvent: 666_667,   scale: null,   pct: null,   phase: 'Foundation' },
		{ year: 2028, total: 4_000_000, perEvent: 666_667,   scale: 'Flat', pct: 0,      phase: 'Foundation' },
		{ year: 2029, total: 6_000_000, perEvent: 1_000_000, scale: '1.5×', pct: 50,     phase: 'Growth' },
		{ year: 2030, total: 8_000_000, perEvent: 1_333_333, scale: '1.33×',pct: 33,     phase: 'Expansion' },
		{ year: 2031, total: 10_000_000,perEvent: 1_666_667, scale: '1.25×',pct: 25,     phase: 'Scale' }
	];

	const tournaments2027 = [
		{ name: 'Tournament 1', purse: 500_000,  first: 100_000, last: 8_000,  spread: 12.5 },
		{ name: 'Tournament 2', purse: 550_000,  first: null,    last: null,   spread: null },
		{ name: 'Tournament 3', purse: 600_000,  first: null,    last: null,   spread: null },
		{ name: 'Tournament 4', purse: 650_000,  first: null,    last: null,   spread: null },
		{ name: 'Tournament 5', purse: 750_000,  first: null,    last: null,   spread: null },
		{ name: 'Championship', purse: 950_000,  first: 191_250, last: 10_500, spread: 18.2 }
	];

	const teamEarnings2027 = [
		{ name: 'Birdie Storm',   amount: 463_800, rank: 1 },
		{ name: 'Team 2',         amount: 420_000, rank: 2 },
		{ name: 'Team 3',         amount: 390_000, rank: 3 },
		{ name: 'Team 4',         amount: 360_000, rank: 4 },
		{ name: 'Team 5',         amount: 345_000, rank: 5 },
		{ name: 'Team 6',         amount: 335_000, rank: 6 },
		{ name: 'Team 7',         amount: 320_000, rank: 7 },
		{ name: 'Team 8',         amount: 305_000, rank: 8 },
		{ name: 'Team 9',         amount: 280_000, rank: 9 },
		{ name: 'Team 10',        amount: 240_000, rank: 10 },
		{ name: 'Ace Makers',     amount: 180_000, rank: 11 },
		{ name: 'Chain Seekers',  amount: 180_000, rank: 12 }
	];

	const avgTeamEarnings = 4_000_000 / 12; // 333,333

	const integrityRules = [
		'No team finishes in the same position across all 6 events',
		'Bottom 3 teams finish Top 5 at least once per season',
		'No team finishes last more than 3 times',
		'No team finishes bottom 3 more than 4 times',
		'No team wins more than 4 tournaments'
	];

	const phaseColors: Record<string, string> = {
		Foundation: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Growth:     'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Expansion:  'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Scale:      'bg-violet-500/10 text-violet-400 border-violet-500/30'
	};

	const phaseDrivers: Record<string, string> = {
		Foundation: 'Stability, player trust, league foundation',
		Growth:     'Sponsorship growth, increased demand, media expansion',
		Expansion:  'Stronger credibility, higher-tier players, broadcast value',
		Scale:      'Global expansion, international player pool, premium positioning'
	};

	const maxPurse = Math.max(...yearlyPurse.map(y => y.total));
	const maxTeam  = Math.max(...teamEarnings2027.map(t => t.amount));

	function fmt(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}

	function fmtM(n: number): string {
		return `$${(n / 1_000_000).toFixed(0)}M`;
	}

	function pct(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let selectedYear = $state(2027);
	const selectedRow = $derived(yearlyPurse.find(y => y.year === selectedYear)!);

	// Per-player avg for selected year
	const perPlayer = $derived(selectedRow.total / 36);
</script>

<svelte:head>
	<title>Prize Purse Structure - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Prize Purse Structure</h1>
		<p class="text-muted-foreground">
			Competitive financial model · FY 2027–2031 · 12 teams · 6 events per season
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Trophy class="size-3.5 shrink-0" />
					<span class="text-xs">2027–2028 Annual</span>
				</div>
				<p class="text-xl font-bold">$4M</p>
				<p class="text-xs text-muted-foreground">Foundation baseline</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-amber-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2029 Growth</span>
				</div>
				<p class="text-xl font-bold text-amber-400">$6M</p>
				<p class="text-xs text-muted-foreground">+50% from baseline</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-orange-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2030 Expansion</span>
				</div>
				<p class="text-xl font-bold text-orange-400">$8M</p>
				<p class="text-xs text-muted-foreground">+33% from 2029</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-violet-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2031 Scale</span>
				</div>
				<p class="text-xl font-bold text-violet-400">$10M</p>
				<p class="text-xs text-muted-foreground">+25% from 2030</p>
			</div>
		</div>
	</Card>

	<!-- Multi-year chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Year bars -->
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Total Prize Pool by Year
			</h2>
			<div class="space-y-3">
				{#each yearlyPurse as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.scale && row.scale !== 'Flat'}
								<span class="text-xs text-muted-foreground flex items-center gap-0.5">
									<ChevronRight class="size-3" />{row.scale}
								</span>
							{:else if row.scale === 'Flat'}
								<span class="text-xs text-muted-foreground">Flat</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.total)}</span>
						</div>
						<div class="h-6 rounded-md overflow-hidden bg-muted {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div
								class="h-full rounded-md bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
								style="width: {pct(row.total, maxPurse)}"
							></div>
						</div>
					</button>
				{/each}
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{selectedYear} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[selectedRow.phase]}">{selectedRow.phase}</span>
			</div>

			<div class="space-y-3">
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Total Purse</span>
					<span class="text-lg font-bold">{fmtM(selectedRow.total)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Per Event</span>
					<span class="font-semibold">{fmt(selectedRow.perEvent)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Avg per Team</span>
					<span class="font-semibold">{fmt(selectedRow.total / 12)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Avg per Player</span>
					<span class="font-semibold">{fmt(perPlayer)}</span>
				</div>
				{#if selectedRow.scale && selectedRow.scale !== 'Flat'}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">YoY Scale</span>
						<span class="font-semibold text-emerald-400">{selectedRow.scale} (+{selectedRow.pct}%)</span>
					</div>
				{/if}
			</div>

			<div class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
				<Info class="size-3.5 inline mr-1 shrink-0" />
				{phaseDrivers[selectedRow.phase]}
			</div>
		</Card>
	</div>

	<!-- 2027 Tournament breakdown + team earnings -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

		<!-- Tournament purse breakdown -->
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				2027 Tournament Purse Breakdown
			</h2>
			<div class="space-y-2">
				{#each tournaments2027 as t, i}
					{@const isChamp = i === 5}
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-24 shrink-0">{t.name}</span>
						<div class="flex-1 h-5 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded transition-all {isChamp ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-emerald-600/70'}"
								style="width: {pct(t.purse, 950_000)}"
							></div>
						</div>
						<span class="text-sm font-semibold w-20 text-right shrink-0">{fmt(t.purse)}</span>
					</div>
					{#if t.spread}
						<div class="ml-24 text-xs text-muted-foreground pb-1">
							1st {fmt(t.first!)} · 12th {fmt(t.last!)} · <span class="text-amber-400">{t.spread}× spread</span>
						</div>
					{/if}
				{/each}
			</div>
			<div class="mt-4 pt-3 border-t border-border flex justify-between text-sm">
				<span class="text-muted-foreground">Championship share</span>
				<span class="font-semibold text-amber-400">23.75% of total purse</span>
			</div>
		</Card>

		<!-- Team earnings -->
		<Card class="p-5">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					2027 Team Earnings
				</h2>
				<span class="text-xs text-muted-foreground">Avg {fmt(avgTeamEarnings)}</span>
			</div>
			<div class="space-y-1.5">
				{#each teamEarnings2027 as team}
					{@const aboveAvg = team.amount >= avgTeamEarnings}
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted-foreground w-4 shrink-0 text-right">{team.rank}</span>
						<span class="text-xs w-24 shrink-0 truncate {team.rank <= 3 ? 'font-semibold text-foreground' : 'text-muted-foreground'}">{team.name}</span>
						<div class="flex-1 h-4 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded transition-all {aboveAvg ? 'bg-emerald-500' : 'bg-slate-500'}"
								style="width: {pct(team.amount, maxTeam)}"
							></div>
						</div>
						<span class="text-xs font-semibold w-16 text-right shrink-0">{fmt(team.amount)}</span>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
				<div>
					<p class="font-bold text-emerald-400">{fmt(463_800)}</p>
					<p class="text-muted-foreground">Top team</p>
				</div>
				<div>
					<p class="font-bold">{fmt(avgTeamEarnings)}</p>
					<p class="text-muted-foreground">Average</p>
				</div>
				<div>
					<p class="font-bold text-slate-400">{fmt(180_000)}</p>
					<p class="text-muted-foreground">Bottom teams</p>
				</div>
			</div>
			<p class="text-xs text-muted-foreground text-center mt-2">
				Earnings spread: <span class="font-semibold text-foreground">2.57×</span> · All teams remain financially viable
			</p>
		</Card>
	</div>

	<!-- Per-player scaling -->
	<Card class="p-5">
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
			Average Per-Player Earnings (36 players)
		</h2>
		<div class="grid grid-cols-3 sm:grid-cols-5 gap-4">
			{#each yearlyPurse as row}
				{@const ppAvg = row.total / 36}
				<div class="flex flex-col items-center gap-1 text-center">
					<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.year}</span>
					<p class="text-xl font-bold mt-1">{fmt(ppAvg)}</p>
					<p class="text-xs text-muted-foreground">per player avg</p>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Bottom row: integrity rules + broadcast/sustainability -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<!-- Competitive integrity -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Shield class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Competitive Integrity</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each integrityRules as rule}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>
						{rule}
					</li>
				{/each}
			</ul>
		</Card>

		<!-- Broadcast & betting -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Tv class="size-4 text-violet-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Broadcast &amp; Betting</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Defined landing zones for outcomes',
					'Consistent rule enforcement',
					'Structured penalties',
					'Shot clock timing',
					'Escalating payouts drive late-season drama'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-violet-500 shrink-0"></span>
						{item}
					</li>
				{/each}
			</ul>
		</Card>

		<!-- Revenue alignment -->
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue Alignment</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3">Purse target: <span class="font-semibold text-foreground">15–25% of total revenue</span></p>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Sponsorship revenue',
					'Ticket sales',
					'Broadcast rights',
					'Gaming / betting integration',
					'Merchandise and licensing'
				] as source}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
						{source}
					</li>
				{/each}
			</ul>
		</Card>
	</div>

</div>
