<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Save, X } from 'lucide-svelte';

	let { open = $bindable(false) } = $props();

	// Form state
	let formData = $state({
		name: '',
		contact_email: '',
		contact_phone: '',
		website: '',
		about: '',
		active: true
	});

	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/vendors', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create vendor');
			}

			// Reset form and close modal
			resetForm();
			open = false;
			
			// Reload the page to show the new vendor
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
				<Plus class="size-5" />
				Add New Vendor
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Add a new supplier or service provider to your vendor list.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- Vendor Name -->
			<div class="space-y-2">
				<Label for="name" class="text-slate-200">Vendor Name *</Label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Enter vendor name"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Contact Email -->
			<div class="space-y-2">
				<Label for="contact_email" class="text-slate-200">Contact Email</Label>
				<Input
					id="contact_email"
					type="email"
					bind:value={formData.contact_email}
					placeholder="vendor@example.com"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Contact Phone -->
			<div class="space-y-2">
				<Label for="contact_phone" class="text-slate-200">Contact Phone</Label>
				<Input
					id="contact_phone"
					type="tel"
					bind:value={formData.contact_phone}
					placeholder="+1 (555) 123-4567"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Website -->
			<div class="space-y-2">
				<Label for="website" class="text-slate-200">Website</Label>
				<Input
					id="website"
					type="url"
					bind:value={formData.website}
					placeholder="https://example.com"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- About -->
			<div class="space-y-2">
				<Label for="about" class="text-slate-200">About</Label>
				<textarea
					id="about"
					bind:value={formData.about}
					placeholder="Brief description of the vendor and services provided"
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>

			<!-- Active Status -->
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="active"
					bind:checked={formData.active}
					class="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
				/>
				<Label for="active" class="text-slate-200 cursor-pointer">
					Active vendor (can be assigned to projects)
				</Label>
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
					{isSubmitting ? 'Creating...' : 'Create Vendor'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
