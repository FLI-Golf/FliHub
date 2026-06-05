<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Edit, Save, X } from 'lucide-svelte';
	import {
		mediaAssetTypes,
		mediaCategories,
		mediaMomentTypes,
		mediaRightsStatuses,
		mediaRoundTypes,
		mediaShotTypes,
		mediaSourceTypes,
		mediaStatuses,
		mediaStorageTiers,
		mediaUsageScopes
	} from '$lib/media/options';

	let {
		open = $bindable(false),
		asset,
		franchises = [],
		talents = [],
		projects = [],
		campaigns = [],
		sponsors = [],
		seasons = [],
		tournaments = [],
		specialEvents = [],
		pbUrl = 'https://pocketbase-production-6ab5.up.railway.app',
		onUpdated = (_asset: any) => {}
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
		structured_tags: '',
		tag_domain: 'general',
		people_ids: [] as string[],
		team_ids: [] as string[],
		sponsor_ids: [] as string[],
		round_type: '',
		shot_type: '',
		moment_type: '',
		hole_number: '',
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
				media_category: asset.media_category || 'graphic',
				franchise:  asset.franchise  || '',
				project:    asset.project    || '',
				campaign:   asset.campaign   || '',
				season: asset.season || '',
				tournament: asset.tournament || '',
				special_event: asset.special_event || '',
				source_type: asset.source_type || 'other',
				capture_date: asset.capture_date ? String(asset.capture_date).slice(0, 10) : '',
				duration_seconds: asset.duration_seconds ? String(asset.duration_seconds) : '',
				file_size_bytes: asset.file_size_bytes ? String(asset.file_size_bytes) : '',
				resolution: asset.resolution || '',
				status: asset.status || 'uploaded',
				storage_tier: asset.storage_tier || 'hot',
				usage_scope: asset.usage_scope || 'internal',
				rights_status: asset.rights_status || 'owned',
				structured_tags: (asset.taxonomy?.tags || []).map((row: any) => row.tag).join(', '),
				tag_domain: asset.taxonomy?.tags?.[0]?.domain || 'general',
				people_ids: (asset.taxonomy?.people || []).map((row: any) => row.person).filter(Boolean),
				team_ids: (asset.taxonomy?.teams || []).map((row: any) => row.team).filter(Boolean),
				sponsor_ids: (asset.taxonomy?.sponsors || []).map((row: any) => row.sponsor).filter(Boolean),
				round_type: asset.taxonomy?.event?.round_type || '',
				shot_type: asset.taxonomy?.event?.shot_type || '',
				moment_type: asset.taxonomy?.event?.moment_type || '',
				hole_number: asset.taxonomy?.event?.hole_number ? String(asset.taxonomy.event.hole_number) : '',
				tags:       asset.tags       || '',
				notes:      asset.notes      || ''
			};
		}
	});

	function previewUrl() {
		if (!asset?.file) return '';
		return `${pbUrl}/api/files/${asset.collectionId}/${asset.id}/${asset.file}?thumb=400x400`;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch(`/api/media/${asset.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...formData,
					phase2Meta: {
						structured_tags: formData.structured_tags,
						tag_domain: formData.tag_domain,
						people_ids: formData.people_ids,
						team_ids: formData.team_ids,
						sponsor_ids: formData.sponsor_ids,
						round_type: formData.round_type,
						shot_type: formData.shot_type,
						moment_type: formData.moment_type,
						hole_number: formData.hole_number,
						season: formData.season,
						tournament: formData.tournament,
						special_event: formData.special_event
					}
				})
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
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-media-type" class="text-slate-200">Asset Type *</Label>
					<select id="edit-media-type" bind:value={formData.asset_type} required class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaAssetTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-category" class="text-slate-200">Media Category</Label>
					<select id="edit-media-category" bind:value={formData.media_category} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaCategories as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-media-source" class="text-slate-200">Source Type</Label>
					<select id="edit-media-source" bind:value={formData.source_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaSourceTypes as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-status" class="text-slate-200">Workflow Status</Label>
					<select id="edit-media-status" bind:value={formData.status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaStatuses as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Relations -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

				<div class="space-y-2">
					<Label for="edit-media-season" class="text-slate-200">Season</Label>
					<select id="edit-media-season" bind:value={formData.season} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each seasons as season}
							<option value={season.id}>{season.name || season.year}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-tournament" class="text-slate-200">Tournament</Label>
					<select id="edit-media-tournament" bind:value={formData.tournament} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each tournaments as tournament}
							<option value={tournament.id}>{tournament.name}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2 md:col-span-2">
					<Label for="edit-media-special-event" class="text-slate-200">Special Event</Label>
					<select id="edit-media-special-event" bind:value={formData.special_event} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						<option value="">None</option>
						{#each specialEvents as event}
							<option value={event.id}>{event.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-media-capture-date" class="text-slate-200">Capture Date</Label>
					<Input id="edit-media-capture-date" type="date" bind:value={formData.capture_date} class="bg-slate-800 border-slate-700 text-white" />
				</div>

				<div class="space-y-2">
					<Label for="edit-media-duration" class="text-slate-200">Duration (seconds)</Label>
					<Input id="edit-media-duration" type="number" min="0" bind:value={formData.duration_seconds} class="bg-slate-800 border-slate-700 text-white" />
				</div>

				<div class="space-y-2">
					<Label for="edit-media-resolution" class="text-slate-200">Resolution</Label>
					<Input id="edit-media-resolution" bind:value={formData.resolution} placeholder="e.g. 1920x1080" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
				</div>

				<div class="space-y-2">
					<Label for="edit-media-filesize" class="text-slate-200">File Size (bytes)</Label>
					<Input id="edit-media-filesize" type="number" min="0" bind:value={formData.file_size_bytes} class="bg-slate-800 border-slate-700 text-white" />
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-media-storage-tier" class="text-slate-200">Storage Tier</Label>
					<select id="edit-media-storage-tier" bind:value={formData.storage_tier} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaStorageTiers as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="edit-media-usage-scope" class="text-slate-200">Usage Scope</Label>
					<select id="edit-media-usage-scope" bind:value={formData.usage_scope} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaUsageScopes as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2 md:col-span-2">
					<Label for="edit-media-rights-status" class="text-slate-200">Rights Status</Label>
					<select id="edit-media-rights-status" bind:value={formData.rights_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each mediaRightsStatuses as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="rounded-lg border border-slate-700 p-4 space-y-4 bg-slate-900/40">
				<div>
					<p class="text-sm font-semibold text-slate-100">Phase 2 Taxonomy</p>
					<p class="text-xs text-slate-400">Manage normalized metadata for people, teams, sponsors, and gameplay context.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-media-structured-tags" class="text-slate-200">Structured Tags</Label>
						<Input
							id="edit-media-structured-tags"
							bind:value={formData.structured_tags}
							placeholder="e.g. crowd reaction, clutch putt, champions"
							class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
						/>
					</div>
					<div class="space-y-2">
						<Label for="edit-media-round-type" class="text-slate-200">Round Type</Label>
						<select id="edit-media-round-type" bind:value={formData.round_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="">None</option>
							{#each mediaRoundTypes as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-media-shot-type" class="text-slate-200">Shot Type</Label>
						<select id="edit-media-shot-type" bind:value={formData.shot_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="">None</option>
							{#each mediaShotTypes as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-media-moment-type" class="text-slate-200">Moment Type</Label>
						<select id="edit-media-moment-type" bind:value={formData.moment_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="">None</option>
							{#each mediaMomentTypes as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-media-hole-number" class="text-slate-200">Hole Number</Label>
						<Input id="edit-media-hole-number" type="number" min="1" max="36" bind:value={formData.hole_number} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-media-people" class="text-slate-200">People (multi-select)</Label>
						<select id="edit-media-people" bind:value={formData.people_ids} multiple size="4" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each talents as person}
								<option value={person.id}>{person.fullName || person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim()}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-media-teams" class="text-slate-200">Teams (multi-select)</Label>
						<select id="edit-media-teams" bind:value={formData.team_ids} multiple size="4" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each franchises as team}
								<option value={team.id}>{team.name}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-media-sponsors" class="text-slate-200">Sponsors (multi-select)</Label>
						<select id="edit-media-sponsors" bind:value={formData.sponsor_ids} multiple size="4" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each sponsors as sponsor}
								<option value={sponsor.id}>{sponsor.name}</option>
							{/each}
						</select>
					</div>
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
