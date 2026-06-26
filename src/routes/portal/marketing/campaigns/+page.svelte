<script lang="ts">
	import type { PageData } from './$types';
	import { Megaphone } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const campaigns = $derived((data as any).campaigns ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-orange-400');

	function statusStyle(status: string) {
		const styles: Record<string, string> = {
			planning:    'bg-blue-950/50 text-blue-300 border-blue-700/50',
			in_progress: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
			active:      'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
			completed:   'bg-slate-700/50 text-slate-300 border-slate-600/50',
			paused:      'bg-amber-950/50 text-amber-300 border-amber-700/50',
		};
		return styles[status] ?? 'bg-slate-800/50 text-slate-300 border-slate-700/50';
	}

	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		const dateOnly = d.includes('T') ? d.split('T')[0] : d.split(' ')[0];
		const [y, m, day] = dateOnly.split('-').map(Number);
		if (!y) return '—';
		return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head><title>Campaigns — Marketing Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Megaphone class="size-6 {accentText}" /> Campaigns
	</h1>

	{#if campaigns.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<Megaphone class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No campaigns yet.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4">
			{#each campaigns as campaign}
				<a href={`/portal/marketing/campaigns/${campaign.id}`} class="block">
					<div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
						<div class="flex items-start justify-between gap-3 mb-2">
							<div class="min-w-0">
								<h3 class="font-semibold text-white truncate">{campaign.name ?? 'Untitled'}</h3>
								<p class="text-xs text-slate-400 mt-1 line-clamp-1">{campaign.description ?? ''}</p>
							</div>
							<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border shrink-0 {statusStyle(campaign.status)}">
								{campaign.status ?? 'planning'}
							</span>
						</div>
						<div class="flex items-center gap-4 text-xs text-slate-500 mt-3">
							{#if campaign.startDate}
								<span>Start: {fmtDate(campaign.startDate)}</span>
							{/if}
							{#if campaign.endDate}
								<span>End: {fmtDate(campaign.endDate)}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
