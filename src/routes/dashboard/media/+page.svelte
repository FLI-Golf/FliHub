<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import UploadMediaModal from '$lib/components/media/upload-media-modal.svelte';
	import EditMediaModal from '$lib/components/media/edit-media-modal.svelte';
	import {
		AlertCircle,
		ChevronDown,
		Clock3,
		Database,
		Download,
		ExternalLink,
		Film,
		Image,
		Package,
		Pencil,
		PlayCircle,
		RefreshCw,
		Search,
		ShieldCheck,
		Sparkles,
		Tag,
		Trash2,
		Upload,
		Users,
		CheckCircle2,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const PB_URL = data.pbUrl || 'http://127.0.0.1:8090';

	let showUploadModal = $state(false);
	let showEditModal = $state(false);
	let editingAsset = $state<any>(null);
	let assets = $state(data.assets || []);
	let searchQuery = $state('');
	let typeFilter = $state('all');
	let franchiseFilter = $state('all');
	let categoryFilter = $state('all');
	let statusFilter = $state('all');
	let seasonFilter = $state('all');
	let peopleFilter = $state('all');
	let teamFilter = $state('all');
	let sponsorFilter = $state('all');
	let roundFilter = $state('all');
	let shotTypeFilter = $state('all');
	let momentFilter = $state('all');
	let visibilityFilter = $state('all');
	let aiSearchQuery = $state('');
	let aiQueueType = $state('metadata_suggestion');
	let phase6Summary = $state<any>(null);
	let phase6Loading = $state(false);
	let phase6Error = $state('');
	let aiQueueSummary = $state<any>(null);
	let aiQueueLoading = $state(false);
	let aiQueueError = $state('');
	let phase5Summary = $state<any>(null);
	let packageLoading = $state(false);
	let packageError = $state('');
	let packageItems = $state<any[]>([]);
	let packageOptions = $state<any[]>([]);
	let packageManifest = $state<any>(null);
	let packageFormat = $state('Reel');
	let showPhase6Card = $state(false);
	let showPhase7Card = $state(false);
	let showPhase5Card = $state(false);
	let clearDataLoading = $state(false);
	let clearDataMessage = $state('');
	let clearDataError = $state('');

	let phase6Stats = $derived(phase6Summary?.stats ?? marketplaceStats);
	let phase6Listings = $derived(phase6Summary?.latestListings ?? latestListings);

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
		if (categoryFilter !== 'all' && (a.category ?? '').toLowerCase() !== categoryFilter) return false;
		if (statusFilter !== 'all' && (a.status ?? '').toLowerCase() !== statusFilter) return false;
		if (seasonFilter !== 'all' && (a.season ?? a.franchise ?? '').toString() !== seasonFilter) return false;
		if (peopleFilter !== 'all' && (a.person ?? a.owner ?? '').toString() !== peopleFilter) return false;
		if (teamFilter !== 'all' && (a.team ?? a.franchise ?? '').toString() !== teamFilter) return false;
		if (sponsorFilter !== 'all' && (a.sponsor ?? a.sponsorId ?? '').toString() !== sponsorFilter) return false;
		if (roundFilter !== 'all' && (a.round ?? '').toLowerCase() !== roundFilter) return false;
		if (shotTypeFilter !== 'all' && (a.shot_type ?? '').toLowerCase() !== shotTypeFilter) return false;
		if (momentFilter !== 'all' && (a.moment ?? '').toLowerCase() !== momentFilter) return false;
		if (visibilityFilter !== 'all' && (a.visibility ?? '').toLowerCase() !== visibilityFilter) return false;
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

	function clearWorkbenchFilters() {
		searchQuery = '';
		typeFilter = 'all';
		franchiseFilter = 'all';
		categoryFilter = 'all';
		statusFilter = 'all';
		seasonFilter = 'all';
		peopleFilter = 'all';
		teamFilter = 'all';
		sponsorFilter = 'all';
		roundFilter = 'all';
		shotTypeFilter = 'all';
		momentFilter = 'all';
		visibilityFilter = 'all';
	}

	const categoryOptions = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'graphic', label: 'Graphic' },
		{ value: 'photo', label: 'Photo' },
		{ value: 'video', label: 'Video' },
		{ value: 'audio', label: 'Audio' },
		{ value: 'document', label: 'Document' },
		{ value: 'broadcast segment', label: 'Broadcast Segment' },
		{ value: 'social clip', label: 'Social Clip' },
		{ value: 'interview', label: 'Interview' },
		{ value: 'highlight', label: 'Highlight' },
		{ value: 'sponsor asset', label: 'Sponsor Asset' },
		{ value: 'archive package', label: 'Archive Package' },
		{ value: 'other', label: 'Other' },
	];

	const statusOptions = ['Uploaded', 'Processing', 'Tagged', 'Approved', 'Archived', 'Restricted'];
	const roundOptions = ['Practice', 'Qualifier', 'Round 1', 'Round 2', 'Round 3', 'Final Round', 'Playoff', 'Other'];
	const shotTypeOptions = ['Drive', 'Approach', 'Chip', 'Putt', 'Bunker', 'Penalty', 'Other'];
	const momentOptions = ['Crowd Reaction', 'Interview Segment', 'Award Ceremony', 'VIP / Hospitality', 'Sponsor Activation', 'Other'];
	const visibilityOptions = ['Internal', 'Sponsor', 'Broadcast', 'Restricted', 'Owned', 'Shared Rights', 'Expired'];
	const aiQueueTypes = ['metadata_suggestion', 'clip_summarization', 'transcript_extractions', 'scene_detection', 'logo_recognition', 'player_recognition'];
	const packageTypes = ['Reel', 'Event Recap', 'Player Package', 'Sponsor Package', 'Social Export', 'Other', 'Broadcast', 'Social', 'Internal', 'Sponsor', 'Editorial', 'Other'];

	const marketplaceStats = [
		{ label: 'Assets Stored', value: '87' },
		{ label: 'Hours of Footage', value: '0' },
		{ label: 'Photo Count', value: '0' },
		{ label: 'Deliverables Completed', value: '0' },
		{ label: 'Licensing Revenue', value: '$3,200' },
		{ label: 'Downloads', value: '1' },
		{ label: 'Snapshot Date', value: '6/5/2026' },
	];

	const headlineStats = [
		{ label: 'Licensed assets', value: '3' },
		{ label: 'Deal fees', value: '$120,000' },
		{ label: 'Attributed revenue', value: '$9,750' },
		{ label: 'Sponsor deliverables', value: '4' },
		{ label: 'Delivered/Approved', value: '2/0' },
		{ label: 'In Progress', value: '2' },
		{ label: 'Overdue', value: '0' },
		{ label: 'Appearances/Recaps', value: '4/4' },
		{ label: 'Phase 5 Packages', value: '9' },
	];

	const latestListings = [
		{ title: 'Phase 6 Listing 2026-06-05', status: 'active', pricing: 'flat_fee', amount: '$3,500', requests: 1 },
		{ title: 'Phase 6 Listing 2026-06-05', status: 'active', pricing: 'flat_fee', amount: '$3,500', requests: 1 },
	];

	const queuedJobs = [
		{ title: 'White Flip Footware', type: 'clip_summarization', source: 'seed-engine', status: 'completed' },
		{ title: 'White Flip Footware', type: 'metadata_suggestion', source: 'smoke-rest', status: 'completed' },
		{ title: 'White Flip Footware', type: 'metadata_suggestion', source: 'process-endpoint-smoke', status: 'completed' },
		{ title: 'White Flip Footware', type: 'metadata_suggestion', source: 'one-shot', status: 'completed' },
	];

	let aiQueueJobs = $state([...queuedJobs]);
	let aiQueueCounts = $state({
		total: queuedJobs.length,
		matched: queuedJobs.length,
		pending: 0,
		reviewed: 0,
		approved: queuedJobs.length,
		rejected: 0,
	});

	const highlightQueue = [
		{ order: 1, title: 'Chris Dickerson', phase: 'Opening', tag: 'Feature' },
		{ order: 2, title: 'Phase 1 Seed - Broadcast Run of Show', phase: 'Opening', tag: 'Feature' },
	];

	let selectedPackage = $state('none');
	let packageStatus = $state('draft');

	function refreshPhase6() {
		return loadPhase6Summary();
	}

	async function clearTestData() {
		if (clearDataLoading) return;
		if (!confirm('Clear seeded/test media queue and package records? This cannot be undone.')) return;

		clearDataLoading = true;
		clearDataMessage = '';
		clearDataError = '';

		try {
			const response = await fetch('/api/media/test-data', { method: 'DELETE' });
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(payload?.message || `Clear test data failed (${response.status})`);
			}

			clearDataMessage = `Removed ${payload.deletedTotal ?? 0} test records (${payload.transcripts?.deleted ?? 0} transcripts, ${payload.packages?.deleted ?? 0} packages).`;
			await Promise.all([loadPhase6Summary(), loadAiQueue(), loadPhase5Summary()]);
		} catch (error: any) {
			clearDataError = error?.message || 'Failed to clear test data';
			console.error('Failed to clear test data:', error);
		} finally {
			clearDataLoading = false;
		}
	}

	async function loadPhase5Summary() {
		packageLoading = true;
		packageError = '';

		try {
			const params = new URLSearchParams();
			if (selectedPackage !== 'none') {
				params.set('packageTitle', selectedPackage);
			}

			const response = await fetch(`/api/media/phase5?${params.toString()}`);
			if (!response.ok) {
				throw new Error(`Phase 5 request failed (${response.status})`);
			}

			const payload = await response.json();
			phase5Summary = payload;
			packageItems = payload.items ?? [];
			packageOptions = payload.packages ?? [];
			packageManifest = payload.manifest ?? null;

			if (selectedPackage === 'none' && packageOptions.length > 0) {
				selectedPackage = packageOptions[0].title;
			}
		} catch (error: any) {
			packageError = error?.message || 'Failed to load Phase 5 packages';
			packageItems = [...highlightQueue];
			packageOptions = [{ title: 'Phase 5 Highlight Package 2026-06-05', count: highlightQueue.length }];
			console.error('Failed to load Phase 5 packages:', error);
		} finally {
			packageLoading = false;
		}
	}

	async function mutatePhase5Package(action: 'create' | 'advance' | 'approve' | 'publish' | 'export', id?: string) {
		packageLoading = true;
		packageError = '';

		try {
			const response = await fetch('/api/media/phase5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					id,
					packageTitle: selectedPackage,
					packageType: packageFormat,
					packageStatus,
				}),
			});

			if (!response.ok) {
				throw new Error(`Phase 5 ${action} failed (${response.status})`);
			}

			const payload = await response.json();
			phase5Summary = payload;
			if (action === 'export') {
				packageManifest = payload.manifest ?? payload;
			} else {
				selectedPackage = payload.selectedPackage ?? selectedPackage;
				packageStatus = payload.packageStatus ?? packageStatus;
				await loadPhase5Summary();
			}
		} catch (error: any) {
			packageError = error?.message || `Failed to ${action} package`;
			console.error(`Failed to ${action} package:`, error);
		} finally {
			packageLoading = false;
		}
	}

	function createPackage() {
		void mutatePhase5Package('create');
	}

	function exportManifest() {
		void mutatePhase5Package('export');
	}

	function advancePackageItem(id: string) {
		void mutatePhase5Package('advance', id);
	}

	function approvePackageItem(id: string) {
		void mutatePhase5Package('approve', id);
	}

	function publishPackageItem(id: string) {
		void mutatePhase5Package('publish', id);
	}

	async function loadAiQueue() {
		aiQueueLoading = true;
		aiQueueError = '';

		try {
			const params = new URLSearchParams();

			if (aiSearchQuery.trim()) {
				params.set('query', aiSearchQuery.trim());
			}

			params.set('queueType', aiQueueType);
			params.set('limit', '8');

			const response = await fetch(`/api/media/phase7?${params.toString()}`);

			if (!response.ok) {
				throw new Error(`Phase 7 request failed (${response.status})`);
			}

			const payload = await response.json();
			aiQueueSummary = payload;
			aiQueueJobs = payload.jobs ?? [];
			aiQueueCounts = payload.counts ?? aiQueueCounts;
		} catch (error: any) {
			aiQueueError = error?.message || 'Failed to load Phase 7 queue';
			console.error('Failed to load Phase 7 queue:', error);
		} finally {
			aiQueueLoading = false;
		}
	}

	async function mutateAiQueue(action: 'process' | 'approve') {
		aiQueueLoading = true;
		aiQueueError = '';

		try {
			const response = await fetch('/api/media/phase7', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					queueType: aiQueueType,
					query: aiSearchQuery.trim(),
					ids: aiQueueJobs.map((job: any) => job.id).filter(Boolean),
				}),
			});

			if (!response.ok) {
				throw new Error(`Phase 7 ${action} failed (${response.status})`);
			}

			const payload = await response.json();
			aiQueueSummary = payload;
			aiQueueJobs = payload.jobs ?? aiQueueJobs;
			aiQueueCounts = payload.counts ?? aiQueueCounts;
		} catch (error: any) {
			aiQueueError = error?.message || `Failed to ${action} Phase 7 queue`;
			console.error(`Failed to ${action} Phase 7 queue:`, error);
		} finally {
			aiQueueLoading = false;
		}
	}

	async function reviewAiQueueItem(id: string, action: 'approve' | 'reject') {
		aiQueueLoading = true;
		aiQueueError = '';

		try {
			const response = await fetch('/api/media/phase7', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					ids: [id],
					queueType: aiQueueType,
					query: aiSearchQuery.trim(),
				}),
			});

			if (!response.ok) {
				throw new Error(`Phase 7 item ${action} failed (${response.status})`);
			}

			const payload = await response.json();
			aiQueueSummary = payload;
			aiQueueJobs = payload.jobs ?? aiQueueJobs;
			aiQueueCounts = payload.counts ?? aiQueueCounts;
		} catch (error: any) {
			aiQueueError = error?.message || `Failed to ${action} transcript`;
			console.error(`Failed to ${action} transcript:`, error);
		} finally {
			aiQueueLoading = false;
		}
	}

	function processAiQueue() {
		void mutateAiQueue('process');
	}

	function refreshAiQueue() {
		void loadAiQueue();
	}

	function approveAiSuggestions() {
		void mutateAiQueue('approve');
	}

	async function loadPhase6Summary() {
		phase6Loading = true;
		phase6Error = '';

		try {
			const response = await fetch('/api/media/phase6');
			if (!response.ok) {
				throw new Error(`Phase 6 request failed (${response.status})`);
			}

			phase6Summary = await response.json();
		} catch (error: any) {
			phase6Error = error?.message || 'Failed to load Phase 6 summary';
			console.error('Failed to load Phase 6 summary:', error);
		} finally {
			phase6Loading = false;
		}
	}

	onMount(() => {
		void loadPhase6Summary();
		void loadAiQueue();
		void loadPhase5Summary();
	});

	function sponsorLabel(record: any) {
		return record?.name || record?.companyName || 'Unnamed Sponsor';
	}

	function personLabel(record: any) {
		return record?.name || record?.email || 'Unnamed Person';
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

	{#if clearDataMessage}
		<div class="mb-6 rounded-xl border border-emerald-700 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
			{clearDataMessage}
		</div>
	{:else if clearDataError}
		<div class="mb-6 rounded-xl border border-rose-700 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
			{clearDataError}
		</div>
	{/if}

	<!-- Overview Stats -->
	<div class="grid gap-3 mb-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
		{#each headlineStats as stat}
			<div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
				<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
				<p class="mt-2 text-xl font-semibold text-white">{stat.value}</p>
			</div>
		{/each}
	</div>


	<section class="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
		<button
			type="button"
			onclick={() => (showPhase6Card = !showPhase6Card)}
			class="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left"
		>
			<div>
				<p class="text-lg font-semibold text-white">Marketplace and Executive Snapshot</p>
			</div>
			<ChevronDown class="size-5 text-slate-300 transition-transform {showPhase6Card ? 'rotate-180' : ''}" />
		</button>

		{#if showPhase6Card}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<h2 class="mt-2 text-xl font-semibold text-white">Marketplace and Executive Snapshot</h2>
				<p class="mt-2 max-w-3xl text-sm text-slate-400">
					Live summary from /api/media/phase6 for listings, requests, downloads, and monetization metrics.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button type="button" onclick={refreshPhase6} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Refresh</button>
				<button type="button" onclick={clearTestData} disabled={clearDataLoading} class="rounded-md border border-red-700 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60">{clearDataLoading ? 'Clearing...' : 'Clear Test Data'}</button>
			</div>
		</div>

		<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each phase6Stats as stat}
				<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
					<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
					<p class="mt-2 text-lg font-semibold text-white">{stat.value}</p>
				</div>
			{/each}
		</div>
		{#if phase6Loading}
			<p class="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">Refreshing Phase 6 summary...</p>
		{:else if phase6Error}
			<p class="mt-4 text-xs uppercase tracking-[0.2em] text-red-300">{phase6Error}</p>
		{/if}

		<div class="mt-6">
			<p class="text-sm font-medium text-slate-300">Latest Marketplace Listings</p>
			<p class="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{phase6Listings.length} shown</p>
			<div class="mt-4 grid gap-4 lg:grid-cols-2">
				{#each phase6Listings as listing}
					<div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-semibold text-white">{listing.title}</p>
								<p class="mt-1 text-sm text-slate-400">{listing.status} · {listing.pricing} · N/A</p>
							</div>
							<p class="text-lg font-semibold text-emerald-300">{listing.amount}</p>
						</div>
						<p class="mt-3 text-sm text-slate-400">requests: {listing.requests}</p>
					</div>
				{/each}
			</div>
		</div>
		{/if}
	</section>

	<section class="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
		<button
			type="button"
			onclick={() => (showPhase7Card = !showPhase7Card)}
			class="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left"
		>
			<div>
				<p class="text-lg font-semibold text-white">AI Search and Approval</p>
			</div>
			<ChevronDown class="size-5 text-slate-300 transition-transform {showPhase7Card ? 'rotate-180' : ''}" />
		</button>

		{#if showPhase7Card}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<details class="mt-2 group">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xl font-semibold text-white outline-none transition-colors hover:border-slate-500 hover:bg-slate-800">
						<span>How to use this tool</span>
						<span class="flex items-center gap-2 text-sm font-medium text-slate-300">
							<span class="hidden sm:inline">Click to expand</span>
							<span aria-hidden="true">▾</span>
						</span>
					</summary>
					<div class="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
						<p class="font-medium text-slate-100">Search across AI transcripts, detections, and summaries, then approve suggestions into structured taxonomy.</p>
						<p class="mt-3">Use the search box to find clips or moments by transcript text, recognized logos, player names, or scene labels. Choose a queue type before sending new matches into review so the processing pipeline knows what kind of job to create.</p>
						<p class="mt-3">After search results come back, review the suggested metadata, approve the items that are correct, and leave the rest queued for later refinement. The buttons in this section let you search, process, refresh, or clear test data without leaving the page.</p>
					</div>
				</details>
			</div>
			<div class="flex flex-wrap gap-2">
				<button type="button" onclick={loadAiQueue} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Search</button>
				<button type="button" onclick={processAiQueue} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Process Queue</button>
				<button type="button" onclick={refreshAiQueue} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Refresh Jobs</button>
				<button type="button" onclick={clearTestData} disabled={clearDataLoading} class="rounded-md border border-red-700 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60">{clearDataLoading ? 'Clearing...' : 'Clear Test Data'}</button>
			</div>
		</div>

		<div class="mt-6 flex flex-wrap gap-2">
			{#each aiQueueTypes as tag}
				<button type="button" class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700">{tag}</button>
			{/each}
		</div>

		<div class="mt-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<div class="flex items-center justify-between gap-3">
					<p class="text-sm font-medium text-slate-300">Queue Type for new jobs from search results and asset cards.</p>
					<select bind:value={aiQueueType} class="h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
						{#each aiQueueTypes as tag}
							<option value={tag}>{tag}</option>
						{/each}
					</select>
				</div>
				<div class="mt-4 flex gap-3">
					<div class="relative flex-1">
						<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
						<Input bind:value={aiSearchQuery} placeholder="Search transcripts, logos, players, moments..." class="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
					</div>
					<button type="button" onclick={approveAiSuggestions} class="flex h-10 items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">
						<Sparkles class="size-4" />
						Approve Suggestions
					</button>
				</div>
				{#if aiQueueLoading}
					<p class="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Updating AI queue...</p>
				{:else if aiQueueError}
					<p class="mt-3 text-xs uppercase tracking-[0.2em] text-red-300">{aiQueueError}</p>
				{/if}
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<p class="text-sm font-medium text-slate-300">Queued Jobs</p>
				<p class="mt-1 text-xs text-slate-500">{aiQueueCounts.matched} shown of {aiQueueCounts.total}</p>
				{#if aiQueueJobs.length === 0}
					<div class="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
						<p class="text-sm font-medium text-slate-200">No queued jobs yet.</p>
						<p class="mt-2 text-xs text-slate-400">Click Process Queue to generate transcript suggestions from available media assets.</p>
					</div>
				{:else}
					<div class="mt-4 space-y-3">
						{#each aiQueueJobs as job}
							<div class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="font-medium text-white">{job.title}</p>
										<p class="mt-1 text-xs text-slate-400">{job.type} · {job.source} · {job.confidence ?? 'N/A'}</p>
										<p class="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">Recommended: {job.recommendedAction}</p>
									</div>
									<span class="rounded-full border {job.status === 'approved' ? 'border-emerald-700 bg-emerald-900/40 text-emerald-200' : job.status === 'rejected' ? 'border-rose-700 bg-rose-900/40 text-rose-200' : 'border-amber-700 bg-amber-900/40 text-amber-200'} px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{job.status}</span>
								</div>
								<div class="mt-3 flex flex-wrap gap-2">
									<button type="button" onclick={() => reviewAiQueueItem(job.id, 'approve')} class="rounded-md border border-emerald-700 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 transition-colors hover:bg-emerald-900/60">
										Approve
									</button>
									<button type="button" onclick={() => reviewAiQueueItem(job.id, 'reject')} class="rounded-md border border-rose-700 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200 transition-colors hover:bg-rose-900/60">
										Reject
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Matched</p>
				<p class="mt-2 text-lg font-semibold text-white">{aiQueueCounts.matched}</p>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Pending</p>
				<p class="mt-2 text-lg font-semibold text-white">{aiQueueCounts.pending}</p>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Reviewed</p>
				<p class="mt-2 text-lg font-semibold text-white">{aiQueueCounts.reviewed}</p>
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<p class="text-[11px] uppercase tracking-[0.24em] text-slate-500">Approved</p>
				<p class="mt-2 text-lg font-semibold text-white">{aiQueueCounts.approved}</p>
			</div>
		</div>
		{/if}
	</section>

	<section class="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
		<button
			type="button"
			onclick={() => (showPhase5Card = !showPhase5Card)}
			class="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left"
		>
			<div>
				<p class="text-lg font-semibold text-white">Package Manager</p>
			</div>
			<ChevronDown class="size-5 text-slate-300 transition-transform {showPhase5Card ? 'rotate-180' : ''}" />
		</button>

		{#if showPhase5Card}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<details class="mt-2 group">
					<summary class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xl font-semibold text-white outline-none transition-colors hover:border-slate-500 hover:bg-slate-800">
						<span>How to use this tool</span>
						<span class="flex items-center gap-2 text-sm font-medium text-slate-300">
							<span class="hidden sm:inline">Click to expand</span>
							<span aria-hidden="true">▾</span>
						</span>
					</summary>
					<div class="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
						<p class="font-medium text-slate-100">Build highlight packages, add assets, reorder clip queue, and export manifest JSON.</p>
						<p class="mt-3">Start by choosing the package you want to edit, then set its status before you add or reorder items. Use the package-type chips to quickly switch the format of the export you’re building.</p>
						<p class="mt-3">When the queue looks right, create or update the package, export the manifest, and use the queue panel to verify the order and the current clip span. The clear button is only for resetting seeded or test data.</p>
					</div>
				</details>
			</div>
			<div class="flex flex-wrap gap-2">
				<button type="button" onclick={loadPhase5Summary} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Refresh Packages</button>
				<button type="button" onclick={clearTestData} disabled={clearDataLoading} class="rounded-md border border-red-700 bg-red-950/40 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60">{clearDataLoading ? 'Clearing...' : 'Clear Test Data'}</button>
			</div>
		</div>

		<div class="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Selected Package</p>
						<select bind:value={selectedPackage} onchange={loadPhase5Summary} class="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="none">None</option>
							{#each packageOptions as pkg}
								<option value={pkg.title}>{pkg.title}</option>
							{/each}
						</select>
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Package Status</p>
						<select bind:value={packageStatus} class="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="draft">Draft</option>
							<option value="in_review">In Review</option>
							<option value="approved">Approved</option>
							<option value="published">Published</option>
							<option value="archived">Archived</option>
						</select>
					</div>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
						{#each packageTypes as packageType}
							<button type="button" onclick={() => (packageFormat = packageType)} class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {packageFormat === packageType ? 'border-white bg-white text-slate-900' : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'}">{packageType}</button>
					{/each}
				</div>
				<div class="mt-4 flex gap-2">
					<button type="button" onclick={createPackage} class="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700">Create</button>
					<button type="button" onclick={exportManifest} class="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"><Download class="size-4" />Export Manifest</button>
				</div>
				{#if packageLoading}
					<p class="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Updating package manager...</p>
				{:else if packageError}
					<p class="mt-3 text-xs uppercase tracking-[0.2em] text-red-300">{packageError}</p>
				{/if}
			</div>
			<div class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-sm font-medium text-slate-300">{selectedPackage === 'none' ? 'Latest package queue' : selectedPackage}</p>
						<p class="mt-1 text-xs text-slate-500">{packageItems.length} items · {phase5Summary?.clipSpan ?? '0s'} clip span</p>
					</div>
					<span class="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">{packageStatus}</span>
				</div>
				<div class="mt-4 space-y-3">
					{#each packageItems as item}
						<div class="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="font-medium text-white">{item.order ?? 1}. {item.title}</p>
									<p class="mt-1 text-xs text-slate-400">{item.contentType ?? item.phase} · {item.stage ?? item.tag} · {item.approvalStatus ?? 'pending'}</p>
									<p class="mt-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">Recommended: {item.recommendedAction}</p>
								</div>
								<span class="rounded-full border {item.stage === 'published' ? 'border-emerald-700 bg-emerald-900/40 text-emerald-200' : item.stage === 'approval' ? 'border-amber-700 bg-amber-900/40 text-amber-200' : 'border-slate-700 bg-slate-800 text-slate-200'} px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{item.stage ?? 'draft'}</span>
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								<button type="button" onclick={() => advancePackageItem(item.id)} class="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition-colors hover:bg-slate-700">
									Advance
								</button>
								<button type="button" onclick={() => approvePackageItem(item.id)} class="rounded-md border border-emerald-700 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 transition-colors hover:bg-emerald-900/60">
									Approve
								</button>
								<button type="button" onclick={() => publishPackageItem(item.id)} class="rounded-md border border-blue-700 bg-blue-950/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200 transition-colors hover:bg-blue-900/60">
									Publish
								</button>
							</div>
						</div>
					{/each}
				</div>
				{#if packageManifest}
					<div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-xs uppercase tracking-[0.22em] text-slate-500">Manifest Preview</p>
						<p class="mt-2 text-sm text-slate-300">{packageManifest.title ?? 'Selected package'} · {packageManifest.items?.length ?? 0} items</p>
					</div>
				{/if}
				<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Packages</p>
						<p class="mt-2 text-lg font-semibold text-white">{phase5Summary?.counts?.packages ?? packageOptions.length}</p>
					</div>
					<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Brief</p>
						<p class="mt-2 text-lg font-semibold text-white">{phase5Summary?.counts?.brief ?? 0}</p>
					</div>
					<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Approval</p>
						<p class="mt-2 text-lg font-semibold text-white">{phase5Summary?.counts?.approval ?? 0}</p>
					</div>
					<div class="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
						<p class="text-[11px] uppercase tracking-[0.22em] text-slate-500">Published</p>
						<p class="mt-2 text-lg font-semibold text-white">{phase5Summary?.counts?.published ?? 0}</p>
					</div>
				</div>
			</div>
		</div>
		{/if}
	</section>

	<!-- Type summary pills -->
	<div class="flex flex-wrap gap-2 mb-6">
		<button
			type="button"
			onclick={() => (typeFilter = 'all')}
			class="px-3 py-1 rounded-full text-xs font-medium border transition-colors {typeFilter === 'all' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'}"
		>
			All ({assets.length})
		</button>
		{#each Object.entries(assetTypeLabels) as [value, label]}
			{#if counts[value]}
				<button
					type="button"
					onclick={() => (typeFilter = typeFilter === value ? 'all' : value)}
					class="px-3 py-1 rounded-full text-xs font-medium border transition-colors {typeFilter === value ? 'bg-white text-slate-900 border-white' : assetTypeColors[value]}"
				>
					{label} ({counts[value]})
				</button>
			{/if}
		{/each}
	</div>

	<!-- Filters -->
	<div class="grid gap-3 mb-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
			<Input
				bind:value={searchQuery}
				placeholder="Search by title or tag..."
				class="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
			/>
		</div>
		<select bind:value={franchiseFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">FLI League</option>
			{#each data.franchises as franchise}
				<option value={franchise.id}>{franchise.name}</option>
			{/each}
		</select>
		<select bind:value={categoryFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			{#each categoryOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<select bind:value={statusFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Statuses</option>
			{#each statusOptions as status}
				<option value={status.toLowerCase()}>{status}</option>
			{/each}
		</select>
		<select bind:value={seasonFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Seasons</option>
			{#each data.franchises as franchise}
				<option value={franchise.id}>{franchise.name}</option>
			{/each}
		</select>
		<select bind:value={peopleFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All People</option>
			{#each data.people || [] as person}
				<option value={person.id}>{personLabel(person)}</option>
			{/each}
		</select>
		<select bind:value={teamFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Teams</option>
			{#each data.franchises as franchise}
				<option value={franchise.id}>{franchise.name}</option>
			{/each}
		</select>
		<select bind:value={sponsorFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Sponsors</option>
			{#each data.sponsors || [] as sponsor}
				<option value={sponsor.id}>{sponsorLabel(sponsor)}</option>
			{/each}
		</select>
		<select bind:value={roundFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Rounds</option>
			{#each roundOptions as round}
				<option value={round.toLowerCase()}>{round}</option>
			{/each}
		</select>
		<select bind:value={shotTypeFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Shot Types</option>
			{#each shotTypeOptions as shotType}
				<option value={shotType.toLowerCase()}>{shotType}</option>
			{/each}
		</select>
		<select bind:value={momentFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Moments</option>
			{#each momentOptions as moment}
				<option value={moment.toLowerCase()}>{moment}</option>
			{/each}
		</select>
		<select bind:value={visibilityFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Visibility</option>
			{#each visibilityOptions as visibility}
				<option value={visibility.toLowerCase()}>{visibility}</option>
		{/each}
		</select>
		<button
			type="button"
			onclick={clearWorkbenchFilters}
			class="flex h-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700"
		>
			Clear filters
		</button>
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
	sponsors={data.sponsors}
	people={data.people}
	pbUrl={data.pbUrl}
	authToken={data.authToken}
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
