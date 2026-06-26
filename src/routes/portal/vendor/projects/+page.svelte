<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { FolderOpen, Calendar, CheckCircle2, Clock, Trophy, X, Send, Paperclip, ChevronDown, ChevronUp, Trash2, Target } from 'lucide-svelte';

	// Per-status display config for existing bids
	const BID_STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
		submitted:    { label: 'Submitted',    color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  icon: Clock },
		under_review: { label: 'Under Review', color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: Clock },
		shortlisted:  { label: 'Shortlisted',  color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  icon: CheckCircle2 },
		awarded:      { label: 'Awarded',      color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Trophy },
		closed:       { label: 'Closed',       color: 'text-slate-400',   bg: 'bg-slate-700/30',   border: 'border-slate-600/50',   icon: CheckCircle2 },
		rejected:     { label: 'Not Selected', color: 'text-red-400',     bg: 'bg-red-900/20',     border: 'border-red-700/30',     icon: X },
	};

	let { data }: { data: PageData } = $props();

	const projects      = $derived((data as any).projects ?? []);
	const myBidsByProject = $derived((data as any).myBidsByProject ?? {});
	const myBidByProjectTask = $derived((data as any).myBidByProjectTask ?? {});
	const tasksByProject = $derived((data as any).tasksByProject ?? {});
	const vendor        = $derived((data as any).vendor);

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	}

	// ── Bid modal ─────────────────────────────────────────────────────────────
	let bidProject      = $state<any>(null);
	let bidAmount       = $state('');
	let bidTaskId       = $state('');
	let bidReferenceNumber = $state('');
	let bidMaterialsAmount = $state('');
	let bidLaborAmount = $state('');
	let bidLogisticsAmount = $state('');
	let bidOtherAmount = $state('');
	let bidTimeline     = $state('');
	let bidScope        = $state('');
	let bidSaving       = $state(false);
	let bidErr          = $state('');
	let attachmentsOpen = $state(false);
	let attachedFiles   = $state<File[]>([]);
	let fileInput       = $state<HTMLInputElement | null>(null);

	function openBid(project: any) {
		bidProject      = project;
		bidAmount       = '';
		bidTaskId       = '';
		bidReferenceNumber = '';
		bidMaterialsAmount = '';
		bidLaborAmount = '';
		bidLogisticsAmount = '';
		bidOtherAmount = '';
		bidTimeline     = '';
		bidScope        = '';
		bidErr          = '';
		attachmentsOpen = false;
		attachedFiles   = [];
	}

	const tasksForBidProject = $derived(bidProject ? (tasksByProject[bidProject.id] ?? []) : []);

	function num(v: string): number {
		const n = Number(v);
		return Number.isFinite(n) && n > 0 ? n : 0;
	}

	const breakdownTotal = $derived(
		num(bidMaterialsAmount) +
		num(bidLaborAmount) +
		num(bidLogisticsAmount) +
		num(bidOtherAmount)
	);

	const selectedTaskAlreadyBid = $derived(
		bidProject && bidTaskId ? myBidByProjectTask[`${bidProject.id}:${bidTaskId}`] : null
	);

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const picked = Array.from(input.files ?? []);
		// Deduplicate by name, cap at 5
		const existing = new Set(attachedFiles.map(f => f.name));
		for (const f of picked) {
			if (!existing.has(f.name) && attachedFiles.length < 5) {
				attachedFiles = [...attachedFiles, f];
				existing.add(f.name);
			}
		}
		input.value = '';
	}

	function removeFile(name: string) {
		attachedFiles = attachedFiles.filter(f => f.name !== name);
	}

	function fmtFileSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function submitBid(e: SubmitEvent) {
		e.preventDefault();
		if (!bidProject) { bidErr = 'No project selected.'; return; }
		if (!vendor)     { bidErr = 'Your account is not linked to a vendor. Contact support.'; return; }
		if (!bidTaskId)  { bidErr = 'Please choose the task you are bidding for.'; return; }
		if (selectedTaskAlreadyBid) { bidErr = 'You already submitted a bid for this task.'; return; }
		if (!bidScope.trim()) { bidErr = 'Scope of work is required.'; return; }
		if (breakdownTotal <= 0 && !bidAmount.trim()) {
			bidErr = 'Enter at least one amount value in the breakdown.';
			return;
		}
		bidSaving = true;
		bidErr    = '';
		try {
			const fd = new FormData();
			fd.append('projectId', bidProject.id);
			fd.append('vendorId',  vendor.id);
			fd.append('taskId',    bidTaskId);
			fd.append('referenceNumber', bidReferenceNumber.trim());
			fd.append('materialsAmount', String(num(bidMaterialsAmount)));
			fd.append('laborAmount', String(num(bidLaborAmount)));
			fd.append('logisticsAmount', String(num(bidLogisticsAmount)));
			fd.append('otherAmount', String(num(bidOtherAmount)));
			fd.append('amount',    String(breakdownTotal > 0 ? breakdownTotal : num(bidAmount)));
			fd.append('timeline',  bidTimeline);
			fd.append('scope',     bidScope);
			for (const file of attachedFiles) {
				fd.append('attachments', file);
			}

			const res = await fetch('/api/bids', { method: 'POST', body: fd });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(body.message ?? `Server error (${res.status})`);
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
				{@const projectBids = myBidsByProject[project.id] ?? []}
				{@const myBid = projectBids[0]}
				{@const taskCount = (tasksByProject[project.id] ?? []).length}
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
									{@const bs = BID_STATUS[myBid.status] ?? BID_STATUS.submitted}
									<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {bs.bg} {bs.color} {bs.border}">
										{bs.label}
									</span>
								{/if}
							</div>

							{#if project.description}
								<p class="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">{project.description}</p>
							{/if}

							<div class="flex flex-wrap gap-4 text-xs text-slate-500">
								<span class="flex items-center gap-1.5">
									<Target class="size-3.5 text-blue-400" />
									<span class="text-blue-300 font-semibold">{taskCount}</span> task{taskCount === 1 ? '' : 's'} open for bid
								</span>
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
								{@const bs = BID_STATUS[myBid.status] ?? BID_STATUS.submitted}
								<div class="flex flex-col items-end gap-1.5 min-w-[120px]">
									<div class="flex items-center gap-1.5 px-3 py-2 rounded-xl border {bs.bg} {bs.border}">
										<svelte:component this={bs.icon} class="size-3.5 {bs.color} shrink-0" />
										<span class="text-xs font-semibold {bs.color}">{bs.label}</span>
									</div>
									<p class="text-[11px] text-slate-500">{projectBids.length} bid{projectBids.length === 1 ? '' : 's'} submitted</p>
									<button
										onclick={() => openBid(project)}
										class="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
									>
										<Send class="size-3.5" /> Submit Another Bid
									</button>
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

			<div class="space-y-2">
				<label class={LABEL}>Target Task <span class="text-red-400">*</span></label>
				<select bind:value={bidTaskId} class={INPUT} required>
					<option value="">Select a task</option>
					{#each tasksForBidProject as task}
						<option value={task.id}>{task.title}</option>
					{/each}
				</select>
				{#if selectedTaskAlreadyBid}
					<p class="text-[11px] text-amber-400">You already bid on this task.</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class={LABEL}>Reference / Quote #</label>
					<input bind:value={bidReferenceNumber} type="text" placeholder="e.g. BBT-Q-2026-041" class={INPUT} />
				</div>
				<div>
					<label class={LABEL}>Timeline</label>
					<input bind:value={bidTimeline} type="text" placeholder="e.g. 6 weeks" class={INPUT} />
				</div>
			</div>

			<div>
				<label class={LABEL}>Bid Amount Breakdown</label>
				<div class="grid grid-cols-2 gap-3">
					<input bind:value={bidMaterialsAmount} type="number" min="0" step="0.01" placeholder="Materials" class={INPUT} />
					<input bind:value={bidLaborAmount} type="number" min="0" step="0.01" placeholder="Labor" class={INPUT} />
					<input bind:value={bidLogisticsAmount} type="number" min="0" step="0.01" placeholder="Logistics" class={INPUT} />
					<input bind:value={bidOtherAmount} type="number" min="0" step="0.01" placeholder="Other" class={INPUT} />
				</div>
				<div class="mt-2 text-xs text-slate-400 flex items-center justify-between">
					<span>Calculated total</span>
					<span class="text-emerald-300 font-semibold">{fmt(breakdownTotal)}</span>
				</div>
			</div>

			<div>
				<label class={LABEL}>Scope of Work <span class="text-red-400">*</span></label>
				<textarea bind:value={bidScope} rows="5"
					placeholder="Describe what you'll deliver, your approach, relevant experience, and why you're the right fit for this project…"
					class="{INPUT} resize-none"></textarea>
			</div>

			<!-- Collapsible attachments -->
			<div class="rounded-xl border border-slate-700 overflow-hidden">
				<button
					type="button"
					onclick={() => attachmentsOpen = !attachmentsOpen}
					class="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors text-sm"
				>
					<span class="flex items-center gap-2 font-medium text-slate-300">
						<Paperclip class="size-4 text-slate-400" />
						Attachments
						{#if attachedFiles.length > 0}
							<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
								{attachedFiles.length}
							</span>
						{/if}
					</span>
					{#if attachmentsOpen}
						<ChevronUp class="size-4 text-slate-500" />
					{:else}
						<ChevronDown class="size-4 text-slate-500" />
					{/if}
				</button>

				{#if attachmentsOpen}
					<div class="px-4 py-4 space-y-3 border-t border-slate-700 bg-slate-900/40">
						<p class="text-xs text-slate-500">Add photos, portfolios, quotes, or supporting documents. Max 5 files, 10 MB each.</p>

						<!-- File list -->
						{#if attachedFiles.length > 0}
							<ul class="space-y-2">
								{#each attachedFiles as file}
									<li class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
										<div class="flex items-center gap-2 min-w-0">
											<Paperclip class="size-3.5 text-slate-400 shrink-0" />
											<span class="text-xs text-slate-300 truncate">{file.name}</span>
											<span class="text-[10px] text-slate-500 shrink-0">{fmtFileSize(file.size)}</span>
										</div>
										<button type="button" onclick={() => removeFile(file.name)}
											class="text-slate-600 hover:text-red-400 transition-colors shrink-0">
											<Trash2 class="size-3.5" />
										</button>
									</li>
								{/each}
							</ul>
						{/if}

						{#if attachedFiles.length < 5}
							<button
								type="button"
								onclick={() => fileInput?.click()}
								class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-orange-500/50 hover:bg-orange-500/5 text-slate-400 hover:text-orange-300 text-xs font-medium transition-colors"
							>
								<Paperclip class="size-3.5" /> Choose files
							</button>
							<input
								bind:this={fileInput}
								type="file"
								multiple
								accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
								onchange={onFileChange}
								class="hidden"
							/>
						{/if}
					</div>
				{/if}
			</div>

			<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-1">
				<p class="font-semibold text-slate-300">What happens next?</p>
				<p>Your bid is submitted as <span class="text-blue-300">Pending</span> and reviewed by the FLI Golf operations team.</p>
				<p>Shortlisted vendors will be contacted directly. You can track your bid status in <a href="/portal/vendor/bids" class="text-orange-400 hover:underline">My Bids</a>.</p>
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
