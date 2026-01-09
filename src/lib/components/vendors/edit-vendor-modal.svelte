<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { open = $bindable(false), vendor } = $props();

	// Form state - initialize with vendor data
	let formData = $state({
		name: '',
		contact_name: '',
		contact_email: '',
		contact_phone: '',
		address: '',
		website: '',
		about: '',
		type: '',
		active: true
	});

	// Update formData when modal opens or vendor changes
	$effect(() => {
		if (open) {
			formData = {
				name: vendor.name || '',
				contact_name: vendor.contact_name || '',
				contact_email: vendor.contact_email || '',
				contact_phone: vendor.contact_phone || '',
				address: vendor.address || '',
				website: vendor.website || '',
				about: vendor.about || '',
				type: vendor.type || '',
				active: vendor.active !== undefined ? vendor.active : true
			};
		}
	});

	let isSubmitting = $state(false);
	let error = $state('');

	const vendorTypes = [
		'Software',
		'Sales',
		'Publisist',
		'Digital Marketing',
		'Product',
		'Venue Parner',
		'Production Film',
		'Production Media',
		'On Course Prop',
		'Course Materials',
		'Office Supplies',
		'Consultant',
		'Marketing',
		'Legal',
		'Public Relations',
		'Advertising',
		'Tech/App Development'
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/vendors/${vendor.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update vendor');
			}

			// Close modal and reload page
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

	// Reset form data when vendor changes
	$effect(() => {
		formData = {
			name: vendor.name || '',
			contact_name: vendor.contact_name || '',
			contact_email: vendor.contact_email || '',
			contact_phone: vendor.contact_phone || '',
			address: vendor.address || '',
			website: vendor.website || '',
			about: vendor.about || '',
			type: vendor.type || '',
			active: vendor.active !== undefined ? vendor.active : true
		};
	});
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Edit class="size-5" />
				Edit Vendor
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update vendor information and contact details.
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
				<Label for="edit-name" class="text-slate-200">Vendor Name *</Label>
				<Input
					id="edit-name"
					bind:value={formData.name}
					placeholder="Enter vendor name"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Contact Name -->
			<div class="space-y-2">
				<Label for="edit-contact-name" class="text-slate-200">Contact Name</Label>
				<Input
					id="edit-contact-name"
					bind:value={formData.contact_name}
					placeholder="Primary contact person"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Contact Email -->
			<div class="space-y-2">
				<Label for="edit-contact-email" class="text-slate-200">Contact Email</Label>
				<Input
					id="edit-contact-email"
					type="email"
					bind:value={formData.contact_email}
					placeholder="vendor@example.com"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Contact Phone -->
			<div class="space-y-2">
				<Label for="edit-contact-phone" class="text-slate-200">Contact Phone</Label>
				<Input
					id="edit-contact-phone"
					type="tel"
					bind:value={formData.contact_phone}
					placeholder="+1 (555) 123-4567"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Address -->
			<div class="space-y-2">
				<Label for="edit-address" class="text-slate-200">Address</Label>
				<Input
					id="edit-address"
					bind:value={formData.address}
					placeholder="Street address, city, state, zip"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Website -->
			<div class="space-y-2">
				<Label for="edit-website" class="text-slate-200">Website</Label>
				<Input
					id="edit-website"
					type="url"
					bind:value={formData.website}
					placeholder="https://example.com"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Type -->
			<div class="space-y-2">
				<Label for="edit-type" class="text-slate-200">Vendor Type</Label>
				<select
					id="edit-type"
					bind:value={formData.type}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Select a type...</option>
					{#each vendorTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>

			<!-- About -->
			<div class="space-y-2">
				<Label for="edit-about" class="text-slate-200">About</Label>
				<textarea
					id="edit-about"
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
					id="edit-active"
					bind:checked={formData.active}
					class="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
				/>
				<Label for="edit-active" class="text-slate-200 cursor-pointer">
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
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
