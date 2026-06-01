<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { invalidateAll } from '$app/navigation';
	import { Upload, Loader, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';

	function getAllLogoUrls(league: any, field: string): { url: string; filename: string; ext: string }[] {
		if (!league[field] || league[field].length === 0) return [];
		
		return league[field]
			.filter((f: string) => {
				const ext = f.toLowerCase().split('.').pop();
				return ['png', 'jpg', 'jpeg', 'svg'].includes(ext || '');
			})
			.map((filename: string) => ({
				url: `${pbUrl}/api/files/${league.collectionId}/${league.id}/${filename}`,
				filename,
				ext: filename.split('.').pop()?.toUpperCase() || ''
			}));
	}

	// Lightbox state
	let lightboxUrl = $state<string | null>(null);
	let lightboxAlt = $state('');

	function openLightbox(e: MouseEvent, url: string, alt: string) {
		e.preventDefault();
		e.stopPropagation();
		lightboxUrl = url;
		lightboxAlt = alt;
	}

	function closeLightbox() {
		lightboxUrl = null;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeLightbox();
	}

	// ── Logo upload ───────────────────────────────────────────────────────────
	// key = `${leagueId}-${field}`, value = 'uploading' | 'done' | 'error'
	let uploadState = $state<Record<string, 'uploading' | 'done' | 'error'>>({});
	let uploadError = $state<Record<string, string>>({});

	async function handleUpload(leagueId: string, field: string, input: HTMLInputElement) {
		const files = input.files;
		if (!files?.length) return;

		const key = `${leagueId}-${field}`;
		uploadState = { ...uploadState, [key]: 'uploading' };
		uploadError = { ...uploadError, [key]: '' };

		const form = new FormData();
		form.append('field', field);
		for (const file of Array.from(files)) {
			form.append('files', file);
		}

		try {
			const res = await fetch(`/api/league/${leagueId}/logos`, {
				method: 'POST',
				body: form
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.message ?? `Upload failed (${res.status})`);
			}
			uploadState = { ...uploadState, [key]: 'done' };
			input.value = '';
			await invalidateAll();
			// Reset done state after 3s
			setTimeout(() => {
				uploadState = { ...uploadState, [key]: undefined as any };
			}, 3000);
		} catch (e: any) {
			uploadState = { ...uploadState, [key]: 'error' };
			uploadError = { ...uploadError, [key]: e.message ?? 'Upload failed' };
		}
	}

	function triggerUpload(leagueId: string, field: string) {
		const input = document.getElementById(`upload-${leagueId}-${field}`) as HTMLInputElement;
		input?.click();
	}

	function formatCurrency(value: number | null | undefined): string {
		if (!value) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-600 text-white';
			case 'pending':
				return 'bg-yellow-600 text-white';
			case 'inactive':
				return 'bg-gray-600 text-white';
			case 'for_sale':
				return 'bg-blue-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white">League Management</h1>
		<p class="text-gray-400 mt-2">Manage league ownership, branding, and operations</p>
	</div>

	{#each data.leagues as league}
		<a href="/dashboard/league/{league.slug}" class="block mb-6">
			<div class="p-6 bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
				<div class="flex items-start justify-between mb-6">
					<div class="flex-1">
						<h3 class="text-2xl font-semibold text-white">{league.name}</h3>
						{#if league.tagline}
							<p class="text-sm text-gray-400 mt-1">{league.tagline}</p>
						{/if}
					</div>
					<Badge class={getStatusColor(league.status)}>
						{league.status}
					</Badge>
				</div>

				<!-- All Logos Grid -->
				<div class="space-y-6">
					{#each [
						{ field: 'logoMens',      label: "Men's Logos (Red-White-Blue)",    color: 'text-blue-400',  ring: 'hover:ring-blue-400',  btn: 'bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border-blue-800' },
						{ field: 'logoWomens',    label: "Women's Logos (Pink-White-Blue)", color: 'text-pink-400',  ring: 'hover:ring-pink-400',  btn: 'bg-pink-900/40 hover:bg-pink-800/60 text-pink-300 border-pink-800' },
						{ field: 'logoMonochrome',label: 'Monochrome Logos (Black-White)',  color: 'text-gray-400',  ring: 'hover:ring-gray-400',  btn: 'bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 border-slate-600' }
					] as section}
						{@const logos = getAllLogoUrls(league, section.field)}
						{@const uploadKey = `${league.id}-${section.field}`}
						<div>
							<!-- Section header with upload button -->
							<div class="flex items-center justify-between mb-3">
								<h4 class="text-sm font-medium {section.color}">{section.label}</h4>
								<div class="flex items-center gap-2">
									{#if uploadState[uploadKey] === 'uploading'}
										<span class="text-xs text-slate-400 flex items-center gap-1"><Loader class="size-3 animate-spin" /> Uploading…</span>
									{:else if uploadState[uploadKey] === 'done'}
										<span class="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 class="size-3" /> Uploaded</span>
									{:else if uploadState[uploadKey] === 'error'}
										<span class="text-xs text-red-400 flex items-center gap-1" title={uploadError[uploadKey]}><AlertCircle class="size-3" /> Failed</span>
									{/if}
									<!-- Hidden file input -->
									<input
										id="upload-{league.id}-{section.field}"
										type="file"
										accept="image/*,.svg,.pdf"
										multiple
										class="hidden"
										onchange={(e) => { e.stopPropagation(); handleUpload(league.id, section.field, e.currentTarget as HTMLInputElement); }}
									/>
									<button
										type="button"
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); triggerUpload(league.id, section.field); }}
										disabled={uploadState[uploadKey] === 'uploading'}
										class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 {section.btn}"
									>
										<Upload class="size-3" /> Upload
									</button>
								</div>
							</div>

							<!-- Logo grid -->
							{#if logos.length > 0}
								<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
									{#each logos as logo}
										<button
											type="button"
											onclick={(e) => openLightbox(e, logo.url, league.name + ' ' + section.label)}
											class="bg-slate-800 rounded-lg p-3 flex flex-col items-center cursor-zoom-in hover:ring-2 {section.ring} transition-all w-full border border-slate-700"
										>
											<div class="h-24 w-full flex items-center justify-center mb-2">
												<img src={logo.url} alt="{league.name} logo" class="max-h-full max-w-full object-contain" />
											</div>
											<span class="text-xs text-slate-400 font-medium">{logo.ext}</span>
										</button>
									{/each}
								</div>
							{:else}
								<div class="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-xs text-slate-500">
									No logos uploaded yet — use the Upload button to add files.
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- League Info -->
				<div class="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					{#if league.foundedYear}
						<div>
							<span class="text-gray-400 block">Founded</span>
							<span class="font-medium text-white">{league.foundedYear}</span>
						</div>
					{/if}

					{#if league.ownerName}
						<div>
							<span class="text-gray-400 block">Owner</span>
							<span class="font-medium text-white">{league.ownerName}</span>
						</div>
					{/if}

					{#if league.projectedRevenue}
						<div>
							<span class="text-gray-400 block">Projected Revenue</span>
							<span class="font-medium text-white">{formatCurrency(league.projectedRevenue)}</span>
						</div>
					{/if}

					{#if league.valuationCurrent}
						<div>
							<span class="text-gray-400 block">Valuation</span>
							<span class="font-medium text-white">{formatCurrency(league.valuationCurrent)}</span>
						</div>
					{/if}
				</div>
			</div>
		</a>
	{/each}

	{#if data.leagues.length === 0}
		<div class="py-12 text-center bg-slate-900 rounded-xl border border-slate-700">
			<p class="text-slate-400">No leagues found. Create your first league to get started.</p>
		</div>
	{/if}
</div>

<!-- Lightbox -->
<svelte:window onkeydown={onKeydown} />

{#if lightboxUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
		onclick={closeLightbox}
	>
		<div
			class="relative max-w-4xl max-h-[90vh] w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				onclick={closeLightbox}
				class="absolute -top-10 right-0 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1"
			>
				✕ Close
			</button>
			<div class="bg-slate-900 rounded-xl p-6 flex items-center justify-center min-h-64 border border-slate-700">
				<img
					src={lightboxUrl}
					alt={lightboxAlt}
					class="max-h-[75vh] max-w-full object-contain"
				/>
			</div>
			<p class="text-center text-white/60 text-sm mt-3">{lightboxAlt}</p>
		</div>
	</div>
{/if}
