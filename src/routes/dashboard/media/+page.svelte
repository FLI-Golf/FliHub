<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import UploadMediaModal from '$lib/components/media/upload-media-modal.svelte';
	import EditMediaModal from '$lib/components/media/edit-media-modal.svelte';
	import MediaAssetDetailSheet from '$lib/components/media/media-asset-detail-sheet.svelte';
	import { Upload, Search, Trash2, ExternalLink, Image, Pencil, Film, FileText, Mic, Archive, Eye, Plus, Download, ChevronUp, ChevronDown, Save, RotateCcw } from 'lucide-svelte';
	import {
		highlightExportTargets,
		highlightPackageStatuses,
		highlightPackageTypes,
		labelFor,
		mediaAssetTypes,
		mediaCategories,
		mediaMomentTypes,
		mediaRightsStatuses,
		mediaRoundTypes,
		mediaShotTypes,
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
	const talentMap = new Map((data.talents || []).map((item: any) => [item.id, item]));
	const sponsorMap = new Map((data.sponsors || []).map((item: any) => [item.id, item]));

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
	let highlightPackages = $state(data.highlightPackages || []);
	let mediaCollections = $state(data.mediaCollections || []);
	let highlightPackageItems = $state(data.highlightPackageItems || []);
	let selectedPackageId = $state((data.highlightPackages || [])[0]?.id || '');
	let phase5Busy = $state(false);
	let phase5Error = $state('');
	let createPackageForm = $state({
		name: '',
		package_type: 'event_recap',
		export_target: 'social',
		create_collection: true
	});
	let packageItemDrafts = $state<Record<string, { clip_in_seconds: string; clip_out_seconds: string; usage_role: string }>>({});
	let searchQuery = $state('');
	let typeFilter = $state('all');
	let categoryFilter = $state('all');
	let statusFilter = $state('all');
	let seasonFilter = $state('all');
	let franchiseFilter = $state('all');
	let personFilter = $state('all');
	let teamFilter = $state('all');
	let sponsorFilter = $state('all');
	let roundTypeFilter = $state('all');
	let shotTypeFilter = $state('all');
	let momentTypeFilter = $state('all');

	function personLabel(id: string) {
		const person = talentMap.get(id);
		if (!person) return '';
		return person.fullName || person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim();
	}

	function sponsorLabel(id: string) {
		return sponsorMap.get(id)?.name || '';
	}

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
		if (personFilter !== 'all' && !(a.taxonomy?.people || []).some((row: any) => row.person === personFilter)) return false;
		if (teamFilter !== 'all' && !(a.taxonomy?.teams || []).some((row: any) => row.team === teamFilter)) return false;
		if (sponsorFilter !== 'all' && !(a.taxonomy?.sponsors || []).some((row: any) => row.sponsor === sponsorFilter)) return false;
		if (roundTypeFilter !== 'all' && a.taxonomy?.event?.round_type !== roundTypeFilter) return false;
		if (shotTypeFilter !== 'all' && a.taxonomy?.event?.shot_type !== shotTypeFilter) return false;
		if (momentTypeFilter !== 'all' && a.taxonomy?.event?.moment_type !== momentTypeFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			const haystack = [
				a.title,
				a.tags,
				a.notes,
				a.resolution,
				a.expand?.tournament?.name,
				a.expand?.special_event?.name,
				a.expand?.season?.name,
				...(a.taxonomy?.tags || []).map((tag: any) => tag.tag),
				...(a.taxonomy?.people || []).map((row: any) => personLabel(row.person)),
				...(a.taxonomy?.teams || []).map((row: any) => franchiseName(row.team)),
				...(a.taxonomy?.sponsors || []).map((row: any) => sponsorLabel(row.sponsor)),
				a.taxonomy?.event?.round_type,
				a.taxonomy?.event?.shot_type,
				a.taxonomy?.event?.moment_type
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

	let licensingMetrics = $derived(
		assets.reduce((acc: { totalDealFees: number; totalAttributedRevenue: number; licensedAssets: number }, asset: any) => {
			const lineItemFees = (asset.licensing?.lineItems || []).reduce(
				(sum: number, row: any) => sum + (Number(row.fee_amount) || 0),
				0
			);
			const attributedRevenue = (asset.licensing?.usageLogs || []).reduce(
				(sum: number, row: any) => sum + (Number(row.revenue_attributed) || 0),
				0
			);

			acc.totalDealFees += lineItemFees;
			acc.totalAttributedRevenue += attributedRevenue;
			if ((asset.licensing?.lineItems || []).length > 0 || (asset.licensing?.rightsProfiles || []).length > 0) {
				acc.licensedAssets += 1;
			}
			return acc;
		}, { totalDealFees: 0, totalAttributedRevenue: 0, licensedAssets: 0 })
	);

	let sponsorMetrics = $derived(
		assets.reduce((acc: { deliverables: number; delivered: number; approved: number; inProgress: number; overdue: number; appearances: number; recapPackages: number }, asset: any) => {
			const deliverables = asset.sponsorFulfillment?.deliverables || [];
			const appearances = asset.sponsorFulfillment?.appearances || [];
			const recapPackages = asset.sponsorFulfillment?.recapPackages || [];

			acc.deliverables += deliverables.length;
			acc.delivered += deliverables.filter((row: any) => row.sla_status === 'delivered').length;
			acc.approved += deliverables.filter((row: any) => row.status === 'approved').length;
			acc.inProgress += deliverables.filter((row: any) => row.sla_status === 'in_progress').length;
			acc.overdue += deliverables.filter((row: any) => row.sla_status === 'overdue').length;
			acc.appearances += appearances.length;
			acc.recapPackages += recapPackages.length;
			return acc;
		}, { deliverables: 0, delivered: 0, approved: 0, inProgress: 0, overdue: 0, appearances: 0, recapPackages: 0 })
	);

	let highlightMetrics = $derived(
		assets.reduce((acc: { packageItems: number; packages: number; approved: number; published: number }, asset: any) => {
			const items = asset.highlightPackaging?.items || [];
			const packages = asset.highlightPackaging?.packages || [];

			acc.packageItems += items.length;
			acc.packages += packages.length;
			acc.approved += packages.filter((row: any) => row.status === 'approved').length;
			acc.published += packages.filter((row: any) => row.status === 'published').length;
			return acc;
		}, { packageItems: 0, packages: 0, approved: 0, published: 0 })
	);

	let selectedPackage = $derived(highlightPackages.find((pkg: any) => pkg.id === selectedPackageId) || null);

	let selectedPackageItems = $derived(
		highlightPackageItems
			.filter((row: any) => row.highlight_package === selectedPackageId)
			.sort((a: any, b: any) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
	);

	let selectedPackageDurationSeconds = $derived(
		selectedPackageItems.reduce((sum: number, row: any) => {
			const start = Number(row.clip_in_seconds) || 0;
			const end = Number(row.clip_out_seconds) || 0;
			if (!end || end < start) return sum;
			return sum + (end - start);
		}, 0)
	);

	const highlightUsageRoleOptions = [
		{ value: 'opening', label: 'Opening' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'sponsor_callout', label: 'Sponsor Callout' },
		{ value: 'transition', label: 'Transition' },
		{ value: 'closing', label: 'Closing' },
		{ value: 'other', label: 'Other' }
	];

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

	function highlightItemAssetLabel(row: any) {
		const cached = row.assetRecord;
		if (cached?.title) return cached.title;
		const asset = assets.find((item: any) => item.id === row.asset);
		return asset?.title || row.asset;
	}

	function ensureDraftForItem(row: any) {
		if (packageItemDrafts[row.id]) return;
		packageItemDrafts = {
			...packageItemDrafts,
			[row.id]: {
				clip_in_seconds: row.clip_in_seconds != null ? String(row.clip_in_seconds) : '',
				clip_out_seconds: row.clip_out_seconds != null ? String(row.clip_out_seconds) : '',
				usage_role: row.usage_role || 'feature'
			}
		};
	}

	function updateDraftField(itemId: string, field: 'clip_in_seconds' | 'clip_out_seconds' | 'usage_role', value: string) {
		const existing = packageItemDrafts[itemId] || {
			clip_in_seconds: '',
			clip_out_seconds: '',
			usage_role: 'feature'
		};
		packageItemDrafts = {
			...packageItemDrafts,
			[itemId]: {
				...existing,
				[field]: value
			}
		};
	}

	function resetDraftForItem(row: any) {
		packageItemDrafts = {
			...packageItemDrafts,
			[row.id]: {
				clip_in_seconds: row.clip_in_seconds != null ? String(row.clip_in_seconds) : '',
				clip_out_seconds: row.clip_out_seconds != null ? String(row.clip_out_seconds) : '',
				usage_role: row.usage_role || 'feature'
			}
		};
	}

	function isDraftDirty(row: any) {
		const draft = packageItemDrafts[row.id];
		if (!draft) return false;
		const currentIn = row.clip_in_seconds != null ? String(row.clip_in_seconds) : '';
		const currentOut = row.clip_out_seconds != null ? String(row.clip_out_seconds) : '';
		const currentRole = row.usage_role || 'feature';
		return draft.clip_in_seconds !== currentIn || draft.clip_out_seconds !== currentOut || draft.usage_role !== currentRole;
	}

	async function createHighlightPackage() {
		if (!createPackageForm.name.trim()) {
			phase5Error = 'Package name is required.';
			return;
		}

		phase5Busy = true;
		phase5Error = '';

		try {
			const res = await fetch('/api/media/highlight-packages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: createPackageForm.name.trim(),
					package_type: createPackageForm.package_type,
					export_target: createPackageForm.export_target,
					create_collection: createPackageForm.create_collection,
					collection_name: `${createPackageForm.name.trim()} Collection`,
					collection_type: createPackageForm.package_type
				})
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to create package');
			}

			const payload = await res.json();
			highlightPackages = [payload.package, ...highlightPackages];
			if (payload.collection) {
				mediaCollections = [payload.collection, ...mediaCollections];
			}
			selectedPackageId = payload.package.id;
			createPackageForm = { ...createPackageForm, name: '' };
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to create package';
		} finally {
			phase5Busy = false;
		}
	}

	async function addAssetToSelectedPackage(asset: any) {
		if (!selectedPackageId) {
			phase5Error = 'Select or create a package first.';
			return;
		}

		phase5Busy = true;
		phase5Error = '';

		try {
			const res = await fetch('/api/media/highlight-packages/items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					highlight_package: selectedPackageId,
					asset: asset.id,
					usage_role: 'feature'
				})
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to add asset to package');
			}

			const item = await res.json();
			const exists = highlightPackageItems.some((row: any) => row.id === item.id);
			if (!exists) {
				highlightPackageItems = [...highlightPackageItems, { ...item, assetRecord: asset }];
			}
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to add asset';
		} finally {
			phase5Busy = false;
		}
	}

	async function removePackageItem(itemId: string) {
		phase5Busy = true;
		phase5Error = '';
		try {
			const res = await fetch(`/api/media/highlight-packages/items/${itemId}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to remove item');
			}
			highlightPackageItems = highlightPackageItems.filter((row: any) => row.id !== itemId);
			const nextDrafts = { ...packageItemDrafts };
			delete nextDrafts[itemId];
			packageItemDrafts = nextDrafts;
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to remove item';
		} finally {
			phase5Busy = false;
		}
	}

	async function savePackageItemInline(row: any) {
		const draft = packageItemDrafts[row.id];
		if (!draft) return;

		const clipIn = draft.clip_in_seconds.trim() === '' ? null : Number(draft.clip_in_seconds);
		const clipOut = draft.clip_out_seconds.trim() === '' ? null : Number(draft.clip_out_seconds);

		if (clipIn != null && (Number.isNaN(clipIn) || clipIn < 0)) {
			phase5Error = 'Clip in must be a non-negative number.';
			return;
		}
		if (clipOut != null && (Number.isNaN(clipOut) || clipOut < 0)) {
			phase5Error = 'Clip out must be a non-negative number.';
			return;
		}
		if (clipIn != null && clipOut != null && clipOut < clipIn) {
			phase5Error = 'Clip out must be greater than or equal to clip in.';
			return;
		}

		phase5Busy = true;
		phase5Error = '';

		try {
			const res = await fetch(`/api/media/highlight-packages/items/${row.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clip_in_seconds: clipIn,
					clip_out_seconds: clipOut,
					usage_role: draft.usage_role || 'feature'
				})
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to update clip fields');
			}

			const updated = await res.json();
			highlightPackageItems = highlightPackageItems.map((item: any) => (item.id === row.id ? { ...item, ...updated } : item));
			resetDraftForItem({ ...row, ...updated });
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to update clip fields';
		} finally {
			phase5Busy = false;
		}
	}

	async function movePackageItem(itemId: string, direction: -1 | 1) {
		const sorted = [...selectedPackageItems];
		const currentIndex = sorted.findIndex((row: any) => row.id === itemId);
		const targetIndex = currentIndex + direction;
		if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

		const current = sorted[currentIndex];
		const target = sorted[targetIndex];

		phase5Busy = true;
		phase5Error = '';

		try {
			await Promise.all([
				fetch(`/api/media/highlight-packages/items/${current.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: Number(target.sort_order) || 0 })
				}),
				fetch(`/api/media/highlight-packages/items/${target.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: Number(current.sort_order) || 0 })
				})
			]);

			highlightPackageItems = highlightPackageItems.map((row: any) => {
				if (row.id === current.id) return { ...row, sort_order: Number(target.sort_order) || 0 };
				if (row.id === target.id) return { ...row, sort_order: Number(current.sort_order) || 0 };
				return row;
			});
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to reorder item';
		} finally {
			phase5Busy = false;
		}
	}

	async function updatePackageStatus(status: string) {
		if (!selectedPackageId) return;
		phase5Busy = true;
		phase5Error = '';
		try {
			const res = await fetch(`/api/media/highlight-packages/${selectedPackageId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to update package status');
			}
			const updated = await res.json();
			highlightPackages = highlightPackages.map((pkg: any) => (pkg.id === updated.id ? updated : pkg));
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to update package';
		} finally {
			phase5Busy = false;
		}
	}

	async function exportSelectedPackageManifest() {
		if (!selectedPackageId) {
			phase5Error = 'Select a package to export.';
			return;
		}

		phase5Busy = true;
		phase5Error = '';
		try {
			const res = await fetch(`/api/media/highlight-packages/${selectedPackageId}/export`);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || 'Failed to export manifest');
			}

			const manifest = await res.json();
			const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = `${(selectedPackage?.name || 'highlight-package').replace(/\s+/g, '-').toLowerCase()}-manifest.json`;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);
		} catch (error) {
			phase5Error = error instanceof Error ? error.message : 'Failed to export manifest';
		} finally {
			phase5Busy = false;
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
				personFilter,
				teamFilter,
				sponsorFilter,
				roundTypeFilter,
				shotTypeFilter,
				momentTypeFilter,
				searchQuery
			},
			lookupCounts: {
				franchises: data.franchises?.length || 0,
				projects: data.projects?.length || 0,
				campaigns: data.campaigns?.length || 0,
				seasons: data.seasons?.length || 0,
				tournaments: data.tournaments?.length || 0,
				specialEvents: data.specialEvents?.length || 0,
				talents: data.talents?.length || 0,
				sponsors: data.sponsors?.length || 0
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
			<div class="flex flex-wrap gap-2 mt-2 text-[11px]">
				<span class="px-2 py-1 rounded-md border border-slate-700 bg-slate-900 text-slate-300">Licensed assets: {licensingMetrics.licensedAssets}</span>
				<span class="px-2 py-1 rounded-md border border-emerald-700/60 bg-emerald-900/20 text-emerald-300">Deal fees: ${licensingMetrics.totalDealFees.toLocaleString()}</span>
				<span class="px-2 py-1 rounded-md border border-cyan-700/60 bg-cyan-900/20 text-cyan-300">Attributed revenue: ${licensingMetrics.totalAttributedRevenue.toLocaleString()}</span>
				<span class="px-2 py-1 rounded-md border border-amber-700/60 bg-amber-900/20 text-amber-300">Sponsor deliverables: {sponsorMetrics.deliverables}</span>
				<span class="px-2 py-1 rounded-md border border-lime-700/60 bg-lime-900/20 text-lime-300">Delivered/Approved: {sponsorMetrics.delivered}/{sponsorMetrics.approved}</span>
				<span class="px-2 py-1 rounded-md border border-blue-700/60 bg-blue-900/20 text-blue-300">In Progress: {sponsorMetrics.inProgress}</span>
				<span class="px-2 py-1 rounded-md border border-red-700/60 bg-red-900/20 text-red-300">Overdue: {sponsorMetrics.overdue}</span>
				<span class="px-2 py-1 rounded-md border border-orange-700/60 bg-orange-900/20 text-orange-300">Appearances/Recaps: {sponsorMetrics.appearances}/{sponsorMetrics.recapPackages}</span>
				<span class="px-2 py-1 rounded-md border border-violet-700/60 bg-violet-900/20 text-violet-300">Phase 5 Packages: {highlightMetrics.packages}</span>
			</div>
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
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-3">
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

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
		<select bind:value={personFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All People</option>
			{#each data.talents || [] as person}
				<option value={person.id}>{personLabel(person.id)}</option>
			{/each}
		</select>
		<select bind:value={teamFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Teams</option>
			{#each data.franchises || [] as team}
				<option value={team.id}>{team.name}</option>
			{/each}
		</select>
		<select bind:value={sponsorFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Sponsors</option>
			{#each data.sponsors || [] as sponsor}
				<option value={sponsor.id}>{sponsor.name}</option>
			{/each}
		</select>
		<select bind:value={roundTypeFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Rounds</option>
			{#each mediaRoundTypes as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<select bind:value={shotTypeFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Shot Types</option>
			{#each mediaShotTypes as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<select bind:value={momentTypeFilter} class="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
			<option value="all">All Moments</option>
			{#each mediaMomentTypes as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
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

	<div class="mb-6 rounded-xl border border-violet-700/40 bg-violet-950/20 p-4 space-y-4">
		<div class="flex flex-col md:flex-row md:items-end gap-3">
			<div class="flex-1 space-y-1">
				<p class="text-sm font-semibold text-violet-200">Phase 5 Package Manager</p>
				<p class="text-xs text-violet-300/80">Build highlight packages, add assets, reorder clip queue, and export manifest JSON.</p>
			</div>
			{#if phase5Error}
				<p class="text-xs text-red-300">{phase5Error}</p>
			{/if}
		</div>

		<div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
			<div class="space-y-2">
				<label class="text-xs text-violet-200">Selected Package</label>
				<select bind:value={selectedPackageId} class="flex h-10 w-full rounded-md border border-violet-700/40 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
					<option value="">None</option>
					{#each highlightPackages as pkg}
						<option value={pkg.id}>{pkg.name}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<label class="text-xs text-violet-200">Package Status</label>
				<select
					value={selectedPackage?.status || 'draft'}
					disabled={!selectedPackageId || phase5Busy}
					onchange={(event) => updatePackageStatus((event.currentTarget as HTMLSelectElement).value)}
					class="flex h-10 w-full rounded-md border border-violet-700/40 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
				>
					{#each highlightPackageStatuses as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<label class="text-xs text-violet-200">Manifest Export</label>
				<Button type="button" onclick={exportSelectedPackageManifest} disabled={!selectedPackageId || phase5Busy} class="w-full bg-violet-700 hover:bg-violet-600 text-white disabled:opacity-60">
					<Download class="size-4 mr-2" />
					Export Manifest
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-1 xl:grid-cols-5 gap-3">
			<Input bind:value={createPackageForm.name} placeholder="New package name" class="xl:col-span-2 bg-slate-900 border-violet-700/40 text-white placeholder:text-slate-400" />
			<select bind:value={createPackageForm.package_type} class="flex h-10 w-full rounded-md border border-violet-700/40 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
				{#each highlightPackageTypes as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<select bind:value={createPackageForm.export_target} class="flex h-10 w-full rounded-md border border-violet-700/40 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
				{#each highlightExportTargets as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
			<Button type="button" onclick={createHighlightPackage} disabled={phase5Busy} class="bg-violet-700 hover:bg-violet-600 text-white disabled:opacity-60">
				<Plus class="size-4 mr-2" />
				Create
			</Button>
		</div>

		{#if selectedPackageId}
			<div class="rounded-lg border border-violet-700/30 bg-slate-900/70 p-3">
				<div class="flex items-center justify-between mb-2">
					<p class="text-xs text-violet-200">{selectedPackage?.name || 'Package'} queue</p>
					<p class="text-xs text-violet-300">{selectedPackageItems.length} items · {selectedPackageDurationSeconds}s clip span</p>
				</div>
				{#if selectedPackageItems.length === 0}
					<p class="text-xs text-slate-400">Use Add to Package on any asset card to build this queue.</p>
				{:else}
					<div class="space-y-2 max-h-56 overflow-y-auto pr-1">
						{#each selectedPackageItems as row, index (row.id)}
							{@const _ = ensureDraftForItem(row)}
							<div class="flex items-center justify-between rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 gap-2">
								<div class="min-w-0 flex-1">
									<p class="text-xs text-slate-100 truncate">{index + 1}. {highlightItemAssetLabel(row)}</p>
									<div class="grid grid-cols-1 md:grid-cols-3 gap-1.5 mt-1">
										<Input
											type="number"
											min="0"
											value={packageItemDrafts[row.id]?.clip_in_seconds || ''}
											oninput={(event) => updateDraftField(row.id, 'clip_in_seconds', (event.currentTarget as HTMLInputElement).value)}
											placeholder="Clip in"
											class="h-7 text-[11px] bg-slate-900 border-slate-700 text-white"
										/>
										<Input
											type="number"
											min="0"
											value={packageItemDrafts[row.id]?.clip_out_seconds || ''}
											oninput={(event) => updateDraftField(row.id, 'clip_out_seconds', (event.currentTarget as HTMLInputElement).value)}
											placeholder="Clip out"
											class="h-7 text-[11px] bg-slate-900 border-slate-700 text-white"
										/>
										<select
											value={packageItemDrafts[row.id]?.usage_role || 'feature'}
											onchange={(event) => updateDraftField(row.id, 'usage_role', (event.currentTarget as HTMLSelectElement).value)}
											class="h-7 rounded-md border border-slate-700 bg-slate-900 px-2 text-[11px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
										>
											{#each highlightUsageRoleOptions as option}
												<option value={option.value}>{option.label}</option>
											{/each}
										</select>
									</div>
								</div>
								<div class="flex items-center gap-1 shrink-0">
									<button type="button" class="p-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50" onclick={() => resetDraftForItem(row)} disabled={phase5Busy || !isDraftDirty(row)}>
										<RotateCcw class="size-3.5" />
									</button>
									<button type="button" class="p-1 rounded bg-violet-900/40 border border-violet-700/60 text-violet-200 hover:bg-violet-800/50 disabled:opacity-50" onclick={() => savePackageItemInline(row)} disabled={phase5Busy || !isDraftDirty(row)}>
										<Save class="size-3.5" />
									</button>
									<button type="button" class="p-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700" onclick={() => movePackageItem(row.id, -1)} disabled={phase5Busy || index === 0}>
										<ChevronUp class="size-3.5" />
									</button>
									<button type="button" class="p-1 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700" onclick={() => movePackageItem(row.id, 1)} disabled={phase5Busy || index === selectedPackageItems.length - 1}>
										<ChevronDown class="size-3.5" />
									</button>
									<button type="button" class="p-1 rounded bg-red-900/40 border border-red-700/50 text-red-200 hover:bg-red-800/50" onclick={() => removePackageItem(row.id)} disabled={phase5Busy}>
										<Trash2 class="size-3.5" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
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
							onclick={() => addAssetToSelectedPackage(asset)}
							class="p-2 rounded-full bg-violet-500/70 hover:bg-violet-500 text-white transition-colors"
							title="Add to selected package"
						>
							<Plus class="size-4" />
						</button>
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
						{#if asset.taxonomy?.people?.length || asset.taxonomy?.sponsors?.length || asset.taxonomy?.event?.moment_type}
							<p class="text-[10px] text-slate-400 mt-1 truncate">
								{[
									asset.taxonomy?.people?.length ? `${asset.taxonomy.people.length} people` : '',
									asset.taxonomy?.sponsors?.length ? `${asset.taxonomy.sponsors.length} sponsors` : '',
									labelFor(mediaMomentTypes, asset.taxonomy?.event?.moment_type)
								].filter(Boolean).join(' · ')}
							</p>
						{/if}
						{#if asset.tags}
							<p class="text-xs text-slate-500 mt-1 truncate">{asset.tags}</p>
						{/if}
						{#if asset.licensing?.lineItems?.length || asset.licensing?.usageLogs?.length}
							<p class="text-[10px] text-emerald-300 mt-1 truncate">
								{[
									asset.licensing?.lineItems?.length
										? `$${(asset.licensing.lineItems.reduce((sum: number, row: any) => sum + (Number(row.fee_amount) || 0), 0)).toLocaleString()} fees`
										: '',
									asset.licensing?.usageLogs?.length
										? `$${(asset.licensing.usageLogs.reduce((sum: number, row: any) => sum + (Number(row.revenue_attributed) || 0), 0)).toLocaleString()} revenue`
										: ''
								].filter(Boolean).join(' · ')}
							</p>
						{/if}
						{#if asset.sponsorFulfillment?.deliverables?.length || asset.sponsorFulfillment?.appearances?.length}
							<p class="text-[10px] text-amber-300 mt-1 truncate">
								{[
									asset.sponsorFulfillment?.deliverables?.length ? `${asset.sponsorFulfillment.deliverables.length} deliverables` : '',
									asset.sponsorFulfillment?.appearances?.length ? `${asset.sponsorFulfillment.appearances.length} appearances` : '',
									asset.sponsorFulfillment?.deliverables?.some((row: any) => row.sla_status === 'overdue') ? 'needs attention' : '',
									asset.sponsorFulfillment?.deliverables?.some((row: any) => row.status === 'delivered' || row.status === 'approved') ? 'proof ready' : ''
								].filter(Boolean).join(' · ')}
							</p>
						{/if}
						{#if asset.sponsorFulfillment?.deliverables?.length}
							<div class="flex flex-wrap gap-1 mt-1">
								{#if asset.sponsorFulfillment.deliverables.some((row: any) => row.sla_status === 'overdue')}
									<span class="px-1.5 py-0.5 rounded border border-red-700/60 bg-red-900/30 text-[10px] text-red-300">Overdue</span>
								{/if}
								{#if asset.sponsorFulfillment.deliverables.some((row: any) => row.sla_status === 'in_progress')}
									<span class="px-1.5 py-0.5 rounded border border-blue-700/60 bg-blue-900/30 text-[10px] text-blue-300">In Progress</span>
								{/if}
								{#if asset.sponsorFulfillment.deliverables.some((row: any) => row.status === 'approved')}
									<span class="px-1.5 py-0.5 rounded border border-lime-700/60 bg-lime-900/30 text-[10px] text-lime-300">Approved</span>
								{/if}
							</div>
						{/if}
						{#if asset.highlightPackaging?.items?.length}
							<p class="text-[10px] text-violet-300 mt-1 truncate">
								{asset.highlightPackaging.items.length} highlight item{asset.highlightPackaging.items.length !== 1 ? 's' : ''} in package queue
							</p>
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
	talents={data.talents}
	projects={data.projects}
	campaigns={data.campaigns}
	sponsors={data.sponsors}
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
		talents={data.talents}
		projects={data.projects}
		campaigns={data.campaigns}
		sponsors={data.sponsors}
		seasons={data.seasons}
		tournaments={data.tournaments}
		specialEvents={data.specialEvents}
		pbUrl={data.pbUrl}
		onUpdated={handleUpdated}
	/>
{/if}
