<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import { 
		DollarSign, 
		Users, 
		TrendingUp, 
		Target,
		MapPin,
		Plus,
		Phone,
		Mail,
		Calendar,
		CheckCircle2,
		Clock,
		XCircle
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

	const getLeadStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			unqualified: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			converted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
		};
		return colors[status] || colors.new;
	};

	const getOpportunityStageColor = (stage: string) => {
		const colors: Record<string, string> = {
			discovery: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			qualification: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			proposal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			due_diligence: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
			contract: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
			closed_won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			closed_lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
		};
		return colors[stage] || colors.discovery;
	};

	const getTerritoryStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			unavailable: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
		};
		return colors[status] || colors.available;
	};
</script>

<svelte:head>
	<title>Franchise Sales - FliHub</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Franchise Sales</h1>
			<p class="text-muted-foreground mt-1">Manage franchise leads, opportunities, and deals</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/sales/leads/new" class="gap-2">
				<Plus class="size-4" />
				New Lead
			</Button>
		</div>
	</div>

	<!-- Metrics -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		<MetricCard
			title="Total Leads"
			value={data.metrics.totalLeads.toString()}
			subtitle={`${data.metrics.qualifiedLeads} qualified`}
			icon={Users}
		/>
		<MetricCard
			title="Active Opportunities"
			value={data.metrics.totalOpportunities.toString()}
			subtitle="In pipeline"
			icon={Target}
		/>
		<MetricCard
			title="Closed Deals"
			value={data.metrics.totalDeals.toString()}
			subtitle={formatCurrency(data.metrics.totalRevenue)}
			icon={CheckCircle2}
		/>
		<MetricCard
			title="Pipeline Value"
			value={formatCurrency(data.metrics.pipelineValue)}
			subtitle="Potential revenue"
			icon={TrendingUp}
		/>
		<MetricCard
			title="Total Revenue"
			value={formatCurrency(data.metrics.totalRevenue)}
			subtitle="From closed deals"
			icon={DollarSign}
		/>
		<MetricCard
			title="Available Territories"
			value={data.territories.filter((t: any) => t.status === 'available').length.toString()}
			subtitle={`${data.territories.length} total`}
			icon={MapPin}
		/>
	</div>

	<!-- Recent Leads -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Recent Leads</h2>
			<Button href="/dashboard/sales/leads" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.leads.length === 0}
				<p class="text-muted-foreground text-center py-8">No leads yet. Create your first lead to get started.</p>
			{:else}
				{#each data.leads.slice(0, 5) as lead}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="font-semibold">{lead.firstName} {lead.lastName}</h3>
								<span class="px-2 py-1 text-xs font-medium rounded-full {getLeadStatusColor(lead.status)}">
									{lead.status.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
								{#if lead.email}
									<div class="flex items-center gap-1">
										<Mail class="size-3" />
										<span>{lead.email}</span>
									</div>
								{/if}
								{#if lead.phone}
									<div class="flex items-center gap-1">
										<Phone class="size-3" />
										<span>{lead.phone}</span>
									</div>
								{/if}
								{#if lead.territory}
									<div class="flex items-center gap-1">
										<MapPin class="size-3" />
										<span>{lead.territory}</span>
									</div>
								{/if}
							</div>
						</div>
						<Button href="/dashboard/sales/leads/{lead.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>

	<!-- Active Opportunities -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Active Opportunities</h2>
			<Button href="/dashboard/sales/opportunities" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.opportunities.filter((o: any) => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length === 0}
				<p class="text-muted-foreground text-center py-8">No active opportunities.</p>
			{:else}
				{#each data.opportunities.filter((o: any) => o.stage !== 'closed_won' && o.stage !== 'closed_lost').slice(0, 5) as opportunity}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="font-semibold">{opportunity.opportunityName}</h3>
								<span class="px-2 py-1 text-xs font-medium rounded-full {getOpportunityStageColor(opportunity.stage)}">
									{opportunity.stage.replace('_', ' ')}
								</span>
							</div>
							<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
								<div class="flex items-center gap-1">
									<DollarSign class="size-3" />
									<span>{formatCurrency(opportunity.dealValue)}</span>
								</div>
								{#if opportunity.probability}
									<div class="flex items-center gap-1">
										<Target class="size-3" />
										<span>{opportunity.probability}% probability</span>
									</div>
								{/if}
								{#if opportunity.expectedCloseDate}
									<div class="flex items-center gap-1">
										<Calendar class="size-3" />
										<span>Close: {formatDate(opportunity.expectedCloseDate)}</span>
									</div>
								{/if}
							</div>
						</div>
						<Button href="/dashboard/sales/opportunities/{opportunity.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>

	<!-- Available Territories -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Available Territories</h2>
			<Button href="/dashboard/sales/territories" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#if data.territories.filter((t: any) => t.status === 'available').length === 0}
				<p class="text-muted-foreground text-center py-8 col-span-full">No available territories.</p>
			{:else}
				{#each data.territories.filter((t: any) => t.status === 'available').slice(0, 6) as territory}
					<div class="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex items-center justify-between mb-2">
							<h3 class="font-semibold">{territory.name}</h3>
							<span class="px-2 py-1 text-xs font-medium rounded-full {getTerritoryStatusColor(territory.status)}">
								{territory.status}
							</span>
						</div>
						{#if territory.city || territory.state}
							<p class="text-sm text-muted-foreground mb-2">
								{territory.city}{territory.city && territory.state ? ', ' : ''}{territory.state}
							</p>
						{/if}
						<p class="text-lg font-bold text-green-600">{formatCurrency(territory.price)}</p>
					</div>
				{/each}
			{/if}
		</div>
	</Card>
</div>
