<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Badge } from '$lib/components/ui/badge';
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
			<div class="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600">
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
					<!-- Men's Logos (Red-White-Blue) -->
					{#if league.logoMens?.length > 0}
						<div>
							<h4 class="text-sm font-medium text-blue-400 mb-3">Men's Logos (Red-White-Blue)</h4>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each getAllLogoUrls(league, 'logoMens') as logo}
									<button
										type="button"
										onclick={(e) => openLightbox(e, logo.url, league.name + " Men's Logo")}
										class="bg-white rounded-lg p-3 flex flex-col items-center cursor-zoom-in hover:ring-2 hover:ring-blue-400 transition-all w-full"
									>
										<div class="h-24 w-full flex items-center justify-center mb-2">
											<img
												src={logo.url}
												alt="{league.name} Men's Logo"
												class="max-h-full max-w-full object-contain"
											/>
										</div>
										<span class="text-xs text-gray-500 font-medium">{logo.ext}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Women's Logos (Pink-White-Blue) -->
					{#if league.logoWomens?.length > 0}
						<div>
							<h4 class="text-sm font-medium text-pink-400 mb-3">Women's Logos (Pink-White-Blue)</h4>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each getAllLogoUrls(league, 'logoWomens') as logo}
									<button
										type="button"
										onclick={(e) => openLightbox(e, logo.url, league.name + " Women's Logo")}
										class="bg-white rounded-lg p-3 flex flex-col items-center cursor-zoom-in hover:ring-2 hover:ring-pink-400 transition-all w-full"
									>
										<div class="h-24 w-full flex items-center justify-center mb-2">
											<img
												src={logo.url}
												alt="{league.name} Women's Logo"
												class="max-h-full max-w-full object-contain"
											/>
										</div>
										<span class="text-xs text-gray-500 font-medium">{logo.ext}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Monochrome Logos (Black-White) -->
					{#if league.logoMonochrome?.length > 0}
						<div>
							<h4 class="text-sm font-medium text-gray-400 mb-3">Monochrome Logos (Black-White)</h4>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
								{#each getAllLogoUrls(league, 'logoMonochrome') as logo}
									<button
										type="button"
										onclick={(e) => openLightbox(e, logo.url, league.name + " Monochrome Logo")}
										class="bg-white rounded-lg p-3 flex flex-col items-center cursor-zoom-in hover:ring-2 hover:ring-gray-400 transition-all w-full"
									>
										<div class="h-24 w-full flex items-center justify-center mb-2">
											<img
												src={logo.url}
												alt="{league.name} Monochrome Logo"
												class="max-h-full max-w-full object-contain"
											/>
										</div>
										<span class="text-xs text-gray-500 font-medium">{logo.ext}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- League Info -->
				<div class="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
		<div class="py-12 text-center bg-gray-800 rounded-lg border border-gray-700">
			<p class="text-gray-400">No leagues found. Create your first league to get started.</p>
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
			<div class="bg-white rounded-xl p-6 flex items-center justify-center min-h-64">
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
