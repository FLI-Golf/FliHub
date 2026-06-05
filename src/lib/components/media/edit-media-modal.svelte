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
		sponsorDeliverableStatuses,
		sponsorDeliverableTypes,
		sponsorLogoVisibilityLevels,
		sponsorRecapStatuses,
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
		rights_owner: '',
		rights_usage_type: 'broadcast',
		rights_territory: '',
		rights_channel: '',
		rights_exclusive: false,
		rights_start_date: '',
		rights_expiration_date: '',
		rights_restrictions: '',
		rights_contract_reference: '',
		rights_profile_status: 'active',
		deal_name: '',
		deal_licensee: '',
		deal_usage_type: 'broadcast',
		deal_territory: '',
		deal_channel: '',
		deal_exclusive: false,
		deal_start_date: '',
		deal_expiration_date: '',
		deal_fee_amount: '',
		deal_currency: 'USD',
		deal_payment_status: 'draft',
		deal_contract_reference: '',
		deal_notes: '',
		line_item_fee_amount: '',
		line_item_revenue_share_pct: '',
		line_item_restrictions: '',
		phase4_sponsor: '',
		deliverable_type: 'other',
		deliverable_status: 'pending',
		deliverable_due_date: '',
		deliverable_delivered_at: '',
		deliverable_visibility_score: '',
		deliverable_obligation_reference: '',
		deliverable_proof_note: '',
		recap_package_name: '',
		recap_status: 'draft',
		recap_delivered_at: '',
		recap_proof_url: '',
		recap_notes: '',
		appearance_logo_visibility: 'clear',
		appearance_placement: '',
		appearance_timestamp_seconds: '',
		appearance_screenshot_url: '',
		appearance_verified: false,
		appearance_notes: '',
		tags: '',
		notes: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');

	// Populate form when modal opens
	$effect(() => {
		if (open && asset) {
			const rightsProfile = asset.licensing?.rightsProfiles?.[0] || null;
			const lineItem = asset.licensing?.lineItems?.[0] || null;
			const deal = lineItem?.dealRecord || null;
			const deliverable = asset.sponsorFulfillment?.deliverables?.[0] || null;
			const recap = deliverable?.recapPackageRecord || asset.sponsorFulfillment?.recapPackages?.[0] || null;
			const appearance = asset.sponsorFulfillment?.appearances?.[0] || null;
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
				rights_owner: rightsProfile?.rights_owner || '',
				rights_usage_type: rightsProfile?.usage_type || 'broadcast',
				rights_territory: rightsProfile?.territory || '',
				rights_channel: rightsProfile?.channel || '',
				rights_exclusive: Boolean(rightsProfile?.exclusive),
				rights_start_date: rightsProfile?.start_date ? String(rightsProfile.start_date).slice(0, 10) : '',
				rights_expiration_date: rightsProfile?.expiration_date ? String(rightsProfile.expiration_date).slice(0, 10) : '',
				rights_restrictions: rightsProfile?.restrictions || '',
				rights_contract_reference: rightsProfile?.contract_reference || '',
				rights_profile_status: rightsProfile?.status || 'active',
				deal_name: deal?.name || '',
				deal_licensee: deal?.licensee || '',
				deal_usage_type: deal?.usage_type || 'broadcast',
				deal_territory: deal?.territory || '',
				deal_channel: deal?.channel || '',
				deal_exclusive: Boolean(deal?.exclusive),
				deal_start_date: deal?.start_date ? String(deal.start_date).slice(0, 10) : '',
				deal_expiration_date: deal?.expiration_date ? String(deal.expiration_date).slice(0, 10) : '',
				deal_fee_amount: deal?.fee_amount ? String(deal.fee_amount) : '',
				deal_currency: deal?.currency || 'USD',
				deal_payment_status: deal?.payment_status || 'draft',
				deal_contract_reference: deal?.contract_reference || '',
				deal_notes: deal?.notes || '',
				line_item_fee_amount: lineItem?.fee_amount ? String(lineItem.fee_amount) : '',
				line_item_revenue_share_pct: lineItem?.revenue_share_pct ? String(lineItem.revenue_share_pct) : '',
				line_item_restrictions: lineItem?.restrictions || '',
				phase4_sponsor: deliverable?.sponsor || appearance?.sponsor || '',
				deliverable_type: deliverable?.deliverable_type || 'other',
				deliverable_status: deliverable?.status || 'pending',
				deliverable_due_date: deliverable?.due_date ? String(deliverable.due_date).slice(0, 10) : '',
				deliverable_delivered_at: deliverable?.delivered_at ? String(deliverable.delivered_at).slice(0, 10) : '',
				deliverable_visibility_score: deliverable?.visibility_score ? String(deliverable.visibility_score) : '',
				deliverable_obligation_reference: deliverable?.obligation_reference || '',
				deliverable_proof_note: deliverable?.proof_note || '',
				recap_package_name: recap?.package_name || '',
				recap_status: recap?.status || 'draft',
				recap_delivered_at: recap?.delivered_at ? String(recap.delivered_at).slice(0, 10) : '',
				recap_proof_url: recap?.proof_url || '',
				recap_notes: recap?.notes || '',
				appearance_logo_visibility: appearance?.logo_visibility || 'clear',
				appearance_placement: appearance?.placement || '',
				appearance_timestamp_seconds: appearance?.timestamp_seconds ? String(appearance.timestamp_seconds) : '',
				appearance_screenshot_url: appearance?.screenshot_url || '',
				appearance_verified: Boolean(appearance?.verified),
				appearance_notes: appearance?.notes || '',
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
					},
					phase3Meta: {
						rights_owner: formData.rights_owner,
						rights_usage_type: formData.rights_usage_type,
						rights_territory: formData.rights_territory,
						rights_channel: formData.rights_channel,
						rights_exclusive: formData.rights_exclusive,
						rights_start_date: formData.rights_start_date,
						rights_expiration_date: formData.rights_expiration_date,
						rights_restrictions: formData.rights_restrictions,
						rights_contract_reference: formData.rights_contract_reference,
						rights_profile_status: formData.rights_profile_status,
						deal_name: formData.deal_name,
						deal_licensee: formData.deal_licensee,
						deal_usage_type: formData.deal_usage_type,
						deal_territory: formData.deal_territory,
						deal_channel: formData.deal_channel,
						deal_exclusive: formData.deal_exclusive,
						deal_start_date: formData.deal_start_date,
						deal_expiration_date: formData.deal_expiration_date,
						deal_fee_amount: formData.deal_fee_amount,
						deal_currency: formData.deal_currency,
						deal_payment_status: formData.deal_payment_status,
						deal_contract_reference: formData.deal_contract_reference,
						deal_notes: formData.deal_notes,
						line_item_fee_amount: formData.line_item_fee_amount,
						line_item_revenue_share_pct: formData.line_item_revenue_share_pct,
						line_item_restrictions: formData.line_item_restrictions
					},
					phase4Meta: {
						sponsor: formData.phase4_sponsor,
						deliverable_type: formData.deliverable_type,
						deliverable_status: formData.deliverable_status,
						deliverable_due_date: formData.deliverable_due_date,
						deliverable_delivered_at: formData.deliverable_delivered_at,
						deliverable_visibility_score: formData.deliverable_visibility_score,
						obligation_reference: formData.deliverable_obligation_reference,
						deliverable_proof_note: formData.deliverable_proof_note,
						recap_package_name: formData.recap_package_name,
						recap_status: formData.recap_status,
						recap_delivered_at: formData.recap_delivered_at,
						recap_proof_url: formData.recap_proof_url,
						recap_notes: formData.recap_notes,
						appearance_logo_visibility: formData.appearance_logo_visibility,
						appearance_placement: formData.appearance_placement,
						appearance_timestamp_seconds: formData.appearance_timestamp_seconds,
						appearance_screenshot_url: formData.appearance_screenshot_url,
						appearance_verified: formData.appearance_verified,
						appearance_notes: formData.appearance_notes
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

			<div class="rounded-lg border border-slate-700 p-4 space-y-4 bg-slate-900/40">
				<div>
					<p class="text-sm font-semibold text-slate-100">Phase 3 Rights & Licensing</p>
					<p class="text-xs text-slate-400">Create or update one primary rights profile and one license deal line item for this asset.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-rights-owner" class="text-slate-200">Rights Owner</Label>
						<Input id="edit-rights-owner" bind:value={formData.rights_owner} placeholder="e.g. FLI Golf League" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-usage-type" class="text-slate-200">Rights Usage Type</Label>
						<select id="edit-rights-usage-type" bind:value={formData.rights_usage_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="broadcast">Broadcast</option>
							<option value="commercial">Commercial</option>
							<option value="sponsor">Sponsor</option>
							<option value="social">Social</option>
							<option value="internal">Internal</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-status" class="text-slate-200">Rights Profile Status</Label>
						<select id="edit-rights-status" bind:value={formData.rights_profile_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="active">Active</option>
							<option value="pending">Pending</option>
							<option value="expired">Expired</option>
							<option value="restricted">Restricted</option>
							<option value="disputed">Disputed</option>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-territory" class="text-slate-200">Territory</Label>
						<Input id="edit-rights-territory" bind:value={formData.rights_territory} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-channel" class="text-slate-200">Channel</Label>
						<Input id="edit-rights-channel" bind:value={formData.rights_channel} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-start" class="text-slate-200">Rights Start Date</Label>
						<Input id="edit-rights-start" type="date" bind:value={formData.rights_start_date} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-rights-end" class="text-slate-200">Rights Expiration Date</Label>
						<Input id="edit-rights-end" type="date" bind:value={formData.rights_expiration_date} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-rights-contract" class="text-slate-200">Rights Contract Reference</Label>
						<Input id="edit-rights-contract" bind:value={formData.rights_contract_reference} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="md:col-span-2 flex items-center gap-2">
						<input id="edit-rights-exclusive" type="checkbox" bind:checked={formData.rights_exclusive} class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
						<Label for="edit-rights-exclusive" class="text-slate-200">Exclusive Rights</Label>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-rights-restrictions" class="text-slate-200">Rights Restrictions</Label>
						<textarea id="edit-rights-restrictions" bind:value={formData.rights_restrictions} rows="2" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
					</div>

					<div class="md:col-span-2 border-t border-slate-700 pt-4">
						<p class="text-sm font-semibold text-slate-100">License Deal & Line Item</p>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-deal-name" class="text-slate-200">Deal Name</Label>
						<Input id="edit-deal-name" bind:value={formData.deal_name} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-deal-licensee" class="text-slate-200">Licensee</Label>
						<Input id="edit-deal-licensee" bind:value={formData.deal_licensee} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-usage-type" class="text-slate-200">Deal Usage Type</Label>
						<select id="edit-deal-usage-type" bind:value={formData.deal_usage_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="broadcast">Broadcast</option>
							<option value="streaming">Streaming</option>
							<option value="social">Social</option>
							<option value="sponsor">Sponsor</option>
							<option value="commercial">Commercial</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-payment-status" class="text-slate-200">Payment Status</Label>
						<select id="edit-deal-payment-status" bind:value={formData.deal_payment_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="draft">Draft</option>
							<option value="invoiced">Invoiced</option>
							<option value="paid">Paid</option>
							<option value="past_due">Past Due</option>
							<option value="void">Void</option>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-fee" class="text-slate-200">Deal Fee Amount</Label>
						<Input id="edit-deal-fee" type="number" min="0" bind:value={formData.deal_fee_amount} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-line-item-fee" class="text-slate-200">Line Item Fee Amount</Label>
						<Input id="edit-line-item-fee" type="number" min="0" bind:value={formData.line_item_fee_amount} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-line-item-share" class="text-slate-200">Revenue Share %</Label>
						<Input id="edit-line-item-share" type="number" min="0" max="100" bind:value={formData.line_item_revenue_share_pct} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-currency" class="text-slate-200">Currency</Label>
						<Input id="edit-deal-currency" bind:value={formData.deal_currency} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-territory" class="text-slate-200">Deal Territory</Label>
						<Input id="edit-deal-territory" bind:value={formData.deal_territory} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-channel" class="text-slate-200">Deal Channel</Label>
						<Input id="edit-deal-channel" bind:value={formData.deal_channel} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-start" class="text-slate-200">Deal Start Date</Label>
						<Input id="edit-deal-start" type="date" bind:value={formData.deal_start_date} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deal-end" class="text-slate-200">Deal Expiration Date</Label>
						<Input id="edit-deal-end" type="date" bind:value={formData.deal_expiration_date} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="md:col-span-2 flex items-center gap-2">
						<input id="edit-deal-exclusive" type="checkbox" bind:checked={formData.deal_exclusive} class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
						<Label for="edit-deal-exclusive" class="text-slate-200">Deal Exclusive</Label>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-deal-contract-ref" class="text-slate-200">Deal Contract Reference</Label>
						<Input id="edit-deal-contract-ref" bind:value={formData.deal_contract_reference} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-line-item-restrictions" class="text-slate-200">Line Item Restrictions</Label>
						<textarea id="edit-line-item-restrictions" bind:value={formData.line_item_restrictions} rows="2" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
					</div>
				</div>
			</div>

			<div class="rounded-lg border border-slate-700 p-4 space-y-4 bg-slate-900/40">
				<div>
					<p class="text-sm font-semibold text-slate-100">Phase 4 Sponsor Fulfillment</p>
					<p class="text-xs text-slate-400">Track sponsor deliverables, proof appearances, and recap package status.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-phase4-sponsor" class="text-slate-200">Sponsor</Label>
						<select id="edit-phase4-sponsor" bind:value={formData.phase4_sponsor} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							<option value="">None</option>
							{#each sponsors as sponsor}
								<option value={sponsor.id}>{sponsor.name}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-type" class="text-slate-200">Deliverable Type</Label>
						<select id="edit-deliverable-type" bind:value={formData.deliverable_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each sponsorDeliverableTypes as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-status" class="text-slate-200">Deliverable Status</Label>
						<select id="edit-deliverable-status" bind:value={formData.deliverable_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each sponsorDeliverableStatuses as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-due-date" class="text-slate-200">Due Date</Label>
						<Input id="edit-deliverable-due-date" type="date" bind:value={formData.deliverable_due_date} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-delivered-at" class="text-slate-200">Delivered At</Label>
						<Input id="edit-deliverable-delivered-at" type="date" bind:value={formData.deliverable_delivered_at} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-score" class="text-slate-200">Visibility Score (0-100)</Label>
						<Input id="edit-deliverable-score" type="number" min="0" max="100" bind:value={formData.deliverable_visibility_score} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-deliverable-obligation" class="text-slate-200">Obligation Reference</Label>
						<Input id="edit-deliverable-obligation" bind:value={formData.deliverable_obligation_reference} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-deliverable-proof-note" class="text-slate-200">Deliverable Proof Note</Label>
						<textarea id="edit-deliverable-proof-note" bind:value={formData.deliverable_proof_note} rows="2" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
					</div>
					<div class="md:col-span-2 border-t border-slate-700 pt-4">
						<p class="text-sm font-semibold text-slate-100">Recap Package</p>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-recap-package-name" class="text-slate-200">Package Name</Label>
						<Input id="edit-recap-package-name" bind:value={formData.recap_package_name} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-recap-status" class="text-slate-200">Recap Status</Label>
						<select id="edit-recap-status" bind:value={formData.recap_status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each sponsorRecapStatuses as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-recap-delivered-at" class="text-slate-200">Recap Delivered At</Label>
						<Input id="edit-recap-delivered-at" type="date" bind:value={formData.recap_delivered_at} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-recap-proof-url" class="text-slate-200">Recap Proof URL</Label>
						<Input id="edit-recap-proof-url" type="url" bind:value={formData.recap_proof_url} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-recap-notes" class="text-slate-200">Recap Notes</Label>
						<textarea id="edit-recap-notes" bind:value={formData.recap_notes} rows="2" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
					</div>
					<div class="md:col-span-2 border-t border-slate-700 pt-4">
						<p class="text-sm font-semibold text-slate-100">Appearance Proof</p>
					</div>
					<div class="space-y-2">
						<Label for="edit-appearance-visibility" class="text-slate-200">Logo Visibility</Label>
						<select id="edit-appearance-visibility" bind:value={formData.appearance_logo_visibility} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
							{#each sponsorLogoVisibilityLevels as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-2">
						<Label for="edit-appearance-placement" class="text-slate-200">Placement</Label>
						<Input id="edit-appearance-placement" bind:value={formData.appearance_placement} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-appearance-seconds" class="text-slate-200">Timestamp (seconds)</Label>
						<Input id="edit-appearance-seconds" type="number" min="0" bind:value={formData.appearance_timestamp_seconds} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="space-y-2">
						<Label for="edit-appearance-screenshot" class="text-slate-200">Screenshot URL</Label>
						<Input id="edit-appearance-screenshot" type="url" bind:value={formData.appearance_screenshot_url} class="bg-slate-800 border-slate-700 text-white" />
					</div>
					<div class="md:col-span-2 flex items-center gap-2">
						<input id="edit-appearance-verified" type="checkbox" bind:checked={formData.appearance_verified} class="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
						<Label for="edit-appearance-verified" class="text-slate-200">Appearance Verified</Label>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label for="edit-appearance-notes" class="text-slate-200">Appearance Notes</Label>
						<textarea id="edit-appearance-notes" bind:value={formData.appearance_notes} rows="2" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"></textarea>
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
