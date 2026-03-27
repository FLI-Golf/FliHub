<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Upload, Save, X, Image } from 'lucide-svelte';
	import PocketBase from 'pocketbase';

	let {
		open = $bindable(false),
		franchises = [],
		projects = [],
		campaigns = [],
		pbUrl = 'http://127.0.0.1:8090',
		authToken = '',
		onUploaded = () => {}
	} = $props();

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

	let selectedFile: File | null = $state(null);
	let previewUrl = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		// Auto-fill title from filename if empty
		if (!formData.title) {
			formData.title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!selectedFile) {
			error = 'Please select a file';
			return;
		}
		isSubmitting = true;
		error = '';

		try {
			// Upload directly to PocketBase to avoid Netlify's 1MB function body limit.
			const client = new PocketBase(pbUrl);
			if (authToken) {
				client.authStore.save(authToken, null);
			}

			const body = new FormData();
			body.append('title', formData.title);
			body.append('asset_type', formData.asset_type);
			body.append('file', selectedFile);
			if (formData.franchise) body.append('franchise', formData.franchise);
			if (formData.project)   body.append('project',   formData.project);
			if (formData.campaign)  body.append('campaign',  formData.campaign);
			if (formData.tags)      body.append('tags',      formData.tags);
			if (formData.notes)     body.append('notes',     formData.notes);

			const asset = await client.collection('media_assets').create(body);
			resetForm();
			open = false;
			onUploaded(asset);
		} catch (err: any) {
			error = err?.message || 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		formData = { title: '', asset_type: 'flyer', franchise: '', project: '', campaign: '', tags: '', notes: '' };
		selectedFile = null;
		if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
		error = '';
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) resetForm();
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Upload class="size-5" />
				Upload Media Asset
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Upload flyers, jerseys, shoes, logos, and other brand assets.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- File drop zone -->
			<div class="space-y-2">
				<Label class="text-slate-200">Image File *</Label>
				<label
					class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-800 hover:border-slate-400 transition-colors overflow-hidden"
				>
					{#if previewUrl}
						<img src={previewUrl} alt="Preview" class="h-full w-full object-contain" />
					{:else}
						<div class="flex flex-col items-center gap-2 text-slate-400">
							<Image class="size-10" />
							<span class="text-sm">Click to select an image</span>
							<span class="text-xs">JPEG, PNG, WebP, GIF, SVG — max 10 MB</span>
						</div>
					{/if}
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
						class="hidden"
						onchange={handleFileChange}
					/>
				</label>
				{#if selectedFile}
					<p class="text-xs text-slate-400">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</p>
				{/if}
			</div>

			<!-- Title -->
			<div class="space-y-2">
				<Label for="media-title" class="text-slate-200">Title *</Label>
				<Input
					id="media-title"
					bind:value={formData.title}
					placeholder="e.g. Team Alpha Jersey 2026"
					required
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Asset Type -->
			<div class="space-y-2">
				<Label for="media-type" class="text-slate-200">Asset Type *</Label>
				<select
					id="media-type"
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
					<Label for="media-franchise" class="text-slate-200">Franchise</Label>
					<select
						id="media-franchise"
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
					<Label for="media-project" class="text-slate-200">Project</Label>
					<select
						id="media-project"
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
					<Label for="media-campaign" class="text-slate-200">Campaign</Label>
					<select
						id="media-campaign"
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
				<Label for="media-tags" class="text-slate-200">Tags</Label>
				<Input
					id="media-tags"
					bind:value={formData.tags}
					placeholder="e.g. 2026, home, blue"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
				<p class="text-xs text-slate-500">Comma-separated</p>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="media-notes" class="text-slate-200">Notes</Label>
				<textarea
					id="media-notes"
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
				<Button type="submit" disabled={isSubmitting || !selectedFile} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Save class="size-4 mr-2" />
					{isSubmitting ? 'Uploading...' : 'Upload'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
