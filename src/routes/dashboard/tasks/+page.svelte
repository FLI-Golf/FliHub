<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import { 
		ListTodo, 
		CheckCircle2, 
		Clock, 
		AlertTriangle,
		Plus,
		Calendar,
		Target,
		Circle,
		PlayCircle,
		Ban,
		XCircle,
		AlertCircle,
		ArrowUp,
		ArrowDown,
		Minus
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let tasks = $derived(data.tasks || []);
	let stats = $derived(data.stats);
	let subtaskStats = $derived(data.subtaskStats);
	let alerts = $derived(data.alerts);
	let overdueTasks = $derived(data.overdueTasks || []);
	let upcomingTasks = $derived(data.upcomingTasks || []);
	
	let statusFilter = $state<string>('all');
	let priorityFilter = $state<string>('all');
	
	// Filter tasks based on selected tabs
	let filteredTasks = $derived(tasks.filter(task => {
		const statusMatch = statusFilter === 'all' || task.status === statusFilter;
		const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
		return statusMatch && priorityMatch;
	}));
	
	// Calculate filtered completion
	let filteredCompleted = $derived(filteredTasks.filter(t => t.status === 'completed').length);
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All', count: tasks.length },
		{ value: 'todo', label: 'To Do', count: stats.byStatus.todo, icon: Circle },
		{ value: 'in_progress', label: 'In Progress', count: stats.byStatus.in_progress, icon: PlayCircle },
		{ value: 'blocked', label: 'Blocked', count: stats.byStatus.blocked, icon: Ban },
		{ value: 'completed', label: 'Completed', count: stats.byStatus.completed, icon: CheckCircle2 },
		{ value: 'cancelled', label: 'Cancelled', count: stats.byStatus.cancelled, icon: XCircle }
	]);
	
	// Build priority tabs
	let priorityTabs = $derived([
		{ value: 'all', label: 'All Priorities', count: tasks.length },
		{ value: 'urgent', label: 'Urgent', count: stats.byPriority.urgent, icon: AlertCircle },
		{ value: 'high', label: 'High', count: stats.byPriority.high, icon: ArrowUp },
		{ value: 'medium', label: 'Medium', count: stats.byPriority.medium, icon: Minus },
		{ value: 'low', label: 'Low', count: stats.byPriority.low, icon: ArrowDown }
	]);
	
	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function getSubtaskProgress(task: any): { completed: number; total: number } {
		if (!task.subTasksChecklist || task.subTasksChecklist.length === 0) {
			return { completed: 0, total: 0 };
		}
		const completed = task.subTasksChecklist.filter((st: any) => st.completed).length;
		return { completed, total: task.subTasksChecklist.length };
	}
	
	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent': return 'text-red-600 dark:text-red-400';
			case 'high': return 'text-orange-600 dark:text-orange-400';
			case 'medium': return 'text-yellow-600 dark:text-yellow-400';
			case 'low': return 'text-green-600 dark:text-green-400';
			default: return 'text-slate-600 dark:text-slate-400';
		}
	}
</script>

<svelte:head>
	<title>Tasks - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold mb-2">Tasks</h1>
			<p class="text-muted-foreground">Business roadmap and project tasks</p>
		</div>
		<Button class="gap-2">
			<Plus class="size-4" />
			Add Task
		</Button>
	</div>

	<!-- Alerts -->
	{#if alerts.overdue > 0 || alerts.blocked > 0}
		<div class="flex gap-4">
			{#if alerts.overdue > 0}
				<Card class="p-4 border-red-500 bg-red-50 dark:bg-red-900/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-red-600 dark:text-red-400" />
						<div>
							<p class="font-semibold text-red-900 dark:text-red-100">
								{alerts.overdue} {alerts.overdue === 1 ? 'task is' : 'tasks are'} overdue
							</p>
							<p class="text-sm text-red-700 dark:text-red-300">Requires immediate attention</p>
						</div>
					</div>
				</Card>
			{/if}
			{#if alerts.blocked > 0}
				<Card class="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-yellow-600 dark:text-yellow-400" />
						<div>
							<p class="font-semibold text-yellow-900 dark:text-yellow-100">
								{alerts.blocked} {alerts.blocked === 1 ? 'task is' : 'tasks are'} blocked
							</p>
							<p class="text-sm text-yellow-700 dark:text-yellow-300">Waiting on dependencies</p>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	{/if}

	<!-- Statistics -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				title="Total Tasks"
				value={stats.total}
				subtitle="{stats.byStatus.in_progress} in progress"
				icon={ListTodo}
			/>
			
			<MetricCard
				title="Completed"
				value={stats.byStatus.completed}
				subtitle="{stats.completion.percentage.toFixed(0)}% completion rate"
				icon={CheckCircle2}
				variant="success"
			/>
			
			<MetricCard
				title="Upcoming"
				value={alerts.upcoming}
				subtitle="Due in next 7 days"
				icon={Calendar}
				variant="warning"
			/>
			
			<MetricCard
				title="Subtasks"
				value={`${subtaskStats.completed}/${subtaskStats.total}`}
				subtitle="Checklist items completed"
				icon={Target}
			/>
		</div>
	</div>

	<!-- Progress Overview -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Progress Overview</h2>
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<Card class="p-6">
				<h3 class="text-lg font-semibold mb-4">Task Completion</h3>
				<div class="space-y-4">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Completed</span>
						<span class="font-semibold">{stats.byStatus.completed} / {stats.total}</span>
					</div>
					<ProgressBar
						value={stats.byStatus.completed}
						max={stats.total}
						label="Overall Progress"
						variant="success"
						size="lg"
					/>
				</div>
			</Card>

			<Card class="p-6">
				<h3 class="text-lg font-semibold mb-4">Subtask Completion</h3>
				<div class="space-y-4">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Completed</span>
						<span class="font-semibold">{subtaskStats.completed} / {subtaskStats.total}</span>
					</div>
					<ProgressBar
						value={subtaskStats.completed}
						max={subtaskStats.total}
						label="Checklist Progress"
						variant="success"
						size="lg"
					/>
				</div>
			</Card>
		</div>
	</div>

	<!-- Status Breakdown -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Task Status</h2>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">To Do</p>
				<p class="text-2xl font-bold">{stats.byStatus.todo}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">In Progress</p>
				<p class="text-2xl font-bold">{stats.byStatus.in_progress}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Blocked</p>
				<p class="text-2xl font-bold">{stats.byStatus.blocked}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Completed</p>
				<p class="text-2xl font-bold">{stats.byStatus.completed}</p>
			</Card>
			<Card class="p-4">
				<p class="text-sm text-muted-foreground mb-1">Cancelled</p>
				<p class="text-2xl font-bold">{stats.byStatus.cancelled}</p>
			</Card>
		</div>
	</div>

	<!-- Priority Breakdown -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Priority Distribution</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-3 rounded-full bg-red-500"></div>
					<p class="text-sm text-muted-foreground">Urgent</p>
				</div>
				<p class="text-2xl font-bold">{stats.byPriority.urgent}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-3 rounded-full bg-orange-500"></div>
					<p class="text-sm text-muted-foreground">High</p>
				</div>
				<p class="text-2xl font-bold">{stats.byPriority.high}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-3 rounded-full bg-yellow-500"></div>
					<p class="text-sm text-muted-foreground">Medium</p>
				</div>
				<p class="text-2xl font-bold">{stats.byPriority.medium}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<div class="size-3 rounded-full bg-green-500"></div>
					<p class="text-sm text-muted-foreground">Low</p>
				</div>
				<p class="text-2xl font-bold">{stats.byPriority.low}</p>
			</Card>
		</div>
	</div>

	<!-- Tasks Table with Tabs -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">All Tasks</h2>
			{#if statusFilter !== 'all' || priorityFilter !== 'all'}
				<div class="text-sm text-muted-foreground">
					Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} • 
					{filteredCompleted} completed ({filteredTasks.length > 0 ? ((filteredCompleted / filteredTasks.length) * 100).toFixed(0) : 0}%)
				</div>
			{/if}
		</div>
		
		<!-- Status Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="button"
			/>
		</div>

		<!-- Priority Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Priority</h3>
			<VisualTabs
				tabs={priorityTabs}
				activeTab={priorityFilter}
				onTabChange={(v) => priorityFilter = v}
				variant="pill"
			/>
		</div>

		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 dark:bg-slate-900 border-b">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
								Task
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
								Priority
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
								Progress
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
								Due Date
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#if filteredTasks.length === 0}
							<tr>
								<td colspan="5" class="px-6 py-8 text-center text-foreground">
									{#if tasks.length === 0}
										No tasks found. Create your first task to get started.
									{:else}
										No tasks match the selected filters.
									{/if}
								</td>
							</tr>
						{:else}
							{#each filteredTasks as task}
								{@const progress = getSubtaskProgress(task)}
								<tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
									<td class="px-6 py-4">
										<div class="font-medium">{task.title}</div>
										{#if task.description}
											<div class="text-sm text-muted-foreground truncate max-w-md">
												{task.description}
											</div>
										{/if}
									</td>
									<td class="px-6 py-4">
										<StatusBadge status={task.status} />
									</td>
									<td class="px-6 py-4">
										{#if task.priority}
											<span class="text-sm font-medium capitalize {getPriorityColor(task.priority)}">
												{task.priority}
											</span>
										{:else}
											<span class="text-sm text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if progress.total > 0}
											<div class="w-32">
												<ProgressBar
													value={progress.completed}
													max={progress.total}
													showPercentage={false}
													variant="success"
													size="sm"
												/>
												<p class="text-xs text-muted-foreground mt-1">
													{progress.completed}/{progress.total} subtasks
												</p>
											</div>
										{:else}
											<span class="text-sm text-muted-foreground">-</span>
										{/if}
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
	</div>
</div>
