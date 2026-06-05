<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import UploadMediaModal from '$lib/components/media/upload-media-modal.svelte';
	import EditMediaModal from '$lib/components/media/edit-media-modal.svelte';
	import MediaAssetDetailSheet from '$lib/components/media/media-asset-detail-sheet.svelte';
	import { Upload, Search, Trash2, ExternalLink, Image, Pencil, Film, FileText, Mic, Archive, Eye } from 'lucide-svelte';
	import {
		labelFor,
		mediaAssetTypes,
		mediaCategories,
		mediaRightsStatuses,
		mediaStatuses,
		mediaUsageScopes,
		isImageLikeAsset
	} from '$lib/media/options';

	let { data }: { data: PageData } = $props();

	const PB_URL = data.pbUrl;
	const franchiseMap = new Map((data.franchises || []).map((item: any) => [item.id, item]));
	const projectMap = new Map((data.projects || []).map((item: any) => [item.id, item]));
	const campaignMap = new Map((data.campaigns || []).map((item: any) => [item.id, item]));
	const seasonMap = new Map((data.seasons || []).map((item: any) => [item.id, item]));
	const tournamentMap = new Map((data.tournaments || []).map((item: any) => [item.id, item]));
	const specialEventMap = new Map((data.specialEvents || []).map((item: any) => [item.id, item]));

	function decorateAsset(asset: any) {
		if (!asset) return asset;

		return {
			...asset,
			expand: {
				...(asset.expand || {}),
				franchise: asset.expand?.franchise || (asset.franchise ? franchiseMap.get(asset.franchise) : undefined),
				project: asset.expand?.project || (asset.project ? projectMap.get(asset.project) : undefined),
				campaign: asset.expand?.campaign || (asset.campaign ? campaignMap.get(asset.campaign) : undefined),
				season: asset.expand?.season || (asset.season ? seasonMap.get(asset.season) : undefined),
				tournament: asset.expand?.tournament || (asset.tournament ? tournamentMap.get(asset.tournament) : undefined),
				special_event:
					asset.expand?.special_event ||
					(asset.special_event ? specialEventMap.get(asset.special_event) : undefined)
			}
		};
	}

	let showUploadModal = $state(false);
	let showDetailModal = $state(false);
	let showEditModal = $state(false);
	let selectedAsset = $state<any>(null);
	let editingAsset = $state<any>(null);
	let assets = $state((data.assets || []).map((asset: any) => decorateAsset(asset)));
	let searchQuery = $state('');
	let typeFilter = $state('all');
	let categoryFilter = $state('all');
	let statusFilter = $state('all');
	let seasonFilter = $state('all');
	let franchiseFilter = $state('all');

	const assetTypeColors: Record<string, string> = {
		flyer:   'bg-purple-900/40 text-purple-300 border-purple-700',
		jersey:  'bg-blue-900/40 text-blue-300 border-blue-700',
		shoe:    'bg-green-900/40 text-green-300 border-green-700',
		logo:    'bg-yellow-900/40 text-yellow-300 border-yellow-700',
		banner:  'bg-orange-900/40 text-orange-300 border-orange-700',
		social:  'bg-pink-900/40 text-pink-300 border-pink-700',
		other:   'bg-slate-700/40 text-slate-300 border-slate-600'
	};

	const categoryColors: Record<string, string> = {
		graphic: 'bg-indigo-900/40 text-indigo-300 border-indigo-700',
		photo: 'bg-sky-900/40 text-sky-300 border-sky-700',
		video: 'bg-red-900/40 text-red-300 border-red-700',
		audio: 'bg-amber-900/40 text-amber-300 border-amber-700',
		document: 'bg-slate-700/40 text-slate-300 border-slate-600',
		broadcast_segment: 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-700',
		social_clip: 'bg-pink-900/40 text-pink-300 border-pink-700',
		interview: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
		highlight: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
		sponsor_asset: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
		archive_package: 'bg-orange-900/40 text-orange-300 border-orange-700',
		other: 'bg-slate-700/40 text-slate-300 border-slate-600'
	};

	function fileUrl(asset: any, thumb = false) {
		const base = `${PB_URL}/api/files/${asset.collectionId}/${asset.id}/${asset.file}`;
		return thumb ? `${base}?thumb=400x400` : base;
	}

	let filtered = $derived(assets.filter((a: any) => {
		if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false;
		if (categoryFilter !== 'all' && (a.media_category || 'other') !== categoryFilter) return false;
		if (statusFilter !== 'all' && (a.status || 'uploaded') !== statusFilter) return false;
		if (seasonFilter !== 'all' && a.season !== seasonFilter) return false;
		if (franchiseFilter !== 'all' && a.franchise !== franchiseFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const haystack = [
				a.title,
				a.tags,
				a.notes,
				a.resolution,
				a.expand?.tournament?.name,
				a.expand?.special_event?.name,
				a.expand?.season?.name
			].filter(Boolean).join(' ').toLowerCase();
			if (!haystack.includes(q)) return false;
		}
		return true;
	}));

	let counts = $derived(
		assets.reduce((acc: Record<string, number>, a: any) => {
			acc[a.asset_type] = (acc[a.asset_type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>)
	);

	function seasonLabel(asset: any) {
		return asset.expand?.season?.name || asset.expand?.season?.year || '';
	}

	function previewKind(asset: any) {
		if (isImageLikeAsset(asset)) return 'image';
		if (asset.media_category === 'video' || asset.media_category === 'broadcast_segment' || asset.media_category === 'social_clip' || asset.media_category === 'highlight' || asset.media_category === 'interview') return 'video';
		if (asset.media_category === 'audio') return 'audio';
		if (asset.media_category === 'archive_package') return 'archive';
		return 'document';
	}

	async function deleteAsset(id: string) {
		if (!confirm('Delete this asset?')) return;
		const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
		if (res.ok) {
			assets = assets.filter((a: any) => a.id !== id);
		}
	}

	// Look up relation names from loaded lists (avoids PocketBase expand errors on empty relations)
	function franchiseName(id: string) {
		return franchiseMap.get(id)?.name || '';
	}

	function handleUploaded(asset: any) {
		assets = [decorateAsset(asset), ...assets];
	}

	function openDetail(asset: any) {
		selectedAsset = decorateAsset(asset);
		showDetailModal = true;
	}

	function openEdit(asset: any) {
		editingAsset = decorateAsset(asset);
		showEditModal = true;
		showDetailModal = false;
	}

	function handleUpdated(updated: any) {
		const decorated = decorateAsset(updated);
		assets = assets.map((a: any) => a.id === updated.id ? { ...a, ...decorated } : a);
		if (selectedAsset?.id === updated.id) {
			selectedAsset = { ...selectedAsset, ...decorated };
		}
	}

	onMount(() => {
		console.log('[media dashboard] mounted', {
			assetCount: assets.length,
			filters: {
				typeFilter,
				categoryFilter,
				statusFilter,
				seasonFilter,
				franchiseFilter,
				searchQuery
			},
			lookupCounts: {
				franchises: data.franchises?.length || 0,
				projects: data.projects?.length || 0,
				campaigns: data.campaigns?.length || 0,
				seasons: data.seasons?.length || 0,
				tournaments: data.tournaments?.length || 0,
				specialEvents: data.specialEvents?.length || 0
			}
		});
	});
</script>

<div class="min-h-screen bg-slate-950 text-white p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white">Media Assets</h1>
			<p class="text-slate-400 text-sm mt-1">{assets.length} asset{assets.length !== 1 ? 's' : ''} total</p>
		</div>
		<Button onclick={() => (showUploadModal = true)} class="bg-blue-600 hover:bg-blue-700 text-white">
			<Upload class="size-4 mr-2" />
			Upload Asset
		</Button>
	</div>

	<!-- Type summary pills -->
	<div class="flex flex-wrap gap-2 mb-6">
		<button
			onclick={() => (typeFilter = 'all')}
			class="px-3 py-1 rounded-full text-xs font-medium border transition-colors {typeFilter === 'all' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'}"
		>
			All ({assets.length})
		</button>
		{#each mediaAssetTypes as { value, label }}
			{#if counts[value]}
				<button
					onclick={() => (typeFilter = typeFilter === value ? 'all' : value)}
					class="px-3 py-1 rounded-full text-xs font-medium border transition-colors {typeFilter === value ? 'bg-white text-slate-900 border-white' : assetTypeColors[value]}"
				>
					{label} ({counts[value]})
				</button>
			{/if}
		{/each}
	</div>

	<!-- Filters -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
			<Input
				bind:value={searchQuery}
				placeholder="Search by title or tag..."
				class="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
			/>
		</div>
		<select bind:value={categoryFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All categories</option>
			{#each mediaCategories as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<select bind:value={statusFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All statuses</option>
			{#each mediaStatuses as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<select bind:value={seasonFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All seasons</option>
			{#each data.seasons || [] as season}
				<option value={season.id}>{season.name || season.year}</option>
			{/each}
		</select>
		{#if data.franchises?.length}
			<select
				bind:value={franchiseFilter}
				class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
			>
				<option value="all">FLI League</option>
				{#each data.franchises as f}
					<option value={f.id}>{f.name}</option>
				{/each}
			</select>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2 mb-6">
		{#each mediaUsageScopes as option}
			{#if assets.some((asset: any) => asset.usage_scope === option.value)}
				<span class="px-2.5 py-1 rounded-full text-xs border border-slate-700 text-slate-300 bg-slate-800/80">{option.label}</span>
			{/if}
		{/each}
		{#each mediaRightsStatuses as option}
			{#if assets.some((asset: any) => asset.rights_status === option.value)}
				<span class="px-2.5 py-1 rounded-full text-xs border border-slate-700 text-slate-300 bg-slate-800/80">{option.label}</span>
			{/if}
		{/each}
	</div>

	<!-- Grid -->
	{#if filtered.length === 0}
		<div class="flex flex-col items-center justify-center py-24 text-slate-500">
			<Image class="size-16 mb-4 opacity-30" />
			<p class="text-lg font-medium">No assets found</p>
			<p class="text-sm mt-1">Upload your first asset to get started</p>
			<Button onclick={() => (showUploadModal = true)} class="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
				<Upload class="size-4 mr-2" />
				Upload Asset
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
			{#each filtered as asset (asset.id)}
				<div class="group relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors">
					<!-- Image -->
					<div class="aspect-square bg-slate-900 overflow-hidden">
						{#if previewKind(asset) === 'image'}
							<img
								src={fileUrl(asset, true)}
								alt={asset.title}
								class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
								loading="lazy"
							/>
						{:else if previewKind(asset) === 'video'}
							<div class="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-gradient-to-br from-red-950/60 to-slate-900">
								<Film class="size-10" />
								<span class="text-xs uppercase tracking-wide">Video Asset</span>
							</div>
						{:else if previewKind(asset) === 'audio'}
							<div class="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-gradient-to-br from-amber-950/60 to-slate-900">
								<Mic class="size-10" />
								<span class="text-xs uppercase tracking-wide">Audio Asset</span>
							</div>
						{:else if previewKind(asset) === 'archive'}
							<div class="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-gradient-to-br from-orange-950/60 to-slate-900">
								<Archive class="size-10" />
								<span class="text-xs uppercase tracking-wide">Archive Package</span>
							</div>
						{:else}
							<div class="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300 bg-gradient-to-br from-slate-800 to-slate-900">
								<FileText class="size-10" />
								<span class="text-xs uppercase tracking-wide">Document Asset</span>
							</div>
						{/if}
					</div>

					<!-- Overlay actions -->
					<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<button
							onclick={() => openDetail(asset)}
							class="p-2 rounded-full bg-slate-500/70 hover:bg-slate-500 text-white transition-colors"
							title="View details"
						>
							<Eye class="size-4" />
						</button>
						<a
							href={fileUrl(asset)}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(event) => event.stopPropagation()}
							class="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
							title="Open full size"
						>
							<ExternalLink class="size-4" />
						</a>
						<button
							onclick={() => openEdit(asset)}
							class="p-2 rounded-full bg-blue-500/70 hover:bg-blue-500 text-white transition-colors"
							title="Edit"
						>
							<Pencil class="size-4" />
						</button>
						<button
							onclick={() => deleteAsset(asset.id)}
							class="p-2 rounded-full bg-red-500/70 hover:bg-red-500 text-white transition-colors"
							title="Delete"
						>
							<Trash2 class="size-4" />
						</button>
					</div>

					<!-- Info -->
					<div class="p-2">
						<button type="button" class="text-xs font-medium text-white truncate text-left hover:text-blue-300 block w-full" title={asset.title} onclick={() => openDetail(asset)}>{asset.title}</button>
						<div class="flex items-center justify-between mt-1 gap-1">
							<span class="text-xs px-1.5 py-0.5 rounded border {assetTypeColors[asset.asset_type] || assetTypeColors.other}">
								{labelFor(mediaAssetTypes, asset.asset_type)}
							</span>
							{#if asset.franchise}
								<span class="text-xs text-slate-400 truncate ml-1">{franchiseName(asset.franchise)}</span>
							{/if}
						</div>
						<div class="flex items-center gap-1 mt-1 flex-wrap">
							<span class="text-[10px] px-1.5 py-0.5 rounded border {categoryColors[asset.media_category || 'other'] || categoryColors.other}">
								{labelFor(mediaCategories, asset.media_category || 'other')}
							</span>
							{#if asset.status}
								<span class="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 bg-slate-900/80">{labelFor(mediaStatuses, asset.status)}</span>
							{/if}
						</div>
						{#if seasonLabel(asset) || asset.expand?.tournament?.name}
							<p class="text-[10px] text-slate-400 mt-1 truncate">{[seasonLabel(asset), asset.expand?.tournament?.name].filter(Boolean).join(' · ')}</p>
						{/if}
						{#if asset.rights_status || asset.usage_scope}
							<p class="text-[10px] text-slate-500 mt-1 truncate">{[labelFor(mediaRightsStatuses, asset.rights_status), labelFor(mediaUsageScopes, asset.usage_scope)].filter(Boolean).join(' · ')}</p>
						{/if}
						{#if asset.tags}
							<p class="text-xs text-slate-500 mt-1 truncate">{asset.tags}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<UploadMediaModal
	bind:open={showUploadModal}
	franchises={data.franchises}
	projects={data.projects}
	campaigns={data.campaigns}
	seasons={data.seasons}
	tournaments={data.tournaments}
	specialEvents={data.specialEvents}
	pbUrl={data.pbUrl}
	authToken={data.authToken}
	onUploaded={handleUploaded}
/>

<MediaAssetDetailSheet
	bind:open={showDetailModal}
	asset={selectedAsset}
	pbUrl={data.pbUrl}
	onEdit={openEdit}
/>

{#if editingAsset}
	<EditMediaModal
		bind:open={showEditModal}
		asset={editingAsset}
		franchises={data.franchises}
		projects={data.projects}
		campaigns={data.campaigns}
		seasons={data.seasons}
		tournaments={data.tournaments}
		specialEvents={data.specialEvents}
		pbUrl={data.pbUrl}
		onUpdated={handleUpdated}
	/>
{/if}
