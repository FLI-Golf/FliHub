<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { CheckSquare, Square, X, Calendar, Clock, Info, ListChecks, FileText, Pencil, Save } from 'lucide-svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import { tick } from 'svelte';

	let { open = $bindable(false), task = $bindable(), startInEdit = false, onUpdated = (_t: any) => {} } = $props();

	let subtasks = $state<any[]>([]);
	let sheetContent = $state<HTMLElement | null>(null);
	let isUpdating = $state(false);
	let checklistSaveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let checklistSaveMessage = $state('');
	let checklistLastSavedAt = $state<Date | null>(null);
	let isSaving = $state(false);
	let activeTab = $state<string>('details');
	let editMode = $state(false);
	let saveError = $state('');
	type EditFocus = 'status' | 'startDate' | 'dueDate' | 'completedDate' | 'priority' | 'estimatedHours' | 'actualHours' | 'taskBudget' | 'actualCost' | 'tags' | 'description' | 'notes';
	let statusField = $state<HTMLSelectElement | null>(null);
	let startDateField = $state<HTMLInputElement | null>(null);
	let dueDateField = $state<HTMLInputElement | null>(null);
	let completedDateField = $state<HTMLInputElement | null>(null);
	let priorityField = $state<HTMLSelectElement | null>(null);
	let estimatedHoursField = $state<HTMLInputElement | null>(null);
	let actualHoursField = $state<HTMLInputElement | null>(null);
	let taskBudgetField = $state<HTMLInputElement | null>(null);
	let actualCostField = $state<HTMLInputElement | null>(null);
	let tagsField = $state<HTMLInputElement | null>(null);
	let descriptionField = $state<HTMLTextAreaElement | null>(null);
	let notesField = $state<HTMLTextAreaElement | null>(null);

	let form = $state({
		title: '',
		status: '',
		priority: '',
		dueDate: '',
		startDate: '',
		completedDate: '',
		estimatedHours: '',
		actualHours: '',
		task_budget: '',
		task_actual_cost: '',
		tags: '',
		description: '',
		notes: ''
	});

	$effect(() => {
		if (task?.subTasksChecklist) subtasks = parseSubtasks(task.subTasksChecklist);
		else subtasks = [];
	});

	$effect(() => {
		if (task) {
			resetForm();
		}
	});

	$effect(() => {
		if (open && task && startInEdit) {
			enterEditMode();
		}
	});

	function parseSubtasks(data: any): any[] {
		if (!data) return [];
		if (typeof data === 'string') {
			return data.split('\n')
				.filter((l: string) => l.includes('[ ]') || l.includes('[x]') || l.includes('[X]'))
				.map((l: string, i: number) => ({ id: i, text: l.replace(/^[*-]\s*\[([ xX])\]\s*/, '').trim(), completed: l.includes('[x]') || l.includes('[X]') }));
		}
		if (Array.isArray(data)) return data;
		return [];
	}

	async function toggleSubtask(index: number) {
		isUpdating = true;
		checklistSaveStatus = 'saving';
		checklistSaveMessage = 'Saving...';
		subtasks[index].completed = !subtasks[index].completed;
		try {
			const markdown = subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.text}`).join('\n');
			const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subTasksChecklist: markdown }) });
			if (!res.ok) throw new Error('Failed');
			checklistLastSavedAt = new Date();
			checklistSaveStatus = 'saved';
			checklistSaveMessage = 'Saved';
		} catch {
			subtasks[index].completed = !subtasks[index].completed;
			checklistSaveStatus = 'error';
			checklistSaveMessage = 'Could not save checklist. Try again.';
		}
		finally { isUpdating = false; }
	}

	async function saveDetails() {
		isSaving = true;
		saveError = '';
		try {
			const completedDate = form.completedDate || (form.status === 'completed' ? new Date().toISOString() : null);
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: form.title,
					status: form.status,
					priority: form.priority,
					dueDate: form.dueDate || null,
					startDate: form.startDate || null,
					completedDate,
					estimatedHours: Number(form.estimatedHours) || 0,
					actualHours: Number(form.actualHours) || 0,
					task_budget: Number(form.task_budget) || 0,
					task_actual_cost: Number(form.task_actual_cost) || 0,
					tags: form.tags,
					description: form.description,
					notes: form.notes
				})
			});
			if (!res.ok) throw new Error('Failed to save');
			const updated = await res.json();
			task = { ...task, ...updated };
			editMode = false;
			onUpdated(updated);
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Save failed';
		} finally { isSaving = false; }
	}

	function toDateInput(value: string | null | undefined): string {
		if (!value) return '';
		return value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
	}

	function resetForm() {
		form = {
			title:            task.title || '',
			status:           task.status || 'todo',
			priority:         task.priority || 'medium',
			dueDate:          toDateInput(task.dueDate),
			startDate:        toDateInput(task.startDate),
			completedDate:    toDateInput(task.completedDate),
			estimatedHours:   task.estimatedHours?.toString() || '',
			actualHours:      task.actualHours?.toString() || '',
			task_budget:      task.task_budget?.toString() || '',
			task_actual_cost: task.task_actual_cost?.toString() || '',
			tags:             task.tags || '',
			description:      task.description || '',
			notes:            task.notes || ''
		};
	}

	function cancelEdit() {
		resetForm();
		editMode = false;
		saveError = '';
	}

	async function enterEditMode(focus?: EditFocus) {
		activeTab = 'details';
		editMode = true;
		await tick();
		sheetContent?.scrollTo({ top: 0, behavior: 'smooth' });
		const fieldMap: Record<EditFocus, HTMLElement | null> = {
			status: statusField,
			startDate: startDateField,
			dueDate: dueDateField,
			completedDate: completedDateField,
			priority: priorityField,
			estimatedHours: estimatedHoursField,
			actualHours: actualHoursField,
			taskBudget: taskBudgetField,
			actualCost: actualCostField,
			tags: tagsField,
			description: descriptionField,
			notes: notesField
		};
		if (focus) {
			fieldMap[focus]?.focus();
			fieldMap[focus]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function formatDate(d: string): string {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatLastSaved(d: Date | null): string {
		if (!d) return '';
		const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
		if (seconds < 10) return 'Last saved just now';
		if (seconds < 60) return `Last saved ${seconds}s ago`;
		return `Last saved ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) { editMode = false; saveError = ''; }
	}

	let tabs = $derived([
		{ value: 'details',   label: 'Details',   icon: Info },
		{ value: 'checklist', label: 'Checklist', count: subtasks.length, icon: ListChecks },
		{ value: 'notes',     label: 'Notes',     icon: FileText }
	]);

	const statusOptions = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'];
	const priorityOptions = ['low', 'medium', 'high', 'urgent'];
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content bind:ref={sheetContent} side="left" class="w-full sm:max-w-3xl overflow-y-auto bg-slate-900 text-white border-slate-800">
		<Sheet.Header class="border-b border-slate-800 pb-4">
			{#if editMode}
				<Input bind:value={form.title} class="text-xl font-bold bg-slate-800 border-slate-600 text-white" />
			{:else}
				<Sheet.Title class="text-2xl text-white">{task?.title || 'Task Details'}</Sheet.Title>
			{/if}
			<Sheet.Description class="text-slate-400">
				{editMode ? 'Editing — save or cancel when done' : 'View task details and manage subtasks'}
			</Sheet.Description>
		</Sheet.Header>

		{#if task}
			<div class="py-6">
				<div class="mb-6">
					<VisualTabs tabs={tabs} activeTab={activeTab} onTabChange={(v) => { activeTab = v; editMode = false; }} variant="button" />
				</div>

				<div class="space-y-6">
					{#if activeTab === 'details'}
						{#if saveError}
							<div class="p-3 rounded-lg bg-red-900/30 border border-red-700 text-sm text-red-300">{saveError}</div>
						{/if}

						{#if editMode}
							<div class="grid grid-cols-2 gap-6">
								<div class="space-y-4">
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Status</Label>
										<select bind:this={statusField} bind:value={form.status} class="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
											{#each statusOptions as s}<option value={s}>{s.replace('_', ' ')}</option>{/each}
										</select>
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Start Date</Label>
										<Input bind:ref={startDateField} type="date" bind:value={form.startDate} class="bg-slate-800 border-slate-600 text-white [color-scheme:dark]" />
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Due Date</Label>
										<Input bind:ref={dueDateField} type="date" bind:value={form.dueDate} class="bg-slate-800 border-slate-600 text-white [color-scheme:dark]" />
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Completed Date</Label>
										<Input bind:ref={completedDateField} type="date" bind:value={form.completedDate} class="bg-slate-800 border-slate-600 text-white [color-scheme:dark]" />
									</div>
								</div>
								<div class="space-y-4">
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Priority</Label>
										<select bind:this={priorityField} bind:value={form.priority} class="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
											{#each priorityOptions as p}<option value={p}>{p}</option>{/each}
										</select>
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Estimated Hours</Label>
										<Input bind:ref={estimatedHoursField} type="number" min="0" step="0.5" bind:value={form.estimatedHours} class="bg-slate-800 border-slate-600 text-white" />
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Actual Hours</Label>
										<Input bind:ref={actualHoursField} type="number" min="0" step="0.5" bind:value={form.actualHours} class="bg-slate-800 border-slate-600 text-white" />
									</div>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-6 pt-4 border-t border-slate-700">
								<div class="space-y-1">
									<Label class="text-slate-400 text-sm">Task Budget ($)</Label>
									<Input bind:ref={taskBudgetField} type="number" min="0" step="0.01" bind:value={form.task_budget} placeholder="0.00" class="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
								</div>
								<div class="space-y-1">
									<Label class="text-slate-400 text-sm">Actual Cost ($)</Label>
									<Input bind:ref={actualCostField} type="number" min="0" step="0.01" bind:value={form.task_actual_cost} placeholder="0.00" class="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
								</div>
							</div>
							<div class="space-y-1 pt-4 border-t border-slate-700">
								<Label class="text-slate-400 text-sm">Tags</Label>
								<Input bind:ref={tagsField} bind:value={form.tags} placeholder="community, outreach, school" class="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500" />
							</div>
							<div class="space-y-1 pt-4 border-t border-slate-700">
								<Label class="text-slate-400 text-sm">Description</Label>
								<textarea bind:this={descriptionField} bind:value={form.description} rows="5" placeholder="Task description..." class="flex w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
							</div>
							<div class="space-y-1 pt-4 border-t border-slate-700">
								<Label class="text-slate-400 text-sm">Notes</Label>
								<textarea bind:this={notesField} bind:value={form.notes} rows="4" placeholder="Internal notes..." class="flex w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
							</div>
						{:else}
							<div class="space-y-3">
								<!-- Status + Priority -->
								<div class="flex flex-wrap gap-3">
									<button type="button" onclick={() => enterEditMode('status')} class="flex-1 min-w-[140px] bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1.5">Status</div>
										<StatusBadge status={task.status} />
									</button>
									<button type="button" onclick={() => enterEditMode('priority')} class="flex-1 min-w-[140px] bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1.5">Priority</div>
										<span class="px-2.5 py-1 rounded-full text-xs font-semibold capitalize
											{task.priority === 'urgent' ? 'bg-red-900/40 text-red-300 border border-red-700/50' : ''}
											{task.priority === 'high'   ? 'bg-orange-900/40 text-orange-300 border border-orange-700/50' : ''}
											{task.priority === 'medium' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' : ''}
											{task.priority === 'low'    ? 'bg-green-900/40 text-green-300 border border-green-700/50' : ''}
										">{task.priority || 'medium'}</span>
									</button>
								</div>
								<!-- Dates -->
								<div class="grid grid-cols-3 gap-3">
									<button type="button" onclick={() => enterEditMode('startDate')} class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar class="size-3" />Start</div>
										<div class="text-sm font-medium text-white">{formatDate(task.startDate)}</div>
									</button>
									<button type="button" onclick={() => enterEditMode('dueDate')} class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar class="size-3" />Due</div>
										<div class="text-sm font-medium text-white">{formatDate(task.dueDate)}</div>
									</button>
									<button type="button" onclick={() => enterEditMode('completedDate')} class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar class="size-3" />Completed</div>
										<div class="text-sm font-medium {task.completedDate ? 'text-emerald-400' : 'text-slate-600'}">{formatDate(task.completedDate)}</div>
									</button>
								</div>
								<!-- Hours + Budget -->
								<div class="grid grid-cols-2 gap-3">
									<button type="button" onclick={() => enterEditMode('actualHours')} class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock class="size-3" />Hours</div>
										<div class="text-sm font-medium text-white tabular-nums">
											{task.actualHours || 0}h actual
											<span class="text-slate-500 text-xs">/ {task.estimatedHours || 0}h est.</span>
										</div>
										{#if (task.estimatedHours || 0) > 0}
											<div class="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
												<div class="h-full rounded-full bg-blue-500 transition-all"
													style="width:{Math.min(100,((task.actualHours||0)/(task.estimatedHours||1))*100).toFixed(0)}%">
												</div>
											</div>
										{/if}
									</button>
									<button type="button" onclick={() => enterEditMode('taskBudget')} class="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-1">Budget</div>
										{#if (task.task_budget || 0) > 0}
											<div class="text-sm font-medium text-white tabular-nums">
												${(task.task_budget||0).toLocaleString()} <span class="text-slate-500 text-xs">budgeted</span>
											</div>
										{/if}
										{#if (task.task_actual_cost || 0) > 0}
											<div class="text-sm text-emerald-400 tabular-nums">
												${(task.task_actual_cost||0).toLocaleString()} <span class="text-slate-500 text-xs">actual</span>
											</div>
										{/if}
										{#if !(task.task_budget || 0) && !(task.task_actual_cost || 0)}
											<span class="text-slate-600 text-sm">—</span>
										{/if}
									</button>
								</div>
								<!-- Tags -->
								{#if task.tags}
									<button type="button" onclick={() => enterEditMode('tags')} class="w-full bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-2">Tags</div>
										<div class="flex flex-wrap gap-1.5">
											{#each task.tags.split(',').map((t: string) => t.trim()).filter(Boolean) as tag}
												<span class="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300 border border-slate-600">{tag}</span>
											{/each}
										</div>
									</button>
								{/if}
								<!-- Description -->
								{#if task.description}
									<button type="button" onclick={() => enterEditMode('description')} class="w-full bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-left hover:border-blue-500/60 hover:bg-slate-800 transition-colors">
										<div class="text-xs text-slate-500 mb-2">Description</div>
										<div class="prose prose-sm dark:prose-invert max-w-none text-slate-300 leading-relaxed">{@html task.description}</div>
									</button>
								{/if}
							</div>
						{/if}

					{:else if activeTab === 'checklist'}
						{#if subtasks.length > 0}
							<div>
								<div class="mb-6 p-4 bg-slate-800/50 rounded-lg">
									<div class="flex items-center justify-between gap-4">
										<span class="text-sm font-medium">Progress: {subtasks.filter(s => s.completed).length} of {subtasks.length} completed</span>
										<div class="flex-1 bg-slate-700 rounded-full h-3 max-w-[300px]">
											<div class="bg-green-600 h-3 rounded-full transition-all" style="width: {subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length * 100) : 0}%"></div>
										</div>
									</div>
									<div class="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs">
										<span
											class="{checklistSaveStatus === 'saving' ? 'text-blue-300' : checklistSaveStatus === 'saved' ? 'text-emerald-300' : checklistSaveStatus === 'error' ? 'text-red-300' : 'text-slate-500'}"
											aria-live="polite"
										>
											{#if checklistSaveMessage}
												{checklistSaveMessage}
											{:else}
												Checklist autosaves as you mark items complete.
											{/if}
										</span>
										{#if checklistLastSavedAt && checklistSaveStatus !== 'saving'}
											<span class="text-slate-500">{formatLastSaved(checklistLastSavedAt)}</span>
										{/if}
									</div>
								</div>
								<div class="space-y-3">
									{#each subtasks as subtask, index}
										<button type="button" onclick={() => toggleSubtask(index)} disabled={isUpdating}
											class="flex items-start gap-4 w-full p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800 transition-colors text-left disabled:opacity-50 border border-slate-700 hover:border-slate-600">
											{#if subtask.completed}
												<CheckSquare class="size-6 text-green-500 flex-shrink-0 mt-0.5" />
											{:else}
												<Square class="size-6 text-slate-400 flex-shrink-0 mt-0.5" />
											{/if}
											<span class="flex-1 text-base {subtask.completed ? 'line-through text-slate-500' : 'text-white'}">{subtask.text}</span>
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
						{#if task.notes}
							<div class="prose prose-sm dark:prose-invert max-w-none bg-slate-800/50 p-6 rounded-lg">{@html task.notes}</div>
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

		<Sheet.Footer class="pt-6 border-t border-slate-700 mt-6 flex gap-2">
			{#if activeTab === 'details' && editMode}
				<Button variant="outline" onclick={cancelEdit} disabled={isSaving} class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Cancel
				</Button>
				<Button onclick={saveDetails} disabled={isSaving} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Save class="size-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Details'}
				</Button>
			{:else if activeTab === 'details'}
				<Button variant="outline" onclick={() => (open = false)} class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Close
				</Button>
				<Button onclick={() => enterEditMode()} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Pencil class="size-4 mr-2" /> Update Details
				</Button>
			{:else if activeTab === 'notes'}
				<Button variant="outline" onclick={() => (open = false)} class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Close
				</Button>
				<Button onclick={() => enterEditMode('notes')} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Pencil class="size-4 mr-2" /> Update Notes
				</Button>
			{:else}
				<Button variant="outline" onclick={() => (open = false)} class="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Close
				</Button>
			{/if}
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
