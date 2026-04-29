<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { TrendingUp, TrendingDown, DollarSign, BarChart3, Info, ChevronRight } from 'lucide-svelte';

	// ── P&L data from financial projections spreadsheet ───────────────────────
	const years = [2026, 2027, 2028, 2029, 2030, 2031];

	const sales: Record<number, number> = {
		2026: 2_824_000, 2027: 21_546_200, 2028: 35_370_500,
		2029: 63_512_250, 2030: 114_180_625, 2031: 183_721_144
	};
	const cogs: Record<number, number> = {
		2026: 1_800_000, 2027: 11_765_000, 2028: 14_760_000,
		2029: 23_511_018, 2030: 38_271_105, 2031: 58_751_861
	};
	const grossProfit = (yr: number) => sales[yr] - cogs[yr];
	const grossMargin = (yr: number) => sales[yr] > 0 ? (grossProfit(yr) / sales[yr]) * 100 : 0;

	const salesMarketing: Record<number, number> = {
		2026: 709_167, 2027: 3_081_850, 2028: 3_841_200,
		2029: 10_377_700, 2030: 19_246_500, 2031: 29_021_000
	};
	const labor: Record<number, number> = {
		2026: 804_330, 2027: 1_831_182, 2028: 2_158_914,
		2029: 2_946_505, 2030: 4_270_206, 2031: 6_202_747
	};
	const generalAdmin: Record<number, number> = {
		2026: 1_299_633, 2027: 3_627_576, 2028: 4_024_200,
		2029: 4_758_500, 2030: 7_397_000, 2031: 11_524_000
	};
	const totalExpenses: Record<number, number> = {
		2026: 2_813_129, 2027: 8_540_608, 2028: 10_024_314,
		2029: 18_082_705, 2030: 30_913_706, 2031: 46_747_747
	};
	const netProfit: Record<number, number> = {
		2026: -1_789_129, 2027: 1_240_592, 2028: 10_586_187,
		2029: 21_918_528, 2030: 44_995_814, 2031: 78_221_536
	};
	const netMargin = (yr: number) => sales[yr] > 0 ? (netProfit[yr] / sales[yr]) * 100 : 0;

	// ── Revenue by product (from spreadsheet) ────────────────────────────────
	const products: { label: string; values: Record<number, number>; color: string }[] = [
		{ label: 'Ticket Revenue',        color: 'bg-blue-500',    values: { 2026: 0, 2027: 3_000_000, 2028: 3_450_000, 2029: 3_967_500, 2030: 4_562_625, 2031: 5_247_019 } },
		{ label: 'Sponsorships',          color: 'bg-emerald-500', values: { 2026: 0, 2027: 6_275_000, 2028: 7_572_500, 2029: 10_782_500, 2030: 18_800_000, 2031: 23_362_500 } },
		{ label: 'Bags',                  color: 'bg-amber-500',   values: { 2026: 52_000, 2027: 104_000, 2028: 156_000, 2029: 260_000, 2030: 325_000, 2031: 341_250 } },
		{ label: 'Disc',                  color: 'bg-orange-500',  values: { 2026: 30_000, 2027: 90_000, 2028: 150_000, 2029: 236_250, 2030: 337_500, 2031: 412_500 } },
		{ label: 'Podcast Subscriptions', color: 'bg-cyan-500',    values: { 2026: 238_000, 2027: 955_200, 2028: 2_388_000, 2029: 4_776_000, 2030: 8_358_000, 2031: 11_940_000 } },
		{ label: 'Sports Apparel',        color: 'bg-violet-500',  values: { 2026: 1_020_000, 2027: 3_060_000, 2028: 4_590_000, 2029: 6_120_000, 2030: 8_160_000, 2031: 10_200_000 } },
		{ label: 'League Team Jerseys',   color: 'bg-pink-500',    values: { 2026: 1_034_000, 2027: 3_102_000, 2028: 6_204_000, 2029: 10_340_000, 2030: 15_510_000, 2031: 23_265_000 } },
		{ label: 'Fantasy League Fees',   color: 'bg-indigo-500',  values: { 2026: 0, 2027: 356_000, 2028: 1_100_000, 2029: 3_640_000, 2030: 9_380_000, 2031: 19_125_000 } },
		{ label: 'Trading Cards',         color: 'bg-rose-500',    values: { 2026: 250_000, 2027: 1_350_000, 2028: 2_900_000, 2029: 5_150_000, 2030: 7_467_500, 2031: 10_827_875 } },
		{ label: 'Gambling',              color: 'bg-red-500',     values: { 2026: 0, 2027: 2_000_000, 2028: 3_460_000, 2029: 8_640_000, 2030: 17_280_000, 2031: 28_800_000 } },
		{ label: 'Broadcasting/Streaming',color: 'bg-teal-500',    values: { 2026: 0, 2027: 500_000, 2028: 1_000_000, 2029: 3_000_000, 2030: 10_000_000, 2031: 25_000_000 } },
		{ label: 'Bag Licensing',         color: 'bg-lime-500',    values: { 2026: 100_000, 2027: 104_000, 2028: 600_000, 2029: 800_000, 2030: 1_000_000, 2031: 1_000_000 } },
		{ label: 'Disc Licensing',        color: 'bg-yellow-500',  values: { 2026: 100_000, 2027: 350_000, 2028: 600_000, 2029: 800_000, 2030: 1_000_000, 2031: 1_200_000 } },
		{ label: 'General League Licensing', color: 'bg-fuchsia-500', values: { 2026: 0, 2027: 300_000, 2028: 1_200_000, 2029: 5_000_000, 2030: 12_000_000, 2031: 23_000_000 } }
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
				<p><span class="font-semibold text-foreground">2026</span> — Foundation year. Net loss of $1.79M as operations launch. Gross margin 36.26%.</p>
				<p><span class="font-semibold text-foreground">2027</span> — First profitable year. $1.24M net profit on $21.5M revenue. Gross margin 45.40%.</p>
				<p><span class="font-semibold text-foreground">2028–2031</span> — Rapid scaling. Net margin grows from 29.93% to 42.58% as revenue reaches $183.7M.</p>
			</div>
		</div>
	</Card>

</div>
