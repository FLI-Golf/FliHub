<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { open = $bindable(false), project } = $props();

	// Form state - initialize with project data
	let formData = $state({
		name: '',
		description: '',
		type: 'tournament',
		status: 'draft',
		startDate: '',
		endDate: '',
		project_budget: '',
		fiscalYear: '',
		notes: ''
	});

	// Update formData when modal opens or project changes
	$effect(() => {
		if (open) {
			const today = new Date();
			const plus60 = new Date(today);
			plus60.setDate(plus60.getDate() + 60);
			const fmt = (d: Date) => d.toISOString().slice(0, 10);

			formData = {
				name: project.name || '',
				description: project.description || '',
				type: project.type || 'tournament',
				status: project.status || 'draft',
				startDate: project.startDate ? project.startDate.split('T')[0] : fmt(today),
				endDate: project.endDate ? project.endDate.split('T')[0] : fmt(plus60),
				project_budget: project.project_budget?.toString() || '',
				fiscalYear: project.fiscalYear || '',
				notes: project.notes || ''
			};
		}
	});

	let isSubmitting = $state(false);
	let error = $state('');

	const projectTypes = [
		{ value: 'tournament', label: 'Tournament' },
		{ value: 'activation', label: 'Activation' },
		{ value: 'event', label: 'Event' },
		{ value: 'campaign', label: 'Campaign' }
	];

	const projectStatuses = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'planned', label: 'Planned' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					project_budget: formData.project_budget ? parseFloat(formData.project_budget) : undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update project');
			}

			// Close modal and reload page data
			open = false;
			await goto($page.url.pathname, { invalidateAll: true });
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			error = '';
		}
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Edit class="size-5" />
				Edit Project
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update project details, budget, and settings.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- Project Name -->
			<div class="space-y-2">
				<Label for="edit-name" class="text-slate-200">Project Name *</Label>
				<Input
					id="edit-name"
					bind:value={formData.name}
					placeholder="Enter project name"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description" class="text-slate-200">Description</Label>
				<textarea
					id="edit-description"
					bind:value={formData.description}
					placeholder="Enter project description"
					rows="3"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>

			<!-- Type and Status -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-type" class="text-slate-200">Type *</Label>
					<select
						id="edit-type"
						bind:value={formData.type}
						required
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#each projectTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-status" class="text-slate-200">Status *</Label>
					<select
						id="edit-status"
						bind:value={formData.status}
						required
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#each projectStatuses as status}
							<option value={status.value}>{status.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Dates -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-startDate" class="text-slate-200">Start Date *</Label>
					<Input
						id="edit-startDate"
						type="date"
						bind:value={formData.startDate}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-endDate" class="text-slate-200">End Date *</Label>
					<Input
						id="edit-endDate"
						type="date"
						bind:value={formData.endDate}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<!-- Budget -->
			<div class="space-y-3 rounded-xl bg-slate-800/60 border border-slate-700 p-4">
				<div class="flex items-center justify-between">
					<Label class="text-slate-200 font-semibold">Budget</Label>
					{#if formData.project_budget}
						{@const budget = parseFloat(formData.project_budget) || 0}
						{@const actual = project.project_actual_expenses ?? 0}
						{@const pct = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0}
						<span class="text-xs {pct > 90 ? 'text-red-400' : pct > 70 ? 'text-yellow-400' : 'text-emerald-400'} font-medium">
							{pct.toFixed(0)}% used
						</span>
					{/if}
				</div>

				<div class="space-y-1.5">
					<Label for="edit-budget" class="text-xs text-slate-400">Project Budget</Label>
					<div class="relative">
						<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
						<Input
							id="edit-budget"
							type="number"
							step="1000"
							min="0"
							bind:value={formData.project_budget}
							placeholder="0"
							class="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 pl-6"
						/>
					</div>
				</div>

				{#if formData.project_budget}
					{@const budget = parseFloat(formData.project_budget) || 0}
					{@const actual = project.project_actual_expenses ?? 0}
					{@const pct = budget > 0 ? Math.min(100, (actual / budget) * 100) : 0}
					<div class="space-y-1.5 pt-1">
						<div class="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
							<div class="h-full rounded-full {pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-emerald-500'} transition-all duration-300" style="width:{pct}%"></div>
						</div>
						<div class="flex justify-between text-[10px] text-slate-500">
							<span>${actual.toLocaleString()} spent</span>
							<span>${(budget - actual).toLocaleString()} remaining</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Fiscal Year -->
			<div class="space-y-2">
				<Label for="edit-fiscalYear" class="text-slate-200">Fiscal Year</Label>
				<Input
					id="edit-fiscalYear"
					bind:value={formData.fiscalYear}
					placeholder="e.g., 2024"
					maxlength="10"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="edit-notes" class="text-slate-200">Notes</Label>
				<textarea
					id="edit-notes"
					bind:value={formData.notes}
					placeholder="Additional notes or comments"
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
