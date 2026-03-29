<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DollarSign, Users, FolderKanban, Receipt,
		Trophy, Star, Building2, TrendingUp, ArrowRight,
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
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}
</script>

<svelte:head><title>Dashboard — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground mt-1">Welcome back, {data.userProfile?.firstName ?? data.user?.email}</p>
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
				<div class="rounded-xl border bg-popover shadow-xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-600 mb-2">Budget Detail</p>
					<div class="flex justify-between"><span class="text-muted-foreground">Actual</span><span class="font-medium">{fmt(budget.actual)}</span></div>
					<div class="flex justify-between"><span class="text-muted-foreground">Forecasted</span><span class="font-medium">{fmt(budget.forecasted)}</span></div>
					<div class="flex justify-between"><span class="text-muted-foreground">Remaining</span><span class="font-medium text-emerald-600">{fmt(budget.remaining)}</span></div>
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
				<div class="rounded-xl border bg-popover shadow-xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-600 mb-2">By Status</p>
					{#each [['In Progress', projects.in_progress, 'bg-blue-500'], ['Planned', projects.planned, 'bg-yellow-500'], ['Completed', projects.completed, 'bg-emerald-500']] as [label, count, color]}
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2"><span class="size-2 rounded-full {color}"></span><span class="text-muted-foreground">{label}</span></div>
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
				<div class="rounded-xl border bg-popover shadow-xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-orange-600 mb-2">By Tier</p>
					{#each Object.entries(sponsors.byTier ?? {}) as [tier, count]}
						<div class="flex justify-between"><span class="text-muted-foreground capitalize">{tier.replace('_', ' ')}</span><span class="font-medium">{count}</span></div>
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
				<div class="rounded-xl border bg-popover shadow-xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-violet-600 mb-2">Pipeline Stages</p>
					<div class="flex justify-between"><span class="text-muted-foreground">Leads</span><span class="font-medium">{franchise.pipeline.leads}</span></div>
					<div class="flex justify-between"><span class="text-muted-foreground">Opportunities</span><span class="font-medium">{franchise.pipeline.opportunities}</span></div>
					<div class="flex justify-between"><span class="text-muted-foreground">Deals</span><span class="font-medium">{franchise.pipeline.deals}</span></div>
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
			<Card class="divide-y">
				{#each deptBudgets.slice(0, 8) as dept}
					{@const used = pct(dept.actual ?? 0, dept.budget ?? 1)}
					<a href="/dashboard/departments/{dept.id}"
						class="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group">
						<div class="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
							<Building2 class="size-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm font-medium truncate group-hover:text-primary transition-colors">{dept.name}</span>
								<span class="text-xs text-muted-foreground ml-2 shrink-0">{fmt(dept.actual ?? 0)} / {fmt(dept.budget ?? 0)}</span>
							</div>
							<div class="h-1.5 rounded-full bg-muted overflow-hidden">
								<div class="h-full rounded-full transition-all {used > 90 ? 'bg-red-500' : used > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
									style="width:{used.toFixed(1)}%"></div>
							</div>
						</div>
						<span class="text-xs font-medium tabular-nums shrink-0 {used > 90 ? 'text-red-600' : used > 70 ? 'text-yellow-600' : 'text-emerald-600'}">{used.toFixed(0)}%</span>
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
