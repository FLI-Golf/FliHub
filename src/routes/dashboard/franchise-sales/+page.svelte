<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import Card from '$lib/components/ui/card.svelte';
	import SalesPipelineVisualization from '$lib/components/franchise/SalesPipelineVisualization.svelte';
	import DealStatusTracker from '$lib/components/franchise/DealStatusTracker.svelte';
	import TerritoryGrid from '$lib/components/franchise/TerritoryGrid.svelte';
	import RevenueMetricsCard from '$lib/components/franchise/RevenueMetricsCard.svelte';
	import { ArrowLeft, Users, FileText, Handshake, MapPin } from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
</script>

<svelte:head>
	<title>Franchise Sales Dashboard - FliHub</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3 mb-2">
				<Button href="/dashboard" variant="ghost" size="sm">
					<ArrowLeft class="size-4 mr-2" />
					Back to Dashboard
				</Button>
			</div>
			<h1 class="text-4xl font-bold">Franchise Sales Dashboard</h1>
			<p class="text-muted-foreground mt-2">Complete pipeline and revenue tracking</p>
		</div>
	</div>

	<!-- Key Metrics Row -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-muted-foreground">Total Leads</span>
				<Users class="size-4 text-blue-600" />
			</div>
			<p class="text-3xl font-bold">{data.pipelineMetrics.leads.total}</p>
			<p class="text-xs text-muted-foreground mt-1">
				{data.pipelineMetrics.leads.qualified} qualified
			</p>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-muted-foreground">Opportunities</span>
				<FileText class="size-4 text-purple-600" />
			</div>
			<p class="text-3xl font-bold">{data.pipelineMetrics.opportunities.total}</p>
			<p class="text-xs text-muted-foreground mt-1">
				{formatCurrency(data.pipelineMetrics.opportunities.totalValue)} value
			</p>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-muted-foreground">Closed Deals</span>
				<Handshake class="size-4 text-green-600" />
			</div>
			<p class="text-3xl font-bold text-green-600">{data.pipelineMetrics.deals.total}</p>
			<p class="text-xs text-muted-foreground mt-1">
				{data.pipelineMetrics.deals.active} active
			</p>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-muted-foreground">Territories</span>
				<MapPin class="size-4 text-cyan-600" />
			</div>
			<p class="text-3xl font-bold">{data.pipelineMetrics.territories.sold}/{data.pipelineMetrics.territories.total}</p>
			<p class="text-xs text-muted-foreground mt-1">
				{data.pipelineMetrics.territories.available} available
			</p>
		</Card>
	</div>

	<!-- Pipeline and Revenue Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Sales Pipeline -->
		<div class="lg:col-span-2">
			<SalesPipelineVisualization 
				leads={data.pipelineMetrics.leads.total}
				opportunities={data.pipelineMetrics.opportunities.total}
				deals={data.pipelineMetrics.deals.total}
				leadToOppConversion={data.pipelineMetrics.conversion.leadToOpportunity}
				oppToDealConversion={data.pipelineMetrics.conversion.opportunityToDeal}
			/>
		</div>

		<!-- Revenue Metrics -->
		<RevenueMetricsCard 
			committed={data.revenueMetrics.committed}
			received={data.revenueMetrics.received}
			outstanding={data.revenueMetrics.outstanding}
			averageDealSize={data.revenueMetrics.averageDealSize}
			collectionRate={data.revenueMetrics.collectionRate}
		/>
	</div>

	<!-- Deal Status Tracker -->
	<DealStatusTracker 
		pendingSignature={data.pipelineMetrics.deals.pendingSignature}
		signed={data.pipelineMetrics.deals.signed}
		paymentPending={data.pipelineMetrics.deals.paymentPending}
		paymentReceived={data.pipelineMetrics.deals.paymentReceived}
		onboarding={data.pipelineMetrics.deals.onboarding}
		active={data.pipelineMetrics.deals.active}
		cancelled={data.pipelineMetrics.deals.cancelled}
	/>

	<!-- Territory Grid -->
	<TerritoryGrid territories={data.territories} />

	<!-- Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Leads -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">Recent Leads</h3>
			{#if data.leads.length === 0}
				<p class="text-center text-muted-foreground py-8">No leads yet</p>
			{:else}
				<div class="space-y-3">
					{#each data.leads.slice(0, 5) as lead}
						<div class="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
							<div>
								<p class="font-medium">{lead.name}</p>
								<p class="text-sm text-muted-foreground">{lead.email}</p>
							</div>
							<span class="text-xs px-2 py-1 rounded-full bg-muted capitalize">
								{lead.status}
							</span>
						</div>
					{/each}
				</div>
				{#if data.leads.length > 5}
					<Button href="/dashboard/franchise-sales/leads" variant="outline" class="w-full mt-4">
						View All {data.leads.length} Leads
					</Button>
				{/if}
			{/if}
		</Card>

		<!-- Recent Deals -->
		<Card class="p-6">
			<h3 class="text-lg font-semibold mb-4">Recent Deals</h3>
			{#if data.deals.length === 0}
				<p class="text-center text-muted-foreground py-8">No deals yet</p>
			{:else}
				<div class="space-y-3">
					{#each data.deals.slice(0, 5) as deal}
						<div class="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
							<div>
								<p class="font-medium">{deal.franchiseOwnerName}</p>
								<p class="text-sm text-muted-foreground">{deal.territory}</p>
							</div>
							<div class="text-right">
								<p class="font-semibold">{formatCurrency(deal.dealValue)}</p>
								<span class="text-xs px-2 py-1 rounded-full bg-muted capitalize">
									{deal.status.replace('_', ' ')}
								</span>
							</div>
						</div>
					{/each}
				</div>
				{#if data.deals.length > 5}
					<Button href="/dashboard/franchise-sales/deals" variant="outline" class="w-full mt-4">
						View All {data.deals.length} Deals
					</Button>
				{/if}
			{/if}
		</Card>
	</div>
</div>
