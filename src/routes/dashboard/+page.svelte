<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DollarSign, Users, FolderKanban, Receipt,
		Trophy, Star, Building2, TrendingUp, ArrowRight,
		Video, Wrench, Megaphone, Cpu, Scale, Wallet, ShieldCheck, Globe, Handshake,
		Landmark, Briefcase, Film,
		CheckCircle2, Clock, AlertCircle
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const m = $derived(data.metrics ?? {});
	const sponsors = $derived(data.metrics?.sponsors ?? { total: 0, totalCommitted: 0, totalPaid: 0, byTier: {} });
	const franchise = $derived(data.metrics?.franchise ?? { pipeline: { leads: 0, opportunities: 0, deals: 0 } });
	const deptBudgets = $derived(data.metrics?.departmentBudgets ?? []);
	const budget = $derived(data.metrics?.budget ?? { total: 0, actual: 0, forecasted: 0, remaining: 0 });
	const projects = $derived(data.metrics?.projects ?? { total: 0, in_progress: 0, planned: 0, completed: 0 });
	const expenses = $derived(data.metrics?.expenses ?? { total: 0, totalAmount: 0, approved: 0, submitted: 0 });
	const approvals = $derived(data.metrics?.approvals ?? { pending: 0, approved: 0, rejected: 0 });

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		return '$' + (n / 1_000_000).toFixed(1) + 'M';
	}
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}

	// Phase model constants
	const TOTAL_BUDGET   = 14_638_300;
	const SEED_RAISE     = 7_500_000;
	const REVENUE_FUNDED = TOTAL_BUDGET - SEED_RAISE;
	const PHASE1_PCT     = Math.round((SEED_RAISE / TOTAL_BUDGET) * 100);
	const PHASE2_PCT     = 100 - PHASE1_PCT;

	// Maps department name keywords → { icon, colors }
	const DEPT_ICONS: Array<{ keywords: string[]; icon: any; bg: string; fg: string }> = [
		{ keywords: ['content', 'media'],            icon: Video,      bg: 'bg-pink-100 dark:bg-pink-900/30',    fg: 'text-pink-600 dark:text-pink-400' },
		{ keywords: ['operations', 'ops'],            icon: Wrench,     bg: 'bg-blue-100 dark:bg-blue-900/30',    fg: 'text-blue-600 dark:text-blue-400' },
		{ keywords: ['marketing'],                    icon: Megaphone,  bg: 'bg-orange-100 dark:bg-orange-900/30', fg: 'text-orange-600 dark:text-orange-400' },
		{ keywords: ['technology', 'tech', 'it'],     icon: Cpu,        bg: 'bg-cyan-100 dark:bg-cyan-900/30',    fg: 'text-cyan-600 dark:text-cyan-400' },
		{ keywords: ['player', 'development', 'talent'], icon: Trophy,  bg: 'bg-emerald-100 dark:bg-emerald-900/30', fg: 'text-emerald-600 dark:text-emerald-400' },
		{ keywords: ['executive', 'leadership'],      icon: Briefcase,  bg: 'bg-violet-100 dark:bg-violet-900/30', fg: 'text-violet-600 dark:text-violet-400' },
		{ keywords: ['legal', 'compliance'],          icon: Scale,      bg: 'bg-red-100 dark:bg-red-900/30',      fg: 'text-red-600 dark:text-red-400' },
		{ keywords: ['finance', 'financial'],         icon: Wallet,     bg: 'bg-green-100 dark:bg-green-900/30',  fg: 'text-green-600 dark:text-green-400' },
		{ keywords: ['sales'],                        icon: Handshake,  bg: 'bg-yellow-100 dark:bg-yellow-900/30', fg: 'text-yellow-600 dark:text-yellow-400' },
		{ keywords: ['people', 'hr', 'human'],        icon: Users,      bg: 'bg-indigo-100 dark:bg-indigo-900/30', fg: 'text-indigo-600 dark:text-indigo-400' },
		{ keywords: ['league'],                       icon: Globe,      bg: 'bg-teal-100 dark:bg-teal-900/30',    fg: 'text-teal-600 dark:text-teal-400' },
		{ keywords: ['sponsor'],                      icon: Star,       bg: 'bg-amber-100 dark:bg-amber-900/30',  fg: 'text-amber-600 dark:text-amber-400' },
		{ keywords: ['film', 'documentary'],          icon: Film,       bg: 'bg-rose-100 dark:bg-rose-900/30',    fg: 'text-rose-600 dark:text-rose-400' },
	];

	function getDeptIcon(name: string) {
		const lower = name.toLowerCase();
		const match = DEPT_ICONS.find(d => d.keywords.some(k => lower.includes(k)));
		return match ?? { icon: Building2, bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400' };
	}
</script>

<svelte:head><title>Dashboard — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Welcome back, {data.userProfile?.firstName ?? data.user?.email}</p>
	</div>

	<!-- Phase context banner -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
		<!-- Phase 1: Seed Raise -->
		<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
			<p class="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">Phase 1 · 2026 — Seed Raise</p>
			<p class="text-xl font-black text-white">{fmtM(SEED_RAISE)} raised</p>
			<div class="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
				<div class="h-full rounded-full bg-amber-500" style="width:{PHASE1_PCT}%"></div>
			</div>
			<p class="text-xs text-amber-300/70 mt-1">{PHASE1_PCT}% of {fmtM(TOTAL_BUDGET)} total budget · investment year</p>
		</div>
		<!-- Phase 2: Revenue Positive -->
		<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
			<p class="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">Phase 2 · 2027 — Revenue Positive</p>
			<p class="text-xl font-black text-white">No second raise</p>
			<div class="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
				<div class="h-full rounded-full bg-emerald-500" style="width:100%"></div>
			</div>
			<p class="text-xs text-emerald-300/70 mt-1">Revenue covers operations from 2027 onward</p>
		</div>
		<!-- Phase 3: Scale -->
		<div class="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
			<p class="text-xs font-bold text-violet-400 uppercase tracking-wide mb-1">Phase 3 · 2028–2031 — Scale</p>
			<p class="text-xl font-black text-white">{fmtM(REVENUE_FUNDED)} revenue-funded</p>
			<div class="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
				<div class="h-full rounded-full bg-violet-500" style="width:{PHASE2_PCT}%"></div>
			</div>
			<p class="text-xs text-violet-300/70 mt-1">{PHASE2_PCT}% of total budget · self-funded from operations</p>
		</div>
	</div>

	<!-- Top KPI row -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

		<!-- Budget -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-blue-500 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Total Budget</p>
					<div class="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<DollarSign class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{fmt(budget.total)}</p>
				<div class="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
					<div class="h-full rounded-full bg-blue-500 transition-all" style="width:{pct(budget.actual, budget.total).toFixed(1)}%"></div>
				</div>
				<p class="text-xs text-muted-foreground mt-1">{pct(budget.actual, budget.total).toFixed(0)}% spent · {fmt(budget.remaining)} remaining</p>
			</Card>
			<!-- Hover tooltip -->
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-2">Budget Detail</p>
					<div class="flex justify-between"><span class="text-slate-400">Actual</span><span class="font-medium">{fmt(budget.actual)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Forecasted</span><span class="font-medium">{fmt(budget.forecasted)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Remaining</span><span class="font-medium text-emerald-600">{fmt(budget.remaining)}</span></div>
				</div>
			</div>
		</div>

		<!-- Projects -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-emerald-500 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Projects</p>
					<div class="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<FolderKanban class="size-5 text-emerald-600 dark:text-emerald-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{projects.total}</p>
				<p class="text-xs text-muted-foreground mt-1">{projects.in_progress} active · {projects.planned} planned · {projects.completed} done</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">By Status</p>
					{#each [['In Progress', projects.in_progress, 'bg-blue-500'], ['Planned', projects.planned, 'bg-yellow-500'], ['Completed', projects.completed, 'bg-emerald-500']] as [label, count, color]}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2"><span class="size-2 rounded-full {color}"></span><span class="text-slate-400">{label}</span></div>
							<span class="font-medium tabular-nums">{count}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Sponsors -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-orange-500 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Sponsors</p>
					<div class="size-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<Star class="size-5 text-orange-600 dark:text-orange-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{sponsors.total}</p>
				<p class="text-xs text-muted-foreground mt-1">{fmt(sponsors.totalCommitted)} committed · {fmt(sponsors.totalPaid)} paid</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-orange-400 mb-2">By Tier</p>
					{#each Object.entries(sponsors.byTier ?? {}) as [tier, count]}
						<div class="flex justify-between"><span class="text-slate-400 capitalize">{tier.replace('_', ' ')}</span><span class="font-medium">{count}</span></div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Franchise Pipeline -->
		<div class="group/card relative">
			<Card class="p-5 border-l-4 border-l-violet-500 transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
				<div class="flex items-center justify-between mb-3">
					<p class="text-sm font-medium text-muted-foreground">Franchise Pipeline</p>
					<div class="size-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center transition-transform group-hover/card:scale-110">
						<Trophy class="size-5 text-violet-600 dark:text-violet-400" />
					</div>
				</div>
				<p class="text-2xl font-bold">{(franchise.pipeline.leads ?? 0) + (franchise.pipeline.opportunities ?? 0) + (franchise.pipeline.deals ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">{franchise.pipeline.leads} leads · {franchise.pipeline.opportunities} opps · {franchise.pipeline.deals} deals</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-56 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-violet-400 mb-2">Pipeline Stages</p>
					<div class="flex justify-between"><span class="text-slate-400">Leads</span><span class="font-medium">{franchise.pipeline.leads}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Opportunities</span><span class="font-medium">{franchise.pipeline.opportunities}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Deals</span><span class="font-medium">{franchise.pipeline.deals}</span></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Department budgets + Approvals/Expenses row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Department budget list -->
		<div class="lg:col-span-2">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-lg font-semibold">Department Budgets</h2>
				<Button href="/dashboard/departments" variant="ghost" size="sm" class="gap-1 text-xs">
					View all <ArrowRight class="size-3" />
				</Button>
			</div>
			<Card class="overflow-hidden">
				{#each deptBudgets.slice(0, 8) as dept, i}
					{@const used       = pct(dept.actual ?? 0, dept.budget ?? 1)}
					{@const forecasted = pct(dept.forecasted ?? 0, dept.budget ?? 1)}
					{@const deptIcon   = getDeptIcon(dept.name)}
					<a href="/dashboard/departments/{dept.id}"
						class="flex items-start gap-4 px-4 py-4 transition-colors group {i % 2 === 0 ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800/70 hover:bg-slate-700/70'}">

						<!-- Icon -->
						<div class="flex size-9 items-center justify-center rounded-lg {deptIcon.bg} shrink-0 mt-0.5 transition-transform group-hover:scale-105">
							<deptIcon.icon class="size-4 {deptIcon.fg}" />
						</div>

						<!-- Body -->
						<div class="flex-1 min-w-0">
							<!-- Name + budget numbers -->
							<div class="flex items-start justify-between gap-2 mb-1">
								<span class="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{dept.name}</span>
								<div class="text-right shrink-0">
									<span class="text-sm font-bold tabular-nums">{fmt(dept.actual ?? 0)}</span>
									<span class="text-xs text-muted-foreground"> / {fmt(dept.budget ?? 0)}</span>
								</div>
							</div>

							<!-- Description -->
							{#if dept.description}
								<p class="text-xs text-muted-foreground leading-snug mb-2 line-clamp-1">{dept.description}</p>
							{/if}

							<!-- Stacked progress: actual + forecasted -->
							<div class="h-2 rounded-full bg-muted overflow-hidden mb-1.5 relative">
								<!-- Forecasted (lighter, behind) -->
								{#if forecasted > used}
									<div class="absolute inset-y-0 left-0 rounded-full opacity-40 transition-all {used > 90 ? 'bg-red-500' : used > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
										style="width:{Math.min(forecasted, 100).toFixed(1)}%"></div>
								{/if}
								<!-- Actual (solid, on top) -->
								<div class="absolute inset-y-0 left-0 rounded-full transition-all {used > 90 ? 'bg-red-500' : used > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
									style="width:{used.toFixed(1)}%"></div>
							</div>

							<!-- Meta row: % spent · forecasted · projects -->
							<div class="flex items-center gap-3 text-xs text-muted-foreground">
								<span class="font-medium {used > 90 ? 'text-red-500' : used > 70 ? 'text-yellow-500' : 'text-emerald-500'}">{used.toFixed(0)}% spent</span>
								{#if (dept.forecasted ?? 0) > 0}
									<span>·</span>
									<span>{fmt(dept.forecasted)} forecasted</span>
								{/if}
								{#if dept.projectCount > 0}
									<span>·</span>
									<span>{dept.projectCount} project{dept.projectCount !== 1 ? 's' : ''}</span>
								{/if}

							</div>
						</div>
					</a>
				{/each}
				{#if deptBudgets.length === 0}
					<p class="px-4 py-6 text-sm text-muted-foreground text-center">No department data</p>
				{/if}
			</Card>
		</div>

		<!-- Right column: Approvals + Expenses -->
		<div class="flex flex-col gap-4">

			<!-- Approvals -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-lg font-semibold">Approvals</h2>
					<Button href="/dashboard/approvals" variant="ghost" size="sm" class="gap-1 text-xs">
						View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<Card class="p-4 space-y-3">
					{#each [
						{ label: 'Pending', count: approvals.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
						{ label: 'Approved', count: approvals.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
						{ label: 'Rejected', count: approvals.rejected, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
					] as row}
						<div class="flex items-center gap-3 group/row hover:bg-muted/40 -mx-2 px-2 py-1 rounded-lg transition-colors">
							<div class="size-8 rounded-lg {row.bg} flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110">
								<row.icon class="size-4 {row.color}" />
							</div>
							<span class="text-sm text-muted-foreground flex-1">{row.label}</span>
							<span class="text-sm font-bold tabular-nums">{row.count}</span>
						</div>
					{/each}
				</Card>
			</div>

			<!-- Expenses -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-lg font-semibold">Expenses</h2>
					<Button href="/dashboard/expenses" variant="ghost" size="sm" class="gap-1 text-xs">
						View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<Card class="p-4 space-y-2">
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-muted-foreground">Total</span>
						<span class="font-bold">{fmt(expenses.totalAmount)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-muted-foreground">Approved</span>
						<span class="font-medium text-emerald-600">{fmt(expenses.approvedAmount ?? 0)}</span>
					</div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-muted-foreground">Pending review</span>
						<span class="font-medium text-yellow-600">{expenses.submitted ?? 0} items</span>
					</div>
					<div class="h-px bg-border my-1"></div>
					<div class="flex justify-between items-baseline">
						<span class="text-sm text-muted-foreground">Transactions</span>
						<span class="font-medium">{expenses.total}</span>
					</div>
				</Card>
			</div>
		</div>
	</div>

	<!-- Quick nav -->
	<div>
		<h2 class="text-lg font-semibold mb-3">Quick Access</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each [
				{ label: 'Departments', href: '/dashboard/departments', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
				{ label: 'Projects', href: '/dashboard/projects', icon: FolderKanban, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
				{ label: 'Expenses', href: '/dashboard/expenses', icon: Receipt, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
				{ label: 'People', href: '/dashboard/people', icon: Users, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
				{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
				{ label: 'Franchises', href: '/dashboard/franchises', icon: Trophy, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' }
			] as link}
				<a href={link.href}
					class="group flex flex-col items-center gap-2 rounded-xl border p-4 text-center
						hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm transition-all duration-150">
					<div class="size-10 rounded-xl {link.bg} flex items-center justify-center transition-transform group-hover:scale-110">
						<link.icon class="size-5 {link.color}" />
					</div>
					<span class="text-xs font-medium">{link.label}</span>
				</a>
			{/each}
		</div>
	</div>

</div>
