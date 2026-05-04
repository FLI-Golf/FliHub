<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DollarSign, Star, TrendingUp, Trophy, ArrowRight,
		CheckCircle2, Clock, AlertCircle, ChevronDown,
		Handshake, Building2, MapPin, Phone, Mail, Info
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const metrics         = $derived(data.metrics);
	const loiSponsors     = $derived(data.loiSponsors ?? []);
	const prospectSponsors = $derived(data.prospectSponsors ?? []);
	const franchiseInterest = $derived(data.franchiseInterest ?? []);
	const byTier          = $derived(data.byTier ?? {});
	const franchiseLeads  = $derived(data.franchiseLeads ?? []);

	let infoExpanded = $state(false);
	let expandedSponsor = $state<string | null>(null);

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtM(n: number) {
		return '$' + (n / 1_000_000).toFixed(1) + 'M';
	}

	const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; bar: string }> = {
		tier_1: { label: 'Tier 1 — Naming Rights',   color: 'text-blue-300',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   bar: 'bg-blue-500' },
		tier_2: { label: 'Tier 2 — League Partners', color: 'text-emerald-300',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
		tier_3: { label: 'Tier 3 — Event Vendors',   color: 'text-amber-300',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  bar: 'bg-amber-500' },
		tier_4: { label: 'Tier 4 — Growth',          color: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/30', bar: 'bg-violet-500' },
	};

	const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
		active:      { label: 'LOI Signed',    color: 'text-emerald-400', icon: CheckCircle2 },
		negotiating: { label: 'Negotiating',   color: 'text-amber-400',   icon: Clock },
		prospect:    { label: 'Prospect',      color: 'text-slate-400',   icon: AlertCircle },
		signed:      { label: 'Signed',        color: 'text-emerald-400', icon: CheckCircle2 },
	};

	function getTier(t: string) {
		return TIER_CONFIG[t] ?? { label: t, color: 'text-slate-300', bg: 'bg-slate-500/15', border: 'border-slate-500/30', bar: 'bg-slate-500' };
	}
	function getStatus(s: string) {
		return STATUS_CONFIG[s] ?? { label: s, color: 'text-slate-400', icon: Star };
	}

	// Seed raise target for context
	const SEED_RAISE = 7_500_000;
	const totalCommitted = $derived(metrics?.totalCommitted ?? 0);
	const raisePct = $derived(Math.min(100, (totalCommitted / SEED_RAISE) * 100));

	// Active leads (not lost/unqualified)
	const activeLeads = $derived(franchiseLeads.filter((l: any) => !['lost', 'unqualified'].includes(l.status)));
</script>

<svelte:head><title>Active Income — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
					<TrendingUp class="size-3" /> Sales Pipeline
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Active Income</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Sponsorship LOIs, franchise pipeline, and revenue committed toward the $7.5M seed raise.
			</p>
		</div>
		<Button href="/dashboard/sponsors" variant="outline" size="sm" class="gap-1.5 shrink-0">
			Sponsor Pipeline <ArrowRight class="size-3.5" />
		</Button>
	</div>

	<!-- Info card -->
	<button onclick={() => infoExpanded = !infoExpanded} class="w-full text-left group/info">
		<div class="rounded-xl border border-yellow-500/20 {infoExpanded ? 'bg-slate-800/80' : 'bg-slate-800/40'} hover:bg-slate-800/80 transition-colors px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div class="size-7 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
						<Info class="size-3.5 text-yellow-400" />
					</div>
					<p class="text-xs font-medium text-yellow-300">{infoExpanded ? 'About Active Income' : 'What is this page?'}</p>
				</div>
				<ChevronDown class="size-4 text-slate-500 group-hover/info:text-slate-300 transition-all duration-200 shrink-0 {infoExpanded ? 'rotate-180' : ''}" />
			</div>
			{#if infoExpanded}
				<div class="text-xs text-yellow-200/70 leading-relaxed mt-3 pl-9 space-y-2">
					<p>
						This page tracks the two active income streams that fund FLI Golf's path to launch: <span class="font-semibold text-yellow-300">sponsorship commitments</span> and the <span class="font-semibold text-yellow-300">franchise sales pipeline</span>. Sponsors who have signed Letters of Intent (LOIs) represent committed revenue that activates when the $7.5M seed round closes.
					</p>
					<p>
						The sales team's primary focus right now is converting prospects to LOIs and advancing LOI sponsors toward signed contracts. Every dollar committed here directly reduces the net capital required from investors and demonstrates market validation to the raise.
					</p>
					<p>
						Sponsors marked with franchise interest are tracked separately — they represent potential franchise owners who could convert their sponsorship into a $10M team purchase, which is a separate and significant revenue event.
					</p>
				</div>
			{/if}
		</div>
	</button>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-emerald-300/70 font-medium">LOI Sponsors</p>
					<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
						<CheckCircle2 class="size-3.5 text-emerald-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{metrics?.loiCount ?? 0}</p>
				<p class="text-xs text-emerald-300/60 mt-0.5">active + negotiating</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">LOI Breakdown</p>
					{#each loiSponsors as sp}
						{@const t = getTier(sp.tier)}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5 min-w-0">
								<span class="size-1.5 rounded-full shrink-0 {t.bar}"></span>
								<span class="text-slate-300 truncate text-xs">{sp.companyName}</span>
							</div>
							<span class="text-xs font-medium text-slate-400 shrink-0">{fmtM(sp.annualCommitment ?? 0)}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/30 hover:bg-blue-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-blue-300/70 font-medium">Total Committed</p>
					<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
						<DollarSign class="size-3.5 text-blue-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{fmtM(totalCommitted)}</p>
				<p class="text-xs text-blue-300/60 mt-0.5">{fmt(metrics?.totalPaid ?? 0)} paid to date</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-60 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-2">vs. $7.5M Raise</p>
					<div class="flex justify-between"><span class="text-slate-400">Committed</span><span class="font-medium">{fmt(totalCommitted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Raise target</span><span class="font-medium">{fmt(SEED_RAISE)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Negotiating</span><span class="font-medium text-amber-400">{fmt(metrics?.negotiatingValue ?? 0)}</span></div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full bg-blue-500" style="width:{raisePct.toFixed(0)}%"></div>
					</div>
					<p class="text-xs text-slate-400">{raisePct.toFixed(0)}% of raise covered by LOIs</p>
				</div>
			</div>
		</div>

		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/30 hover:bg-amber-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-amber-300/70 font-medium">Franchise Interest</p>
					<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
						<Trophy class="size-3.5 text-amber-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{franchiseInterest.length}</p>
				<p class="text-xs text-amber-300/60 mt-0.5">sponsors eyeing ownership</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-amber-400 mb-2">Franchise Prospects</p>
					{#each franchiseInterest as sp}
						<div class="flex justify-between text-xs">
							<span class="text-slate-300 truncate">{sp.companyName}</span>
							<span class="text-amber-400 shrink-0 ml-2">{sp.territory ?? '—'}</span>
						</div>
					{/each}
					<div class="h-px bg-slate-700 my-1"></div>
					<p class="text-xs text-slate-400">Each conversion = $10M franchise fee</p>
				</div>
			</div>
		</div>

		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-violet-500 bg-violet-950/30 hover:bg-violet-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-violet-300/70 font-medium">Franchise Leads</p>
					<div class="size-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
						<Handshake class="size-3.5 text-violet-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{activeLeads.length}</p>
				<p class="text-xs text-violet-300/60 mt-0.5">active in pipeline</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-violet-400 mb-2">Pipeline Stages</p>
					{#each ['new','contacted','qualified','converted'] as stage}
						{@const count = franchiseLeads.filter((l: any) => l.status === stage).length}
						{#if count > 0}
							<div class="flex justify-between text-xs">
								<span class="text-slate-400 capitalize">{stage}</span>
								<span class="font-medium">{count}</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Raise progress bar -->
	<Card class="p-5">
		<div class="flex items-center justify-between mb-2">
			<p class="text-sm font-bold">Sponsorship LOIs vs. $7.5M Seed Raise</p>
			<span class="text-xs text-muted-foreground">{raisePct.toFixed(0)}% covered</span>
		</div>
		<div class="h-3 rounded-full bg-slate-700 overflow-hidden mb-2">
			<div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all" style="width:{raisePct.toFixed(1)}%"></div>
		</div>
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			<span class="text-emerald-400 font-medium">{fmt(totalCommitted)} committed via LOIs</span>
			<span>{fmt(metrics?.negotiatingValue ?? 0)} negotiating</span>
			<span class="text-blue-400 font-medium">{fmt(SEED_RAISE)} target</span>
		</div>
	</Card>

	<!-- Main content -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- LOI Sponsors list -->
		<div class="lg:col-span-2 flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold">Letters of Intent — Active Sponsors</h2>
				<Button href="/dashboard/sponsors" variant="ghost" size="sm" class="gap-1 text-xs h-7">
					Full pipeline <ArrowRight class="size-3" />
				</Button>
			</div>

			{#each loiSponsors as sponsor, i (sponsor.id)}
				{@const tier = getTier(sponsor.tier)}
				{@const status = getStatus(sponsor.status)}
				{@const StatusIcon = status.icon}
				{@const rowEven = i % 2 === 0}
				<Card class="p-0 overflow-hidden border-l-4 {tier.border.replace('border-','border-l-')} {rowEven ? 'bg-slate-900' : 'bg-slate-800/60'}">
					<div class="p-4">
						<!-- Title row -->
						<div class="flex items-start justify-between gap-3 mb-2">
							<div class="flex items-center gap-2.5 min-w-0">
								<div class="size-9 rounded-lg {rowEven ? 'bg-slate-700' : 'bg-slate-700/80'} flex items-center justify-center shrink-0">
									<Building2 class="size-4 text-slate-300" />
								</div>
								<div class="min-w-0">
									<p class="text-sm font-bold leading-tight">{sponsor.companyName}</p>
									<div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
										<span class="text-[10px] font-bold px-1.5 py-0.5 rounded border {tier.bg} {tier.border} {tier.color}">{tier.label}</span>
										<span class="inline-flex items-center gap-0.5 text-[10px] {status.color}">
											<StatusIcon class="size-2.5" />{status.label}
										</span>
										{#if sponsor.franchiseInterest}
											<span class="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/15 border-amber-500/30 text-amber-300">
												🏆 Franchise Interest
											</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="text-right shrink-0">
								<p class="text-lg font-black text-white">{fmtM(sponsor.annualCommitment ?? 0)}</p>
								<p class="text-xs text-muted-foreground">annual commitment</p>
							</div>
						</div>

						<!-- Expandable contact details -->
						<button
							onclick={() => expandedSponsor = expandedSponsor === sponsor.id ? null : sponsor.id}
							class="w-full text-left group/sp"
						>
							<div class="flex items-center justify-between pt-2 border-t {rowEven ? 'border-slate-700/60' : 'border-slate-700/40'}">
								<div class="flex items-center gap-3 text-xs text-muted-foreground">
									{#if sponsor.location}
										<span class="flex items-center gap-1"><MapPin class="size-3" />{sponsor.location}</span>
									{/if}
									{#if sponsor.territory}
										<span class="text-slate-500">·</span>
										<span>{sponsor.territory} territory</span>
									{/if}
								</div>
								<ChevronDown class="size-3.5 text-slate-500 group-hover/sp:text-slate-300 transition-all duration-200 {expandedSponsor === sponsor.id ? 'rotate-180' : ''}" />
							</div>
						</button>

						{#if expandedSponsor === sponsor.id}
							<div class="mt-3 pt-3 border-t {rowEven ? 'border-slate-700/60' : 'border-slate-700/40'} space-y-2">
								{#if sponsor.primaryContactName}
									<p class="text-xs font-semibold text-slate-300">{sponsor.primaryContactName}</p>
								{/if}
								<div class="flex flex-wrap gap-3">
									{#if sponsor.primaryContactEmail}
										<a href="mailto:{sponsor.primaryContactEmail}" class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
											<Mail class="size-3" />{sponsor.primaryContactEmail}
										</a>
									{/if}
									{#if sponsor.primaryContactPhone}
										<a href="tel:{sponsor.primaryContactPhone}" class="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
											<Phone class="size-3" />{sponsor.primaryContactPhone}
										</a>
									{/if}
								</div>
								{#if sponsor.notes}
									<p class="text-xs text-muted-foreground leading-relaxed">{@html sponsor.notes}</p>
								{/if}
								<div class="pt-1">
									<Button href="/dashboard/sponsors/{sponsor.id}" variant="ghost" size="sm" class="h-6 text-xs px-2 gap-1">
										View full record <ArrowRight class="size-3" />
									</Button>
								</div>
							</div>
						{/if}
					</div>
				</Card>
			{/each}

			<!-- Prospects -->
			{#if prospectSponsors.length > 0}
				<div class="mt-2">
					<h2 class="text-sm font-bold mb-3 text-muted-foreground">Prospects — Not Yet Committed</h2>
					{#each prospectSponsors as sponsor (sponsor.id)}
						{@const tier = getTier(sponsor.tier)}
						<Card class="p-4 mb-2 border-l-4 border-l-slate-600 bg-slate-800/40">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2.5">
									<div class="size-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
										<Building2 class="size-3.5 text-slate-400" />
									</div>
									<div>
										<p class="text-sm font-medium text-slate-300">{sponsor.companyName}</p>
										<div class="flex items-center gap-1.5 mt-0.5">
											<span class="text-[10px] px-1.5 py-0.5 rounded border {tier.bg} {tier.border} {tier.color}">{tier.label}</span>
											{#if sponsor.territory}<span class="text-[10px] text-muted-foreground">{sponsor.territory}</span>{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-bold text-slate-400">{fmtM(sponsor.annualCommitment ?? 0)}</p>
									<p class="text-[10px] text-muted-foreground">target value</p>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right sidebar -->
		<div class="flex flex-col gap-4">

			<!-- Tier breakdown -->
			<div>
				<h2 class="text-sm font-bold mb-3">Committed by Tier</h2>
				<Card class="p-4 space-y-3">
					{#each Object.entries(byTier).sort() as [tier, data]}
						{@const t = getTier(tier)}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="{t.color} font-medium">{t.label}</span>
								<span class="font-bold tabular-nums">{fmtM((data as any).committed)}</span>
							</div>
							<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
								<div class="h-full rounded-full {t.bar}" style="width:{Math.min(100,((data as any).committed / (metrics?.totalCommitted || 1)) * 100).toFixed(0)}%"></div>
							</div>
							<p class="text-[10px] text-muted-foreground">{(data as any).count} sponsor{(data as any).count !== 1 ? 's' : ''} · {fmt((data as any).paid)} paid</p>
						</div>
					{/each}
				</Card>
			</div>

			<!-- Sales actions -->
			<div>
				<h2 class="text-sm font-bold mb-3">Sales Actions</h2>
				<Card class="p-4 space-y-2">
					{#each [
						{ label: 'Sponsor Pipeline', href: '/dashboard/sponsors', icon: Star, desc: 'Manage all sponsor stages' },
						{ label: 'Franchise Sales', href: '/dashboard/sales', icon: TrendingUp, desc: 'Advance franchise leads' },
						{ label: 'Sponsorship Revenue', href: '/dashboard/sponsorship-revenue', icon: DollarSign, desc: 'Revenue projections by tier' },
						{ label: 'Territories', href: '/dashboard/territories', icon: MapPin, desc: 'Available franchise markets' },
					] as link}
						{@const LinkIcon = link.icon}
						<a href={link.href} class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors group">
							<div class="size-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-600 transition-colors">
								<LinkIcon class="size-3.5 text-slate-300" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs font-medium">{link.label}</p>
								<p class="text-[10px] text-muted-foreground">{link.desc}</p>
							</div>
							<ArrowRight class="size-3 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
						</a>
					{/each}
				</Card>
			</div>

			<!-- Franchise interest callout -->
			{#if franchiseInterest.length > 0}
				<div>
					<h2 class="text-sm font-bold mb-3">Franchise Conversion Targets</h2>
					<Card class="p-4 space-y-3">
						<p class="text-xs text-muted-foreground">These sponsors have flagged franchise interest — each represents a potential $10M team purchase.</p>
						{#each franchiseInterest as sp}
							<div class="flex items-center justify-between text-xs">
								<div>
									<p class="font-medium text-slate-200">{sp.companyName}</p>
									<p class="text-muted-foreground">{sp.territory ?? '—'} · {getTier(sp.tier).label}</p>
								</div>
								<a href="/dashboard/sponsors/{sp.id}" class="text-amber-400 hover:underline shrink-0 ml-2">
									<ArrowRight class="size-3.5" />
								</a>
							</div>
						{/each}
					</Card>
				</div>
			{/if}

		</div>
	</div>

</div>
