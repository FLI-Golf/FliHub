<script lang="ts">
	import type { PageData } from './$types';
	import { FileText, ArrowRight, Clock } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const bids = $derived((data as any).bids ?? []);

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	}

	const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
		submitted:    { label: 'Submitted',    color: 'bg-blue-900/40 text-blue-300 border-blue-700/50',     desc: 'Your bid has been received and is awaiting review.' },
		under_review: { label: 'Under Review', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50', desc: 'The team is actively reviewing your proposal.' },
		shortlisted:  { label: 'Shortlisted',  color: 'bg-violet-900/40 text-violet-300 border-violet-700/50', desc: 'You\'ve been shortlisted — expect to hear from us soon.' },
		awarded:      { label: 'Awarded ✓',    color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', desc: 'Congratulations — you\'ve been awarded this project.' },
		rejected:     { label: 'Not Selected', color: 'bg-slate-700/40 text-slate-400 border-slate-600/50',   desc: 'Another vendor was selected for this project.' },
	};
</script>

<svelte:head><title>My Bids — FliHub Vendor Portal</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-white">My Bids</h1>
		<p class="text-slate-400 text-sm mt-1">Track the status of every bid you've submitted.</p>
	</div>

	{#if bids.length === 0}
		<div class="rounded-2xl border border-dashed border-slate-700 py-20 text-center">
			<FileText class="size-10 text-slate-700 mx-auto mb-4" />
			<p class="text-slate-400 font-medium">No bids submitted yet.</p>
			<a href="/vendor/projects" class="mt-2 inline-flex items-center gap-1.5 text-sm text-orange-400 hover:underline">
				Browse open projects <ArrowRight class="size-3.5" />
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each bids as bid}
				{@const cfg = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG.submitted}
				<div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1 flex-wrap">
								<h3 class="font-semibold text-white">{bid.expand?.projectId?.name ?? 'Project'}</h3>
								<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {cfg.color}">{cfg.label}</span>
							</div>
								{#if bid.expand?.taskId?.title}
									<p class="text-xs text-blue-300 mb-1">Task: {bid.expand.taskId.title}</p>
								{/if}
								{#if bid.referenceNumber}
									<p class="text-[11px] text-slate-500 mb-1">Reference: <span class="text-slate-300">{bid.referenceNumber}</span></p>
								{/if}
							<p class="text-xs text-slate-500 mb-3">{cfg.desc}</p>

							<div class="flex flex-wrap gap-4 text-xs text-slate-500">
								{#if bid.amount}
									<span class="text-emerald-300 font-semibold">{fmt(bid.amount)}</span>
								{/if}
								{#if bid.timeline}
									<span class="flex items-center gap-1"><Clock class="size-3" />{bid.timeline}</span>
								{/if}
								<span>Submitted {fmtDate(bid.created)}</span>
							</div>

							{#if bid.materialsAmount || bid.laborAmount || bid.logisticsAmount || bid.otherAmount}
								<div class="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-3">
									{#if bid.materialsAmount}<span>Materials: <span class="text-slate-300">{fmt(bid.materialsAmount)}</span></span>{/if}
									{#if bid.laborAmount}<span>Labor: <span class="text-slate-300">{fmt(bid.laborAmount)}</span></span>{/if}
									{#if bid.logisticsAmount}<span>Logistics: <span class="text-slate-300">{fmt(bid.logisticsAmount)}</span></span>{/if}
									{#if bid.otherAmount}<span>Other: <span class="text-slate-300">{fmt(bid.otherAmount)}</span></span>{/if}
								</div>
							{/if}

							{#if bid.scope}
								<p class="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">{bid.scope}</p>
							{/if}
						</div>

						<!-- Pipeline progress dots -->
						<div class="shrink-0 flex flex-col items-center gap-1 pt-1">
							{#each ['submitted','under_review','shortlisted','awarded'] as s}
								{@const stages = ['submitted','under_review','shortlisted','awarded']}
								{@const currentIdx = stages.indexOf(bid.status)}
								{@const thisIdx = stages.indexOf(s)}
								<div class="size-2 rounded-full transition-all
									{bid.status === 'rejected' ? 'bg-slate-700' :
									 thisIdx <= currentIdx ? 'bg-orange-500' : 'bg-slate-700'}">
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
