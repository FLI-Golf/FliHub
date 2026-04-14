<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Mic2,
		Lightbulb,
		Zap,
		Users,
		Truck,
		Shield,
		TrendingUp,
		ChevronRight,
		Info,
		Tv,
		DollarSign,
		Building2
	} from 'lucide-svelte';

	// ── Per-event cost breakdown (2027 baseline) ─────────────────────────────

	const perEventBreakdown = [
		{
			label: 'Stage Structure & Rigging',
			amount: 60_000,
			icon: Building2,
			color: 'bg-blue-500',
			textColor: 'text-blue-400',
			components: ['Mobile stage (40\'–60\')', 'Roof system & aluminum truss', 'Decking & barricades'],
			formula: '$45K stage + $12.5K rigging + $7.5K labor'
		},
		{
			label: 'Production Staffing',
			amount: 60_000,
			icon: Users,
			color: 'bg-violet-500',
			textColor: 'text-violet-400',
			components: ['Production & stage managers', '6 core technical leads', '14 crew + labor buffer'],
			formula: '$30.2K core + $22.8K crew + $7K buffer'
		},
		{
			label: 'Audio System',
			amount: 55_000,
			icon: Mic2,
			color: 'bg-emerald-500',
			textColor: 'text-emerald-400',
			components: ['Line array speakers (L/R)', 'FOH + monitor consoles', 'Wireless mics & backline'],
			formula: '$35K PA + $12.5K engineers + $5K backline'
		},
		{
			label: 'Lighting & Visual',
			amount: 30_000,
			icon: Lightbulb,
			color: 'bg-amber-500',
			textColor: 'text-amber-400',
			components: ['Moving head lights', 'Wash lighting & console', 'Basic LED panels'],
			formula: '$25K–$35K blended ≈ $30K'
		},
		{
			label: 'Power & Generators',
			amount: 20_000,
			icon: Zap,
			color: 'bg-orange-500',
			textColor: 'text-orange-400',
			components: ['Primary generators', 'Backup redundancy', 'Distribution & cabling'],
			formula: '$15K–$25K blended ≈ $20K'
		},
		{
			label: 'Logistics',
			amount: 15_000,
			icon: Truck,
			color: 'bg-cyan-500',
			textColor: 'text-cyan-400',
			components: ['Trucking & transport', 'Forklifts', 'Setup coordination'],
			formula: '$10K–$20K blended ≈ $15K'
		},
		{
			label: 'Contingency',
			amount: 10_000,
			icon: Shield,
			color: 'bg-rose-500',
			textColor: 'text-rose-400',
			components: ['4% of per-event budget'],
			formula: '$250K × 4% = $10K'
		}
	];

	// ── Staffing detail ───────────────────────────────────────────────────────

	const coreStaff = [
		{ role: 'Production Manager', rate: 2_000, days: 4, total: 8_000 },
		{ role: 'Stage Manager',      rate: 1_500, days: 4, total: 6_000 },
		{ role: 'Audio Lead',         rate: 1_500, days: 3, total: 4_500 },
		{ role: 'Monitor Engineer',   rate: 1_200, days: 3, total: 3_600 },
		{ role: 'Lighting Director',  rate: 1_500, days: 3, total: 4_500 },
		{ role: 'Master Electrician', rate: 1_200, days: 3, total: 3_600 }
	];

	const techCrew = [
		{ role: 'Audio Tech (×2)',    rate: 800,  days: 3, count: 2, total: 4_800 },
		{ role: 'Lighting Tech (×2)', rate: 800,  days: 3, count: 2, total: 4_800 },
		{ role: 'Riggers (×2)',       rate: 900,  days: 2, count: 2, total: 3_600 },
		{ role: 'Stagehands (×8)',    rate: 400,  days: 3, count: 8, total: 9_600 }
	];

	// ── Multi-year scaling ────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		total: number;
		perEvent: number;
		multiplier: string | null;
		phase: string;
		drivers: string[];
	};

	const years: YearRow[] = [
		{
			year: 2027, total: 1_500_000, perEvent: 250_000, multiplier: null,   phase: 'Baseline',
			drivers: ['Concert-grade single stage', 'Broadcast-ready from day one', '2,750 attendees per event']
		},
		{
			year: 2028, total: 1_725_000, perEvent: 287_500, multiplier: '1.15×', phase: 'Enhanced',
			drivers: ['Larger audience sizes', 'Additional production layers', 'Higher-tier talent integration']
		},
		{
			year: 2029, total: 2_587_500, perEvent: 431_250, multiplier: '1.5×',  phase: 'Expansion',
			drivers: ['Multi-stage environments', 'Expanded broadcast infrastructure', 'National market growth']
		},
		{
			year: 2030, total: 5_175_000, perEvent: 862_500, multiplier: '2.0×',  phase: 'Global',
			drivers: ['International duplication', 'Multi-region operations', 'Festival-scale production']
		},
		{
			year: 2031, total: 7_762_500, perEvent: 1_293_750, multiplier: '1.5×', phase: 'Scale',
			drivers: ['Premium global positioning', 'Full broadcast integration', 'Multi-market simultaneous events']
		}
	];

	const phaseColors: Record<string, string> = {
		Baseline:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Enhanced:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Expansion: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Global:    'bg-violet-500/10 text-violet-400 border-violet-500/30',
		Scale:     'bg-rose-500/10 text-rose-400 border-rose-500/30'
	};

	const maxTotal    = Math.max(...years.map(y => y.total));
	const maxBreakdown = Math.max(...perEventBreakdown.map(b => b.amount));

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
	<title>Stage & Audio Production - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Stage &amp; Audio Production</h1>
		<p class="text-muted-foreground">
			Formula-based production budget · FY 2027–2031 · 6 events · COGS – Tournament Execution
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Mic2 class="size-3.5 shrink-0" />
					<span class="text-xs">2027 Baseline</span>
				</div>
				<p class="text-xl font-bold">$1.5M</p>
				<p class="text-xs text-muted-foreground">$250K per event</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-amber-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2029 Expansion</span>
				</div>
				<p class="text-xl font-bold text-amber-400">$2.59M</p>
				<p class="text-xs text-muted-foreground">1.5× from 2028</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-violet-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2030 Global</span>
				</div>
				<p class="text-xl font-bold text-violet-400">$5.18M</p>
				<p class="text-xs text-muted-foreground">2.0× from 2029</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-rose-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2031 Scale</span>
				</div>
				<p class="text-xl font-bold text-rose-400">$7.76M</p>
				<p class="text-xs text-muted-foreground">1.5× from 2030</p>
			</div>
		</div>
	</Card>

	<!-- Multi-year chart + detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Production Budget
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
								</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(row.total)}</span>
						</div>
						<div class="h-6 rounded-md overflow-hidden bg-muted {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div
								class="h-full rounded-md bg-gradient-to-r from-blue-600 via-violet-500 to-pink-500 transition-all duration-500"
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
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Season Events</span>
					<span class="font-semibold">6</span>
				</div>
				{#if selected.multiplier}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">YoY Scale</span>
						<span class="font-semibold text-violet-400">{selected.multiplier}</span>
					</div>
				{/if}
				{#if selected.year === 2027}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">Cost / Attendee</span>
						<span class="font-semibold">$90.91</span>
					</div>
				{/if}
			</div>
			<div class="rounded-lg bg-muted/40 p-3">
				<ul class="space-y-1">
					{#each selected.drivers as d}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full bg-violet-500 shrink-0"></span>{d}
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	</div>

	<!-- Per-event breakdown (2027) — expandable cards -->
	<div>
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
			2027 Per-Event Breakdown <span class="normal-case font-normal ml-1">($250,000 total)</span>
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each perEventBreakdown as item}
				{@const Icon = item.icon}
				{@const sharePct = Math.round((item.amount / 250_000) * 100)}
				{@const isExpanded = expandedCategory === item.label}
				<button
					class="text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors {isExpanded ? 'ring-2 ring-primary/40' : ''}"
					onclick={() => toggleCategory(item.label)}
				>
					<div class="flex items-center justify-between">
						<div class="flex size-8 items-center justify-center rounded-lg {item.color}/20">
							<Icon class="size-4 {item.textColor}" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">{sharePct}%</span>
					</div>
					<p class="text-xl font-bold">{fmt(item.amount)}</p>
					<p class="text-sm font-medium leading-tight">{item.label}</p>
					<!-- mini bar -->
					<div class="h-1 rounded-full bg-muted overflow-hidden">
						<div class="{item.color} h-full rounded-full" style="width: {pct(item.amount, maxBreakdown)}"></div>
					</div>
					{#if isExpanded}
						<div class="mt-1 pt-2 border-t border-border space-y-1">
							{#each item.components as c}
								<p class="text-xs text-muted-foreground flex items-start gap-1.5">
									<span class="mt-1 size-1 rounded-full {item.color} shrink-0"></span>{c}
								</p>
							{/each}
							<p class="text-xs text-muted-foreground/60 mt-1 italic">{item.formula}</p>
						</div>
					{:else}
						<p class="text-xs text-muted-foreground/50">Click for details</p>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Staffing detail -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<Users class="size-4 text-violet-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Core Staff</h2>
				<span class="ml-auto text-sm font-bold">$30,200</span>
			</div>
			<div class="space-y-1.5">
				{#each coreStaff as s}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{s.role}</span>
						<div class="flex items-center gap-3 text-xs text-muted-foreground">
							<span>{fmt(s.rate)}/day × {s.days}d</span>
							<span class="font-semibold text-foreground w-14 text-right">{fmt(s.total)}</span>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<Users class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Technical Crew</h2>
				<span class="ml-auto text-sm font-bold">$22,800</span>
			</div>
			<div class="space-y-1.5">
				{#each techCrew as s}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{s.role}</span>
						<div class="flex items-center gap-3 text-xs text-muted-foreground">
							<span>{fmt(s.rate)}/day × {s.days}d</span>
							<span class="font-semibold text-foreground w-14 text-right">{fmt(s.total)}</span>
						</div>
					</div>
				{/each}
				<div class="flex items-center justify-between text-sm pt-2 border-t border-border mt-2">
					<span class="text-muted-foreground">Labor Buffer (insurance, OT, payroll)</span>
					<span class="font-semibold text-foreground">$7,000</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Full season totals table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Season Totals (2027)</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Per Event</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">× Events</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Season Total</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Share</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each perEventBreakdown as item, i}
						{@const Icon = item.icon}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-5 py-3">
								<div class="flex items-center gap-2">
									<Icon class="size-3.5 {item.textColor} shrink-0" />
									<span>{item.label}</span>
								</div>
							</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{fmt(item.amount)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">6</td>
							<td class="px-5 py-3 text-right font-bold">{fmt(item.amount * 6)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{Math.round((item.amount / 250_000) * 100)}%</td>
						</tr>
					{/each}
					<tr class="bg-slate-800/60 font-bold border-t-2 border-slate-600">
						<td class="px-5 py-3">Total</td>
						<td class="px-5 py-3 text-right">$250,000</td>
						<td class="px-5 py-3 text-right text-muted-foreground">6</td>
						<td class="px-5 py-3 text-right text-lg">$1,500,000</td>
						<td class="px-5 py-3 text-right text-muted-foreground">100%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Multi-year table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Multi-Year Scaling</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total Budget</th>
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
							<td class="px-5 py-3 text-right font-bold">{fmt(row.total)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{fmt(row.perEvent)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{row.multiplier ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Revenue alignment -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<DollarSign class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue Alignment</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					{ label: 'Ticket Pricing', desc: 'Premium experience justifies higher GA and VIP rates' },
					{ label: 'VIP / Rooftop Packages', desc: 'Production quality enables premium tier pricing' },
					{ label: 'Sponsorship Activation', desc: 'Branded stage integrations and premium moments' },
					{ label: 'Broadcast Rights', desc: 'Broadcast-ready infrastructure increases media valuation' }
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
						<div>
							<span class="font-medium text-foreground">{item.label}</span>
							<span class="text-muted-foreground"> — {item.desc}</span>
						</div>
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<Tv class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Strategic Value</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Transforms events into entertainment destinations',
					'Broadcast-ready infrastructure from day one',
					'Supports global expansion without rebuild',
					'Aligns with concert-level audience expectations',
					'Scalable production model across all markets'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>
						{item}
					</li>
				{/each}
			</ul>
			<div class="mt-3 pt-3 border-t border-border rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				2027 cost per attendee: <span class="font-semibold text-foreground">$90.91</span>
				<span class="ml-1">(16,500 annual attendees across 6 events)</span>
			</div>
		</Card>
	</div>

</div>
