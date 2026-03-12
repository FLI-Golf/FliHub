<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		asset,
		franchises = [],
		projects = [],
		campaigns = [],
		onUpdated = (_asset: any) => {}
	} = $props();

	const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

	const assetTypes = [
		{ value: 'flyer',   label: 'Flyer' },
		{ value: 'jersey',  label: 'Jersey' },
		{ value: 'shoe',    label: 'Shoe' },
		{ value: 'logo',    label: 'Logo' },
		{ value: 'banner',  label: 'Banner' },
		{ value: 'social',  label: 'Social Media' },
		{ value: 'other',   label: 'Other' }
	];

	let formData = $state({
		title: '',
		asset_type: 'flyer',
		franchise: '',
		project: '',
		campaign: '',
		tags: '',
		notes: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');

	// Populate form when modal opens
	$effect(() => {
		if (open && asset) {
			formData = {
				title:      asset.title      || '',
				asset_type: asset.asset_type || 'flyer',
				franchise:  asset.franchise  || '',
				project:    asset.project    || '',
				campaign:   asset.campaign   || '',
				tags:       asset.tags       || '',
				notes:      asset.notes      || ''
			};
		}
	});

	function previewUrl() {
		if (!asset?.file) return '';
		return `${PB_URL}/api/files/${asset.collectionId}/${asset.id}/${asset.file}?thumb=400x400`;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/media/${asset.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Update failed');
			}

			const updated = await response.json();
			open = false;
			onUpdated(updated);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) error = '';
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Edit class="size-5" />
				Edit Media Asset
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update the asset's details, type, and associations.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- Current image preview -->
			{#if asset?.file}
				<div class="space-y-2">
					<Label class="text-slate-200">Current Image</Label>
					<div class="w-full h-48 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
						<img src={previewUrl()} alt={asset.title} class="w-full h-full object-contain" />
					</div>
					<p class="text-xs text-slate-500">To replace the image, delete this asset and upload a new one.</p>
				</div>
			{/if}

			<!-- Title -->
			<div class="space-y-2">
				<Label for="edit-media-title" class="text-slate-200">Title *</Label>
				<Input
					id="edit-media-title"
					bind:value={formData.title}
					placeholder="e.g. Team Alpha Jersey 2026"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Asset Type -->
			<div class="space-y-2">
				<Label for="edit-media-type" class="text-slate-200">Asset Type *</Label>
				<select
					id="edit-media-type"
					bind:value={formData.asset_type}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				>
					{#each assetTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			</div>

			<!-- Relations -->
			<div class="grid grid-cols-1 gap-4">
				<div class="space-y-2">
					<Label for="edit-media-franchise" class="text-slate-200">Franchise</Label>
					<select
						id="edit-media-franchise"
						bind:value={formData.franchise}
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
					>
						<option value="">None</option>
						{#each franchises as f}
							<option value={f.id}>{f.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-project" class="text-slate-200">Project</Label>
					<select
						id="edit-media-project"
						bind:value={formData.project}
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
					>
						<option value="">None</option>
						{#each projects as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-campaign" class="text-slate-200">Campaign</Label>
					<select
						id="edit-media-campaign"
						bind:value={formData.campaign}
						class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
					>
						<option value="">None</option>
						{#each campaigns as c}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Tags -->
			<div class="space-y-2">
				<Label for="edit-media-tags" class="text-slate-200">Tags</Label>
				<Input
					id="edit-media-tags"
					bind:value={formData.tags}
					placeholder="e.g. 2026, home, blue"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
				<p class="text-xs text-slate-500">Comma-separated</p>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="edit-media-notes" class="text-slate-200">Notes</Label>
				<textarea
					id="edit-media-notes"
					bind:value={formData.notes}
					placeholder="Additional context or usage notes"
					rows="3"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
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
