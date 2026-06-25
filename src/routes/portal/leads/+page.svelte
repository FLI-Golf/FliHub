<script lang="ts">
	import type { PageData } from './$types';
	import { Target, TrendingUp, CheckCircle2, DollarSign } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config       = $derived((data as any).portalConfig);
	const leads        = $derived((data as any).leads        ?? []);
	const opportunities = $derived((data as any).opportunities ?? []);
	const deals        = $derived((data as any).deals        ?? []);
	const accentText   = $derived(config?.accentTw?.split(' ')[0] ?? 'text-amber-400');

	const LEAD_STATUS: Record<string, string> = {
		new: 'bg-blue-950/50 text-blue-300 border-blue-700/50',
		contacted: 'bg-amber-950/50 text-amber-300 border-amber-700/50',
		qualified: 'bg-violet-950/50 text-violet-300 border-violet-700/50',
		closed_won: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
		closed_lost: 'bg-slate-800 text-slate-500 border-slate-700',
	};

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}

	let tab = $state<'leads' | 'opps' | 'deals'>('leads');
</script>

<svelte:head><title>Leads & Pipeline — Sales Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Target class="size-6 {accentText}" /> Leads & Pipeline
	</h1>

	<!-- Tabs -->
	<div class="flex gap-2">
		{#each [['leads','Leads',leads.length],['opps','Opportunities',opportunities.length],['deals','Deals',deals.length]] as [key,label,count]}
			<button onclick={() => tab = key as any}
				class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
					{tab === key ? `${accentText} border-current bg-slate-800` : 'text-slate-500 border-slate-700 hover:text-slate-300'}">
				{label} <span class="ml-1 opacity-60">{count}</span>
			</button>
		{/each}
	</div>

	{#if tab === 'leads'}
		<div class="space-y-2">
			{#each leads as lead}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
					<div class="min-w-0">
						<p class="text-sm font-bold text-white truncate">{lead.name ?? lead.contactName ?? 'Lead'}</p>
						<p class="text-xs text-slate-500">{lead.email ?? lead.phone ?? ''}</p>
					</div>
					<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0
						{LEAD_STATUS[lead.status] ?? LEAD_STATUS.new}">
						{lead.status ?? 'new'}
					</span>
				</div>
			{:else}
				<p class="text-sm text-slate-500 py-8 text-center">No leads yet.</p>
			{/each}
		</div>
	{:else if tab === 'opps'}
		<div class="space-y-2">
			{#each opportunities as opp}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
					<div class="min-w-0">
						<p class="text-sm font-bold text-white truncate">{opp.name ?? opp.expand?.leadId?.name ?? 'Opportunity'}</p>
						<p class="text-xs text-slate-500 capitalize">{opp.stage ?? '—'}</p>
					</div>
					{#if opp.dealValue > 0}
						<p class="text-sm font-semibold {accentText} shrink-0">{fmt(opp.dealValue)}</p>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-slate-500 py-8 text-center">No opportunities yet.</p>
			{/each}
		</div>
	{:else}
		<div class="space-y-2">
			{#each deals as deal}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
					<div class="min-w-0">
						<p class="text-sm font-bold text-white truncate">{deal.name ?? deal.expand?.opportunityId?.name ?? 'Deal'}</p>
						<p class="text-xs text-slate-500 capitalize">{deal.status ?? '—'}</p>
					</div>
					{#if deal.totalPaidToDate > 0}
						<p class="text-sm font-semibold text-emerald-400 shrink-0">{fmt(deal.totalPaidToDate)}</p>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-slate-500 py-8 text-center">No deals yet.</p>
			{/each}
		</div>
	{/if}
</div>
