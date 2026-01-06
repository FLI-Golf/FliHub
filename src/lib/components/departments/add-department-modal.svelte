<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Save, X } from 'lucide-svelte';

	let { 
		open = $bindable(false),
		allUserProfiles = []
	} = $props();

	// Form state
	let formData = $state({
		name: '',
		code: '',
		description: '',
		annualBudget: 0,
		status: 'active',
		headOfDepartment: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/departments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create department');
			}

			// Reset form and close modal
			resetForm();
			open = false;
			
			// Reload the page to show the new department
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
			code: '',
			description: '',
			annualBudget: 0,
			status: 'active',
			headOfDepartment: ''
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
				Add New Department
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Create a new department with budget and leadership information.
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
				<Label for="name" class="text-slate-200">Department Name *</Label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="e.g., Marketing & PR"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Department Code -->
			<div class="space-y-2">
				<Label for="code" class="text-slate-200">Department Code</Label>
				<Input
					id="code"
					bind:value={formData.code}
					placeholder="e.g., MKT"
					maxlength="10"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Annual Budget -->
			<div class="space-y-2">
				<Label for="annualBudget" class="text-slate-200">Annual Budget</Label>
				<Input
					id="annualBudget"
					type="number"
					bind:value={formData.annualBudget}
					placeholder="0"
					min="0"
					step="1000"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Head of Department -->
			<div class="space-y-2">
				<Label for="headOfDepartment" class="text-slate-200">Head of Department *</Label>
				<select
					id="headOfDepartment"
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
				<Label for="description" class="text-slate-200">Description</Label>
				<textarea
					id="description"
					bind:value={formData.description}
					placeholder="Brief description of the department's responsibilities"
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				></textarea>
			</div>

			<!-- Status -->
			<div class="space-y-2">
				<Label for="status" class="text-slate-200">Status</Label>
				<select
					id="status"
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
					{isSubmitting ? 'Creating...' : 'Create Department'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
