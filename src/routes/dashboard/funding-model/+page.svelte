<script lang="ts">
	import type { PageData } from './$types';
	import {
		DollarSign,
		TrendingUp,
		TrendingDown,
		Trophy,
		Users,
		Cpu,
		Scale,
		Megaphone,
		Wallet,
		ShieldCheck,
		Landmark,
		Ticket,
		ShoppingBag,
		Zap,
		Package,
		ArrowDown,
		ArrowUp,
		Info
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const model = $derived(data.models?.[0]);
	const c = $derived(model?.computed);

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

	const pct = (n: number, total: number) =>
		total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%';
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span
					class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded"
				>
					Internal Use Only
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">FGL 2027 Funding Model</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Full season capital requirement, pre-season revenue waterfall, and capital stack
			</p>
		</div>
		{#if model}
			<div class="text-right">
				<p class="text-xs text-muted-foreground">Season</p>
				<p class="text-3xl font-black text-foreground">{model.season}</p>
			</div>
		{/if}
	</div>

	{#if !model}
		<div class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
			<DollarSign class="size-10 mx-auto mb-3 opacity-30" />
			<p class="font-medium">No funding model data found.</p>
			<p class="text-sm mt-1">Run the migration script to seed the 2027 model.</p>
		</div>
	{:else}
		<!-- Top-line KPIs -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="rounded-xl border bg-card p-5 space-y-1">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Total Cash Required
				</p>
				<p class="text-2xl font-black text-foreground">{fmtM(c.totalCashRequired)}</p>
				<p class="text-xs text-muted-foreground">Full 2027 season</p>
			</div>
			<div class="rounded-xl border bg-card p-5 space-y-1">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Pre-Season Revenue
				</p>
				<p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
					{fmtM(c.totalPreSeasonRevenue)}
				</p>
				<p class="text-xs text-muted-foreground">
					{c.preSeason_pct.toFixed(1)}% of total need self-funded
				</p>
			</div>
			<div class="rounded-xl border bg-card p-5 space-y-1">
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Remaining Gap
				</p>
				<p class="text-2xl font-black text-amber-600 dark:text-amber-400">
					{fmtM(c.fundingGap)}
				</p>
				<p class="text-xs text-muted-foreground">Second capital layer needed</p>
			</div>
			<div
				class="rounded-xl border bg-card p-5 space-y-1 {c.capitalCoverage >= 0
					? 'border-emerald-200 dark:border-emerald-800'
					: 'border-rose-200 dark:border-rose-800'}"
			>
				<p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Capital Coverage
				</p>
				<p
					class="text-2xl font-black {c.capitalCoverage >= 0
						? 'text-emerald-600 dark:text-emerald-400'
						: 'text-rose-600 dark:text-rose-400'}"
				>
					{c.capitalCoverage >= 0 ? '+' : ''}{fmtM(c.capitalCoverage)}
				</p>
				<p class="text-xs text-muted-foreground">
					{c.capitalCoverage >= 0 ? 'Cushion above gap' : 'Shortfall vs gap'}
				</p>
			</div>
		</div>

		<!-- Two-column: Expense Stack + Revenue Waterfall -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Expense Stack -->
			<div class="rounded-xl border bg-card">
				<div class="px-5 py-4 border-b flex items-center gap-2">
					<TrendingDown class="size-4 text-rose-500" />
					<h2 class="font-semibold text-sm">2027 Expense Stack</h2>
				</div>
				<div class="p-5 space-y-3">
					<!-- Tournament Ops -->
					<div class="space-y-1.5">
						<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Tournament Operations
						</p>
						<div class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
							<div class="flex items-center gap-2">
								<Trophy class="size-4 text-violet-500 shrink-0" />
								<div>
									<p class="text-sm font-medium">Event Operations</p>
									<p class="text-xs text-muted-foreground">
										{model.tournament_count} events × {fmt(model.tournament_ops_per_event)}
									</p>
								</div>
							</div>
							<p class="text-sm font-bold">{fmtM(c.tournamentOpsTotal)}</p>
						</div>
						<div class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
							<div class="flex items-center gap-2">
								<DollarSign class="size-4 text-emerald-500 shrink-0" />
								<div>
									<p class="text-sm font-medium">Player Purse</p>
									<p class="text-xs text-muted-foreground">Total prize pool</p>
								</div>
							</div>
							<p class="text-sm font-bold">{fmtM(model.player_purse)}</p>
						</div>
						<div class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
							<div class="flex items-center gap-2">
								<Users class="size-4 text-blue-500 shrink-0" />
								<div>
									<p class="text-sm font-medium">Player Sponsorship Program</p>
									<p class="text-xs text-muted-foreground">Individual player deals</p>
								</div>
							</div>
							<p class="text-sm font-bold">{fmtM(model.player_sponsorship_program)}</p>
						</div>
					</div>

					<!-- League Overhead -->
					<div class="space-y-1.5">
						<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							League Overhead
						</p>
						{#each [
							{ label: 'Marketing & National Promotion', val: model.overhead_marketing, icon: Megaphone, color: 'text-orange-500' },
							{ label: 'Staff / Executive / Admin Payroll', val: model.overhead_staff_payroll, icon: Users, color: 'text-blue-500' },
							{ label: 'Tech / App / Platform / Website', val: model.overhead_tech_platform, icon: Cpu, color: 'text-cyan-500' },
							{ label: 'Legal / Accounting / Insurance / Admin', val: model.overhead_legal_admin, icon: Scale, color: 'text-slate-500' }
						] as item}
							<div class="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
								<div class="flex items-center gap-2">
									<item.icon class="size-4 {item.color} shrink-0" />
									<p class="text-sm font-medium">{item.label}</p>
								</div>
								<p class="text-sm font-bold">{fmtM(item.val)}</p>
							</div>
						{/each}
					</div>

					<!-- Total -->
					<div
						class="flex items-center justify-between py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 mt-2"
					>
						<p class="font-bold text-sm text-rose-700 dark:text-rose-300">Total 2027 Cash Need</p>
						<p class="font-black text-lg text-rose-700 dark:text-rose-300">
							{fmtM(c.totalCashRequired)}
						</p>
					</div>
				</div>
			</div>

			<!-- Revenue Waterfall -->
			<div class="rounded-xl border bg-card">
				<div class="px-5 py-4 border-b flex items-center gap-2">
					<TrendingUp class="size-4 text-emerald-500" />
					<h2 class="font-semibold text-sm">Pre-Season Revenue Waterfall</h2>
				</div>
				<div class="p-5 space-y-3">
					<!-- Starting point -->
					<div
						class="flex items-center justify-between py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"
					>
						<p class="font-bold text-sm text-rose-700 dark:text-rose-300">Total Cash Required</p>
						<p class="font-black text-lg text-rose-700 dark:text-rose-300">
							{fmtM(c.totalCashRequired)}
						</p>
					</div>

					<!-- Sponsorship block -->
					<div class="space-y-1.5">
						<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Sponsorship Revenue — {fmtM(c.sponsorshipRevenue)}
						</p>
						{#each [
							{ label: 'Tournament Naming Rights', val: model.rev_naming_rights, icon: Trophy },
							{ label: 'League Partners', val: model.rev_league_partners, icon: Landmark },
							{ label: 'On-Course / Activation / Vendor', val: model.rev_on_course_activation, icon: Zap },
							{ label: 'Fan Interaction / Grab Bag', val: model.rev_fan_interaction, icon: Users }
						] as item}
							<div
								class="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20"
							>
								<div class="flex items-center gap-2">
									<ArrowDown class="size-3 text-emerald-500 shrink-0" />
									<item.icon class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
									<p class="text-sm">{item.label}</p>
								</div>
								<p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
									-{fmtM(item.val)}
								</p>
							</div>
						{/each}
					</div>

					<!-- Other revenue -->
					<div class="space-y-1.5">
						<p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Other Pre-Season Revenue
						</p>
						{#each [
							{ label: 'Ticket Pre-Sales', val: model.rev_ticket_presales, icon: Ticket },
							{ label: 'Merchandise / Early Drops', val: model.rev_merchandise, icon: ShoppingBag },
							{ label: 'Subscriptions / Fantasy / Platform', val: model.rev_subscriptions_fantasy, icon: Cpu },
							{ label: 'Licensing Advances', val: model.rev_licensing_advances, icon: Package }
						] as item}
							<div
								class="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20"
							>
								<div class="flex items-center gap-2">
									<ArrowDown class="size-3 text-emerald-500 shrink-0" />
									<item.icon class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
									<p class="text-sm">{item.label}</p>
								</div>
								<p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
									-{fmtM(item.val)}
								</p>
							</div>
						{/each}
					</div>

					<!-- Pre-season subtotal -->
					<div
						class="flex items-center justify-between py-2 px-4 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
					>
						<p class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
							Total Pre-Season Cash In
						</p>
						<p class="font-bold text-emerald-700 dark:text-emerald-300">
							-{fmtM(c.totalPreSeasonRevenue)}
						</p>
					</div>

					<!-- Remaining gap -->
					<div
						class="flex items-center justify-between py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
					>
						<div>
							<p class="font-bold text-sm text-amber-700 dark:text-amber-300">Remaining Funding Gap</p>
							<p class="text-xs text-amber-600 dark:text-amber-400">Second capital layer required</p>
						</div>
						<p class="font-black text-xl text-amber-700 dark:text-amber-300">
							{fmtM(c.fundingGap)}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Capital Stack -->
		<div class="rounded-xl border bg-card">
			<div class="px-5 py-4 border-b flex items-center gap-2">
				<Wallet class="size-4 text-blue-500" />
				<h2 class="font-semibold text-sm">Capital Stack</h2>
			</div>
			<div class="p-5">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<!-- Raise 1 -->
					<div class="rounded-xl border bg-muted/30 p-4 space-y-2">
						<div class="flex items-center gap-2">
							<div
								class="size-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center"
							>
								<span class="text-xs font-black text-blue-600 dark:text-blue-400">1</span>
							</div>
							<p class="text-sm font-semibold">First Raise</p>
						</div>
						<p class="text-2xl font-black text-blue-600 dark:text-blue-400">
							{fmtM(model.capital_raise_1)}
						</p>
						<p class="text-xs text-muted-foreground">
							Builds the company and revenue engines in 2026. Covers pre-season infrastructure,
							staffing, tech, and marketing build.
						</p>
					</div>

					<!-- Raise 2 Equity -->
					<div class="rounded-xl border bg-muted/30 p-4 space-y-2">
						<div class="flex items-center gap-2">
							<div
								class="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center"
							>
								<span class="text-xs font-black text-violet-600 dark:text-violet-400">2E</span>
							</div>
							<p class="text-sm font-semibold">Second Raise — Equity</p>
						</div>
						<p class="text-2xl font-black text-violet-600 dark:text-violet-400">
							{fmtM(model.capital_raise_2_equity)}
						</p>
						<p class="text-xs text-muted-foreground">
							Equity portion of the second capital layer. Reduces dilution vs. a full equity raise.
						</p>
					</div>

					<!-- Raise 2 Debt -->
					<div class="rounded-xl border bg-muted/30 p-4 space-y-2">
						<div class="flex items-center gap-2">
							<div
								class="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
							>
								<span class="text-xs font-black text-slate-600 dark:text-slate-300">2D</span>
							</div>
							<p class="text-sm font-semibold">Second Raise — Debt / LOC</p>
						</div>
						<p class="text-2xl font-black text-slate-600 dark:text-slate-300">
							{fmtM(model.capital_raise_2_debt)}
						</p>
						<p class="text-xs text-muted-foreground">
							Line of credit or loan facility. Requires signed sponsorship contracts and ticketing
							velocity to secure on favorable terms.
						</p>
					</div>
				</div>

				<!-- Capital vs Gap summary -->
				<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
					<div class="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
						<p class="text-sm text-muted-foreground">Total Capital Raised</p>
						<p class="font-bold">{fmtM(c.totalCapitalRaised)}</p>
					</div>
					<div class="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
						<p class="text-sm text-muted-foreground">Funding Gap</p>
						<p class="font-bold text-amber-600 dark:text-amber-400">{fmtM(c.fundingGap)}</p>
					</div>
					<div
						class="rounded-lg px-4 py-3 flex items-center justify-between {c.capitalCoverage >= 0
							? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
							: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800'}"
					>
						<p
							class="text-sm font-medium {c.capitalCoverage >= 0
								? 'text-emerald-700 dark:text-emerald-300'
								: 'text-rose-700 dark:text-rose-300'}"
						>
							{c.capitalCoverage >= 0 ? 'Cushion' : 'Shortfall'}
						</p>
						<p
							class="font-bold {c.capitalCoverage >= 0
								? 'text-emerald-700 dark:text-emerald-300'
								: 'text-rose-700 dark:text-rose-300'}"
						>
							{c.capitalCoverage >= 0 ? '+' : ''}{fmtM(c.capitalCoverage)}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Cash Flow Timeline -->
		<div class="rounded-xl border bg-card">
			<div class="px-5 py-4 border-b flex items-center gap-2">
				<TrendingUp class="size-4 text-blue-500" />
				<h2 class="font-semibold text-sm">Cash Flow Timeline</h2>
			</div>
			<div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each [
					{
						period: 'Jan – Mar',
						label: 'Build Phase',
						color: 'blue',
						ins: ['First sponsor payments', 'Licensing advances', 'Early merch revenue'],
						outs: ['Staffing', 'Marketing build', 'Tech development', 'Event deposits']
					},
					{
						period: 'Apr – May',
						label: 'Pre-Launch',
						color: 'violet',
						ins: ['Ticket pre-sales', 'Remaining sponsor installments', 'Subscription / fantasy launch'],
						outs: ['Production retainers', 'Venue commitments', 'Player sponsorship obligations', 'Operational expansion']
					},
					{
						period: 'Jun – Aug',
						label: 'Season (Heavy Draw)',
						color: 'rose',
						ins: [],
						outs: ['Purse commitments', 'Event operating expenses', 'Travel', 'Production', 'Staffing']
					},
					{
						period: 'Sep – Dec',
						label: 'Post-Season',
						color: 'emerald',
						ins: ['Remaining ticket revenue', 'Merch spikes', 'Renewal conversations', 'Post-season content monetization'],
						outs: []
					}
				] as phase}
					<div class="rounded-xl border bg-muted/20 p-4 space-y-3">
						<div>
							<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground">
								{phase.period}
							</p>
							<p class="font-semibold text-sm mt-0.5">{phase.label}</p>
						</div>
						{#if phase.ins.length > 0}
							<div class="space-y-1">
								<p class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
									Cash In
								</p>
								{#each phase.ins as item}
									<div class="flex items-start gap-1.5">
										<ArrowUp class="size-3 text-emerald-500 mt-0.5 shrink-0" />
										<p class="text-xs text-muted-foreground">{item}</p>
									</div>
								{/each}
							</div>
						{/if}
						{#if phase.outs.length > 0}
							<div class="space-y-1">
								<p class="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
									Cash Out
								</p>
								{#each phase.outs as item}
									<div class="flex items-start gap-1.5">
										<ArrowDown class="size-3 text-rose-500 mt-0.5 shrink-0" />
										<p class="text-xs text-muted-foreground">{item}</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Investor Narrative -->
		<div class="rounded-xl border bg-card">
			<div class="px-5 py-4 border-b flex items-center gap-2">
				<Info class="size-4 text-slate-500" />
				<h2 class="font-semibold text-sm">Investor Narrative</h2>
			</div>
			<div class="p-5 space-y-4">
				<blockquote
					class="border-l-4 border-blue-400 pl-4 text-sm text-muted-foreground italic leading-relaxed"
				>
					"The first {fmtM(model.capital_raise_1)} raise builds the company and revenue engines in
					2026. The second capital layer funds the actual launch season in 2027. Because FLI
					generates meaningful pre-season revenue ({fmtM(c.totalPreSeasonRevenue)}), the second layer
					is smaller than the full season cost — but still significant due to purse size and
					launch-year operating expenses."
				</blockquote>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
					{#each [
						{
							option: 'A',
							title: 'Full Equity Round',
							range: '$6M – $7M',
							desc: 'Covers the modeled gap with cushion for overruns, delayed sponsor payments, or slower pre-sales. Cleanest option for a true first season.',
							recommended: false
						},
						{
							option: 'B',
							title: 'Blended Structure',
							range: `${fmtM(model.capital_raise_2_equity)} equity + ${fmtM(model.capital_raise_2_debt)} LOC`,
							desc: 'Strongest story if you want to reduce dilution. Equity covers core gap; debt facility handles timing mismatches.',
							recommended: true
						},
						{
							option: 'C',
							title: 'Fully Debt-Backed',
							range: 'Possible in theory',
							desc: 'Requires signed sponsorship contracts, proven ticketing velocity, and strong repayment visibility. Harder to secure on favorable terms for a first season.',
							recommended: false
						}
					] as opt}
						<div
							class="rounded-xl border p-4 space-y-2 {opt.recommended
								? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
								: 'bg-muted/20'}"
						>
							<div class="flex items-center gap-2">
								<span
									class="size-6 rounded-full flex items-center justify-center text-xs font-black {opt.recommended
										? 'bg-emerald-500 text-white'
										: 'bg-muted text-muted-foreground'}"
								>
									{opt.option}
								</span>
								<p class="font-semibold text-sm">{opt.title}</p>
								{#if opt.recommended}
									<span
										class="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
										>Preferred</span
									>
								{/if}
							</div>
							<p class="text-sm font-bold text-foreground">{opt.range}</p>
							<p class="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
