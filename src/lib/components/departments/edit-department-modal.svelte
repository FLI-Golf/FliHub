<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { 
		open = $bindable(false),
		department,
		allUserProfiles = []
	} = $props();

	// Form state
	let formData = $state({
		name: '',
		code: '',
		description: '',
		department_budget_mode: 'auto',
		department_annual_budget: 0,
		department_budget_cap: 0,
		department_manual_budget_override: 0,
		status: 'active',
		headOfDepartment: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');

	// Initialize form data when department changes
	$effect(() => {
		if (department && open) {
			formData = {
				name: department.name || '',
				code: department.code || '',
				description: department.description || '',
				department_budget_mode: department.department_budget_mode || 'auto',
				department_annual_budget: department.department_annual_budget || 0,
				department_budget_cap: department.department_budget_cap || 0,
				department_manual_budget_override: department.department_manual_budget_override || 0,
				status: department.status || 'active',
				headOfDepartment: department.headOfDepartment || ''
			};
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/departments/${department.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update department');
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
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Edit class="size-5" />
				Edit Department
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update department information, budget, and leadership.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- Department Name -->
			<div class="space-y-2">
				<Label for="edit-name" class="text-slate-200">Department Name *</Label>
				<Input
					id="edit-name"
					bind:value={formData.name}
					placeholder="e.g., Marketing & PR"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Department Code -->
			<div class="space-y-2">
				<Label for="edit-code" class="text-slate-200">Department Code</Label>
				<Input
					id="edit-code"
					bind:value={formData.code}
					placeholder="e.g., MKT"
					maxlength="10"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Budget Mode -->
			<div class="space-y-2">
				<Label for="edit-budget-mode" class="text-slate-200">Budget Mode</Label>
				<select
					id="edit-budget-mode"
					bind:value={formData.department_budget_mode}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				>
					<option value="auto">Auto (from projects)</option>
					<option value="annual_cap">Annual Cap</option>
					<option value="allocated">Allocated</option>
				</select>
			</div>

			<!-- Conditional Budget Fields -->
			{#if formData.department_budget_mode === 'annual_cap'}
				<div class="space-y-2">
					<Label for="edit-budget-cap" class="text-slate-200">Annual Budget Cap *</Label>
					<Input
						id="edit-budget-cap"
						type="number"
						bind:value={formData.department_budget_cap}
						placeholder="0"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
			{:else if formData.department_budget_mode === 'allocated'}
				<div class="space-y-2">
					<Label for="edit-allocated" class="text-slate-200">Allocated Budget *</Label>
					<Input
						id="edit-allocated"
						type="number"
						bind:value={formData.department_manual_budget_override}
						placeholder="0"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
			{/if}

			<!-- Read-only Budget Display (for auto) -->
			{#if formData.department_budget_mode === 'auto'}
				<div class="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
					<div class="text-sm text-slate-400 mb-1">Current Budget (calculated)</div>
					<div class="text-2xl font-bold text-white">${department.department_annual_budget || 0}</div>
					<div class="text-xs text-slate-500 mt-1">Sum of all project budgets</div>
				</div>
			{/if}

			<!-- Annual Budget (hidden, kept for compatibility) -->
			<div class="space-y-2 hidden">
				<Label for="edit-annualBudget" class="text-slate-200">Annual Budget</Label>
				<Input
					id="edit-annualBudget"
					type="number"
					bind:value={formData.department_annual_budget}
					placeholder="0"
					min="0"
					step="1000"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Head of Department -->
			<div class="space-y-2">
				<Label for="edit-headOfDepartment" class="text-slate-200">Head of Department *</Label>
				<select
					id="edit-headOfDepartment"
					bind:value={formData.headOfDepartment}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					<option value="">Select a leader...</option>
					{#each allUserProfiles as profile}
						<option value={profile.id}>
							{profile.firstName} {profile.lastName} ({profile.email})
						</option>
					{/each}
				</select>
				<p class="text-xs text-slate-400">Found {allUserProfiles.length} leader(s)</p>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description" class="text-slate-200">Description</Label>
				<textarea
					id="edit-description"
					bind:value={formData.description}
					placeholder="Brief description of the department's responsibilities"
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				></textarea>
			</div>

			<!-- Status -->
			<div class="space-y-2">
				<Label for="edit-status" class="text-slate-200">Status</Label>
				<select
					id="edit-status"
					bind:value={formData.status}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
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
