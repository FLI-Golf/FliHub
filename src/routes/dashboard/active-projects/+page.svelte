<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Zap, FolderKanban, DollarSign, CheckCircle2, Clock,
		ArrowRight, Users, Star, Trophy, Building2,
		Film, Scale, Handshake, Cpu, TrendingUp, ExternalLink,
		ChevronDown, ChevronRight, Info, Wallet, Pencil, X, Loader, Circle, FileText, Receipt
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import TaskDetailModal from '$lib/components/tasks/task-detail-modal.svelte';
	import TaskExpenseModal from '$lib/components/expenses/task-expense-modal.svelte';

	let { data }: { data: PageData } = $props();

	const projects = $derived(data.projects ?? []);
	const sponsorSummary = $derived(data.sponsorSummary ?? { total: 0, committed: 0, totalCommitted: 0, totalPaid: 0, inPipeline: 0 });
	const franchiseSummary = $derived(data.franchiseSummary ?? { total: 0, recent: [] });

	// Task detail modal
	let selectedTask = $state<any>(null);
	let taskModalOpen = $state(false);
	function openTask(task: any) { selectedTask = task; taskModalOpen = true; }

	let expenseTask     = $state<any>(null);
	let expenseModalOpen = $state(false);
	function openExpense(task: any, e: Event) {
		e.stopPropagation();
		expenseTask = task;
		expenseModalOpen = true;
	}

	// Report generation — track which project is generating
	let generatingReport = $state<Record<string, boolean>>({});

	// Svelte action: attaches click via native addEventListener, bypassing Svelte delegation
	function reportBtn(node: HTMLElement, project: any) {
		function handler() {
			console.log('[reportBtn] raw click fired, project:', project, typeof project);
			const p = $state.snapshot(project);
			console.log('[reportBtn] snapshot:', p);
			generateReport(p);
		}
		node.addEventListener('click', handler);
		return { destroy() { node.removeEventListener('click', handler); } };
	}
	async function generateReport(project: any) {
		console.log('[Report] clicked for project:', project.id, project.name);
		if (generatingReport[project.id]) { console.log('[Report] already generating, skipping'); return; }
		generatingReport = { ...generatingReport, [project.id]: true };
		console.log('[Report] fetching PDF...');
		try {
			const res = await fetch(`/api/projects/${project.id}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project }),
			});
			if (!res.ok) {
				const msg = await res.text();
				console.error('Report error:', msg);
				alert('Report failed: ' + msg);
				return;
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			// Open in new tab — most reliable cross-browser approach
			const win = window.open(url, '_blank');
			if (!win) {
				// Popup blocked — fall back to direct download
				const a = document.createElement('a');
				a.href = url;
				a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-report-${new Date().toISOString().slice(0,10)}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
			// Revoke after a delay to allow the tab/download to start
			setTimeout(() => URL.revokeObjectURL(url), 10000);
		} catch (e: any) {
			console.error('Report generation failed:', e);
			alert('Report generation failed: ' + e.message);
		} finally {
			generatingReport = { ...generatingReport, [project.id]: false };
		}
	}

	// Track which project task lists are expanded — plain object for Svelte 5 proxy reactivity
	let expandedTasks = $state<Record<string, boolean>>({});
	function toggleTasks(id: string) {
		expandedTasks = { ...expandedTasks, [id]: !expandedTasks[id] };
	}

	const STATUS_ICON: Record<string, { label: string; color: string }> = {
		todo:        { label: 'To Do',       color: 'text-slate-400' },
		in_progress: { label: 'In Progress', color: 'text-blue-400'  },
		blocked:     { label: 'Blocked',     color: 'text-red-400'   },
		completed:   { label: 'Done',        color: 'text-emerald-400' },
		cancelled:   { label: 'Cancelled',   color: 'text-slate-600' }
	};

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}
	function fmtM(n: number) {
		return '$' + (n / 1_000_000).toFixed(1) + 'M';
	}
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}

	function subtaskCounts(checklist: string | null | undefined): { done: number; total: number } {
		if (!checklist) return { done: 0, total: 0 };
		// Handle JSON array format
		if (typeof checklist === 'string' && checklist.trim().startsWith('[')) {
			try {
				const arr = JSON.parse(checklist);
				if (Array.isArray(arr)) {
					const done = arr.filter((i: any) => i.checked || i.completed || i.done).length;
					return { done, total: arr.length };
				}
			} catch { /* fall through */ }
		}
		// Markdown format: - [x] item or - [ ] item
		const lines = checklist.split('\n').filter(l => l.trim().startsWith('- ['));
		const done = lines.filter(l => l.includes('[x]') || l.includes('[X]')).length;
		return { done, total: lines.length };
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
		'Tax-Exempt Reimbursements': [
			{ label: 'Reimbursements', href: '/dashboard/reimbursements', icon: Wallet },
			{ label: 'Payments & Income', href: '/dashboard/payments', icon: DollarSign },
		],
		'Payments & Income': [
			{ label: 'Payments & Income', href: '/dashboard/payments', icon: DollarSign },
			{ label: 'Reimbursements', href: '/dashboard/reimbursements', icon: Wallet },
			{ label: 'Expenses', href: '/dashboard/expenses', icon: TrendingUp },
		],
		'Trademark Pipeline': [
			{ label: 'Trademark Pipeline', href: '/dashboard/trademarks', icon: Scale },
			{ label: 'Legal Services', href: '/dashboard/projects', icon: Scale },
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
		'Go Throw Media Partnership':  { border: 'border-l-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300', bar: 'bg-emerald-500', icon: Handshake },
		'Tax-Exempt Reimbursements':   { border: 'border-l-teal-500',    badge: 'bg-teal-500/15 text-teal-300',       bar: 'bg-teal-500',    icon: Wallet },
		'Payments & Income':           { border: 'border-l-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300',  bar: 'bg-emerald-500', icon: DollarSign },
		'Trademark Pipeline':          { border: 'border-l-rose-400',    badge: 'bg-rose-500/15 text-rose-300',        bar: 'bg-rose-400',    icon: Scale },
	};

	function getColor(name: string) {
		return PROJECT_COLORS[name] ?? { border: 'border-l-slate-500', badge: 'bg-slate-500/15 text-slate-300', bar: 'bg-slate-500', icon: FolderKanban };
	}

	let expandedDesc = $state<Record<string, boolean>>({});
	let headerExpanded = $state(false);

	const totalBudget    = $derived(projects.reduce((s, p) => s + p.budget, 0));
	const totalSpend     = $derived(projects.reduce((s, p) => s + p.actualSpend, 0));
	const RAISE          = $derived(data.raiseTarget?.value ?? 7_500_000);
	const raiseRemaining = $derived(RAISE - totalBudget);

	// Set Raise Amount modal
	let showRaiseModal = $state(false);
	let raiseInput     = $state('');
	let raiseSaving    = $state(false);
	let raiseError     = $state('');

	function openRaiseModal() {
		raiseInput = String(data.raiseTarget?.value ?? 7_500_000);
		raiseError = '';
		showRaiseModal = true;
	}

	async function saveRaise() {
		const val = Number(raiseInput.replace(/[^0-9.]/g, ''));
		if (!val || val < 0) { raiseError = 'Enter a valid amount'; return; }
		raiseSaving = true;
		raiseError  = '';
		try {
			const res = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.raiseTarget?.id, value: val }),
			});
			if (!res.ok) { raiseError = 'Save failed'; return; }
			await invalidateAll();
			showRaiseModal = false;
		} catch (e: any) {
			raiseError = e.message;
		} finally {
			raiseSaving = false;
		}
	}
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
					<Zap class="size-3" /> Phase 1 · Pre-Tournaments
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Active Projects</h1>
			<p class="text-sm text-muted-foreground mt-1">
				{projects.length} projects in flight right now — everything else activates when tournaments go live.
			</p>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<button type="button" onclick={openRaiseModal}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-700/50 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-medium transition-colors">
				<Pencil class="size-3" /> Set Raise Amount
			</button>
			<Button href="/dashboard/projects" variant="outline" size="sm" class="gap-1.5">
				All Projects <ArrowRight class="size-3.5" />
			</Button>
		</div>
	</div>

	<!-- Info card -->
	<button type="button"
		onclick={() => headerExpanded = !headerExpanded}
		class="w-full text-left group/info"
	>
		<div class="rounded-xl border border-slate-700/60 {headerExpanded ? 'bg-slate-800/80' : 'bg-slate-800/40'} hover:bg-slate-800/80 transition-colors px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div class="size-7 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
						<Info class="size-3.5 text-yellow-400" />
					</div>
					<p class="text-xs font-medium text-yellow-300">
						{headerExpanded ? 'About Active Projects' : 'What is this page?'}
					</p>
				</div>
				<ChevronDown class="size-4 text-slate-500 group-hover/info:text-slate-300 transition-all duration-200 shrink-0 {headerExpanded ? 'rotate-180' : ''}" />
			</div>
			{#if headerExpanded}
				<div class="text-xs text-yellow-200/70 leading-relaxed mt-3 pl-9 space-y-2">
					<p>
						This page shows only the projects currently marked <span class="font-semibold text-yellow-300">in progress</span> — the workstreams that matter right now in Phase 1 (Pre-Tournaments). The <span class="font-semibold text-yellow-300">Combined Budget</span> card reflects the total capital committed to these active projects, and the <span class="font-semibold text-yellow-300">Unallocated</span> card shows how much of the funded capital is still available to deploy.
					</p>
					<p>
						Use the <span class="font-semibold text-yellow-300">Set Raise Amount</span> button to update the total capital received as the raise progresses. The Unallocated figure updates automatically — it is always raise amount minus combined project budgets.
					</p>
					<p>
						As new workstreams kick off, flip projects from <span class="font-semibold text-yellow-300">planned → in progress</span> on the Projects page. Each activation increases the Combined Budget and reduces Unallocated, so this page always reflects your current capital deployment in real time.
					</p>
				</div>
			{/if}
		</div>
	</button>

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
				<p class="text-xs text-blue-300/60 mt-0.5">{fmt(totalSpend)} spent · {pct(totalBudget, RAISE).toFixed(0)}% of raise</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-72 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm">
					<p class="font-semibold text-xs uppercase tracking-wider text-blue-400 mb-2">Project Breakdown</p>
					<div class="space-y-1 mb-2">
						{#each [...projects].sort((a, b) => b.budget - a.budget) as p}
							<div class="flex justify-between items-center gap-2">
								<span class="text-slate-400 truncate text-xs">{p.name}</span>
								<span class="font-medium text-xs shrink-0">{fmt(p.budget)}</span>
							</div>
						{/each}
					</div>
					<div class="h-px bg-slate-700 my-2"></div>
					<div class="flex justify-between font-semibold">
						<span class="text-slate-300">Allocated</span>
						<span class="text-white">{fmt(totalBudget)}</span>
					</div>
					<div class="h-px bg-slate-700 my-2"></div>
					<div class="flex justify-between text-xs"><span class="text-slate-400">$7.5M raise</span><span class="text-slate-300">{fmt(RAISE)}</span></div>
					<div class="flex justify-between text-xs mt-1"><span class="text-slate-400">Unallocated</span><span class="text-emerald-400 font-semibold">{fmt(raiseRemaining)}</span></div>
				</div>
			</div>
		</div>

		<!-- Raise Remaining -->
		<div class="group/card relative">
			<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30 hover:bg-emerald-950/50 transition-colors cursor-default">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-emerald-300/70 font-medium">Unallocated</p>
					<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
						<DollarSign class="size-3.5 text-emerald-400" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{fmt(raiseRemaining)}</p>
				<p class="text-xs text-emerald-300/60 mt-0.5">of $7.5M raise · {(100 - pct(totalBudget, RAISE)).toFixed(0)}% free</p>
			</Card>
			<div class="pointer-events-none absolute left-0 top-full mt-2 z-50 w-64 opacity-0 translate-y-1 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-200">
				<div class="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl p-3 text-sm space-y-1.5">
					<p class="font-semibold text-xs uppercase tracking-wider text-emerald-400 mb-2">Raise Allocation</p>
					<div class="flex justify-between"><span class="text-slate-400">$7.5M raise</span><span class="font-medium">{fmt(RAISE)}</span></div>
					<div class="flex justify-between"><span class="text-slate-400">Allocated to projects</span><span class="font-medium text-blue-300">{fmt(totalBudget)}</span></div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="flex justify-between font-semibold"><span class="text-slate-300">Remaining</span><span class="text-emerald-400">{fmt(raiseRemaining)}</span></div>
					<!-- Progress bar -->
					<div class="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full bg-blue-500 transition-all" style="width: {pct(totalBudget, RAISE).toFixed(1)}%"></div>
					</div>
					<p class="text-xs text-slate-500 text-right">{pct(totalBudget, RAISE).toFixed(0)}% allocated</p>
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
						<div class="flex items-center gap-2 shrink-0">
							{#if project.draftExpenses > 0}
								<a
									href="/dashboard/expenses"
									class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border border-slate-500/50 bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors no-underline"
									title="{project.draftExpenses} draft expense{project.draftExpenses > 1 ? 's' : ''} — not yet submitted"
								>
									<FileText class="size-3" />
									{project.draftExpenses} Draft
								</a>
							{/if}
							{#if project.pendingApprovals > 0}
								<a
									href="/dashboard/approvals"
									class="relative inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border border-amber-500/60 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors no-underline"
									title="{project.pendingApprovals} expense{project.pendingApprovals > 1 ? 's' : ''} awaiting approval"
								>
									<span class="relative flex size-2">
										<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
										<span class="relative inline-flex rounded-full size-2 bg-amber-500"></span>
									</span>
									{project.pendingApprovals} Awaiting Approval
								</a>
							{/if}
							<a
							href="/api/projects/{project.id}/report/view"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors no-underline"
						>
							<FileText class="size-3" />
							Report
						</a>
						{#if project.isReimbProject}
							<a
								href="/dashboard/reimbursements/admin"
								class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border border-orange-700/60 bg-orange-950/40 hover:bg-orange-900/60 text-orange-300 hover:text-orange-100 transition-colors no-underline"
							>
								<Receipt class="size-3" />
								Admin
							</a>
						{/if}
							<span class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded {color.badge}">
								In Progress
							</span>
						</div>
					</div>

					{#if project.description}
						<div class="mb-3">
							<p class="text-xs text-muted-foreground leading-relaxed {expandedDesc[project.id] ? '' : 'line-clamp-2'}">
								{project.description}
							</p>
							<button type="button"
								onclick={() => { expandedDesc[project.id] = !expandedDesc[project.id]; expandedDesc = expandedDesc; }}
								class="inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
							>
								<ChevronDown class="size-3 transition-transform duration-200 {expandedDesc[project.id] ? 'rotate-180' : ''}" />
								{expandedDesc[project.id] ? 'less' : 'more'}
							</button>
						</div>
					{/if}

					{#if project.isReimbProject}
					<!-- ── Reimbursement pipeline card body ───────────────────── -->
					{@const rp = project.reimbPipeline}
					{@const rpTotal = rp?.total ?? 0}
					{@const rpBudget = project.budget}
					{@const rpPct = (v: number) => rpBudget > 0 ? Math.min(100, (v / rpBudget) * 100) : (rpTotal > 0 ? Math.min(100, (v / rpTotal) * 100) : 0)}
					<div class="mb-4 space-y-3">
						{#if project.department && project.department.budget > 0}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="text-muted-foreground font-medium flex items-center gap-1.5"><FolderKanban class="size-3.5" />Dept Budget</span>
								<span class="tabular-nums text-slate-400 text-[11px]">{fmt(project.budget)} of {fmt(project.department.budget)}</span>
							</div>
							<div class="h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
								<div class="h-full transition-all duration-500 {color.bar}" style="width:{project.department.pct.toFixed(2)}%"></div>
							</div>
							<div class="flex justify-between text-[10px] text-slate-500">
								<span>{project.department.name}</span>
								<span>{project.department.pct.toFixed(1)}% of dept budget</span>
							</div>
						</div>
						{/if}
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="text-muted-foreground font-medium flex items-center gap-1.5"><Receipt class="size-3.5" />Claim Pipeline</span>
								<span class="tabular-nums text-slate-300">{fmt(rpTotal)}</span>
							</div>
							<div class="h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-700">
								{#if (rp?.paid ?? 0) > 0}<div class="h-full bg-emerald-500 shrink-0 transition-all duration-500" style="width:{rpPct(rp?.paid ?? 0).toFixed(2)}%"></div>{/if}
								{#if (rp?.approved ?? 0) > 0}<div class="h-full bg-blue-500 shrink-0 transition-all duration-500" style="width:{rpPct(rp?.approved ?? 0).toFixed(2)}%"></div>{/if}
								{#if (rp?.under_review ?? 0) > 0}<div class="h-full bg-violet-500/80 shrink-0 transition-all duration-500" style="width:{rpPct(rp?.under_review ?? 0).toFixed(2)}%"></div>{/if}
								{#if (rp?.submitted ?? 0) > 0}<div class="h-full bg-amber-400 shrink-0 transition-all duration-500" style="width:{rpPct(rp?.submitted ?? 0).toFixed(2)}%"></div>{/if}
							</div>
							<div class="flex flex-wrap gap-x-3 text-[10px]">
								<span class="flex items-center gap-1 {(rp?.paid ?? 0) > 0 ? 'text-emerald-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Paid {(rp?.paid ?? 0) > 0 ? fmt(rp!.paid) : '—'}</span>
								<span class="flex items-center gap-1 {(rp?.approved ?? 0) > 0 ? 'text-blue-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-blue-500 shrink-0"></span>Approved {(rp?.approved ?? 0) > 0 ? fmt(rp!.approved) : '—'}</span>
								<span class="flex items-center gap-1 {(rp?.under_review ?? 0) > 0 ? 'text-violet-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-violet-500 shrink-0"></span>Under Review {(rp?.under_review ?? 0) > 0 ? fmt(rp!.under_review) : '—'}</span>
								<span class="flex items-center gap-1 {(rp?.submitted ?? 0) > 0 ? 'text-amber-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-amber-400 shrink-0"></span>Submitted {(rp?.submitted ?? 0) > 0 ? fmt(rp!.submitted) : '—'}</span>
							</div>
						</div>
					</div>
					<!-- Active claims list -->
					<div class="mb-4 space-y-1">
						<div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
							<span class="font-medium flex items-center gap-1.5"><Wallet class="size-3.5" />Active Claims</span>
							<span class="tabular-nums">{rp?.claimCount ?? 0} total · <span class="text-amber-400">{rp?.pendingCount ?? 0} pending</span></span>
						</div>
						{#if (rp?.recentClaims ?? []).length === 0}
							<p class="text-[11px] text-slate-600 italic px-2 py-1">No active claims — all claims are paid or rejected.</p>
						{:else}
							{#each (rp?.recentClaims ?? []) as claim}
								{@const sc = claim.status === 'approved' ? 'bg-blue-500' : claim.status === 'under_review' ? 'bg-violet-500' : 'bg-amber-400'}
								{@const tc = claim.status === 'approved' ? 'text-blue-400' : claim.status === 'under_review' ? 'text-violet-400' : 'text-amber-400'}
								<div class="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-800/60 transition-colors text-xs">
									<span class="size-1.5 rounded-full {sc} shrink-0"></span>
									<span class="flex-1 truncate text-slate-300">{claim.title}</span>
									{#if claim.is_historical}<span class="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-500 shrink-0">historical</span>{/if}
									<span class="tabular-nums text-slate-400 shrink-0">{fmt(claim.totalAmount ?? 0)}</span>
									<span class="{tc} text-[10px] shrink-0 capitalize">{(claim.status ?? '').replace('_', ' ')}</span>
								</div>
							{/each}

						{/if}
					</div>
					{:else}
					<!-- Budget bars -->
					<div class="mb-4 space-y-3">

						<!-- Bar 0: Department budget -->
						{#if project.department && project.department.budget > 0}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-xs">
									<span class="text-muted-foreground font-medium flex items-center gap-1.5">
										<FolderKanban class="size-3.5" />Dept Budget
									</span>
									<span class="tabular-nums text-slate-400 text-[11px]">{fmt(project.budget)} of {fmt(project.department.budget)}</span>
								</div>
								<div class="h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
									<div class="h-full transition-all duration-500 {color.bar}" style="width:{project.department.pct.toFixed(2)}%"></div>
								</div>
								<div class="flex justify-between text-[10px] text-slate-500">
									<span>{project.department.name}</span>
									<span>{project.department.pct.toFixed(1)}% of dept budget</span>
								</div>
							</div>
						{/if}

						<!-- Bar 1: Expense pipeline — task budgets flow into expenses into payments -->
						<div class="space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="text-muted-foreground font-medium flex items-center gap-1.5">
									<DollarSign class="size-3.5" />Expense Pipeline
								</span>
								<span class="tabular-nums text-slate-300">{fmt(project.budget)}</span>
							</div>
							<div class="h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-700">
								{#if project.pipelinePct.paid > 0}
									<div class="h-full bg-emerald-500 shrink-0 transition-all duration-500" style="width:{project.pipelinePct.paid.toFixed(2)}%"></div>
								{/if}
								{#if project.pipelinePct.approved > 0}
									<div class="h-full bg-blue-500 shrink-0 transition-all duration-500" style="width:{project.pipelinePct.approved.toFixed(2)}%"></div>
								{/if}
								{#if project.pipelinePct.submitted > 0}
									<div class="h-full bg-amber-400 shrink-0 transition-all duration-500" style="width:{project.pipelinePct.submitted.toFixed(2)}%"></div>
								{/if}
								{#if project.pipelinePct.inTasks > 0}
									<div class="h-full bg-violet-500/80 shrink-0 transition-all duration-500" style="width:{project.pipelinePct.inTasks.toFixed(2)}%"></div>
								{/if}
							</div>
							<div class="flex flex-wrap gap-x-3 text-[10px]">
								<span class="flex items-center gap-1 {project.pipeline.paid > 0 ? 'text-emerald-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>Paid {project.pipeline.paid > 0 ? fmt(project.pipeline.paid) : '—'}</span>
								<span class="flex items-center gap-1 {project.pipeline.approved > 0 ? 'text-blue-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-blue-500 shrink-0"></span>Approved {project.pipeline.approved > 0 ? fmt(project.pipeline.approved) : '—'}</span>
								<span class="flex items-center gap-1 {project.pipeline.submitted > 0 ? 'text-amber-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-amber-400 shrink-0"></span>Submitted {project.pipeline.submitted > 0 ? fmt(project.pipeline.submitted) : '—'}</span>
								<span class="flex items-center gap-1 {project.pipeline.inTasks > 0 ? 'text-violet-400' : 'text-slate-600'}"><span class="size-1.5 rounded-full bg-violet-500 shrink-0"></span>In Tasks {project.pipeline.inTasks > 0 ? fmt(project.pipeline.inTasks) : '—'}</span>
								{#if project.pipeline.unallocated > 0}
									<span class="text-slate-500 ml-auto">{fmt(project.pipeline.unallocated)} unallocated</span>
								{/if}
							</div>
						</div>



					</div>

					<!-- Task progress + expandable list -->
					{#if true}
						{@const taskPct = pct(project.tasks.done, project.tasks.total)}
						<div class="mb-4 space-y-1.5">
						<!-- Header row — clickable to expand/collapse -->
						<button type="button"
							onclick={() => toggleTasks(project.id)}
							class="w-full flex items-center justify-between text-xs group"
						>
							<div class="flex items-center gap-1.5 text-muted-foreground group-hover:text-slate-300 transition-colors">
								<CheckCircle2 class="size-3.5" />
								<span class="font-medium">Tasks</span>
							</div>
							<div class="flex items-center gap-2 tabular-nums text-[11px]">
								{#if project.tasks.total > 0}
									<span class="text-emerald-400 font-medium">{project.tasks.done} done</span>
									<span class="text-slate-600">·</span>
									<span class="text-amber-400">{project.tasks.open} open</span>
									<span class="text-slate-600">·</span>
									<span class="text-slate-400">{project.tasks.total} total</span>
								{:else}
									<span class="text-slate-600 italic">No tasks yet</span>
								{/if}
								<ChevronDown class="size-3.5 text-slate-500 transition-transform duration-200 {expandedTasks[project.id] ? 'rotate-180' : ''}" />
							</div>
						</button>

						<!-- Progress bar (only when tasks exist) -->
						{#if project.tasks.total > 0}
							<div class="h-3 rounded-full overflow-hidden {rowEven ? 'bg-slate-700' : 'bg-slate-600/70'}">
								<div class="h-full rounded-full bg-emerald-500 transition-all duration-500"
									style="width:{Math.max(taskPct, 0.5).toFixed(1)}%"></div>
							</div>
							<div class="text-[10px] text-muted-foreground">{taskPct.toFixed(0)}% complete</div>
						{/if}

						<!-- Expanded task list -->
						{#if expandedTasks[project.id]}
							<div class="mt-2 space-y-1 border-t {rowEven ? 'border-slate-700/60' : 'border-slate-700/40'} pt-2">
								{#if project.tasks.items.length === 0}
									<p class="text-[11px] text-slate-600 italic px-2 py-1">No tasks have been added to this project.</p>
								{:else}
									{#each project.tasks.items as task}
										{@const s = STATUS_ICON[task.status] ?? STATUS_ICON.todo}
										<div
											role="button"
											tabindex="0"
											onclick={() => openTask(task)}
											onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTask(task); }}
											class="w-full flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left group/task cursor-pointer"
										>
											<!-- Status icon -->
											<div class="mt-0.5 shrink-0">
												{#if task.status === 'completed'}
													<CheckCircle2 class="size-3.5 {s.color}" />
												{:else if task.status === 'in_progress'}
													<Loader class="size-3.5 {s.color}" />
												{:else if task.status === 'blocked'}
													<X class="size-3.5 {s.color}" />
												{:else}
													<Circle class="size-3.5 {s.color}" />
												{/if}
											</div>
											<!-- Task name + meta -->
											<div class="flex-1 min-w-0">
												<p class="text-xs font-medium text-slate-300 truncate leading-snug group-hover/task:text-white transition-colors">{task.title}</p>
												<div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
													<span class="{s.color}">{s.label}</span>
													{#if task.dueDate}
														<span>· Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
													{/if}
													{#if task.budget > 0}
														<span>· {fmt(task.budget)}</span>
													{/if}
												</div>
											</div>
											{#if task.draftExpenses > 0}
												<a href="/dashboard/expenses" onclick={(e) => e.stopPropagation()} class="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded border border-slate-600/60 bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors no-underline" title="{task.draftExpenses} draft expense — not yet submitted">Draft</a>
											{/if}
											{#if task.needs_review}
												<span class="relative flex size-2 shrink-0 mt-1">
													<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
													<span class="relative inline-flex rounded-full size-2 bg-amber-500"></span>
												</span>
											{/if}
											<button
												type="button"
												onclick={(e) => openExpense(task, e)}
												class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-emerald-600/40 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500/60 transition-colors opacity-0 group-hover/task:opacity-100"
												title="Log expense for this task"
											>
												<Receipt class="size-3" /> Log Expense
											</button>
											<ChevronRight class="size-3 text-slate-600 group-hover/task:text-slate-400 shrink-0 mt-1 transition-colors" />
										</div>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
					{/if}
					{/if}<!-- end isReimbProject branch -->

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
		19 projects remain <span class="font-medium text-slate-400">planned</span> — they activate when Phase 2 (Tournaments Live) begins Jan 31, 2027.
		<a href="/dashboard/use-of-proceeds" class="text-primary hover:underline ml-1">View Use of Proceeds →</a>
	</p>

</div>

{#if showRaiseModal}
	<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
		onclick={() => showRaiseModal = false}
		onkeydown={(e) => e.key === 'Escape' && (showRaiseModal = false)}
		role="dialog" aria-modal="true">
		<div class="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document">

			<div class="flex items-center justify-between p-5 border-b border-slate-700/60">
				<div>
					<h2 class="text-base font-bold text-white">Set Raise Amount</h2>
					<p class="text-xs text-slate-400 mt-0.5">Total capital received from the seed round</p>
				</div>
				<button type="button" onclick={() => showRaiseModal = false}
					class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
					<X class="size-4" />
				</button>
			</div>

			<div class="p-5 space-y-4">
				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="raiseInput">Amount Received</label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
						<input
							id="raiseInput"
							bind:value={raiseInput}
							type="text"
							inputmode="numeric"
							placeholder="7,500,000"
							class="w-full rounded-lg bg-slate-800 border border-slate-700 pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
						/>
					</div>
					{#if raiseError}
						<p class="text-xs text-red-400">{raiseError}</p>
					{/if}
				</div>

				<!-- Quick presets -->
				<div class="flex flex-wrap gap-2">
					{#each [1_000_000, 2_500_000, 5_000_000, 7_500_000] as preset}
						<button type="button" onclick={() => raiseInput = String(preset)}
							class="px-2.5 py-1 rounded-lg text-xs border transition-colors
								{Number(raiseInput) === preset
									? 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
									: 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}">
							{fmt(preset)}
						</button>
					{/each}
				</div>

				{#if Number(raiseInput) > 0}
					<div class="rounded-lg bg-slate-800/60 border border-slate-700/60 p-3 text-xs space-y-1.5">
						<div class="flex justify-between text-slate-400">
							<span>Raise amount</span><span class="text-white font-medium">{fmt(Number(raiseInput.replace(/[^0-9.]/g, '')))}</span>
						</div>
						<div class="flex justify-between text-slate-400">
							<span>Allocated to projects</span><span class="text-blue-300">{fmt(totalBudget)}</span>
						</div>
						<div class="h-px bg-slate-700"></div>
						<div class="flex justify-between font-semibold">
							<span class="text-slate-300">Unallocated</span>
							<span class="text-emerald-400">{fmt(Number(raiseInput.replace(/[^0-9.]/g, '')) - totalBudget)}</span>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-700/60">
				<button type="button" onclick={() => showRaiseModal = false}
					class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
					Cancel
				</button>
				<button type="button" onclick={saveRaise} disabled={raiseSaving}
					class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
					{#if raiseSaving}<Loader class="size-3.5 animate-spin" />{/if}
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Task detail sheet -->
<TaskDetailModal
	bind:open={taskModalOpen}
	bind:task={selectedTask}
	onUpdated={() => invalidateAll()}
/>

<!-- Log expense from task -->
{#if expenseTask}
	<TaskExpenseModal
		bind:open={expenseModalOpen}
		task={expenseTask}
	/>
{/if}
