<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import { 
		DollarSign, 
		Users, 
		TrendingUp, 
		Building2,
		Star,
		ArrowRight,
		Plus,
		Mail,
		Phone,
		MapPin,
		Calendar,
		Award
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const getTierLabel = (tier: string) => {
		const labels: Record<string, string> = {
			tier_1: 'Tier 1 - Premium',
			tier_2: 'Tier 2 - Elite',
			tier_3: 'Tier 3 - Standard',
			tier_4: 'Tier 4 - Growth'
		};
		return labels[tier] || tier;
	};

	const getTierColor = (tier: string) => {
		const colors: Record<string, string> = {
			tier_1: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			tier_2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			tier_3: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			tier_4: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
		};
		return colors[tier] || colors.tier_3;
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			prospect: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			negotiating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			renewed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			converted_to_franchise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
		};
		return colors[status] || colors.prospect;
	};

	const getTypeIcon = (type: string) => {
		return type === 'casino' ? '🎰' : type === 'resort' ? '🏨' : '🏢';
	};

	// Tier pricing data
	const tierPricing = {
		tier_1: { 2025: 7000000, 2026: 5000000, 2027: 3000000 },
		tier_2: { 2025: 5000000, 2026: 7000000, 2027: 9000000 },
		tier_3: { 2025: 1000000, 2026: 1000000, 2027: 2000000 },
		tier_4: { 2025: 1000000, 2026: 1500000, 2027: 2000000 }
	};
</script>

<svelte:head>
	<title>Sponsors - FliHub</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Sponsors</h1>
			<p class="text-muted-foreground mt-1">Manage casino and corporate sponsorships</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/sponsors/new" class="gap-2">
				<Plus class="size-4" />
				New Sponsor
			</Button>
		</div>
	</div>

	<!-- Metrics -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<MetricCard
			title="Active Sponsors"
			value={data.metrics.activeSponsors.toString()}
			subtitle={`${data.metrics.prospectSponsors} prospects`}
			icon={Users}
		/>
		<MetricCard
			title="Total Revenue"
			value={formatCurrency(data.metrics.totalRevenue)}
			subtitle="From active sponsors"
			icon={DollarSign}
		/>
		<MetricCard
			title="Franchise Interest"
			value={data.metrics.franchiseInterested.toString()}
			subtitle={`${data.metrics.activeBridges} in conversion`}
			icon={TrendingUp}
		/>
		<MetricCard
			title="Converted"
			value={data.metrics.convertedSponsors.toString()}
			subtitle="To franchise owners"
			icon={Award}
		/>
	</div>

	<!-- Tier Pricing Reference -->
	<Card class="p-6">
		<h2 class="text-xl font-semibold mb-4">Sponsorship Tier Pricing</h2>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b">
						<th class="text-left py-3 px-4 font-semibold">Tier</th>
						<th class="text-right py-3 px-4 font-semibold">2025</th>
						<th class="text-right py-3 px-4 font-semibold">2026</th>
						<th class="text-right py-3 px-4 font-semibold">2027</th>
						<th class="text-right py-3 px-4 font-semibold">Total</th>
						<th class="text-center py-3 px-4 font-semibold">Count</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(tierPricing) as [tier, pricing]}
						{@const total = pricing[2025] + pricing[2026] + pricing[2027]}
						{@const count = data.metrics.sponsorsByTier[tier as keyof typeof data.metrics.sponsorsByTier]}
						<tr class="border-b hover:bg-accent/50">
							<td class="py-3 px-4">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getTierColor(tier)}">
									{getTierLabel(tier)}
								</span>
							</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2025])}</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2026])}</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2027])}</td>
							<td class="text-right py-3 px-4 font-semibold">{formatCurrency(total)}</td>
							<td class="text-center py-3 px-4">
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800">
									{count}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="text-sm text-muted-foreground mt-4">
			💡 Sponsors who convert to franchise owners receive discounts based on their sponsorship value
		</p>
	</Card>

	<!-- Active Sponsors -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Active Sponsors</h2>
			<Button href="/dashboard/sponsors?filter=active" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.sponsors.filter((s: any) => s.status === 'active').length === 0}
				<p class="text-muted-foreground text-center py-8">No active sponsors yet.</p>
			{:else}
				{#each data.sponsors.filter((s: any) => s.status === 'active').slice(0, 5) as sponsor}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{getTypeIcon(sponsor.type)}</span>
								<div>
									<div class="flex items-center gap-2">
										<h3 class="font-semibold">{sponsor.companyName}</h3>
										<span class="px-2 py-1 text-xs font-medium rounded-full {getTierColor(sponsor.tier)}">
											{getTierLabel(sponsor.tier)}
										</span>
										{#if sponsor.franchiseInterest}
											<span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
												🎯 Franchise Interest
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										{#if sponsor.location}
											<div class="flex items-center gap-1">
												<MapPin class="size-3" />
												<span>{sponsor.location}</span>
											</div>
										{/if}
										{#if sponsor.annualCommitment}
											<div class="flex items-center gap-1">
												<DollarSign class="size-3" />
												<span>{formatCurrency(sponsor.annualCommitment)}/year</span>
											</div>
										{/if}
										{#if sponsor.contractEndDate}
											<div class="flex items-center gap-1">
												<Calendar class="size-3" />
												<span>Until {formatDate(sponsor.contractEndDate)}</span>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
						<Button href="/dashboard/sponsors/{sponsor.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>

	<!-- Franchise Conversion Pipeline -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Franchise Conversion Pipeline</h2>
			<Button href="/dashboard/sponsors/conversions" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.bridges.filter((b: any) => b.status !== 'declined' && b.status !== 'converted').length === 0}
				<p class="text-muted-foreground text-center py-8">No active conversions in progress.</p>
			{:else}
				{#each data.bridges.filter((b: any) => b.status !== 'declined' && b.status !== 'converted').slice(0, 5) as bridge}
					{@const sponsor = data.sponsors.find((s: any) => s.id === bridge.sponsorId)}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<span class="text-2xl">🎰</span>
								<div>
									<h3 class="font-semibold">{sponsor?.companyName || 'Unknown Sponsor'}</h3>
									<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											{bridge.status.replace(/_/g, ' ')}
										</span>
										{#if bridge.sponsorshipValueToDate}
											<div class="flex items-center gap-1">
												<DollarSign class="size-3" />
												<span>{formatCurrency(bridge.sponsorshipValueToDate)} invested</span>
											</div>
										{/if}
										{#if bridge.netFranchiseFee}
											<div class="flex items-center gap-1">
												<ArrowRight class="size-3" />
												<span>{formatCurrency(bridge.netFranchiseFee)} franchise fee</span>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
						<Button href="/dashboard/sponsors/bridge/{bridge.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>
</div>
