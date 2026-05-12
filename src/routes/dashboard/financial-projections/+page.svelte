<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { TrendingUp, TrendingDown, DollarSign, BarChart3, Info, ChevronRight, Activity, Target } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const live = $derived(data?.liveData ?? null);

	// ── P&L data — Multi-Year Cash Flow & Revenue Timing Model 2026–2031 ──────
	// Source: FLI Golf League Institutional Investment Review (corrected proforma)
	// 2031 Tier 3 Sponsorship corrected to $6.5M pending CFO confirmation
	const years = [2026, 2027, 2028, 2029, 2030, 2031];

	const sales: Record<number, number> = {
		2026: 2_824_000,
		2027: 21_392_200,
		2028: 29_970_500,
		2029: 62_783_500,
		2030: 113_180_050,
		2031: 188_983_473,
	};
	const cogs: Record<number, number> = {
		2026: 1_800_000,
		2027: 11_765_000,
		2028: 14_760_000,
		2029: 23_511_018,
		2030: 38_271_105,
		2031: 54_961_398,
	};
	const grossProfit = (yr: number) => sales[yr] - cogs[yr];
	const grossMargin = (yr: number) => sales[yr] > 0 ? (grossProfit(yr) / sales[yr]) * 100 : 0;

	const salesMarketing: Record<number, number> = {
		2026: 709_167,
		2027: 3_081_850,
		2028: 3_841_200,
		2029: 10_377_700,
		2030: 19_246_500,
		2031: 24_521_000,
	};
	const labor: Record<number, number> = {
		2026: 804_330,
		2027: 1_831_182,
		2028: 2_158_914,
		2029: 2_946_505,
		2030: 4_270_206,
		2031: 6_202_747,
	};
	const generalAdmin: Record<number, number> = {
		2026: 1_299_633,
		2027: 3_627_576,
		2028: 4_024_200,
		2029: 4_758_500,
		2030: 7_397_000,
		2031: 11_524_000,
	};
	const totalExpenses: Record<number, number> = {
		2026: 4_613_130,
		2027: 20_305_608,
		2028: 24_784_314,
		2029: 41_593_723,
		2030: 69_184_811,
		2031: 97_209_145,
	};
	const netProfit: Record<number, number> = {
		2026: -1_789_130,
		2027:  1_086_592,
		2028:  5_186_186,
		2029: 21_189_777,
		2030: 43_995_239,
		2031: 91_774_328,
	};
	const netMargin = (yr: number) => sales[yr] > 0 ? (netProfit[yr] / sales[yr]) * 100 : 0;

	// ── Revenue by stream (corrected proforma) ────────────────────────────────
	const products: { label: string; values: Record<number, number>; color: string }[] = [
		{ label: 'Ticket Revenue',           color: 'bg-blue-500',    values: { 2026: 0,         2027: 3_000_000,  2028: 3_450_000,  2029: 5_175_000,  2030: 6_900_000,  2031: 8_625_000  } },
		{ label: 'Sponsorship — Tier 1',     color: 'bg-emerald-600', values: { 2026: 0,         2027: 1_600_000,  2028: 1_840_000,  2029: 2_080_000,  2030: 2_400_000,  2031: 2_750_000  } },
		{ label: 'Sponsorship — Tier 2',     color: 'bg-emerald-500', values: { 2026: 0,         2027: 3_000_000,  2028: 3_450_000,  2029: 4_680_000,  2030: 6_750_000,  2031: 9_450_000  } },
		{ label: 'Sponsorship — Tier 3',     color: 'bg-emerald-400', values: { 2026: 0,         2027: 1_400_000,  2028: 1_610_000,  2029: 2_730_000,  2030: 4_200_000,  2031: 6_500_000  } },
		{ label: 'Sponsorship — Tier 4',     color: 'bg-emerald-300', values: { 2026: 0,         2027: 150_000,    2028: 172_500,    2029: 292_500,    2030: 450_000,    2031: 637_500    } },
		{ label: 'Presenting Partner',       color: 'bg-teal-500',    values: { 2026: 0,         2027: 125_000,    2028: 500_000,    2029: 1_000_000,  2030: 5_000_000,  2031: 10_000_000 } },
		{ label: 'Premium Subscriptions',    color: 'bg-cyan-500',    values: { 2026: 238_000,   2027: 955_200,    2028: 1_388_000,  2029: 3_776_000,  2030: 7_358_000,  2031: 10_940_000 } },
		{ label: 'Sports Apparel',           color: 'bg-violet-500',  values: { 2026: 1_020_000, 2027: 3_060_000,  2028: 3_590_000,  2029: 6_120_000,  2030: 8_160_000,  2031: 10_200_000 } },
		{ label: 'Team Jerseys',             color: 'bg-pink-500',    values: { 2026: 1_034_000, 2027: 3_102_000,  2028: 4_204_000,  2029: 10_340_000, 2030: 15_510_000, 2031: 23_265_000 } },
		{ label: 'Bags',                     color: 'bg-amber-500',   values: { 2026: 52_000,    2027: 104_000,    2028: 156_000,    2029: 260_000,    2030: 325_000,    2031: 341_250    } },
		{ label: 'Discs',                    color: 'bg-orange-500',  values: { 2026: 30_000,    2027: 90_000,     2028: 150_000,    2029: 300_000,    2030: 450_000,    2031: 600_000    } },
		{ label: 'Fantasy League Fees',      color: 'bg-indigo-500',  values: { 2026: 0,         2027: 356_000,    2028: 1_100_000,  2029: 3_640_000,  2030: 9_380_000,  2031: 19_125_000 } },
		{ label: 'Gambling / Sports Betting',color: 'bg-red-500',     values: { 2026: 0,         2027: 2_000_000,  2028: 3_460_000,  2029: 8_640_000,  2030: 17_280_000, 2031: 28_800_000 } },
		{ label: 'Broadcasting / Streaming', color: 'bg-sky-500',     values: { 2026: 0,         2027: 500_000,    2028: 1_000_000,  2029: 3_000_000,  2030: 10_000_000, 2031: 25_000_000 } },
		{ label: 'Trading Cards (Brixton)',  color: 'bg-rose-500',    values: { 2026: 250_000,   2027: 1_000_000,  2028: 1_900_000,  2029: 4_150_000,  2030: 5_017_050,  2031: 7_274_723  } },
		{ label: 'General Licensing',        color: 'bg-fuchsia-500', values: { 2026: 0,         2027: 300_000,    2028: 1_000_000,  2029: 5_000_000,  2030: 12_000_000, 2031: 23_000_000 } },
		{ label: 'Disc License',             color: 'bg-yellow-500',  values: { 2026: 100_000,   2027: 350_000,    2028: 500_000,    2029: 800_000,    2030: 1_000_000,  2031: 1_200_000  } },
		{ label: 'Bag License',              color: 'bg-lime-500',    values: { 2026: 100_000,   2027: 300_000,    2028: 500_000,    2029: 800_000,    2030: 1_000_000,  2031: 1_000_000  } },
	];

	const maxSales = Math.max(...years.map(y => sales[y]));

	function fmt(n: number): string {
		if (n === 0) return '$0';
		const abs = Math.abs(n);
		const sign = n < 0 ? '-' : '';
		if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
		if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
		return `${sign}$${abs}`;
	}
	function fmtFull(n: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
	}
	function pct(v: number, max: number) { return `${Math.round((v / max) * 100)}%`; }
	function fmtPct(n: number) { return `${n >= 0 ? '' : ''}${n.toFixed(2)}%`; }

	let selectedYear = $state(2028);
	const sel = $derived(selectedYear);
</script>

<svelte:head><title>Financial Projections - FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold mb-1">Financial Projections</h1>
		<p class="text-muted-foreground">FLI Golf P&amp;L · FY 2026–2031 · Funded June 15, 2026</p>
	</div>

	<!-- Phase context banner -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
		<!-- Phase 1 -->
		<div class="rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 flex items-start gap-3">
			<span class="size-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
			<div>
				<p class="text-xs font-bold text-amber-400 uppercase tracking-wide">2026 — Seed Raise</p>
				<p class="text-lg font-black text-white">$7.5M raised</p>
				<p class="text-xs text-slate-400 mt-0.5">Launch operations, infrastructure, first season. Investment year — net loss expected.</p>
			</div>
		</div>
		<!-- Revenue bridge -->
		<div class="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 flex items-start gap-3">
			<span class="size-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
			<div>
				<p class="text-xs font-bold text-emerald-400 uppercase tracking-wide">2027 — Revenue Positive</p>
				<p class="text-lg font-black text-white">{fmt(netProfit[2027])} net</p>
				<p class="text-xs text-slate-400 mt-0.5">League revenue covers operations. No second raise needed — growth self-funded from here.</p>
			</div>
		</div>
		<!-- Long-term -->
		<div class="rounded-xl border border-violet-800/60 bg-violet-950/30 px-4 py-3 flex items-start gap-3">
			<span class="size-6 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
			<div>
				<p class="text-xs font-bold text-violet-400 uppercase tracking-wide">2028–2031 — Scale</p>
				<p class="text-lg font-black text-white">{fmt(netProfit[2031])} net by '31</p>
				<p class="text-xs text-slate-400 mt-0.5">Remaining {fmt(14_638_300 - 7_500_000)} operational budget funded entirely from league revenue.</p>
			</div>
		</div>
	</div>

	<!-- Year selector KPI strip -->
	<Card class="p-4">
		<div class="grid grid-cols-3 sm:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
			{#each years as yr}
				{@const np = netProfit[yr]}
				<button
					class="px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-muted/30 transition-colors {sel === yr ? 'bg-muted/40' : ''}"
					onclick={() => selectedYear = yr}
				>
					<span class="text-xs text-muted-foreground">{yr}</span>
					<p class="text-base font-bold {np >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmt(np)}</p>
					<p class="text-xs text-muted-foreground">{fmt(sales[yr])} rev</p>
				</button>
			{/each}
		</div>
	</Card>

	<!-- Revenue bar chart + selected year P&L -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<Card class="lg:col-span-2 p-5">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Total Revenue by Year</h2>
			<div class="space-y-3">
				{#each years as yr}
					{@const isSelected = yr === sel}
					{@const gp = grossProfit(yr)}
					{@const np = netProfit[yr]}
					<button class="w-full text-left group" onclick={() => selectedYear = yr}>
						<div class="flex items-center gap-3 mb-1">
							<span class="text-sm font-semibold w-10 shrink-0 {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{yr}</span>
							{#if np >= 0}
								<span class="text-xs text-emerald-400 flex items-center gap-0.5"><TrendingUp class="size-3" />{fmtPct(netMargin(yr))}</span>
							{:else}
								<span class="text-xs text-red-400 flex items-center gap-0.5"><TrendingDown class="size-3" />{fmtPct(netMargin(yr))}</span>
							{/if}
							<span class="ml-auto text-sm font-bold {isSelected ? 'text-foreground' : 'text-muted-foreground'}">{fmt(sales[yr])}</span>
						</div>
						<div class="flex h-6 rounded-md overflow-hidden gap-px {isSelected ? 'ring-2 ring-primary/40' : 'opacity-70 group-hover:opacity-90 transition-opacity'}">
							<div class="bg-emerald-600 transition-all" style="width:{pct(gp > 0 ? gp : 0, maxSales)}"></div>
							<div class="bg-slate-600 transition-all" style="width:{pct(totalExpenses[yr], maxSales)}"></div>
						</div>
					</button>
				{/each}
			</div>
			<div class="flex gap-6 mt-4 pt-4 border-t border-border">
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-emerald-600"></div>Gross Profit</div>
				<div class="flex items-center gap-1.5 text-xs text-muted-foreground"><div class="size-2.5 rounded-sm bg-slate-600"></div>Total Expenses</div>
			</div>
		</Card>

		<!-- Selected year P&L detail -->
		<Card class="p-5 flex flex-col gap-3">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{sel} P&amp;L</h2>
			<div class="space-y-1 text-sm">
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Sales</span>
					<span class="font-semibold">{fmt(sales[sel])}</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">COGS</span>
					<span class="font-semibold text-red-400">({fmt(cogs[sel])})</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border font-semibold">
					<span>Gross Profit</span>
					<span class="text-emerald-400">{fmt(grossProfit(sel))} <span class="text-xs font-normal text-muted-foreground">({fmtPct(grossMargin(sel))})</span></span>
				</div>
				<div class="flex justify-between py-1 text-xs">
					<span class="text-muted-foreground pl-2">Sales &amp; Marketing</span>
					<span class="text-muted-foreground">({fmt(salesMarketing[sel])})</span>
				</div>
				<div class="flex justify-between py-1 text-xs">
					<span class="text-muted-foreground pl-2">Labor</span>
					<span class="text-muted-foreground">({fmt(labor[sel])})</span>
				</div>
				<div class="flex justify-between py-1 text-xs border-b border-border">
					<span class="text-muted-foreground pl-2">G&amp;A</span>
					<span class="text-muted-foreground">({fmt(generalAdmin[sel])})</span>
				</div>
				<div class="flex justify-between py-1.5 border-b border-border">
					<span class="text-muted-foreground">Total Expenses</span>
					<span class="font-semibold text-red-400">({fmt(totalExpenses[sel])})</span>
				</div>
				<div class="flex justify-between pt-2 font-bold text-base">
					<span>Net Profit</span>
					<span class="{netProfit[sel] >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmtFull(netProfit[sel])}</span>
				</div>
				<div class="flex justify-between text-xs text-muted-foreground">
					<span>Net Margin</span>
					<span class="{netProfit[sel] >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmtPct(netMargin(sel))}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Full P&L table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Full P&amp;L Summary</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Line Item</th>
						{#each years as yr}
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider {sel === yr ? 'text-white' : 'text-slate-400'}">{yr}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					<tr class="bg-slate-800/40">
						<td class="px-4 py-2.5 font-semibold sticky left-0 bg-slate-800/40">Sales</td>
						{#each years as yr}
							<td class="px-4 py-2.5 text-right font-semibold {sel === yr ? 'text-white' : 'text-muted-foreground'}">{fmt(sales[yr])}</td>
						{/each}
					</tr>
					<tr>
						<td class="px-4 py-2.5 text-muted-foreground pl-6 sticky left-0 bg-inherit">COGS</td>
						{#each years as yr}
							<td class="px-4 py-2.5 text-right text-red-400/80 {sel === yr ? 'opacity-100' : 'opacity-60'}">({fmt(cogs[yr])})</td>
						{/each}
					</tr>
					<tr class="bg-emerald-950/20">
						<td class="px-4 py-2.5 font-semibold text-emerald-400 sticky left-0 bg-emerald-950/20">Gross Profit</td>
						{#each years as yr}
							<td class="px-4 py-2.5 text-right font-semibold text-emerald-400 {sel === yr ? 'opacity-100' : 'opacity-70'}">{fmt(grossProfit(yr))}</td>
						{/each}
					</tr>
					<tr>
						<td class="px-4 py-1.5 text-xs text-muted-foreground pl-6 sticky left-0 bg-inherit">Gross Margin %</td>
						{#each years as yr}
							<td class="px-4 py-1.5 text-right text-xs text-muted-foreground">{fmtPct(grossMargin(yr))}</td>
						{/each}
					</tr>
					<tr class="bg-slate-900/30">
						<td colspan="{years.length + 1}" class="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</td>
					</tr>
					<tr>
						<td class="px-4 py-2 text-muted-foreground pl-6 sticky left-0 bg-inherit">Sales &amp; Marketing</td>
						{#each years as yr}
							<td class="px-4 py-2 text-right text-muted-foreground {sel === yr ? 'text-foreground font-medium' : ''}">({fmt(salesMarketing[yr])})</td>
						{/each}
					</tr>
					<tr>
						<td class="px-4 py-2 text-muted-foreground pl-6 sticky left-0 bg-inherit">Labor</td>
						{#each years as yr}
							<td class="px-4 py-2 text-right text-muted-foreground {sel === yr ? 'text-foreground font-medium' : ''}">({fmt(labor[yr])})</td>
						{/each}
					</tr>
					<tr>
						<td class="px-4 py-2 text-muted-foreground pl-6 sticky left-0 bg-inherit">General &amp; Administrative</td>
						{#each years as yr}
							<td class="px-4 py-2 text-right text-muted-foreground {sel === yr ? 'text-foreground font-medium' : ''}">({fmt(generalAdmin[yr])})</td>
						{/each}
					</tr>
					<tr class="bg-red-950/10">
						<td class="px-4 py-2.5 font-semibold text-red-400 sticky left-0 bg-red-950/10">Total Expenses</td>
						{#each years as yr}
							<td class="px-4 py-2.5 text-right font-semibold text-red-400 {sel === yr ? 'opacity-100' : 'opacity-70'}">({fmt(totalExpenses[yr])})</td>
						{/each}
					</tr>
					<tr class="bg-slate-800/60 border-t-2 border-slate-600">
						<td class="px-4 py-3 font-bold text-base sticky left-0 bg-slate-800/60">Net Profit</td>
						{#each years as yr}
							<td class="px-4 py-3 text-right font-bold text-base {netProfit[yr] >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmt(netProfit[yr])}</td>
						{/each}
					</tr>
					<tr>
						<td class="px-4 py-1.5 text-xs text-muted-foreground sticky left-0 bg-inherit">Net Margin %</td>
						{#each years as yr}
							<td class="px-4 py-1.5 text-right text-xs {netProfit[yr] >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmtPct(netMargin(yr))}</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Revenue by product table -->
	<Card class="overflow-hidden">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Projected Sales by Product</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-slate-900 border-b border-border">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">Product</th>
						{#each years as yr}
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider {sel === yr ? 'text-white' : 'text-slate-400'}">{yr}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800">
					{#each products as p, i}
						<tr class="{i % 2 === 1 ? 'bg-slate-900/30' : ''} hover:bg-slate-800/40 transition-colors">
							<td class="px-4 py-2.5 sticky left-0 bg-inherit">
								<div class="flex items-center gap-2">
									<div class="size-2 rounded-sm {p.color} shrink-0"></div>
									<span>{p.label}</span>
								</div>
							</td>
							{#each years as yr}
								<td class="px-4 py-2.5 text-right {p.values[yr] === 0 ? 'text-muted-foreground/30' : sel === yr ? 'font-semibold text-foreground' : 'text-muted-foreground'}">
									{p.values[yr] === 0 ? '—' : fmt(p.values[yr])}
								</td>
							{/each}
						</tr>
					{/each}
					<tr class="bg-slate-800/60 border-t-2 border-slate-600 font-bold">
						<td class="px-4 py-3 sticky left-0 bg-slate-800/60">Total Revenue</td>
						{#each years as yr}
							<td class="px-4 py-3 text-right {sel === yr ? 'text-white text-base' : 'text-muted-foreground'}">{fmt(sales[yr])}</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Key metrics note -->
	<Card class="p-5">
		<div class="flex items-start gap-3">
			<Info class="size-4 text-blue-400 shrink-0 mt-0.5" />
			<div class="text-sm text-muted-foreground space-y-1">
				<p><span class="font-semibold text-foreground">2026</span> — Foundation year. Net loss of $1.79M as operations launch. Gross margin 36.3%.</p>
				<p><span class="font-semibold text-foreground">2027</span> — First profitable year. $1.09M net profit on $21.4M revenue. Gross margin 45.0%.</p>
				<p><span class="font-semibold text-foreground">2028–2031</span> — Rapid scaling. Net margin grows from 17.3% to 48.6% as revenue reaches $189M.</p>
			</div>
		</div>
	</Card>

	<!-- ── Sensitivity Analysis ──────────────────────────────────────────────── -->
	<div>
		<div class="flex items-center gap-2 mb-4">
			<BarChart3 class="size-5 text-violet-400" />
			<h2 class="text-xl font-bold">Sensitivity Analysis</h2>
			<span class="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 ml-1">2031 Net Profit impact by scenario</span>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Revenue sensitivity -->
			<Card class="p-5">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Revenue Variance — 2031 Net Profit</h3>
				<div class="space-y-3">
					{#each [
						{ label: 'Bear  (−30%)', revMult: 0.70, cogsMult: 0.85, color: 'bg-red-500',    textColor: 'text-red-400' },
						{ label: 'Base  (plan)', revMult: 1.00, cogsMult: 1.00, color: 'bg-slate-500',  textColor: 'text-slate-300' },
						{ label: 'Bull  (+20%)', revMult: 1.20, cogsMult: 1.10, color: 'bg-emerald-500',textColor: 'text-emerald-400' },
						{ label: 'Bull+ (+40%)', revMult: 1.40, cogsMult: 1.20, color: 'bg-teal-400',   textColor: 'text-teal-300' },
					] as scenario}
						{@const adjRev  = sales[2031]  * scenario.revMult}
						{@const adjCogs = cogs[2031]   * scenario.cogsMult}
						{@const adjExp  = totalExpenses[2031] * (0.7 + scenario.revMult * 0.3)}
						{@const adjNet  = adjRev - adjCogs - adjExp + grossProfit(2031) * 0 }
						{@const scenNet = adjRev - adjCogs - (totalExpenses[2031] - cogs[2031]) * (0.85 + scenario.revMult * 0.15) - adjCogs + adjRev - adjRev}
						{@const simpleNet = (adjRev - adjCogs) - (salesMarketing[2031] + labor[2031] + generalAdmin[2031]) * (0.8 + scenario.revMult * 0.2)}
						<div class="flex items-center gap-3">
							<span class="w-28 text-xs text-slate-300 shrink-0">{scenario.label}</span>
							<div class="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
								<div class="{scenario.color} h-full rounded-full transition-all"
									style="width:{Math.min(100, Math.max(0, (simpleNet / 150_000_000) * 100)).toFixed(1)}%">
								</div>
							</div>
							<span class="w-24 text-right text-sm font-semibold shrink-0 {scenario.textColor}">{fmt(simpleNet)}</span>
						</div>
					{/each}
				</div>
				<p class="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-800">
					Bear assumes 30% revenue shortfall with partial cost reduction. Bull scenarios assume proportional opex scaling.
				</p>
			</Card>

			<!-- Key driver table -->
			<Card class="p-5">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Key Assumptions & Drivers</h3>
				<div class="space-y-0 divide-y divide-slate-800 text-sm">
					{#each [
						{ driver: 'Seed Raise',            assumption: '$7.5M — June 2026',         risk: 'low' },
						{ driver: 'Break-even Year',       assumption: '2027 ($1.09M net)',          risk: 'medium' },
						{ driver: 'Sponsorship Ramp',      assumption: 'Tier 1–4 + Presenting',      risk: 'medium' },
						{ driver: 'Fantasy / Gambling',    assumption: 'Live 2027, scale 2028+',     risk: 'high' },
						{ driver: 'Broadcasting Deal',     assumption: '$10M by 2030, $25M 2031',    risk: 'high' },
						{ driver: 'Gross Margin Target',   assumption: '45–55% from 2027 onward',    risk: 'low' },
						{ driver: 'No Second Raise',       assumption: 'Self-funded post-2026',      risk: 'low' },
						{ driver: 'Trading Cards (Brixton)',assumption: 'Rev-share licensing model', risk: 'medium' },
					] as row}
						{@const riskColor = row.risk === 'high' ? 'text-red-400 bg-red-950/40' : row.risk === 'medium' ? 'text-yellow-400 bg-yellow-950/40' : 'text-emerald-400 bg-emerald-950/40'}
						<div class="flex items-center gap-3 py-2">
							<span class="flex-1 text-slate-300">{row.driver}</span>
							<span class="text-xs text-slate-400 w-44 text-right shrink-0">{row.assumption}</span>
							<span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded {riskColor} shrink-0 w-14 text-center">{row.risk}</span>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</div>

	<!-- ── Cash Flow Flywheel ─────────────────────────────────────────────────── -->
	<div>
		<div class="flex items-center gap-2 mb-4">
			<TrendingUp class="size-5 text-emerald-400" />
			<h2 class="text-xl font-bold">Cash Flow Flywheel</h2>
			<span class="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 ml-1">How one raise funds everything</span>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Flywheel diagram -->
			<Card class="lg:col-span-2 p-5">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-5">Capital Deployment & Self-Funding Timeline</h3>
				<div class="space-y-4">
					{#each [
						{
							year: 2026,
							phase: 'Seed Raise & Launch',
							color: 'border-amber-500 bg-amber-950/20',
							badge: 'bg-amber-500',
							items: [
								{ label: 'Capital raised',     value: '$7.5M seed round' },
								{ label: 'Revenue',            value: fmt(sales[2026]) },
								{ label: 'Net position',       value: fmt(netProfit[2026]), neg: true },
								{ label: 'Use of funds',       value: 'Ops, tech, first season' },
							]
						},
						{
							year: 2027,
							phase: 'Revenue Positive',
							color: 'border-emerald-500 bg-emerald-950/20',
							badge: 'bg-emerald-500',
							items: [
								{ label: 'Revenue',            value: fmt(sales[2027]) },
								{ label: 'Net profit',         value: fmt(netProfit[2027]), pos: true },
								{ label: 'Gross margin',       value: fmtPct(grossMargin(2027)) },
								{ label: 'Milestone',          value: 'No further raise needed' },
							]
						},
						{
							year: 2031,
							phase: 'Full Scale',
							color: 'border-violet-500 bg-violet-950/20',
							badge: 'bg-violet-500',
							items: [
								{ label: 'Revenue',            value: fmt(sales[2031]) },
								{ label: 'Net profit',         value: fmt(netProfit[2031]), pos: true },
								{ label: 'Net margin',         value: fmtPct(netMargin(2031)) },
								{ label: 'Cumulative net',     value: '~$163M (2027–2031)' },
							]
						},
					] as stage}
						<div class="rounded-xl border-l-4 {stage.color} px-4 py-3">
							<div class="flex items-center gap-2 mb-2">
								<span class="size-5 rounded-full {stage.badge} text-white text-[10px] font-black flex items-center justify-center shrink-0">{stage.year.toString().slice(2)}</span>
								<span class="text-sm font-bold text-white">{stage.year} — {stage.phase}</span>
							</div>
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
								{#each stage.items as item}
									<div>
										<p class="text-[10px] text-slate-500 uppercase tracking-wide">{item.label}</p>
										<p class="text-xs font-semibold {item.pos ? 'text-emerald-400' : item.neg ? 'text-red-400' : 'text-slate-200'}">{item.value}</p>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<!-- Cumulative net profit bar -->
				<div class="mt-5 pt-4 border-t border-slate-800">
					<p class="text-xs text-slate-400 uppercase tracking-wide mb-3">Cumulative Net Profit Trajectory</p>
					<div class="space-y-2">
						{#each years as yr}
							{@const cumulative = years.filter(y => y <= yr).reduce((sum, y) => sum + netProfit[y], 0)}
							{@const maxCum = 163_000_000}
							<div class="flex items-center gap-3">
								<span class="text-xs text-slate-400 w-10 shrink-0">{yr}</span>
								<div class="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
									{#if cumulative >= 0}
										<div class="bg-emerald-500 h-full rounded-full" style="width:{Math.min(100,(cumulative/maxCum)*100).toFixed(1)}%"></div>
									{:else}
										<div class="bg-red-500 h-full rounded-full" style="width:{Math.min(100,(Math.abs(cumulative)/maxCum)*100).toFixed(1)}%"></div>
									{/if}
								</div>
								<span class="text-xs font-semibold w-20 text-right shrink-0 {cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmt(cumulative)}</span>
							</div>
						{/each}
					</div>
				</div>
			</Card>

			<!-- Investor statement -->
			<Card class="p-5 flex flex-col gap-4">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Investor Summary</h3>

				<div class="rounded-lg bg-slate-800/60 border border-slate-700 p-4 space-y-3 text-sm">
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">Ask</span>
						<span class="font-bold text-white text-base">$7,500,000</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">Structure</span>
						<span class="font-semibold text-slate-200">Equity / SAFE</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">Use of funds</span>
						<span class="font-semibold text-slate-200">Ops + Season 1</span>
					</div>
					<div class="border-t border-slate-700 pt-3 flex justify-between items-baseline">
						<span class="text-slate-400">Break-even</span>
						<span class="font-bold text-emerald-400">2027</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">5-yr net profit</span>
						<span class="font-bold text-emerald-400">{fmt(years.reduce((s,y) => s + netProfit[y], 0))}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">2031 revenue</span>
						<span class="font-bold text-white">{fmt(sales[2031])}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-slate-400">2031 net margin</span>
						<span class="font-bold text-emerald-400">{fmtPct(netMargin(2031))}</span>
					</div>
				</div>

				<div class="rounded-lg bg-violet-950/30 border border-violet-800/50 p-4 text-xs text-slate-300 space-y-2">
					<p class="font-semibold text-violet-300 uppercase tracking-wide text-[10px]">Why one raise is sufficient</p>
					<p>2026 revenue ($2.8M) plus the seed capital covers all launch costs. By mid-2027, league operations generate positive cash flow, eliminating the need for a Series A.</p>
					<p>Revenue diversification across 18 streams — sponsorship, media rights, fantasy, gambling, merchandise, and licensing — reduces single-stream concentration risk.</p>
				</div>

				<div class="rounded-lg bg-slate-800/40 border border-slate-700 p-4 text-xs text-slate-400">
					<p class="font-semibold text-slate-300 mb-1">Revenue streams active by year</p>
					<div class="space-y-1">
						<div class="flex justify-between"><span>2026</span><span class="text-slate-300 font-medium">6 streams</span></div>
						<div class="flex justify-between"><span>2027</span><span class="text-slate-300 font-medium">14 streams</span></div>
						<div class="flex justify-between"><span>2028+</span><span class="text-slate-300 font-medium">18 streams</span></div>
					</div>
				</div>
			</Card>
		</div>
	</div>

	<!-- ── Live vs Plan ─────────────────────────────────────────────────────── -->
	{#if live}
	<div>
		<div class="flex items-center gap-2 mb-4">
			<Activity class="size-5 text-emerald-400" />
			<h2 class="text-xl font-bold">Live Progress vs Plan</h2>
			<span class="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 ml-1">Pulled from departments · projects · sponsors</span>
		</div>

		<!-- Revenue vs Expense KPIs -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
			<Card class="p-4 bg-blue-950/40 border-blue-800/50">
				<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Budgeted Spend</p>
				<p class="text-xl font-bold text-blue-300">{fmtFull(live.totalBudgeted)}</p>
				<p class="text-xs text-slate-400 mt-1">across {live.departments.length} departments</p>
			</Card>

			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Actual Spend</p>
				<p class="text-xl font-bold text-slate-200">{fmtFull(live.totalActualExp)}</p>
				<div class="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
					<div class="h-full rounded-full bg-blue-500" style="width:{Math.min(100,(live.totalActualExp/2_813_129)*100).toFixed(1)}%"></div>
				</div>
				<p class="text-[10px] text-slate-500 mt-1">{Math.min(100,(live.totalActualExp/2_813_129)*100).toFixed(1)}% of 2026 plan</p>
			</Card>

			<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
				<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Sponsor Revenue Received</p>
				<p class="text-xl font-bold text-emerald-300">{fmtFull(live.totalReceivedRevenue)}</p>
				<div class="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
					<div class="h-full rounded-full bg-emerald-500" style="width:{Math.min(100,(live.totalReceivedRevenue/2_824_000)*100).toFixed(1)}%"></div>
				</div>
				<p class="text-[10px] text-slate-500 mt-1">{Math.min(100,(live.totalReceivedRevenue/2_824_000)*100).toFixed(1)}% of 2026 plan</p>
			</Card>

			<Card class="p-4 bg-yellow-950/40 border-yellow-800/50">
				<p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">Contracted Revenue</p>
				<p class="text-xl font-bold text-yellow-300">{fmtFull(live.totalContractedRevenue)}</p>
				<p class="text-xs text-slate-400 mt-1">{live.sponsorCount} active sponsor{live.sponsorCount !== 1 ? 's' : ''}</p>
			</Card>
		</div>

		<!-- Department spend vs budget bars -->
		<Card class="p-5 bg-slate-800/50 border-slate-700 mb-4">
			<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
				<Target class="size-4 text-slate-400" /> Department Spend vs Budget
			</h3>
			<div class="space-y-3">
				{#each live.departments as dept}
					{@const budget = dept.department_annual_budget || 0}
					{@const actual = dept.department_actual_expenses || 0}
					{@const pctUsed = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0}
					{@const barColor = pctUsed > 90 ? 'bg-red-500' : pctUsed > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}
					<div class="flex items-center gap-3">
						<div class="w-8 text-[10px] font-mono text-slate-500 shrink-0 text-right">{dept.code || '—'}</div>
						<div class="w-36 text-xs text-slate-300 shrink-0 truncate">{dept.name}</div>
						<div class="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
							<div class="h-full rounded-full transition-all {barColor}" style="width:{pctUsed.toFixed(1)}%"></div>
						</div>
						<div class="w-28 text-right text-xs text-slate-400 shrink-0">
							{fmtFull(actual)} <span class="text-slate-600">/ {fmtFull(budget)}</span>
						</div>
						<div class="w-10 text-right text-xs font-semibold shrink-0 {pctUsed > 90 ? 'text-red-400' : pctUsed > 70 ? 'text-yellow-400' : 'text-slate-400'}">
							{pctUsed.toFixed(0)}%
						</div>
					</div>
				{/each}
				{#if live.departments.length === 0}
					<p class="text-sm text-slate-500 text-center py-4">No department data yet — seed departments to see progress here.</p>
				{/if}
			</div>
		</Card>

		<!-- Project execution progress -->
		<Card class="p-5 bg-slate-800/50 border-slate-700">
			<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Project Execution</h3>
			{@const total = live.projectsByStatus.total || 1}
			<div class="flex items-center gap-3 mb-3">
				<div class="flex-1 flex h-4 rounded-full overflow-hidden bg-slate-700 gap-px">
					<div class="bg-emerald-500 transition-all" style="width:{((live.projectsByStatus.completed / total) * 100).toFixed(1)}%" title="Completed"></div>
					<div class="bg-blue-500 transition-all"    style="width:{((live.projectsByStatus.in_progress / total) * 100).toFixed(1)}%" title="In Progress"></div>
					<div class="bg-slate-500 transition-all"   style="width:{((live.projectsByStatus.planned / total) * 100).toFixed(1)}%" title="Planned"></div>
				</div>
				<span class="text-sm font-bold text-slate-200 shrink-0">{live.projectsByStatus.total} total</span>
			</div>
			<div class="flex gap-4 text-xs text-slate-400">
				<span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-emerald-500 inline-block"></span>Completed {live.projectsByStatus.completed}</span>
				<span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-blue-500 inline-block"></span>In Progress {live.projectsByStatus.in_progress}</span>
				<span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-slate-500 inline-block"></span>Planned {live.projectsByStatus.planned}</span>
			</div>
			<p class="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
				Data flows from Departments → Projects → Tasks → Expenses. As your team logs expenses and marks tasks complete, this section updates automatically.
			</p>
		</Card>
	</div>
	{/if}

</div>
