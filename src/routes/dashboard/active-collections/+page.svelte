<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import {
		PIPELINE_STAGES, CLOSED_STAGES,
		SPONSOR_STATUS_LABELS, SPONSOR_STATUS_COLORS,
		SPONSOR_TIER_LABELS, SPONSOR_TIER_COLORS,
	} from '$lib/domain/schemas/sponsor.schema';
	import {
		DollarSign, ChevronDown, CheckCircle2, Clock, AlertCircle,
		ScrollText, Building2, UserCircle, X, FileText, Printer,
		Download, History, TriangleAlert, Ban, ArrowRight, Plus
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const sponsors  = $derived((data as any).sponsors  ?? []);
	const summary   = $derived((data as any).summary   ?? {});
	const userRole  = $derived((data as any).userRole  ?? null);
	const isAdmin   = $derived(userRole === 'admin');

	// ── Kanban board (pipeline_stage drag-drop) ───────────────────────────────
	const boardConfig = $derived<PipelineBoardConfig>({
		columnWidth: 'w-56',
		stages: PIPELINE_STAGES.map((s: string) => ({
			key: s,
			label: SPONSOR_STATUS_LABELS[s] ?? s,
			colorClass: SPONSOR_STATUS_COLORS[s] ?? '',
		})),
		terminalStages: CLOSED_STAGES.map((s: string) => ({
			key: s,
			label: SPONSOR_STATUS_LABELS[s as keyof typeof SPONSOR_STATUS_LABELS] ?? s,
			colorClass: SPONSOR_STATUS_COLORS[s as keyof typeof SPONSOR_STATUS_COLORS] ?? '',
		})),
	});

	const boardItems = $derived<PipelineCardItem[]>(
		sponsors.map((sp: any) => {
			const r   = sp._rollup;
			const rep = sp.expand?.assignedTo;
			const repLabel = rep ? ([rep.firstName, rep.lastName].filter(Boolean).join(' ') || rep.email) : null;
			const pct = sp.annualCommitment > 0
				? Math.min(100, Math.round((r.received / sp.annualCommitment) * 100))
				: 0;
			const tags: any[] = [];
			if (repLabel) tags.push({ label: `👤 ${repLabel}`, colorClass: 'bg-slate-700/60 text-slate-400 border-slate-600/50' });
			if (r.overdue > 0)   tags.push({ label: `⚠ Overdue`,  colorClass: 'bg-red-900/50 text-red-300 border-red-700/50' });
			if (r.disputed > 0)  tags.push({ label: `⚡ Disputed`, colorClass: 'bg-orange-900/50 text-orange-300 border-orange-700/50' });
			if (r.write_off > 0 || r.bad_debt > 0) tags.push({ label: `✗ Write-off`, colorClass: 'bg-slate-800 text-slate-500 border-slate-700' });
			return {
				id:       sp.id,
				title:    sp.companyName,
				subtitle: `${fmt(r.received)} / ${fmt(sp.annualCommitment ?? 0)} (${pct}%)`,
				status:   sp.pipeline_stage ?? sp.status ?? 'prospect',
				href:     `/dashboard/sponsors/${sp.id}`,
				badge: {
					label:      SPONSOR_TIER_LABELS[sp.tier as keyof typeof SPONSOR_TIER_LABELS] ?? sp.tier,
					colorClass: SPONSOR_TIER_COLORS[sp.tier as keyof typeof SPONSOR_TIER_COLORS] ?? 'bg-slate-700 text-slate-300 border-slate-600',
				},
				tags,
				meta: sp.annualCommitment ? fmt(sp.annualCommitment) + '/yr' : undefined,
				raw: sp,
			};
		})
	);

	let moving = $state(false);
	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;
		moving = true;
		try {
			const res = await fetch(`/api/sponsors/${e.item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pipeline_stage: e.to }),
			});
			if (!res.ok) throw new Error('Failed to update stage');
			await invalidateAll();
		} catch (err) {
			console.error('Stage move failed:', err);
		} finally {
			moving = false;
		}
	}

	// ── Detail panel (expanded sponsor) ──────────────────────────────────────
	let expanded = $state<Record<string, boolean>>({});
	const toggle = (id: string) => expanded = { ...expanded, [id]: !expanded[id] };
	let showAudit = $state<Record<string, boolean>>({});
	const toggleAudit = (id: string) => showAudit = { ...showAudit, [id]: !showAudit[id] };

	// ── PO actions ────────────────────────────────────────────────────────────
	let poLoading = $state(false);

	// Modals
	let receivedModal  = $state<any>(null);
	let partialModal   = $state<any>(null);  // PO record
	let disputeModal   = $state<any>(null);  // PO record
	let resolveModal   = $state<any>(null);  // PO record
	let writeOffModal  = $state<any>(null);  // PO record
	let reportLoading  = $state<Record<string, boolean>>({});

	let receivedForm = $state({ receivedDate: today(), notes: '', qbTransactionId: '' });
	let partialForm  = $state({ partialAmount: '', receivedDate: today(), notes: '' });
	let disputeForm  = $state({ disputeReason: '' });
	let resolveForm  = $state({ resolvedNotes: '' });
	let writeOffForm = $state({ writeOffReason: '' });
	let modalErr     = $state('');
	let modalLoading = $state(false);

	function today() { return new Date().toISOString().slice(0, 10); }

	async function updatePO(poId: string, status: string, extra: Record<string, any> = {}) {
		poLoading = true;
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${poId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, ...extra }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			await invalidateAll();
		} catch (e: any) {
			alert(e.message);
		} finally {
			poLoading = false;
		}
	}

	async function markPaymentReceived() {
		if (!receivedModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-payments/${receivedModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'received', ...receivedForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			receivedModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	async function submitPartial() {
		if (!partialModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${partialModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'partial', ...partialForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			partialModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	async function submitDispute() {
		if (!disputeModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${disputeModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'disputed', ...disputeForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			disputeModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	async function submitResolve() {
		if (!resolveModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${resolveModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'resolved', ...resolveForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			resolveModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	async function submitWriteOff() {
		if (!writeOffModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${writeOffModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'write_off', ...writeOffForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			writeOffModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	// ── Report (print + PDF) ──────────────────────────────────────────────────
	async function generateReport(sp: any, format: 'pdf' | 'print') {
		const id = sp.id;
		reportLoading = { ...reportLoading, [id]: true };
		try {
			if (format === 'print') {
				window.open(`/api/sponsors/${id}/collections-report?format=print`, '_blank');
				return;
			}
			const res = await fetch(`/api/sponsors/${id}/collections-report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sponsor: $state.snapshot(sp) }),
			});
			if (!res.ok) { alert('Report failed'); return; }
			const blob = await res.blob();
			const url  = URL.createObjectURL(blob);
			const a    = document.createElement('a');
			a.href     = url;
			a.download = `${sp.companyName.replace(/\s+/g, '-').toLowerCase()}-collections-${today()}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 10000);
		} finally {
			reportLoading = { ...reportLoading, [id]: false };
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		const dt = new Date(d);
		return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	function fmtDateTime(d: string) {
		if (!d) return '—';
		const dt = new Date(d);
		return isNaN(dt.getTime()) ? d : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}
	function repName(sp: any) {
		const p = sp?.expand?.assignedTo;
		if (!p) return null;
		return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || null;
	}

	const PO_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
		draft:        { label: 'Draft',        color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600' },
		sent:         { label: 'Sent',         color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
		acknowledged: { label: 'Acknowledged', color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
		invoiced:     { label: 'Invoiced',     color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
		partial:      { label: 'Partial',      color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
		paid:         { label: 'Paid ✓',       color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
		overdue:      { label: 'Overdue',      color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
		disputed:     { label: 'Disputed',     color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
		resolved:     { label: 'Resolved',     color: 'text-teal-300',    bg: 'bg-teal-500/10',    border: 'border-teal-500/30' },
		write_off:    { label: 'Write-Off',    color: 'text-slate-400',   bg: 'bg-slate-800',      border: 'border-slate-700' },
		bad_debt:     { label: 'Bad Debt',     color: 'text-slate-400',   bg: 'bg-slate-800',      border: 'border-slate-700' },
		cancelled:    { label: 'Cancelled',    color: 'text-slate-500',   bg: 'bg-slate-800',      border: 'border-slate-700' },
	};

	const PMT_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
		scheduled: { label: 'Scheduled', color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600' },
		invoiced:  { label: 'Invoiced',  color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
		partial:   { label: 'Partial',   color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
		overdue:   { label: 'Overdue',   color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
		disputed:  { label: 'Disputed',  color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
		received:  { label: 'Received',  color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
		write_off: { label: 'Write-Off', color: 'text-slate-400',   bg: 'bg-slate-800',      border: 'border-slate-700' },
		bad_debt:  { label: 'Bad Debt',  color: 'text-slate-400',   bg: 'bg-slate-800',      border: 'border-slate-700' },
	};

	const AUDIT_LABELS: Record<string, string> = {
		'po.sent':         'PO Sent',
		'po.acknowledged': 'PO Acknowledged',
		'po.invoiced':     'Invoiced',
		'po.partial':      'Partial Payment',
		'po.paid':         'Paid — WO Created',
		'po.overdue':      'Marked Overdue',
		'po.disputed':     'Dispute Opened',
		'po.resolved':     'Dispute Resolved',
		'po.write_off':    'Written Off',
		'po.bad_debt':     'Bad Debt',
		'po.cancelled':    'PO Cancelled',
		'po.deleted':      'PO Deleted',
		'payment.received':  'Payment Received',
		'payment.overdue':   'Payment Overdue',
		'payment.disputed':  'Payment Disputed',
		'payment.write_off': 'Payment Written Off',
		'payment.deleted':   'Payment Deleted',
	};
</script>

<svelte:head><title>Active Collections — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Active Collections</h1>
			<p class="text-muted-foreground mt-1">Drag sponsors through pipeline stages · manage POs, payments, disputes, and write-offs</p>
		</div>
		<a href="/dashboard/sponsor-collections" class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
			Collections Detail <ArrowRight class="size-3" />
		</a>
	</div>

	<!-- Summary strip -->
	<div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
		{#each [
			{ label: 'Committed',     value: fmt(summary.totalCommitted ?? 0),  color: 'text-slate-200',   bg: 'bg-slate-700/40 border-slate-600/50' },
			{ label: 'Received',      value: fmt(summary.totalReceived  ?? 0),  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
			{ label: 'Invoiced',      value: fmt(summary.totalInvoiced  ?? 0),  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
			{ label: 'Overdue',       value: fmt(summary.totalOverdue   ?? 0),  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
			{ label: 'Disputed',      value: fmt(summary.totalDisputed  ?? 0),  color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
			{ label: 'Written Off',   value: fmt(summary.totalWriteOff  ?? 0),  color: 'text-slate-500',   bg: 'bg-slate-800 border-slate-700' },
			{ label: 'Collection %',  value: `${summary.collectionRate ?? 0}%`, color: summary.collectionRate >= 80 ? 'text-emerald-400' : summary.collectionRate >= 50 ? 'text-amber-400' : 'text-red-400', bg: 'bg-slate-700/40 border-slate-600/50' },
		] as tile}
			<div class="rounded-xl border {tile.bg} p-3">
				<p class="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">{tile.label}</p>
				<p class="text-lg font-black {tile.color} tabular-nums">{tile.value}</p>
			</div>
		{/each}
	</div>

	<!-- Kanban board: drag sponsors through pipeline_stage -->
	<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
		<div class="flex items-center gap-2 mb-4">
			<Building2 class="size-4 text-slate-400" />
			<h2 class="text-sm font-semibold text-slate-300">Sponsor Pipeline</h2>
			<span class="text-[10px] text-slate-500 ml-1">— drag cards to advance CRM stage</span>
		</div>
		<PipelineBoard
			config={boardConfig}
			items={boardItems}
			onMove={handleMove}
		/>
	</div>

	<!-- Per-sponsor detail list -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
			<DollarSign class="size-4" /> Collections Detail
		</h2>

		{#if sponsors.length === 0}
			<div class="text-center py-16 text-muted-foreground rounded-xl border border-slate-700">
				<DollarSign class="size-10 mx-auto mb-3 opacity-30" />
				<p class="font-medium">No sponsors loaded</p>
			</div>
		{:else}
			{#each sponsors as sp (sp.id)}
				{@const r      = sp._rollup}
				{@const isOpen = expanded[sp.id]}
				{@const pctPaid = sp.annualCommitment > 0 ? Math.min(100, (r.received / sp.annualCommitment) * 100) : 0}
				{@const hasIssue = r.overdue > 0 || r.disputed > 0 || r.write_off > 0 || r.bad_debt > 0}

				<div class="rounded-xl border {hasIssue ? 'border-red-800/50' : 'border-slate-700'} overflow-hidden">

					<!-- Sponsor header row -->
					<button
						onclick={() => toggle(sp.id)}
						class="w-full flex items-center gap-4 px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
					>
						<div class="size-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
							<Building2 class="size-4 text-slate-400" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<p class="text-sm font-bold text-slate-100">{sp.companyName}</p>
								<span class="text-[10px] px-1.5 py-0.5 rounded border bg-slate-700 border-slate-600 text-slate-400">
									{SPONSOR_TIER_LABELS[sp.tier as keyof typeof SPONSOR_TIER_LABELS] ?? sp.tier}
								</span>
								<span class="text-[10px] px-1.5 py-0.5 rounded border bg-slate-700 border-slate-600 text-slate-400">
									{SPONSOR_STATUS_LABELS[sp.pipeline_stage ?? sp.status] ?? sp.pipeline_stage ?? sp.status}
								</span>
								{#if repName(sp)}<span class="text-[10px] text-slate-500 flex items-center gap-0.5"><UserCircle class="size-2.5" />{repName(sp)}</span>{/if}
							</div>
							<!-- Pipeline bar: received / invoiced / overdue / disputed / remaining -->
							<div class="flex h-1.5 rounded-full overflow-hidden bg-slate-700 mt-2 max-w-xs">
								{#if pctPaid > 0}<div class="bg-emerald-500 h-full" style="width:{pctPaid.toFixed(1)}%"></div>{/if}
								{#if r.invoiced > 0 && sp.annualCommitment > 0}<div class="bg-blue-500 h-full" style="width:{Math.min(100-pctPaid,(r.invoiced/sp.annualCommitment)*100).toFixed(1)}%"></div>{/if}
								{#if r.overdue > 0 && sp.annualCommitment > 0}<div class="bg-red-500 h-full" style="width:{Math.min(100-pctPaid,(r.overdue/sp.annualCommitment)*100).toFixed(1)}%"></div>{/if}
								{#if r.disputed > 0 && sp.annualCommitment > 0}<div class="bg-orange-500 h-full" style="width:{Math.min(100-pctPaid,(r.disputed/sp.annualCommitment)*100).toFixed(1)}%"></div>{/if}
							</div>
							<div class="flex gap-3 mt-1 text-[10px] text-slate-500">
								<span class="text-emerald-400">{fmt(r.received)} rcvd</span>
								{#if r.invoiced > 0}<span class="text-blue-400">{fmt(r.invoiced)} inv</span>{/if}
								{#if r.overdue > 0}<span class="text-red-400">⚠ {fmt(r.overdue)} overdue</span>{/if}
								{#if r.disputed > 0}<span class="text-orange-400">⚡ {fmt(r.disputed)} disputed</span>{/if}
								{#if r.write_off + r.bad_debt > 0}<span class="text-slate-500">✗ {fmt(r.write_off + r.bad_debt)} w/o</span>{/if}
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<span class="text-sm font-black text-slate-200 tabular-nums">{fmt(sp.annualCommitment ?? 0)}</span>
							<ChevronDown class="size-4 text-slate-500 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
						</div>
					</button>

				<!-- Expanded detail -->
				{#if isOpen}
					<div class="border-t border-slate-700">

						<!-- POs section -->
						<div class="px-5 pt-4 pb-2">
							<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
								<ScrollText class="size-3" /> Purchase Orders
							</p>
							{#if sp._pos.length === 0}
								<p class="text-xs text-slate-500 pb-2">No POs — <a href="/dashboard/sponsors/{sp.id}" class="text-blue-400 hover:underline">create one</a>.</p>
							{:else}
								<div class="space-y-2 mb-3">
									{#each sp._pos as po (po.id)}
										{@const ps = PO_STATUS[po.status] ?? PO_STATUS.draft}
										<div class="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-2">
											<div class="flex items-center gap-2 flex-wrap">
												<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {ps.bg} {ps.border} {ps.color}">{ps.label}</span>
												<span class="text-xs font-bold text-slate-200">{po.po_number}</span>
												{#if po.dueDate}<span class="text-[10px] text-slate-500">Due {fmtDate(po.dueDate)}</span>{/if}
												{#if po.year}<span class="text-[10px] text-slate-500">FY{po.year}</span>{/if}
												<span class="ml-auto text-xs font-black tabular-nums text-slate-100">{fmt(po.amount)}</span>
											</div>
											{#if po.description}<p class="text-[10px] text-slate-400">{po.description}</p>{/if}
											{#if po.disputeReason}<p class="text-[10px] text-orange-300 flex items-center gap-1"><TriangleAlert class="size-3"/>Dispute: {po.disputeReason}</p>{/if}
											{#if po.writeOffReason}<p class="text-[10px] text-slate-500 flex items-center gap-1"><Ban class="size-3"/>Write-off: {po.writeOffReason}</p>{/if}

											<!-- Action buttons per PO status -->
											<div class="flex gap-1.5 flex-wrap">
												{#if po.status === 'draft'}
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'sent')}
														class="text-[10px] px-2 py-0.5 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition-colors">Send PO</button>
												{:else if po.status === 'sent'}
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'acknowledged')}
														class="text-[10px] px-2 py-0.5 rounded border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 transition-colors">Acknowledge</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'overdue')}
														class="text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Mark Overdue</button>
												{:else if po.status === 'acknowledged'}
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'invoiced')}
														class="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors">Invoice</button>
												{:else if po.status === 'invoiced'}
													<button disabled={poLoading} onclick={() => { partialModal = po; partialForm = { partialAmount: '', receivedDate: today(), notes: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 transition-colors">Partial</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'paid')}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'overdue')}
														class="text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Overdue</button>
												{:else if po.status === 'partial'}
													<button disabled={poLoading} onclick={() => { partialModal = po; partialForm = { partialAmount: '', receivedDate: today(), notes: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 transition-colors">+ Partial</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'paid')}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'overdue')}
														class="text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Overdue</button>
												{:else if po.status === 'overdue'}
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'paid')}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
													<button disabled={poLoading} onclick={() => { disputeModal = po; disputeForm = { disputeReason: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 transition-colors">Dispute</button>
													{#if isAdmin}
														<button disabled={poLoading} onclick={() => { writeOffModal = po; writeOffForm = { writeOffReason: '' }; modalErr = ''; }}
															class="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors">Write Off</button>
													{/if}
												{:else if po.status === 'disputed'}
													<button disabled={poLoading} onclick={() => { resolveModal = po; resolveForm = { resolvedNotes: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-teal-500/40 text-teal-300 hover:bg-teal-500/10 transition-colors">Resolve</button>
													{#if isAdmin}
														<button disabled={poLoading} onclick={() => { writeOffModal = po; writeOffForm = { writeOffReason: '' }; modalErr = ''; }}
															class="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors">Write Off</button>
													{/if}
												{:else if po.status === 'resolved'}
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'invoiced')}
														class="text-[10px] px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors">Re-Invoice</button>
													<button disabled={poLoading} onclick={() => updatePO(po.id, 'paid')}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors">Paid → WO</button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Payments section -->
						{#if sp._payments.length > 0}
							<div class="border-t border-slate-800 px-5 pt-3 pb-2">
								<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
									<DollarSign class="size-3" /> Payments
								</p>
								<div class="divide-y divide-slate-800/60">
									{#each sp._payments as pmt (pmt.id)}
										{@const ps = PMT_STATUS[pmt.status] ?? PMT_STATUS.scheduled}
										<div class="flex items-center gap-3 py-2">
											<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border {ps.bg} {ps.border} {ps.color} shrink-0 min-w-[68px] text-center">{ps.label}</span>
											<div class="flex-1 min-w-0">
												<p class="text-xs text-slate-300">{pmt.paymentType ?? 'payment'}
													{#if pmt.invoiceNumber}<span class="text-slate-500"> · {pmt.invoiceNumber}</span>{/if}
												</p>
												<div class="flex gap-2 text-[10px] text-slate-500">
													{#if pmt.dueDate}<span>Due {fmtDate(pmt.dueDate)}</span>{/if}
													{#if pmt.receivedDate}<span class="text-emerald-400">Rcvd {fmtDate(pmt.receivedDate)}</span>{/if}
													{#if pmt.qb_transaction_id}<span class="text-slate-400">QB#{pmt.qb_transaction_id}</span>{/if}
												</div>
											</div>
											<p class="text-xs font-black tabular-nums text-slate-100 shrink-0">{fmt(pmt.amount)}</p>
											<div class="flex gap-1 shrink-0">
												{#if pmt.status !== 'received' && !['write_off','bad_debt'].includes(pmt.status)}
													<button onclick={() => { receivedModal = pmt; receivedForm = { receivedDate: today(), notes: '', qbTransactionId: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10 transition-colors">Received</button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Audit log -->
						{#if sp._auditLog.length > 0}
							<div class="border-t border-slate-800 px-5 pt-2 pb-1">
								<button onclick={() => toggleAudit(sp.id)}
									class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-300 transition-colors py-1">
									<History class="size-3" /> Audit Log ({sp._auditLog.length})
									<ChevronDown class="size-3 transition-transform {showAudit[sp.id] ? 'rotate-180' : ''}" />
								</button>
								{#if showAudit[sp.id]}
									<div class="space-y-1 pb-2 mt-1">
										{#each sp._auditLog as entry (entry.id)}
											<div class="flex items-start gap-2 text-[10px] text-slate-500">
												<span class="text-slate-600 shrink-0 tabular-nums">{fmtDateTime(entry.created)}</span>
												<span class="text-slate-300 font-medium">{AUDIT_LABELS[entry.action] ?? entry.action}</span>
												{#if entry.amount}<span class="text-slate-400">{fmt(entry.amount)}</span>{/if}
												{#if entry.fromStatus && entry.toStatus}<span class="text-slate-600">{entry.fromStatus} → {entry.toStatus}</span>{/if}
												{#if entry.notes}<span class="text-slate-500 italic truncate max-w-[200px]">{entry.notes}</span>{/if}
												{#if entry.expand?.performedBy}<span class="text-slate-600">by {entry.expand.performedBy.firstName ?? entry.expand.performedBy.email}</span>{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Footer: report buttons + link -->
						<div class="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
							<div class="flex gap-2">
								<button onclick={() => generateReport(sp, 'print')}
									class="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
									<Printer class="size-3" /> Print
								</button>
								<button onclick={() => generateReport(sp, 'pdf')} disabled={reportLoading[sp.id]}
									class="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50">
									<Download class="size-3" /> {reportLoading[sp.id] ? 'Generating…' : 'PDF'}
								</button>
							</div>
							<a href="/dashboard/sponsors/{sp.id}" class="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
								Full record <ArrowRight class="size-3" />
							</a>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
	</div>
</div>

<!-- ── Modals ─────────────────────────────────────────────────────────────── -->

<!-- Mark Payment Received -->
{#if receivedModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Mark Payment Received</h2>
				<p class="text-xs text-slate-400 mt-0.5">{fmt(receivedModal.amount)}</p>
			</div>
			<button onclick={() => receivedModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if modalErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{modalErr}</p>{/if}
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Date Received *</label>
				<input type="date" bind:value={receivedForm.receivedDate} class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">QB Transaction ID</label>
				<input bind:value={receivedForm.qbTransactionId} placeholder="e.g. 1042" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
				<textarea bind:value={receivedForm.notes} rows="2" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-500" placeholder="Check #, wire ref, etc."></textarea></div>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => receivedModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={markPaymentReceived} disabled={modalLoading} class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
					<CheckCircle2 class="size-4" />{modalLoading ? 'Saving…' : 'Confirm Received'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<!-- Record Partial Payment -->
{#if partialModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Record Partial Payment</h2>
				<p class="text-xs text-slate-400 mt-0.5">{partialModal.po_number} · {fmt(partialModal.amount)} total</p>
			</div>
			<button onclick={() => partialModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if modalErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{modalErr}</p>{/if}
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Amount Received *</label>
				<input type="number" bind:value={partialForm.partialAmount} placeholder="0.00" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Date Received</label>
				<input type="date" bind:value={partialForm.receivedDate} class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
				<textarea bind:value={partialForm.notes} rows="2" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"></textarea></div>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => partialModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={submitPartial} disabled={modalLoading} class="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					{modalLoading ? 'Saving…' : 'Record Partial'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<!-- Open Dispute -->
{#if disputeModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Open Dispute</h2>
				<p class="text-xs text-slate-400 mt-0.5">{disputeModal.po_number} · {fmt(disputeModal.amount)}</p>
			</div>
			<button onclick={() => disputeModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if modalErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{modalErr}</p>{/if}
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Dispute Reason *</label>
				<textarea bind:value={disputeForm.disputeReason} rows="3" placeholder="Describe the dispute — amount disagreement, service not delivered, etc." class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-slate-500"></textarea></div>
			<p class="text-[10px] text-slate-500">This will freeze the PO and linked payments. Use Resolve to resume or Write Off to close.</p>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => disputeModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={submitDispute} disabled={modalLoading || !disputeForm.disputeReason} class="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					{modalLoading ? 'Saving…' : 'Open Dispute'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<!-- Resolve Dispute -->
{#if resolveModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Resolve Dispute</h2>
				<p class="text-xs text-slate-400 mt-0.5">{resolveModal.po_number}</p>
			</div>
			<button onclick={() => resolveModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if modalErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{modalErr}</p>{/if}
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Resolution Notes *</label>
				<textarea bind:value={resolveForm.resolvedNotes} rows="3" placeholder="How was this resolved? Adjusted amount, payment plan agreed, etc." class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none placeholder:text-slate-500"></textarea></div>
			<p class="text-[10px] text-slate-500">PO will return to Resolved status. You can then re-invoice or mark as paid.</p>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => resolveModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={submitResolve} disabled={modalLoading || !resolveForm.resolvedNotes} class="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
					{modalLoading ? 'Saving…' : 'Mark Resolved'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}

<!-- Write Off (admin only) -->
{#if writeOffModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-red-300">Write Off PO</h2>
				<p class="text-xs text-slate-400 mt-0.5">{writeOffModal.po_number} · {fmt(writeOffModal.amount)} — admin action</p>
			</div>
			<button onclick={() => writeOffModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if modalErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{modalErr}</p>{/if}
			<div class="rounded-lg bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-300">
				⚠ This permanently closes the PO without creating a Work Order. All linked open payments will be marked as written off. This action is logged and cannot be undone.
			</div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Write-Off Reason *</label>
				<textarea bind:value={writeOffForm.writeOffReason} rows="3" placeholder="Sponsor went out of business, uncollectable, legal settlement, etc." class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none placeholder:text-slate-500"></textarea></div>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => writeOffModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={submitWriteOff} disabled={modalLoading || !writeOffForm.writeOffReason} class="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
					<Ban class="size-4" />{modalLoading ? 'Saving…' : 'Write Off'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
