<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
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

	const filtered = $derived(bids.filter((b: any) => {
		const q = search.toLowerCase();
		const matchSearch = !q ||
			(b.expand?.vendorId?.name  ?? '').toLowerCase().includes(q) ||
			(b.expand?.projectId?.name ?? '').toLowerCase().includes(q);
		const matchProject = !filterProject || b.projectId === filterProject;
		const matchVendor  = !filterVendor  || b.vendorId  === filterVendor;
		return matchSearch && matchProject && matchVendor;
	}));

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
		{ key: 'rejected', label: 'Not Selected', colorClass: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
	];

	const boardConfig: PipelineBoardConfig = {
		columnWidth: 'w-64',
		stages:         STAGES,
		terminalStages: TERMINAL,
	};

	const boardItems = $derived<PipelineCardItem[]>(
		filtered.map((b: any) => ({
			id:       b.id,
			title:    b.expand?.vendorId?.name ?? 'Unknown Vendor',
			subtitle: b.expand?.projectId?.name ?? 'Unknown Project',
			status:   b.status,
			badge:    b.expand?.vendorId?.category
				? { label: b.expand.vendorId.category, colorClass: 'bg-slate-700 text-slate-300 border-slate-600' }
				: undefined,
			meta:     b.amount ? fmt(b.amount) + (b.timeline ? ` · ${b.timeline}` : '') : b.timeline ?? undefined,
		}))
	);

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
			const res = await fetch(`/api/bids/${id}`, {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
			});
			if (!res.ok) throw new Error('Failed');
			await invalidateAll();
		} catch (err) {
			console.error('bid patch failed:', err);
		} finally {
			moving = false;
		}
	}

	async function submitNote(e: SubmitEvent) {
		e.preventDefault();
		if (!noteModal) return;
		noteSaving = true;
		await patchBid(noteModal.bid.id, noteModal.toStage, noteText);
		noteModal  = null;
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
			{ label: 'Total Bids',    value: bids.length,                                                    color: 'border-l-slate-500' },
			{ label: 'Submitted',     value: (data as any).stageCounts?.submitted    ?? 0,                   color: 'border-l-blue-500' },
			{ label: 'Under Review',  value: (data as any).stageCounts?.under_review ?? 0,                   color: 'border-l-yellow-500' },
			{ label: 'Shortlisted',   value: (data as any).stageCounts?.shortlisted  ?? 0,                   color: 'border-l-violet-500' },
			{ label: 'Awarded',       value: (data as any).stageCounts?.awarded       ?? 0,                   color: 'border-l-emerald-500' },
		] as kpi}
			<Card class="p-4 border-l-4 {kpi.color} bg-slate-800/40">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
				<p class="text-2xl font-bold text-white">{kpi.value}</p>
			</Card>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3">
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
	</div>

	<!-- Board -->
	<div>
		<p class="text-xs text-slate-500 mb-3">Drag to advance · awarding a bid links the vendor to the project</p>
		<PipelineBoard config={boardConfig} items={boardItems} onmove={handleMove} />
	</div>

</div>

<!-- Award confirmation modal -->
{#if noteModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between px-6 py-5 border-b border-slate-800">
			<div>
				<h2 class="text-lg font-bold text-white">Award Bid</h2>
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
				Awarding this bid will link <strong>{noteModal.bid.expand?.vendorId?.name}</strong> to the project as a vendor.
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Award Notes (optional)</label>
				<textarea bind:value={noteText} rows="3" placeholder="Reason for selection, next steps, contract details…"
					class="w-full rounded-xl border border-slate-700 bg-slate-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none"></textarea>
			</div>
			<div class="flex gap-3">
				<button type="submit" disabled={noteSaving}
					class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					<CheckCircle2 class="size-4" /> {noteSaving ? 'Awarding…' : 'Confirm Award'}
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
