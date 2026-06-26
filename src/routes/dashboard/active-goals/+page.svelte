<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Target,
		Clock3,
		CheckSquare,
		DollarSign,
		ArrowRight,
		AlertCircle,
		ChevronDown,
		ChevronRight,
		Info,
		ListTodo,
		FileCheck2,
		ReceiptText,
		Wallet,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const goals = $derived(data.goals ?? []);
	const totals = $derived(data.totals ?? {
		rawGoals: 0,
		activeGoals: 0,
		openTasks: 0,
		needsApproval: 0,
		pendingApprovals: 0,
		submittedSpend: 0,
		approvedSpend: 0,
		paidSpend: 0,
	});

	let headerExpanded = $state(false);
	let expandedTasks = $state<Record<string, boolean>>({});
	let generatingReport = $state<Record<string, boolean>>({});
	let loggingExpense = $state<Record<string, boolean>>({});
	let costModalOpen = $state(false);
	let costModalGoalId = $state('');
	let costModalTask = $state<any | null>(null);
	let costInput = $state('');
	let costError = $state('');
	let savingCost = $state(false);

	function toggleTasks(goalId: string) {
		expandedTasks = { ...expandedTasks, [goalId]: !expandedTasks[goalId] };
	}

	async function generateReport(goal: any) {
		if (generatingReport[goal.id]) return;
		generatingReport = { ...generatingReport, [goal.id]: true };
		try {
			const res = await fetch(`/api/marketing-goals/${goal.id}/report`, { method: 'POST' });
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Failed to generate report');
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const win = window.open(url, '_blank');
			if (!win) {
				const a = document.createElement('a');
				a.href = url;
				a.download = `${goal.goalName.replace(/\s+/g, '-').toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
			setTimeout(() => URL.revokeObjectURL(url), 10000);
		} catch (error) {
			console.error('Goal report generation failed:', error);
			alert('Goal report failed to generate.');
		} finally {
			generatingReport = { ...generatingReport, [goal.id]: false };
		}
	}

	async function logTaskExpense(goalId: string, task: any) {
		if (loggingExpense[task.id]) return;
		const amount = parseAmount(task.actualCost) || parseAmount(task.estimatedCost);
		if (!Number.isFinite(amount) || amount <= 0) {
			alert('Set an estimated or actual cost greater than $0 before logging expense.');
			return;
		}
		loggingExpense = { ...loggingExpense, [task.id]: true };
		try {
			// Mark task as completed - this will trigger expense creation + approval
			const res = await fetch(`/api/marketing-goals/${goalId}/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'completed' }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				const errorMsg = data.message || `HTTP ${res.status}`;
				throw new Error(`Expense logging failed: ${errorMsg}`);
			}
			await invalidateAll();
		} catch (error) {
			console.error('Log expense failed:', error);
			alert(`Could not log expense for this task.\n\nError: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			loggingExpense = { ...loggingExpense, [task.id]: false };
		}
	}

	function openCostModal(goalId: string, task: any) {
		costModalGoalId = goalId;
		costModalTask = task;
		const existing = parseAmount(task.actualCost) || parseAmount(task.estimatedCost);
		costInput = existing > 0 ? String(existing) : '';
		costError = '';
		costModalOpen = true;
	}

	function closeCostModal() {
		costModalOpen = false;
		costModalGoalId = '';
		costModalTask = null;
		costInput = '';
		costError = '';
		savingCost = false;
	}

	async function saveCostAndLogExpense() {
		if (!costModalTask || !costModalGoalId) return;
		const amount = parseAmount(costInput);
		if (!Number.isFinite(amount) || amount <= 0) {
			costError = 'Enter a cost greater than $0.';
			return;
		}

		savingCost = true;
		costError = '';

		try {
			const res = await fetch(`/api/marketing-goals/${costModalGoalId}/tasks/${costModalTask.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ estimatedCost: amount }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || `Failed to save cost (${res.status})`);
			}

			const goalId = costModalGoalId;
			const task = { ...costModalTask, estimatedCost: amount };
			closeCostModal();
			await logTaskExpense(goalId, task);
		} catch (error: any) {
			costError = error?.message || 'Failed to save cost.';
			savingCost = false;
		}
	}

	function fmt(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(amount || 0);
	}

	function fmtDate(value: string | null | undefined) {
		if (!value) return 'No date';
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return 'No date';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function parseAmount(value: unknown): number {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string') {
			const parsed = Number(value.replace(/[$,\s]/g, ''));
			return Number.isFinite(parsed) ? parsed : 0;
		}
		return 0;
	}

	function statusPill(status: string) {
		switch (status) {
			case 'In Progress':
				return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
			case 'On Hold':
				return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
			case 'Not Started':
				return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
			default:
				return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
		}
	}

	function progressBarColor(progress: number) {
		if (progress >= 100) return 'bg-emerald-500';
		if (progress >= 50) return 'bg-blue-500';
		return 'bg-amber-500';
	}

	function goalAccentClass(status: string) {
		switch (status) {
			case 'In Progress':
				return 'from-cyan-500/20 via-blue-500/12 to-slate-950 border-cyan-400/50';
			case 'On Hold':
				return 'from-amber-500/24 via-orange-500/12 to-slate-950 border-amber-400/55';
			case 'Not Started':
				return 'from-violet-500/18 via-slate-500/10 to-slate-950 border-violet-400/45';
			default:
				return 'from-emerald-500/18 via-teal-500/10 to-slate-950 border-emerald-400/45';
		}
	}

	function goalBadgeClass(status: string) {
		switch (status) {
			case 'In Progress':
				return 'bg-cyan-500/20 text-cyan-100 border-cyan-300/40 shadow-[0_0_20px_rgba(34,211,238,0.12)]';
			case 'On Hold':
				return 'bg-amber-500/20 text-amber-100 border-amber-300/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]';
			case 'Not Started':
				return 'bg-violet-500/18 text-violet-100 border-violet-300/35 shadow-[0_0_20px_rgba(139,92,246,0.12)]';
			default:
				return 'bg-emerald-500/18 text-emerald-100 border-emerald-300/35 shadow-[0_0_20px_rgba(16,185,129,0.12)]';
		}
	}

	function goalLayoutVariant(status: string) {
		switch (status) {
			case 'In Progress':
				return 'mission';
			case 'On Hold':
				return 'paused';
			case 'Not Started':
				return 'launch';
			default:
				return 'mission';
		}
	}

	function goalLayoutNote(status: string) {
		switch (status) {
			case 'In Progress':
				return 'Execution is active; keep the pressure on progress and approvals.';
			case 'On Hold':
				return 'Paused work should stay visible so blockers do not disappear.';
			case 'Not Started':
				return 'This goal is still in setup mode; use the card as a launch checklist.';
			default:
				return 'Track the goal using the most important execution signals first.';
		}
	}

	function goalLayoutKicker(status: string) {
		switch (status) {
			case 'In Progress':
				return 'Execution lane';
			case 'On Hold':
				return 'Blocked lane';
			case 'Not Started':
				return 'Launch lane';
			default:
				return 'Goal lane';
		}
	}

	function taskStateClass(status: string) {
		switch (status) {
			case 'in_progress':
				return 'text-blue-300 border-blue-500/30 bg-blue-500/10';
			case 'done':
			case 'completed':
				return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
			case 'todo':
				return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
			case 'blocked':
				return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
			case 'cancelled':
				return 'text-red-300 border-red-500/30 bg-red-500/10';
			default:
				return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
		}
	}

	function taskLabel(status: string) {
		if (status === 'in_progress') return 'In Progress';
		if (status === 'blocked') return 'Blocked';
		if (status === 'needs_approval') return 'Needs Approval';
		if (status === 'expense_created') return 'Expense Created';
		if (status === 'work_order') return 'Work Order';
		if (status === 'approved') return 'Approved';
		if (status === 'done') return 'Done';
		if (status === 'completed') return 'Completed';
		if (status === 'todo') return 'To Do';
		if (status === 'cancelled') return 'Cancelled';
		return status || 'Unknown';
	}
</script>

<svelte:head>
	<title>Active Goals - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
					<Target class="size-3" /> Daily Meeting View
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Active Goals</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Marketing goals currently driving league operations, approvals, and spend execution.
			</p>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<Button href="/dashboard/marketing-goals" variant="outline" size="sm" class="gap-1.5">
				All Marketing Goals <ArrowRight class="size-3.5" />
			</Button>
		</div>
	</div>

	<button type="button" onclick={() => headerExpanded = !headerExpanded} class="w-full text-left group/info">
		<div class="rounded-xl border border-slate-700/60 {headerExpanded ? 'bg-slate-800/80' : 'bg-slate-800/40'} hover:bg-slate-800/80 transition-colors px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div class="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
						<Info class="size-3.5 text-orange-300" />
					</div>
					<p class="text-xs font-medium text-orange-200">
						{headerExpanded ? 'How to run this in standup' : 'What is this page?'}
					</p>
				</div>
				<ChevronDown class="size-4 text-slate-500 group-hover/info:text-slate-300 transition-all duration-200 shrink-0 {headerExpanded ? 'rotate-180' : ''}" />
			</div>
			{#if headerExpanded}
				<div class="text-xs text-orange-100/80 leading-relaxed mt-3 pl-9 space-y-2">
					<p>
						Use this as the marketing ops heartbeat: what goals are active, what tasks are blocking, and what spend is waiting on approvals.
					</p>
					<p>
						Each card consolidates execution: task load, approval pressure, and spend pipeline from submitted to approved to paid.
					</p>
					<p>
						For daily meetings: review top cards first, then expand task lists for goals with overdue work or approval bottlenecks.
					</p>
				</div>
			{/if}
		</div>
	</button>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="p-4 border border-orange-700/40 border-l-4 border-l-orange-400 bg-gradient-to-br from-orange-950/60 via-orange-950/35 to-slate-950 shadow-lg shadow-orange-950/10">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-orange-300/80 font-medium">Active Goals</p>
				<div class="size-7 rounded-lg bg-orange-500/20 ring-1 ring-orange-400/30 flex items-center justify-center">
					<Target class="size-3.5 text-orange-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.activeGoals}</p>
		</Card>

		<Card class="p-4 border border-blue-700/40 border-l-4 border-l-blue-400 bg-gradient-to-br from-blue-950/60 via-blue-950/35 to-slate-950 shadow-lg shadow-blue-950/10">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-blue-300/80 font-medium">Open Tasks</p>
				<div class="size-7 rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center justify-center">
					<ListTodo class="size-3.5 text-blue-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.openTasks}</p>
		</Card>

		<Card class="p-4 border border-amber-700/40 border-l-4 border-l-amber-400 bg-gradient-to-br from-amber-950/60 via-amber-950/35 to-slate-950 shadow-lg shadow-amber-950/10">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-amber-300/80 font-medium">Needs Approval</p>
				<div class="size-7 rounded-lg bg-amber-500/20 ring-1 ring-amber-400/30 flex items-center justify-center">
					<AlertCircle class="size-3.5 text-amber-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.needsApproval}</p>
			<p class="text-[11px] text-amber-300/70 mt-0.5">{totals.pendingApprovals} in queue</p>
		</Card>

		<Card class="p-4 border border-emerald-700/40 border-l-4 border-l-emerald-400 bg-gradient-to-br from-emerald-950/60 via-emerald-950/35 to-slate-950 shadow-lg shadow-emerald-950/10">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-emerald-300/80 font-medium">Approved Spend</p>
				<div class="size-7 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30 flex items-center justify-center">
					<FileCheck2 class="size-3.5 text-emerald-300" />
				</div>
			</div>
			<p class="text-xl font-black text-white">{fmt(totals.approvedSpend)}</p>
		</Card>
	</div>

	{#if goals.length === 0}
		<Card class="p-8 border border-slate-700/60 bg-slate-900/60 text-center">
			<div class="mx-auto mb-3 size-12 rounded-xl bg-slate-800 flex items-center justify-center">
				<Target class="size-6 text-slate-400" />
			</div>
			<h2 class="text-lg font-semibold">No active marketing goals</h2>
			<p class="text-sm text-slate-400 mt-1 mb-4">
				Set a goal status to In Progress to include it here.
			</p>
			{#if totals.rawGoals > 0}
				<p class="text-xs text-slate-500 mb-4">
					Found {totals.rawGoals} total goal(s), but none currently qualify as active.
				</p>
			{/if}
			<Button href="/dashboard/marketing-goals/new" size="sm">Create Goal</Button>
		</Card>
	{:else}
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
			{#each goals as goal}
				<Card class={`relative overflow-hidden p-5 border bg-gradient-to-br ${goalAccentClass(goal.status)} shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(0,0,0,0.45)]`}>
					<div class={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${progressBarColor(goal.progressPct)} opacity-100`}></div>
					<div class="absolute -right-12 -top-12 size-32 rounded-full bg-white/6 blur-3xl pointer-events-none"></div>
					<div class="absolute left-0 top-0 h-full w-1 bg-white/10"></div>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2 mb-2 flex-wrap">
								<span class={`text-[11px] px-2.5 py-0.5 rounded-full border ${goalBadgeClass(goal.status)} uppercase tracking-[0.16em] font-bold`}>{goal.status}</span>
								{#if goal.priority}
									<span class="text-[11px] px-2.5 py-0.5 rounded-full border border-white/15 bg-white/10 text-white/90 uppercase tracking-wide font-medium">{goal.priority}</span>
								{/if}
								<span class="text-[11px] px-2.5 py-0.5 rounded-full border border-white/15 bg-white/10 text-slate-100/90">
									{goal.targetMetric || 'Goal'}
								</span>
							</div>
							<h2 class="text-xl font-black leading-tight text-white tracking-tight">{goal.goalName}</h2>
							<p class="text-sm text-slate-200/90 mt-1 line-clamp-2 max-w-2xl">{goal.description || 'No description provided.'}</p>
						</div>
						<div class="flex flex-col gap-2 shrink-0">
							<Button
								variant="outline"
								size="sm"
								class="gap-1.5"
								onclick={() => generateReport(goal)}
								disabled={generatingReport[goal.id]}
							>
								{generatingReport[goal.id] ? 'Generating...' : 'Report PDF'}
							</Button>
							<Button href={`/dashboard/marketing-goals/${goal.id}`} variant="outline" size="sm" class="gap-1.5">
								View <ArrowRight class="size-3.5" />
							</Button>
						</div>
					</div>

					{@const layoutVariant = goalLayoutVariant(goal.status)}
					{#if layoutVariant === 'mission'}
						<div class="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
							<div class="space-y-2 rounded-2xl border border-white/10 bg-black/15 p-3 backdrop-blur-sm">
								<div class="flex items-center justify-between text-xs">
									<span class="text-slate-100 font-semibold inline-flex items-center gap-1.5"><Target class="size-3.5 text-white" /> Goal Progress</span>
									<span class="text-white font-semibold tabular-nums">{goal.progressPct}%</span>
								</div>
								<div class="h-2.5 rounded-full bg-black/25 overflow-hidden ring-1 ring-white/10">
									<div class={`h-full ${progressBarColor(goal.progressPct)} shadow-[0_0_24px_rgba(255,255,255,0.22)]`} style={`width: ${goal.progressPct}%`}></div>
								</div>
								<div class="text-[11px] text-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
									<span>{goal.currentValue} / {goal.targetValue || 'N/A'} {goal.targetMetric}</span>
									<span class="inline-flex items-center gap-1.5 text-slate-100/80"><Info class="size-3.5" /> {goalLayoutKicker(goal.status)}</span>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-2 text-xs">
								<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
									<p class="text-slate-200/80 flex items-center gap-1.5"><ListTodo class="size-3.5 text-cyan-200" /> Open Tasks</p>
									<p class="text-white font-semibold text-lg mt-1">{goal.counts.open}</p>
								</div>
								<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
									<p class="text-slate-200/80 flex items-center gap-1.5"><AlertCircle class="size-3.5 text-amber-200" /> Needs Approval</p>
									<p class="text-white font-semibold text-lg mt-1">{goal.counts.needsApproval}</p>
								</div>
								<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
									<p class="text-slate-200/80 flex items-center gap-1.5"><ReceiptText class="size-3.5 text-cyan-200" /> Submitted</p>
									<p class="text-cyan-100 font-semibold text-lg mt-1">{fmt(goal.spend.submitted)}</p>
								</div>
								<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
									<p class="text-slate-200/80 flex items-center gap-1.5"><FileCheck2 class="size-3.5 text-emerald-200" /> Approved</p>
									<p class="text-emerald-100 font-semibold text-lg mt-1">{fmt(goal.spend.approved)}</p>
								</div>
							</div>
						</div>

						<div class="mt-4 flex items-center gap-3 text-xs text-slate-200/80 flex-wrap rounded-xl border border-white/10 bg-white/5 px-3 py-2">
							<span class="inline-flex items-center gap-1.5"><Clock3 class="size-3.5 text-cyan-200" /> Next due: {fmtDate(goal.nextDueTask?.dueDate ?? goal.deadline)}</span>
							<span class="inline-flex items-center gap-1.5"><ReceiptText class="size-3.5 text-amber-200" /> Est: {fmt(goal.estimatedTotal)}</span>
							<span class="inline-flex items-center gap-1.5"><Wallet class="size-3.5 text-emerald-200" /> Actual: {fmt(goal.actualTotal)}</span>
							{#if goal.withWorkOrder > 0}
								<span class="inline-flex items-center gap-1.5"><CheckSquare class="size-3.5 text-violet-200" /> WO: {goal.withWorkOrder}</span>
							{/if}
						</div>
					{:else if layoutVariant === 'paused'}
						<div class="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
							<div class="space-y-4">
								<div class="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 shadow-[0_18px_50px_rgba(245,158,11,0.08)]">
									<div class="flex items-start justify-between gap-3">
										<div>
											<p class="text-[11px] uppercase tracking-[0.22em] text-amber-200/80 font-bold">{goalLayoutKicker(goal.status)}</p>
											<h3 class="mt-1 text-lg font-black text-white">Paused work needs attention</h3>
											<p class="mt-2 text-sm text-amber-50/80 leading-relaxed">{goalLayoutNote(goal.status)}</p>
										</div>
										<div class="size-10 rounded-xl bg-amber-500/20 ring-1 ring-amber-300/30 flex items-center justify-center shrink-0">
											<AlertCircle class="size-5 text-amber-200" />
										</div>
									</div>
									<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
										<div class="rounded-xl border border-white/10 bg-black/15 p-3">
											<p class="text-amber-100/75 flex items-center gap-1.5"><ListTodo class="size-3.5" /> Open Tasks</p>
											<p class="text-white font-semibold text-lg mt-1">{goal.counts.open}</p>
										</div>
										<div class="rounded-xl border border-white/10 bg-black/15 p-3">
											<p class="text-amber-100/75 flex items-center gap-1.5"><AlertCircle class="size-3.5" /> Needs Approval</p>
											<p class="text-white font-semibold text-lg mt-1">{goal.counts.needsApproval}</p>
										</div>
										<div class="rounded-xl border border-white/10 bg-black/15 p-3">
											<p class="text-amber-100/75 flex items-center gap-1.5"><Clock3 class="size-3.5" /> Next Due</p>
											<p class="text-white font-semibold text-sm mt-1">{fmtDate(goal.nextDueTask?.dueDate ?? goal.deadline)}</p>
										</div>
										<div class="rounded-xl border border-white/10 bg-black/15 p-3">
											<p class="text-amber-100/75 flex items-center gap-1.5"><ReceiptText class="size-3.5" /> Est Spend</p>
											<p class="text-white font-semibold text-sm mt-1">{fmt(goal.estimatedTotal)}</p>
										</div>
									</div>
								</div>

								<div class="rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm space-y-2">
									<div class="flex items-center justify-between text-xs">
										<span class="text-amber-100/90 font-semibold inline-flex items-center gap-1.5"><Target class="size-3.5" /> Progress frozen</span>
										<span class="text-white font-semibold tabular-nums">{goal.progressPct}%</span>
									</div>
									<div class="h-2.5 rounded-full bg-black/25 overflow-hidden ring-1 ring-white/10">
										<div class={`h-full ${progressBarColor(goal.progressPct)} shadow-[0_0_24px_rgba(255,255,255,0.22)]`} style={`width: ${goal.progressPct}%`}></div>
									</div>
									<div class="text-[11px] text-amber-50/75 flex items-center justify-between gap-3 flex-wrap">
										<span>{goal.currentValue} / {goal.targetValue || 'N/A'} {goal.targetMetric}</span>
										<span class="inline-flex items-center gap-1.5 text-amber-100/80"><Info class="size-3.5" /> Keep blocked work visible</span>
									</div>
								</div>
							</div>

							<div class="space-y-4">
								<div class="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20">
									<div class="flex items-center justify-between gap-3 mb-3">
										<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-100/80">Pause signals</p>
										<span class={`text-[11px] px-2.5 py-0.5 rounded-full border ${goalBadgeClass(goal.status)} uppercase tracking-[0.16em] font-bold`}>{goal.status}</span>
									</div>
									<div class="space-y-2 text-xs">
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="text-slate-200/80 inline-flex items-center gap-1.5"><ReceiptText class="size-3.5 text-cyan-200" /> Submitted</span>
											<span class="text-cyan-100 font-semibold">{fmt(goal.spend.submitted)}</span>
										</div>
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="text-slate-200/80 inline-flex items-center gap-1.5"><FileCheck2 class="size-3.5 text-emerald-200" /> Approved</span>
											<span class="text-emerald-100 font-semibold">{fmt(goal.spend.approved)}</span>
										</div>
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="text-slate-200/80 inline-flex items-center gap-1.5"><Wallet class="size-3.5 text-violet-200" /> Actual</span>
											<span class="text-violet-100 font-semibold">{fmt(goal.actualTotal)}</span>
										</div>
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="text-slate-200/80 inline-flex items-center gap-1.5"><CheckSquare class="size-3.5 text-violet-200" /> Work Orders</span>
											<span class="text-violet-100 font-semibold">{goal.withWorkOrder}</span>
										</div>
									</div>
								</div>
								<div class="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-100/80 mb-2">What to unblock next</p>
									<div class="grid gap-2 text-[11px] text-slate-200/80">
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="inline-flex items-center gap-1.5"><ArrowRight class="size-3.5 text-amber-200" /> Review blockers</span>
											<span class="font-medium text-white">{goal.counts.needsApproval} pending</span>
										</div>
										<div class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
											<span class="inline-flex items-center gap-1.5"><Clock3 class="size-3.5 text-cyan-200" /> Re-check due</span>
											<span class="font-medium text-white">{fmtDate(goal.nextDueTask?.dueDate ?? goal.deadline)}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="mt-5 space-y-4">
							<div class="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 shadow-[0_18px_50px_rgba(139,92,246,0.08)]">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-[11px] uppercase tracking-[0.22em] text-violet-200/80 font-bold">{goalLayoutKicker(goal.status)}</p>
										<h3 class="mt-1 text-lg font-black text-white">Launch checklist</h3>
										<p class="mt-2 text-sm text-violet-50/80 leading-relaxed">{goalLayoutNote(goal.status)}</p>
									</div>
									<div class="size-10 rounded-xl bg-violet-500/20 ring-1 ring-violet-300/30 flex items-center justify-center shrink-0">
										<Target class="size-5 text-violet-200" />
									</div>
								</div>
								<div class="mt-4 grid gap-3 md:grid-cols-3">
									<div class="rounded-xl border border-white/10 bg-black/15 p-3">
										<p class="text-violet-100/75 flex items-center gap-1.5 text-xs"><ListTodo class="size-3.5" /> 1. Prep work</p>
										<p class="text-white font-semibold text-lg mt-1">{goal.counts.open}</p>
										<p class="text-[11px] text-violet-50/70 mt-1">Open tasks are the setup queue.</p>
									</div>
									<div class="rounded-xl border border-white/10 bg-black/15 p-3">
										<p class="text-violet-100/75 flex items-center gap-1.5 text-xs"><AlertCircle class="size-3.5" /> 2. Approval path</p>
										<p class="text-white font-semibold text-lg mt-1">{goal.counts.needsApproval}</p>
										<p class="text-[11px] text-violet-50/70 mt-1">Approvals should be cleared before launch.</p>
									</div>
									<div class="rounded-xl border border-white/10 bg-black/15 p-3">
										<p class="text-violet-100/75 flex items-center gap-1.5 text-xs"><Clock3 class="size-3.5" /> 3. Launch date</p>
										<p class="text-white font-semibold text-sm mt-1">{fmtDate(goal.nextDueTask?.dueDate ?? goal.deadline)}</p>
										<p class="text-[11px] text-violet-50/70 mt-1">Use this as the first hard stop.</p>
									</div>
								</div>
							</div>

							<div class="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
								<div class="space-y-2 rounded-2xl border border-white/10 bg-black/15 p-3 backdrop-blur-sm">
									<div class="flex items-center justify-between text-xs">
										<span class="text-slate-100 font-semibold inline-flex items-center gap-1.5"><Target class="size-3.5 text-white" /> Launch readiness</span>
										<span class="text-white font-semibold tabular-nums">{goal.progressPct}%</span>
									</div>
									<div class="h-2.5 rounded-full bg-black/25 overflow-hidden ring-1 ring-white/10">
										<div class={`h-full ${progressBarColor(goal.progressPct)} shadow-[0_0_24px_rgba(255,255,255,0.22)]`} style={`width: ${goal.progressPct}%`}></div>
									</div>
									<div class="text-[11px] text-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
										<span>{goal.currentValue} / {goal.targetValue || 'N/A'} {goal.targetMetric}</span>
										<span class="inline-flex items-center gap-1.5 text-slate-100/80"><Info class="size-3.5" /> Build before launch</span>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-2 text-xs">
									<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
										<p class="text-slate-200/80 flex items-center gap-1.5"><ReceiptText class="size-3.5 text-cyan-200" /> Submitted</p>
										<p class="text-cyan-100 font-semibold text-lg mt-1">{fmt(goal.spend.submitted)}</p>
									</div>
									<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
										<p class="text-slate-200/80 flex items-center gap-1.5"><FileCheck2 class="size-3.5 text-emerald-200" /> Approved</p>
										<p class="text-emerald-100 font-semibold text-lg mt-1">{fmt(goal.spend.approved)}</p>
									</div>
									<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
										<p class="text-slate-200/80 flex items-center gap-1.5"><Wallet class="size-3.5 text-violet-200" /> Actual</p>
										<p class="text-violet-100 font-semibold text-lg mt-1">{fmt(goal.actualTotal)}</p>
									</div>
									<div class="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
										<p class="text-slate-200/80 flex items-center gap-1.5"><CheckSquare class="size-3.5 text-violet-200" /> WO</p>
										<p class="text-violet-100 font-semibold text-lg mt-1">{goal.withWorkOrder}</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<div class="mt-4 border-t border-slate-800 pt-3">
						<button type="button" onclick={() => toggleTasks(goal.id)} class="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors">
							<span class="inline-flex items-center gap-1.5">
								<ListTodo class="size-3.5" />
								Task list ({goal.tasks.length})
							</span>
							{#if expandedTasks[goal.id]}
								<ChevronDown class="size-3.5" />
							{:else}
								<ChevronRight class="size-3.5" />
							{/if}
						</button>

						{#if expandedTasks[goal.id]}
							<div class="mt-3 space-y-2">
								{#if goal.tasks.length === 0}
									<p class="text-xs text-slate-500">No tasks on this goal yet.</p>
								{:else}
									{#each goal.tasks.slice(0, 8) as task}
										<div class="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2">
											<div class="flex items-start justify-between gap-2">
												<p class="text-sm text-slate-200 font-medium leading-tight">{task.title}</p>
												<span class="text-[10px] px-2 py-0.5 rounded border {taskStateClass(task.status)}">{taskLabel(task.status)}</span>
											</div>
											<div class="mt-1 flex items-center justify-between gap-3 text-[11px] text-slate-500">
												<div class="flex items-center gap-3">
													<span>Due: {fmtDate(task.dueDate)}</span>
													{#if task.estimatedCost}
														<span>Est: {fmt(task.estimatedCost)}</span>
													{/if}
													{#if task.actualCost}
														<span>Actual: {fmt(task.actualCost)}</span>
													{/if}
												</div>
												{#if ['todo', 'in_progress'].includes(task.status)}
													{@const logAmount = parseAmount(task.actualCost) || parseAmount(task.estimatedCost)}
													<button
														type="button"
														onclick={() => logAmount > 0 ? logTaskExpense(goal.id, task) : openCostModal(goal.id, task)}
														disabled={loggingExpense[task.id]}
														title={!Number.isFinite(logAmount) || logAmount <= 0 ? 'Set estimated or actual cost first' : 'Log expense'}
														class="inline-flex items-center gap-1 rounded-md border border-emerald-700/50 bg-emerald-950/40 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50"
													>
														<DollarSign class="size-3" />
														{loggingExpense[task.id] ? 'Logging...' : (!Number.isFinite(logAmount) || logAmount <= 0 ? 'Set Cost First' : 'Log Expense')}
													</button>
												{/if}
											</div>
										</div>
									{/each}
									{#if goal.tasks.length > 8}
										<p class="text-[11px] text-slate-500">Showing first 8 tasks. Open goal detail for full list.</p>
									{/if}
								{/if}
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			<Card class="p-4 border border-blue-700/40 bg-gradient-to-br from-blue-950/35 to-slate-950">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-7 rounded-lg bg-blue-500/15 ring-1 ring-blue-400/25 flex items-center justify-center">
						<ReceiptText class="size-3.5 text-blue-300" />
					</div>
					<p class="text-xs text-blue-300/80 font-medium">Submitted Spend</p>
				</div>
				<p class="text-lg font-semibold text-white">{fmt(totals.submittedSpend)}</p>
			</Card>
			<Card class="p-4 border border-emerald-700/40 bg-gradient-to-br from-emerald-950/35 to-slate-950">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-7 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/25 flex items-center justify-center">
						<CheckSquare class="size-3.5 text-emerald-300" />
					</div>
					<p class="text-xs text-emerald-300/80 font-medium">Approved Spend</p>
				</div>
				<p class="text-lg font-semibold text-white">{fmt(totals.approvedSpend)}</p>
			</Card>
			<Card class="p-4 border border-teal-700/40 bg-gradient-to-br from-teal-950/35 to-slate-950">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-7 rounded-lg bg-teal-500/15 ring-1 ring-teal-400/25 flex items-center justify-center">
						<Wallet class="size-3.5 text-teal-300" />
					</div>
					<p class="text-xs text-teal-300/80 font-medium">Paid Spend</p>
				</div>
				<p class="text-lg font-semibold text-white">{fmt(totals.paidSpend)}</p>
			</Card>
		</div>
	{/if}
</div>

{#if costModalOpen && costModalTask}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
		<div class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
			<h3 class="text-base font-semibold text-white">Set Task Cost</h3>
			<p class="mt-1 text-xs text-slate-400">{costModalTask.title}</p>

			<label class="mt-4 block text-xs font-medium text-slate-300">Estimated Cost</label>
			<input
				type="text"
				bind:value={costInput}
				placeholder="e.g. 800"
				class="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
			/>

			{#if costError}
				<p class="mt-2 text-xs text-red-300">{costError}</p>
			{/if}

			<div class="mt-5 flex items-center justify-end gap-2">
				<Button variant="outline" size="sm" onclick={closeCostModal} disabled={savingCost}>Cancel</Button>
				<Button size="sm" onclick={saveCostAndLogExpense} disabled={savingCost}>
					{savingCost ? 'Saving...' : 'Save & Log Expense'}
				</Button>
			</div>
		</div>
	</div>
{/if}
