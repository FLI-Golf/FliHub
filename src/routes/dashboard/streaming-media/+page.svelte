<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Tv, TrendingUp, Globe, DollarSign, ChevronRight, Info, BarChart3, Zap, Radio } from 'lucide-svelte';

	// ── Data ─────────────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		revenue: number;
		phase: 'Audience Expansion' | 'Early Monetization' | 'Exclusive Rights';
		phaseNum: 1 | 2 | 3;
		focus: string;
		actions: string[];
		dealType: string;
	};

	const rows: YearRow[] = [
		{
			year: 2026, revenue: 0, phase: 'Audience Expansion', phaseNum: 1,
			focus: 'Maximum distribution, not monetization',
			actions: ['Stream on YouTube & social platforms', 'Build international fan engagement', 'Establish betting market data', 'Build viewership metrics'],
			dealType: 'Free / minimal cost to partners'
		},
		{
			year: 2027, revenue: 0, phase: 'Audience Expansion', phaseNum: 1,
			focus: 'Continued distribution growth',
			actions: ['Improved broadcast production', 'Expanded international reach', 'Stronger social media engagement', 'Growth in fantasy & betting ecosystems'],
			dealType: 'Free / minimal cost to partners'
		},
		{
			year: 2028, revenue: 1_000_000, phase: 'Early Monetization', phaseNum: 2,
			focus: 'Initial streaming rights monetization',
			actions: ['Digital sports networks', 'International streaming platforms', 'Sports betting media partners'],
			dealType: 'Non-exclusive licensing'
		},
		{
			year: 2029, revenue: 3_000_000, phase: 'Early Monetization', phaseNum: 2,
			focus: 'National media expansion',
			actions: ['Exclusive regional distribution', 'Non-exclusive international streaming', 'Improved rights deals from proven audience'],
			dealType: 'Hybrid — regional exclusive + intl non-exclusive'
		},
		{
			year: 2030, revenue: 10_000_000, phase: 'Exclusive Rights', phaseNum: 3,
			focus: 'Major media rights deal',
			actions: ['Exclusive live event streaming', 'Production funding', 'Advertising integration', 'National broadcast exposure'],
			dealType: 'Exclusive live streaming + ad integration'
		},
		{
			year: 2031, revenue: 25_000_000, phase: 'Exclusive Rights', phaseNum: 3,
			focus: 'Exclusive global distribution rights',
			actions: ['Exclusive live broadcast rights', 'International distribution', 'Advertising partnerships', 'Expanded tournament schedules'],
			dealType: 'Large-scale exclusive global agreement'
		}
	];

	const phaseColors: Record<string, string> = {
		'Audience Expansion': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
		'Early Monetization': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
		'Exclusive Rights':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const maxRevenue = 25_000_000;

	// Enterprise value
	const ev2031Low  = 25_000_000 * 5;
	const ev2031High = 25_000_000 * 10;

	function fmt(n: number) {
		if (n === 0) return '$0';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		if (n === 0) return '$0';
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }

	let selectedYear = $state(2030);
	const sel = $derived(rows.find(r => r.year === selectedYear)!);
</script>

<svelte:head><title>Streaming & Media Rights - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Streaming &amp; Media Rights</h1>
		<p class="text-muted-foreground">
			Three-phase media strategy · FY 2026–2031 · Audience first, monetization second
		</p>
	</div>

	<!-- Phase timeline -->
	<Card class="p-5">
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Strategy Phases</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{#each [
				{ num: 1, label: 'Audience Expansion', years: '2026–2027', revenue: '$0', color: 'border-blue-500/40 bg-blue-500/5', textColor: 'text-blue-400', desc: 'Maximum distribution, free to partners, build viewership metrics' },
				{ num: 2, label: 'Early Monetization', years: '2028–2029', revenue: '$1M–$3M', color: 'border-amber-500/40 bg-amber-500/5', textColor: 'text-amber-400', desc: 'Non-exclusive licensing, hybrid regional/international deals' },
				{ num: 3, label: 'Exclusive Rights', years: '2030–2031', revenue: '$10M–$25M', color: 'border-emerald-500/40 bg-emerald-500/5', textColor: 'text-emerald-400', desc: 'Exclusive broadcast partnerships, production funding, global distribution' }
			] as phase}
				<div class="rounded-xl border {phase.color} p-4 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<span class="flex size-6 items-center justify-center rounded-full {phase.color} border {phase.color.split(' ')[0]} text-xs font-bold {phase.textColor}">{phase.num}</span>
						<span class="text-xs text-muted-foreground">{phase.years}</span>
					</div>
					<p class="text-sm font-semibold {phase.textColor}">{phase.label}</p>
					<p class="text-xl font-bold">{phase.revenue}</p>
					<p class="text-xs text-muted-foreground leading-relaxed">{phase.desc}</p>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Revenue chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Media Rights Revenue
			</h2>
			<div class="space-y-3">
				{#each rows as row}
					{@const isSelected = row.year === selectedYear}
					{@const hasRevenue = row.revenue > 0}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.year === 2028}
								<span class="text-xs text-amber-400 flex items-center gap-0.5"><ChevronRight class="size-3" />Monetization begins</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.revenue)}</span>
						</div>
						<div class="h-6 rounded-md overflow-hidden bg-muted {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							{#if hasRevenue}
								<div
									class="h-full rounded-md bg-gradient-to-r {row.phaseNum === 2 ? 'from-amber-600 to-amber-400' : 'from-emerald-600 to-emerald-400'} transition-all duration-500"
									style="width:{pct(row.revenue, maxRevenue)}"
								></div>
							{:else}
								<div class="h-full flex items-center px-3">
									<span class="text-xs text-muted-foreground/50 italic">Audience building — no revenue</span>
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel.year} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[sel.phase]}">{sel.phase}</span>
			</div>

			<div class="space-y-2 text-sm">
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Media Rights Revenue</span>
					<span class="text-lg font-bold {sel.revenue > 0 ? 'text-emerald-400' : 'text-muted-foreground'}">{fmtM(sel.revenue)}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Deal Type</span>
					<span class="font-medium text-right text-xs max-w-[55%]">{sel.dealType}</span>
				</div>
			</div>

			<div>
				<p class="text-xs font-semibold text-muted-foreground mb-2">{sel.focus}</p>
				<ul class="space-y-1">
					{#each sel.actions as action}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full {sel.phaseNum === 1 ? 'bg-blue-500' : sel.phaseNum === 2 ? 'bg-amber-500' : 'bg-emerald-500'} shrink-0"></span>
							{action}
						</li>
					{/each}
				</ul>
			</div>

			{#if sel.revenue === 0}
				<div class="rounded-lg bg-blue-500/5 border border-blue-500/30 p-3 text-xs text-blue-300">
					<Info class="size-3.5 inline mr-1" />
					Intentional — free distribution maximizes audience metrics for future rights valuation
				</div>
			{/if}
		</Card>
	</div>

	<!-- Full table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Year-by-Year Projection</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Deal Type</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Revenue</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">EV (5×)</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">EV (10×)</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}" onclick={() => selectedYear = row.year}>
							<td class="px-5 py-3 font-semibold">{row.year}</td>
							<td class="px-5 py-3"><span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span></td>
							<td class="px-5 py-3 text-xs text-muted-foreground">{row.dealType}</td>
							<td class="px-5 py-3 text-right font-bold {row.revenue === 0 ? 'text-muted-foreground/40' : row.phaseNum === 3 ? 'text-emerald-400' : 'text-amber-400'}">{fmtM(row.revenue)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{row.revenue > 0 ? fmtM(row.revenue * 5) : '—'}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{row.revenue > 0 ? fmtM(row.revenue * 10) : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Enterprise value + strategic impact + upside -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2031 Enterprise Value</h2>
			</div>
			<div class="space-y-3">
				<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
					<p class="text-xs text-muted-foreground mb-1">Annual Media Rights Revenue</p>
					<p class="text-3xl font-bold text-emerald-400">$25M</p>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-lg border border-slate-600 bg-slate-800/40 p-3 text-center">
						<p class="text-xs text-muted-foreground mb-1">Low Case (5×)</p>
						<p class="text-xl font-bold">{fmtM(ev2031Low)}</p>
					</div>
					<div class="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-center">
						<p class="text-xs text-muted-foreground mb-1">High Case (10×)</p>
						<p class="text-xl font-bold text-violet-400">{fmtM(ev2031High)}</p>
					</div>
				</div>
				<p class="text-xs text-muted-foreground">
					<Info class="size-3.5 inline mr-1" />
					Sports leagues are frequently valued on media rights multiples
				</p>
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Tv class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Strategic Impact</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					{ point: 'Scales with audience growth — no marginal cost', color: 'bg-blue-500' },
					{ point: 'Increases sponsorship value as viewership grows', color: 'bg-blue-500' },
					{ point: 'Drives fantasy and gaming participation', color: 'bg-blue-500' },
					{ point: 'Expands global brand recognition', color: 'bg-blue-500' },
					{ point: 'Free Phase 1 distribution creates more valuable Phase 3 package', color: 'bg-amber-500' },
					{ point: 'Betting market data from Phase 1 strengthens Phase 2 deals', color: 'bg-amber-500' }
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full {item.color} shrink-0"></span>{item.point}
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Zap class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upside Not in Model</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					'Advertising revenue sharing',
					'Sponsorship integration fees',
					'International licensing',
					'Documentary & behind-the-scenes content',
					'Highlight clip licensing',
					'Archive / VOD rights'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Mirrors approach used by UFC, PGA Tour, and emerging digital sports properties
			</div>
		</Card>
	</div>

</div>
