<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { league } = data;

	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';

	function getFileUrls(league: any, field: string): string[] {
		if (!league[field] || league[field].length === 0) return [];
		return league[field].map((filename: string) => 
			`${pbUrl}/api/files/${league.collectionId}/${league.id}/${filename}`
		);
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

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'pending':
				return 'bg-yellow-500';
			case 'inactive':
				return 'bg-gray-500';
			case 'for_sale':
				return 'bg-blue-500';
			default:
				return 'bg-gray-500';
		}
	}

	const mensLogos = getFileUrls(league, 'logoMens');
	const womensLogos = getFileUrls(league, 'logoWomens');
	const specSheets = getFileUrls(league, 'brandSpecSheet');
</script>

<div class="container mx-auto py-8">
	<!-- Header -->
	<div class="mb-8">
		<Button variant="ghost" href="/dashboard/league" class="mb-4">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Leagues
		</Button>
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold">{league.name}</h1>
				{#if league.tagline}
					<p class="text-muted-foreground mt-2">{league.tagline}</p>
				{/if}
			</div>
			<Badge class={getStatusColor(league.status)}>
				{league.status}
			</Badge>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Men's Logos -->
		{#if mensLogos.length > 0}
			<Card class="p-6">
				<h3 class="text-lg font-semibold mb-2">Men's Division Logos</h3>
				<p class="text-sm text-muted-foreground mb-4">{mensLogos.length} logo variant(s)</p>
				<div class="grid grid-cols-2 gap-4">
					{#each mensLogos as logoUrl}
						<div class="border rounded-lg p-4 bg-gray-50">
							<img src={logoUrl} alt="Men's Logo" class="w-full h-32 object-contain" />
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<!-- Women's Logos -->
		{#if womensLogos.length > 0}
			<Card class="p-6">
				<h3 class="text-lg font-semibold mb-2">Women's Division Logos</h3>
				<p class="text-sm text-muted-foreground mb-4">{womensLogos.length} logo variant(s)</p>
				<div class="grid grid-cols-2 gap-4">
					{#each womensLogos as logoUrl}
						<div class="border rounded-lg p-4 bg-gray-50">
							<img src={logoUrl} alt="Women's Logo" class="w-full h-32 object-contain" />
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<!-- League Information -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">League Information</h3>
			<div class="space-y-4">
				{#if league.description}
					<div>
						<h4 class="text-sm font-medium text-muted-foreground mb-1">Description</h4>
						<p class="text-sm">{league.description}</p>
					</div>
					<hr class="my-4" />
				{/if}

				{#if league.foundedYear}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Founded</span>
						<span class="text-sm font-medium">{league.foundedYear}</span>
					</div>
				{/if}

				{#if league.website}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Website</span>
						<a href={league.website} target="_blank" class="text-sm font-medium text-blue-600 hover:underline">
							{league.website}
						</a>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Financial Information -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">Financial Overview</h3>
			<div class="space-y-4">
				{#if league.projectedRevenue}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Projected Revenue</span>
						<span class="text-sm font-medium">{formatCurrency(league.projectedRevenue)}</span>
					</div>
				{/if}

				{#if league.valuationCurrent}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Current Valuation</span>
						<span class="text-sm font-medium">{formatCurrency(league.valuationCurrent)}</span>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Brand Spec Sheet -->
		{#if specSheets.length > 0}
			<Card class="p-6 lg:col-span-2">
				<h3 class="text-lg font-semibold mb-4">Brand Specification Sheet</h3>
				{#each specSheets as pdfUrl}
					<a
						href={pdfUrl}
						target="_blank"
						class="flex items-center gap-2 text-blue-600 hover:underline"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
						View Brand Specification Sheet (PDF)
					</a>
				{/each}
			</Card>
		{/if}
	</div>
</div>
