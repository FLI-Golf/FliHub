<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Upload, Save, X, Image } from 'lucide-svelte';
	import PocketBase from 'pocketbase';
	import {
		mediaAssetTypes,
		mediaCategories,
		mediaRightsStatuses,
		mediaSourceTypes,
		mediaStatuses,
		mediaStorageTiers,
		mediaUsageScopes
	} from '$lib/media/options';

	let {
		open = $bindable(false),
		franchises = [],
		projects = [],
		campaigns = [],
		seasons = [],
		tournaments = [],
		specialEvents = [],
		pbUrl = 'http://127.0.0.1:8090',
		authToken = '',
		onUploaded = () => {}
	} = $props();

	let formData = $state({
		title: '',
		asset_type: 'flyer',
		media_category: 'graphic',
		franchise: '',
		project: '',
		campaign: '',
		season: '',
		tournament: '',
		special_event: '',
		source_type: 'other',
		capture_date: '',
		duration_seconds: '',
		file_size_bytes: '',
		resolution: '',
		status: 'uploaded',
		storage_tier: 'hot',
		usage_scope: 'internal',
		rights_status: 'owned',
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
		previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
		formData.file_size_bytes = String(file.size);
		if (!formData.media_category || formData.media_category === 'graphic') {
			if (file.type.startsWith('video/')) formData.media_category = 'video';
			else if (file.type.startsWith('audio/')) formData.media_category = 'audio';
			else if (file.type === 'application/pdf' || file.type.includes('document')) formData.media_category = 'document';
			else formData.media_category = 'graphic';
		}
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
			body.append('media_category', formData.media_category);
			body.append('file', selectedFile);
			if (formData.franchise) body.append('franchise', formData.franchise);
			if (formData.project)   body.append('project',   formData.project);
			if (formData.campaign)  body.append('campaign',  formData.campaign);
			if (formData.season) body.append('season', formData.season);
			if (formData.tournament) body.append('tournament', formData.tournament);
			if (formData.special_event) body.append('special_event', formData.special_event);
			if (formData.source_type) body.append('source_type', formData.source_type);
			if (formData.capture_date) body.append('capture_date', formData.capture_date);
			if (formData.duration_seconds) body.append('duration_seconds', formData.duration_seconds);
			if (formData.file_size_bytes) body.append('file_size_bytes', formData.file_size_bytes);
			if (formData.resolution) body.append('resolution', formData.resolution);
			if (formData.status) body.append('status', formData.status);
			if (formData.storage_tier) body.append('storage_tier', formData.storage_tier);
			if (formData.usage_scope) body.append('usage_scope', formData.usage_scope);
			if (formData.rights_status) body.append('rights_status', formData.rights_status);
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
		formData = {
			title: '',
			asset_type: 'flyer',
			media_category: 'graphic',
			franchise: '',
			project: '',
			campaign: '',
			season: '',
			tournament: '',
			special_event: '',
			source_type: 'other',
			capture_date: '',
			duration_seconds: '',
			file_size_bytes: '',
			resolution: '',
			status: 'uploaded',
			storage_tier: 'hot',
			usage_scope: 'internal',
			rights_status: 'owned',
			tags: '',
			notes: ''
		};
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
				<Label class="text-slate-200">Asset File *</Label>
				<label
					class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-800 hover:border-slate-400 transition-colors overflow-hidden"
				>
					{#if previewUrl}
						<img src={previewUrl} alt="Preview" class="h-full w-full object-contain" />
					{:else}
						<div class="flex flex-col items-center gap-2 text-slate-400">
							<Image class="size-10" />
							<span class="text-sm">Click to select a media file</span>
							<span class="text-xs">Images, video, audio, PDFs, archives — max 100 MB</span>
						</div>
					{/if}
					<input
						type="file"
						accept="image/*,video/*,audio/*,.pdf,.zip,.mov,.mp4,.wav,.mp3,.avi,.doc,.docx"
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
					{#each mediaAssetTypes as type}
						<option value={type.value}>{type.label}</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="media-category" class="text-slate-200">Media Category</Label>
					<select id="media-category" bind:value={formData.media_category} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaCategories as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="media-source" class="text-slate-200">Source Type</Label>
					<select id="media-source" bind:value={formData.source_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaSourceTypes as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Relations -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

				<div class="space-y-2">
					<Label for="media-season" class="text-slate-200">Season</Label>
					<select id="media-season" bind:value={formData.season} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each seasons as season}
							<option value={season.id}>{season.name || season.year}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="media-tournament" class="text-slate-200">Tournament</Label>
					<select id="media-tournament" bind:value={formData.tournament} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each tournaments as tournament}
							<option value={tournament.id}>{tournament.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2 md:col-span-2">
					<Label for="media-special-event" class="text-slate-200">Special Event</Label>
					<select id="media-special-event" bind:value={formData.special_event} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each specialEvents as event}
							<option value={event.id}>{event.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="media-capture-date" class="text-slate-200">Capture Date</Label>
					<Input id="media-capture-date" type="date" bind:value={formData.capture_date} class="bg-slate-800 border-slate-700 text-white" />
				</div>

				<div class="space-y-2">
					<Label for="media-duration" class="text-slate-200">Duration (seconds)</Label>
					<Input id="media-duration" type="number" min="0" bind:value={formData.duration_seconds} placeholder="e.g. 95" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
				</div>

				<div class="space-y-2">
					<Label for="media-resolution" class="text-slate-200">Resolution</Label>
					<Input id="media-resolution" bind:value={formData.resolution} placeholder="e.g. 1920x1080" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
				</div>

				<div class="space-y-2">
					<Label for="media-filesize" class="text-slate-200">File Size (bytes)</Label>
					<Input id="media-filesize" bind:value={formData.file_size_bytes} type="number" min="0" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="media-status" class="text-slate-200">Workflow Status</Label>
					<select id="media-status" bind:value={formData.status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaStatuses as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="media-storage-tier" class="text-slate-200">Storage Tier</Label>
					<select id="media-storage-tier" bind:value={formData.storage_tier} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaStorageTiers as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="media-usage-scope" class="text-slate-200">Usage Scope</Label>
					<select id="media-usage-scope" bind:value={formData.usage_scope} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaUsageScopes as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="media-rights-status" class="text-slate-200">Rights Status</Label>
					<select id="media-rights-status" bind:value={formData.rights_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaRightsStatuses as option}
							<option value={option.value}>{option.label}</option>
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
