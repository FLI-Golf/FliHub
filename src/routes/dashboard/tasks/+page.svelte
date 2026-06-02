<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import AddTaskModal from '$lib/components/tasks/add-task-modal.svelte';
	import EditTaskModal from '$lib/components/tasks/edit-task-modal.svelte';
	import TaskExpenseModal from '$lib/components/expenses/task-expense-modal.svelte';
	import { Plus, Search, Receipt, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// ── Modals ────────────────────────────────────────────────────────────────
	let showAddModal     = $state(false);
	let showEditModal    = $state(false);
	let showExpenseModal = $state(false);
	let selectedTask     = $state<any>(null);

	function openEdit(task: any) { selectedTask = task; showEditModal = true; }
	function openExpense(e: MouseEvent, task: any) {
		e.stopPropagation();
		selectedTask = task;
		showExpenseModal = true;
	}

	// ── Column visibility ─────────────────────────────────────────────────────
	let showColMenu = $state(false);
	let visibleCols = $state({
		status: true, priority: true, project: true, assignedTo: true,
		startDate: true, dueDate: true, hours: true, budget: true,
		subtasks: true, tags: true
	});

	// ── Filters ───────────────────────────────────────────────────────────────
	let search     = $state('');
	let fStatus    = $state('all');
	let fPriority  = $state('all');
	let fProject   = $state('all');
	let fAssignee  = $state('all');

	// ── Sorting ───────────────────────────────────────────────────────────────
	type SortCol = 'title' | 'status' | 'priority' | 'project' | 'assignedTo' | 'startDate' | 'dueDate' | 'budget' | 'hours';
	let sortCol = $state<SortCol>('title');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortCol = col; sortDir = 'asc'; }
	}

	// ── Derived ───────────────────────────────────────────────────────────────
	let tasks = $derived(data.tasks ?? []);

	let projects = $derived(
		[...new Map(
			tasks.filter((t: any) => t.expand?.projectId)
				.map((t: any) => [t.expand.projectId.id, t.expand.projectId])
		).values()]
	);

	let assignees = $derived(
		[...new Map(
			tasks.flatMap((t: any) => t.expand?.assignedTo ?? [])
				.map((u: any) => [u.id, { id: u.id, name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email }])
		).values()].sort((a, b) => a.name.localeCompare(b.name))
	);

	const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
	const STATUS_ORDER:   Record<string, number> = { in_progress: 0, blocked: 1, todo: 2, completed: 3, cancelled: 4 };

	let filtered = $derived(() => {
		const q = search.trim().toLowerCase();
		let rows = tasks.filter((t: any) => {
			if (fStatus   !== 'all' && t.status   !== fStatus)   return false;
			if (fPriority !== 'all' && t.priority !== fPriority) return false;
			if (fProject  !== 'all' && t.expand?.projectId?.id !== fProject) return false;
			if (fAssignee !== 'all' && !t.expand?.assignedTo?.some((u: any) => u.id === fAssignee)) return false;
			if (q && !t.title?.toLowerCase().includes(q) &&
				!t.description?.toLowerCase().includes(q) &&
				!t.tags?.toLowerCase().includes(q)) return false;
			return true;
		});
		rows = [...rows].sort((a: any, b: any) => {
			let cmp = 0;
			if (sortCol === 'title')     cmp = (a.title ?? '').localeCompare(b.title ?? '');
			if (sortCol === 'status')    cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
			if (sortCol === 'priority')  cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
			if (sortCol === 'project')    cmp = workContext(a).label.localeCompare(workContext(b).label);
			if (sortCol === 'assignedTo') cmp = (a.expand?.assignedTo?.[0] ? [a.expand.assignedTo[0].firstName, a.expand.assignedTo[0].lastName].filter(Boolean).join(' ') : '').localeCompare(b.expand?.assignedTo?.[0] ? [b.expand.assignedTo[0].firstName, b.expand.assignedTo[0].lastName].filter(Boolean).join(' ') : '');
			if (sortCol === 'budget')    cmp = (a.task_budget ?? 0) - (b.task_budget ?? 0);
			if (sortCol === 'hours')     cmp = (a.estimatedHours ?? 0) - (b.estimatedHours ?? 0);
			if (sortCol === 'startDate') {
				const da = a.startDate ? new Date(a.startDate).getTime() : Infinity;
				const db = b.startDate ? new Date(b.startDate).getTime() : Infinity;
				cmp = da - db;
			}
			if (sortCol === 'dueDate') {
				const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
				const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
				cmp = da - db;
			}
			return sortDir === 'asc' ? cmp : -cmp;
		});
		return rows;
	});

	// ── Helpers ───────────────────────────────────────────────────────────────
	function fmtDate(d: string | null) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	function fmtCurrency(n: number | null) {
		if (!n) return '—';
		return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}
	function isOverdue(t: any) {
		if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
		return new Date(t.dueDate) < new Date();
	}
	function subtaskProgress(t: any): { done: number; total: number } {
		const raw = t.subTasksChecklist;
		if (!raw || typeof raw !== 'string') return { done: 0, total: 0 };
		const lines = raw.split('\n').filter((l: string) => l.trim().match(/^- \[[ x]\]/i));
		if (!lines.length) return { done: 0, total: 0 };
		return { done: lines.filter((l: string) => /^- \[x\]/i.test(l.trim())).length, total: lines.length };
	}
	function assigneeNames(t: any): string {
		const list = t.expand?.assignedTo;
		if (!list?.length) return '—';
		return list.map((u: any) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '?').join(', ');
	}
	function workContext(t: any): { label: string; type: 'project' | 'content' | 'none' } {
		if (t.expand?.projectId) return { label: t.expand.projectId.name, type: 'project' };
		if (t.expand?.contentProductionId) return { label: t.expand.contentProductionId.title, type: 'content' };
		return { label: '—', type: 'none' };
	}

	const STATUS_LABEL: Record<string, string> = {
		todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked',
		completed: 'Completed', cancelled: 'Cancelled'
	};
	const STATUS_CLASS: Record<string, string> = {
		todo:        'bg-slate-700 text-slate-200',
		in_progress: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
		blocked:     'bg-red-900/60 text-red-300 border border-red-700/50',
		completed:   'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
		cancelled:   'bg-slate-800 text-slate-500',
	};
	const PRIORITY_CLASS: Record<string, string> = {
		urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-slate-400',
	};
	const PRIORITY_DOT: Record<string, string> = {
		urgent: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-slate-500',
	};

	type ColKey = keyof typeof visibleCols;
	const COL_LABELS: Record<ColKey, string> = {
		status: 'Status', priority: 'Priority', project: 'Project', assignedTo: 'Assigned To',
		startDate: 'Start Date', dueDate: 'Due Date', hours: 'Hours', budget: 'Budget',
		subtasks: 'Subtasks', tags: 'Tags'
	};
</script>

<svelte:head><title>Tasks — FliHub</title></svelte:head>

<!-- Modals -->
<AddTaskModal bind:open={showAddModal} />
{#if selectedTask}
	<EditTaskModal
		bind:open={showEditModal}
		task={selectedTask}
		expenses={(data.expensesByTask as any)[selectedTask.id] ?? { total: 0, paid: 0 }}
	/>
	<TaskExpenseModal
		bind:open={showExpenseModal}
		task={selectedTask}
		project={selectedTask?.expand?.projectId ?? null}
		departmentName={selectedTask?.expand?.projectId?.expand?.department?.name ?? ''}
		vendors={data.vendors ?? []}
	/>
{/if}

<div class="flex flex-col gap-5">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Tasks</h1>
			<p class="text-sm text-slate-400 mt-0.5">{tasks.length} total · {filtered().length} shown</p>
		</div>
		<Button onclick={() => showAddModal = true} class="gap-2">
			<Plus class="size-4" /> New Task
		</Button>
	</div>

	<!-- Filters + column toggle -->
	<Card class="bg-slate-800/50 border-slate-700 p-4">
		<div class="flex flex-wrap gap-3 items-center">
			<div class="relative flex-1 min-w-48">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
				<Input bind:value={search} placeholder="Search tasks…"
					class="pl-9 bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9" />
			</div>

			<select bind:value={fStatus}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-slate-500 [color-scheme:dark]">
				<option value="all">All Statuses</option>
				<option value="todo">To Do</option>
				<option value="in_progress">In Progress</option>
				<option value="blocked">Blocked</option>
				<option value="completed">Completed</option>
				<option value="cancelled">Cancelled</option>
			</select>

			<select bind:value={fPriority}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-slate-500 [color-scheme:dark]">
				<option value="all">All Priorities</option>
				<option value="urgent">Urgent</option>
				<option value="high">High</option>
				<option value="medium">Medium</option>
				<option value="low">Low</option>
			</select>

			<select bind:value={fProject}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-slate-500 max-w-52 [color-scheme:dark]">
				<option value="all">All Projects</option>
				{#each projects as p}
					<option value={(p as any).id}>{(p as any).name}</option>
				{/each}
			</select>

			<select bind:value={fAssignee}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-slate-500 max-w-48 [color-scheme:dark]">
				<option value="all">All Assignees</option>
				{#each assignees as a}
					<option value={(a as any).id}>{(a as any).name}</option>
				{/each}
			</select>

			{#if search || fStatus !== 'all' || fPriority !== 'all' || fProject !== 'all' || fAssignee !== 'all'}
				<button onclick={() => { search = ''; fStatus = 'all'; fPriority = 'all'; fProject = 'all'; fAssignee = 'all'; }}
					class="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 whitespace-nowrap">
					Clear filters
				</button>
			{/if}

			<!-- Column toggle -->
			<div class="relative ml-auto">
				<button onclick={() => showColMenu = !showColMenu}
					class="flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-600 bg-slate-900/60 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
					<SlidersHorizontal class="size-3.5" /> Columns
				</button>
				{#if showColMenu}
					<div class="absolute right-0 top-11 z-50 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl p-2">
						{#each Object.keys(visibleCols) as col}
							<label class="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-sm text-slate-300">
								<input type="checkbox" bind:checked={visibleCols[col as ColKey]}
									class="rounded border-slate-600 bg-slate-800 accent-emerald-500" />
								{COL_LABELS[col as ColKey]}
							</label>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Table -->
	<Card class="bg-slate-800/50 border-slate-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-900/40">
						<!-- Task (always visible) -->
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('title')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Task
								<span class="text-slate-600 group-hover:text-slate-400">
									{#if sortCol === 'title'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						{#if visibleCols.status}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('status')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Status <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'status'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.priority}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('priority')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Priority <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'priority'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.project}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('project')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Work Context <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'project'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.assignedTo}
						<th class="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">
							<button onclick={() => toggleSort('assignedTo')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Assigned To <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'assignedTo'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.startDate}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('startDate')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Start <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'startDate'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.dueDate}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('dueDate')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Due <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'dueDate'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.hours}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('hours')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Hours <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'hours'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.budget}
						<th class="px-4 py-3 text-left font-medium text-slate-400">
							<button onclick={() => toggleSort('budget')} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
								Budget <span class="text-slate-600 group-hover:text-slate-400">{#if sortCol === 'budget'}{#if sortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}</span>
							</button>
						</th>
						{/if}
						{#if visibleCols.subtasks}<th class="px-4 py-3 text-left font-medium text-slate-400 whitespace-nowrap">Subtasks</th>{/if}
						{#if visibleCols.tags}<th class="px-4 py-3 text-left font-medium text-slate-400">Tags</th>{/if}
						<th class="px-4 py-3 w-28"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/50">
					{#if filtered().length === 0}
						<tr>
							<td colspan="20" class="px-4 py-12 text-center text-slate-500">
								{tasks.length === 0 ? 'No tasks yet. Click New Task to get started.' : 'No tasks match the current filters.'}
							</td>
						</tr>
					{:else}
						{#each filtered() as task (task.id)}
							{@const overdue = isOverdue(task)}
							{@const sub = subtaskProgress(task)}
							{@const context = workContext(task)}
							<tr onclick={() => openEdit(task)}
								class="cursor-pointer transition-colors hover:bg-slate-700/40 {overdue ? 'border-l-2 border-l-red-500' : ''}">

								<!-- Task title -->
								<td class="px-4 py-3 max-w-xs">
									<p class="font-medium text-slate-100 truncate">{task.title}</p>
									{#if task.description}
										<p class="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
									{/if}
								</td>

								{#if visibleCols.status}
								<td class="px-4 py-3 whitespace-nowrap">
									<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {STATUS_CLASS[task.status] ?? 'bg-slate-700 text-slate-300'}">
										{STATUS_LABEL[task.status] ?? task.status}
									</span>
								</td>
								{/if}

								{#if visibleCols.priority}
								<td class="px-4 py-3 whitespace-nowrap">
									{#if task.priority}
										<span class="inline-flex items-center gap-1.5 text-xs font-medium capitalize {PRIORITY_CLASS[task.priority] ?? 'text-slate-400'}">
											<span class="size-1.5 rounded-full {PRIORITY_DOT[task.priority] ?? 'bg-slate-500'}"></span>
											{task.priority}
										</span>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								{#if visibleCols.project}
								<td class="px-4 py-3 max-w-[160px]">
									{#if context.type !== 'none'}
										<span class="text-slate-300 truncate block">{context.label}</span>
										<span class="text-[10px] uppercase tracking-wide {context.type === 'content' ? 'text-emerald-400' : 'text-slate-500'}">
											{context.type}
										</span>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								{#if visibleCols.assignedTo}
								<td class="px-4 py-3 max-w-[140px]">
									<span class="text-slate-300 truncate block text-xs">{assigneeNames(task)}</span>
								</td>
								{/if}

								{#if visibleCols.startDate}
								<td class="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">{fmtDate(task.startDate)}</td>
								{/if}

								{#if visibleCols.dueDate}
								<td class="px-4 py-3 whitespace-nowrap text-xs {overdue ? 'text-red-400 font-medium' : 'text-slate-400'}">
									{fmtDate(task.dueDate)}
									{#if overdue}<span class="ml-1 text-red-500">overdue</span>{/if}
								</td>
								{/if}

								{#if visibleCols.hours}
								<td class="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
									{#if task.estimatedHours || task.actualHours}
										<span class="{task.actualHours > task.estimatedHours ? 'text-red-400' : ''}">
											{task.actualHours ?? 0}h
										</span>
										<span class="text-slate-600"> / {task.estimatedHours ?? 0}h</span>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								{#if visibleCols.budget}
								<td class="px-4 py-3 whitespace-nowrap text-xs">
									{#if task.task_budget}
										{@const spent = task.task_actual_cost ?? 0}
										{@const pct = Math.min(100, (spent / task.task_budget) * 100)}
										<div>
											<div class="flex items-center justify-between mb-1">
												<span class="{spent > task.task_budget ? 'text-red-400' : 'text-slate-300'}">{fmtCurrency(spent)}</span>
												<span class="text-slate-500"> / {fmtCurrency(task.task_budget)}</span>
											</div>
											<div class="h-1 w-20 rounded-full bg-slate-700">
												<div class="h-1 rounded-full {spent > task.task_budget ? 'bg-red-500' : 'bg-emerald-500'}" style="width:{pct}%"></div>
											</div>
										</div>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								{#if visibleCols.subtasks}
								<td class="px-4 py-3 whitespace-nowrap text-xs">
									{#if sub.total > 0}
										{@const pct = Math.round((sub.done / sub.total) * 100)}
										<div>
											<div class="flex items-center justify-between mb-1">
												<span class="text-slate-300">{sub.done}/{sub.total}</span>
												<span class="text-slate-500">{pct}%</span>
											</div>
											<div class="h-1 w-16 rounded-full bg-slate-700">
												<div class="h-1 rounded-full bg-blue-500" style="width:{pct}%"></div>
											</div>
										</div>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								{#if visibleCols.tags}
								<td class="px-4 py-3 max-w-[120px]">
									{#if task.tags}
										<div class="flex flex-wrap gap-1">
											{#each task.tags.split(',').map((t: string) => t.trim()).filter(Boolean) as tag}
												<span class="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">{tag}</span>
											{/each}
										</div>
									{:else}<span class="text-slate-600">—</span>{/if}
								</td>
								{/if}

								<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
									<button onclick={(e) => openExpense(e, task)}
										class="flex items-center gap-1 text-xs px-2 py-1 rounded border border-emerald-700/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 transition-all whitespace-nowrap">
										<Receipt class="size-3" /> Log Expense
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		{#if filtered().length > 0}
			<div class="px-4 py-2.5 border-t border-slate-700/50 text-xs text-slate-500">
				{filtered().length} {filtered().length === 1 ? 'task' : 'tasks'}
				{#if filtered().length !== tasks.length} · filtered from {tasks.length}{/if}
			</div>
		{/if}
	</Card>
</div>
