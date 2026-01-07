<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { CheckSquare, Square, X, Calendar, Clock, Info, ListChecks, FileText } from 'lucide-svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';

	let { open = $bindable(false), task } = $props();

	let subtasks = $state<any[]>([]);
	let isUpdating = $state(false);
	let activeTab = $state<string>('details');

	// Parse subtasks when task changes
	$effect(() => {
		if (task?.subTasksChecklist) {
			subtasks = parseSubtasks(task.subTasksChecklist);
		} else {
			subtasks = [];
		}
	});

	function parseSubtasks(data: any): any[] {
		if (!data) return [];
		
		if (typeof data === 'string') {
			const lines = data.split('\n').filter((line: string) => line.trim());
			return lines
				.filter((line: string) => line.includes('[ ]') || line.includes('[x]') || line.includes('[X]'))
				.map((line: string, index: number) => ({
					id: index,
					text: line.replace(/^[*-]\s*\[([ xX])\]\s*/, '').trim(),
					completed: line.includes('[x]') || line.includes('[X]')
				}));
		}
		
		if (Array.isArray(data)) {
			return data;
		}
		
		return [];
	}

	async function toggleSubtask(index: number) {
		isUpdating = true;
		subtasks[index].completed = !subtasks[index].completed;

		try {
			// Convert back to markdown format
			const markdown = subtasks
				.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`)
				.join('\n');

			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subTasksChecklist: markdown
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update subtask');
			}
		} catch (error) {
			console.error('Error updating subtask:', error);
			// Revert on error
			subtasks[index].completed = !subtasks[index].completed;
		} finally {
			isUpdating = false;
		}
	}

	function formatDate(dateString: string): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Build tabs
	let tabs = $derived([
		{ value: 'details', label: 'Details', icon: Info },
		{ value: 'checklist', label: 'Checklist', count: subtasks.length, icon: ListChecks },
		{ value: 'notes', label: 'Notes', icon: FileText }
	]);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="left" class="w-full sm:max-w-3xl overflow-y-auto bg-slate-900 text-white border-slate-800">
		<Sheet.Header class="border-b border-slate-800 pb-4">
			<Sheet.Title class="text-2xl text-white">{task?.title || 'Task Details'}</Sheet.Title>
			<Sheet.Description class="text-slate-400">View task details and manage subtasks</Sheet.Description>
		</Sheet.Header>

		{#if task}
			<div class="py-6">
				<!-- Tabs -->
				<div class="mb-6">
					<VisualTabs
						tabs={tabs}
						activeTab={activeTab}
						onTabChange={(v) => activeTab = v}
						variant="button"
					/>
				</div>

				<!-- Tab Content -->
				<div class="space-y-6">
					{#if activeTab === 'details'}
						<!-- Task Info -->
						<div class="grid grid-cols-2 gap-6">
							<div class="space-y-4">
								<div>
									<div class="text-sm text-slate-400 mb-2">Status</div>
									<StatusBadge status={task.status} />
								</div>
								<div>
									<div class="text-sm text-slate-400 mb-2 flex items-center gap-1">
										<Calendar class="size-3" />
										Due Date
									</div>
									<div class="font-medium text-lg">{formatDate(task.dueDate)}</div>
								</div>
							</div>
							<div class="space-y-4">
								<div>
									<div class="text-sm text-slate-400 mb-2">Priority</div>
									<span class="px-3 py-1.5 rounded-full text-sm font-medium capitalize
										{task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
										{task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
										{task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
										{task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
									">
										{task.priority || 'medium'}
									</span>
								</div>
								<div>
									<div class="text-sm text-slate-400 mb-2 flex items-center gap-1">
										<Clock class="size-3" />
										Hours
									</div>
									<div class="font-medium text-lg">
										{task.actualHours || 0} / {task.estimatedHours || 0}h
									</div>
								</div>
							</div>
						</div>

						<!-- Description -->
						{#if task.description}
							<div class="pt-4 border-t border-slate-700">
								<div class="text-sm text-slate-400 mb-3">Description</div>
								<div class="prose prose-sm dark:prose-invert max-w-none bg-slate-800/50 p-4 rounded-lg">
									{@html task.description}
								</div>
							</div>
						{/if}

					{:else if activeTab === 'checklist'}
						<!-- Subtasks Checklist -->
						{#if subtasks.length > 0}
							<div>
								<div class="flex items-center justify-between mb-6 p-4 bg-slate-800/50 rounded-lg">
									<span class="text-sm font-medium">Progress: {subtasks.filter(s => s.completed).length} of {subtasks.length} completed</span>
									<div class="flex-1 bg-slate-700 rounded-full h-3 max-w-[300px] ml-6">
										<div 
											class="bg-green-600 h-3 rounded-full transition-all"
											style="width: {subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length * 100) : 0}%"
										></div>
									</div>
								</div>
								<div class="space-y-3">
									{#each subtasks as subtask, index}
										<button
											type="button"
											onclick={() => toggleSubtask(index)}
											disabled={isUpdating}
											class="flex items-start gap-4 w-full p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800 transition-colors text-left disabled:opacity-50 border border-slate-700 hover:border-slate-600"
										>
											{#if subtask.completed}
												<CheckSquare class="size-6 text-green-500 flex-shrink-0 mt-0.5" />
											{:else}
												<Square class="size-6 text-slate-400 flex-shrink-0 mt-0.5" />
											{/if}
											<span class="flex-1 text-base {subtask.completed ? 'line-through text-slate-500' : 'text-white'}">
												{subtask.text}
											</span>
										</button>
									{/each}
								</div>
							</div>
						{:else}
							<div class="text-center py-12 text-slate-400">
								<ListChecks class="size-12 mx-auto mb-3 opacity-50" />
								<p>No checklist items for this task</p>
							</div>
						{/if}

					{:else if activeTab === 'notes'}
						<!-- Notes -->
						{#if task.notes}
							<div class="prose prose-sm dark:prose-invert max-w-none bg-slate-800/50 p-6 rounded-lg">
								{@html task.notes}
							</div>
						{:else}
							<div class="text-center py-12 text-slate-400">
								<FileText class="size-12 mx-auto mb-3 opacity-50" />
								<p>No notes for this task</p>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		<Sheet.Footer class="pt-6 border-t border-slate-700 mt-6">
			<Button variant="outline" onclick={() => (open = false)} class="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
				<X class="size-4 mr-2" />
				Close
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
