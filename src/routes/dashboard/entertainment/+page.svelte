<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Music,
		Star,
		TrendingUp,
		Users,
		DollarSign,
		Mic2,
		Plane,
		UtensilsCrossed,
		Briefcase,
		Info,
		ChevronRight,
		Tv,
		Zap
	} from 'lucide-svelte';

	// ── Data ────────────────────────────────────────────────────────────────────

	type YearBudget = {
		year: number;
		total: number;
		perEvent: number;
		multiplier: string | null;
		phase: string;
		phaseLabel: string;
		attendees: number;
	};

	const yearlyBudget: YearBudget[] = [
		{ year: 2027, total: 600_000,   perEvent: 100_000, multiplier: null,   phase: 'Baseline',  phaseLabel: 'Phase 1 – Baseline Entertainment',    attendees: 2_750 },
		{ year: 2028, total: 1_200_000, perEvent: 200_000, multiplier: '2.0×', phase: 'Enhanced',  phaseLabel: 'Phase 2 – Enhanced Programming',       attendees: 5_000 },
		{ year: 2029, total: 2_400_000, perEvent: 400_000, multiplier: '2.0×', phase: 'Multi-Act', phaseLabel: 'Phase 3 – Multi-Act Experience',        attendees: 7_500 },
		{ year: 2030, total: 4_800_000, perEvent: 800_000, multiplier: '2.0×', phase: 'Headline',  phaseLabel: 'Phase 4 – Headline Entertainment Model', attendees: 10_000 },
		{ year: 2031, total: 4_800_000, perEvent: 800_000, multiplier: 'Flat', phase: 'Headline',  phaseLabel: 'Phase 4 – Headline Entertainment Model', attendees: 10_000 }
	];

	// 2027 per-event cost breakdown
	const breakdown2027 = [
		{ label: 'Celebrity Appearance', amount: 30_000, icon: Star,            color: 'bg-amber-500',   desc: 'Trophy ceremony, on-stage, VIP meet-and-greet, social promo' },
		{ label: 'Music Act',            amount: 45_000, icon: Music,           color: 'bg-emerald-500', desc: 'Emerging national artists, touring DJs, recognizable performers' },
		{ label: 'Talent Travel & Lodging', amount: 10_000, icon: Plane,        color: 'bg-blue-500',    desc: 'Flights, hotels, ground transportation' },
		{ label: 'Hospitality & Riders', amount: 7_500,  icon: UtensilsCrossed, color: 'bg-violet-500',  desc: 'Catering, dressing rooms, security upgrades, VIP accommodations' },
		{ label: 'Booking Fees',         amount: 7_500,  icon: Briefcase,       color: 'bg-rose-500',    desc: '~10% of talent fees' }
	];

	const phaseColors: Record<string, string> = {
		Baseline:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
		Enhanced:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
		'Multi-Act': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
		Headline:  'bg-violet-500/10 text-violet-400 border-violet-500/30'
	};

	const phaseDetails: Record<string, string[]> = {
		Baseline:    ['1 celebrity appearance', '1 music act', 'Short-form concert experience'],
		Enhanced:    ['Higher-tier artist', 'Multiple performers', 'Expanded production'],
		'Multi-Act': ['Multiple music acts', 'Longer concert windows', 'Stronger brand recognition'],
		Headline:    ['Major headline artists', 'Multi-act festival-style programming', 'Nationally recognized performers']
	};

	const maxTotal    = Math.max(...yearlyBudget.map(y => y.total));
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
	const selected = $derived(yearlyBudget.find(y => y.year === selectedYear)!);
	const costPerAttendee = $derived(Math.round(selected.perEvent / selected.attendees));
</script>

<svelte:head>
	<title>Entertainment Budget - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Celebrity Talent &amp; Entertainment</h1>
		<p class="text-muted-foreground">
			Event entertainment scaled model · FY 2027–2031 · COGS – Tournament Execution
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Music class="size-3.5 shrink-0" />
					<span class="text-xs">2027 Baseline</span>
				</div>
				<p class="text-xl font-bold">$600K</p>
				<p class="text-xs text-muted-foreground">$100K per event</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-amber-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2028 Enhanced</span>
				</div>
				<p class="text-xl font-bold text-amber-400">$1.2M</p>
				<p class="text-xs text-muted-foreground">2.0× from 2027</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-orange-400">
					<TrendingUp class="size-3.5 shrink-0" />
					<span class="text-xs">2029 Multi-Act</span>
				</div>
				<p class="text-xl font-bold text-orange-400">$2.4M</p>
				<p class="text-xs text-muted-foreground">2.0× from 2028</p>
			</div>
			<div class="px-4 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-violet-400">
					<Zap class="size-3.5 shrink-0" />
					<span class="text-xs">2030–2031 Headline</span>
				</div>
				<p class="text-xl font-bold text-violet-400">$4.8M</p>
				<p class="text-xs text-muted-foreground">$800K per event · Flat</p>
			</div>
		</div>
	</Card>

	<!-- Multi-year chart + year detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Year bars -->
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Entertainment Budget
			</h2>
			<div class="space-y-3">
				{#each yearlyBudget as row}
					{@const isSelected = row.year === selectedYear}
					<button class="w-full text-left group" onclick={() => selectedYear = row.year}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{row.year}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phaseColors[row.phase]}">{row.phase}</span>
							{#if row.multiplier && row.multiplier !== 'Flat'}
								<span class="text-xs text-muted-foreground flex items-center gap-0.5">
									<ChevronRight class="size-3" />{row.multiplier}
								</span>
							{:else if row.multiplier === 'Flat'}
								<span class="text-xs text-muted-foreground">Flat</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(row.total)}</span>
						</div>
						<div class="h-6 rounded-md overflow-hidden bg-muted {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div
								class="h-full rounded-md bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-500"
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
					<span class="text-sm text-muted-foreground">Est. Attendance</span>
					<span class="font-semibold">{selected.attendees.toLocaleString()}</span>
				</div>
				<div class="flex justify-between items-center py-2 border-b border-border">
					<span class="text-sm text-muted-foreground">Cost / Attendee</span>
					<span class="font-semibold">${costPerAttendee}</span>
				</div>
				{#if selected.multiplier && selected.multiplier !== 'Flat'}
					<div class="flex justify-between items-center py-2 border-b border-border">
						<span class="text-sm text-muted-foreground">YoY Scale</span>
						<span class="font-semibold text-violet-400">{selected.multiplier}</span>
					</div>
				{/if}
			</div>

			<div class="rounded-lg bg-muted/40 p-3">
				<p class="text-xs font-semibold text-foreground mb-1">{selected.phaseLabel}</p>
				<ul class="space-y-1">
					{#each phaseDetails[selected.phase] as detail}
						<li class="flex items-start gap-1.5 text-xs text-muted-foreground">
							<span class="mt-1 size-1.5 rounded-full bg-violet-500 shrink-0"></span>
							{detail}
						</li>
					{/each}
				</ul>
			</div>
		</Card>
	</div>

	<!-- 2027 per-event cost breakdown -->
	<Card class="p-5">
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
			2027 Per-Event Cost Breakdown  <span class="normal-case font-normal text-muted-foreground ml-1">($100,000 total)</span>
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			{#each breakdown2027 as item}
				{@const Icon = item.icon}
				{@const sharePct = Math.round((item.amount / 100_000) * 100)}
				<div class="flex flex-col gap-2 p-4 rounded-xl bg-muted/30 border border-border">
					<div class="flex items-center justify-between">
						<div class="flex size-8 items-center justify-center rounded-lg {item.color}/20">
							<Icon class="size-4 {item.color.replace('bg-', 'text-')}" />
						</div>
						<span class="text-xs font-bold text-muted-foreground">{sharePct}%</span>
					</div>
					<p class="text-lg font-bold">{fmt(item.amount)}</p>
					<p class="text-sm font-medium leading-tight">{item.label}</p>
					<p class="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
					<!-- mini bar -->
					<div class="h-1 rounded-full bg-muted overflow-hidden mt-auto">
						<div class="{item.color} h-full rounded-full" style="width: {pct(item.amount, maxBreakdown)}"></div>
					</div>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Cost per attendee + VIP revenue -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Cost Per Attendee</h2>
			<div class="space-y-3">
				{#each yearlyBudget as row}
					{@const cpa = Math.round(row.perEvent / row.attendees)}
					{@const maxCpa = 80}
					<div class="flex items-center gap-3">
						<span class="text-xs text-muted-foreground w-10 shrink-0">{row.year}</span>
						<div class="flex-1 h-5 rounded bg-muted overflow-hidden">
							<div
								class="h-full rounded bg-gradient-to-r from-violet-600 to-pink-500 transition-all"
								style="width: {pct(cpa, maxCpa)}"
							></div>
						</div>
						<span class="text-sm font-semibold w-12 text-right shrink-0">${cpa}</span>
						<span class="text-xs text-muted-foreground w-20 shrink-0">{row.attendees.toLocaleString()} att.</span>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
				<Info class="size-3.5 inline mr-1" />
				Increase supported by higher ticket pricing, premium experiences, and sponsorship activation
			</p>
		</Card>

		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Revenue Alignment</h2>

			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4">
				<p class="text-xs text-muted-foreground mb-1">VIP Revenue Example (2030+)</p>
				<p class="text-2xl font-bold text-emerald-400">$100,000</p>
				<p class="text-xs text-muted-foreground mt-1">500 VIP seats × $200 premium per event</p>
				<p class="text-xs text-emerald-400 mt-1">Covers a meaningful portion of talent cost</p>
			</div>

			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					{ label: 'Ticket Value Expansion', desc: 'GA uplift + VIP and Ultra Flyer pricing increases', icon: DollarSign },
					{ label: 'Sponsorship Activation', desc: 'Branded concert integrations, premium moments, social exposure', icon: Star },
					{ label: 'Broadcast & Content', desc: 'Highlight clips, viral moments, crossover content', icon: Tv },
					{ label: 'Audience Expansion', desc: 'Music fans, casual spectators, new demographics', icon: Users }
				] as item}
					{@const Icon = item.icon}
					<li class="flex items-start gap-2">
						<Icon class="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
						<div>
							<span class="font-medium text-foreground">{item.label}</span>
							<span class="text-muted-foreground"> — {item.desc}</span>
						</div>
					</li>
				{/each}
			</ul>
		</Card>
	</div>

	<!-- Risk control -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Downside Flexibility</h2>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Shift to DJ or mid-tier acts',
					'Reduce celebrity appearance spend',
					'Operate at ~$75K–$100K per event floor'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-slate-500 shrink-0"></span>
						{item}
					</li>
				{/each}
			</ul>
		</Card>
		<Card class="p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upside Expansion</h2>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each [
					'Headline artist upgrades',
					'Multi-day programming',
					'Festival-style experiences'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-violet-500 shrink-0"></span>
						{item}
					</li>
				{/each}
			</ul>
		</Card>
	</div>

</div>
