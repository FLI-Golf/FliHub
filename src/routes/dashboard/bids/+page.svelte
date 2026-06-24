<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll, goto } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import { Send, Building2, FolderOpen, CheckCircle2, X, Search } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const bids     = $derived((data as any).bids    ?? []);
	const projects = $derived((data as any).projects ?? []);
	const vendors  = $derived((data as any).vendors  ?? []);

	// ── Filters ───────────────────────────────────────────────────────────────
	let filterProject = $state('');
	let filterVendor  = $state('');
	let search        = $state('');
	let minAmount     = $state('');
	let maxAmount     = $state('');
	let sortBy        = $state('created_desc');

	const STAGE_OPTIONS = ['submitted', 'under_review', 'shortlisted', 'awarded', 'not_selected', 'closed'];
	let selectedStages = $state<string[]>([...STAGE_OPTIONS]);

	const APPROVAL_OPTIONS = ['pending', 'approved', 'rejected'];
	let selectedApprovalStatuses = $state<string[]>([...APPROVAL_OPTIONS]);

	function toggleStage(stage: string) {
		selectedStages = selectedStages.includes(stage)
			? selectedStages.filter((s) => s !== stage)
			: [...selectedStages, stage];
	}

	function toggleApprovalStatus(status: string) {
		selectedApprovalStatuses = selectedApprovalStatuses.includes(status)
			? selectedApprovalStatuses.filter((s) => s !== status)
			: [...selectedApprovalStatuses, status];
	}

	function resetFilters() {
		filterProject = '';
		filterVendor = '';
		search = '';
		minAmount = '';
		maxAmount = '';
		sortBy = 'created_desc';
		selectedStages = [...STAGE_OPTIONS];
		selectedApprovalStatuses = [...APPROVAL_OPTIONS];
	}

	const filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		const min = minAmount ? Number(minAmount) : null;
		const max = maxAmount ? Number(maxAmount) : null;

		let list = bids.filter((b: any) => {
			const approvalStatus = (data.approvalByBid as Record<string, string>)?.[b.id] ?? '';
			const hasApproval = Boolean(approvalStatus);

			const matchSearch = !q ||
				(b.expand?.vendorId?.name  ?? '').toLowerCase().includes(q) ||
				(b.expand?.projectId?.name ?? '').toLowerCase().includes(q) ||
				(b.expand?.taskId?.title   ?? '').toLowerCase().includes(q) ||
				String(b.referenceNumber ?? '').toLowerCase().includes(q) ||
				String(b.scope ?? '').toLowerCase().includes(q) ||
				String(b.notes ?? '').toLowerCase().includes(q);

			if (!matchSearch) return false;
			if (filterProject && b.projectId !== filterProject) return false;
			if (filterVendor && b.vendorId !== filterVendor) return false;
			if (selectedStages.length > 0 && !selectedStages.includes(b.status)) return false;

			if (hasApproval) {
				if (selectedApprovalStatuses.length > 0 && !selectedApprovalStatuses.includes(approvalStatus)) return false;
			}

			const amount = Number(b.amount ?? 0);
			if (min !== null && !Number.isNaN(min) && amount < min) return false;
			if (max !== null && !Number.isNaN(max) && amount > max) return false;

			return true;
		});

		list = [...list].sort((a: any, b: any) => {
			switch (sortBy) {
				case 'amount_desc':
					return Number(b.amount ?? 0) - Number(a.amount ?? 0);
				case 'amount_asc':
					return Number(a.amount ?? 0) - Number(b.amount ?? 0);
				case 'vendor_az':
					return String(a.expand?.vendorId?.name ?? '').localeCompare(String(b.expand?.vendorId?.name ?? ''));
				case 'project_az':
					return String(a.expand?.projectId?.name ?? '').localeCompare(String(b.expand?.projectId?.name ?? ''));
				case 'created_asc':
					return new Date(a.created ?? 0).getTime() - new Date(b.created ?? 0).getTime();
				case 'created_desc':
				default:
					return new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime();
			}
		});

		return list;
	});

	// ── Formatting ────────────────────────────────────────────────────────────
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}

	// ── PipelineBoard ─────────────────────────────────────────────────────────
	const STAGES = [
		{ key: 'submitted',    label: 'Submitted',    colorClass: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		{ key: 'under_review', label: 'Under Review', colorClass: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
		{ key: 'shortlisted',  label: 'Shortlisted',  colorClass: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
		{ key: 'awarded',      label: 'Awarded',      colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
	];
	const TERMINAL = [
		{ key: 'not_selected', label: 'Not Selected', colorClass: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
		{ key: 'closed',       label: 'Closed',       colorClass: 'bg-slate-800/60 text-slate-500 border-slate-700/40' },
	];

	const boardConfig: PipelineBoardConfig = {
		columnWidth: 'w-64',
		stages:         STAGES,
		terminalStages: TERMINAL,
	};

	const approvalBadge: Record<string, { label: string; colorClass: string }> = {
		pending:  { label: '⏳ Awaiting Approval', colorClass: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
		approved: { label: '✓ Approved',           colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		rejected: { label: '✗ Rejected',           colorClass: 'bg-red-900/40 text-red-300 border-red-700/50' },
	};

	const boardItems = $derived<PipelineCardItem[]>(
		filtered.map((b: any) => {
			const po             = (data.poByBid       as Record<string, string>)?.[b.id];
			const approvalStatus = (data.approvalByBid as Record<string, string>)?.[b.id];
			const amountStr      = b.amount ? `Total ${fmt(b.amount)}` : '';
			const materialsStr   = b.materialsAmount ? `M ${fmt(b.materialsAmount)}` : '';
			const laborStr       = b.laborAmount ? `L ${fmt(b.laborAmount)}` : '';
			const logisticsStr   = b.logisticsAmount ? `G ${fmt(b.logisticsAmount)}` : '';
			const otherStr       = b.otherAmount ? `O ${fmt(b.otherAmount)}` : '';
			const timelineStr    = b.timeline ? `· ${b.timeline}`   : '';
			const poStr          = po         ? `· ${po}`           : '';
			const tags: Array<{ label: string; colorClass: string }> = [];
			if (b.expand?.taskId?.title) {
				tags.push({ label: `Task: ${b.expand.taskId.title}`, colorClass: 'bg-blue-900/30 text-blue-300 border-blue-700/50' });
			}
			if (b.referenceNumber) {
				tags.push({ label: `Ref: ${b.referenceNumber}`, colorClass: 'bg-slate-700/50 text-slate-200 border-slate-600/60' });
			}

			// For awarded bids show approval state; otherwise show vendor category
			const badge = b.status === 'awarded' && approvalStatus
				? approvalBadge[approvalStatus]
				: b.expand?.vendorId?.category
					? { label: b.expand.vendorId.category, colorClass: 'bg-slate-700 text-slate-300 border-slate-600' }
					: undefined;

			return {
				id:       b.id,
				title:    b.expand?.vendorId?.name ?? 'Unknown Vendor',
				subtitle: b.expand?.projectId?.name ?? 'Unknown Project',
				status:   b.status,
				badge,
				tags: tags.length ? tags : undefined,
				meta:     [amountStr, materialsStr, laborStr, logisticsStr, otherStr, timelineStr, poStr].filter(Boolean).join(' · ') || undefined,
			};
		})
	);

	const filteredStageCounts = $derived.by(() => {
		const counts: Record<string, number> = {
			submitted: 0,
			under_review: 0,
			shortlisted: 0,
			awarded: 0,
			not_selected: 0,
			closed: 0,
		};
		for (const bid of filtered) {
			counts[bid.status] = (counts[bid.status] ?? 0) + 1;
		}
		return counts;
	});

	// ── Stage advance ─────────────────────────────────────────────────────────
	let moving     = $state(false);
	let noteModal  = $state<{ bid: any; toStage: string } | null>(null);
	let noteText   = $state('');
	let noteSaving = $state(false);

	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;
		const full = bids.find((b: any) => b.id === e.item.id);
		if (!full) return;

		// Prompt for notes when awarding
		if (e.to === 'awarded') {
			noteModal = { bid: full, toStage: e.to as string };
			noteText  = '';
			return;
		}
		await patchBid(e.item.id, e.to as string);
	}

	async function patchBid(id: string, status: string, notes?: string) {
		moving = true;
		try {
			console.log('[patchBid] fetching PATCH /api/bids/' + id, { status, notes });
			const res = await fetch(`/api/bids/${id}`, {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
			});
			console.log('[patchBid] response status:', res.status, res.statusText);
			const data = await res.json().catch(() => ({}));
			console.log('[patchBid] response body:', JSON.stringify(data));
			if (!res.ok) {
				console.error('bid patch failed:', res.status, data);
				throw new Error(data.message ?? 'Failed');
			}
			if (status === 'awarded') {
				await goto('/dashboard/approvals');
			} else {
				await invalidateAll();
			}
		} catch (err) {
			console.error('bid patch error:', err);
		} finally {
			moving = false;
		}
	}

	async function submitNote(e: SubmitEvent) {
		e.preventDefault();
		if (!noteModal) return;
		noteSaving = true;
		const bidId   = noteModal.bid.id;
		const toStage = noteModal.toStage;
		const notes   = noteText;
		noteModal  = null;
		noteText   = '';
		console.log('[submitNote] calling patchBid', bidId, toStage);
		await patchBid(bidId, toStage, notes);
		noteSaving = false;
	}
</script>

<svelte:head><title>Bid Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Bid Pipeline</h1>
			<p class="text-muted-foreground mt-1">Review and advance vendor bids across all open projects</p>
		</div>
		{#if moving}<span class="text-xs text-slate-400 animate-pulse mt-2">Saving…</span>{/if}
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
		{#each [
			{ label: 'Total Bids',    value: filtered.length,                      sub: `${filtered.length} of ${bids.length}`, color: 'border-l-slate-500' },
			{ label: 'Submitted',     value: filteredStageCounts.submitted ?? 0,   sub: null,                                    color: 'border-l-blue-500' },
			{ label: 'Under Review',  value: filteredStageCounts.under_review ?? 0,sub: null,                                    color: 'border-l-yellow-500' },
			{ label: 'Shortlisted',   value: filteredStageCounts.shortlisted ?? 0, sub: null,                                    color: 'border-l-violet-500' },
			{ label: 'Awarded',       value: filteredStageCounts.awarded ?? 0,     sub: null,                                    color: 'border-l-emerald-500' },
		] as kpi}
			<Card class="p-4 border-l-4 {kpi.color} bg-slate-800/40">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
				<p class="text-2xl font-bold text-white">{kpi.value}</p>
				{#if kpi.sub}
					<p class="text-[10px] text-slate-500 mt-1">{kpi.sub}</p>
				{/if}
			</Card>
		{/each}
	</div>

	<!-- Filters -->
	<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-4">
		<div class="flex flex-wrap gap-3 items-end">
			<div class="relative flex-1 min-w-48 max-w-xs">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
			<input bind:value={search} placeholder="Search vendor or project…"
				class="w-full rounded-lg bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500" />
		</div>
			<select bind:value={filterProject}
				class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500">
				<option value="">All projects</option>
				{#each projects as p}<option value={p.id}>{p.name}</option>{/each}
			</select>
			<select bind:value={filterVendor}
				class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500">
				<option value="">All vendors</option>
				{#each vendors as v}<option value={v.id}>{v.name}</option>{/each}
			</select>
			<input bind:value={minAmount} type="number" min="0" placeholder="Min amount"
				class="w-36 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500" />
			<input bind:value={maxAmount} type="number" min="0" placeholder="Max amount"
				class="w-36 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500" />
			<select bind:value={sortBy}
				class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500">
				<option value="created_desc">Newest first</option>
				<option value="created_asc">Oldest first</option>
				<option value="amount_desc">Amount high → low</option>
				<option value="amount_asc">Amount low → high</option>
				<option value="vendor_az">Vendor A → Z</option>
				<option value="project_az">Project A → Z</option>
			</select>
			<button type="button" onclick={resetFilters}
				class="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors">Reset</button>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Stage</span>
			{#each STAGE_OPTIONS as stage}
				<button
					type="button"
					onclick={() => toggleStage(stage)}
					class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedStages.includes(stage)
						? 'bg-blue-900/30 text-blue-300 border-blue-700/50'
						: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
				>
					{stage.replace('_', ' ')}
				</button>
			{/each}
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Approval</span>
			{#each APPROVAL_OPTIONS as s}
				<button
					type="button"
					onclick={() => toggleApprovalStatus(s)}
					class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedApprovalStatuses.includes(s)
						? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'
						: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
				>
					{s}
				</button>
			{/each}
		</div>

		<p class="text-xs text-slate-500">Showing {filtered.length} of {bids.length} bids</p>
	</div>

	<!-- Board -->
	<div>
		<p class="text-xs text-slate-500 mb-3">Drag to advance · awarding a bid links the vendor to the project</p>
		{#if boardItems.length === 0}
			<Card class="p-8 text-center border-slate-700 bg-slate-900/30">
				<p class="text-slate-300 font-medium">No bids match these filters</p>
				<p class="text-xs text-slate-500 mt-1">Try broadening search criteria or reset filters.</p>
				<button type="button" onclick={resetFilters}
					class="mt-3 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors">Reset Filters</button>
			</Card>
		{:else}
			<PipelineBoard config={boardConfig} items={boardItems} onmove={handleMove} />
		{/if}
	</div>

</div>

<!-- Award confirmation modal -->
{#if noteModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between px-6 py-5 border-b border-slate-800">
			<div>
				<h2 class="text-lg font-bold text-white">Award Bid & Create Approval</h2>
				<p class="text-xs text-slate-400 mt-0.5">
					{noteModal.bid.expand?.vendorId?.name} — {noteModal.bid.expand?.projectId?.name}
				</p>
			</div>
			<button onclick={() => noteModal = null} class="text-slate-500 hover:text-white transition-colors">
				<X class="size-5" />
			</button>
		</div>
		<form onsubmit={submitNote} class="p-6 space-y-4">
			<div class="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4 text-sm text-emerald-300">
				Awarding this bid will link <strong>{noteModal.bid.expand?.vendorId?.name}</strong> to the project and raise a pending approval. Once approved, a Work Order is created to track the vendor spend.
			</div>
			<div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2 text-xs">
				<div class="flex justify-between gap-3"><span class="text-slate-400">Project</span><span class="text-slate-200 text-right">{noteModal.bid.expand?.projectId?.name ?? '—'}</span></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Task</span><span class="text-blue-300 text-right">{noteModal.bid.expand?.taskId?.title ?? '—'}</span></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Reference</span><span class="text-slate-200 text-right">{noteModal.bid.referenceNumber || '—'}</span></div>
				<div class="h-px bg-slate-700 my-1"></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Materials</span><span class="text-slate-200">{fmt(noteModal.bid.materialsAmount ?? 0)}</span></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Labor</span><span class="text-slate-200">{fmt(noteModal.bid.laborAmount ?? 0)}</span></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Logistics</span><span class="text-slate-200">{fmt(noteModal.bid.logisticsAmount ?? 0)}</span></div>
				<div class="flex justify-between gap-3"><span class="text-slate-400">Other</span><span class="text-slate-200">{fmt(noteModal.bid.otherAmount ?? 0)}</span></div>
				<div class="h-px bg-slate-700 my-1"></div>
				<div class="flex justify-between gap-3"><span class="text-slate-300 font-semibold">Bid Total</span><span class="text-emerald-300 font-semibold">{fmt(noteModal.bid.amount ?? 0)}</span></div>
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes (optional)</label>
				<textarea bind:value={noteText} rows="3" placeholder="Reason for selection, next steps, contract details…"
					class="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none"></textarea>
			</div>
			<div class="flex gap-3">
				<button type="submit" disabled={noteSaving}
					class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					<CheckCircle2 class="size-4" /> {noteSaving ? 'Awarding…' : 'Create Approval'}
				</button>
				<button type="button" onclick={() => noteModal = null}
					class="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm transition-colors">
					Cancel
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
