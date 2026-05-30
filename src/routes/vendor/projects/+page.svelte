<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { FolderOpen, DollarSign, Calendar, ArrowRight, CheckCircle2, X, Send } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const projects      = $derived((data as any).projects ?? []);
	const myBidByProject = $derived((data as any).myBidByProject ?? {});
	const vendor        = $derived((data as any).vendor);

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	}

	// ── Bid modal ─────────────────────────────────────────────────────────────
	let bidProject  = $state<any>(null);
	let bidAmount   = $state('');
	let bidTimeline = $state('');
	let bidScope    = $state('');
	let bidSaving   = $state(false);
	let bidErr      = $state('');

	function openBid(project: any) {
		bidProject  = project;
		bidAmount   = '';
		bidTimeline = '';
		bidScope    = '';
		bidErr      = '';
	}

	async function submitBid(e: SubmitEvent) {
		e.preventDefault();
		if (!bidProject || !vendor) return;
		bidSaving = true;
		bidErr    = '';
		try {
			const res = await fetch('/api/bids', {
				method:  'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId: bidProject.id,
					vendorId:  vendor.id,
					amount:    Number(bidAmount) || null,
					timeline:  bidTimeline,
					scope:     bidScope,
				}),
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.message ?? 'Failed to submit bid');
			}
			bidProject = null;
			await invalidateAll();
		} catch (err: any) {
			bidErr = err.message ?? 'Failed to submit bid';
		} finally {
			bidSaving = false;
		}
	}

	const TYPE_COLORS: Record<string, string> = {
		campaign:   'bg-amber-900/40 text-amber-300 border-amber-700/50',
		tournament: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
		activation: 'bg-violet-900/40 text-violet-300 border-violet-700/50',
		event:      'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
	};

	const INPUT = 'w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-500 transition-colors';
	const LABEL = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide';
</script>

<svelte:head><title>Open Projects — FliHub Vendor Portal</title></svelte:head>

<div class="space-y-6">

	<div>
		<h1 class="text-2xl font-bold text-white">Open Projects</h1>
		<p class="text-slate-400 text-sm mt-1">Browse FLI Golf projects currently accepting bids. Submit your proposal directly from this page.</p>
	</div>

	{#if projects.length === 0}
		<div class="rounded-2xl border border-dashed border-slate-700 py-20 text-center">
			<FolderOpen class="size-10 text-slate-700 mx-auto mb-4" />
			<p class="text-slate-400 font-medium">No projects open for bidding right now.</p>
			<p class="text-slate-600 text-sm mt-1">Check back soon — new projects are added regularly.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4">
			{#each projects as project}
				{@const myBid = myBidByProject[project.id]}
				<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-2 flex-wrap">
								<h2 class="text-lg font-bold text-white">{project.name}</h2>
								<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize
									{TYPE_COLORS[project.type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}">
									{project.type?.replace('_',' ')}
								</span>
								{#if myBid}
									<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-900/40 text-emerald-300 border-emerald-700/50">
										✓ Bid submitted
									</span>
								{/if}
							</div>

							{#if project.description}
								<p class="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">{project.description}</p>
							{/if}

							<div class="flex flex-wrap gap-4 text-xs text-slate-500">
								{#if project.project_budget}
									<span class="flex items-center gap-1.5">
										<DollarSign class="size-3.5 text-emerald-400" />
										<span class="text-emerald-300 font-semibold">{fmt(project.project_budget)}</span> budget
									</span>
								{/if}
								{#if project.startDate}
									<span class="flex items-center gap-1.5">
										<Calendar class="size-3.5" />
										{fmtDate(project.startDate)}
										{#if project.endDate} → {fmtDate(project.endDate)}{/if}
									</span>
								{/if}
							</div>
						</div>

						<div class="shrink-0">
							{#if myBid}
								<div class="text-center">
									<div class="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold mb-1">
										<CheckCircle2 class="size-4" /> Bid Submitted
									</div>
									<p class="text-xs text-slate-500 capitalize">{myBid.status?.replace('_',' ')}</p>
								</div>
							{:else}
								<button
									onclick={() => openBid(project)}
									class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
								>
									<Send class="size-4" /> Submit Bid
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Bid submission modal -->
{#if bidProject}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

		<div class="flex items-center justify-between px-6 py-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
			<div>
				<h2 class="text-lg font-bold text-white">Submit Bid</h2>
				<p class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{bidProject.name}</p>
			</div>
			<button onclick={() => bidProject = null} class="text-slate-500 hover:text-white transition-colors">
				<X class="size-5" />
			</button>
		</div>

		<form onsubmit={submitBid} class="p-6 space-y-5">
			{#if bidErr}
				<div class="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">{bidErr}</div>
			{/if}

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class={LABEL}>Bid Amount ($)</label>
					<input bind:value={bidAmount} type="number" min="0" placeholder="0" class={INPUT} />
					{#if bidProject.project_budget}
						<p class="text-[10px] text-slate-500 mt-1">Project budget: {fmt(bidProject.project_budget)}</p>
					{/if}
				</div>
				<div>
					<label class={LABEL}>Timeline</label>
					<input bind:value={bidTimeline} type="text" placeholder="e.g. 6 weeks" class={INPUT} />
				</div>
			</div>

			<div>
				<label class={LABEL}>Scope of Work <span class="text-red-400">*</span></label>
				<textarea bind:value={bidScope} rows="5" required
					placeholder="Describe what you'll deliver, your approach, relevant experience, and why you're the right fit for this project…"
					class="{INPUT} resize-none"></textarea>
			</div>

			<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-1">
				<p class="font-semibold text-slate-300">What happens next?</p>
				<p>Your bid is submitted as <span class="text-blue-300">Submitted</span> and reviewed by the FLI Golf operations team.</p>
				<p>Shortlisted vendors will be contacted directly. You can track your bid status in <a href="/vendor/bids" class="text-orange-400 hover:underline">My Bids</a>.</p>
			</div>

			<div class="flex gap-3 pt-1">
				<button type="submit" disabled={bidSaving || !bidScope.trim()}
					class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					{#if bidSaving}
						<svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
						Submitting…
					{:else}
						<Send class="size-4" /> Submit Bid
					{/if}
				</button>
				<button type="button" onclick={() => bidProject = null}
					class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors">
					Cancel
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
