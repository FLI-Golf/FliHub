<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import UploadMediaModal from '$lib/components/media/upload-media-modal.svelte';
	import EditMediaModal from '$lib/components/media/edit-media-modal.svelte';
	import { Upload, Search, Trash2, ExternalLink, Image, Pencil } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

	let showUploadModal = $state(false);
	let showEditModal = $state(false);
	let editingAsset = $state<any>(null);
	let assets = $state(data.assets || []);
	let searchQuery = $state('');
	let typeFilter = $state('all');
	let franchiseFilter = $state('all');

	const assetTypeLabels: Record<string, string> = {
		flyer: 'Flyer', jersey: 'Jersey', shoe: 'Shoe',
		logo: 'Logo', banner: 'Banner', social: 'Social', other: 'Other'
	};

	const assetTypeColors: Record<string, string> = {
		flyer:   'bg-purple-900/40 text-purple-300 border-purple-700',
		jersey:  'bg-blue-900/40 text-blue-300 border-blue-700',
		shoe:    'bg-green-900/40 text-green-300 border-green-700',
		logo:    'bg-yellow-900/40 text-yellow-300 border-yellow-700',
		banner:  'bg-orange-900/40 text-orange-300 border-orange-700',
		social:  'bg-pink-900/40 text-pink-300 border-pink-700',
		other:   'bg-slate-700/40 text-slate-300 border-slate-600'
	};

	function fileUrl(asset: any, thumb = false) {
		const base = `${PB_URL}/api/files/${asset.collectionId}/${asset.id}/${asset.file}`;
		return thumb ? `${base}?thumb=400x400` : base;
	}

	let filtered = $derived(assets.filter((a: any) => {
		if (typeFilter !== 'all' && a.asset_type !== typeFilter) return false;
		if (franchiseFilter !== 'all' && a.franchise !== franchiseFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			if (!a.title?.toLowerCase().includes(q) && !a.tags?.toLowerCase().includes(q)) return false;
		}
		return true;
	}));

	let counts = $derived(
		assets.reduce((acc: Record<string, number>, a: any) => {
			acc[a.asset_type] = (acc[a.asset_type] || 0) + 1;
			return acc;
		}, {} as Record<string, number>)
	);

	async function deleteAsset(id: string) {
		if (!confirm('Delete this asset?')) return;
		const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
		if (res.ok) {
			assets = assets.filter((a: any) => a.id !== id);
		}
	}

	// Look up relation names from loaded lists (avoids PocketBase expand errors on empty relations)
	function franchiseName(id: string) {
		return data.franchises?.find((f: any) => f.id === id)?.name || '';
	}

	function handleUploaded(asset: any) {
		assets = [asset, ...assets];
	}

	function openEdit(asset: any) {
		editingAsset = asset;
		showEditModal = true;
	}

	function handleUpdated(updated: any) {
		assets = assets.map((a: any) => a.id === updated.id ? { ...a, ...updated } : a);
	}
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
		{#each Object.entries(assetTypeLabels) as [value, label]}
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
	<div class="flex gap-3 mb-6">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
			<Input
				bind:value={searchQuery}
				placeholder="Search by title or tag..."
				class="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
			/>
		</div>
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
						<img
							src={fileUrl(asset, true)}
							alt={asset.title}
							class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
							loading="lazy"
						/>
					</div>

					<!-- Overlay actions -->
					<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<a
							href={fileUrl(asset)}
							target="_blank"
							rel="noopener noreferrer"
							class="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
							title="Open full size"
						>
							<ExternalLink class="size-4" />
						</a>

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
						<p class="text-xs font-medium text-white truncate" title={asset.title}>{asset.title}</p>
						<div class="flex items-center justify-between mt-1">
							<span class="text-xs px-1.5 py-0.5 rounded border {assetTypeColors[asset.asset_type] || assetTypeColors.other}">
								{assetTypeLabels[asset.asset_type] || asset.asset_type}
							</span>
							{#if asset.franchise}
								<span class="text-xs text-slate-400 truncate ml-1">{franchiseName(asset.franchise)}</span>
							{/if}
						</div>
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
	onUploaded={handleUploaded}
/>

{#if editingAsset}
	<EditMediaModal
		bind:open={showEditModal}
		asset={editingAsset}
		franchises={data.franchises}
		projects={data.projects}
		campaigns={data.campaigns}
		onUpdated={handleUpdated}
	/>
{/if}
