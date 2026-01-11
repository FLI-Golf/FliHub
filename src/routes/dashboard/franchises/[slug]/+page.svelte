<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { ArrowLeft, Download, ExternalLink } from 'lucide-svelte';
	
	export let data: PageData;
	
	const franchise = data.franchise;
	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';
	
	function getLogoUrls(field: string) {
		if (!franchise[field] || franchise[field].length === 0) return [];
		return franchise[field].map((filename: string) => ({
			filename,
			url: `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}`,
			thumb: `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}?thumb=400x400`
		}));
	}
	
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			available: 'bg-green-500',
			reserved: 'bg-yellow-500',
			in_negotiation: 'bg-blue-500',
			sold: 'bg-purple-500',
			active: 'bg-emerald-500',
			suspended: 'bg-gray-500',
			terminated: 'bg-red-500'
		};
		return colors[status] || 'bg-gray-500';
	}
	
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateStr: string) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	const logoSections = [
		{ field: 'logoFull', label: 'Full Logos', description: 'Main franchise logos' },
		{ field: 'logoMini', label: 'Mini Logos', description: 'Icons and small versions' },
		{ field: 'logoHorizontal', label: 'Horizontal Logos', description: 'Wide layout versions' },
		{ field: 'logoVertical', label: 'Vertical Logos', description: 'Stacked layout versions' },
		{ field: 'logoMonochrome', label: 'Monochrome Logos', description: 'Single color versions' },
		{ field: 'logoWordmark', label: 'Wordmark Logos', description: 'Text-only versions' }
	];
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/dashboard/franchises">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div class="flex-1">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold tracking-tight">{franchise.name}</h1>
				<Badge class="{getStatusColor(franchise.status)} text-white border-0">
					{franchise.status}
				</Badge>
			</div>
			<p class="text-muted-foreground italic">{franchise.tagline || 'No tagline'}</p>
		</div>
	</div>

	<!-- Hero Section with Colors -->
	<Card>
		<div 
			class="h-32 rounded-t-lg"
			style="background: linear-gradient(135deg, {franchise.primaryColor || '#3B82F6'} 0%, {franchise.secondaryColor || '#1E40AF'} 100%)"
		></div>
		<div class="p-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div>
					<div class="text-sm text-muted-foreground">Territory</div>
					<div class="text-lg font-semibold">{franchise.territory || 'Not set'}</div>
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Franchise Fee</div>
					<div class="text-lg font-semibold">{formatCurrency(franchise.franchiseFee || 0)}</div>
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Target Sale Date</div>
					<div class="text-lg font-semibold">{formatDate(franchise.targetSaleDate)}</div>
				</div>
			</div>
		</div>
	</Card>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Team Roster -->
		<Card>
			<div class="p-6 space-y-4">
				<h3 class="text-lg font-semibold">Team Roster</h3>
				<div>
					<div class="text-sm text-muted-foreground mb-1">Male Pro</div>
					<div class="font-semibold">
						{franchise.expand?.malePro?.name || 'Not assigned'}
					</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-1">Female Pro</div>
					<div class="font-semibold">
						{franchise.expand?.femalePro?.name || 'Not assigned'}
					</div>
				</div>
				{#if franchise.expand?.additionalPros && franchise.expand.additionalPros.length > 0}
					<Separator />
					<div>
						<div class="text-sm text-muted-foreground mb-2">Additional Pros</div>
						<div class="space-y-1">
							{#each franchise.expand.additionalPros as pro}
								<div class="text-sm">{pro.name}</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Financial Info -->
		<Card>
			<div class="p-6 space-y-4">
				<h3 class="text-lg font-semibold">Financial</h3>
				<div>
					<div class="text-sm text-muted-foreground mb-1">Royalty Rate</div>
					<div class="font-semibold">{franchise.royaltyPercentage || 0}%</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-1">Marketing Fee</div>
					<div class="font-semibold">{franchise.marketingFeePercentage || 0}%</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-1">Estimated Revenue</div>
					<div class="font-semibold">{formatCurrency(franchise.estimatedRevenue || 0)}</div>
				</div>
			</div>
		</Card>

		<!-- Owner Info -->
		<Card>
			<div class="p-6 space-y-4">
				<h3 class="text-lg font-semibold">Franchise Owner</h3>
				<div>
					<div class="text-sm text-muted-foreground mb-1">Name</div>
					<div class="font-semibold">{franchise.franchiseeName || 'Not assigned'}</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-1">Email</div>
					<div class="text-sm">{franchise.franchiseeEmail || 'Not set'}</div>
				</div>
				{#if franchise.franchiseePhone}
					<Separator />
					<div>
						<div class="text-sm text-muted-foreground mb-1">Phone</div>
						<div class="text-sm">{franchise.franchiseePhone}</div>
					</div>
				{/if}
			</div>
		</Card>
	</div>

	<!-- Brand Colors -->
	<Card>
		<div class="p-6">
			<h3 class="text-lg font-semibold mb-4">Brand Colors</h3>
			<div class="flex gap-4">
				<div class="flex-1">
					<div class="text-sm text-muted-foreground mb-2">Primary Color</div>
					<div class="flex items-center gap-3">
						<div 
							class="w-16 h-16 rounded-lg border-2 border-border"
							style="background-color: {franchise.primaryColor || '#3B82F6'}"
						></div>
						<div class="font-mono text-sm">{franchise.primaryColor || '#3B82F6'}</div>
					</div>
				</div>
				<div class="flex-1">
					<div class="text-sm text-muted-foreground mb-2">Secondary Color</div>
					<div class="flex items-center gap-3">
						<div 
							class="w-16 h-16 rounded-lg border-2 border-border"
							style="background-color: {franchise.secondaryColor || '#1E40AF'}"
						></div>
						<div class="font-mono text-sm">{franchise.secondaryColor || '#1E40AF'}</div>
					</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Logos Section -->
	{#each logoSections as section}
		{@const logos = getLogoUrls(section.field)}
		{#if logos.length > 0}
			<Card>
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold">{section.label}</h3>
							<p class="text-sm text-muted-foreground mt-1">{section.description}</p>
						</div>
						<Badge variant="secondary">{logos.length} file{logos.length !== 1 ? 's' : ''}</Badge>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
						{#each logos as logo}
							<div class="group relative">
								<div class="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
									<img 
										src={logo.thumb} 
										alt={logo.filename}
										class="w-full h-full object-contain p-2"
									/>
								</div>
								<div class="mt-2 space-y-1">
									<div class="text-xs text-muted-foreground truncate" title={logo.filename}>
										{logo.filename}
									</div>
									<div class="flex gap-1">
										<Button 
											variant="outline" 
											size="sm" 
											class="h-7 text-xs flex-1"
											href={logo.url}
											target="_blank"
										>
											<ExternalLink class="h-3 w-3 mr-1" />
											View
										</Button>
										<Button 
											variant="outline" 
											size="sm" 
											class="h-7 text-xs flex-1"
											href={logo.url}
											download
										>
											<Download class="h-3 w-3 mr-1" />
											Download
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		{/if}
	{/each}

	<!-- Brand Spec Sheets -->
	{#if franchise.brandSpecSheet && franchise.brandSpecSheet.length > 0}
		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold">Brand Spec Sheets</h3>
						<p class="text-sm text-muted-foreground mt-1">PDF brand guidelines and specifications</p>
					</div>
					<Badge variant="secondary">{franchise.brandSpecSheet.length} file{franchise.brandSpecSheet.length !== 1 ? 's' : ''}</Badge>
				</div>
				<div class="space-y-2">
					{#each franchise.brandSpecSheet as filename}
						{@const url = `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}`}
						<div class="flex items-center justify-between p-3 border rounded-lg">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded bg-red-100 dark:bg-red-900 flex items-center justify-center">
									<span class="text-xs font-bold text-red-600 dark:text-red-300">PDF</span>
								</div>
								<div>
									<div class="font-medium">{filename}</div>
									<div class="text-xs text-muted-foreground">Brand Guidelines</div>
								</div>
							</div>
							<div class="flex gap-2">
								<Button variant="outline" size="sm" href={url} target="_blank">
									<ExternalLink class="h-4 w-4 mr-2" />
									View
								</Button>
								<Button variant="outline" size="sm" href={url} download>
									<Download class="h-4 w-4 mr-2" />
									Download
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	{/if}

	<!-- Description -->
	{#if franchise.description}
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold mb-4">Description</h3>
				<div class="prose dark:prose-invert max-w-none">
					{@html franchise.description}
				</div>
			</div>
		</Card>
	{/if}
</div>
