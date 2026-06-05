<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import {
		Archive,
		Calendar,
		ExternalLink,
		FileText,
		Film,
		FolderArchive,
		HardDrive,
		Mic,
		Pencil,
		Shield,
		Tag,
		X
	} from 'lucide-svelte';
	import {
		isImageLikeAsset,
		labelFor,
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
		asset = null,
		pbUrl = 'http://127.0.0.1:8090',
		onEdit = (_asset: any) => {}
	} = $props();

	function fileUrl() {
		if (!asset?.file) return '';
		return `${pbUrl}/api/files/${asset.collectionId}/${asset.id}/${asset.file}`;
	}

	function thumbUrl() {
		const url = fileUrl();
		return url ? `${url}?thumb=800x800` : '';
	}

	function previewKind() {
		if (!asset) return 'document';
		if (isImageLikeAsset(asset)) return 'image';
		if (['video', 'broadcast_segment', 'social_clip', 'highlight', 'interview'].includes(asset.media_category)) return 'video';
		if (asset.media_category === 'audio') return 'audio';
		if (asset.media_category === 'archive_package') return 'archive';
		return 'document';
	}

	function formatDate(value: string | null | undefined) {
		if (!value) return 'Not set';
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
	}

	function formatBytes(value: number | string | null | undefined) {
		const amount = typeof value === 'string' ? Number(value) : value;
		if (!amount || Number.isNaN(amount)) return 'Not set';
		const units = ['B', 'KB', 'MB', 'GB'];
		let size = amount;
		let unitIndex = 0;
		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex += 1;
		}
		return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
	}

	function relationLabel(record: any) {
		return record?.name || record?.title || record?.year || 'Not set';
	}

	function personLabel(row: any) {
		const person = row?.personRecord;
		if (!person) return 'Unknown person';
		return person.fullName || person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown person';
	}
</script>

<Sheet.Root {open} onOpenChange={(next) => (open = next)}>
	<Sheet.Content side="right" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-950 text-white p-0 h-full border-l border-slate-800">
		{#if asset}
			<div class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-6 py-5 flex items-start justify-between gap-4">
				<div>
					<Sheet.Title class="text-xl text-white">{asset.title}</Sheet.Title>
					<Sheet.Description class="text-slate-400 mt-1">
						{labelFor(mediaCategories, asset.media_category || 'other')} · {labelFor(mediaAssetTypes, asset.asset_type)}
					</Sheet.Description>
				</div>
				<div class="flex items-center gap-2">
					<Button type="button" variant="outline" class="bg-slate-900 border-slate-700 text-white hover:bg-slate-800" onclick={() => onEdit(asset)}>
						<Pencil class="size-4 mr-2" />
						Edit
					</Button>
					<Button type="button" variant="outline" class="bg-slate-900 border-slate-700 text-white hover:bg-slate-800" onclick={() => (open = false)}>
						<X class="size-4" />
					</Button>
				</div>
			</div>

			<div class="p-6 space-y-6">
				<div class="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 min-h-72 flex items-center justify-center">
					{#if previewKind() === 'image'}
						<img src={thumbUrl()} alt={asset.title} class="w-full h-full object-contain" />
					{:else if previewKind() === 'video'}
						<div class="flex flex-col items-center gap-3 text-slate-300 py-14">
							<Film class="size-14" />
							<p class="text-sm uppercase tracking-[0.2em] text-slate-400">Video Asset</p>
						</div>
					{:else if previewKind() === 'audio'}
						<div class="flex flex-col items-center gap-3 text-slate-300 py-14">
							<Mic class="size-14" />
							<p class="text-sm uppercase tracking-[0.2em] text-slate-400">Audio Asset</p>
						</div>
					{:else if previewKind() === 'archive'}
						<div class="flex flex-col items-center gap-3 text-slate-300 py-14">
							<Archive class="size-14" />
							<p class="text-sm uppercase tracking-[0.2em] text-slate-400">Archive Package</p>
						</div>
					{:else}
						<div class="flex flex-col items-center gap-3 text-slate-300 py-14">
							<FileText class="size-14" />
							<p class="text-sm uppercase tracking-[0.2em] text-slate-400">Document Asset</p>
						</div>
					{/if}
				</div>

				<div class="flex flex-wrap gap-2">
					<span class="px-3 py-1 rounded-full text-xs border border-slate-700 bg-slate-900 text-slate-200">{labelFor(mediaStatuses, asset.status || 'uploaded')}</span>
					<span class="px-3 py-1 rounded-full text-xs border border-slate-700 bg-slate-900 text-slate-200">{labelFor(mediaStorageTiers, asset.storage_tier || 'hot')}</span>
					<span class="px-3 py-1 rounded-full text-xs border border-slate-700 bg-slate-900 text-slate-200">{labelFor(mediaUsageScopes, asset.usage_scope || 'internal')}</span>
					<span class="px-3 py-1 rounded-full text-xs border border-slate-700 bg-slate-900 text-slate-200">{labelFor(mediaRightsStatuses, asset.rights_status || 'owned')}</span>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
						<h3 class="text-sm font-semibold text-slate-100">Metadata</h3>
						<div class="space-y-2 text-sm">
							<div class="flex items-start gap-2"><Tag class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Asset Type</div><div>{labelFor(mediaAssetTypes, asset.asset_type)}</div></div></div>
							<div class="flex items-start gap-2"><FolderArchive class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Category</div><div>{labelFor(mediaCategories, asset.media_category || 'other')}</div></div></div>
							<div class="flex items-start gap-2"><HardDrive class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Source</div><div>{labelFor(mediaSourceTypes, asset.source_type || 'other')}</div></div></div>
							<div class="flex items-start gap-2"><Calendar class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Captured</div><div>{formatDate(asset.capture_date)}</div></div></div>
							<div class="flex items-start gap-2"><HardDrive class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">File Size</div><div>{formatBytes(asset.file_size_bytes)}</div></div></div>
							<div class="flex items-start gap-2"><Film class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Duration</div><div>{asset.duration_seconds ? `${asset.duration_seconds}s` : 'Not set'}</div></div></div>
							<div class="flex items-start gap-2"><FileText class="size-4 text-slate-500 mt-0.5" /><div><div class="text-slate-400">Resolution</div><div>{asset.resolution || 'Not set'}</div></div></div>
						</div>
					</div>

					<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
						<h3 class="text-sm font-semibold text-slate-100">Associations</h3>
						<div class="space-y-2 text-sm">
							<div><div class="text-slate-400">Franchise</div><div>{relationLabel(asset.expand?.franchise)}</div></div>
							<div><div class="text-slate-400">Project</div><div>{relationLabel(asset.expand?.project)}</div></div>
							<div><div class="text-slate-400">Campaign</div><div>{relationLabel(asset.expand?.campaign)}</div></div>
							<div><div class="text-slate-400">Season</div><div>{relationLabel(asset.expand?.season)}</div></div>
							<div><div class="text-slate-400">Tournament</div><div>{relationLabel(asset.expand?.tournament)}</div></div>
							<div><div class="text-slate-400">Special Event</div><div>{relationLabel(asset.expand?.special_event)}</div></div>
						</div>
					</div>
				</div>

				<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
					<h3 class="text-sm font-semibold text-slate-100 flex items-center gap-2"><Shield class="size-4 text-slate-400" /> Rights & Usage</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div><div class="text-slate-400">Workflow Status</div><div>{labelFor(mediaStatuses, asset.status || 'uploaded')}</div></div>
						<div><div class="text-slate-400">Usage Scope</div><div>{labelFor(mediaUsageScopes, asset.usage_scope || 'internal')}</div></div>
						<div><div class="text-slate-400">Rights Status</div><div>{labelFor(mediaRightsStatuses, asset.rights_status || 'owned')}</div></div>
					</div>
				</div>

				{#if asset.taxonomy?.tags?.length || asset.taxonomy?.people?.length || asset.taxonomy?.teams?.length || asset.taxonomy?.sponsors?.length || asset.taxonomy?.event}
					<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
						<h3 class="text-sm font-semibold text-slate-100">Structured Metadata</h3>
						{#if asset.taxonomy?.tags?.length}
							<div>
								<div class="text-slate-400 text-sm mb-1">Structured Tags</div>
								<p class="text-sm text-slate-200">{asset.taxonomy.tags.map((row: any) => row.tag).join(', ')}</p>
							</div>
						{/if}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<div class="text-slate-400">People</div>
								<div>{asset.taxonomy?.people?.length ? asset.taxonomy.people.map((row: any) => personLabel(row)).join(', ') : 'Not set'}</div>
							</div>
							<div>
								<div class="text-slate-400">Teams</div>
								<div>{asset.taxonomy?.teams?.length ? asset.taxonomy.teams.map((row: any) => relationLabel(asset.expand?.franchise && asset.expand.franchise.id === row.team ? asset.expand.franchise : { name: row.team })).join(', ') : 'Not set'}</div>
							</div>
							<div>
								<div class="text-slate-400">Sponsors</div>
								<div>{asset.taxonomy?.sponsors?.length ? asset.taxonomy.sponsors.map((row: any) => row.sponsorRecord?.name || row.sponsor).join(', ') : 'Not set'}</div>
							</div>
							<div>
								<div class="text-slate-400">Event Context</div>
								<div>
									{asset.taxonomy?.event
										? [
											labelFor(mediaRoundTypes, asset.taxonomy.event.round_type),
											labelFor(mediaShotTypes, asset.taxonomy.event.shot_type),
											labelFor(mediaMomentTypes, asset.taxonomy.event.moment_type),
											asset.taxonomy.event.hole_number ? `Hole ${asset.taxonomy.event.hole_number}` : ''
										].filter(Boolean).join(' · ') || 'Not set'
										: 'Not set'}
								</div>
							</div>
						</div>
					</div>
				{/if}

				{#if asset.tags || asset.notes}
					<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
						<h3 class="text-sm font-semibold text-slate-100">Context</h3>
						{#if asset.tags}
							<div>
								<div class="text-slate-400 text-sm mb-1">Tags</div>
								<p class="text-sm text-slate-200 whitespace-pre-wrap">{asset.tags}</p>
							</div>
						{/if}
						{#if asset.notes}
							<div>
								<div class="text-slate-400 text-sm mb-1">Notes</div>
								<div class="text-sm text-slate-200 whitespace-pre-wrap">{asset.notes}</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if asset.licensing?.rightsProfiles?.length || asset.licensing?.lineItems?.length || asset.licensing?.usageLogs?.length}
					<div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
						<h3 class="text-sm font-semibold text-slate-100">Rights & Licensing History</h3>
						{#if asset.licensing?.rightsProfiles?.length}
							<div>
								<div class="text-slate-400 text-sm mb-1">Rights Profiles</div>
								<div class="space-y-1 text-sm">
									{#each asset.licensing.rightsProfiles as row}
										<div class="text-slate-200">{row.rights_owner} · {row.status || 'active'}{#if row.territory} · {row.territory}{/if}</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if asset.licensing?.lineItems?.length}
							<div>
								<div class="text-slate-400 text-sm mb-1">License Deals</div>
								<div class="space-y-1 text-sm">
									{#each asset.licensing.lineItems as row}
										<div class="text-slate-200">{row.dealRecord?.name || 'Deal'}{#if row.fee_amount} · ${row.fee_amount}{/if}{#if row.usage_type} · {row.usage_type}{/if}</div>
									{/each}
								</div>
							</div>
						{/if}
						{#if asset.licensing?.usageLogs?.length}
							<div>
								<div class="text-slate-400 text-sm mb-1">Usage Logs</div>
								<div class="space-y-1 text-sm">
									{#each asset.licensing.usageLogs as row}
										<div class="text-slate-200">{row.channel || 'unknown channel'}{#if row.usage_date} · {formatDate(row.usage_date)}{/if}{#if row.revenue_attributed} · ${row.revenue_attributed}{/if}</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<div class="flex justify-between items-center pt-2">
					<div class="text-xs text-slate-500">Filename: {asset.file}</div>
					<a href={fileUrl()} target="_blank" rel="noopener noreferrer">
						<Button type="button" class="bg-blue-600 hover:bg-blue-700 text-white">
							<ExternalLink class="size-4 mr-2" />
							Open Original File
						</Button>
					</a>
				</div>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>