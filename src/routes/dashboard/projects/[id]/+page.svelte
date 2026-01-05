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
	import { 
		ArrowLeft,
		DollarSign,
		Calendar,
		Users,
		Building2,
		FileText,
		TrendingUp,
		Package,
		Edit,
		Plus
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let showEditModal = $state(false);
	let showAddTaskModal = $state(false);
	let showTaskDetailModal = $state(false);
	let selectedTask = $state<any>(null);
	
	let project = $derived(data.project);
	let expenses = $derived(data.expenses || []);
	let expenseStats = $derived(data.expenseStats);
	let tasks = $derived(data.tasks || []);
	
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
		selectedTask = task;
		showTaskDetailModal = true;
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
		if (!project.budget || !project.actualExpenses) return 0;
		return Math.min((project.actualExpenses / project.budget) * 100, 100);
	}
	
	function getBudgetVariant(percentage: number): 'success' | 'warning' | 'danger' {
		if (percentage >= 100) return 'danger';
		if (percentage >= 80) return 'warning';
		return 'success';
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
				<span class="text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">
					{project.type.replace('_', ' ')}
				</span>
			</div>
			{#if project.description}
				<div class="text-muted-foreground prose dark:prose-invert max-w-none">
					{@html project.description}
				</div>
			{/if}
		</div>
		<Button onclick={() => showEditModal = true} class="gap-2">
			<Edit class="size-4" />
			Edit Project
		</Button>
	</div>

	<!-- Edit Project Modal -->
	<EditProjectModal bind:open={showEditModal} {project} />
	
	<!-- Add Task Modal -->
	<AddTaskModal bind:open={showAddTaskModal} projectId={project.id} />
	
	<!-- Task Detail Modal -->
	{#if selectedTask}
		<TaskDetailModal bind:open={showTaskDetailModal} task={selectedTask} />
	{/if}

	<!-- Key Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<MetricCard
			title="Total Budget"
			value={project.budget ? formatCurrency(project.budget) : '-'}
			subtitle="Allocated"
			icon={DollarSign}
		/>
		
		<MetricCard
			title="Actual Spent"
			value={project.actualExpenses ? formatCurrency(project.actualExpenses) : '-'}
			subtitle={project.budget ? `${getBudgetPercentage().toFixed(0)}% of budget` : ''}
			icon={TrendingUp}
			variant={getBudgetVariant(getBudgetPercentage())}
		/>
		
		<MetricCard
			title="Forecasted"
			value={project.forecastedExpenses ? formatCurrency(project.forecastedExpenses) : '-'}
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
	{#if project.budget && project.actualExpenses}
		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4">Budget Utilization</h2>
			<div class="space-y-4">
				<ProgressBar
					value={project.actualExpenses}
					max={project.budget}
					label="Budget Used"
					size="lg"
					variant={getBudgetVariant(getBudgetPercentage())}
				/>
				<div class="grid grid-cols-3 gap-4 text-sm">
					<div>
						<p class="text-muted-foreground">Allocated</p>
						<p class="font-semibold">{formatCurrency(project.budget)}</p>
					</div>
					<div>
						<p class="text-muted-foreground">Spent</p>
						<p class="font-semibold">{formatCurrency(project.actualExpenses)}</p>
					</div>
					<div>
						<p class="text-muted-foreground">Remaining</p>
						<p class="font-semibold">{formatCurrency(project.budget - project.actualExpenses)}</p>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Project Details -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Info Card -->
		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
				<FileText class="size-5" />
				Project Information
			</h2>
			<div class="space-y-3">
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
				<div class="flex justify-between">
					<span class="text-muted-foreground">Approval Status</span>
					<span class="font-medium capitalize">{project.approvalStatus?.replace('_', ' ') || '-'}</span>
				</div>
				{#if project.expand?.department}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Department</span>
						<span class="font-medium">{project.expand.department.name}</span>
					</div>
				{/if}
				{#if project.expand?.approvedBy}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Approved By</span>
						<span class="font-medium">{project.expand.approvedBy.name || project.expand.approvedBy.email}</span>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Vendors Card -->
		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
				<Building2 class="size-5" />
				Vendors
			</h2>
			{#if project.expand?.vendors && project.expand.vendors.length > 0}
				<div class="space-y-3">
					{#each project.expand.vendors as vendor}
						<div class="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
							<p class="font-medium text-slate-900 dark:text-slate-100">{vendor.name}</p>
							{#if vendor.email}
								<p class="text-sm text-slate-700 dark:text-slate-300">{vendor.email}</p>
							{/if}
							{#if vendor.phone}
								<p class="text-sm text-slate-700 dark:text-slate-300">{vendor.phone}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center py-8">No vendors assigned to this project</p>
			{/if}
		</Card>
	</div>

	<!-- Expenses Table -->
	<Card class="overflow-hidden">
		<div class="p-6 border-b">
			<h2 class="text-xl font-semibold flex items-center gap-2">
				<Package class="size-5" />
				Expenses ({expenses.length})
			</h2>
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
							Task
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Subtasks
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Priority
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Hours
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
							Due Date
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
					{#if tasks.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-8 text-center text-muted-foreground">
								No tasks recorded for this project
							</td>
						</tr>
					{:else}
						{#each tasks as task, i}
							{@const subtasks = parseSubtasks(task.subTasksChecklist)}
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
