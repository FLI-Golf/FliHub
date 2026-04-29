<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		DollarSign,
		Tv,
		Users,
		Film,
		Megaphone,
		Info,
		ChevronRight
	} from 'lucide-svelte';

	const totalRaise = 7_500_000;

	type LineItem = { label: string; amount: number };

	type Pillar = {
		id: string;
		title: string;
		subtitle: string;
		pct: number;
		amount: number;
		color: string;
		bgLight: string;
		bgDark: string;
		borderColor: string;
		textColor: string;
		icon: any;
		description: string;
		breakdown: LineItem[];
	};

	const pillars: Pillar[] = [
		{
			id: 'event-production',
			title: 'Event Production & Technology',
			subtitle: '35% of raise',
			pct: 35,
			amount: 2_625_000,
			color: 'amber',
			bgLight: 'bg-amber-50',
			bgDark: 'dark:bg-amber-950/30',
			borderColor: 'border-amber-500',
			textColor: 'text-amber-600 dark:text-amber-400',
			icon: Tv,
			description:
				'Venue setup, course design, and obstacle fabrication for stadium-format events. Live streaming infrastructure and broadcast production crew. Scoring technology and real-time data feeds for betting integrations. Mobile app and fan-facing digital experience.',
			breakdown: [
				{ label: 'Venue & Course Build', amount: 1_300_000 },
				{ label: 'Broadcast Infrastructure', amount: 1_000_000 },
				{ label: 'Tech & Data Platform', amount: 325_000 }
			]
		},
		{
			id: 'league-operations',
			title: 'League Operations & Team Development',
			subtitle: '25% of raise',
			pct: 25,
			amount: 1_875_000,
			color: 'emerald',
			bgLight: 'bg-emerald-50',
			bgDark: 'dark:bg-emerald-950/30',
			borderColor: 'border-emerald-500',
			textColor: 'text-emerald-600 dark:text-emerald-400',
			icon: Users,
			description:
				'Player contracts, travel, and competition logistics for 20+ committed pros. Team franchise development and owner onboarding process. League office staffing — commissioner, ops, legal, and compliance. Rulebook, officiating standards, and competitive format development.',
			breakdown: [
				{ label: 'Player Contracts & Travel', amount: 1_000_000 },
				{ label: 'League Office & Staff', amount: 600_000 },
				{ label: 'Franchise Dev & Legal', amount: 275_000 }
			]
		},
		{
			id: 'media-content',
			title: 'Media & Content Buildout',
			subtitle: '20% of raise',
			pct: 20,
			amount: 1_500_000,
			color: 'violet',
			bgLight: 'bg-violet-50',
			bgDark: 'dark:bg-violet-950/30',
			borderColor: 'border-violet-500',
			textColor: 'text-violet-600 dark:text-violet-400',
			icon: Film,
			description:
				'Documentary and behind-the-scenes content for streaming platforms. Trading card, gaming, and licensing asset production. Social media content team and athlete storytelling campaigns. Broadcast rights packaging for domestic and international distribution.',
			breakdown: [
				{ label: 'Documentary & Streaming', amount: 600_000 },
				{ label: 'Social & Athlete Content', amount: 400_000 },
				{ label: 'Licensing & Trading Cards', amount: 500_000 }
			]
		},
		{
			id: 'marketing-reserve',
			title: 'Marketing, Working Capital & Reserve',
			subtitle: '20% of raise',
			pct: 20,
			amount: 1_500_000,
			color: 'blue',
			bgLight: 'bg-blue-50',
			bgDark: 'dark:bg-blue-950/30',
			borderColor: 'border-blue-500',
			textColor: 'text-blue-600 dark:text-blue-400',
			icon: Megaphone,
			description:
				'Launch campaign targeting disc golf, sports betting, and fantasy audiences. Sponsor acquisition and brand partnership outreach. Operating reserve to cover 6+ months of runway post-launch. Contingency buffer for venue, regulatory, or scheduling changes.',
			breakdown: [
				{ label: 'Launch Marketing', amount: 600_000 },
				{ label: 'Sponsor Outreach', amount: 300_000 },
				{ label: 'Operating Reserve', amount: 600_000 }
			]
		}
	];

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(n);

	const fmtM = (n: number) => {
		const m = n / 1_000_000;
		return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
	};
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span
					class="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded"
				>
					Q2 2026 · Seed Round
				</span>
				<span
					class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded"
				>
					Young America Capital, LLC
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Use of Proceeds</h1>
			<p class="text-sm text-muted-foreground mt-1">
				How the $7.5M seed round is deployed across four operational pillars.
			</p>
		</div>
		<div class="text-right shrink-0">
			<p class="text-xs text-muted-foreground">Total Raise</p>
			<p class="text-3xl font-black text-foreground">$7.5M</p>
			<p class="text-xs text-muted-foreground mt-0.5">SEC Registered · FINRA, SIPC</p>
		</div>
	</div>

	<!-- Allocation bar -->
	<Card class="p-5">
		<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
			Allocation Overview
		</p>
		<div class="flex h-5 w-full rounded-full overflow-hidden gap-px">
			{#each pillars as p}
				<div
					class="h-full transition-all duration-500"
					style="width: {p.pct}%; background-color: var(--color-{p.color}-500, currentColor);"
					class:bg-amber-500={p.color === 'amber'}
					class:bg-emerald-500={p.color === 'emerald'}
					class:bg-violet-500={p.color === 'violet'}
					class:bg-blue-500={p.color === 'blue'}
					title="{p.title} — {p.pct}%"
				></div>
			{/each}
		</div>
		<div class="flex flex-wrap gap-x-6 gap-y-2 mt-3">
			{#each pillars as p}
				<div class="flex items-center gap-1.5">
					<span
						class="size-2.5 rounded-full shrink-0"
						class:bg-amber-500={p.color === 'amber'}
						class:bg-emerald-500={p.color === 'emerald'}
						class:bg-violet-500={p.color === 'violet'}
						class:bg-blue-500={p.color === 'blue'}
					></span>
					<span class="text-xs text-muted-foreground">{p.pct}% — {p.title}</span>
				</div>
			{/each}
		</div>
	</Card>

	<!-- KPI row -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each pillars as p}
			{@const Icon = p.icon}
			<div class="rounded-xl border bg-card p-5 space-y-2">
				<div class="flex items-center justify-between">
					<div
						class="flex size-8 items-center justify-center rounded-lg {p.bgLight} {p.bgDark}"
					>
						<Icon class="size-4 {p.textColor}" />
					</div>
					<span
						class="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded {p.bgLight} {p.bgDark} {p.textColor}"
					>
						{p.pct}%
					</span>
				</div>
				<p class="text-2xl font-black text-foreground">{fmtM(p.amount)}</p>
				<p class="text-xs font-medium text-muted-foreground leading-snug">{p.title}</p>
			</div>
		{/each}
	</div>

	<!-- Pillar detail cards -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		{#each pillars as p}
			{@const Icon = p.icon}
			<Card class="p-6 space-y-5 border-l-4 {p.borderColor}">
				<!-- Pillar header -->
				<div class="flex items-start gap-3">
					<div
						class="flex size-10 items-center justify-center rounded-xl {p.bgLight} {p.bgDark} shrink-0"
					>
						<Icon class="size-5 {p.textColor}" />
					</div>
					<div class="min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<h2 class="text-base font-bold tracking-tight leading-tight">{p.title}</h2>
							<span
								class="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded {p.bgLight} {p.bgDark} {p.textColor} shrink-0"
							>
								{p.pct}%
							</span>
						</div>
						<p class="text-xl font-black {p.textColor} mt-0.5">{fmt(p.amount)}</p>
					</div>
				</div>

				<!-- Description -->
				<div class="flex gap-2 text-sm text-muted-foreground leading-relaxed">
					<Info class="size-4 shrink-0 mt-0.5 opacity-60" />
					<p>{p.description}</p>
				</div>

				<!-- Breakdown -->
				<div class="space-y-2">
					<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Indicative Breakdown
					</p>
					{#each p.breakdown as line}
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-2 min-w-0">
								<ChevronRight class="size-3 {p.textColor} shrink-0" />
								<span class="text-sm text-muted-foreground truncate">{line.label}</span>
							</div>
							<span class="text-sm font-semibold text-foreground tabular-nums shrink-0">
								~{fmt(line.amount)}
							</span>
						</div>
						<!-- Progress bar relative to pillar total -->
						<div class="h-1 w-full rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500"
								class:bg-amber-500={p.color === 'amber'}
								class:bg-emerald-500={p.color === 'emerald'}
								class:bg-violet-500={p.color === 'violet'}
								class:bg-blue-500={p.color === 'blue'}
								style="width: {((line.amount / p.amount) * 100).toFixed(1)}%"
							></div>
						</div>
					{/each}
				</div>

				<!-- % of total raise -->
				<div class="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
					<span>{p.pct}% of $7.5M total raise</span>
					<span class="font-semibold text-foreground">{fmt(p.amount)}</span>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Footnote / context -->
	<Card class="p-5">
		<div class="flex gap-3">
			<DollarSign class="size-5 text-amber-500 shrink-0 mt-0.5" />
			<div class="space-y-1 text-sm text-muted-foreground">
				<p>
					<span class="font-semibold text-foreground">Investment Thesis —</span>
					FLI is not asking investors to underwrite whether disc golf will grow. FLI is asking: can a
					stadium-format league capture single-digit basis points across multi-billion-dollar adjacent
					markets?
				</p>
				<p class="text-xs">
					Disc golf participation has grown 86% since 2020. Zero stadium infrastructure exists — FLI
					is the first mover. Tribal gaming partners are actively seeking youth-skewing, regulated
					sports properties. Fantasy and sports betting legalization creates immediate monetization at
					launch.
				</p>
				<p class="text-xs mt-2 text-muted-foreground/70">
					Presented by Young America Capital, LLC · SEC Registered Broker-Dealer · FINRA, SIPC ·
					Round Type: Seed · Timeline: Q2 2026
				</p>
			</div>
		</div>
	</Card>
</div>
