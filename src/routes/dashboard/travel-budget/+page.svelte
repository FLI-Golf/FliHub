<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Plane,
		Hotel,
		Car,
		Utensils,
		TrendingUp,
		DollarSign,
		Info,
		ChevronRight
	} from 'lucide-svelte';

	// ── Budget data from the strategic travel document ──────────────────────────

	type YearBudget = {
		year: number;
		airfare: number;
		lodging: number;
		autoRental: number;
		perDiem: number;
		total: number;
		phase: string;
		multiplier: string | null;
	};

	const budgetData: YearBudget[] = [
		{ year: 2026, airfare: 25000, lodging: 15000, autoRental: 10000, perDiem: 10000, total: 60000,  phase: 'Foundation',   multiplier: null },
		{ year: 2027, airfare: 25000, lodging: 15000, autoRental: 10000, perDiem: 10000, total: 60000,  phase: 'Foundation',   multiplier: null },
		{ year: 2028, airfare: 25000, lodging: 15000, autoRental: 10000, perDiem: 10000, total: 60000,  phase: 'Foundation',   multiplier: null },
		{ year: 2029, airfare: 37500, lodging: 22500, autoRental: 15000, perDiem: 15000, total: 90000,  phase: 'Expansion',    multiplier: '1.5×' },
		{ year: 2030, airfare: 75000, lodging: 45000, autoRental: 30000, perDiem: 30000, total: 180000, phase: 'Acceleration', multiplier: '2.0×' },
		{ year: 2031, airfare: 150000, lodging: 90000, autoRental: 60000, perDiem: 60000, total: 360000, phase: 'Scale',       multiplier: '2.0×' }
	];

	const baselineCapacity = [
		{ icon: Plane,    label: 'Round Trips',  value: '~64',  detail: '$25,000 ÷ $390 avg fare' },
		{ icon: Hotel,    label: 'Hotel Nights', value: '~86',  detail: '$15,000 ÷ $174 avg rate' },
		{ icon: Car,      label: 'Rental Days',  value: '~100', detail: '$10,000 ÷ $100 avg rate' },
		{ icon: Utensils, label: 'Per Diem',     value: '$10K', detail: 'Annual allocation' }
	];

	const phaseColors: Record<string, string> = {
		Foundation:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Expansion:    'bg-amber-500/10 text-amber-400 border-amber-500/30',
		Acceleration: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Scale:        'bg-violet-500/10 text-violet-400 border-violet-500/30'
	};

	const phaseDescriptions: Record<string, string> = {
		Foundation:   'Targeted deal-making, efficient travel usage, early-stage growth',
		Expansion:    'Increased partnership volume, more frequent travel, expanded geographic reach',
		Acceleration: 'National expansion, higher deal flow, more simultaneous negotiations',
		Scale:        'International travel, global partnerships, multi-market presence'
	};

	const maxTotal = Math.max(...budgetData.map((d) => d.total));

	function fmt(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(n);
	}

	function barWidth(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	const categoryColors = {
		airfare:    { bar: 'bg-blue-500',   dot: 'bg-blue-500' },
		lodging:    { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
		autoRental: { bar: 'bg-amber-500',  dot: 'bg-amber-500' },
		perDiem:    { bar: 'bg-violet-500', dot: 'bg-violet-500' }
	};

	let selectedYear = $state<number>(2026);
	const selectedRow = $derived(budgetData.find((d) => d.year === selectedYear)!);
</script>

<svelte:head>
	<title>Executive Travel Budget - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Executive Travel Budget</h1>
		<p class="text-muted-foreground">
			Multi-year strategic mobility model · FY 2026–2031 · President, CEO &amp; Key Staff
		</p>
	</div>

	<!-- Summary KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<DollarSign class="size-3.5 shrink-0" />
					<span class="text-xs">2026–2028 Annual</span>
				</div>
				<p class="text-xl font-bold">$60,000</p>
				<p class="text-xs text-muted-foreground">Foundation phase baseline</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-amber-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2029 Expansion</span>
				</div>
				<p class="text-xl font-bold text-amber-400">$90,000</p>
				<p class="text-xs text-muted-foreground">1.5× from baseline</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-orange-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2030 Acceleration</span>
				</div>
				<p class="text-xl font-bold text-orange-400">$180,000</p>
				<p class="text-xs text-muted-foreground">2.0× from 2029</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-violet-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2031 Scale</span>
				</div>
				<p class="text-xl font-bold text-violet-400">$360,000</p>
				<p class="text-xs text-muted-foreground">2.0× from 2030</p>
			</div>
		</div>
	</Card>

	<!-- Main content: chart + detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Multi-year bar chart -->
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Budget by Category
			</h2>
			<div class="space-y-3">
				{#each budgetData as row}
					{@const isSelected = row.year === selectedYear}
					<button
						class="w-full text-left group"
						onclick={() => selectedYear = row.year}
					>
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
						<!-- Stacked bar -->
						<div class="flex h-5 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-blue-500 transition-all" style="width: {barWidth(row.airfare, row.total)}"></div>
							<div class="bg-emerald-500 transition-all" style="width: {barWidth(row.lodging, row.total)}"></div>
							<div class="bg-amber-500 transition-all" style="width: {barWidth(row.autoRental, row.total)}"></div>
							<div class="bg-violet-500 transition-all" style="width: {barWidth(row.perDiem, row.total)}"></div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Legend -->
			<div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
				{#each [['Airfare', 'bg-blue-500'], ['Lodging', 'bg-emerald-500'], ['Auto Rental', 'bg-amber-500'], ['Per Diem', 'bg-violet-500']] as [label, cls]}
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<div class="size-2.5 rounded-sm {cls}"></div>
						{label}
					</div>
				{/each}
			</div>
		</Card>

		<!-- Year detail panel -->
		<Card class="p-5 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					{selectedRow.year} Detail
				</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[selectedRow.phase]}">{selectedRow.phase}</span>
			</div>

			<div class="space-y-3">
				{#each [
					{ label: 'Airfare',     value: selectedRow.airfare,    key: 'airfare' },
					{ label: 'Lodging',     value: selectedRow.lodging,    key: 'lodging' },
					{ label: 'Auto Rental', value: selectedRow.autoRental, key: 'autoRental' },
					{ label: 'Per Diem',    value: selectedRow.perDiem,    key: 'perDiem' }
				] as cat}
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-muted-foreground">{cat.label}</span>
							<span class="font-semibold">{fmt(cat.value)}</span>
						</div>
						<div class="h-1.5 rounded-full bg-muted overflow-hidden">
							<div
								class="{categoryColors[cat.key as keyof typeof categoryColors].bar} h-full rounded-full transition-all duration-500"
								style="width: {barWidth(cat.value, selectedRow.total)}"
							></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="border-t border-border pt-3 flex justify-between items-center">
				<span class="text-sm font-semibold">Total</span>
				<span class="text-lg font-bold">{fmt(selectedRow.total)}</span>
			</div>

			<div class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
				<Info class="size-3.5 inline mr-1 shrink-0" />
				{phaseDescriptions[selectedRow.phase]}
			</div>
		</Card>
	</div>

	<!-- 2026–2028 Baseline Capacity -->
	<div>
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
			2026–2028 Baseline Capacity
		</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			{#each baselineCapacity as item}
				{@const Icon = item.icon}
				<Card class="p-4 flex flex-col gap-2">
					<div class="flex size-9 items-center justify-center rounded-lg bg-slate-800">
						<Icon class="size-4 text-slate-300" />
					</div>
					<p class="text-2xl font-bold">{item.value}</p>
					<p class="text-sm font-medium">{item.label}</p>
					<p class="text-xs text-muted-foreground">{item.detail}</p>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Full multi-year breakdown table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
				Full Budget Breakdown
			</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Airfare</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">Lodging</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-amber-400 uppercase tracking-wider">Auto Rental</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-violet-400 uppercase tracking-wider">Per Diem</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Scale</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each budgetData as row, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-5 py-3 font-semibold">{row.year}</td>
							<td class="px-5 py-3">
								<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							</td>
							<td class="px-5 py-3 text-right text-blue-300">{fmt(row.airfare)}</td>
							<td class="px-5 py-3 text-right text-emerald-300">{fmt(row.lodging)}</td>
							<td class="px-5 py-3 text-right text-amber-300">{fmt(row.autoRental)}</td>
							<td class="px-5 py-3 text-right text-violet-300">{fmt(row.perDiem)}</td>
							<td class="px-5 py-3 text-right font-bold">{fmt(row.total)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">
								{row.multiplier ?? '—'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Policy & Controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Expense Control Policy</h2>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'All travel must be pre-approved',
					'Lowest reasonable airfare selected',
					'Hotels aligned with benchmark rates',
					'Rental vehicles kept to business class standards',
					'Itemized receipts required for all expenses',
					'Each trip must have defined business objectives'
				] as rule}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0"></span>
						{rule}
					</li>
				{/each}
			</ul>
		</Card>

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Authorized Travel Purposes</h2>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Sponsorship and partnership acquisition',
					'Investor and capital meetings',
					'Venue negotiations',
					'Tribal and gaming partnership development',
					'Broadcast and media relationships',
					'League expansion initiatives'
				] as purpose}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>
						{purpose}
					</li>
				{/each}
			</ul>
		</Card>
	</div>

</div>
