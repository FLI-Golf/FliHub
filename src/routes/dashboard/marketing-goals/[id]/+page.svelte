<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData } from './$types';
	import {
		ArrowLeft, Target, Calendar, TrendingUp, Flag,
		Plus, X, CheckCircle2, Clock, AlertCircle,
		ChevronDown, ChevronUp, DollarSign, FileText,
		Hammer, ClipboardCheck, Circle, ArrowRight, Zap
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const goal = $derived(data.goal);

	const getStatusColor = (s: string) => ({
		'In Progress': 'bg-green-600 text-white',
		'Completed':   'bg-blue-600 text-white',
		'Not Started': 'bg-gray-600 text-white',
		'On Hold':     'bg-amber-600 text-white',
		'At Risk':     'bg-red-600 text-white'
	}[s] ?? 'bg-gray-600 text-white');

	const getPriorityColor = (p: string) => ({
		'High':   'bg-red-600 text-white',
		'Medium': 'bg-amber-600 text-white',
		'Low':    'bg-green-600 text-white',
		'Urgent': 'bg-red-700 text-white'
	}[p] ?? 'bg-gray-600 text-white');

	const formatDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

	const fmtShort = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);

	const progress = $derived(
		goal.targetValue ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100) : 0
	);

	// ── Task pipeline stages ──────────────────────────────────────────────────

	const STAGES = [
		{ key: 'todo',            label: 'To Do',          icon: Circle,        color: 'text-slate-400',   bg: 'bg-slate-700/40 border-slate-600' },
		{ key: 'in_progress',     label: 'In Progress',    icon: Clock,         color: 'text-blue-400',    bg: 'bg-blue-900/30 border-blue-700' },
		{ key: 'needs_approval',  label: 'Needs Approval', icon: AlertCircle,   color: 'text-yellow-400',  bg: 'bg-yellow-900/30 border-yellow-700' },
		{ key: 'approved',        label: 'Approved',       icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700' },
		{ key: 'expense_created', label: 'Expense',        icon: DollarSign,    color: 'text-orange-400',  bg: 'bg-orange-900/30 border-orange-700' },
		{ key: 'work_order',      label: 'Work Order',     icon: Hammer,        color: 'text-purple-400',  bg: 'bg-purple-900/30 border-purple-700' },
		{ key: 'completed',       label: 'Completed',      icon: ClipboardCheck,color: 'text-teal-400',    bg: 'bg-teal-900/30 border-teal-700' },
		{ key: 'cancelled',       label: 'Cancelled',      icon: X,             color: 'text-red-400',     bg: 'bg-red-900/20 border-red-800' }
	];

	const PRIORITY_COLORS: Record<string, string> = {
		low:    'bg-slate-700 text-slate-300 border-slate-600',
		medium: 'bg-amber-900/50 text-amber-300 border-amber-700',
		high:   'bg-red-900/50 text-red-300 border-red-700',
		urgent: 'bg-red-800 text-red-200 border-red-600'
	};

	// ── Task state ────────────────────────────────────────────────────────────

	let tasks = $state<any[]>(data.tasks ?? []);
	let taskStats = $state(data.taskStats);
	let expandedTask = $state<string | null>(null);
	let movingTask = $state<string | null>(null);
	let taskError = $state('');

	async function moveTask(taskId: string, newStatus: string) {
		movingTask = taskId;
		taskError = '';
		try {
			const res = await fetch(`/api/marketing-goals/${goal.id}/tasks/${taskId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed'); }
			await invalidateAll();
			tasks = data.tasks ?? [];
			taskStats = data.taskStats;
		} catch (e: any) {
			taskError = e.message ?? 'Move failed';
		} finally {
			movingTask = null;
		}
	}

	async function deleteTask(taskId: string) {
		if (!confirm('Delete this task?')) return;
		await fetch(`/api/marketing-goals/${goal.id}/tasks/${taskId}`, { method: 'DELETE' });
		await invalidateAll();
		tasks = data.tasks ?? [];
		taskStats = data.taskStats;
		if (expandedTask === taskId) expandedTask = null;
	}

	// ── New task form ─────────────────────────────────────────────────────────

	let showNewTask = $state(false);
	let newBusy = $state(false);
	let newErr = $state('');
	let newForm = $state({ title: '', description: '', priority: 'medium', dueDate: '', estimatedCost: '', progressContribution: '', notes: '' });

	async function submitNewTask(e: SubmitEvent) {
		e.preventDefault();
		if (!newForm.title.trim()) { newErr = 'Title is required'; return; }
		newBusy = true; newErr = '';
		try {
			const res = await fetch(`/api/marketing-goals/${goal.id}/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...newForm,
					estimatedCost:        newForm.estimatedCost        ? Number(newForm.estimatedCost)        : null,
					progressContribution: newForm.progressContribution ? Number(newForm.progressContribution) : null
				})
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed'); }
			showNewTask = false;
			newForm = { title: '', description: '', priority: 'medium', dueDate: '', estimatedCost: '', progressContribution: '', notes: '' };
			await invalidateAll();
			tasks = data.tasks ?? [];
			taskStats = data.taskStats;
		} catch (err: any) {
			newErr = err.message ?? 'Failed';
		} finally {
			newBusy = false;
		}
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';

	// Next valid stage transitions
	function nextStages(current: string): typeof STAGES {
		const idx = STAGES.findIndex(s => s.key === current);
		if (idx < 0) return [];
		// Can always cancel; can move forward one step or back to in_progress
		const forward = STAGES.slice(idx + 1).filter(s => s.key !== 'cancelled');
		const cancel = current !== 'cancelled' ? [STAGES.find(s => s.key === 'cancelled')!] : [];
		return [...forward, ...cancel];
	}
</script>

<div class="container mx-auto p-6 space-y-6 max-w-4xl">

	<!-- Back -->
	<Button href="/dashboard/marketing-goals" variant="outline" size="sm" class="gap-2">
		<ArrowLeft class="size-4" /> Back to Goals
	</Button>

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-3 mb-2">
				<Target class="size-7 text-blue-400 shrink-0" />
				<h1 class="text-3xl font-bold text-white">{goal.goalName}</h1>
			</div>
			<p class="text-gray-400">{goal.description || 'No description provided'}</p>
		</div>
		<div class="flex gap-2 shrink-0">
			<Badge class={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
			<Badge class={getStatusColor(goal.status)}>{goal.status}</Badge>
		</div>
	</div>

	<!-- Stats cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
			<div class="flex items-center gap-3">
				<Calendar class="size-5 text-gray-400 shrink-0" />
				<div>
					<div class="text-xs text-gray-400 uppercase tracking-wide">Deadline</div>
					<div class="text-base font-semibold text-white mt-0.5">{formatDate(goal.deadline)}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
			<div class="flex items-center gap-3">
				<Flag class="size-5 text-gray-400 shrink-0" />
				<div>
					<div class="text-xs text-gray-400 uppercase tracking-wide">Category</div>
					<div class="text-base font-semibold text-white mt-0.5">{goal.category || 'N/A'}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
			<div class="flex items-center gap-3">
				<TrendingUp class="size-5 text-gray-400 shrink-0" />
				<div>
					<div class="text-xs text-gray-400 uppercase tracking-wide">Target Metric</div>
					<div class="text-base font-semibold text-white mt-0.5">{goal.targetMetric || 'N/A'}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-5 rounded-xl border border-gray-700">
			<div>
				<div class="text-xs text-gray-400 uppercase tracking-wide">Values</div>
				<div class="text-base font-semibold text-white mt-0.5">{goal.currentValue ?? 0} / {goal.targetValue ?? 0}</div>
			</div>
		</div>
	</div>

	<!-- Progress bar -->
	<div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-2">
				<h3 class="text-base font-semibold text-white">Progress</h3>
				{#if goal.progressMode === 'task_driven'}
					<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-emerald-900/40 text-emerald-400 border-emerald-700">
						Task-driven
					</span>
				{:else}
					<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium bg-slate-700 text-slate-400 border-slate-600">
						Manual
					</span>
				{/if}
			</div>
			<span class="text-sm font-bold {progress >= 100 ? 'text-green-400' : progress >= 50 ? 'text-blue-400' : 'text-amber-400'}">
				{progress}%
			</span>
		</div>
		<div class="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
			<div class="h-full rounded-full transition-all duration-500
			            {progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}"
			     style="width: {progress}%"></div>
		</div>
		<div class="flex justify-between mt-2 text-xs text-gray-400">
			<span>0</span>
			<span class="text-white">Current: {goal.currentValue ?? 0}</span>
			<span>Target: {goal.targetValue ?? 0}</span>
		</div>
		{#if goal.progressMode === 'task_driven'}
			{@const totalContrib = tasks.filter((t: any) => t.progressContribution).reduce((s: number, t: any) => s + (t.progressContribution ?? 0), 0)}
			{@const doneContrib  = tasks.filter((t: any) => t.status === 'completed' && t.progressContribution).reduce((s: number, t: any) => s + (t.progressContribution ?? 0), 0)}
			<p class="text-xs text-slate-500 mt-2">
				Tasks contribute <span class="text-slate-300">{doneContrib}</span> of <span class="text-slate-300">{totalContrib}</span> possible units
				· baseline <span class="text-slate-300">{goal.progressBaseline ?? 0}</span>
			</p>
		{/if}
	</div>

	<!-- ── Tasks section ──────────────────────────────────────────────────── -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-white">Tasks</h2>
				<p class="text-xs text-slate-400 mt-0.5">
					Each task moves through an approval pipeline and can become an expense or work order.
				</p>
			</div>
			<Button onclick={() => showNewTask = true}
				class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-4" /> Add Task
			</Button>
		</div>

		<!-- Task stats strip -->
		{#if taskStats.total > 0}
			<div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
				{#each STAGES as stage}
					{@const count = (taskStats as any)[stage.key === 'in_progress' ? 'inProgress' : stage.key === 'needs_approval' ? 'needsApproval' : stage.key === 'expense_created' ? 'expenseCreated' : stage.key === 'work_order' ? 'workOrder' : stage.key] ?? 0}
					{#if count > 0}
						<div class="rounded-lg border px-2 py-1.5 text-center {stage.bg}">
							<p class="text-lg font-bold {stage.color}">{count}</p>
							<p class="text-[9px] text-slate-500 leading-tight">{stage.label}</p>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Cost summary -->
			{#if taskStats.totalEstimated > 0 || taskStats.totalActual > 0}
				<div class="flex gap-4 text-sm text-slate-400">
					{#if taskStats.totalEstimated > 0}
						<span>Est. cost: <span class="text-slate-200 font-medium">{fmt$(taskStats.totalEstimated)}</span></span>
					{/if}
					{#if taskStats.totalActual > 0}
						<span>Actual: <span class="text-slate-200 font-medium">{fmt$(taskStats.totalActual)}</span></span>
					{/if}
				</div>
			{/if}
		{/if}

		{#if taskError}
			<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
				<AlertCircle class="size-4 shrink-0" />{taskError}
			</div>
		{/if}

		<!-- Pipeline stage flow diagram -->
		<div class="flex items-center gap-1 overflow-x-auto pb-1">
			{#each STAGES.filter(s => s.key !== 'cancelled') as stage, i}
				<div class="flex items-center gap-1 shrink-0">
					<div class="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium {stage.bg} {stage.color}">
						<svelte:component this={stage.icon} class="size-3" />
						{stage.label}
					</div>
					{#if i < STAGES.filter(s => s.key !== 'cancelled').length - 1}
						<ArrowRight class="size-3 text-slate-600 shrink-0" />
					{/if}
				</div>
			{/each}
		</div>

		<!-- Task list -->
		{#if tasks.length === 0}
			<div class="rounded-xl border border-dashed border-slate-700 p-10 text-center">
				<ClipboardCheck class="size-8 text-slate-600 mx-auto mb-3" />
				<p class="text-slate-400 text-sm">No tasks yet.</p>
				<p class="text-slate-600 text-xs mt-1">Add tasks to track the work needed to achieve this goal.</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each tasks as task (task.id)}
					{@const stage = STAGES.find(s => s.key === task.status) ?? STAGES[0]}
					{@const isExpanded = expandedTask === task.id}
					{@const isMoving = movingTask === task.id}

					<Card class="overflow-hidden border-slate-700 bg-slate-800/50">
						<!-- Task header row -->
						<button
							onclick={() => expandedTask = isExpanded ? null : task.id}
							class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/40 transition-colors text-left"
						>
							<!-- Stage icon -->
							<svelte:component this={stage.icon} class="size-4 {stage.color} shrink-0" />

							<!-- Title -->
							<span class="flex-1 text-sm font-medium text-slate-100 truncate">{task.title}</span>

							<!-- Priority badge -->
							<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0
							            {PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}">
								{task.priority}
							</span>

							<!-- Stage badge -->
							<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 {stage.bg} {stage.color}">
								{stage.label}
							</span>

							<!-- Due date -->
							{#if task.dueDate}
								<span class="text-[10px] text-slate-500 shrink-0">{fmtShort(task.dueDate)}</span>
							{/if}

							<!-- Cost -->
							{#if task.estimatedCost}
								<span class="text-[10px] text-slate-500 shrink-0">{fmt$(task.estimatedCost)}</span>
							{/if}

							{#if isExpanded}
								<ChevronUp class="size-4 text-slate-500 shrink-0" />
							{:else}
								<ChevronDown class="size-4 text-slate-500 shrink-0" />
							{/if}
						</button>

						<!-- Expanded detail -->
						{#if isExpanded}
							<div class="border-t border-slate-700 px-4 py-4 space-y-4">

								{#if task.description}
									<p class="text-sm text-slate-300 leading-relaxed">{task.description}</p>
								{/if}

								<!-- Meta grid -->
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400">
									{#if task.dueDate}
										<div><span class="text-slate-500">Due:</span> <span class="text-slate-200">{formatDate(task.dueDate)}</span></div>
									{/if}
									{#if task.estimatedCost}
										<div><span class="text-slate-500">Est:</span> <span class="text-slate-200">{fmt$(task.estimatedCost)}</span></div>
									{/if}
									{#if task.actualCost}
										<div><span class="text-slate-500">Actual:</span> <span class="text-slate-200">{fmt$(task.actualCost)}</span></div>
									{/if}
									{#if task.assignedTo}
										<div><span class="text-slate-500">Assigned:</span> <span class="text-slate-200">{task.assignedTo}</span></div>
									{/if}
									{#if task.approvedAt}
										<div><span class="text-slate-500">Approved:</span> <span class="text-emerald-400">{fmtShort(task.approvedAt)}</span></div>
									{/if}
									{#if task.progressContribution}
										<div class="flex items-center gap-1">
											<TrendingUp class="size-3 text-emerald-400 shrink-0" />
											<span class="text-slate-500">Contributes:</span>
											<span class="text-emerald-400 font-semibold">+{task.progressContribution}</span>
											{#if task.status === 'completed'}
												<span class="text-emerald-600 text-[10px]">✓ applied</span>
											{:else}
												<span class="text-slate-600 text-[10px]">on completion</span>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Linked records -->
								{#if task.approval || task.expense || task.workOrder}
									<div class="space-y-1.5">
										<p class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Linked Records</p>
										{#if task.approval}
											<div class="flex items-center gap-2 text-xs">
												<ClipboardCheck class="size-3.5 text-yellow-400 shrink-0" />
												<span class="text-slate-400">Approval:</span>
												<span class="font-medium {task.approval.status === 'approved' ? 'text-emerald-400' : task.approval.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}">
													{task.approval.status}
												</span>
											</div>
										{/if}
										{#if task.expense}
											<div class="flex items-center gap-2 text-xs">
												<DollarSign class="size-3.5 text-orange-400 shrink-0" />
												<span class="text-slate-400">Expense:</span>
												<a href="/dashboard/expenses" class="text-orange-400 hover:underline">{task.expense.title}</a>
												<span class="text-slate-500">{fmt$(task.expense.amount)}</span>
											</div>
										{/if}
										{#if task.workOrder}
											<div class="flex items-center gap-2 text-xs">
												<Hammer class="size-3.5 text-purple-400 shrink-0" />
												<span class="text-slate-400">Work Order:</span>
												<a href="/dashboard/work-orders" class="text-purple-400 hover:underline">
													{task.workOrder.workOrderNumber ?? task.workOrder.title}
												</a>
												<span class="text-slate-500">{task.workOrder.status}</span>
											</div>
										{/if}
									</div>
								{/if}

								{#if task.notes}
									<p class="text-xs text-slate-500 italic">{task.notes}</p>
								{/if}

								<!-- Stage move buttons -->
								<div class="flex flex-wrap items-center gap-2 pt-1">
									<span class="text-[10px] text-slate-500 uppercase tracking-wide">Move to:</span>
									{#each nextStages(task.status) as next}
										<button
											onclick={() => moveTask(task.id, next.key)}
											disabled={isMoving}
											class="flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-medium
											       transition-colors hover:opacity-80 disabled:opacity-40 {next.bg} {next.color}"
										>
											<svelte:component this={next.icon} class="size-3" />
											{next.label}
										</button>
									{/each}

									<div class="flex-1"></div>

									<button
										onclick={() => deleteTask(task.id)}
										class="text-[10px] text-red-500 hover:text-red-300 transition-colors ml-auto"
									>
										Delete
									</button>
								</div>
							</div>
						{/if}
					</Card>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Details -->
	<div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
		<h3 class="text-base font-semibold text-white mb-4">Details</h3>
		<div class="grid grid-cols-2 gap-4 text-sm">
			<div><span class="text-gray-400">Created:</span><span class="text-white ml-2">{formatDate(goal.created)}</span></div>
			<div><span class="text-gray-400">Last Updated:</span><span class="text-white ml-2">{formatDate(goal.updated)}</span></div>
			<div><span class="text-gray-400">Status:</span><span class="text-white ml-2">{goal.status}</span></div>
			<div><span class="text-gray-400">Priority:</span><span class="text-white ml-2">{goal.priority}</span></div>
		</div>
	</div>

	{#if goal.description}
		<div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
			<h3 class="text-base font-semibold text-white mb-4">Description</h3>
			<p class="text-gray-300 whitespace-pre-wrap">{goal.description}</p>
		</div>
	{/if}

</div>

<!-- New task modal -->
{#if showNewTask}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
		role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="text-base font-semibold text-slate-100">New Task</h2>
				<button onclick={() => showNewTask = false} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<form onsubmit={submitNewTask} class="p-5 space-y-4">
				{#if newErr}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{newErr}</p>
				{/if}
				<div>
					<label class={LABEL}>Title *</label>
					<input bind:value={newForm.title} class={INPUT} placeholder="e.g. Set up A/B test for subject lines" required />
				</div>
				<div>
					<label class={LABEL}>Description</label>
					<textarea bind:value={newForm.description} rows="2" class="{INPUT} resize-none"
						placeholder="What needs to be done?"></textarea>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Priority</label>
						<select bind:value={newForm.priority} class={INPUT}>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>
					<div>
						<label class={LABEL}>Due Date</label>
						<input bind:value={newForm.dueDate} type="date" class={INPUT} />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Estimated Cost ($)</label>
						<input bind:value={newForm.estimatedCost} type="number" min="0" class={INPUT} placeholder="0" />
					</div>
					<div>
						<label class={LABEL}>Progress Contribution</label>
						<input bind:value={newForm.progressContribution} type="number" min="0" class={INPUT} placeholder="0" />
						<p class="text-[10px] text-slate-500 mt-1">Added to goal value on completion</p>
					</div>
				</div>
				<div>
					<label class={LABEL}>Notes</label>
					<textarea bind:value={newForm.notes} rows="2" class="{INPUT} resize-none"
						placeholder="Internal notes…"></textarea>
				</div>
				<div class="flex justify-end gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showNewTask = false}
						class="border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={newBusy}
						class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
						<Plus class="size-4" />{newBusy ? 'Adding…' : 'Add Task'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
