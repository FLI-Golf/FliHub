<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Hammer,
		Wrench,
		Shield,
		DollarSign,
		TrendingDown,
		Info,
		ChevronRight,
		Layers,
		Zap,
		Package,
		HardHat,
		Settings
	} from 'lucide-svelte';

	// ── Top-level budget ──────────────────────────────────────────────────────

	const totalBudget = 330_000;
	const materialsTotal = 250_000;
	const toolsTotal = 50_000;
	const expansionReserve = 30_000;

	// ── Materials breakdown ───────────────────────────────────────────────────

	const materials = [
		{
			label: 'Structural Lumber & Framing',
			amount: 90_000,
			icon: Layers,
			color: 'bg-blue-500',
			textColor: 'text-blue-400',
			perObstacle: 6_000,
			notes: ['~130 boards per obstacle (2×4 & 2×6 mix)', '$6,000 per obstacle allocation', 'Includes bracing, base frames, delivery & waste']
		},
		{
			label: 'Plywood & Surface Paneling',
			amount: 45_000,
			icon: Layers,
			color: 'bg-emerald-500',
			textColor: 'text-emerald-400',
			perObstacle: 3_000,
			notes: ['~177 sheets (4×8) after 25% waste factor', '$3,000 per obstacle', 'Camera-ready surfaces, branding-swap ready']
		},
		{
			label: 'Artificial Turf (Tee Boxes)',
			amount: 35_000,
			icon: Package,
			color: 'bg-lime-500',
			textColor: 'text-lime-400',
			perObstacle: null,
			notes: ['18 tee boxes × 72 sq ft = 1,296 sq ft', 'Sports-grade turf + shock pad + adhesive', 'Includes spares & warmup pads']
		},
		{
			label: 'Reinforcement & Anchoring',
			amount: 30_000,
			icon: Shield,
			color: 'bg-amber-500',
			textColor: 'text-amber-400',
			perObstacle: 2_000,
			notes: ['$2,000 per obstacle', 'Steel brackets, base anchoring, safety bracing', 'Padding in impact zones']
		},
		{
			label: 'Hardware & Fasteners',
			amount: 20_000,
			icon: Settings,
			color: 'bg-orange-500',
			textColor: 'text-orange-400',
			perObstacle: 1_333,
			notes: ['~1,000 fastener units per obstacle', '$1,333 per obstacle', 'Screws, lag bolts, brackets, adhesives, anchors']
		},
		{
			label: 'Materials Contingency',
			amount: 30_000,
			icon: Shield,
			color: 'bg-rose-500',
			textColor: 'text-rose-400',
			perObstacle: null,
			notes: ['12% of materials total', 'Covers waste, cut loss, price fluctuation', 'Prevents emergency mid-build funding']
		}
	];

	// ── Tools breakdown ───────────────────────────────────────────────────────

	const tools = [
		{
			label: 'Major Power Tools & Cutting',
			amount: 15_000,
			icon: Zap,
			color: 'bg-violet-500',
			textColor: 'text-violet-400',
			items: ['2× Table saws ($1,800)', '2× Miter saws ($1,000)', '4× Circular saws ($1,000)', '6× Drill/driver kits ($2,100)', '2× Generators ($4,000)', 'Air compressor ($1,700)', 'Buffer: $1,400']
		},
		{
			label: 'Framing & Fastening Equipment',
			amount: 8_000,
			icon: Hammer,
			color: 'bg-blue-500',
			textColor: 'text-blue-400',
			items: ['3× Framing nailers ($1,200)', '2× Finish nailers ($500)', 'Specialty fastener systems ($1,500)', 'Extra batteries + chargers ($2,000)', 'Extension cords + power ($2,500)']
		},
		{
			label: 'Turf Installation Equipment',
			amount: 5_000,
			icon: Package,
			color: 'bg-lime-500',
			textColor: 'text-lime-400',
			items: ['Seaming/cutter tools ($1,500)', 'Carpet stretcher ($1,000)', 'Adhesive rollers ($500)', 'Trimming tools ($500)', 'Plate compactor ($1,500)']
		},
		{
			label: 'Material Handling & Setup',
			amount: 10_000,
			icon: Wrench,
			color: 'bg-amber-500',
			textColor: 'text-amber-400',
			items: ['Modular scaffolding ($4,000)', '2× Extension ladders ($800)', '2× A-frame ladders ($700)', '2× Hydraulic lift carts ($2,500)', 'Pallet jacks / hand trucks ($1,500)', 'Work benches ($500)']
		},
		{
			label: 'Safety Equipment',
			amount: 4_000,
			icon: HardHat,
			color: 'bg-red-500',
			textColor: 'text-red-400',
			items: ['Harnesses + safety lines ($1,200)', 'PPE inventory ($1,000)', 'Eye/ear protection ($500)', 'Safety signage ($500)', 'First aid kits ($800)']
		},
		{
			label: 'Maintenance & Replacement Reserve',
			amount: 8_000,
			icon: Settings,
			color: 'bg-slate-500',
			textColor: 'text-slate-400',
			items: ['Saw blades, drill bits, worn batteries', 'Tool repairs and replacements', 'Heavy-use consumables', '16% of tools budget']
		}
	];

	// ── Reuse / amortization ──────────────────────────────────────────────────

	const reuseYears = [
		{ years: 3, annual: Math.round(totalBudget / 3) },
		{ years: 4, annual: Math.round(totalBudget / 4) },
		{ years: 5, annual: Math.round(totalBudget / 5) }
	];

	function fmt(n: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}

	function pct(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let expandedMaterial = $state<string | null>(null);
	let expandedTool = $state<string | null>(null);

	function toggleMaterial(label: string) {
		expandedMaterial = expandedMaterial === label ? null : label;
	}
	function toggleTool(label: string) {
		expandedTool = expandedTool === label ? null : label;
	}
</script>

<svelte:head>
	<title>Stadium Course #1 - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Stadium Course #1 Buildout</h1>
		<p class="text-muted-foreground">
			Combined budget with expansion reserve · FY 2026 · 15 obstacles · 9 holes
		</p>
	</div>

	<!-- Top-level budget split -->
	<Card class="p-5">
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Total Investment: {fmt(totalBudget)}</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
			{#each [
				{ label: 'Materials', sublabel: 'Installed infrastructure', amount: materialsTotal, share: 75.76, color: 'bg-blue-500', textColor: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
				{ label: 'Tools & Equipment', sublabel: 'Reusable assets', amount: toolsTotal, share: 15.15, color: 'bg-violet-500', textColor: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
				{ label: 'Expansion Reserve', sublabel: '1–3 additional obstacles', amount: expansionReserve, share: 9.09, color: 'bg-amber-500', textColor: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' }
			] as bucket}
				<div class="rounded-xl border {bucket.border} {bucket.bg} p-4 flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<p class="text-sm font-semibold">{bucket.label}</p>
						<span class="text-xs font-bold {bucket.textColor}">{bucket.share}%</span>
					</div>
					<p class="text-2xl font-bold {bucket.textColor}">{fmt(bucket.amount)}</p>
					<p class="text-xs text-muted-foreground">{bucket.sublabel}</p>
					<div class="h-1.5 rounded-full bg-muted overflow-hidden">
						<div class="{bucket.color} h-full rounded-full" style="width: {pct(bucket.amount, totalBudget)}"></div>
					</div>
				</div>
			{/each}
		</div>
		<!-- Combined bar -->
		<div class="flex h-5 rounded-lg overflow-hidden gap-px">
			<div class="bg-blue-500 flex items-center justify-center" style="width: 75.76%">
				<span class="text-[10px] font-bold text-white">Materials 75.8%</span>
			</div>
			<div class="bg-violet-500 flex items-center justify-center" style="width: 15.15%">
				<span class="text-[10px] font-bold text-white">Tools</span>
			</div>
			<div class="bg-amber-500 flex items-center justify-center" style="width: 9.09%">
				<span class="text-[10px] font-bold text-white">Res.</span>
			</div>
		</div>
	</Card>

	<!-- Course scope -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		{#each [
			{ label: 'Obstacles', value: '15', note: 'Base build' },
			{ label: 'Avg Height', value: '15 ft', note: 'Per obstacle' },
			{ label: 'Avg Width', value: '10 ft', note: 'Per obstacle' },
			{ label: 'Total Surface Area', value: '4,500 sq ft', note: '2 faces × 15 obstacles' }
		] as stat}
			<Card class="p-4 flex flex-col gap-1">
				<p class="text-2xl font-bold">{stat.value}</p>
				<p class="text-sm font-medium">{stat.label}</p>
				<p class="text-xs text-muted-foreground">{stat.note}</p>
			</Card>
		{/each}
	</div>

	<!-- Materials breakdown -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
				Materials Budget <span class="normal-case font-normal ml-1">({fmt(materialsTotal)} installed)</span>
			</h2>
			<span class="text-xs text-muted-foreground">Click a card for formula details</span>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each materials as item}
				{@const Icon = item.icon}
				{@const share = Math.round((item.amount / materialsTotal) * 100)}
				{@const isExpanded = expandedMaterial === item.label}
				<button
					class="text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors {isExpanded ? 'ring-2 ring-primary/40' : ''}"
					onclick={() => toggleMaterial(item.label)}
				>
					<div class="flex items-center justify-between">
						<div class="flex size-8 items-center justify-center rounded-lg {item.color}/20">
							<Icon class="size-4 {item.textColor}" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">{share}%</span>
					</div>
					<p class="text-xl font-bold">{fmt(item.amount)}</p>
					<p class="text-sm font-medium leading-tight">{item.label}</p>
					{#if item.perObstacle}
						<p class="text-xs text-muted-foreground">{fmt(item.perObstacle)} / obstacle</p>
					{/if}
					<div class="h-1 rounded-full bg-muted overflow-hidden">
						<div class="{item.color} h-full rounded-full" style="width: {pct(item.amount, materialsTotal)}"></div>
					</div>
					{#if isExpanded}
						<ul class="mt-1 pt-2 border-t border-border space-y-1">
							{#each item.notes as note}
								<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
									<span class="mt-1 size-1 rounded-full {item.color} shrink-0"></span>{note}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-xs text-muted-foreground/50">Click for details</p>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Tools breakdown -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
				Tools &amp; Equipment <span class="normal-case font-normal ml-1">({fmt(toolsTotal)} reusable)</span>
			</h2>
			<span class="text-xs text-muted-foreground">Click a card for itemized list</span>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each tools as item}
				{@const Icon = item.icon}
				{@const share = Math.round((item.amount / toolsTotal) * 100)}
				{@const isExpanded = expandedTool === item.label}
				<button
					class="text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors {isExpanded ? 'ring-2 ring-primary/40' : ''}"
					onclick={() => toggleTool(item.label)}
				>
					<div class="flex items-center justify-between">
						<div class="flex size-8 items-center justify-center rounded-lg {item.color}/20">
							<Icon class="size-4 {item.textColor}" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">{share}%</span>
					</div>
					<p class="text-xl font-bold">{fmt(item.amount)}</p>
					<p class="text-sm font-medium leading-tight">{item.label}</p>
					<div class="h-1 rounded-full bg-muted overflow-hidden">
						<div class="{item.color} h-full rounded-full" style="width: {pct(item.amount, toolsTotal)}"></div>
					</div>
					{#if isExpanded}
						<ul class="mt-1 pt-2 border-t border-border space-y-1">
							{#each item.items as line}
								<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
									<span class="mt-1 size-1 rounded-full {item.color} shrink-0"></span>{line}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-xs text-muted-foreground/50">Click for itemized list</p>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- Expansion reserve + amortization -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<ChevronRight class="size-4 text-amber-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Expansion Reserve — {fmt(expansionReserve)}</h2>
			</div>
			<div class="space-y-3 text-sm">
				<div class="flex justify-between py-2 border-b border-border">
					<span class="text-muted-foreground">% of materials</span>
					<span class="font-semibold">12%</span>
				</div>
				<div class="flex justify-between py-2 border-b border-border">
					<span class="text-muted-foreground">% of total build</span>
					<span class="font-semibold">9.09%</span>
				</div>
				<div class="flex justify-between py-2 border-b border-border">
					<span class="text-muted-foreground">Incremental obstacle cost</span>
					<span class="font-semibold">$10K–$20K each</span>
				</div>
				<div class="flex justify-between py-2 border-b border-border">
					<span class="text-muted-foreground">Capacity</span>
					<span class="font-semibold text-amber-400">1–3 additional obstacles</span>
				</div>
			</div>
			<div class="mt-3 rounded-lg bg-amber-500/5 border border-amber-500/30 p-3 text-xs text-amber-300">
				<Info class="size-3.5 inline mr-1" />
				Also supports themed features, sponsor builds, or a signature finish-hole structure
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-4">
				<TrendingDown class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Effective Annual Cost (Reuse Model)</h2>
			</div>
			<div class="space-y-3">
				{#each reuseYears as row}
					<div class="flex items-center gap-3">
						<span class="text-sm text-muted-foreground w-16 shrink-0">{row.years}-year</span>
						<div class="flex-1 h-6 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-end pr-2 transition-all"
								style="width: {pct(row.annual, Math.round(totalBudget / 3))}"
							>
								<span class="text-xs font-bold text-white">{fmt(row.annual)}/yr</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
				<Info class="size-3.5 inline mr-1" />
				Tools, obstacles, and panels are modular and reusable — per-year cost drops significantly with each additional season
			</div>
		</Card>
	</div>

	<!-- Full summary table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Budget Summary</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
						<th class="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Bucket</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-200 uppercase tracking-wider">Amount</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Per Obstacle</th>
						<th class="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Share</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each materials as item, i}
						{@const Icon = item.icon}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-5 py-3">
								<div class="flex items-center gap-2">
									<Icon class="size-3.5 {item.textColor} shrink-0" />
									{item.label}
								</div>
							</td>
							<td class="px-5 py-3"><span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">Materials</span></td>
							<td class="px-5 py-3 text-right font-semibold">{fmt(item.amount)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{item.perObstacle ? fmt(item.perObstacle) : '—'}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{Math.round((item.amount / totalBudget) * 100)}%</td>
						</tr>
					{/each}
					{#each tools as item, i}
						{@const Icon = item.icon}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/40' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-5 py-3">
								<div class="flex items-center gap-2">
									<Icon class="size-3.5 {item.textColor} shrink-0" />
									{item.label}
								</div>
							</td>
							<td class="px-5 py-3"><span class="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">Tools</span></td>
							<td class="px-5 py-3 text-right font-semibold">{fmt(item.amount)}</td>
							<td class="px-5 py-3 text-right text-muted-foreground">—</td>
							<td class="px-5 py-3 text-right text-muted-foreground">{Math.round((item.amount / totalBudget) * 100)}%</td>
						</tr>
					{/each}
					<tr class="hover:bg-slate-800/50 transition-colors">
						<td class="px-5 py-3">
							<div class="flex items-center gap-2">
								<ChevronRight class="size-3.5 text-amber-400 shrink-0" />
								Expansion Reserve
							</div>
						</td>
						<td class="px-5 py-3"><span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">Reserve</span></td>
						<td class="px-5 py-3 text-right font-semibold">{fmt(expansionReserve)}</td>
						<td class="px-5 py-3 text-right text-muted-foreground">—</td>
						<td class="px-5 py-3 text-right text-muted-foreground">9%</td>
					</tr>
					<tr class="bg-slate-800/60 font-bold border-t-2 border-slate-600">
						<td class="px-5 py-3" colspan="2">Total Investment</td>
						<td class="px-5 py-3 text-right text-lg">{fmt(totalBudget)}</td>
						<td class="px-5 py-3 text-right text-muted-foreground">{fmt(Math.round(totalBudget / 15))}</td>
						<td class="px-5 py-3 text-right text-muted-foreground">100%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</Card>

</div>
