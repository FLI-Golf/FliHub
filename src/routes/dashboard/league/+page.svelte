<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

	export let data: PageData;

	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';

	function getLogoUrl(league: any, field: string): string | null {
		if (!league[field] || league[field].length === 0) return null;
		const filename = league[field][0];
		return `${pbUrl}/api/files/${league.collectionId}/${league.id}/${filename}`;
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
</script>

<div class="container mx-auto py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">League Management</h1>
		<p class="text-muted-foreground mt-2">Manage league ownership, branding, and operations</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each data.leagues as league}
			<a href="/dashboard/league/{league.slug}" class="block transition-transform hover:scale-105">
				<Card class="h-full">
					<CardHeader>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<CardTitle class="text-xl">{league.name}</CardTitle>
								{#if league.tagline}
									<CardDescription class="mt-1">{league.tagline}</CardDescription>
								{/if}
							</div>
							<Badge class={getStatusColor(league.status)}>
								{league.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<!-- Logo Preview -->
						<div class="mb-4 flex gap-4">
							{#if getLogoUrl(league, 'logoMens')}
								<div class="flex-1">
									<p class="text-xs text-muted-foreground mb-1">Men's</p>
									<img
										src={getLogoUrl(league, 'logoMens')}
										alt="{league.name} Men's Logo"
										class="h-20 w-full object-contain bg-gray-50 rounded p-2"
									/>
								</div>
							{/if}
							{#if getLogoUrl(league, 'logoWomens')}
								<div class="flex-1">
									<p class="text-xs text-muted-foreground mb-1">Women's</p>
									<img
										src={getLogoUrl(league, 'logoWomens')}
										alt="{league.name} Women's Logo"
										class="h-20 w-full object-contain bg-gray-50 rounded p-2"
									/>
								</div>
							{/if}
						</div>

						<!-- League Info -->
						<div class="space-y-2 text-sm">
							{#if league.foundedYear}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Founded:</span>
									<span class="font-medium">{league.foundedYear}</span>
								</div>
							{/if}

							{#if league.ownerName}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Owner:</span>
									<span class="font-medium">{league.ownerName}</span>
								</div>
							{/if}

							{#if league.projectedRevenue}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Projected Revenue:</span>
									<span class="font-medium">{formatCurrency(league.projectedRevenue)}</span>
								</div>
							{/if}

							{#if league.valuationCurrent}
								<div class="flex justify-between">
									<span class="text-muted-foreground">Valuation:</span>
									<span class="font-medium">{formatCurrency(league.valuationCurrent)}</span>
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}
	</div>

	{#if data.leagues.length === 0}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-muted-foreground">No leagues found. Create your first league to get started.</p>
			</CardContent>
		</Card>
	{/if}
</div>
