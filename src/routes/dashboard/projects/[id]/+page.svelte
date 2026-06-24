<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import EditProjectModal from '$lib/components/projects/edit-project-modal.svelte';
	import AddTaskModal from '$lib/components/tasks/add-task-modal.svelte';
	import TaskDetailModal from '$lib/components/tasks/task-detail-modal.svelte';
	import SelectOrAddVendorModal from '$lib/components/vendors/select-or-add-vendor-modal.svelte';
	import AddExpenseModal from '$lib/components/expenses/add-expense-modal.svelte';
	import TaskExpenseModal from '$lib/components/expenses/task-expense-modal.svelte';
	import { invalidateAll } from '$app/navigation';
	import { 
		ArrowLeft,
		DollarSign,
		Building2,
		FileText,
		TrendingUp,
		Package,
		Edit,
		Plus,
		X,
		Receipt,
		Link,
		PlayCircle,
		ChevronUp,
		ChevronDown,
		ChevronsUpDown
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let showEditModal = $state(false);
	let showAddTaskModal = $state(false);
	let showTaskDetailModal = $state(false);
	let showExpenseModal    = $state(false);
	let showAddVendorModal = $state(false);
	let showAddExpenseModal = $state(false);
	let selectedTask = $state<any>(null);
	let taskDetailStartsInEdit = $state(false);
	let removingVendorId = $state<string | null>(null);
	let activatingProject = $state(false);
	let activationError = $state('');
	type TaskSortCol = 'title' | 'subtasks' | 'priority' | 'hours' | 'status' | 'dueDate' | 'expense';
	let taskSortCol = $state<TaskSortCol>('expense');
	let taskSortDir = $state<'asc' | 'desc'>('desc');
	
	let project = $derived(data.project as any);
	let canMakeActive = $derived(project.status === 'draft' || project.status === 'planned');
	let expenses = $derived(data.expenses || []);
	let expenseStats = $derived(data.expenseStats || {
		total: 0,
		byStatus: { draft: 0, submitted: 0, approved: 0, rejected: 0, paid: 0 },
		byCategory: {}
	});
	let tasks = $derived((data.tasks || []) as any[]);
	const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
	const STATUS_ORDER: Record<string, number> = { in_progress: 0, blocked: 1, todo: 2, completed: 3, cancelled: 4 };
	let sortedTasks = $derived(() => {
		return [...tasks].sort((a: any, b: any) => {
			let cmp = 0;
			if (taskSortCol === 'title') cmp = (a.title ?? '').localeCompare(b.title ?? '');
			if (taskSortCol === 'subtasks') {
				const aSub = parseSubtasks(a.subTasksChecklist);
				const bSub = parseSubtasks(b.subTasksChecklist);
				const aPct = aSub.total > 0 ? aSub.completed / aSub.total : -1;
				const bPct = bSub.total > 0 ? bSub.completed / bSub.total : -1;
				cmp = aPct === bPct ? aSub.total - bSub.total : aPct - bPct;
			}
			if (taskSortCol === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
			if (taskSortCol === 'hours') cmp = (a.estimatedHours ?? 0) - (b.estimatedHours ?? 0);
			if (taskSortCol === 'status') cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
			if (taskSortCol === 'dueDate') {
				const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
				const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
				cmp = aDue - bDue;
			}
			if (taskSortCol === 'expense') {
				const aExpense = (a.task_actual_cost ?? 0) || (a.task_budget ?? 0);
				const bExpense = (b.task_actual_cost ?? 0) || (b.task_budget ?? 0);
				cmp = aExpense - bExpense;
			}
			if (cmp === 0) cmp = (a.title ?? '').localeCompare(b.title ?? '');
			return taskSortDir === 'asc' ? cmp : -cmp;
		});
	});
	
	function parseSubtasks(subtasksData: any) {
		if (!subtasksData) return { total: 0, completed: 0, items: [] };
		
		// If it's a string (markdown format), parse it
		if (typeof subtasksData === 'string') {
			const lines = subtasksData.split('\n').filter(line => line.trim());
			const items = lines
				.filter(line => line.includes('[ ]') || line.includes('[x]') || line.includes('[X]'))
				.map(line => ({
					text: line.replace(/^[*-]\s*\[([ xX])\]\s*/, '').trim(),
					completed: line.includes('[x]') || line.includes('[X]')
				}));
			
			return {
				total: items.length,
				completed: items.filter(item => item.completed).length,
				items
			};
		}
		
		// If it's already parsed JSON
		if (Array.isArray(subtasksData)) {
			return {
				total: subtasksData.length,
				completed: subtasksData.filter((item: any) => item.completed).length,
				items: subtasksData
			};
		}
		
		return { total: 0, completed: 0, items: [] };
	}
	
	function handleTaskClick(task: any) {
		taskDetailStartsInEdit = false;
		selectedTask = task;
		showTaskDetailModal = true;
	}

	function openTaskEditor(task: any) {
		taskDetailStartsInEdit = true;
		selectedTask = task;
		showTaskDetailModal = true;
	}

	async function handleTaskUpdated(updatedTask: any) {
		selectedTask = { ...selectedTask, ...updatedTask };
		await invalidateAll();
	}
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function getBudgetPercentage(): number {
		if (!project.project_budget || !project.project_actual_expenses) return 0;
		return Math.min((project.project_actual_expenses / project.project_budget) * 100, 100);
	}
	
	function getBudgetVariant(percentage: number): 'success' | 'warning' | 'danger' {
		if (percentage >= 100) return 'danger';
		if (percentage >= 80) return 'warning';
		return 'success';
	}

	function taskHasExpense(task: any): boolean {
		return (task.task_budget || 0) > 0 || (task.task_actual_cost || 0) > 0;
	}

	function toggleTaskSort(col: TaskSortCol) {
		if (taskSortCol === col) {
			taskSortDir = taskSortDir === 'asc' ? 'desc' : 'asc';
			return;
		}
		taskSortCol = col;
		taskSortDir = 'asc';
	}

	async function handleRemoveVendor(vendorId: string, event: Event) {
		event.stopPropagation(); // Prevent opening the modal
		
		if (!confirm('Are you sure you want to remove this vendor from the project?')) {
			return;
		}

		removingVendorId = vendorId;

		try {
			// Get current vendor IDs and remove the selected one
			const currentVendorIds = project.vendors || [];
			const updatedVendorIds = currentVendorIds.filter((id: string) => id !== vendorId);

			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					vendors: updatedVendorIds
				})
			});

			if (!response.ok) {
				throw new Error('Failed to remove vendor');
			}

			// Reload the page to show updated vendors
			window.location.reload();
		} catch (err) {
			alert('Failed to remove vendor. Please try again.');
			console.error('Error removing vendor:', err);
		} finally {
			removingVendorId = null;
		}
	}

	async function handleMakeActive() {
		if (!canMakeActive || activatingProject) return;

		activatingProject = true;
		activationError = '';

		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: 'in_progress' })
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to activate project');
			}

			await invalidateAll();
		} catch (err) {
			activationError = err instanceof Error ? err.message : 'Failed to activate project';
		} finally {
			activatingProject = false;
		}
	}
</script>

<svelte:head>
	<title>{project.name} - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" onclick={() => window.history.back()}>
			<ArrowLeft class="size-4" />
		</Button>
		<div class="flex-1">
			<div class="flex items-center gap-3 mb-2">
				<h1 class="text-3xl font-bold">{project.name}</h1>
				<StatusBadge status={project.status} />
				<span class="text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-100 capitalize">
					{project.type?.replace('_', ' ') || project.type || '-'}
				</span>
			</div>
			{#if project.description}
				<div class="text-muted-foreground prose dark:prose-invert max-w-none">
					{@html project.description}
				</div>
			{/if}
		</div>
		<div class="flex flex-col items-end gap-2">
			<div class="flex flex-wrap justify-end gap-2">
				{#if canMakeActive}
					<Button onclick={handleMakeActive} disabled={activatingProject} class="gap-2">
						<PlayCircle class="size-4" />
						{activatingProject ? 'Activating...' : 'Make Active'}
					</Button>
				{/if}
				<Button onclick={() => showEditModal = true} variant={canMakeActive ? 'outline' : 'default'} class="gap-2">
					<Edit class="size-4" />
					Edit Project
				</Button>
			</div>
			{#if activationError}
				<p class="max-w-xs text-right text-sm text-red-500">{activationError}</p>
			{/if}
		</div>
	</div>

	<!-- Edit Project Modal -->
	<EditProjectModal bind:open={showEditModal} {project} departments={data.departments || []} />
	
	<!-- Add Task Modal -->
	<AddTaskModal bind:open={showAddTaskModal} projectId={project.id} />
	
	<!-- Task Detail Modal -->
	{#if selectedTask}
		<TaskDetailModal bind:open={showTaskDetailModal} task={selectedTask} startInEdit={taskDetailStartsInEdit} onUpdated={handleTaskUpdated} />
	{/if}

	<!-- Select or Add Vendor Modal -->
	<SelectOrAddVendorModal 
		bind:open={showAddVendorModal} 
		projectId={project.id}
		existingVendors={data.allVendors}
		currentVendorIds={project.vendors || []}
	/>

	<!-- Add Expense Modal -->
	<AddExpenseModal bind:open={showAddExpenseModal} projectTasks={tasks} />

	{#if selectedTask}
		<TaskExpenseModal
			bind:open={showExpenseModal}
			task={selectedTask}
			project={project}
			departmentName={project?.expand?.department?.name ?? ''}
			vendors={data.allVendors ?? []}
		/>
	{/if}

	<!-- Key Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<MetricCard
			title="Total Budget"
			value={project.project_budget ? formatCurrency(project.project_budget) : '-'}
			subtitle="Allocated"
			icon={DollarSign}
		/>
		
		<MetricCard
			title="Actual Spent"
			value={project.project_actual_expenses ? formatCurrency(project.project_actual_expenses) : '-'}
			subtitle={project.project_budget ? `${getBudgetPercentage().toFixed(0)}% of budget` : ''}
			icon={TrendingUp}
			variant={getBudgetVariant(getBudgetPercentage())}
		/>
		
		<MetricCard
			title="Forecasted"
			value={project.project_forecasted_expenses ? formatCurrency(project.project_forecasted_expenses) : '-'}
			subtitle="Expected expenses"
			icon={FileText}
		/>
		
		<MetricCard
			title="Total Expenses"
			value={expenses.length}
			subtitle={`${expenseStats.byStatus.paid} paid`}
			icon={Package}
		/>
	</div>

	<!-- Budget Progress -->
	{#if project.project_budget && project.project_actual_expenses}
		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4">Budget Utilization</h2>
			<div class="space-y-4">
				<ProgressBar
					value={project.project_actual_expenses}
					max={project.project_budget}
					label="Budget Used"
					size="lg"
					variant={getBudgetVariant(getBudgetPercentage())}
				/>
				<div class="grid grid-cols-3 gap-4 text-sm">
					<div>
						<p class="text-muted-foreground">Allocated</p>
						<p class="font-semibold">{formatCurrency(project.project_budget)}</p>
					</div>
					<div>
						<p class="text-muted-foreground">Spent</p>
						<p class="font-semibold">{formatCurrency(project.project_actual_expenses)}</p>
					</div>
					<div>
						<p class="text-muted-foreground">Remaining</p>
						<p class="font-semibold">{formatCurrency(project.project_budget - project.project_actual_expenses)}</p>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Project Details -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Info Card — click anywhere to edit -->
		<Card class="p-6 relative hover:ring-2 hover:ring-blue-500/50 transition-all">
			<button
				onclick={() => showEditModal = true}
				class="absolute inset-0 w-full h-full cursor-pointer rounded-lg"
				aria-label="Edit project details"
			></button>
			<div class="relative pointer-events-none">
			<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
				<FileText class="size-5" />
				Project Details
				<Edit class="size-4 ml-auto text-muted-foreground" />
			</h2>
			<div class="space-y-3">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Status</span>
					<span class="font-medium capitalize">{project.status?.replace('_', ' ') || '-'}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Type</span>
					<span class="font-medium capitalize">{project.type?.replace('_', ' ') || '-'}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Start Date</span>
					<span class="font-medium">{formatDate(project.startDate)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">End Date</span>
					<span class="font-medium">{formatDate(project.endDate)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Fiscal Year</span>
					<span class="font-medium">{project.fiscalYear || '-'}</span>
				</div>

				{#if project.expand?.department}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Department</span>
						<span class="font-medium">{project.expand.department.name}</span>
					</div>
				{/if}

				{#if project.expand?.campaignId}
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">Campaign</span>
						<a
							href="/dashboard/campaigns"
							class="inline-flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
						>
							<Link class="size-3.5 shrink-0" />
							{project.expand.campaignId.name}
						</a>
					</div>
				{/if}
				{#if project.expand?.approvedBy}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Approved By</span>
						<span class="font-medium">{project.expand.approvedBy.name || project.expand.approvedBy.email}</span>
					</div>
				{/if}
				<p class="text-xs text-muted-foreground pt-2 border-t">Click to edit details</p>
			</div>
			</div>
		</Card>

		<!-- Vendors Card -->
		<Card class="p-6 relative">
			<!-- Clickable overlay -->
			<button 
				onclick={() => showAddVendorModal = true}
				class="absolute inset-0 w-full h-full cursor-pointer hover:bg-accent/50 transition-colors rounded-lg"
				aria-label="Add vendor"
			></button>
			
			<div class="relative pointer-events-none">
				<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
					<Building2 class="size-5" />
					Vendors
					<Plus class="size-4 ml-auto text-muted-foreground" />
				</h2>
				{#if project.expand?.vendors && project.expand.vendors.length > 0}
					<div class="space-y-3">
						{#each project.expand.vendors as vendor}
							<div class="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 flex items-start justify-between gap-3">
								<div class="flex-1">
									<p class="font-medium text-slate-900 dark:text-slate-100">{vendor.name}</p>
									{#if vendor.contact_email}
										<p class="text-sm text-slate-700 dark:text-slate-300">{vendor.contact_email}</p>
									{/if}
									{#if vendor.contact_phone}
										<p class="text-sm text-slate-700 dark:text-slate-300">{vendor.contact_phone}</p>
									{/if}
								</div>
								<button
									onclick={(e) => handleRemoveVendor(vendor.id, e)}
									disabled={removingVendorId === vendor.id}
									class="pointer-events-auto p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
									aria-label="Remove vendor"
								>
									<X class="size-4" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-center py-8">No vendors assigned to this project</p>
				{/if}
			</div>
		</Card>
	</div>

	<!-- Expenses Table -->
	<Card class="overflow-hidden">
		<div class="p-6 border-b flex items-center justify-between">
			<h2 class="text-xl font-semibold flex items-center gap-2">
				<Package class="size-5" />
				Expenses ({expenses.length})
			</h2>
			<Button onclick={() => showAddExpenseModal = true} class="gap-2">
				<Plus class="size-4" />
				Add Expense
			</Button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-slate-50 dark:bg-slate-900 border-b">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Description
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Category
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Amount
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Date
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
					{#if expenses.length === 0}
						<tr>
							<td colspan="5" class="px-6 py-8 text-center text-muted-foreground">
								No expenses recorded for this project
							</td>
						</tr>
					{:else}
						{#each expenses as expense, i}
							<tr class="hover:bg-green-800 dark:hover:bg-green-800/50 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-blue-800 dark:bg-blue-800/30' : ''}">
								<td class="px-6 py-4">
									<div class="font-medium">{expense.description}</div>
									{#if expense.notes}
										<div class="text-sm text-muted-foreground truncate max-w-xs">
											{@html expense.notes}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{expense.category}
								</td>
								<td class="px-6 py-4 text-sm font-medium">
									{formatCurrency(expense.amount)}
								</td>
								<td class="px-6 py-4">
									<StatusBadge status={expense.status} />
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(expense.date)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Tasks Table -->
	<Card class="overflow-hidden">
		<div class="p-6 border-b flex items-center justify-between">
			<h2 class="text-xl font-semibold flex items-center gap-2">
				<FileText class="size-5" />
				Tasks ({tasks.length})
			</h2>
			<Button onclick={() => showAddTaskModal = true} class="gap-2">
				<Plus class="size-4" />
				Add Task
			</Button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-slate-50 dark:bg-slate-900 border-b">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('title')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Task
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'title'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('subtasks')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Subtasks
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'subtasks'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('priority')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Priority
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'priority'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('hours')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Hours
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'hours'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('status')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Status
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'status'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('dueDate')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Due Date
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'dueDate'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							<button onclick={() => toggleTaskSort('expense')} class="inline-flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
								Expense
								<span class="text-slate-500 group-hover:text-blue-500">
									{#if taskSortCol === 'expense'}{#if taskSortDir === 'asc'}<ChevronUp class="size-3.5" />{:else}<ChevronDown class="size-3.5" />{/if}{:else}<ChevronsUpDown class="size-3.5" />{/if}
								</span>
							</button>
						</th>
						<th class="px-6 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
					{#if tasks.length === 0}
						<tr>
							<td colspan="8" class="px-6 py-8 text-center text-muted-foreground">
								No tasks recorded for this project
							</td>
						</tr>
					{:else}
						{#each sortedTasks() as task, i}
							{@const subtasks = parseSubtasks(task.subTasksChecklist)}
							{@const hasExpense = taskHasExpense(task)}
							{@const taskBudget = task.task_budget || 0}
							{@const taskActual = task.task_actual_cost || 0}
							<tr 
								class="hover:bg-green-800 dark:hover:bg-green-800/50 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-blue-800 dark:bg-blue-800/30' : ''}"
								onclick={() => handleTaskClick(task)}
							>
								<td class="px-6 py-4">
									<div class="font-medium">{task.title}</div>
									{#if task.description}
										<div class="text-sm text-muted-foreground truncate max-w-xs">
											{@html task.description}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if subtasks.total > 0}
										<div class="flex items-center gap-2">
											<span class="text-xs font-medium">
												{subtasks.completed}/{subtasks.total}
											</span>
											<div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[60px]">
												<div 
													class="bg-blue-600 h-2 rounded-full transition-all"
													style="width: {subtasks.total > 0 ? (subtasks.completed / subtasks.total * 100) : 0}%"
												></div>
											</div>
										</div>
									{:else}
										-
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if task.priority}
										<span class="px-2 py-1 rounded-full text-xs font-medium capitalize
											{task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
											{task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
											{task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
											{task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
										">
											{task.priority}
										</span>
									{:else}
										-
									{/if}
								</td>
								<td class="px-6 py-4 text-sm font-medium">
									{#if task.estimatedHours || task.actualHours}
										<div>
											{task.actualHours || 0} / {task.estimatedHours || 0}h
										</div>
									{:else}
										-
									{/if}
								</td>
								<td class="px-6 py-4">
									<StatusBadge status={task.status} />
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{formatDate(task.dueDate)}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if hasExpense}
										<div class="space-y-1 min-w-[120px]">
											<div class="text-xs font-medium text-slate-200 tabular-nums">
												{formatCurrency(taskActual)}
												{#if taskBudget > 0}
													<span class="text-slate-500"> / {formatCurrency(taskBudget)}</span>
												{:else}
													<span class="text-slate-500"> actual</span>
												{/if}
											</div>
											{#if taskBudget > 0}
												<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
													<div
														class="h-full rounded-full {taskActual > taskBudget ? 'bg-red-500' : 'bg-emerald-500'}"
														style="width: {Math.min(100, (taskActual / taskBudget) * 100)}%"
													></div>
												</div>
											{/if}
										</div>
									{:else}
										<span class="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs font-medium text-slate-400">
											No expense
										</span>
									{/if}
								</td>
								<td class="px-6 py-4" onclick={(e) => e.stopPropagation()}>
									{#if hasExpense}
										<button
											onclick={(e) => { e.stopPropagation(); selectedTask = task; showExpenseModal = true; }}
											class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-700/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-300 hover:border-emerald-600 transition-all whitespace-nowrap"
										>
											<Receipt class="size-3.5" /> Log Expense
										</button>
									{:else}
										<button
											onclick={(e) => { e.stopPropagation(); openTaskEditor(task); }}
											class="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all whitespace-nowrap"
										>
											Set Budget
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Notes -->
	{#if project.notes}
		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4">Notes</h2>
			<div class="prose dark:prose-invert max-w-none">
				{@html project.notes}
			</div>
		</Card>
	{/if}
</div>
