<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Check, Search } from 'lucide-svelte';

	let { 
		open = $bindable(false),
		projectId,
		existingVendors = []
	} = $props();

	// State
	let view = $state<'select' | 'add'>('select');
	let searchQuery = $state('');
	let selectedVendorIds = $state<string[]>([]);
	let isSubmitting = $state(false);
	let error = $state('');

	// New vendor form data
	let newVendorData = $state({
		name: '',
		contact_email: '',
		contact_phone: '',
		website: '',
		about: '',
		active: true
	});

	// Filter vendors based on search
	let filteredVendors = $derived(
		existingVendors.filter((vendor: any) =>
			vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			vendor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function toggleVendorSelection(vendorId: string) {
		if (selectedVendorIds.includes(vendorId)) {
			selectedVendorIds = selectedVendorIds.filter(id => id !== vendorId);
		} else {
			selectedVendorIds = [...selectedVendorIds, vendorId];
		}
	}

	async function handleAssignVendors() {
		if (selectedVendorIds.length === 0) return;
		
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					vendors: selectedVendorIds
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to assign vendors');
			}

			// Close modal and reload
			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCreateVendor(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/vendors', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newVendorData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create vendor');
			}

			const newVendor = await response.json();

			// Assign the new vendor to the project
			await fetch(`/api/projects/${projectId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					vendors: [newVendor.id]
				})
			});

			// Close modal and reload
			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		view = 'select';
		searchQuery = '';
		selectedVendorIds = [];
		newVendorData = {
			name: '',
			contact_email: '',
			contact_phone: '',
			website: '',
			about: '',
			active: true
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
				{view === 'select' ? 'Select Vendors' : 'Add New Vendor'}
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				{view === 'select' 
					? 'Choose from existing vendors or create a new one' 
					: 'Add a new supplier or service provider'}
			</Sheet.Description>
		</Sheet.Header>

		{#if error}
			<div class="p-3 rounded-lg bg-red-900/30 border border-red-700 mb-4">
				<p class="text-sm text-red-300">{error}</p>
			</div>
		{/if}

		{#if view === 'select'}
			<!-- View Toggle -->
			<div class="flex gap-2 mb-6">
				<Button
					onclick={() => view = 'select'}
					variant="default"
					class="flex-1 bg-blue-600 hover:bg-blue-700"
				>
					Select Existing
				</Button>
				<Button
					onclick={() => view = 'add'}
					variant="outline"
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					<Plus class="size-4 mr-2" />
					Create New
				</Button>
			</div>

			<!-- Search -->
			<div class="mb-4">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
					<Input
						bind:value={searchQuery}
						placeholder="Search vendors..."
						class="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
			</div>

			<!-- Vendor List -->
			<div class="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
				{#if filteredVendors.length > 0}
					{#each filteredVendors as vendor}
						<button
							onclick={() => toggleVendorSelection(vendor.id)}
							class="w-full p-4 rounded-lg border transition-all text-left
								{selectedVendorIds.includes(vendor.id)
									? 'bg-blue-900/30 border-blue-600'
									: 'bg-slate-800 border-slate-700 hover:bg-slate-700'}"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<p class="font-medium text-white">{vendor.name}</p>
									{#if vendor.contact_email}
										<p class="text-sm text-slate-300">{vendor.contact_email}</p>
									{/if}
									{#if vendor.contact_phone}
										<p class="text-sm text-slate-300">{vendor.contact_phone}</p>
									{/if}
								</div>
								{#if selectedVendorIds.includes(vendor.id)}
									<Check class="size-5 text-blue-400 flex-shrink-0" />
								{/if}
							</div>
						</button>
					{/each}
				{:else}
					<p class="text-center text-slate-400 py-8">No vendors found</p>
				{/if}
			</div>

			<!-- Actions -->
			<Sheet.Footer class="flex gap-2 pt-6 border-t border-slate-700">
				<Button
					variant="outline"
					onclick={() => open = false}
					disabled={isSubmitting}
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					Cancel
				</Button>
				<Button
					onclick={handleAssignVendors}
					disabled={isSubmitting || selectedVendorIds.length === 0}
					class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
				>
					{isSubmitting ? 'Assigning...' : `Assign ${selectedVendorIds.length} Vendor${selectedVendorIds.length !== 1 ? 's' : ''}`}
				</Button>
			</Sheet.Footer>
		{:else}
			<!-- View Toggle -->
			<div class="flex gap-2 mb-6">
				<Button
					onclick={() => view = 'select'}
					variant="outline"
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					Select Existing
				</Button>
				<Button
					onclick={() => view = 'add'}
					variant="default"
					class="flex-1 bg-blue-600 hover:bg-blue-700"
				>
					<Plus class="size-4 mr-2" />
					Create New
				</Button>
			</div>

			<!-- Create New Vendor Form -->
			<form onsubmit={handleCreateVendor} class="space-y-4">
				<div class="space-y-2">
					<Label for="name" class="text-slate-200">Vendor Name *</Label>
					<Input
						id="name"
						bind:value={newVendorData.name}
						placeholder="Enter vendor name"
						required
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="contact_email" class="text-slate-200">Contact Email</Label>
					<Input
						id="contact_email"
						type="email"
						bind:value={newVendorData.contact_email}
						placeholder="vendor@example.com"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="contact_phone" class="text-slate-200">Contact Phone</Label>
					<Input
						id="contact_phone"
						type="tel"
						bind:value={newVendorData.contact_phone}
						placeholder="+1 (555) 123-4567"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="website" class="text-slate-200">Website</Label>
					<Input
						id="website"
						type="url"
						bind:value={newVendorData.website}
						placeholder="https://example.com"
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>

				<div class="space-y-2">
					<Label for="about" class="text-slate-200">About</Label>
					<textarea
						id="about"
						bind:value={newVendorData.about}
						placeholder="Brief description of the vendor and services provided"
						rows="4"
						class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
					></textarea>
				</div>

				<Sheet.Footer class="flex gap-2 pt-6 border-t border-slate-700 mt-6">
					<Button
						type="button"
						variant="outline"
						onclick={() => open = false}
						disabled={isSubmitting}
						class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
						class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
					>
						{isSubmitting ? 'Creating...' : 'Create & Assign'}
					</Button>
				</Sheet.Footer>
			</form>
		{/if}
	</Sheet.Content>
</Sheet.Root>
