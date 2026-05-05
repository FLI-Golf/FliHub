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
		XCircle,
		ChevronDown,
		ArrowRight,
		X,
		Pencil,
		Trash2,
		Loader
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	
	let { data }: { data: PageData } = $props();

	let showNewLeadModal = $state(false);
	let showPipelineInfo = $state(false);
	let deletingLeadId   = $state<string | null>(null);

	async function deleteLead(e: MouseEvent, lead: any) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm(`Delete lead for ${lead.firstName} ${lead.lastName}? This cannot be undone.`)) return;
		deletingLeadId = lead.id;
		try {
			await fetch(`/api/franchise-leads/${lead.id}`, { method: 'DELETE' });
			await invalidateAll();
		} finally {
			deletingLeadId = null;
		}
	}
	
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
			new:         'bg-blue-900/40 text-blue-300 border-blue-700/50',
			contacted:   'bg-violet-900/40 text-violet-300 border-violet-700/50',
			qualified:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
			unqualified: 'bg-slate-700/40 text-slate-400 border-slate-600/50',
			converted:   'bg-green-900/40 text-green-300 border-green-700/50',
			lost:        'bg-red-900/40 text-red-300 border-red-700/50',
		};
		return colors[status] || colors.new;
	};

	const getOpportunityStageColor = (stage: string) => {
		const colors: Record<string, string> = {
			discovery:     'bg-blue-900/40 text-blue-300 border-blue-700/50',
			qualification: 'bg-violet-900/40 text-violet-300 border-violet-700/50',
			proposal:      'bg-amber-900/40 text-amber-300 border-amber-700/50',
			negotiation:   'bg-orange-900/40 text-orange-300 border-orange-700/50',
			due_diligence: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
			contract:      'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
			closed_won:    'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
			closed_lost:   'bg-red-900/40 text-red-300 border-red-700/50',
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
		<button
			onclick={() => showNewLeadModal = true}
			class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/30">
			<div class="size-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
				<Plus class="size-4 text-white" />
			</div>
			<div class="text-left">
				<p class="text-sm font-semibold text-white leading-tight">New Lead</p>
				<p class="text-xs text-emerald-200 leading-tight">Add a prospective franchise owner</p>
			</div>
		</button>
	</div>

	<!-- Metrics -->
	<div class="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
		<div class="rounded-xl bg-blue-950 border border-blue-800/60 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-blue-800/60 flex items-center justify-center mb-1">
				<Users class="size-4 text-blue-300" />
			</div>
			<p class="text-2xl font-black text-white">{data.metrics.totalLeads}</p>
			<p class="text-xs font-semibold text-blue-300 uppercase tracking-wide">Total Leads</p>
			<p class="text-xs text-blue-400">{data.metrics.qualifiedLeads} qualified</p>
		</div>
		<div class="rounded-xl bg-violet-950 border border-violet-800/60 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-violet-800/60 flex items-center justify-center mb-1">
				<Target class="size-4 text-violet-300" />
			</div>
			<p class="text-2xl font-black text-white">{data.metrics.totalOpportunities}</p>
			<p class="text-xs font-semibold text-violet-300 uppercase tracking-wide">Opportunities</p>
			<p class="text-xs text-violet-400">In pipeline</p>
		</div>
		<div class="rounded-xl bg-emerald-950 border border-emerald-800/60 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-emerald-800/60 flex items-center justify-center mb-1">
				<CheckCircle2 class="size-4 text-emerald-300" />
			</div>
			<p class="text-2xl font-black text-white">{data.metrics.totalDeals}</p>
			<p class="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Closed Deals</p>
			<p class="text-xs text-emerald-400">{formatCurrency(data.metrics.totalRevenue)}</p>
		</div>
		<div class="rounded-xl bg-amber-950 border border-amber-800/60 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-amber-800/60 flex items-center justify-center mb-1">
				<TrendingUp class="size-4 text-amber-300" />
			</div>
			<p class="text-xl font-black text-white">{formatCurrency(data.metrics.pipelineValue)}</p>
			<p class="text-xs font-semibold text-amber-300 uppercase tracking-wide">Pipeline Value</p>
			<p class="text-xs text-amber-400">Potential revenue</p>
		</div>
		<div class="rounded-xl bg-green-950 border border-green-800/60 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-green-800/60 flex items-center justify-center mb-1">
				<DollarSign class="size-4 text-green-300" />
			</div>
			<p class="text-xl font-black text-white">{formatCurrency(data.metrics.totalRevenue)}</p>
			<p class="text-xs font-semibold text-green-300 uppercase tracking-wide">Total Revenue</p>
			<p class="text-xs text-green-400">From closed deals</p>
		</div>
		<div class="rounded-xl bg-slate-800 border border-slate-700 p-4 flex flex-col gap-1">
			<div class="size-8 rounded-lg bg-slate-700 flex items-center justify-center mb-1">
				<MapPin class="size-4 text-slate-300" />
			</div>
			<p class="text-2xl font-black text-white">{data.territories.filter((t: any) => t.status === 'available').length}</p>
			<p class="text-xs font-semibold text-slate-300 uppercase tracking-wide">Territories</p>
			<p class="text-xs text-slate-500">{data.territories.length} total</p>
		</div>
	</div>

	<!-- Recent Leads -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
			<div class="flex items-center gap-2">
				<div class="size-6 rounded-md bg-blue-900/60 flex items-center justify-center">
					<Users class="size-3.5 text-blue-400" />
				</div>
				<h2 class="font-semibold text-white">Recent Leads</h2>
			</div>
			<a href="/dashboard/sales/leads" class="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</a>
		</div>
		{#if data.leads.length === 0}
			<p class="text-slate-500 text-center py-10 text-sm">No leads yet.</p>
		{:else}
			<div class="divide-y divide-slate-700/60">
				{#each data.leads.slice(0, 5) as lead}
					<div class="flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors group">
						<!-- Clickable area -->
						<a href="/dashboard/sales/leads/{lead.id}" class="flex items-center gap-3 min-w-0 flex-1">
							<div class="size-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-xs font-bold text-slate-300">
								{lead.firstName?.[0] ?? ''}{lead.lastName?.[0] ?? ''}
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold text-white truncate">{lead.firstName} {lead.lastName}</p>
								{#if lead.company}
									<p class="text-xs font-medium text-slate-300 truncate">{lead.company}</p>
								{/if}
								<div class="flex items-center gap-3 mt-0.5 flex-wrap">
									{#if lead.email}
										<p class="text-xs text-slate-500 truncate">{lead.email}</p>
									{/if}
									{#if lead.phone}
										<p class="text-xs text-slate-500">{lead.phone}</p>
									{/if}
									{#if lead.location}
										<p class="text-xs text-slate-500">{lead.location}</p>
									{/if}
								</div>
							</div>
						</a>
						<!-- Meta + actions -->
						<div class="flex items-center gap-3 shrink-0 ml-4">
							<div class="flex flex-col items-end gap-1.5">
								<span class="px-2 py-0.5 rounded-full text-xs font-medium border {getLeadStatusColor(lead.status)}">
									{lead.status.replace('_', ' ')}
								</span>
								<div class="flex items-center gap-2 text-xs text-slate-500">
									{#if lead.source}
										<span class="capitalize">{lead.source.replace('_',' ')}</span>
									{/if}
									{#if lead.created}
										<span>·</span>
										<span>{new Date(lead.created).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
									{/if}
								</div>
							</div>
							<!-- Action buttons — visible on hover -->
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<a href="/dashboard/sales/leads/{lead.id}?edit=1"
									onclick={(e) => e.stopPropagation()}
									class="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
									title="Edit">
									<Pencil class="size-3.5" />
								</a>
								<button
									onclick={(e) => deleteLead(e, lead)}
									disabled={deletingLeadId === lead.id}
									class="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
									title="Delete">
									{#if deletingLeadId === lead.id}
										<Loader class="size-3.5 animate-spin" />
									{:else}
										<Trash2 class="size-3.5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Active Opportunities -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
			<div class="flex items-center gap-2">
				<div class="size-6 rounded-md bg-violet-900/60 flex items-center justify-center">
					<Target class="size-3.5 text-violet-400" />
				</div>
				<h2 class="font-semibold text-white">Active Opportunities</h2>
			</div>
			<a href="/dashboard/sales/opportunities" class="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</a>
		</div>
		{#if data.opportunities.filter((o: any) => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length === 0}
			<p class="text-slate-500 text-center py-10 text-sm">No active opportunities.</p>
		{:else}
			<div class="divide-y divide-slate-700/60">
				{#each data.opportunities.filter((o: any) => o.stage !== 'closed_won' && o.stage !== 'closed_lost').slice(0, 5) as opportunity}
					<a href="/dashboard/sales/opportunities/{opportunity.id}"
						class="flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/40 transition-colors group">
						<div class="min-w-0">
							<p class="text-sm font-semibold text-white truncate">{opportunity.opportunityName}</p>
							<div class="flex items-center gap-3 mt-0.5">
								<span class="text-xs text-emerald-400 font-medium">{formatCurrency(opportunity.dealValue)}</span>
								{#if opportunity.probability}
									<span class="text-xs text-slate-500">{opportunity.probability}% probability</span>
								{/if}
								{#if opportunity.expectedCloseDate}
									<span class="text-xs text-slate-500">Close {formatDate(opportunity.expectedCloseDate)}</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-3 shrink-0 ml-4">
							<span class="px-2 py-0.5 rounded-full text-xs font-medium border {getOpportunityStageColor(opportunity.stage)}">
								{opportunity.stage.replace('_', ' ')}
							</span>
							<span class="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">→</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Available Territories -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<div class="flex items-center justify-between px-5 py-4 border-b border-slate-700">
			<div class="flex items-center gap-2">
				<div class="size-6 rounded-md bg-slate-700 flex items-center justify-center">
					<MapPin class="size-3.5 text-slate-300" />
				</div>
				<h2 class="font-semibold text-white">Available Territories</h2>
			</div>
			<a href="/dashboard/sales/territories" class="text-xs text-slate-400 hover:text-slate-300 transition-colors">View all →</a>
		</div>
		{#if data.territories.filter((t: any) => t.status === 'available').length === 0}
			<p class="text-slate-500 text-center py-10 text-sm">No available territories.</p>
		{:else}
			<div class="grid gap-px bg-slate-700/40 md:grid-cols-2 lg:grid-cols-3">
				{#each data.territories.filter((t: any) => t.status === 'available').slice(0, 6) as territory}
					<div class="bg-slate-800/60 hover:bg-slate-700/60 transition-colors p-4">
						<div class="flex items-start justify-between mb-2">
							<p class="text-sm font-semibold text-white leading-tight">{territory.name}</p>
							<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 shrink-0 ml-2">
								{territory.status}
							</span>
						</div>
						{#if territory.city || territory.state}
							<p class="text-xs text-slate-500 mb-2">
								{territory.city}{territory.city && territory.state ? ', ' : ''}{territory.state}
							</p>
						{/if}
						<p class="text-base font-black text-emerald-400">{formatCurrency(territory.price)}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showNewLeadModal}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
		onclick={() => showNewLeadModal = false}
		onkeydown={(e) => e.key === 'Escape' && (showNewLeadModal = false)}
		role="dialog" aria-modal="true">

		<div class="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="document">

			<!-- Header -->
			<div class="flex items-start justify-between p-6 border-b border-slate-700/60">
				<div>
					<h2 class="text-lg font-bold text-white">New Franchise Lead</h2>
					<p class="text-sm text-slate-400 mt-0.5">Every franchise sale starts here</p>
				</div>
				<button onclick={() => showNewLeadModal = false}
					class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
					<X class="size-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="p-6 space-y-4">

				<!-- Pipeline steps -->
				<div class="flex items-center gap-2 text-sm">
					<span class="px-2.5 py-1 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-300 font-medium text-xs">1. Lead</span>
					<ArrowRight class="size-3.5 text-slate-600 shrink-0" />
					<span class="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-xs">2. Opportunity</span>
					<ArrowRight class="size-3.5 text-slate-600 shrink-0" />
					<span class="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-xs">3. Deal</span>
				</div>

				<p class="text-sm text-slate-300">
					A lead is a prospective franchise owner entering the pipeline. Once qualified, it becomes an <span class="text-white font-medium">opportunity</span>, and when closed it becomes a signed <span class="text-white font-medium">deal</span>.
				</p>

				<!-- Toggle instructions -->
				<button
					onclick={() => showPipelineInfo = !showPipelineInfo}
					class="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors w-full">
					<ChevronDown class="size-3.5 transition-transform duration-200 {showPipelineInfo ? 'rotate-180' : ''}" />
					{showPipelineInfo ? 'Hide' : 'Show'} pipeline details
				</button>

				{#if showPipelineInfo}
					<div class="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 space-y-3 text-xs text-slate-400">
						<div class="flex gap-3">
							<span class="size-5 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
							<div>
								<p class="text-slate-200 font-medium mb-0.5">Lead</p>
								<p>Capture contact info, financial qualifications, territory interest, and source. Assign to a sales rep. A lead linked to an existing sponsor can fast-track to a deal.</p>
							</div>
						</div>
						<div class="flex gap-3">
							<span class="size-5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
							<div>
								<p class="text-slate-200 font-medium mb-0.5">Opportunity</p>
								<p>A qualified lead becomes an opportunity with a deal value ($10M per franchise slot), probability, and expected close date. Tracks proposal sent, negotiation stage, and due diligence.</p>
							</div>
						</div>
						<div class="flex gap-3">
							<span class="size-5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
							<div>
								<p class="text-slate-200 font-medium mb-0.5">Deal</p>
								<p>A closed opportunity becomes a signed deal. Tracks payment milestones, contract date, and links the franchise owner to their territory. Sponsor bridge records are created here.</p>
							</div>
						</div>
					</div>
				{/if}

			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/60">
				<button onclick={() => showNewLeadModal = false}
					class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
					Cancel
				</button>
				<a href="/dashboard/sales/leads/new"
					class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
					Continue <ArrowRight class="size-3.5" />
				</a>
			</div>

		</div>
	</div>
{/if}
