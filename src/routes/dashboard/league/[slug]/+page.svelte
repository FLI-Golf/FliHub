<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
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
	const horizontalLogos = getFileUrls(league, 'logoHorizontal');
	const verticalLogos = getFileUrls(league, 'logoVertical');
	const monochromeLogos = getFileUrls(league, 'logoMonochrome');
	const wordmarkLogos = getFileUrls(league, 'logoWordmark');
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
		<!-- Gender-Specific Logos -->
		{#if mensLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Men's Division Logos</CardTitle>
					<CardDescription>{mensLogos.length} logo variant(s)</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each mensLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Men's Logo" class="w-full h-32 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if womensLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Women's Division Logos</CardTitle>
					<CardDescription>{womensLogos.length} logo variant(s)</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each womensLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Women's Logo" class="w-full h-32 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Additional Logo Variations -->
		{#if horizontalLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Horizontal Logos</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each horizontalLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Horizontal Logo" class="w-full h-24 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if verticalLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Vertical Logos</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each verticalLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Vertical Logo" class="w-full h-32 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if monochromeLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Monochrome Logos</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each monochromeLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Monochrome Logo" class="w-full h-24 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if wordmarkLogos.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Wordmark Logos</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-4">
						{#each wordmarkLogos as logoUrl}
							<div class="border rounded-lg p-4 bg-gray-50">
								<img src={logoUrl} alt="Wordmark Logo" class="w-full h-24 object-contain" />
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- League Information -->
		<Card>
			<CardHeader>
				<CardTitle>League Information</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if league.description}
					<div>
						<h4 class="text-sm font-medium text-muted-foreground mb-1">Description</h4>
						<p class="text-sm">{league.description}</p>
					</div>
					<Separator />
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
			</CardContent>
		</Card>

		<!-- Financial Information -->
		<Card>
			<CardHeader>
				<CardTitle>Financial Overview</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if league.purchasePrice}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Purchase Price</span>
						<span class="text-sm font-medium">{formatCurrency(league.purchasePrice)}</span>
					</div>
				{/if}

				{#if league.purchaseDate}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Purchase Date</span>
						<span class="text-sm font-medium">{formatDate(league.purchaseDate)}</span>
					</div>
				{/if}

				{#if league.valuationCurrent}
					<Separator />
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Current Valuation</span>
						<span class="text-sm font-medium">{formatCurrency(league.valuationCurrent)}</span>
					</div>
				{/if}

				{#if league.valuationDate}
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Valuation Date</span>
						<span class="text-sm font-medium">{formatDate(league.valuationDate)}</span>
					</div>
				{/if}

				{#if league.projectedRevenue}
					<Separator />
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Projected Revenue</span>
						<span class="text-sm font-medium">{formatCurrency(league.projectedRevenue)}</span>
					</div>
				{/if}

				{#if league.revenueYear1 || league.revenueYear2 || league.revenueYear3}
					<Separator />
					<div class="space-y-2">
						<h4 class="text-sm font-medium">Historical Revenue</h4>
						{#if league.revenueYear1}
							<div class="flex justify-between">
								<span class="text-sm text-muted-foreground">Year 1</span>
								<span class="text-sm font-medium">{formatCurrency(league.revenueYear1)}</span>
							</div>
						{/if}
						{#if league.revenueYear2}
							<div class="flex justify-between">
								<span class="text-sm text-muted-foreground">Year 2</span>
								<span class="text-sm font-medium">{formatCurrency(league.revenueYear2)}</span>
							</div>
						{/if}
						{#if league.revenueYear3}
							<div class="flex justify-between">
								<span class="text-sm text-muted-foreground">Year 3</span>
								<span class="text-sm font-medium">{formatCurrency(league.revenueYear3)}</span>
							</div>
						{/if}
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Ownership Information -->
		{#if league.ownerName || league.ownerEmail || league.ownerPhone}
			<Card>
				<CardHeader>
					<CardTitle>Ownership</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if league.ownerName}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Owner Name</span>
							<span class="text-sm font-medium">{league.ownerName}</span>
						</div>
					{/if}

					{#if league.ownerEmail}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Email</span>
							<a href="mailto:{league.ownerEmail}" class="text-sm font-medium text-blue-600 hover:underline">
								{league.ownerEmail}
							</a>
						</div>
					{/if}

					{#if league.ownerPhone}
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Phone</span>
							<span class="text-sm font-medium">{league.ownerPhone}</span>
						</div>
					{/if}

					{#if league.legalEntity}
						<Separator />
						<div class="flex justify-between">
							<span class="text-sm text-muted-foreground">Legal Entity</span>
							<span class="text-sm font-medium">{league.legalEntity}</span>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<!-- Brand Colors -->
		{#if league.primaryColor || league.secondaryColor || league.accentColor}
			<Card>
				<CardHeader>
					<CardTitle>Brand Colors</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex gap-4">
						{#if league.primaryColor}
							<div class="flex-1">
								<div class="h-20 rounded border" style="background-color: {league.primaryColor}"></div>
								<p class="text-xs text-center mt-2 text-muted-foreground">Primary</p>
								<p class="text-xs text-center font-mono">{league.primaryColor}</p>
							</div>
						{/if}
						{#if league.secondaryColor}
							<div class="flex-1">
								<div class="h-20 rounded border" style="background-color: {league.secondaryColor}"></div>
								<p class="text-xs text-center mt-2 text-muted-foreground">Secondary</p>
								<p class="text-xs text-center font-mono">{league.secondaryColor}</p>
							</div>
						{/if}
						{#if league.accentColor}
							<div class="flex-1">
								<div class="h-20 rounded border" style="background-color: {league.accentColor}"></div>
								<p class="text-xs text-center mt-2 text-muted-foreground">Accent</p>
								<p class="text-xs text-center font-mono">{league.accentColor}</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Brand Spec Sheet -->
		{#if specSheets.length > 0}
			<Card class="lg:col-span-2">
				<CardHeader>
					<CardTitle>Brand Specification Sheet</CardTitle>
				</CardHeader>
				<CardContent>
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
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
