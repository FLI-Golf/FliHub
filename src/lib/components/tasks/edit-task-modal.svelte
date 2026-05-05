<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X, Trash2, Plus, GripVertical, CheckSquare, Square } from 'lucide-svelte';

	let { open = $bindable(false), task, expenses = { total: 0, paid: 0 } }: {
		open: boolean;
		task: any;
		expenses?: { total: number; paid: number };
	} = $props();

	const formatCurrency = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

	const budgetUsedPct = $derived(() => {
		const budget = parseFloat(formData.task_budget) || 0;
		if (!budget) return 0;
		return Math.min(100, (expenses.total / budget) * 100);
	});

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

	// Interactive subtask list
	interface Subtask { id: number; text: string; done: boolean; }
	let subtasks = $state<Subtask[]>([]);
	let newSubtaskText = $state('');
	let nextId = $state(0);

	function parseMarkdown(md: string): Subtask[] {
		if (!md?.trim()) return [];
		return md.split('\n')
			.filter(l => l.trim().match(/^- \[[ x]\]/i))
			.map(l => ({
				id: nextId++,
				done: /^- \[x\]/i.test(l.trim()),
				text: l.trim().replace(/^- \[[ x]\]\s*/i, '').trim(),
			}));
	}

	function toMarkdown(items: Subtask[]): string {
		return items.map(s => `- [${s.done ? 'x' : ' '}] ${s.text}`).join('\n');
	}

	function addSubtask() {
		const t = newSubtaskText.trim();
		if (!t) return;
		subtasks = [...subtasks, { id: nextId++, text: t, done: false }];
		newSubtaskText = '';
	}

	function removeSubtask(id: number) {
		subtasks = subtasks.filter(s => s.id !== id);
	}

	function toggleSubtask(id: number) {
		subtasks = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
	}

	const subtasksDone  = $derived(subtasks.filter(s => s.done).length);
	const subtasksPct   = $derived(subtasks.length ? Math.round((subtasksDone / subtasks.length) * 100) : 0);

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
			
			// Parse subtasks into interactive list
			subtasks = parseMarkdown(task.subTasksChecklist || '');
			newSubtaskText = '';
		}
	});
	


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
					subTasksChecklist: toMarkdown(subtasks),
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

			<!-- Actual vs Budget panel -->
			{#if parseFloat(formData.task_budget) > 0 || expenses.total > 0}
				{@const budget = parseFloat(formData.task_budget) || 0}
				{@const pct = budget > 0 ? Math.min(100, (expenses.total / budget) * 100) : 0}
				{@const over = expenses.total > budget && budget > 0}
				<div class="rounded-lg border {over ? 'border-red-700/50 bg-red-900/20' : 'border-slate-700 bg-slate-800/50'} p-3 space-y-2">
					<div class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Budget Tracker</div>
					<div class="grid grid-cols-3 gap-2 text-center text-xs">
						<div>
							<div class="text-slate-400">Budgeted</div>
							<div class="font-bold text-slate-100">{formatCurrency(budget)}</div>
						</div>
						<div>
							<div class="text-slate-400">Actual Spend</div>
							<div class="font-bold {over ? 'text-red-300' : 'text-emerald-300'}">{formatCurrency(expenses.total)}</div>
						</div>
						<div>
							<div class="text-slate-400">{over ? 'Over by' : 'Remaining'}</div>
							<div class="font-bold {over ? 'text-red-300' : 'text-cyan-300'}">{formatCurrency(Math.abs(budget - expenses.total))}</div>
						</div>
					</div>
					{#if budget > 0}
						<div class="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
							<div
								class="h-full rounded-full transition-all {over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-emerald-500'}"
								style="width: {pct}%"
							></div>
						</div>
						<div class="text-right text-[10px] text-slate-500">{pct.toFixed(0)}% used</div>
					{/if}
					{#if expenses.paid > 0 && expenses.paid < expenses.total}
						<div class="text-xs text-slate-400 pt-1 border-t border-slate-700">
							Paid: <span class="text-emerald-300 font-medium">{formatCurrency(expenses.paid)}</span>
							· Pending: <span class="text-yellow-300 font-medium">{formatCurrency(expenses.total - expenses.paid)}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Subtasks -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label class="text-slate-200 flex items-center gap-2">
						<CheckSquare class="size-4 text-slate-400" />
						Subtasks
						{#if subtasks.length}
							<span class="text-xs font-normal text-slate-500">{subtasksDone}/{subtasks.length} done</span>
						{/if}
					</Label>
				</div>

				{#if subtasks.length}
					<!-- Progress bar -->
					<div class="h-1 rounded-full bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full bg-emerald-500 transition-all duration-300" style="width:{subtasksPct}%"></div>
					</div>

					<!-- Checklist items -->
					<div class="space-y-1 max-h-64 overflow-y-auto pr-1">
						{#each subtasks as s (s.id)}
							<div class="flex items-start gap-2 group/item rounded-lg px-2 py-1.5 hover:bg-slate-800/60">
								<button type="button" onclick={() => toggleSubtask(s.id)}
									class="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-400 transition-colors">
									{#if s.done}
										<CheckSquare class="size-4 text-emerald-400" />
									{:else}
										<Square class="size-4" />
									{/if}
								</button>
								<span class="flex-1 text-sm {s.done ? 'line-through text-slate-500' : 'text-slate-200'} leading-snug">{s.text}</span>
								<button type="button" onclick={() => removeSubtask(s.id)}
									class="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-600 hover:text-red-400 shrink-0">
									<X class="size-3.5" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-slate-500 italic">No subtasks yet — add one below.</p>
				{/if}

				<!-- Add new subtask -->
				<div class="flex gap-2 pt-1">
					<input
						bind:value={newSubtaskText}
						onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
						placeholder="Add a subtask…"
						class="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
					/>
					<button type="button" onclick={addSubtask}
						class="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
						<Plus class="size-3.5" /> Add
					</button>
				</div>
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
