<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { open = $bindable(false), project } = $props();

	// Form state - initialize with project data
	let formData = $state({
		name: project.name || '',
		description: project.description || '',
		type: project.type || 'tournament',
		status: project.status || 'draft',
		startDate: project.startDate ? project.startDate.split('T')[0] : '',
		endDate: project.endDate ? project.endDate.split('T')[0] : '',
		project_budget_mode: project.project_budget_mode || 'auto',
		project_budget: project.project_budget?.toString() || '',
		project_forecasted_expenses: project.project_forecasted_expenses?.toString() || '',
		project_budget_buffer: project.project_budget_buffer?.toString() || '',
		project_budget_cap: project.project_budget_cap?.toString() || '',
		project_manual_budget_override: project.project_manual_budget_override?.toString() || '',
		fiscalYear: project.fiscalYear || '',
		notes: project.notes || ''
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
					project_budget: formData.project_budget ? parseFloat(formData.project_budget) : undefined,
					project_forecasted_expenses: formData.project_forecasted_expenses ? parseFloat(formData.project_forecasted_expenses) : undefined
				project_budget_buffer: formData.project_budget_buffer ? parseFloat(formData.project_budget_buffer) : undefined,
				project_budget_cap: formData.project_budget_cap ? parseFloat(formData.project_budget_cap) : undefined,
				project_manual_budget_override: formData.project_manual_budget_override ? parseFloat(formData.project_manual_budget_override) : undefined
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update project');
			}

			// Close modal and invalidate data
			open = false;
			await invalidateAll();
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

	// Reset form data when project changes
	$effect(() => {
		formData = {
			name: project.name || '',
			description: project.description || '',
			type: project.type || 'tournament',
			status: project.status || 'draft',
			startDate: project.startDate ? project.startDate.split('T')[0] : '',
			endDate: project.endDate ? project.endDate.split('T')[0] : '',
			project_budget: project.project_budget?.toString() || '',
			project_forecasted_expenses: project.project_forecasted_expenses?.toString() || '',
			fiscalYear: project.fiscalYear || '',
			notes: project.notes || ''
		};
	});
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

			<!-- Budget and Forecasted -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-budget" class="text-slate-200">Budget</Label>
					<Input
						id="edit-budget"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.project_budget}
						placeholder="0.00"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-forecastedExpenses" class="text-slate-200">Forecasted Expenses</Label>
					<Input
						id="edit-forecastedExpenses"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.project_forecasted_expenses}
						placeholder="0.00"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
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
