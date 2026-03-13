<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { CheckSquare, Square, X, Calendar, Clock, Info, ListChecks, FileText, Pencil, Save } from 'lucide-svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';

	let { open = $bindable(false), task = $bindable(), onUpdated = (_t: any) => {} } = $props();

	let subtasks = $state<any[]>([]);
	let isUpdating = $state(false);
	let isSaving = $state(false);
	let activeTab = $state<string>('details');
	let editMode = $state(false);
	let saveError = $state('');

	let form = $state({ title: '', status: '', priority: '', dueDate: '', startDate: '', estimatedHours: 0, actualHours: 0, description: '' });

	$effect(() => {
		if (task?.subTasksChecklist) subtasks = parseSubtasks(task.subTasksChecklist);
		else subtasks = [];
	});

	$effect(() => {
		if (task) {
			form = {
				title:          task.title          || '',
				status:         task.status         || 'todo',
				priority:       task.priority       || 'medium',
				dueDate:        task.dueDate        ? task.dueDate.split(' ')[0] : '',
				startDate:      task.startDate      ? task.startDate.split(' ')[0] : '',
				estimatedHours: task.estimatedHours || 0,
				actualHours:    task.actualHours    || 0,
				description:    task.description    || ''
			};
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
		subtasks[index].completed = !subtasks[index].completed;
		try {
			const markdown = subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.text}`).join('\n');
			const res = await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subTasksChecklist: markdown }) });
			if (!res.ok) throw new Error('Failed');
		} catch { subtasks[index].completed = !subtasks[index].completed; }
		finally { isUpdating = false; }
	}

	async function saveDetails() {
		isSaving = true;
		saveError = '';
		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: form.title, status: form.status, priority: form.priority, dueDate: form.dueDate || null, startDate: form.startDate || null, estimatedHours: Number(form.estimatedHours) || 0, actualHours: Number(form.actualHours) || 0, description: form.description })
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

	function cancelEdit() {
		form = { title: task.title || '', status: task.status || 'todo', priority: task.priority || 'medium', dueDate: task.dueDate ? task.dueDate.split(' ')[0] : '', startDate: task.startDate ? task.startDate.split(' ')[0] : '', estimatedHours: task.estimatedHours || 0, actualHours: task.actualHours || 0, description: task.description || '' };
		editMode = false;
		saveError = '';
	}

	function formatDate(d: string): string {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

	const statusOptions = ['todo', 'in_progress', 'review', 'completed', 'cancelled'];
	const priorityOptions = ['low', 'medium', 'high', 'urgent'];
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-3xl overflow-y-auto bg-slate-900 text-white border-slate-800">
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
										<select bind:value={form.status} class="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
											{#each statusOptions as s}<option value={s}>{s.replace('_', ' ')}</option>{/each}
										</select>
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Due Date</Label>
										<Input type="date" bind:value={form.dueDate} class="bg-slate-800 border-slate-600 text-white" />
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Start Date</Label>
										<Input type="date" bind:value={form.startDate} class="bg-slate-800 border-slate-600 text-white" />
									</div>
								</div>
								<div class="space-y-4">
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Priority</Label>
										<select bind:value={form.priority} class="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
											{#each priorityOptions as p}<option value={p}>{p}</option>{/each}
										</select>
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Estimated Hours</Label>
										<Input type="number" min="0" step="0.5" bind:value={form.estimatedHours} class="bg-slate-800 border-slate-600 text-white" />
									</div>
									<div class="space-y-1">
										<Label class="text-slate-400 text-sm">Actual Hours</Label>
										<Input type="number" min="0" step="0.5" bind:value={form.actualHours} class="bg-slate-800 border-slate-600 text-white" />
									</div>
								</div>
							</div>
							<div class="space-y-1 pt-4 border-t border-slate-700">
								<Label class="text-slate-400 text-sm">Description</Label>
								<textarea bind:value={form.description} rows="5" placeholder="Task description..." class="flex w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
							</div>
						{:else}
							<div class="grid grid-cols-2 gap-6">
								<div class="space-y-4">
									<div>
										<div class="text-sm text-slate-400 mb-2">Status</div>
										<StatusBadge status={task.status} />
									</div>
									<div>
										<div class="text-sm text-slate-400 mb-2 flex items-center gap-1"><Calendar class="size-3" /> Due Date</div>
										<div class="font-medium text-lg">{formatDate(task.dueDate)}</div>
									</div>
									<div>
										<div class="text-sm text-slate-400 mb-2 flex items-center gap-1"><Calendar class="size-3" /> Start Date</div>
										<div class="font-medium">{formatDate(task.startDate)}</div>
									</div>
								</div>
								<div class="space-y-4">
									<div>
										<div class="text-sm text-slate-400 mb-2">Priority</div>
										<span class="px-3 py-1.5 rounded-full text-sm font-medium capitalize
											{task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
											{task.priority === 'high'   ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
											{task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
											{task.priority === 'low'    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
										">{task.priority || 'medium'}</span>
									</div>
									<div>
										<div class="text-sm text-slate-400 mb-2 flex items-center gap-1"><Clock class="size-3" /> Hours</div>
										<div class="font-medium text-lg">{task.actualHours || 0} / {task.estimatedHours || 0}h</div>
									</div>
								</div>
							</div>
							{#if task.description}
								<div class="pt-4 border-t border-slate-700">
									<div class="text-sm text-slate-400 mb-3">Description</div>
									<div class="prose prose-sm dark:prose-invert max-w-none bg-slate-800/50 p-4 rounded-lg">{@html task.description}</div>
								</div>
							{/if}
						{/if}

					{:else if activeTab === 'checklist'}
						{#if subtasks.length > 0}
							<div>
								<div class="flex items-center justify-between mb-6 p-4 bg-slate-800/50 rounded-lg">
									<span class="text-sm font-medium">Progress: {subtasks.filter(s => s.completed).length} of {subtasks.length} completed</span>
									<div class="flex-1 bg-slate-700 rounded-full h-3 max-w-[300px] ml-6">
										<div class="bg-green-600 h-3 rounded-full transition-all" style="width: {subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length * 100) : 0}%"></div>
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
					<Save class="size-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
				</Button>
			{:else if activeTab === 'details'}
				<Button variant="outline" onclick={() => (open = false)} class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Close
				</Button>
				<Button onclick={() => (editMode = true)} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Pencil class="size-4 mr-2" /> Edit Details
				</Button>
			{:else}
				<Button variant="outline" onclick={() => (open = false)} class="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
					<X class="size-4 mr-2" /> Close
				</Button>
			{/if}
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
