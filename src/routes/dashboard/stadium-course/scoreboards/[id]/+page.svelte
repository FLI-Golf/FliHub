<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData } from './$types';
	import {
		ArrowLeft, Monitor, MapPin, DollarSign, Hammer,
		CheckCircle2, Circle, AlertCircle, Plus, Trash2,
		Star, FileText, Wrench, Zap, ChevronDown, ChevronUp, X
	} from 'lucide-svelte';
	import { pipelineMove } from '$lib/pipeline';

	let { data }: { data: PageData } = $props();
	const getScoreboard = () => data.scoreboard;
	const getQuotes = () => data.quotes ?? [];
	const getChecklist = () => data.checklist ?? {};
	const getApproval = () => data.approval;
	const getExpense = () => data.expense;
	const getWorkOrder = () => data.workOrder;

	let sb        = $state(getScoreboard());
	let quotes    = $state<any[]>(getQuotes());
	let checklist = $state<Record<string, { id: string; label: string; checked: boolean }[]>>(getChecklist());
	let approval  = $state(getApproval());
	let expense   = $state(getExpense());
	let workOrder = $state(getWorkOrder());

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	// ── Stage config ──────────────────────────────────────────────────────────

	const STAGES = [
		{ key: 'concept',      label: 'Concept',      color: 'text-slate-300',   bg: 'bg-slate-700/40 border-slate-600' },
		{ key: 'design',       label: 'Design',       color: 'text-blue-300',    bg: 'bg-blue-900/30 border-blue-700' },
		{ key: 'vendor_quote', label: 'Vendor Quote', color: 'text-cyan-300',    bg: 'bg-cyan-900/30 border-cyan-700' },
		{ key: 'approval',     label: 'Approval',     color: 'text-yellow-300',  bg: 'bg-yellow-900/30 border-yellow-700' },
		{ key: 'procurement',  label: 'Procurement',  color: 'text-orange-300',  bg: 'bg-orange-900/30 border-orange-700' },
		{ key: 'fabrication',  label: 'Fabrication',  color: 'text-purple-300',  bg: 'bg-purple-900/30 border-purple-700' },
		{ key: 'installation', label: 'Installation', color: 'text-pink-300',    bg: 'bg-pink-900/30 border-pink-700' },
		{ key: 'testing',      label: 'Testing',      color: 'text-indigo-300',  bg: 'bg-indigo-900/30 border-indigo-700' },
		{ key: 'live',         label: 'Live',         color: 'text-emerald-300', bg: 'bg-emerald-900/30 border-emerald-700' },
		{ key: 'maintenance',  label: 'Maintenance',  color: 'text-teal-300',    bg: 'bg-teal-900/30 border-teal-700' },
		{ key: 'cancelled',    label: 'Cancelled',    color: 'text-red-300',     bg: 'bg-red-900/20 border-red-800' }
	];

	const currentStage = $derived(STAGES.find(s => s.key === sb.stage) ?? STAGES[0]);

	const nextStages = $derived(
		STAGES.filter(s => s.key !== sb.stage && s.key !== 'cancelled')
			.concat(sb.stage !== 'cancelled' ? [STAGES.find(s => s.key === 'cancelled')!] : [])
	);

	// ── Stage move ────────────────────────────────────────────────────────────

	let moveErr  = $state('');
	let moving   = $state(false);

	async function moveStage(toKey: string) {
		moving = true; moveErr = '';
		const result = await pipelineMove(`/api/scoreboards/${sb.id}`, toKey);
		moving = false;
		if (!result.ok) { moveErr = result.error?.message ?? 'Move failed'; return; }
		await invalidateAll();
		sb        = data.scoreboard;
		approval  = data.approval;
		expense   = data.expense;
		workOrder = data.workOrder;
	}

	// ── Checklist ─────────────────────────────────────────────────────────────

	let checkBusy = $state<Record<string, boolean>>({});
	let expandedPhase = $state<string | null>('design');

	async function toggleCheck(phase: string, itemId: string, checked: boolean) {
		checkBusy[itemId] = true;
		try {
			await fetch(`/api/scoreboards/${sb.id}/checklist`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId, phase, checked })
			});
			checklist[phase] = checklist[phase].map(i => i.id === itemId ? { ...i, checked } : i);
		} finally {
			checkBusy[itemId] = false;
		}
	}

	// ── Vendor quotes ─────────────────────────────────────────────────────────

	let showQuoteForm = $state(false);
	let quoteBusy     = $state(false);
	let quoteErr      = $state('');
	let quoteForm     = $state({ vendorName: '', amount: '', leadTimeDays: '', notes: '', selected: false });

	async function submitQuote(e: SubmitEvent) {
		e.preventDefault();
		if (!quoteForm.vendorName.trim() || !quoteForm.amount) { quoteErr = 'Vendor name and amount required'; return; }
		quoteBusy = true; quoteErr = '';
		try {
			const res = await fetch(`/api/scoreboards/${sb.id}/quotes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...quoteForm,
					amount:       Number(quoteForm.amount),
					leadTimeDays: quoteForm.leadTimeDays ? Number(quoteForm.leadTimeDays) : null
				})
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed'); }
			showQuoteForm = false;
			quoteForm = { vendorName: '', amount: '', leadTimeDays: '', notes: '', selected: false };
			await invalidateAll();
			quotes = data.quotes ?? [];
			sb = data.scoreboard;
		} catch (err: any) {
			quoteErr = err.message ?? 'Failed';
		} finally {
			quoteBusy = false;
		}
	}

	async function selectQuote(quoteId: string) {
		await fetch(`/api/scoreboards/${sb.id}/quotes/${quoteId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ selected: true })
		});
		await invalidateAll();
		quotes = data.quotes ?? [];
		sb = data.scoreboard;
	}

	async function deleteQuote(quoteId: string) {
		if (!confirm('Delete this quote?')) return;
		await fetch(`/api/scoreboards/${sb.id}/quotes/${quoteId}`, { method: 'DELETE' });
		await invalidateAll();
		quotes = data.quotes ?? [];
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';

	const TYPE_LABELS: Record<string, string> = { led: 'LED', static: 'Static', digital: 'Digital', hybrid: 'Hybrid' };
	const TYPE_COLORS: Record<string, string> = {
		led:     'bg-emerald-900/40 text-emerald-300 border-emerald-700',
		static:  'bg-slate-700 text-slate-300 border-slate-600',
		digital: 'bg-blue-900/40 text-blue-300 border-blue-700',
		hybrid:  'bg-purple-900/40 text-purple-300 border-purple-700'
	};

	const checklistPhases = $derived(Object.keys(checklist));
	const phaseProgress = $derived(
		Object.fromEntries(
			checklistPhases.map(p => [p, {
				done:  checklist[p].filter(i => i.checked).length,
				total: checklist[p].length
			}])
		)
	);
</script>

<svelte:head><title>{sb.name} — Scoreboard — FliHub</title></svelte:head>

<div class="space-y-6 max-w-4xl">

	<!-- Back + header -->
	<div>
		<Button href="/dashboard/stadium-course/scoreboards" variant="ghost"
			class="gap-2 text-slate-400 hover:text-slate-100 -ml-2 mb-2 text-sm">
			<ArrowLeft class="size-4" /> Scoreboard Pipeline
		</Button>
		<div class="flex items-start justify-between gap-4">
			<div>
				<div class="flex items-center gap-3 mb-1">
					<Monitor class="size-6 text-emerald-400 shrink-0" />
					<h1 class="text-2xl font-bold text-slate-100">{sb.name}</h1>
					<span class="text-[11px] px-2 py-0.5 rounded border font-medium {TYPE_COLORS[sb.displayType] ?? ''}">
						{TYPE_LABELS[sb.displayType] ?? sb.displayType}
					</span>
				</div>
				{#if sb.location}
					<p class="text-slate-400 text-sm flex items-center gap-1.5">
						<MapPin class="size-3.5" />{sb.location}
					</p>
				{/if}
			</div>
			<span class="text-xs px-2.5 py-1 rounded-lg border font-semibold shrink-0 {currentStage.bg} {currentStage.color}">
				{currentStage.label}
			</span>
		</div>
	</div>

	<!-- Stats row -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#if sb.widthFt && sb.heightFt}
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Dimensions</p>
				<p class="text-lg font-bold text-slate-100">{sb.widthFt}′ × {sb.heightFt}′</p>
			</Card>
		{/if}
		{#if sb.quotedCost}
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Quoted</p>
				<p class="text-lg font-bold text-slate-100">{fmt$(sb.quotedCost)}</p>
			</Card>
		{/if}
		{#if sb.approvedBudget}
			<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
				<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Approved Budget</p>
				<p class="text-lg font-bold text-emerald-300">{fmt$(sb.approvedBudget)}</p>
			</Card>
		{/if}
		{#if sb.actualCost}
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Actual Cost</p>
				<p class="text-lg font-bold text-slate-100">{fmt$(sb.actualCost)}</p>
			</Card>
		{/if}
		{#if sb.installDate}
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Install Date</p>
				<p class="text-base font-bold text-slate-100">{fmtDate(sb.installDate)}</p>
			</Card>
		{/if}
		{#if sb.warrantyExpiry}
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Warranty Expires</p>
				<p class="text-base font-bold text-slate-100">{fmtDate(sb.warrantyExpiry)}</p>
			</Card>
		{/if}
	</div>

	{#if sb.description}
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Description</p>
			<p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{sb.description}</p>
		</Card>
	{/if}

	<!-- Linked records -->
	{#if approval || expense || workOrder}
		<Card class="p-4 bg-slate-800/40 border-slate-700 space-y-2">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Linked Records</p>
			{#if approval}
				<div class="flex items-center gap-2 text-sm">
					<FileText class="size-4 text-yellow-400 shrink-0" />
					<span class="text-slate-400">Approval:</span>
					<span class="font-medium {approval.status === 'approved' ? 'text-emerald-400' : approval.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}">
						{approval.status}
					</span>
					{#if approval.comments}
						<span class="text-slate-500 text-xs truncate">— {approval.comments}</span>
					{/if}
				</div>
			{/if}
			{#if expense}
				<div class="flex items-center gap-2 text-sm">
					<DollarSign class="size-4 text-orange-400 shrink-0" />
					<span class="text-slate-400">Expense:</span>
					<a href="/dashboard/expenses" class="text-orange-400 hover:underline">{expense.title}</a>
					<span class="text-slate-500">{fmt$(expense.amount)} · {expense.status}</span>
				</div>
			{/if}
			{#if workOrder}
				<div class="flex items-center gap-2 text-sm">
					<Hammer class="size-4 text-purple-400 shrink-0" />
					<span class="text-slate-400">Work Order:</span>
					<a href="/dashboard/work-orders" class="text-purple-400 hover:underline">
						{workOrder.workOrderNumber ?? workOrder.title}
					</a>
					<span class="text-slate-500">{workOrder.status}</span>
				</div>
			{/if}
		</Card>
	{/if}

	<!-- Stage move -->
	<Card class="p-4 bg-slate-800/40 border-slate-700">
		<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Advance Stage</p>
		{#if moveErr}
			<p class="text-xs text-red-400 mb-2">{moveErr}</p>
		{/if}
		<div class="flex flex-wrap gap-2">
			{#each nextStages as stage}
				<button
					onclick={() => moveStage(stage.key)}
					disabled={moving}
					class="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
					       hover:opacity-80 disabled:opacity-40 {stage.bg} {stage.color}"
				>
					→ {stage.label}
				</button>
			{/each}
		</div>
	</Card>

	<!-- Vendor quotes -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-base font-semibold text-slate-100 flex items-center gap-2">
				<DollarSign class="size-4 text-cyan-400" /> Vendor Quotes
			</h2>
			<Button onclick={() => showQuoteForm = !showQuoteForm}
				class="gap-1.5 h-8 px-3 text-xs bg-cyan-700 hover:bg-cyan-600 text-white">
				<Plus class="size-3.5" /> Add Quote
			</Button>
		</div>

		{#if showQuoteForm}
			<form onsubmit={submitQuote} class="mb-4 p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
				{#if quoteErr}
					<p class="text-xs text-red-400">{quoteErr}</p>
				{/if}
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Vendor Name *</label>
						<input bind:value={quoteForm.vendorName} class={INPUT} placeholder="Daktronics" required />
					</div>
					<div>
						<label class={LABEL}>Amount ($) *</label>
						<input bind:value={quoteForm.amount} type="number" min="0" class={INPUT} placeholder="45000" required />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Lead Time (days)</label>
						<input bind:value={quoteForm.leadTimeDays} type="number" min="1" class={INPUT} placeholder="60" />
					</div>
					<div class="flex items-end pb-2">
						<label class="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
							<input type="checkbox" bind:checked={quoteForm.selected}
								class="rounded border-slate-600 bg-slate-800 text-emerald-500" />
							Mark as selected
						</label>
					</div>
				</div>
				<div>
					<label class={LABEL}>Notes</label>
					<input bind:value={quoteForm.notes} class={INPUT} placeholder="Includes installation, 2-year warranty…" />
				</div>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={() => showQuoteForm = false}
						class="h-8 px-3 text-xs border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={quoteBusy}
						class="h-8 px-3 text-xs bg-cyan-700 hover:bg-cyan-600 text-white">
						{quoteBusy ? 'Saving…' : 'Save Quote'}
					</Button>
				</div>
			</form>
		{/if}

		{#if quotes.length === 0}
			<p class="text-sm text-slate-500 text-center py-6">No quotes yet. Add vendor quotes to compare pricing.</p>
		{:else}
			<div class="space-y-2">
				{#each quotes as q (q.id)}
					<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg border
					            {q.selected ? 'bg-emerald-950/30 border-emerald-700/60' : 'bg-slate-800/60 border-slate-700'}">
						{#if q.selected}
							<Star class="size-4 text-emerald-400 shrink-0" />
						{:else}
							<button onclick={() => selectQuote(q.id)}
								class="text-slate-600 hover:text-emerald-400 transition-colors shrink-0"
								title="Select this quote">
								<Star class="size-4" />
							</button>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold text-slate-100">{q.vendorName}</p>
							{#if q.notes}
								<p class="text-xs text-slate-500 truncate">{q.notes}</p>
							{/if}
						</div>
						<span class="text-sm font-bold text-slate-100 shrink-0">{fmt$(q.amount)}</span>
						{#if q.leadTimeDays}
							<span class="text-xs text-slate-500 shrink-0">{q.leadTimeDays}d</span>
						{/if}
						{#if q.selected}
							<span class="text-[10px] px-1.5 py-0.5 rounded border bg-emerald-900/40 text-emerald-400 border-emerald-700 shrink-0">Selected</span>
						{/if}
						<button onclick={() => deleteQuote(q.id)}
							class="text-slate-600 hover:text-red-400 transition-colors shrink-0">
							<Trash2 class="size-3.5" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Phase checklists -->
	{#each checklistPhases as phase}
		{@const items = checklist[phase]}
		{@const prog  = phaseProgress[phase]}
		{@const pct   = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0}
		<Card class="overflow-hidden border-slate-700 bg-slate-800/40">
			<button
				onclick={() => expandedPhase = expandedPhase === phase ? null : phase}
				class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/40 transition-colors"
			>
				<div class="flex items-center gap-3">
					<span class="text-sm font-semibold text-slate-100 capitalize">{phase.replace('_', ' ')} Checklist</span>
					<span class="text-xs text-slate-500">{prog.done}/{prog.total}</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full {pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'} transition-all"
						     style="width: {pct}%"></div>
					</div>
					{#if expandedPhase === phase}
						<ChevronUp class="size-4 text-slate-500" />
					{:else}
						<ChevronDown class="size-4 text-slate-500" />
					{/if}
				</div>
			</button>
			{#if expandedPhase === phase}
				<div class="border-t border-slate-700 px-5 py-3 space-y-1.5">
					{#each items as item (item.id)}
						<label class="flex items-center gap-3 cursor-pointer group rounded-lg px-2 py-1.5 hover:bg-slate-700/40 transition-colors">
							<input type="checkbox" checked={item.checked}
								disabled={checkBusy[item.id]}
								onchange={(e) => toggleCheck(phase, item.id, (e.target as HTMLInputElement).checked)}
								class="sr-only" />
							{#if checkBusy[item.id]}
								<div class="size-5 rounded border border-slate-500 animate-pulse bg-slate-600 shrink-0"></div>
							{:else if item.checked}
								<CheckCircle2 class="size-5 text-emerald-400 shrink-0" />
							{:else}
								<Circle class="size-5 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
							{/if}
							<span class="text-sm {item.checked ? 'text-slate-500 line-through' : 'text-slate-200'} transition-colors">
								{item.label}
							</span>
						</label>
					{/each}
				</div>
			{/if}
		</Card>
	{/each}

	{#if sb.notes}
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Notes</p>
			<p class="text-sm text-slate-400 whitespace-pre-wrap">{sb.notes}</p>
		</Card>
	{/if}

</div>
