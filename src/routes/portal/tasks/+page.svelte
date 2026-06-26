<script lang="ts">
	import type { PageData } from './$types';
	import { CheckSquare } from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const tasks = $derived((data as any).tasks ?? []);
	const projects = $derived((data as any).projects ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-blue-400');

	function parseSubtasks(checklist: any): Array<{text: string, completed: boolean}> {
		if (!checklist) return [];
		
		// Handle markdown checklist format: "- [ ] item" or "- [x] item"
		if (typeof checklist === 'string') {
			const lines = checklist.split('\n').filter(line => line.trim().startsWith('-'));
			return lines.map(line => {
				const match = line.match(/^-\s+\[(.)\]\s+(.*)$/);
				if (match) {
					return {
						text: match[2].trim(),
						completed: match[1].toLowerCase() !== ' '
					};
				}
				return null;
			}).filter((item): item is {text: string, completed: boolean} => item !== null);
		}
		
		// Handle JSON format: [{text, completed}]
		if (typeof checklist === 'object' && Array.isArray(checklist)) {
			return checklist;
		}
		
		return [];
	}

	const taskStatusOptions = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'];
	
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			'todo': 'bg-slate-700 text-slate-300',
			'in_progress': 'bg-blue-900/40 text-blue-300',
			'completed': 'bg-emerald-900/40 text-emerald-300',
			'blocked': 'bg-red-900/40 text-red-300',
			'cancelled': 'bg-slate-800 text-slate-400'
		};
		return colors[status] || 'bg-slate-700 text-slate-300';
	}

	function getProjectName(projectId: string): string {
		return projects.find((p: any) => p.id === projectId)?.name || 'Unknown Project';
	}

	// Task workflow pipeline
	const workflowStages = [
		{ id: 'created', label: 'Created', description: 'Task created' },
		{ id: 'in_progress', label: 'In Progress', description: 'Work underway' },
		{ id: 'in_review', label: 'Review', description: 'Awaiting approval' },
		{ id: 'approved', label: 'Approved', description: 'Review passed' },
		{ id: 'paid', label: 'Paid', description: 'Payment processed', success: true }
	];

	function getTaskStageIndex(status: string): number {
		if (status === 'todo') return 0;
		if (status === 'in_progress') return 1;
		if (status === 'needs_review') return 2;
		if (status === 'approved') return 3;
		if (status === 'completed') return 4;
		return -1;
	}

	function getStageStatus(task: { status?: string }): { stage: number; isFailed: boolean; message: string } {
		const failureStages = ['blocked', 'cancelled'];
		if (failureStages.includes(task.status || '')) {
			return { stage: -1, isFailed: true, message: `Task ${task.status}` };
		}
		const stage = getTaskStageIndex(task.status || 'todo');
		const messages: Record<number, string> = {
			0: 'Ready to start work',
			1: 'In progress - mark for review when done',
			2: 'Awaiting approval',
			3: 'Approved - ready for payment',
			4: 'Paid ✓'
		};
		return { stage, isFailed: false, message: messages[stage] || 'Unknown status' };
	}
</script>

<svelte:head><title>Tasks — Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-white flex items-center gap-2">
			<CheckSquare class="size-6 {accentText}" /> Tasks
		</h1>
		<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">{tasks.length} total</span>
	</div>

	{#if tasks.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<CheckSquare class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No tasks in your projects.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each tasks as task (task.id)}
				{@const projectName = getProjectName(task.projectId)}
				<div class="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors overflow-hidden">
					<!-- Task Header -->
					<div class="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
						<div class="flex items-center justify-between gap-4 mb-2">
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-white truncate">{task.task || task.title || '(Untitled)'}</h3>
								<p class="text-xs text-slate-400 mt-1">{projectName}</p>
							</div>
							<!-- Status Dropdown -->
							<form method="POST" action="?/updateTaskStatus" class="shrink-0">
								<input type="hidden" name="taskId" value={task.id} />
								<select
									name="status"
									value={task.status || 'todo'}
									onchange={(e) => e.currentTarget.form?.submit()}
									class="text-xs font-semibold px-2.5 py-1.5 rounded border-0 cursor-pointer {getStatusColor(task.status || 'todo')} focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
								>
									{#each taskStatusOptions as opt}
										<option value={opt}>{opt.replace('_', ' ')}</option>
									{/each}
								</select>
							</form>
						</div>
					</div>

					<!-- Workflow Pipeline -->
				<div class="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
					<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Payment Pipeline</p>
					
					{#if ['blocked', 'cancelled'].includes(task.status || '')}
						<div class="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50">
							<div class="text-red-400">⚠️</div>
							<div>
								<p class="text-sm font-semibold text-red-300">Task {task.status}</p>
								<p class="text-xs text-red-400">This task will not be paid</p>
							</div>
						</div>
					{:else}
						{@const stageNum = getTaskStageIndex(task.status || 'todo')}
						<div class="space-y-2">
							<!-- Pipeline Progress -->
							<div class="flex gap-1">
								{#each workflowStages as stage, idx}
									<div class="flex-1 flex items-center gap-1">
										<div class="flex-1">
											<div class="h-2 rounded-full {idx <= stageNum ? (stage.success ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-700'}"></div>
										</div>
										{#if idx < workflowStages.length - 1}
											<div class="text-slate-600">→</div>
										{/if}
									</div>
								{/each}
							</div>
							
							<!-- Stage Labels -->
							<div class="grid grid-cols-5 gap-1">
								{#each workflowStages as stage, idx}
									<div class="text-center">
										<p class="text-xs font-semibold {idx <= stageNum ? (stage.success ? 'text-emerald-400' : 'text-blue-400') : 'text-slate-500'}">
											{#if idx < stageNum}
												✓
											{:else if idx === stageNum}
												●
											{:else}
												○
											{/if}
										</p>
										<p class="text-[10px] text-slate-400 leading-tight">{stage.label}</p>
									</div>
								{/each}
							</div>

							<!-- Status Message -->
							<p class="text-xs text-slate-400 mt-2 p-2 rounded bg-slate-800/30">
								{stageNum === 0 ? 'Ready to start work' : stageNum === 1 ? 'In progress - mark for review when done' : stageNum === 2 ? 'Awaiting approval' : stageNum === 3 ? 'Approved - ready for payment' : 'Paid ✓'}
							</p>
						</div>
					{/if}
				</div>

				<!-- Subtasks (if any) -->
				{#if task.subTasksChecklist && parseSubtasks(task.subTasksChecklist).length > 0}
					<div class="px-6 py-4 bg-slate-800/20 space-y-2 border-b border-slate-800">
						<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Subtasks</p>
						<div class="space-y-1.5">
							{#each parseSubtasks(task.subTasksChecklist) as subtask}
								<div class="text-sm text-slate-400 flex items-start gap-2">
									<span class="text-slate-500 mt-0.5">{subtask.completed ? '✓' : '○'}</span>
									<span class="{subtask.completed ? 'line-through text-slate-500' : ''}">{subtask.text}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

					<!-- Task Details -->
					<div class="px-6 py-4 space-y-3">
						{#if task.track}
							<div>
								<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Phase</p>
								<p class="text-sm text-slate-300">{task.track}</p>
							</div>
						{/if}

						{#if task.strategicGoal}
							<div>
								<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Strategic Goal</p>
								<p class="text-sm text-slate-300">{task.strategicGoal}</p>
							</div>
						{/if}

						{#if task.dueDate}
							<div>
								<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Due Date</p>
								<p class="text-sm text-slate-300">
									{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
								</p>
							</div>
						{/if}

						{#if task.budget || task.actualCost}
							<div class="grid grid-cols-2 gap-3">
								{#if task.budget}
									<div>
										<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Budget</p>
										<p class="text-sm font-semibold text-slate-300">
											${task.budget.toLocaleString()}
										</p>
									</div>
								{/if}
								{#if task.actualCost}
									<div>
										<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Actual Cost</p>
										<p class="text-sm font-semibold text-amber-300">
											${task.actualCost.toLocaleString()}
										</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
