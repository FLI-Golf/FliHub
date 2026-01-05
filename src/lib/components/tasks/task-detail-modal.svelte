<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { CheckSquare, Square, X, Calendar, Clock } from 'lucide-svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';

	let { open = $bindable(false), task } = $props();

	let subtasks = $state<any[]>([]);
	let isUpdating = $state(false);

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
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="w-full sm:max-w-3xl overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title class="text-2xl">{task?.title || 'Task Details'}</Sheet.Title>
		</Sheet.Header>

		{#if task}
			<div class="space-y-6">
				<!-- Task Info -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="text-sm text-muted-foreground mb-1">Status</div>
						<StatusBadge status={task.status} />
					</div>
					<div>
						<div class="text-sm text-muted-foreground mb-1">Priority</div>
						<span class="px-2 py-1 rounded-full text-xs font-medium capitalize
							{task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
							{task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
							{task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
							{task.priority === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
						">
							{task.priority || 'medium'}
						</span>
					</div>
				</div>

				<!-- Dates and Hours -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<div class="text-sm text-muted-foreground mb-1 flex items-center gap-1">
							<Calendar class="size-3" />
							Due Date
						</div>
						<div class="font-medium">{formatDate(task.dueDate)}</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground mb-1 flex items-center gap-1">
							<Clock class="size-3" />
							Hours
						</div>
						<div class="font-medium">
							{task.actualHours || 0} / {task.estimatedHours || 0}h
						</div>
					</div>
				</div>

				<!-- Description -->
				{#if task.description}
					<div>
						<div class="text-sm text-muted-foreground mb-2">Description</div>
						<div class="prose prose-sm dark:prose-invert max-w-none">
							{@html task.description}
						</div>
					</div>
				{/if}

				<!-- Subtasks Checklist -->
				{#if subtasks.length > 0}
					<div>
						<div class="text-sm text-muted-foreground mb-3 flex items-center justify-between">
							<span>Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
							<div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[200px] ml-4">
								<div 
									class="bg-blue-600 h-2 rounded-full transition-all"
									style="width: {subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length * 100) : 0}%"
								></div>
							</div>
						</div>
						<div class="space-y-2 max-h-[300px] overflow-y-auto">
							{#each subtasks as subtask, index}
								<button
									type="button"
									onclick={() => toggleSubtask(index)}
									disabled={isUpdating}
									class="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left disabled:opacity-50"
								>
									{#if subtask.completed}
										<CheckSquare class="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
									{:else}
										<Square class="size-5 text-slate-400 flex-shrink-0 mt-0.5" />
									{/if}
									<span class="flex-1 {subtask.completed ? 'line-through text-muted-foreground' : ''}">
										{subtask.text}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Notes -->
				{#if task.notes}
					<div>
						<div class="text-sm text-muted-foreground mb-2">Notes</div>
						<div class="prose prose-sm dark:prose-invert max-w-none">
							{@html task.notes}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<Sheet.Footer class="pt-6 border-t border-slate-700 mt-6">
			<Button variant="outline" onclick={() => (open = false)} class="w-full">
				<X class="size-4 mr-2" />
				Close
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
