<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	
	export let data: PageData;
	
	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';
	
	function getLogoUrl(franchise: any) {
		if (franchise.logoMini && franchise.logoMini.length > 0) {
			return `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${franchise.logoMini[0]}?thumb=200x200`;
		}
		if (franchise.logoFull && franchise.logoFull.length > 0) {
			return `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${franchise.logoFull[0]}?thumb=200x200`;
		}
		return null;
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
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Franchises</h1>
			<p class="text-muted-foreground">Manage FLI Golf franchise teams</p>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-sm text-muted-foreground">
				{data.franchises.length} franchise{data.franchises.length !== 1 ? 's' : ''}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each data.franchises as franchise}
			<a href="/dashboard/franchises/{franchise.slug}" class="block group">
				<Card class="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
					<div class="relative">
						<!-- Logo/Header Section -->
						<div 
							class="h-32 flex items-center justify-center relative overflow-hidden"
							style="background: linear-gradient(135deg, {franchise.primaryColor || '#3B82F6'} 0%, {franchise.secondaryColor || '#1E40AF'} 100%)"
						>
							{#if getLogoUrl(franchise)}
								<img 
									src={getLogoUrl(franchise)} 
									alt={franchise.name}
									class="h-20 w-20 object-contain drop-shadow-lg"
								/>
							{:else}
								<div class="text-white text-4xl font-bold">
									{franchise.name.substring(0, 2)}
								</div>
							{/if}
						</div>
						
						<!-- Status Badge -->
						<div class="absolute top-2 right-2">
							<Badge class="{getStatusColor(franchise.status)} text-white border-0">
								{franchise.status}
							</Badge>
						</div>
					</div>
					
					<div class="p-4 space-y-3">
						<!-- Franchise Name -->
						<div>
							<h3 class="font-bold text-lg group-hover:text-primary transition-colors">
								{franchise.name}
							</h3>
							<p class="text-sm text-muted-foreground italic">
								{franchise.tagline || 'No tagline'}
							</p>
						</div>
						
						<!-- Territory -->
						<div class="text-sm text-muted-foreground">
							📍 {franchise.territory || 'No territory'}
						</div>
						
						<!-- Team -->
						<div class="space-y-1 text-sm">
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground">Male:</span>
								<span class="font-medium">
									{franchise.expand?.malePro?.name || 'TBD'}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-muted-foreground">Female:</span>
								<span class="font-medium">
									{franchise.expand?.femalePro?.name || 'TBD'}
								</span>
							</div>
						</div>
						
						<!-- Franchise Value -->
						<div class="pt-2 border-t space-y-1">
							<div class="text-xs text-muted-foreground">Franchise Value</div>
							<div class="text-xl font-bold" style="color: {franchise.primaryColor || '#3B82F6'}">
								{formatCurrency(franchise.netFranchiseValue || franchise.franchiseFee || 0)}
							</div>
							{#if franchise.sponsorshipDiscount && franchise.sponsorshipDiscount > 0}
								<div class="text-xs text-green-600 dark:text-green-400">
									💰 {formatCurrency(franchise.sponsorshipDiscount)} sponsor discount
								</div>
							{/if}
							{#if franchise.totalPaidToDate && franchise.totalPaidToDate > 0}
								<div class="text-xs text-muted-foreground">
									✅ {formatCurrency(franchise.totalPaidToDate)} paid
									{#if franchise.outstandingBalance && franchise.outstandingBalance > 0}
										<br/>⏳ {formatCurrency(franchise.outstandingBalance)} outstanding
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</Card>
			</a>
		{/each}
	</div>
	
	{#if data.franchises.length === 0}
		<div class="text-center py-12">
			<p class="text-muted-foreground">No franchises found</p>
		</div>
	{/if}
</div>
