<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Save, X } from 'lucide-svelte';

	let { 
		open = $bindable(false),
		departments = []
	} = $props();

	// Debug: Log departments when modal opens
	$effect(() => {
		if (open) {
			console.log('=== ADD PROJECT MODAL OPENED ===');
			console.log('Departments prop:', departments);
			console.log('Departments length:', departments?.length);
		}
	});

	// Form state
	let formData = $state({
		name: '',
		description: '',
		type: 'tournament',
		status: 'draft',
		department: '',
		startDate: '',
		endDate: '',
		project_budget_mode: 'auto',
		project_budget: '',
		project_forecasted_expenses: '',
		fiscalYear: '2026',
		notes: ''
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
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					project_budget: formData.project_budget ? parseFloat(formData.project_budget) : null,
					project_forecasted_expenses: formData.project_forecasted_expenses ? parseFloat(formData.project_forecasted_expenses) : null
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create project');
			}

			// Reset form and close modal
			resetForm();
			open = false;
			
			// Reload the page to show the new project
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		formData = {
			name: '',
			description: '',
			type: 'tournament',
			status: 'draft',
			department: '',
			startDate: '',
			endDate: '',
			project_budget_mode: 'auto',
			project_budget: '',
			project_forecasted_expenses: '',
			fiscalYear: '2026',
			notes: ''
		};
		error = '';
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			resetForm();
		}
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Plus class="size-5" />
				Add New Project
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Create a new project to track budgets, expenses, and vendors.
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
				<Label for="name" class="text-slate-200">Project Name *</Label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Enter project name"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="description" class="text-slate-200">Description</Label>
				<textarea
					id="description"
					bind:value={formData.description}
					placeholder="Enter project description"
					rows="3"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>

			<!-- Department -->
			<div class="space-y-2">
				<Label for="department" class="text-slate-200">Department *</Label>
				<select
					id="department"
					bind:value={formData.department}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					<option value="">Select a department...</option>
					{#each departments as dept}
						<option value={dept.id}>{dept.name}</option>
					{/each}
				</select>
				<p class="text-xs text-slate-400">Found {departments.length} department(s)</p>
			</div>

			<!-- Type and Status -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="type" class="text-slate-200">Type *</Label>
					<select
						id="type"
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
					<Label for="status" class="text-slate-200">Status *</Label>
					<select
						id="status"
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
					<Label for="startDate" class="text-slate-200">Start Date *</Label>
					<Input
						id="startDate"
						type="date"
						bind:value={formData.startDate}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<Label for="endDate" class="text-slate-200">End Date *</Label>
					<Input
						id="endDate"
						type="date"
						bind:value={formData.endDate}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<!-- Budget Mode -->
			<div class="space-y-2">
				<Label for="budget-mode" class="text-slate-200">Budget Mode *</Label>
				<select
					id="budget-mode"
					bind:value={formData.project_budget_mode}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					<option value="auto">Auto (from tasks)</option>
					<option value="fixed">Fixed Budget</option>
					<option value="hybrid">Hybrid (tasks + buffer)</option>
					<option value="capped">Capped (max limit)</option>
				</select>
			</div>

			<!-- Budget and Forecasted -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="budget" class="text-slate-200">Budget</Label>
					<Input
						id="budget"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.project_budget}
						placeholder="0.00"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="forecastedExpenses" class="text-slate-200">Forecasted Expenses</Label>
					<Input
						id="forecastedExpenses"
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
				<Label for="fiscalYear" class="text-slate-200">Fiscal Year</Label>
				<Input
					id="fiscalYear"
					bind:value={formData.fiscalYear}
					placeholder="2026"
					maxlength="10"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="notes" class="text-slate-200">Notes</Label>
				<textarea
					id="notes"
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
					{isSubmitting ? 'Creating...' : 'Create Project'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
