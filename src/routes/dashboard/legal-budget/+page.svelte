<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Scale,
		Globe,
		TrendingUp,
		ChevronRight,
		Info,
		ShieldCheck,
		Landmark,
		FileText,
		Gavel,
		DollarSign
	} from 'lucide-svelte';

	// ── Budget data ───────────────────────────────────────────────────────────

	type YearRow = {
		year: number;
		domestic: number;
		international: number;
		total: number;
		phase: string;
		focus: string;
		domesticNotes: string[];
		intlNotes: string[];
	};

	const years: YearRow[] = [
		{
			year: 2026,
			domestic: 75_000, international: 0, total: 75_000,
			phase: 'Launch', focus: 'Foundation',
			domesticNotes: ['Corporate structuring', 'Initial contracts', 'IP filings', 'Investor documentation'],
			intlNotes: []
		},
		{
			year: 2027,
			domestic: 25_000, international: 0, total: 25_000,
			phase: 'Stabilization', focus: 'Efficiency',
			domesticNotes: ['Contract maintenance & updates', 'Ongoing compliance'],
			intlNotes: []
		},
		{
			year: 2028,
			domestic: 100_000, international: 0, total: 100_000,
			phase: 'Growth', focus: 'Expansion Readiness',
			domesticNotes: ['Increased deal volume', 'Licensing agreements', 'Early gaming discussions'],
			intlNotes: []
		},
		{
			year: 2029,
			domestic: 200_000, international: 200_000, total: 400_000,
			phase: 'Dual-Market', focus: 'National + International Entry',
			domesticNotes: ['Media rights expansion', 'Sponsorship scaling', 'IP enforcement'],
			intlNotes: ['First cross-border agreements', 'Market entry legal structuring', 'Gaming & compliance analysis']
		},
		{
			year: 2030,
			domestic: 300_000, international: 300_000, total: 600_000,
			phase: 'Multi-Market', focus: 'Active Global Execution',
			domesticNotes: ['Larger deal sizes', 'Higher contract complexity'],
			intlNotes: ['Multiple country operations', 'Media rights segmentation', 'Sportsbook partnerships']
		},
		{
			year: 2031,
			domestic: 400_000, international: 400_000, total: 800_000,
			phase: 'Global Scale', focus: 'Institutional Global Operation',
			domesticNotes: ['Enterprise-level contracts', 'National sponsorship scale'],
			intlNotes: ['Global licensing', 'Multi-region media deals', 'IP enforcement worldwide']
		}
	];

	const phaseColors: Record<string, string> = {
		'Launch':       'bg-blue-500/10 text-blue-400 border-blue-500/30',
		'Stabilization':'bg-slate-500/10 text-slate-400 border-slate-500/30',
		'Growth':       'bg-amber-500/10 text-amber-400 border-amber-500/30',
		'Dual-Market':  'bg-orange-500/10 text-orange-400 border-orange-500/30',
		'Multi-Market': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
		'Global Scale': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
	};

	const expertiseAreas = [
		{ label: 'Sports Law',        icon: Gavel,     desc: 'League structure, player agreements, competition rules' },
		{ label: 'Gaming Law',        icon: DollarSign, desc: 'Sportsbook integration, betting compliance, licensing' },
		{ label: 'Tribal Law',        icon: Landmark,  desc: 'Tribal gaming partnerships, sovereign nation agreements' },
		{ label: 'Securities Law',    icon: FileText,  desc: 'Investor documentation, capital raise compliance' },
		{ label: 'IP Law',            icon: ShieldCheck,desc: 'Trademark filings, brand enforcement, licensing' },
		{ label: 'International Law', icon: Globe,     desc: 'Cross-border contracts, multi-jurisdiction compliance' }
	];

	const costControls = [
		'Retainer structures for predictable spend',
		'Standardized contract templates',
		'Hybrid internal/external counsel model',
		'Proactive legal planning to reduce reactive costs'
	];

	const maxTotal = Math.max(...years.map(y => y.total));
	const maxDomestic = Math.max(...years.map(y => y.domestic));

	function fmt(n: number): string {
		if (n === 0) return '—';
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}

	function pct(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let selectedYear = $state(2029);
	const selected = $derived(years.find(y => y.year === selectedYear)!);
</script>

<svelte:head>
	<title>Legal Budget - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Legal Budget</h1>
		<p class="text-muted-foreground">
			Outside counsel structure · Domestic &amp; International · FY 2026–2031
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each years as row}
				{@const colorMap: Record<string,string> = {
					'Launch': 'text-blue-400', 'Stabilization': 'text-slate-400',
					'Growth': 'text-amber-400', 'Dual-Market': 'text-orange-400',
					'Multi-Market': 'text-violet-400', 'Global Scale': 'text-emerald-400'
				}}
				<button
					class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors rounded {selectedYear === row.year ? 'bg-muted/40' : ''}"
					onclick={() => selectedYear = row.year}
				>
					<span class="text-xs text-muted-foreground">{row.year}</span>
					<p class="text-lg font-bold {colorMap[row.phase]}">{fmt(row.total)}</p>
					<p class="text-xs text-muted-foreground">{row.phase}</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Stacked bar chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Legal Spend — Domestic vs International
			</h2>
			<div class="space-y-3">
				{#each years as row}
					{@const isSelected = row.year === selectedYear}
					{@const hasIntl = row.international > 0}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(row.total)}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<!-- Domestic -->
							<div
								class="bg-blue-500 flex items-center justify-center transition-all"
								style="width: {pct(row.domestic, maxTotal)}"
							>
								{#if row.domestic / row.total > 0.2}
									<span class="text-[10px] font-bold text-white">DOM</span>
								{/if}
							</div>
							<!-- International -->
							{#if hasIntl}
								<div
									class="bg-violet-500 flex items-center justify-center transition-all"
									style="width: {pct(row.international, maxTotal)}"
								>
									{#if row.international / row.total > 0.2}
										<span class="text-[10px] font-bold text-white">INTL</span>
									{/if}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			<!-- Legend -->
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-blue-500"></div>Domestic Counsel
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-violet-500"></div>International Counsel
				</div>
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
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Scale class="size-3.5 text-blue-400" />Domestic
					</div>
					<span class="font-semibold">{fmt(selected.domestic)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Globe class="size-3.5 text-violet-400" />International
					</div>
					<span class="font-semibold {selected.international === 0 ? 'text-muted-foreground' : ''}">{fmt(selected.international)}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm font-semibold">Total</span>
					<span class="text-lg font-bold">{fmt(selected.total)}</span>
				</div>
			</div>

			<div class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Focus: {selected.focus}</div>

			{#if selected.domesticNotes.length > 0}
				<div>
					<p class="text-xs font-semibold text-blue-400 mb-1">Domestic</p>
					<ul class="space-y-1">
						{#each selected.domesticNotes as note}
							<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
								<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{note}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if selected.intlNotes.length > 0}
				<div>
					<p class="text-xs font-semibold text-violet-400 mb-1">International</p>
					<ul class="space-y-1">
						{#each selected.intlNotes as note}
							<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
								<span class="mt-1 size-1.5 rounded-full bg-violet-500 shrink-0"></span>{note}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if selected.international === 0}
				<div class="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
					<Info class="size-3.5 inline mr-1" />
					International counsel activates in 2029 at first global expansion
				</div>
			{/if}
		</Card>
	</div>

	<!-- Full breakdown table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Budget Breakdown</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Year</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phase</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Domestic</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-violet-400 uppercase tracking-wider">International</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Total</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each years as row, i}
						<tr
							class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors cursor-pointer {selectedYear === row.year ? 'ring-1 ring-inset ring-primary/30' : ''}"
							onclick={() => selectedYear = row.year}
						>
							<td class="px-5 py-3 font-semibold">{row.year}</td>
							<td class="px-5 py-3">
								<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							</td>
							<td class="px-5 py-3 text-muted-foreground text-xs">{row.focus}</td>
							<td class="px-5 py-3 text-right text-blue-300">{fmt(row.domestic)}</td>
							<td class="px-5 py-3 text-right {row.international === 0 ? 'text-muted-foreground/40' : 'text-violet-300'}">{fmt(row.international)}</td>
							<td class="px-5 py-3 text-right font-bold">{fmt(row.total)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Expertise areas -->
	<div>
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Required Counsel Expertise</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each expertiseAreas as area}
				{@const Icon = area.icon}
				<Card class="p-4 flex flex-col gap-2">
					<Icon class="size-5 text-muted-foreground" />
					<p class="text-sm font-semibold">{area.label}</p>
					<p class="text-xs text-muted-foreground leading-relaxed">{area.desc}</p>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Strategic justification + cost controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<TrendingUp class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Legal as Revenue Enablement</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					{ point: 'Sponsorship deals cannot close without contracts' },
					{ point: 'Media rights cannot exist without legal structure' },
					{ point: 'Gaming cannot operate without compliance' },
					{ point: 'Legal spend scales directly with enterprise value' },
					{ point: 'External counsel required for investor credibility' }
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
						{item.point}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-xs text-orange-300">
				<Info class="size-3.5 inline mr-1" />
				FGL uniquely combines tribal gaming + sportsbook integration + international markets — one of the most legally complex structures in sports
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<ShieldCheck class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Governance &amp; Cost Controls</h2>
			</div>
			<p class="text-xs text-muted-foreground mb-3 font-medium">Cost efficiency strategy</p>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each costControls as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<p class="text-xs text-muted-foreground mb-2 font-medium">Protects against</p>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each ['Litigation exposure', 'Regulatory penalties', 'Contract disputes', 'Investor risk'] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-rose-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
		</Card>
	</div>

</div>
