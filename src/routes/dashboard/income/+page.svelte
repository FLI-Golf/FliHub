<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import { invalidateAll } from '$app/navigation';
	import {
		DollarSign, CheckCircle2, Clock, AlertCircle,
		ArrowDownLeft, BookOpen, Receipt, Building2,
		Megaphone, FileText, RefreshCw, X, Ticket, Flag
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const records  = $derived(data.records ?? []);
	const metrics  = $derived(data.metrics);

	// ── Formatting ────────────────────────────────────────────────────────────
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// ── Source type config ────────────────────────────────────────────────────
	const SOURCE_CONFIG: Record<string, { label: string; colorClass: string }> = {
		sponsor_payment: { label: 'Sponsor',    colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
		franchise_fee:   { label: 'Franchise',  colorClass: 'bg-violet-900/50 text-violet-300 border-violet-700' },
		license:         { label: 'License',    colorClass: 'bg-blue-900/50 text-blue-300 border-blue-700' },
		broadcast:       { label: 'Broadcast',  colorClass: 'bg-orange-900/50 text-orange-300 border-orange-700' },
		ticket_sale:     { label: 'Tickets',    colorClass: 'bg-amber-900/50 text-amber-300 border-amber-700' },
		branding:        { label: 'Branding',   colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
		other:           { label: 'Other',      colorClass: 'bg-slate-700 text-slate-300 border-slate-600' },
	};

	// ── PipelineBoard config ──────────────────────────────────────────────────
	const STAGES = [
		{ key: 'invoiced',   label: 'Invoiced',    colorClass: 'bg-slate-700/50 text-slate-300 border-slate-600' },
		{ key: 'scheduled',  label: 'Scheduled',   colorClass: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		{ key: 'received',   label: 'Received',    colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		{ key: 'reconciled', label: 'Reconciled',  colorClass: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
	];

	const boardConfig: PipelineBoardConfig = {
		columnWidth: 'w-64',
		stages: STAGES,
		terminalStages: [],
	};

	const boardItems = $derived<PipelineCardItem[]>(
		records.map((r: any) => {
			const src = SOURCE_CONFIG[r.sourceType] ?? SOURCE_CONFIG.other;
			const hasQB = !!r.invoiceNumber;
			const hasWO = !!r.workOrderNumber;

			const metaParts: string[] = [];
			if (r.dueDate)         metaParts.push(`Due ${fmtDate(r.dueDate)}`);
			if (r.invoiceNumber)   metaParts.push(`QB: ${r.invoiceNumber}`);
			if (r.workOrderNumber) metaParts.push(`WO: ${r.workOrderNumber}`);

			return {
				id:       r.id,
				title:    r.sourceName,
				subtitle: r.description,
				status:   r.status,
				badge:    { label: src.label, colorClass: src.colorClass },
				tags:     [
					...(!hasQB && ['received','reconciled'].includes(r.status)
						? [{ label: '⚠ No QB ref', colorClass: 'bg-red-900/50 text-red-300 border-red-700' }]
						: []),
					...(hasWO ? [{ label: r.workOrderNumber, colorClass: 'bg-slate-700 text-slate-400 border-slate-600' }] : []),
				],
				meta: metaParts.join(' · ') || fmt(r.amount),
			} satisfies PipelineCardItem;
		})
	);

	// ── Move handler ──────────────────────────────────────────────────────────
	let moving      = $state(false);
	let editRecord  = $state<any>(null);
	let editFields  = $state({ invoiceNumber: '', workOrderNumber: '', notes: '', receivedDate: '' });
	let editSaving  = $state(false);
	let editErr     = $state('');

	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;

		// When moving to received/reconciled, open the QB ref modal first
		const full = records.find((r: any) => r.id === e.item.id);
		if (!full) return;

		if (['received', 'reconciled'].includes(e.to as string) && !full.invoiceNumber) {
			editRecord = { ...full, _pendingStage: e.to };
			editFields = {
				invoiceNumber:   full.invoiceNumber ?? '',
				workOrderNumber: full.workOrderNumber ?? '',
				notes:           full.notes ?? '',
				receivedDate:    full.receivedDate ?? new Date().toISOString().slice(0, 10),
			};
			return; // wait for modal submit
		}

		await patchIncome(full.id, full.sourceType, { status: e.to });
	}

	async function patchIncome(id: string, sourceType: string, body: Record<string, any>) {
		moving = true;
		try {
			const res = await fetch(`/api/income/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...body, sourceType }),
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
			await invalidateAll();
		} catch (err: any) {
			console.error('income patch failed:', err);
		} finally {
			moving = false;
		}
	}

	async function submitEdit(e: SubmitEvent) {
		e.preventDefault();
		if (!editRecord) return;
		editSaving = true;
		editErr = '';
		try {
			const res = await fetch(`/api/income/${editRecord.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sourceType:      editRecord.sourceType,
					status:          editRecord._pendingStage ?? editRecord.status,
					invoiceNumber:   editFields.invoiceNumber,
					workOrderNumber: editFields.workOrderNumber,
					receivedDate:    editFields.receivedDate,
					notes:           editFields.notes,
				}),
			});
			if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed');
			editRecord = null;
			await invalidateAll();
		} catch (err: any) {
			editErr = err.message ?? 'Failed to save';
		} finally {
			editSaving = false;
		}
	}

	// ── Amount by stage ───────────────────────────────────────────────────────
	const stageAmounts = $derived(
		STAGES.reduce<Record<string, number>>((acc, s) => {
			acc[s.key] = records
				.filter((r: any) => r.status === s.key)
				.reduce((sum: number, r: any) => sum + r.amount, 0);
			return acc;
		}, {})
	);
</script>

<svelte:head><title>Income Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Income Pipeline</h1>
			<p class="text-muted-foreground mt-1">Track every expected payment from invoice through to QuickBooks reconciliation</p>
		</div>
		{#if moving}
			<span class="text-xs text-slate-400 animate-pulse mt-2">Saving…</span>
		{/if}
	</div>

	<!-- Process guide -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<div class="space-y-4">
			<div class="flex items-start gap-3">
				<div class="p-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 shrink-0 mt-0.5">
					<BookOpen class="size-4 text-emerald-400" />
				</div>
				<div>
					<h3 class="text-sm font-semibold text-slate-200 mb-1">How the Income Pipeline works</h3>
					<p class="text-xs text-slate-400 leading-relaxed">
						Every expected incoming payment — sponsor installments, franchise fees, licensing royalties, broadcast rights — lives here as a card.
						Drag cards through the four stages as money moves. When a payment reaches <span class="text-emerald-300 font-medium">Received</span>,
						you'll be prompted to enter the <span class="text-yellow-300 font-medium">QuickBooks invoice number</span> and optional work order reference.
						Ina uses the QB number as the memo when entering the payment in QuickBooks — no direct integration needed, just a reference number lookup for reconciliation.
						Move to <span class="text-violet-300 font-medium">Reconciled</span> once the QB entry is confirmed.
					</p>
				</div>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
				{#each [
					{ stage: 'Invoiced',    color: 'border-slate-600 text-slate-300',    desc: 'Invoice sent or payment expected. QB invoice number may not be assigned yet.' },
					{ stage: 'Scheduled',   color: 'border-blue-700/60 text-blue-300',   desc: 'Payment date confirmed. QB invoice number assigned. Ina has it on the payment calendar.' },
					{ stage: 'Received',    color: 'border-emerald-700/60 text-emerald-300', desc: 'Funds landed in the account. Stamp the received date and confirm the QB invoice number.' },
					{ stage: 'Reconciled',  color: 'border-violet-700/60 text-violet-300', desc: 'Matched in QuickBooks. Audit trail complete — WO number + QB invoice number both on record.' },
				] as s}
					<div class="p-2.5 rounded-lg border {s.color} bg-slate-900/50">
						<p class="text-[11px] font-semibold {s.color.split(' ')[1]} mb-1">{s.stage}</p>
						<p class="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</Card>

	<!-- KPI metrics -->
	{#if metrics}
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Expected</p>
			<p class="text-2xl font-bold text-white">{fmt(metrics.totalExpected)}</p>
			<p class="text-xs text-slate-500 mt-1">{metrics.count} payment{metrics.count !== 1 ? 's' : ''} tracked</p>
		</Card>
		<Card class="p-5 bg-blue-950/40 border-blue-800/50">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Scheduled</p>
			<p class="text-2xl font-bold text-blue-300">{fmt(metrics.totalScheduled)}</p>
			<p class="text-xs text-slate-500 mt-1">Confirmed, awaiting receipt</p>
		</Card>
		<Card class="p-5 bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Received</p>
			<p class="text-2xl font-bold text-emerald-300">{fmt(metrics.totalReceived)}</p>
			<p class="text-xs text-slate-500 mt-1">Funds in account</p>
		</Card>
		<Card class="p-5 {metrics.missingQBRef > 0 ? 'bg-red-950/40 border-red-800/50' : 'bg-violet-950/40 border-violet-800/50'}">
			<p class="text-xs {metrics.missingQBRef > 0 ? 'text-red-400' : 'text-violet-400'} uppercase tracking-wide mb-1">Reconciled</p>
			<p class="text-2xl font-bold {metrics.missingQBRef > 0 ? 'text-red-300' : 'text-violet-300'}">{fmt(metrics.totalReconciled)}</p>
			{#if metrics.missingQBRef > 0}
				<p class="text-xs text-red-400 mt-1">⚠ {metrics.missingQBRef} missing QB ref</p>
			{:else}
				<p class="text-xs text-slate-500 mt-1">QB matched</p>
			{/if}
		</Card>
	</div>
	{/if}

	<!-- Stage value summary bar -->
	{#if metrics && metrics.totalExpected > 0}
	<div class="flex items-center gap-4 flex-wrap">
		{#each STAGES as s}
			{@const amt = stageAmounts[s.key] ?? 0}
			{@const pct = metrics.totalExpected > 0 ? (amt / metrics.totalExpected) * 100 : 0}
			<div class="flex items-center gap-2 text-xs">
				<div class="w-2 h-2 rounded-full {
					s.key === 'invoiced'   ? 'bg-slate-400' :
					s.key === 'scheduled'  ? 'bg-blue-400' :
					s.key === 'received'   ? 'bg-emerald-400' : 'bg-violet-400'
				}"></div>
				<span class="text-slate-400">{s.label}</span>
				<span class="font-semibold text-slate-200">{fmt(amt)}</span>
				<span class="text-slate-600">({pct.toFixed(0)}%)</span>
			</div>
		{/each}
	</div>
	{/if}

	<!-- Pipeline board -->
	<div>
		<div class="flex items-center gap-3 mb-3">
			<h2 class="text-lg font-semibold text-slate-200">Pipeline</h2>
			<span class="text-xs text-slate-500">Drag to advance · ⚠ red tag = missing QuickBooks reference</span>
		</div>
		<PipelineBoard
			config={boardConfig}
			items={boardItems}
			onmove={handleMove}
			showTerminal={false}
		/>
	</div>

	<!-- Source legend -->
	<div class="flex flex-wrap gap-3">
		{#each Object.entries(SOURCE_CONFIG) as [key, cfg]}
			<span class="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border {cfg.colorClass}">
				{#if key === 'sponsor_payment'}<Megaphone class="size-3" />
				{:else if key === 'franchise_fee'}<Building2 class="size-3" />
				{:else if key === 'license'}<FileText class="size-3" />
				{:else if key === 'broadcast'}<ArrowDownLeft class="size-3" />
				{:else if key === 'ticket_sale'}<Ticket class="size-3" />
				{:else if key === 'branding'}<Flag class="size-3" />
				{:else}<DollarSign class="size-3" />{/if}
				{cfg.label}
			</span>
		{/each}
		<a href="/dashboard/payments" class="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
			<Receipt class="size-3" /> All Payments & Income →
		</a>
	</div>

</div>

<!-- QB Reference Modal — shown when moving to received/reconciled without a QB ref -->
{#if editRecord}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
			<div>
				<h2 class="text-lg font-bold text-white">Mark as {editRecord._pendingStage ?? 'Received'}</h2>
				<p class="text-xs text-slate-400 mt-0.5">{editRecord.sourceName} — {fmt(editRecord.amount)}</p>
			</div>
			<button onclick={() => editRecord = null} class="text-slate-400 hover:text-white transition-colors">
				<X class="size-5" />
			</button>
		</div>

		<form onsubmit={submitEdit} class="p-6 space-y-4">
			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1">
					QuickBooks Invoice / Memo Reference <span class="text-red-400">*</span>
				</label>
				<input
					bind:value={editFields.invoiceNumber}
					type="text"
					placeholder="e.g. INV-2026-0042"
					required
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
				/>
				<p class="text-[10px] text-slate-500 mt-1">Ina enters this as the memo in QuickBooks for reconciliation.</p>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1">Work Order Number</label>
				<input
					bind:value={editFields.workOrderNumber}
					type="text"
					placeholder="e.g. WO-MKTG-0012"
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
				/>
				<p class="text-[10px] text-slate-500 mt-1">Links this payment to the internal approval that authorised it.</p>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1">Date Received</label>
				<input
					bind:value={editFields.receivedDate}
					type="date"
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
				/>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
				<textarea
					bind:value={editFields.notes}
					rows="2"
					placeholder="Any additional context…"
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500 resize-none"
				></textarea>
			</div>

			{#if editErr}
				<p class="text-xs text-red-400">{editErr}</p>
			{/if}

			<div class="flex gap-3 pt-2">
				<button
					type="submit"
					disabled={editSaving}
					class="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
				>
					{editSaving ? 'Saving…' : `Mark as ${editRecord._pendingStage ?? 'Received'}`}
				</button>
				<button
					type="button"
					onclick={() => editRecord = null}
					class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm transition-colors"
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
