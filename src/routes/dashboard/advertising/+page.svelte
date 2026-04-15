<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import {
		Megaphone,
		TrendingUp,
		Globe,
		Radio,
		Newspaper,
		MapPin,
		Tv,
		ChevronRight,
		Info,
		DollarSign,
		BarChart3
	} from 'lucide-svelte';

	// ── Channel definitions ───────────────────────────────────────────────────

	type ChannelKey =
		| 'billboards' | 'domestic' | 'international' | 'nordic'
		| 'european' | 'globalOther' | 'broadcastPromo'
		| 'iheart' | 'localMedia' | 'print' | 'directEvent';

	type Channel = {
		key: ChannelKey;
		label: string;
		icon: any;
		color: string;
		textColor: string;
		purpose: string;
		values: Record<number, number>;
	};

	const channels: Channel[] = [
		{
			key: 'billboards', label: 'Billboards', icon: MapPin,
			color: 'bg-blue-500', textColor: 'text-blue-400',
			purpose: 'Local dominance & event awareness',
			values: { 2026: 40_000, 2027: 35_000, 2028: 100_000, 2029: 120_000, 2030: 140_000, 2031: 140_000 }
		},
		{
			key: 'iheart', label: 'iHeart Radio', icon: Radio,
			color: 'bg-emerald-500', textColor: 'text-emerald-400',
			purpose: 'Mass reach + frequency across cities',
			values: { 2026: 25_000, 2027: 30_000, 2028: 60_000, 2029: 75_000, 2030: 150_000, 2031: 300_000 }
		},
		{
			key: 'localMedia', label: 'Local Sports & Media', icon: Newspaper,
			color: 'bg-amber-500', textColor: 'text-amber-400',
			purpose: 'Credibility + sports audience targeting',
			values: { 2026: 15_000, 2027: 20_000, 2028: 40_000, 2029: 50_000, 2030: 100_000, 2031: 200_000 }
		},
		{
			key: 'print', label: 'Print Publications', icon: Newspaper,
			color: 'bg-orange-500', textColor: 'text-orange-400',
			purpose: 'Legacy audience + sponsorship alignment',
			values: { 2026: 10_000, 2027: 10_000, 2028: 25_000, 2029: 30_000, 2030: 60_000, 2031: 120_000 }
		},
		{
			key: 'directEvent', label: 'Direct Event Campaigns', icon: Megaphone,
			color: 'bg-cyan-500', textColor: 'text-cyan-400',
			purpose: 'High-intent local market conversion',
			values: { 2026: 10_000, 2027: 5_000, 2028: 25_000, 2029: 25_000, 2030: 50_000, 2031: 100_000 }
		},
		{
			key: 'domestic', label: 'Domestic Advertising', icon: BarChart3,
			color: 'bg-violet-500', textColor: 'text-violet-400',
			purpose: 'National brand development',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 300_000, 2031: 750_000 }
		},
		{
			key: 'international', label: 'International Advertising', icon: Globe,
			color: 'bg-rose-500', textColor: 'text-rose-400',
			purpose: 'Global market entry campaigns',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 200_000, 2031: 550_000 }
		},
		{
			key: 'nordic', label: 'Nordic Markets', icon: Globe,
			color: 'bg-sky-500', textColor: 'text-sky-400',
			purpose: 'Finland, Sweden, Estonia — proven disc golf markets',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 100_000, 2031: 350_000 }
		},
		{
			key: 'european', label: 'European Markets', icon: Globe,
			color: 'bg-indigo-500', textColor: 'text-indigo-400',
			purpose: 'Broader European expansion',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 1_000_000, 2031: 1_250_000 }
		},
		{
			key: 'globalOther', label: 'Additional Global Markets', icon: Globe,
			color: 'bg-fuchsia-500', textColor: 'text-fuchsia-400',
			purpose: 'Emerging global markets with streaming adoption',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 750_000, 2031: 1_000_000 }
		},
		{
			key: 'broadcastPromo', label: 'Global Broadcast Promo', icon: Tv,
			color: 'bg-pink-500', textColor: 'text-pink-400',
			purpose: 'Viewer conversion + broadcast retention',
			values: { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 250_000, 2031: 500_000 }
		}
	];

	const years = [2026, 2027, 2028, 2029, 2030, 2031];
	const totals: Record<number, number> = {
		2026: 100_000, 2027: 100_000, 2028: 250_000,
		2029: 300_000, 2030: 3_100_000, 2031: 5_260_000
	};

	const phases: Record<number, { label: string; color: string }> = {
		2026: { label: 'Foundation', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
		2027: { label: 'Foundation', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
		2028: { label: 'Growth',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
		2029: { label: 'Growth',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
		2030: { label: 'Expansion',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
		2031: { label: 'Expansion',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' }
	};

	// Domestic-only channels (active pre-2030)
	const domesticChannelKeys: ChannelKey[] = ['billboards', 'iheart', 'localMedia', 'print', 'directEvent'];
	// Global channels (activate 2030+)
	const globalChannelKeys: ChannelKey[] = ['domestic', 'international', 'nordic', 'european', 'globalOther', 'broadcastPromo'];

	const maxTotal = Math.max(...Object.values(totals));

	function fmt(n: number): string {
		if (n === 0) return '—';
		return new Intl.NumberFormat('en-US', {
			style: 'currency', currency: 'USD',
			minimumFractionDigits: 0, maximumFractionDigits: 0
		}).format(n);
	}

	function fmtM(n: number): string {
		if (n === 0) return '—';
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
		return `$${(n / 1_000).toFixed(0)}K`;
	}

	function pct(value: number, max: number): string {
		return `${Math.round((value / max) * 100)}%`;
	}

	let selectedYear = $state(2030);
	const selectedTotal = $derived(totals[selectedYear]);

	// Active channels for selected year
	const activeChannels = $derived(
		channels.filter(c => c.values[selectedYear] > 0)
			.sort((a, b) => b.values[selectedYear] - a.values[selectedYear])
	);

	const maxChannelValue = $derived(Math.max(...activeChannels.map(c => c.values[selectedYear])));
</script>

<svelte:head>
	<title>Advertising Budget - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Advertising Budget</h1>
		<p class="text-muted-foreground">
			Multi-channel paid strategy · FY 2026–2031 · Domestic &amp; International
		</p>
	</div>

	<!-- KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each years as yr}
				<button
					class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors {selectedYear === yr ? 'bg-muted/40' : ''}"
					onclick={() => selectedYear = yr}
				>
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">{yr}</span>
						<span class="text-xs px-1.5 py-0.5 rounded-full border {phases[yr].color}">{phases[yr].label}</span>
					</div>
					<p class="text-lg font-bold {yr >= 2030 ? 'text-violet-400' : yr >= 2028 ? 'text-amber-400' : 'text-foreground'}">{fmtM(totals[yr])}</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Year chart + channel detail -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Annual totals bar chart -->
		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Annual Advertising Spend
			</h2>
			<div class="space-y-3">
				{#each years as yr}
					{@const isSelected = yr === selectedYear}
					{@const hasGlobal = totals[yr] >= 3_000_000}
					{@const domTotal = domesticChannelKeys.reduce((s, k) => s + (channels.find(c=>c.key===k)?.values[yr] ?? 0), 0)}
					{@const glbTotal = globalChannelKeys.reduce((s, k) => s + (channels.find(c=>c.key===k)?.values[yr] ?? 0), 0)}
					<button class="w-full text-left group" onclick={() => selectedYear = yr}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{yr}</span>
							<span class="text-xs px-2 py-0.5 rounded-full border {phases[yr].color}">{phases[yr].label}</span>
							{#if yr === 2030}
								<span class="text-xs text-violet-400 flex items-center gap-0.5"><ChevronRight class="size-3" />Global launch</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmtM(totals[yr])}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-gradient-to-r from-blue-600 to-emerald-500 transition-all" style="width: {pct(domTotal, maxTotal)}"></div>
							{#if glbTotal > 0}
								<div class="bg-gradient-to-r from-violet-600 to-pink-500 transition-all" style="width: {pct(glbTotal, maxTotal)}"></div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-blue-500"></div>Domestic channels
				</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<div class="size-2.5 rounded-sm bg-violet-500"></div>Global channels (2030+)
				</div>
			</div>
		</Card>

		<!-- Selected year channel breakdown -->
		<Card class="p-5 flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{selectedYear} Channels</h2>
				<span class="text-xs px-2 py-0.5 rounded-full border {phases[selectedYear].color}">{phases[selectedYear].label}</span>
			</div>
			<div class="text-lg font-bold border-b border-border pb-3">{fmt(selectedTotal)}</div>
			<div class="space-y-2 overflow-y-auto max-h-72">
				{#each activeChannels as ch}
					{@const Icon = ch.icon}
					{@const share = Math.round((ch.values[selectedYear] / selectedTotal) * 100)}
					<div class="flex items-center gap-2">
						<Icon class="size-3.5 {ch.textColor} shrink-0" />
						<div class="flex-1 min-w-0">
							<div class="flex justify-between text-xs mb-0.5">
								<span class="truncate text-muted-foreground">{ch.label}</span>
								<span class="font-semibold shrink-0 ml-2">{fmt(ch.values[selectedYear])}</span>
							</div>
							<div class="h-1.5 rounded-full bg-muted overflow-hidden">
								<div class="{ch.color} h-full rounded-full" style="width: {pct(ch.values[selectedYear], maxChannelValue)}"></div>
							</div>
						</div>
						<span class="text-xs text-muted-foreground w-7 text-right shrink-0">{share}%</span>
					</div>
				{/each}
			</div>
		</Card>
	</div>

	<!-- Full channel × year matrix -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full Channel Breakdown</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Channel</th>
						{#each years as yr}
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider {selectedYear === yr ? 'text-white' : 'text-slate-400'}">{yr}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					<!-- Domestic channels -->
					<tr class="bg-blue-950/20">
						<td colspan="7" class="px-4 py-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">Domestic Channels</td>
					</tr>
					{#each channels.filter(c => domesticChannelKeys.includes(c.key)) as ch, i}
						{@const Icon = ch.icon}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-4 py-2.5 sticky left-0 bg-inherit">
								<div class="flex items-center gap-2">
									<Icon class="size-3.5 {ch.textColor} shrink-0" />
									<span class="text-sm">{ch.label}</span>
								</div>
							</td>
							{#each years as yr}
								<td class="px-4 py-2.5 text-right text-sm {selectedYear === yr ? 'font-semibold text-foreground' : 'text-muted-foreground'} {ch.values[yr] === 0 ? 'opacity-30' : ''}">
									{fmt(ch.values[yr])}
								</td>
							{/each}
						</tr>
					{/each}
					<!-- Global channels -->
					<tr class="bg-violet-950/20">
						<td colspan="7" class="px-4 py-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">Global Channels (2030+)</td>
					</tr>
					{#each channels.filter(c => globalChannelKeys.includes(c.key)) as ch, i}
						{@const Icon = ch.icon}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/50 transition-colors">
							<td class="px-4 py-2.5 sticky left-0 bg-inherit">
								<div class="flex items-center gap-2">
									<Icon class="size-3.5 {ch.textColor} shrink-0" />
									<span class="text-sm">{ch.label}</span>
								</div>
							</td>
							{#each years as yr}
								<td class="px-4 py-2.5 text-right text-sm {selectedYear === yr ? 'font-semibold text-foreground' : 'text-muted-foreground'} {ch.values[yr] === 0 ? 'opacity-20' : ''}">
									{fmt(ch.values[yr])}
								</td>
							{/each}
						</tr>
					{/each}
					<!-- Totals row -->
					<tr class="bg-slate-800/60 font-bold border-t-2 border-slate-600">
						<td class="px-4 py-3 sticky left-0 bg-slate-800/60">Total</td>
						{#each years as yr}
							<td class="px-4 py-3 text-right {selectedYear === yr ? 'text-white text-base' : 'text-muted-foreground'}">{fmtM(totals[yr])}</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Channel purpose grid -->
	<div>
		<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Channel Strategy</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each channels.slice(0, 6) as ch}
				{@const Icon = ch.icon}
				<Card class="p-4 flex items-start gap-3">
					<div class="flex size-8 items-center justify-center rounded-lg {ch.color}/20 shrink-0 mt-0.5">
						<Icon class="size-4 {ch.textColor}" />
					</div>
					<div>
						<p class="text-sm font-semibold">{ch.label}</p>
						<p class="text-xs text-muted-foreground mt-0.5">{ch.purpose}</p>
					</div>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Strategic justification + cost controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<TrendingUp class="size-4 text-emerald-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Advertising as Revenue Multiplier</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					{ label: 'Ticket Sales', desc: 'Drives attendance from 2,500 → 10,000+ per event' },
					{ label: 'Sponsorship Value', desc: 'Higher visibility = higher pricing power' },
					{ label: 'Broadcast Value', desc: 'Larger audience = stronger media rights negotiations' },
					{ label: 'Merchandise', desc: 'Increased brand recognition drives DTC sales' },
					{ label: 'Fantasy & Betting', desc: 'Larger user base increases participation' }
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
						<div><span class="font-medium text-foreground">{item.label}</span> — {item.desc}</div>
					</li>
				{/each}
			</ul>
			<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300">
				<Info class="size-3.5 inline mr-1" />
				Every dollar spent contributes to multiple revenue verticals simultaneously
			</div>
		</Card>

		<Card class="p-5">
			<div class="flex items-center gap-2 mb-3">
				<DollarSign class="size-4 text-blue-400" />
				<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cost Controls</h2>
			</div>
			<ul class="space-y-2 text-sm text-muted-foreground mb-4">
				{#each [
					'Market-by-market testing before scaling',
					'ROI tracking per channel (ticket conversion, engagement, viewership)',
					'Partnership offsets via co-branded campaigns',
					'Event-based spending — not continuous burn',
					'Sponsor-subsidized media buys and promotional integrations'
				] as item}
					<li class="flex items-start gap-2">
						<span class="mt-1 size-1.5 rounded-full bg-blue-500 shrink-0"></span>{item}
					</li>
				{/each}
			</ul>
			<div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
				<Info class="size-3.5 inline mr-1" />
				Global markets targeted on data: proven disc golf popularity, high per-capita engagement, strong streaming adoption
			</div>
		</Card>
	</div>

</div>
