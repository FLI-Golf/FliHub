<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Save, X } from 'lucide-svelte';

	let { open = $bindable(false), projectId = '' } = $props();

	let formData = $state({
		title: '',
		description: '',
		status: 'todo',
		priority: 'medium',
		startDate: '',
		dueDate: '',
		estimatedHours: '',
		notes: '',
		subTasksChecklist: '',
		projectId: projectId
	});

	let isSubmitting = $state(false);
	let error = $state('');

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
			const payload = {
				...formData,
				estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined
			};
			
			const response = await fetch('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || data.error || 'Failed to create task');
			}

			resetForm();
			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		formData = {
			title: '',
			description: '',
			status: 'todo',
			priority: 'medium',
			startDate: '',
			dueDate: '',
			estimatedHours: '',
			notes: '',
			subTasksChecklist: '',
			projectId: projectId
		};
		error = '';
	}
	
	function insertSample() {
		formData.subTasksChecklist = `- [ ] Research and planning
- [ ] Design mockups
- [ ] Development
- [ ] Testing
- [ ] Documentation
- [ ] Review and approval`;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) resetForm();
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Plus class="size-5" />
				Add New Task
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Create a new task to track work and progress.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="title" class="text-slate-200">Task Title *</Label>
				<Input
					id="title"
					bind:value={formData.title}
					placeholder="Enter task title"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<div class="space-y-2">
				<Label for="description" class="text-slate-200">Description</Label>
				<textarea
					id="description"
					bind:value={formData.description}
					placeholder="Task description"
					rows="3"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="status" class="text-slate-200">Status *</Label>
					<select
						id="status"
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
					<Label for="priority" class="text-slate-200">Priority *</Label>
					<select
						id="priority"
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
					<Label for="startDate" class="text-slate-200">Start Date</Label>
					<Input
						id="startDate"
						type="date"
						bind:value={formData.startDate}
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<Label for="dueDate" class="text-slate-200">Due Date</Label>
					<Input
						id="dueDate"
						type="date"
						bind:value={formData.dueDate}
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="estimatedHours" class="text-slate-200">Estimated Hours</Label>
				<Input
					id="estimatedHours"
					type="number"
					step="0.5"
					min="0"
					bind:value={formData.estimatedHours}
					placeholder="0"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="subtasks" class="text-slate-200">Subtasks Checklist</Label>
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
					id="subtasks"
					bind:value={formData.subTasksChecklist}
					placeholder="- [ ] First subtask&#10;- [ ] Second subtask&#10;- [ ] Third subtask"
					rows="6"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 font-mono"
				></textarea>
				<p class="text-xs text-slate-400">Use markdown format: - [ ] for unchecked, - [x] for checked</p>
			</div>

			<div class="space-y-2">
				<Label for="notes" class="text-slate-200">Notes</Label>
				<textarea
					id="notes"
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
					onclick={() => (open = false)}
					disabled={isSubmitting}
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					<X class="size-4 mr-2" />
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Save class="size-4 mr-2" />
					{isSubmitting ? 'Creating...' : 'Create Task'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
