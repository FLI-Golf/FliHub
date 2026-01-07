<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X, Trash2 } from 'lucide-svelte';

	let { open = $bindable(false), task } = $props();

	let formData = $state({
		title: '',
		description: '',
		status: 'todo',
		priority: 'medium',
		startDate: '',
		dueDate: '',
		estimatedHours: '',
		task_budget: '',
		actualHours: '',
		notes: '',
		subTasksChecklist: ''
	});

	let isSubmitting = $state(false);
	let isDeleting = $state(false);
	let error = $state('');

	// Format dates for input[type="date"] which expects YYYY-MM-DD
	function formatDateForInput(dateStr: string): string {
		if (!dateStr) return '';
		try {
			// Handle both date-only and datetime formats
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return '';
			
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		} catch {
			return '';
		}
	}

	// Update form data when task or open state changes
	$effect(() => {
		if (task && open) {
			formData.title = task.title || '';
			formData.description = task.description || '';
			formData.status = task.status || 'todo';
			formData.priority = task.priority || 'medium';
			formData.startDate = formatDateForInput(task.startDate);
			formData.dueDate = formatDateForInput(task.dueDate);
			formData.estimatedHours = task.estimatedHours?.toString() || '';
			formData.task_budget = task.task_budget?.toString() || '';
			formData.actualHours = task.actualHours?.toString() || '';
			formData.notes = task.notes || '';
			
			// If no subtasks, provide sample
			if (!task.subTasksChecklist || task.subTasksChecklist === '') {
				formData.subTasksChecklist = `- [ ] Research and planning
- [ ] Design mockups
- [ ] Development
- [ ] Testing
- [ ] Documentation
- [ ] Review and approval`;
			} else {
				formData.subTasksChecklist = task.subTasksChecklist;
			}
		}
	});
	
	function insertSample() {
		formData.subTasksChecklist = `- [ ] Research and planning
- [ ] Design mockups
- [ ] Development
- [ ] Testing
- [ ] Documentation
- [ ] Review and approval`;
	}

	const statuses = [
		{ value: 'todo', label: 'To Do' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'blocked', label: 'Blocked' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	const priorities = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'urgent', label: 'Urgent' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
					task_budget: formData.task_budget ? parseFloat(formData.task_budget) : 0,
					actualHours: formData.actualHours ? parseFloat(formData.actualHours) : undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update task');
			}

			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
			return;
		}

		isDeleting = true;
		error = '';

		try {
			const response = await fetch(`/api/tasks/${task.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete task');
			}

			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isDeleting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) error = '';
	}

	$effect(() => {
		formData = {
			title: task.title || '',
			description: task.description || '',
			status: task.status || 'todo',
			priority: task.priority || 'medium',
			startDate: task.startDate ? task.startDate.split('T')[0] : '',
			dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
			estimatedHours: task.estimatedHours?.toString() || '',
			actualHours: task.actualHours?.toString() || '',
			notes: task.notes || ''
		};
	});
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Edit class="size-5" />
				Edit Task
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update task details and progress.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="edit-title" class="text-slate-200">Task Title *</Label>
				<Input
					id="edit-title"
					bind:value={formData.title}
					placeholder="Enter task title"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<div class="space-y-2">
				<Label for="edit-description" class="text-slate-200">Description</Label>
				<textarea
					id="edit-description"
					bind:value={formData.description}
					placeholder="Task description"
					rows="3"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-status" class="text-slate-200">Status *</Label>
					<select
						id="edit-status"
						bind:value={formData.status}
						required
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
					>
						{#each statuses as status}
							<option value={status.value}>{status.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-priority" class="text-slate-200">Priority *</Label>
					<select
						id="edit-priority"
						bind:value={formData.priority}
						required
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
					>
						{#each priorities as priority}
							<option value={priority.value}>{priority.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-startDate" class="text-slate-200">Start Date</Label>
					<Input
						id="edit-startDate"
						type="date"
						bind:value={formData.startDate}
						class="bg-slate-800 border-slate-700 text-white [color-scheme:dark]"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-dueDate" class="text-slate-200">Due Date</Label>
					<Input
						id="edit-dueDate"
						type="date"
						bind:value={formData.dueDate}
						class="bg-slate-800 border-slate-700 text-white [color-scheme:dark]"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-estimatedHours" class="text-slate-200">Estimated Hours</Label>
					<Input
						id="edit-estimatedHours"
						type="number"
						step="0.5"
						min="0"
						bind:value={formData.estimatedHours}
						placeholder="0"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-actualHours" class="text-slate-200">Actual Hours</Label>
					<Input
						id="edit-actualHours"
						type="number"
						step="0.5"
						min="0"
						bind:value={formData.actualHours}
						placeholder="0"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="edit-task_budget" class="text-slate-200">Task Budget *</Label>
				<Input
					id="edit-task_budget"
					type="number"
					step="0.01"
					min="0"
					bind:value={formData.task_budget}
					placeholder="0.00"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="edit-subtasks" class="text-slate-200">Subtasks Checklist</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={insertSample}
						class="text-xs text-blue-400 hover:text-blue-300"
					>
						Insert Sample
					</Button>
				</div>
				<textarea
					id="edit-subtasks"
					bind:value={formData.subTasksChecklist}
					placeholder="- [ ] First subtask&#10;- [ ] Second subtask&#10;- [ ] Third subtask"
					rows="6"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 font-mono"
				></textarea>
				<p class="text-xs text-slate-400">Use markdown format: - [ ] for unchecked, - [x] for checked</p>
			</div>

			<div class="space-y-2">
				<Label for="edit-notes" class="text-slate-200">Notes</Label>
				<textarea
					id="edit-notes"
					bind:value={formData.notes}
					placeholder="Additional notes"
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				></textarea>
			</div>

			<Sheet.Footer class="flex gap-2 pt-6 border-t border-slate-700 mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={handleDelete}
					disabled={isSubmitting || isDeleting}
					class="bg-red-600 border-red-700 text-white hover:bg-red-700"
				>
					<Trash2 class="size-4 mr-2" />
					{isDeleting ? 'Deleting...' : 'Delete'}
				</Button>
				<div class="flex-1 flex gap-2">
					<Button
						type="button"
						variant="outline"
						onclick={() => (open = false)}
						disabled={isSubmitting || isDeleting}
						class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
					>
						<X class="size-4 mr-2" />
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting || isDeleting} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
						<Save class="size-4 mr-2" />
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
