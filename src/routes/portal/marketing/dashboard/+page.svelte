<script lang="ts">
	import type { PageData } from './$types';
	import { LayoutDashboard, Target, Megaphone, Handshake, CheckSquare } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const stats = $derived((data as any).stats ?? {});
	const recentGoals = $derived((data as any).recentGoals ?? []);
	const recentCampaigns = $derived((data as any).recentCampaigns ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-orange-400');
</script>

<svelte:head><title>Marketing Dashboard — Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<LayoutDashboard class="size-6 {accentText}" /> Marketing Dashboard
	</h1>

	<!-- Stats strip -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		<a href="/portal/marketing/goals" class="bg-slate-900 border border-slate-800 hover:border-orange-500/30 rounded-xl px-5 py-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Active Goals</p>
			<p class="text-2xl font-bold {accentText}">{stats.activeGoals ?? 0}</p>
		</a>
		<a href="/portal/marketing/campaigns" class="bg-slate-900 border border-slate-800 hover:border-orange-500/30 rounded-xl px-5 py-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Campaigns</p>
			<p class="text-2xl font-bold {accentText}">{stats.activeCampaigns ?? 0}</p>
		</a>
		<a href="/portal/marketing/sponsors" class="bg-slate-900 border border-slate-800 hover:border-orange-500/30 rounded-xl px-5 py-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sponsors</p>
			<p class="text-2xl font-bold {accentText}">{stats.activeSponsors ?? 0}</p>
		</a>
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Pending Tasks</p>
			<p class="text-2xl font-bold {accentText}">{stats.pendingTasks ?? 0}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Goals -->
		<div>
			<h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
				<Target class="size-3.5 {accentText}" /> Recent Goals
			</h2>
			{#if recentGoals.length === 0}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 text-center">
					<p class="text-xs text-slate-500">No active goals</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each recentGoals as goal}
						<a href={`/portal/marketing/goals/${goal.id}`} class="block">
							<div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 transition-all hover:shadow-lg hover:shadow-orange-500/10">
								<p class="text-xs font-semibold text-white truncate">{goal.goalName ?? 'Untitled'}</p>
								<p class="text-[10px] text-slate-500">{goal.category ?? 'General'}</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Campaigns -->
		<div>
			<h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
				<Megaphone class="size-3.5 {accentText}" /> Recent Campaigns
			</h2>
			{#if recentCampaigns.length === 0}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-6 text-center">
					<p class="text-xs text-slate-500">No active campaigns</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each recentCampaigns as campaign}
						<a href={`/portal/marketing/campaigns/${campaign.id}`} class="block">
							<div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 transition-all hover:shadow-lg hover:shadow-orange-500/10">
								<p class="text-xs font-semibold text-white truncate">{campaign.name ?? 'Untitled'}</p>
								<p class="text-[10px] text-slate-500 line-clamp-1">{campaign.description ?? ''}</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
