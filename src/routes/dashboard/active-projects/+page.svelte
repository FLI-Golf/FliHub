<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Zap, FolderKanban, DollarSign, CheckCircle2, Clock,
		ArrowRight, Users, Star, Trophy, Building2,
		Film, Scale, Handshake, Cpu, TrendingUp, ExternalLink,
		ChevronDown
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const projects = $derived(data.projects ?? []);
	const sponsorSummary = $derived(data.sponsorSummary ?? { total: 0, committed: 0, totalCommitted: 0, totalPaid: 0, inPipeline: 0 });
	const franchiseSummary = $derived(data.franchiseSummary ?? { total: 0, recent: [] });

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		return '$' + (n / 1_000_000).toFixed(1) + 'M';
	}
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}

	// Map project names to relevant hub links
	const PROJECT_LINKS: Record<string, { label: string; href: string; icon: any }[]> = {
		'Franchise Dev & Legal': [
			{ label: 'Franchise Sales', href: '/dashboard/sales', icon: TrendingUp },
			{ label: 'Franchises', href: '/dashboard/franchises', icon: Trophy },
			{ label: 'Territories', href: '/dashboard/territories', icon: Building2 },
		],
		'Sponsor Outreach': [
			{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star },
			{ label: 'Sponsorship Revenue', href: '/dashboard/sponsorship-revenue', icon: DollarSign },
		],
		'Tech & Data Platform': [
			{ label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
			{ label: 'Vendors', href: '/dashboard/vendors', icon: Handshake },
		],
		'App & Platform Development': [
			{ label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
			{ label: 'Vendors', href: '/dashboard/vendors', icon: Handshake },
		],
		'Legal Services': [
			{ label: 'Trademark Pipeline', href: '/dashboard/trademarks', icon: Scale },
			{ label: 'Legal Budget', href: '/dashboard/legal-budget', icon: DollarSign },
		],
		'Documentary & Sizzle Reel': [
			{ label: 'Media', href: '/dashboard/media', icon: Film },
			{ label: 'Streaming & Media', href: '/dashboard/streaming-media', icon: Film },
		],
		'Go Throw Media Partnership': [
			{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star },
			{ label: 'Media', href: '/dashboard/media', icon: Film },
		],
	};

	// Color per project for visual distinction
	const PROJECT_COLORS: Record<string, { border: string; badge: string; bar: string; icon: any }> = {
		'Franchise Dev & Legal':      { border: 'border-l-violet-500', badge: 'bg-violet-500/15 text-violet-300', bar: 'bg-violet-500', icon: Trophy },
		'Sponsor Outreach':           { border: 'border-l-amber-500',  badge: 'bg-amber-500/15 text-amber-300',  bar: 'bg-amber-500',  icon: Star },
		'Tech & Data Platform':       { border: 'border-l-cyan-500',   badge: 'bg-cyan-500/15 text-cyan-300',    bar: 'bg-cyan-500',   icon: Cpu },
		'App & Platform Development': { border: 'border-l-blue-500',   badge: 'bg-blue-500/15 text-blue-300',    bar: 'bg-blue-500',   icon: Cpu },
		'Legal Services':             { border: 'border-l-rose-500',   badge: 'bg-rose-500/15 text-rose-300',    bar: 'bg-rose-500',   icon: Scale },
		'Documentary & Sizzle Reel':  { border: 'border-l-pink-500',   badge: 'bg-pink-500/15 text-pink-300',    bar: 'bg-pink-500',   icon: Film },
		'Go Throw Media Partnership': { border: 'border-l-emerald-500',badge: 'bg-emerald-500/15 text-emerald-300', bar: 'bg-emerald-500', icon: Handshake },
	};

	function getColor(name: string) {
		return PROJECT_COLORS[name] ?? { border: 'border-l-slate-500', badge: 'bg-slate-500/15 text-slate-300', bar: 'bg-slate-500', icon: FolderKanban };
	}

	let expandedDesc = $state<Record<string, boolean>>({});
	let headerExpanded = $state(false);

	const totalBudget   = $derived(projects.reduce((s, p) => s + p.budget, 0));
	const totalSpend    = $derived(projects.reduce((s, p) => s + p.actualSpend, 0));
	const totalTasks    = $derived(projects.reduce((s, p) => s + p.tasks.total, 0));
	const totalDone     = $derived(projects.reduce((s, p) => s + p.tasks.done, 0));
</script>

<svelte:head><title>Active Projects — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
					<Zap class="size-3" /> Phase 1 · Pre-Raise
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Active Projects</h1>
			<button
				onclick={() => headerExpanded = !headerExpanded}
				class="group/hdr text-left mt-1"
			>
				<p class="text-sm text-muted-foreground {headerExpanded ? '' : 'line-clamp-1'}">
					{projects.length} projects in flight right now — everything else is planned for post-raise execution.
					These represent the pre-raise workstreams: platform and app development, franchise and legal groundwork,
					sponsor outreach, documentary content, and key media partnerships. Once the $7.5M seed round closes,
					the remaining 22 planned projects activate across event production, player contracts, broadcast
					infrastructure, and full marketing launch.
				</p>
				<span class="inline-flex items-center gap-0.5 text-[10px] text-slate-500 group-hover/hdr:text-slate-300 transition-colors mt-0.5">
					<ChevronDown class="size-3 transition-transform duration-200 {headerExpanded ? 'rotate-180' : ''}" />
					{headerExpanded ? 'less' : 'more'}
				</span>
			</button>
		</div>
		<Button href="/dashboard/projects" variant="outline" size="sm" class="gap-1.5 shrink-0">
			All Projects <ArrowRight class="size-3.5" />
		</Button>
	</div>

	<!-- Summary strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">

		<!-- Active Projects -->
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-emerald-300/70 font-medium">Active Projects</p>
					<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
						<Zap class="size-3.5 text-emerald-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{projects.length}</p>
				<p class="text-xs text-emerald-300/60 mt-0.5">of 29 total</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-60 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">Project Breakdown</p>
					{#each projects as p}
						{@const c = getColor(p.name)}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5 min-w-0">
								<span class="size-1.5 rounded-full shrink-0 {c.bar}"></span>
								<span class="text-slate-300 truncate text-xs">{p.name}</span>
							</div>
							<span class="text-xs font-medium text-slate-400 shrink-0">{fmt(p.budget)}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Combined Budget -->
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/30 hover:bg-blue-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-blue-300/70 font-medium">Combined Budget</p>
					<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
						<DollarSign class="size-3.5 text-blue-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{fmt(totalBudget)}</p>
				<p class="text-xs text-blue-300/60 mt-0.5">{fmt(totalSpend)} spent</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-2">Budget Detail</p>
					<div class="flex justify-between"><span class="text-slate-400">Total budget</span><span class="font-medium">{fmt(totalBudget)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Spent</span><span class="font-medium">{fmt(totalSpend)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Remaining</span><span class="font-medium text-emerald-400">{fmt(totalBudget - totalSpend)}</span></div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="flex justify-between"><span class="text-slate-400">% of $7.5M raise</span><span class="font-medium text-blue-300">{pct(totalBudget, 7_500_000).toFixed(0)}%</span></div>
				</div>
			</div>
		</div>

		<!-- Tasks -->
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-violet-500 bg-violet-950/30 hover:bg-violet-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-violet-300/70 font-medium">Tasks</p>
					<div class="size-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
						<CheckCircle2 class="size-3.5 text-violet-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{totalTasks}</p>
				<p class="text-xs text-violet-300/60 mt-0.5">{totalDone} done · {totalTasks - totalDone} open</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-violet-400 mb-2">Task Status</p>
					<div class="flex justify-between"><span class="text-slate-400">Total tasks</span><span class="font-medium">{totalTasks}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Completed</span><span class="font-medium text-emerald-400">{totalDone}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Open</span><span class="font-medium text-amber-400">{totalTasks - totalDone}</span></div>
					{#if totalTasks > 0}
						<div class="h-px bg-slate-700 my-1"></div>
						<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
							<div class="h-full rounded-full bg-emerald-500" style="width:{pct(totalDone, totalTasks).toFixed(0)}%"></div>
						</div>
						<p class="text-xs text-slate-400">{pct(totalDone, totalTasks).toFixed(0)}% complete</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Sponsors in Pipeline -->
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/30 hover:bg-amber-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-amber-300/70 font-medium">Sponsors in Pipeline</p>
					<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
						<Star class="size-3.5 text-amber-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{sponsorSummary.inPipeline}</p>
				<p class="text-xs text-amber-300/60 mt-0.5">{fmt(sponsorSummary.totalCommitted)} committed</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-amber-400 mb-2">Sponsor Summary</p>
					<div class="flex justify-between"><span class="text-slate-400">Total sponsors</span><span class="font-medium">{sponsorSummary.total}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">In pipeline</span><span class="font-medium text-amber-400">{sponsorSummary.inPipeline}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Committed</span><span class="font-medium text-emerald-400">{sponsorSummary.committed}</span></div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="flex justify-between"><span class="text-slate-400">$ Committed</span><span class="font-medium">{fmt(sponsorSummary.totalCommitted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">$ Paid</span><span class="font-medium text-emerald-400">{fmt(sponsorSummary.totalPaid)}</span></div>
				</div>
			</div>
		</div>

	</div>

	<!-- Project cards -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		{#each projects as project, i (project.id)}
			{@const color = getColor(project.name)}
			{@const links = PROJECT_LINKS[project.name] ?? []}
			{@const ProjectIcon = color.icon}
			{@const rowEven = Math.floor(i / 2) % 2 === 0}
			<Card class="p-0 overflow-hidden border-l-4 {color.border} {rowEven ? 'bg-slate-900' : 'bg-slate-800/60'}">
				<div class="p-5">
					<!-- Title row -->
					<div class="flex items-start justify-between gap-3 mb-3">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="size-9 rounded-lg {rowEven ? 'bg-slate-700' : 'bg-slate-700/80'} flex items-center justify-center shrink-0">
								<ProjectIcon class="size-4 text-slate-300" />
							</div>
							<div class="min-w-0">
								<a href="/dashboard/projects/{project.id}" class="text-sm font-bold leading-tight hover:text-primary transition-colors line-clamp-1">
									{project.name}
								</a>
								{#if project.department}
									<p class="text-xs text-muted-foreground truncate">{project.department.name}</p>
								{/if}
							</div>
						</div>
						<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded shrink-0 {color.badge}">
							In Progress
						</span>
					</div>

					{#if project.description}
						<button
							onclick={() => expandedDesc[project.id] = !expandedDesc[project.id]}
							class="w-full text-left group/desc mb-3"
						>
							<p class="text-xs text-muted-foreground leading-relaxed {expandedDesc[project.id] ? '' : 'line-clamp-2'}">
								{project.description}
							</p>
							<span class="inline-flex items-center gap-0.5 text-[10px] text-slate-500 group-hover/desc:text-slate-300 transition-colors mt-0.5">
								<ChevronDown class="size-3 transition-transform duration-200 {expandedDesc[project.id] ? 'rotate-180' : ''}" />
								{expandedDesc[project.id] ? 'less' : 'more'}
							</span>
						</button>
					{/if}

					<!-- Budget bar -->
					<div class="mb-3">
						<div class="flex justify-between text-xs mb-1">
							<span class="text-muted-foreground">Budget</span>
							<span class="font-medium tabular-nums">
								{fmt(project.actualSpend)} <span class="text-muted-foreground">/ {fmt(project.budget)}</span>
							</span>
						</div>
						<div class="h-1.5 rounded-full overflow-hidden {rowEven ? 'bg-slate-700' : 'bg-slate-600/70'}">
							<div class="h-full rounded-full transition-all {color.bar}"
								style="width:{project.spendPct.toFixed(1)}%"></div>
						</div>
						<p class="text-[10px] text-muted-foreground mt-0.5">{project.spendPct.toFixed(0)}% spent</p>
					</div>

					<!-- Tasks -->
					{#if project.tasks.total > 0}
						<div class="flex items-center gap-3 text-xs mb-3">
							<div class="flex items-center gap-1 text-muted-foreground">
								<CheckCircle2 class="size-3.5 text-emerald-500" />
								<span>{project.tasks.done} done</span>
							</div>
							<div class="flex items-center gap-1 text-muted-foreground">
								<Clock class="size-3.5 text-amber-500" />
								<span>{project.tasks.open} open</span>
							</div>
							{#if project.tasks.total > 0}
								<div class="flex-1 h-1 rounded-full overflow-hidden {rowEven ? 'bg-slate-700' : 'bg-slate-600/70'}">
									<div class="h-full rounded-full bg-emerald-500 transition-all"
										style="width:{pct(project.tasks.done, project.tasks.total).toFixed(0)}%"></div>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Related links -->
					{#if links.length > 0}
						<div class="flex flex-wrap gap-1.5 pt-3 border-t {rowEven ? 'border-slate-700/60' : 'border-slate-700/40'}">
							{#each links as link}
								{@const LinkIcon = link.icon}
								<a href={link.href}
									class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md
										{rowEven ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/70 hover:bg-slate-600/80'} text-slate-300 hover:text-white transition-colors">
									<LinkIcon class="size-3" />
									{link.label}
									<ExternalLink class="size-2.5 opacity-50" />
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</Card>
		{/each}
	</div>

	<!-- Context panels: Sponsor pipeline + Franchise leads -->
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

		<!-- Sponsor pipeline -->
		<Card class="p-5 border-l-4 border-l-amber-500">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Star class="size-4 text-amber-400" />
					<h2 class="text-sm font-bold">Sponsor Pipeline</h2>
				</div>
				<Button href="/dashboard/sponsors" variant="ghost" size="sm" class="gap-1 text-xs h-7">
					View <ArrowRight class="size-3" />
				</Button>
			</div>
			<div class="space-y-2.5">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Total sponsors</span>
					<span class="font-bold">{sponsorSummary.total}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">In pipeline</span>
					<span class="font-bold text-amber-400">{sponsorSummary.inPipeline}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Committed</span>
					<span class="font-bold text-emerald-400">{sponsorSummary.committed}</span>
				</div>
				<div class="h-px bg-slate-800 my-1"></div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Total committed</span>
					<span class="font-bold">{fmt(sponsorSummary.totalCommitted)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Total paid</span>
					<span class="font-bold text-emerald-400">{fmt(sponsorSummary.totalPaid)}</span>
				</div>
			</div>
		</Card>

		<!-- Franchise leads -->
		<Card class="p-5 border-l-4 border-l-violet-500">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Trophy class="size-4 text-violet-400" />
					<h2 class="text-sm font-bold">Franchise Pipeline</h2>
				</div>
				<Button href="/dashboard/sales" variant="ghost" size="sm" class="gap-1 text-xs h-7">
					View <ArrowRight class="size-3" />
				</Button>
			</div>
			<div class="space-y-2.5">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">Total leads</span>
					<span class="font-bold">{franchiseSummary.total}</span>
				</div>
				{#if franchiseSummary.recent.length > 0}
					<div class="h-px bg-slate-800 my-1"></div>
					<p class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Recent</p>
					{#each franchiseSummary.recent as lead}
						<div class="flex items-center justify-between text-sm">
							<span class="text-slate-300 truncate">{lead.name}</span>
							<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize shrink-0 ml-2">
								{lead.status?.replace('_', ' ') ?? '—'}
							</span>
						</div>
					{/each}
				{:else}
					<p class="text-xs text-muted-foreground">No leads yet</p>
				{/if}
				<div class="pt-1">
					<Button href="/dashboard/franchises" variant="ghost" size="sm" class="gap-1 text-xs h-7 w-full justify-start px-0">
						<Users class="size-3" /> View franchises <ArrowRight class="size-3 ml-auto" />
					</Button>
				</div>
			</div>
		</Card>
	</div>

	<!-- Footer note -->
	<p class="text-xs text-muted-foreground text-center pb-2">
		22 projects remain <span class="font-medium text-slate-400">planned</span> — they activate after the $7.5M seed raise closes.
		<a href="/dashboard/use-of-proceeds" class="text-primary hover:underline ml-1">View Use of Proceeds →</a>
	</p>

</div>
