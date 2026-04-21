<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { FileText, TrendingUp, DollarSign, ChevronRight, Info, BarChart3, Zap, Globe } from 'lucide-svelte';

	// ── Data ─────────────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		licensees: number;
		avgGuarantee: number;
		guarantees: number;
		royalties: number;
		total: number;
		phase: string;
		categories: string[];
		drivers: string[];
	};

	const rows: YearRow[] = [
		{
			year: 2026, licensees: 0, avgGuarantee: 0, guarantees: 0, royalties: 0, total: 0,
			phase: 'Pre-Launch',
			categories: ['Build brand identity', 'Finalize IP assets', 'Begin partner discussions'],
			drivers: ['Foundation year — no monetization']
		},
		{
			year: 2027, licensees: 3, avgGuarantee: 75_000, guarantees: 225_000, royalties: 75_000, total: 300_000,
			phase: 'Soft Launch',
			categories: ['Novelty merchandise', 'Drinkware', 'Decals & stickers', 'Collectibles'],
			drivers: ['Early brand validation', 'Low-risk partner entry']
		},
		{
			year: 2028, licensees: 5, avgGuarantee: 140_000, guarantees: 900_000, royalties: 300_000, total: 1_200_000,
			phase: 'Early Expansion',
			categories: ['Disc golf accessories', 'Training equipment', 'Youth products', 'Crossover golf products'],
			drivers: ['Validation + controlled expansion', 'Proven audience metrics']
		},
		{
			year: 2029, licensees: 12, avgGuarantee: 300_000, guarantees: 3_600_000, royalties: 1_400_000, total: 5_000_000,
			phase: 'National Scale',
			categories: ['National retail partnerships', 'Co-branded apparel', 'Video game licensing', 'Collectibles', 'Lifestyle brands'],
			drivers: ['Broadcast growth', 'Sponsorship scale', 'Fantasy ecosystem']
		},
		{
			year: 2030, licensees: 20, avgGuarantee: 400_000, guarantees: 8_000_000, royalties: 4_000_000, total: 12_000_000,
			phase: 'International',
			categories: ['International territory deals', 'Betting data licensing', 'Simulation / video games', 'Youth academies', 'Overseas product distribution'],
			drivers: ['International expansion', 'Media rights growth', 'Global brand recognition']
		},
		{
			year: 2031, licensees: 30, avgGuarantee: 500_000, guarantees: 15_000_000, royalties: 8_000_000, total: 23_000_000,
			phase: 'Global Scale',
			categories: ['Global apparel licensing', 'International retail', 'Gaming franchises', 'Media IP licensing', 'Collectibles', 'Lifestyle collaborations'],
			drivers: ['Global brand reach', 'Exclusive media rights', 'Full ecosystem maturity']
		}
	];

	const phaseColors: Record<string, string> = {
		'Pre-Launch':       'bg-slate-500/10 text-slate-400 border-slate-500/30',
		'Soft Launch':      'bg-blue-500/10 text-blue-400 border-blue-500/30',
		'Early Expansion':  'bg-amber-500/10 text-amber-400 border-amber-500/30',
		'National Scale':   'bg-orange-500/10 text-orange-400 border-orange-500/30',
		'International':    'bg-violet-500/10 text-violet-400 border-violet-500/30',
		'Global Scale':     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const ipScope = [
		'League name & logos', 'Team names & logos', 'Player likeness (collective)',
		'Fantasy assets', 'Trading cards', 'Digital collectibles', 'Discopolis universe'
	];

	const maxTotal = 23_000_000;

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

	let selectedYear = $state(2029);
	const sel = $derived(rows.find(r => r.year === selectedYear)!);
	const royaltyShare = $derived(sel.total > 0 ? Math.round((sel.royalties / sel.total) * 100) : 0);
	const guaranteeShare = $derived(100 - royaltyShare);
</script>

<svelte:head><title>League Licensing - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">League Licensing Strategy</h1>
		<p class="text-muted-foreground">
			IP monetization · FY 2026–2031 · Minimum guarantees + royalties · Capital-light, high-margin
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each rows as row}
				{@const colorMap: Record<string,string> = { 'Pre-Launch':'text-slate-400','Soft Launch':'text-blue-400','Early Expansion':'text-amber-400','National Scale':'text-orange-400','International':'text-violet-400','Global Scale':'text-emerald-400' }}
				<button class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors {selectedYear === row.year ? 'bg-muted/40' : ''}" onclick={() => selectedYear = row.year}>
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">{row.year}</span>
					</div>
					<p class="text-lg font-bold {colorMap[row.phase]}">{fmtM(row.total)}</p>
					<p class="text-xs text-muted-foreground">{row.phase}</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Revenue chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Licensing Revenue — Guarantees vs Royalties
			</h2>
			<div class="space-y-3">
				{#each rows as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.licensees > 0}
								<span class="text-xs text-muted-foreground">{row.licensees} licensees</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(row.total)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							{#if row.total > 0}
								<div class="bg-blue-500 transition-all" style="width:{pct(row.guarantees, maxTotal)}"></div>
								<div class="bg-emerald-500 transition-all" style="width:{pct(row.royalties, maxTotal)}"></div>
							{:else}
								<div class="flex-1 flex items-center px-3 bg-muted/30">
									<span class="text-xs text-muted-foreground/50 italic">Foundation year — no revenue</span>
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-blue-500"></div>Minimum Guarantees</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-emerald-500"></div>Royalties</div>
			</div>
		</Card>

		<!-- Year detail -->
		<Card class="p-5 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel.year} Detail</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[sel.phase]}">{sel.phase}</span>
			</div>

			{#if sel.total > 0}
				<!-- Split bar -->
				<div>
					<div class="flex h-3 rounded-full overflow-hidden gap-px mb-1">
						<div class="bg-blue-500" style="width:{guaranteeShare}%"></div>
						<div class="bg-emerald-500" style="width:{royaltyShare}%"></div>
					</div>
					<div class="flex justify-between text-xs text-muted-foreground">
						<span class="text-blue-400">Guarantees {guaranteeShare}%</span>
						<span class="text-emerald-400">Royalties {royaltyShare}%</span>
					</div>
				</div>

				<div class="space-y-2 text-sm">
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Licensees</span>
						<span class="font-semibold">{sel.licensees}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Avg Guarantee</span>
						<span class="font-semibold">{fmt(sel.avgGuarantee)}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Total Guarantees</span>
						<span class="font-semibold text-blue-400">{fmt(sel.guarantees)}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-border">
						<span class="text-muted-foreground">Royalty Revenue</span>
						<span class="font-semibold text-emerald-400">{fmt(sel.royalties)}</span>
					</div>
					<div class="flex justify-between pt-2 font-bold text-base">
						<span>Total</span>
						<span>{fmtM(sel.total)}</span>
					</div>
				</div>
			{:else}
				<div class="rounded-lg bg-slate-500/5 border border-slate-500/30 p-3 text-xs text-slate-300">
					<Info class="size-3.5 inline mr-1" />
					Foundation year — building IP assets and beginning partner discussions
				</div>
			{/if}

			<div>
				<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
				<ul class="space-y-1">
					{#each sel.categories as cat}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{cat}
						</li>
					{/each}
				</ul>
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
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Licensees</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Guarantee</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Guarantees</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">Royalties</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total</th>
						<th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">EV (6–10×)</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each rows as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}" onclick={() => selectedYear = row.year}>
							<td class="px-4 py-3 font-semibold">{row.year}</td>
							<td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span></td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.licensees || '—'}</td>
							<td class="px-4 py-3 text-right text-muted-foreground">{row.avgGuarantee ? fmt(row.avgGuarantee) : '—'}</td>
							<td class="px-4 py-3 text-right text-blue-300">{row.guarantees ? fmt(row.guarantees) : '—'}</td>
							<td class="px-4 py-3 text-right text-emerald-300">{row.royalties ? fmt(row.royalties) : '—'}</td>
							<td class="px-4 py-3 text-right font-bold {row.total === 0 ? 'text-muted-foreground/40' : ''}">{fmtM(row.total)}</td>
							<td class="px-4 py-3 text-right text-muted-foreground text-xs">{row.total > 0 ? `${fmtM(row.total * 6)}–${fmtM(row.total * 10)}` : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- IP scope + enterprise value + strategic value -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<FileText class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">IP Scope</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each ipScope as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Industry royalty rates: 8%–15% of wholesale · Standard model: NBA, NFL, Formula 1
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<BarChart3 class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">2031 Enterprise Value</h2>
			</div>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-3">
				<p class="text-xs text-muted-foreground mb-1">Annual Licensing Revenue</p>
				<p class="text-3xl font-bold text-emerald-400">$23M</p>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg border border-slate-600 bg-slate-800/40 p-3 text-center">
					<p class="text-xs text-muted-foreground mb-1">Low (6×)</p>
					<p class="text-xl font-bold">$138M</p>
				</div>
				<div class="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-center">
					<p class="text-xs text-muted-foreground mb-1">High (10×)</p>
					<p class="text-xl font-bold text-violet-400">$230M</p>
				</div>
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Zap class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Why Licensing Accelerates</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3">Licensing does not grow linearly — it accelerates when:</p>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each ['Brand becomes recognizable', 'Teams gain identity', 'Media exposure increases', 'Collectibles gain traction'] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
				<Info class="size-3.5 inline mr-1" />
				Licensing explodes only AFTER media growth, fan engagement, and brand recognition — all of which FGL builds in 2026–2028
			</div>
		</Card>
	</div>

</div>
