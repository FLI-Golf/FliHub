<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { ArrowLeft, Save, Trash2 } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const initialImprovement = () => data.improvement || {};

	let improvement = $state(initialImprovement());
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	const statuses = ['Identified', 'In Progress', 'Approved', 'Implemented', 'Monitoring', 'Under Review'];
	const priorities = ['Critical', 'High', 'Medium', 'Low'];

	async function handleSave() {
		if (!improvement.title?.trim()) {
			error = 'Title is required';
			return;
		}

		saving = true;
		error = '';
		success = '';

		try {
			const url = data.isNew
				? '/api/continuous-improvements'
				: `/api/continuous-improvements/${improvement.id}`;
			
			const method = data.isNew ? 'POST' : 'PATCH';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: improvement.title,
					description: improvement.description,
					category: improvement.category,
					currentState: improvement.currentState,
					proposedSolution: improvement.proposedSolution,
					expectedBenefit: improvement.expectedBenefit,
					status: improvement.status || 'Identified',
					priority: improvement.priority || 'Medium',
					implementationDate: improvement.implementationDate || null
				})
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || 'Failed to save');
			}

			const result = await res.json();
			success = data.isNew ? 'Improvement created successfully!' : 'Improvement updated successfully!';

			setTimeout(() => {
				goto(`/dashboard/continuous-improvements/${result.id}`);
			}, 1000);
		} catch (err: any) {
			error = err.message || 'Failed to save improvement';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!improvement.id) return;
		if (!confirm('Are you sure you want to delete this improvement?')) return;

		saving = true;
		try {
			const res = await fetch(`/api/continuous-improvements/${improvement.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) throw new Error('Failed to delete');
			goto('/dashboard/continuous-improvements');
		} catch (err: any) {
			error = err.message || 'Failed to delete improvement';
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="outline" size="sm" onclick={() => goto('/dashboard/continuous-improvements')}>
				<ArrowLeft class="w-4 h-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold">{data.isNew ? 'New Improvement' : 'Edit Improvement'}</h1>
				<p class="text-slate-600 mt-1">
					{data.isNew ? 'Create a new continuous improvement initiative' : 'Update improvement details'}
				</p>
			</div>
		</div>
		{#if !data.isNew}
			<Button variant="destructive" disabled={saving} onclick={handleDelete}>
				<Trash2 class="w-4 h-4 mr-2" /> Delete
			</Button>
		{/if}
	</div>

	<!-- Messages -->
	{#if error}
		<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
			{success}
		</div>
	{/if}

	<!-- Form -->
	<div class="grid grid-cols-3 gap-6">
		<!-- Main Form -->
		<div class="col-span-2 space-y-4">
			<Card class="p-6 space-y-4">
				<div>
					<label for="ci-title" class="block text-sm font-semibold text-slate-900 mb-2">Title *</label>
					<Input
						id="ci-title"
						type="text"
						bind:value={improvement.title}
						placeholder="e.g., Streamline Tournament Check-in Process"
						class="w-full"
					/>
				</div>

				<div>
					<label for="ci-description" class="block text-sm font-semibold text-slate-900 mb-2">Description</label>
					<textarea
						id="ci-description"
						bind:value={improvement.description}
						placeholder="Brief description of the improvement..."
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
						rows="3"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="ci-category" class="block text-sm font-semibold text-slate-900 mb-2">Category</label>
						<Input
							id="ci-category"
							type="text"
							bind:value={improvement.category}
							placeholder="e.g., Process Improvement"
							class="w-full"
						/>
					</div>

					<div>
						<label for="ci-implementation-date" class="block text-sm font-semibold text-slate-900 mb-2">Implementation Date</label>
						<Input
							id="ci-implementation-date"
							type="date"
							bind:value={improvement.implementationDate}
							class="w-full"
						/>
					</div>
				</div>

				<div>
					<label for="ci-current-state" class="block text-sm font-semibold text-slate-900 mb-2">Current State</label>
					<textarea
						id="ci-current-state"
						bind:value={improvement.currentState}
						placeholder="Describe the current situation or problem..."
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
						rows="4"
					></textarea>
				</div>

				<div>
					<label for="ci-proposed-solution" class="block text-sm font-semibold text-slate-900 mb-2">Proposed Solution</label>
					<textarea
						id="ci-proposed-solution"
						bind:value={improvement.proposedSolution}
						placeholder="What solution do you propose?"
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
						rows="4"
					></textarea>
				</div>

				<div>
					<label for="ci-expected-benefit" class="block text-sm font-semibold text-slate-900 mb-2">Expected Benefit</label>
					<textarea
						id="ci-expected-benefit"
						bind:value={improvement.expectedBenefit}
						placeholder="What benefits will this improvement deliver?"
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
						rows="3"
					></textarea>
				</div>
			</Card>
		</div>

		<!-- Sidebar -->
		<div class="space-y-4">
			<Card class="p-4 space-y-4">
				<div>
					<label for="ci-status" class="block text-sm font-semibold text-slate-900 mb-2">Status</label>
					<select
						id="ci-status"
						bind:value={improvement.status}
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
					>
						<option value="">Select a status...</option>
						{#each statuses as status}
							<option value={status}>{status}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="ci-priority" class="block text-sm font-semibold text-slate-900 mb-2">Priority</label>
					<select
						id="ci-priority"
						bind:value={improvement.priority}
						class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
					>
						<option value="">Select a priority...</option>
						{#each priorities as priority}
							<option value={priority}>{priority}</option>
						{/each}
					</select>
				</div>
			</Card>

			<!-- Save Button -->
			<Button 
				size="lg" 
				class="w-full" 
				disabled={saving}
				onclick={handleSave}
			>
				<Save class="w-4 h-4 mr-2" />
				{saving ? 'Saving...' : 'Save Improvement'}
			</Button>

			<!-- Info -->
			<Card class="p-4 bg-slate-50">
				<p class="text-xs text-slate-600">
					<strong>Tip:</strong> Fill in the required fields to create a new improvement initiative. You can update the status and priority as the improvement progresses.
				</p>
			</Card>
		</div>
	</div>
</div>
