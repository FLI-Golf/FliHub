<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Flag,
		TrendingUp,
		ChevronRight,
		Info,
		DollarSign,
		LayoutGrid,
		Megaphone,
		Package,
		MapPin,
		ShieldCheck,
		Repeat2
	} from 'lucide-svelte';

	// ── 2027 baseline cost breakdown ─────────────────────────────────────────

	const breakdown2027 = [
		{ label: 'Fairway Signage',    amount: 40_500, icon: Flag,       color: 'bg-emerald-500', textColor: 'text-emerald-400', desc: '180 signs × $75 × 3 print cycles' },
		{ label: 'Tent & Table Wraps', amount: 14_000, icon: LayoutGrid, color: 'bg-blue-500',    textColor: 'text-blue-400',    desc: '8 tent wraps + 8 table wraps per event' },
		{ label: 'Sponsor Banners',    amount: 14_000, icon: Megaphone,  color: 'bg-violet-500',  textColor: 'text-violet-400',  desc: '15 large banners per event' },
		{ label: 'Flags & Hardware',   amount: 8_000,  icon: Flag,       color: 'bg-amber-500',   textColor: 'text-amber-400',   desc: '30+ flags per event' },
		{ label: 'Merch Displays',     amount: 5_000,  icon: Package,    color: 'bg-orange-500',  textColor: 'text-orange-400',  desc: 'Merchandising display infrastructure' },
		{ label: 'Directional Signage',amount: 4_500,  icon: MapPin,     color: 'bg-cyan-500',    textColor: 'text-cyan-400',    desc: 'Operational & wayfinding signage' },
		{ label: 'Contingency',        amount: 4_000,  icon: ShieldCheck,color: 'bg-rose-500',    textColor: 'text-rose-400',    desc: '~4.4% of total budget' }
	];

	// ── Multi-year scaling ────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		total: number;
		perEvent: number;
		multiplier: string | null;
		pctChange: number | null;
		phase: string;
		drivers: string[];
	};

	const years: YearRow[] = [
		{
			year: 2027, total: 90_000,   perEvent: 15_000,  multiplier: null,    pctChange: null,
			phase: 'Baseline',
			drivers: ['180 signs × $75 × 3 cycles', '250+ placements per event', '$5.45 cost per attendee']
		},
		{
			year: 2028, total: 112_500,  perEvent: 18_750,  multiplier: '1.25×', pctChange: 25,
			phase: 'Growth',
			drivers: ['Material upgrades', 'Sponsor growth', 'Additional print cycles']
		},
		{
			year: 2029, total: 210_938,  perEvent: 35_156,  multiplier: '1.875×', pctChange: 87.5,
			phase: 'Expansion',
			drivers: ['Increased sponsor inventory', 'Higher-density placements', 'Expanded branding zones']
		},
		{
			year: 2030, total: 421_875,  perEvent: 70_313,  multiplier: '2.0×',  pctChange: 100,
			phase: 'Replication',
			drivers: ['International duplication', 'Full system replication', 'Multi-region operations']
		},
		{
			year: 2031, total: 632_813,  perEvent: 105_469, multiplier: '1.5×',  pctChange: 50,
			phase: 'Optimization',
			drivers: ['Premium materials', 'Increased sponsor tiers', 'Expanded activation zones']
		}
	];

	const phaseColors: Record<string, string> = {
		Baseline:     'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Growth:       'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Expansion:    'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Replication:  'bg-violet-500/10 text-violet-400 border-violet-500/30',
		Optimization: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const costControls = [
		'Multi-cycle print strategy',
		'Bulk production pricing',
		'Controlled sponsor rotation',
		'Reusable infrastructure',
		'Regional vendor sourcing (international)'
	];

	const maxTotal    = Math.max(...years.map(y => y.total));
	const maxBreakdown = Math.max(...breakdown2027.map(b => b.amount));

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

	let expandedCategory = $state<string | null>(null);
	function toggleCategory(label: string) {
		expandedCategory = expandedCategory === label ? null : label;
	}
</script>

<svelte:head>
	<title>On-Course Branding - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">On-Course Branding &amp; Print</h1>
		<p class="text-muted-foreground">
			Formula-based scaling model · FY 2027–2031 · 6 events · COGS – Tournament Execution
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Flag class="size-3.5 shrink-0" />
					<span class="text-xs">2027 Baseline</span>
				</div>
				<p class="text-xl font-bold">$90,000</p>
				<p class="text-xs text-muted-foreground">$15K per event · 250+ placements</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-amber-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2029 Expansion</span>
				</div>
				<p class="text-xl font-bold text-amber-400">$210,938</p>
				<p class="text-xs text-muted-foreground">1.875× from 2028</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-violet-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2030 Replication</span>
				</div>
				<p class="text-xl font-bold text-violet-400">$421,875</p>
				<p class="text-xs text-muted-foreground">2.0× from 2029</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-emerald-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2031 Optimization</span>
				</div>
				<p class="text-xl font-bold text-emerald-400">$632,813</p>
				<p class="text-xs text-muted-foreground">1.5× from 2030</p>
			</div>
		</div>
	</Card>

	<!-- Multi-year chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Branding Budget
			</h2>
			<div class="space-y-3">
				{#each years as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.multiplier}
								<span class="text-xs text-muted-foreground flex items-center gap-0.5">
									<ChevronRight class="size-3" />{row.multiplier}
									{#if row.pctChange}
										<span class="ml-1 text-muted-foreground/60">(+{row.pctChange}%)</span>
									{/if}
								</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(row.total)}</span>
						</div>
						<div class="h-6 rounded-md overflow-hidden bg-muted {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div
								class="h-full rounded-md bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-500"
								style="width: {pct(row.total, maxTotal)}"
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
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[selected.phase]}">{selected.phase}</span>
			</div>
			<div class="space-y-2">
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Total Budget</span>
					<span class="text-lg font-bold">{fmt(selected.total)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Per Event</span>
					<span class="font-semibold">{fmt(selected.perEvent)}</span>
				</div>
				{#if selected.year === 2027}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">Per Attendee</span>
						<span class="font-semibold">$5.45</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">Placements / Event</span>
						<span class="font-semibold">250+</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">Season Placements</span>
						<span class="font-semibold">1,500+</span>
					</div>
				{/if}
				{#if selected.multiplier}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">YoY Scale</span>
						<span class="font-semibold text-emerald-400">{selected.multiplier}</span>
					</div>
				{/if}
			</div>
			<div class="rounded-lg bg-muted/40 p-3">
				<ul class="space-y-1">
					{#each selected.drivers as d}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>{d}
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	</div>

	<!-- 2027 cost breakdown cards -->
	<div>
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
			2027 Cost Breakdown <span class="normal-case font-normal ml-1">($90,000 total · $15,000 per event)</span>
		</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
			{#each breakdown2027 as item}
				{@const Icon = item.icon}
				{@const sharePct = Math.round((item.amount / 90_000) * 100)}
				{@const isExpanded = expandedCategory === item.label}
				<button
					class="text-left rounded-xl border border-border bg-card p-3 flex flex-col gap-2 hover:border-slate-600 transition-colors {isExpanded ? 'ring-2 ring-primary/40' : ''}"
					onclick={() => toggleCategory(item.label)}
				>
					<div class="flex items-center justify-between">
						<div class="flex size-7 items-center justify-center rounded-lg {item.color}/20">
							<Icon class="size-3.5 {item.textColor}" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">{sharePct}%</span>
					</div>
					<p class="text-base font-bold">{fmt(item.amount)}</p>
					<p class="text-xs font-medium leading-tight">{item.label}</p>
					<div class="h-1 rounded-full bg-muted overflow-hidden">
						<div class="{item.color} h-full rounded-full" style="width: {pct(item.amount, maxBreakdown)}"></div>
					</div>
					{#if isExpanded}
						<p class="text-xs text-muted-foreground pt-1 border-t border-border">{item.desc}</p>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Fairway sign formula + visual inventory -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Fairway Sign Formula</h2>
			<div class="space-y-3">
				<!-- Formula steps -->
				{#each [
					{ label: 'Holes per course',          value: '9',          note: 'Course structure' },
					{ label: 'Signs per hole',            value: '× 20',       note: 'Fairway density' },
					{ label: 'Signs per event',           value: '= 180',      note: 'Total placements', highlight: true },
					{ label: 'Blended cost per sign',     value: '× $75',      note: '$60–$100 range' },
					{ label: 'Single print cycle cost',   value: '= $13,500',  note: 'Per production run', highlight: true },
					{ label: 'Print cycles per season',   value: '× 3',        note: '1 initial + 2 rotation' },
					{ label: 'Total fairway sign cost',   value: '= $40,500',  note: '2027 season total', highlight: true }
				] as step}
					<div class="flex items-center justify-between {step.highlight ? 'bg-muted/40 rounded-lg px-3 py-2 -mx-1' : 'px-1'}">
						<span class="text-sm {step.highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}">{step.label}</span>
						<div class="text-right">
							<span class="text-sm font-bold {step.highlight ? 'text-emerald-400' : ''}">{step.value}</span>
							<p class="text-xs text-muted-foreground">{step.note}</p>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Amortized per sign per event: <span class="font-semibold text-foreground">$37.50</span>
			</div>
		</Card>

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Visual Inventory Per Event</h2>
			<div class="space-y-2.5">
				{#each [
					{ label: 'Fairway Signs',      count: '180',   bar: 180, max: 180, color: 'bg-emerald-500' },
					{ label: 'Flags',              count: '30+',   bar: 30,  max: 180, color: 'bg-amber-500' },
					{ label: 'Large Banners',      count: '15',    bar: 15,  max: 180, color: 'bg-violet-500' },
					{ label: 'Tent Wraps',         count: '8',     bar: 8,   max: 180, color: 'bg-blue-500' },
					{ label: 'Table Wraps',        count: '8',     bar: 8,   max: 180, color: 'bg-cyan-500' },
					{ label: 'Directional Signs',  count: 'Multi', bar: 10,  max: 180, color: 'bg-orange-500' }
				] as item}
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-32 shrink-0">{item.label}</span>
						<div class="flex-1 h-4 rounded bg-muted overflow-hidden">
							<div class="h-full rounded {item.color}" style="width: {pct(item.bar, item.max)}"></div>
						</div>
						<span class="text-sm font-semibold w-12 text-right shrink-0">{item.count}</span>
					</div>
				{/each}
			</div>
			<div class="mt-3 pt-3 border-t border-border flex justify-between text-sm">
				<span class="text-muted-foreground">Total per event</span>
				<span class="font-bold text-emerald-400">250+ placements</span>
			</div>
			<div class="flex justify-between text-sm mt-1">
				<span class="text-muted-foreground">Full season (×6)</span>
				<span class="font-bold">1,500+ placements</span>
			</div>
		</Card>
	</div>

	<!-- ROI analysis + cost controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue Alignment &amp; ROI</h2>
			</div>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4">
				<p class="text-xs text-muted-foreground mb-1">Baseline ROI Potential (2027)</p>
				<p class="text-3xl font-bold text-emerald-400">16.7×</p>
				<p class="text-xs text-muted-foreground mt-1">1,500 placements × $1,000 low sponsor price = $1.5M revenue</p>
				<p class="text-xs text-muted-foreground">vs. $90,000 infrastructure cost</p>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Turns course into monetized media surface',
					'Drives sponsorship pricing power',
					'Maximizes broadcast visibility',
					'Enables high-density sponsor inventory',
					'Scales with revenue, not overhead'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<Repeat2 class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cost Controls</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each costControls as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>

			<!-- Multi-year table compact -->
			<div class="mt-2 pt-3 border-t border-border">
				<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Multi-Year Summary</p>
				<div class="space-y-1.5">
					{#each years as row}
						<div class="flex items-center gap-2 text-xs">
							<span class="text-muted-foreground w-10 shrink-0">{row.year}</span>
							<div class="flex-1 h-3 rounded bg-muted overflow-hidden">
								<div class="h-full rounded bg-gradient-to-r from-emerald-600 to-cyan-500" style="width: {pct(row.total, maxTotal)}"></div>
							</div>
							<span class="font-semibold w-20 text-right shrink-0">{fmt(row.total)}</span>
							<span class="text-muted-foreground/60 w-12 text-right shrink-0">{row.multiplier ?? '—'}</span>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	</div>

</div>
