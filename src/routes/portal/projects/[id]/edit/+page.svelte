<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { FolderKanban, ChevronLeft, Save, CheckCircle, AlertCircle } from 'lucide-svelte';

	let { data, form }: { data: PageData; form?: ActionData } = $props();
	const project = $derived((data as any).project);
	const department = $derived((data as any).department);

	let name = $state(project.name);
	let description = $state(project.description);
	let status = $state(project.status);
	let category = $state(project.category);
	let phase = $state(project.phase);
	let notes = $state(project.notes);
	let projectBudget = $state(project.project_budget ?? 0);
	let projectForecasted = $state(project.project_forecasted_expenses ?? 0);
	let isSaving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	$effect(() => {
		if (form?.success) {
			message = { type: 'success', text: 'Project saved successfully!' };
			setTimeout(() => (message = null), 3000);
		} else if (form?.error) {
			message = { type: 'error', text: form.error };
		}
	});

	const statusOptions = ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'];
	const categoryOptions = ['Operations', 'Marketing', 'Development', 'Facilities', 'Staffing', 'Other'];
	const phaseOptions = ['Phase 1', 'Phase 2', 'Phase 3', 'Ongoing'];

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
</script>

<svelte:head>
	<title>Edit {name} — Projects · FliHub</title>
</svelte:head>

<div class="space-y-6">
	<!-- Success/Error Message -->
	{#if message}
		<div
			class={`flex items-center gap-3 px-4 py-3 rounded-lg ${
				message.type === 'success'
					? 'bg-emerald-900/30 border border-emerald-700 text-emerald-300'
					: 'bg-rose-900/30 border border-rose-700 text-rose-300'
			}`}
		>
			{#if message.type === 'success'}
				<CheckCircle class="size-5 shrink-0" />
			{:else}
				<AlertCircle class="size-5 shrink-0" />
			{/if}
			<span class="text-sm font-medium">{message.text}</span>
		</div>
	{/if}

	<!-- Header -->
	<div class="flex items-center gap-3">
		<a
			href="/portal/projects"
			class="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
		>
			<ChevronLeft class="size-4" />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-2">
				<FolderKanban class="size-6 text-blue-400" /> Edit Project
			</h1>
			{#if department}
				<p class="text-sm text-slate-400 mt-1">{department.name}</p>
			{/if}
		</div>
	</div>

	<!-- Form -->
	<form
		method="POST"
		action="?/update"
		class="space-y-6"
		onsubmit={() => (isSaving = true)}
	>
		<!-- Project Name -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
			<label for="name" class="block text-sm font-semibold text-white mb-2">Project Name</label>
			<input
				type="text"
				id="name"
				name="name"
				bind:value={name}
				class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			/>
		</div>

		<!-- Description -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
			<label for="description" class="block text-sm font-semibold text-white mb-2">Description</label>
			<textarea
				id="description"
				name="description"
				bind:value={description}
				rows="4"
				class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
			></textarea>
			<p class="text-[10px] text-slate-500 mt-1">HTML formatting is supported</p>
		</div>

		<!-- Status, Category, Phase -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
				<label for="status" class="block text-sm font-semibold text-white mb-2">Status</label>
				<select
					id="status"
					name="status"
					bind:value={status}
					class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each statusOptions as opt}
						<option value={opt} class="bg-slate-800">{opt.replace('_', ' ')}</option>
					{/each}
				</select>
			</div>

			<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
				<label for="category" class="block text-sm font-semibold text-white mb-2">Category</label>
				<select
					id="category"
					name="category"
					bind:value={category}
					class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="" class="bg-slate-800">— Select Category —</option>
					{#each categoryOptions as opt}
						<option value={opt} class="bg-slate-800">{opt}</option>
					{/each}
				</select>
			</div>

			<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
				<label for="phase" class="block text-sm font-semibold text-white mb-2">Phase</label>
				<select
					id="phase"
					name="phase"
					bind:value={phase}
					class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="" class="bg-slate-800">— Select Phase —</option>
					{#each phaseOptions as opt}
						<option value={opt} class="bg-slate-800">{opt}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Budget Fields -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
				<label for="projectBudget" class="block text-sm font-semibold text-white mb-2">Total Budget</label>
				<div class="flex items-center gap-2">
					<span class="text-slate-500">$</span>
					<input
						type="number"
						id="projectBudget"
						name="project_budget"
						bind:value={projectBudget}
						class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						step="100"
						min="0"
					/>
				</div>
				<p class="text-[10px] text-slate-500 mt-2">Current: {fmt(projectBudget)}</p>
			</div>

			<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
				<label for="projectForecasted" class="block text-sm font-semibold text-white mb-2">Forecasted Expenses</label>
				<div class="flex items-center gap-2">
					<span class="text-slate-500">$</span>
					<input
						type="number"
						id="projectForecasted"
						name="project_forecasted_expenses"
						bind:value={projectForecasted}
						class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						step="100"
						min="0"
					/>
				</div>
				<p class="text-[10px] text-slate-500 mt-2">Current: {fmt(projectForecasted)}</p>
			</div>
		</div>

		<!-- Notes -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
			<label for="notes" class="block text-sm font-semibold text-white mb-2">Notes</label>
			<textarea
				id="notes"
				name="notes"
				bind:value={notes}
				rows="3"
				class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
				placeholder="Internal notes about this project..."
			></textarea>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3">
			<a
				href="/portal/projects"
				class="flex-1 flex items-center justify-center px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
			>
				Cancel
			</a>
			<button
				type="submit"
				disabled={isSaving}
				class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold transition-colors"
			>
				<Save class="size-4" />
				{isSaving ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	</form>
</div>
