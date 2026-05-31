<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import {
		DollarSign, ChevronDown, CheckCircle2, AlertCircle,
		ScrollText, Building2, UserCircle, X, Printer,
		Download, History, TriangleAlert, Ban, ArrowRight
	} from 'lucide-svelte';
	import Card from '$lib/components/ui/card.svelte';

	let { data }: { data: PageData } = $props();

	const pos        = $derived((data as any).pos         ?? []);
	const stageCounts = $derived((data as any).stageCounts ?? {});
	const summary    = $derived((data as any).summary     ?? {});
	const userRole   = $derived((data as any).userRole    ?? null);
	const isAdmin    = $derived(userRole === 'admin');

	// ── PO pipeline stages (mirrors bid pipeline pattern) ─────────────────────
	const STAGES = [
		{ key: 'draft',        label: 'Draft',        colorClass: 'bg-slate-700/40 text-slate-300 border-slate-600/50' },
		{ key: 'sent',         label: 'Sent',         colorClass: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		{ key: 'acknowledged', label: 'Acknowledged', colorClass: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
		{ key: 'invoiced',     label: 'Invoiced',     colorClass: 'bg-amber-900/40 text-amber-300 border-amber-700/50' },
		{ key: 'partial',      label: 'Partial Paid', colorClass: 'bg-orange-900/40 text-orange-300 border-orange-700/50' },
		{ key: 'paid',         label: 'Paid ✓',       colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', isSuccess: true },
	];
	const TERMINAL = [
		{ key: 'overdue',   label: 'Overdue',    colorClass: 'bg-red-900/40 text-red-300 border-red-700/50' },
		{ key: 'disputed',  label: 'Disputed',   colorClass: 'bg-orange-900/40 text-orange-300 border-orange-700/50' },
		{ key: 'resolved',  label: 'Resolved',   colorClass: 'bg-teal-900/40 text-teal-300 border-teal-700/50' },
		{ key: 'write_off', label: 'Write-Off',  colorClass: 'bg-slate-800/60 text-slate-500 border-slate-700/40' },
		{ key: 'bad_debt',  label: 'Bad Debt',   colorClass: 'bg-slate-800/60 text-slate-500 border-slate-700/40' },
		{ key: 'cancelled', label: 'Cancelled',  colorClass: 'bg-slate-800/60 text-slate-500 border-slate-700/40' },
	];

	const boardConfig: PipelineBoardConfig = { columnWidth: 'w-60', stages: STAGES, terminalStages: TERMINAL };

	const boardItems = $derived<PipelineCardItem[]>(
		pos.map((po: any) => {
			const sp      = po._sponsor;
			const pct     = po.amount > 0 ? Math.min(100, Math.round((po._received / po.amount) * 100)) : 0;
			const isLate  = po.status === 'overdue';
			const isDisp  = po.status === 'disputed';
			const tags: any[] = [];
			if (isLate) tags.push({ label: '⚠ Overdue',  colorClass: 'bg-red-900/50 text-red-300 border-red-700/50' });
			if (isDisp) tags.push({ label: '⚡ Disputed', colorClass: 'bg-orange-900/50 text-orange-300 border-orange-700/50' });
			return {
				id:       po.id,
				title:    sp?.companyName ?? 'Unknown Sponsor',
				subtitle: po.po_number,
				status:   po.status,
				badge:    po.dueDate ? { label: `Due ${fmtDate(po.dueDate)}`, colorClass: isLate ? 'bg-red-900/50 text-red-300 border-red-700/50' : 'bg-slate-700 text-slate-300 border-slate-600' } : undefined,
				tags,
				meta:     fmt(po.amount) + (pct > 0 && pct < 100 ? ` · ${pct}% rcvd` : pct === 100 ? ' · ✓ paid' : ''),
				raw:      po,
			};
		})
	);

	// ── Drag to advance stage ─────────────────────────────────────────────────
	let moving    = $state(false);
	let noteModal = $state<{ po: any; toStage: string } | null>(null);
	let noteText  = $state('');
	let noteSaving = $state(false);

	// Post-paid success state — holds WO number + sponsor info for the follow-up prompt
	let paidResult = $state<{ woNumber: string; sponsorId: string; sponsorName: string; sponsorStatus: string } | null>(null);
	let activating = $state(false);

	// Stages that need a confirmation modal before advancing
	const CONFIRM_STAGES = new Set(['paid', 'overdue', 'disputed', 'write_off', 'bad_debt']);

	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;
		const po = pos.find((p: any) => p.id === e.item.id);
		if (!po) return;
		if (CONFIRM_STAGES.has(e.to as string)) {
			noteModal = { po, toStage: e.to as string };
			noteText  = '';
			return;
		}
		await patchPO(e.item.id, e.to as string);
	}

	async function patchPO(id: string, status: string, extra: Record<string, any> = {}) {
		moving = true;
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${id}`, {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body:    JSON.stringify({ status, ...extra }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);

			// On paid, the API returns the created WO — surface it to the user
			if (status === 'paid' && body.wo?.work_order_number) {
				const po = pos.find((p: any) => p.id === id);
				const sponsor = po?._sponsor ?? po?.expand?.sponsorId ?? null;
				paidResult = {
					woNumber:      body.wo.work_order_number,
					sponsorId:     typeof po?.sponsorId === 'string' ? po.sponsorId : (po?.sponsorId?.id ?? sponsor?.id ?? ''),
					sponsorName:   sponsor?.companyName ?? 'Sponsor',
					sponsorStatus: sponsor?.status ?? '',
				};
			}

			await invalidateAll();
		} catch (err: any) {
			alert(err.message);
		} finally {
			moving = false;
		}
	}

	async function activateSponsor() {
		if (!paidResult?.sponsorId) return;
		activating = true;
		try {
			await fetch(`/api/sponsors/${paidResult.sponsorId}`, {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body:    JSON.stringify({ status: 'active' }),
			});
			await invalidateAll();
		} finally {
			activating = false;
			paidResult = null;
		}
	}

	async function submitNote(e: SubmitEvent) {
		e.preventDefault();
		if (!noteModal) return;
		noteSaving = true;
		const { po, toStage } = noteModal;
		const extra: Record<string, any> = {};
		if (toStage === 'disputed')              extra.disputeReason  = noteText;
		if (toStage === 'write_off')             extra.writeOffReason = noteText;
		if (toStage === 'bad_debt')              extra.writeOffReason = noteText;
		if (toStage === 'paid' && noteText)      extra.notes          = noteText;
		if (toStage === 'overdue' && noteText)   extra.notes          = noteText;
		noteModal = null;
		await patchPO(po.id, toStage, extra);
		noteSaving = false;
	}

	// ── Expanded detail panel ─────────────────────────────────────────────────
	let expanded  = $state<Record<string, boolean>>({});
	let showAudit = $state<Record<string, boolean>>({});
	const toggle      = (id: string) => expanded  = { ...expanded,  [id]: !expanded[id] };
	const toggleAudit = (id: string) => showAudit = { ...showAudit, [id]: !showAudit[id] };

	// ── Payment received modal ────────────────────────────────────────────────
	let receivedModal = $state<any>(null);
	let receivedForm  = $state({ receivedDate: today(), notes: '', qbTransactionId: '' });
	let modalErr      = $state('');
	let modalLoading  = $state(false);

	async function markPaymentReceived() {
		if (!receivedModal) return;
		modalLoading = true; modalErr = '';
		try {
			const res = await fetch(`/api/sponsor-payments/${receivedModal.id}`, {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body:    JSON.stringify({ status: 'received', ...receivedForm }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			receivedModal = null;
			await invalidateAll();
		} catch (e: any) { modalErr = e.message; }
		finally { modalLoading = false; }
	}

	// ── Report ────────────────────────────────────────────────────────────────
	let reportLoading = $state<Record<string, boolean>>({});

	async function generateReport(po: any, format: 'pdf' | 'print') {
		const sid = po._sponsor?.id ?? (typeof po.sponsorId === 'object' ? po.sponsorId?.id : po.sponsorId);
		if (!sid) return;
		reportLoading = { ...reportLoading, [po.id]: true };
		try {
			if (format === 'print') {
				window.open(`/api/sponsors/${sid}/collections-report?format=print`, '_blank');
				return;
			}
			const res = await fetch(`/api/sponsors/${sid}/collections-report`, { method: 'POST' });
			if (!res.ok) { alert('Report failed'); return; }
			const blob = await res.blob();
			const url  = URL.createObjectURL(blob);
			const a    = document.createElement('a');
			a.href = url;
			a.download = `${(po._sponsor?.companyName ?? 'sponsor').replace(/\s+/g,'-').toLowerCase()}-collections-${today()}.pdf`;
			document.body.appendChild(a); a.click(); document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 10000);
		} finally {
			reportLoading = { ...reportLoading, [po.id]: false };
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	function today() { return new Date().toISOString().slice(0, 10); }
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		const dt = new Date(d);
		return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	function fmtDT(d: string) {
		if (!d) return '—';
		const dt = new Date(d);
		return isNaN(dt.getTime()) ? d : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
	}

	const PMT_STATUS: Record<string, { label: string; color: string }> = {
		scheduled: { label: 'Scheduled', color: 'text-slate-400' },
		invoiced:  { label: 'Invoiced',  color: 'text-blue-400'  },
		partial:   { label: 'Partial',   color: 'text-amber-400' },
		overdue:   { label: 'Overdue',   color: 'text-red-400'   },
		disputed:  { label: 'Disputed',  color: 'text-orange-400'},
		received:  { label: 'Received',  color: 'text-emerald-400'},
		write_off: { label: 'Write-Off', color: 'text-slate-500' },
		bad_debt:  { label: 'Bad Debt',  color: 'text-slate-500' },
	};

	const AUDIT_LABELS: Record<string, string> = {
		'po.sent': 'PO Sent', 'po.acknowledged': 'Acknowledged', 'po.invoiced': 'Invoiced',
		'po.partial': 'Partial Payment', 'po.paid': 'Paid — WO Created', 'po.overdue': 'Marked Overdue',
		'po.disputed': 'Dispute Opened', 'po.resolved': 'Dispute Resolved',
		'po.write_off': 'Written Off', 'po.bad_debt': 'Bad Debt', 'po.cancelled': 'Cancelled',
		'payment.received': 'Payment Received', 'payment.overdue': 'Payment Overdue',
		'payment.disputed': 'Payment Disputed', 'payment.write_off': 'Payment Written Off',
	};

	// Modal label/colour per target stage
	const MODAL_CONFIG: Record<string, { title: string; desc: string; btnLabel: string; btnClass: string; needsReason: boolean }> = {
		paid:      { title: 'Mark as Paid',    desc: 'This will create a Work Order in QuickBooks. Add any notes or QB transaction reference.',  btnLabel: 'Confirm Paid → WO', btnClass: 'bg-emerald-600 hover:bg-emerald-700', needsReason: false },
		overdue:   { title: 'Mark Overdue',    desc: 'All linked open payments will be flagged overdue. Add a note explaining the situation.',    btnLabel: 'Mark Overdue',      btnClass: 'bg-red-700 hover:bg-red-800',         needsReason: false },
		disputed:  { title: 'Open Dispute',    desc: 'Describe the dispute. The PO and linked payments will be frozen until resolved.',           btnLabel: 'Open Dispute',      btnClass: 'bg-orange-600 hover:bg-orange-700',   needsReason: true  },
		write_off: { title: 'Write Off',       desc: 'Admin action — permanently closes the PO without a WO. All open payments written off.',    btnLabel: 'Write Off',         btnClass: 'bg-red-800 hover:bg-red-900',         needsReason: true  },
		bad_debt:  { title: 'Mark Bad Debt',   desc: 'Admin action — marks this as uncollectable bad debt. Fully logged.',                       btnLabel: 'Mark Bad Debt',     btnClass: 'bg-red-800 hover:bg-red-900',         needsReason: true  },
	};
</script>

<svelte:head><title>Active Collections — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Active Collections</h1>
			<p class="text-muted-foreground mt-1">Drag POs through the payment pipeline · every stage is logged</p>
		</div>
		{#if moving}<span class="text-xs text-slate-400 animate-pulse mt-2">Saving…</span>{/if}
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
		{#each [
			{ label: 'Total POs',     value: pos.length,                                                                                                    color: 'border-l-slate-500' },
			{ label: 'Sent',          value: (stageCounts.sent         ?? 0) + (stageCounts.acknowledged ?? 0),                                             color: 'border-l-blue-500' },
			{ label: 'Invoiced',      value: (stageCounts.invoiced     ?? 0) + (stageCounts.partial      ?? 0),                                             color: 'border-l-amber-500' },
			{ label: 'Paid',          value:  stageCounts.paid         ?? 0,                                                                                color: 'border-l-emerald-500' },
			{ label: 'Overdue',       value:  stageCounts.overdue      ?? 0,                                                                                color: 'border-l-red-500' },
			{ label: 'Disputed',      value:  stageCounts.disputed     ?? 0,                                                                                color: 'border-l-orange-500' },
			{ label: 'Collection %',  value: `${summary.collectionRate ?? 0}%`,                                                                             color: (summary.collectionRate ?? 0) >= 80 ? 'border-l-emerald-500' : (summary.collectionRate ?? 0) >= 50 ? 'border-l-amber-500' : 'border-l-red-500' },
		] as kpi}
			<Card class="p-4 border-l-4 {kpi.color} bg-slate-800/40">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
				<p class="text-2xl font-bold text-white">{kpi.value}</p>
			</Card>
		{/each}
	</div>

	<!-- Money summary row -->
	<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
		{#each [
			{ label: 'Committed',   value: fmt(summary.totalCommitted ?? 0), color: 'text-slate-200' },
			{ label: 'Received',    value: fmt(summary.totalReceived  ?? 0), color: 'text-emerald-400' },
			{ label: 'Overdue',     value: fmt(summary.totalOverdue   ?? 0), color: 'text-red-400' },
			{ label: 'Disputed',    value: fmt(summary.totalDisputed  ?? 0), color: 'text-orange-400' },
			{ label: 'Written Off', value: fmt(summary.totalWriteOff  ?? 0), color: 'text-slate-500' },
		] as t}
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-3">
				<p class="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{t.label}</p>
				<p class="text-lg font-black {t.color} tabular-nums">{t.value}</p>
			</div>
		{/each}
	</div>

	<!-- PO Pipeline Board -->
	<div>
		<p class="text-xs text-slate-500 mb-3">Drag a PO card to advance its stage · key transitions (Paid, Overdue, Dispute) open a confirmation</p>
		<PipelineBoard config={boardConfig} items={boardItems} onmove={handleMove} />
	</div>

	<!-- Detail list — all POs with expand -->
	<div class="space-y-2">
		<h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2 pt-2">
			<ScrollText class="size-3.5" /> All Purchase Orders
		</h2>

		{#if pos.length === 0}
			<div class="text-center py-12 text-muted-foreground rounded-xl border border-slate-700">
				<DollarSign class="size-8 mx-auto mb-2 opacity-30" />
				<p class="text-sm">No purchase orders yet</p>
			</div>
		{:else}
			{#each pos as po (po.id)}
				{@const sp     = po._sponsor}
				{@const pct    = po.amount > 0 ? Math.min(100, (po._received / po.amount) * 100) : 0}
				{@const isOpen = expanded[po.id]}
				{@const isLate = po.status === 'overdue'}
				{@const isDisp = po.status === 'disputed'}
				{@const isPaid = po.status === 'paid'}

				<div class="rounded-xl border {isLate ? 'border-red-800/50' : isDisp ? 'border-orange-800/50' : isPaid ? 'border-emerald-800/30' : 'border-slate-700'} overflow-hidden">

					<!-- PO header row -->
					<button onclick={() => toggle(po.id)}
						class="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left">

						<!-- Sponsor icon -->
						<div class="size-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
							<Building2 class="size-3.5 text-slate-400" />
						</div>

						<!-- Main info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<p class="text-sm font-bold text-slate-100">{sp?.companyName ?? '—'}</p>
								<span class="text-[10px] font-mono text-slate-400">{po.po_number}</span>
								<!-- Status badge -->
								<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {
									isPaid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
									isLate ? 'bg-red-500/10 border-red-500/30 text-red-300' :
									isDisp ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
									po.status === 'partial' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
									po.status === 'invoiced' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
									po.status === 'sent' || po.status === 'acknowledged' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
									'bg-slate-700/40 border-slate-600 text-slate-400'
								}">{STAGES.find(s => s.key === po.status)?.label ?? TERMINAL.find(s => s.key === po.status)?.label ?? po.status}</span>
								{#if po.year}<span class="text-[10px] text-slate-500">FY{po.year}</span>{/if}
							</div>
							<!-- Progress bar -->
							<div class="flex items-center gap-2 mt-1.5">
								<div class="flex-1 max-w-[140px] h-1 rounded-full bg-slate-700 overflow-hidden">
									<div class="h-full rounded-full {isPaid ? 'bg-emerald-500' : isLate ? 'bg-red-500' : 'bg-blue-500'} transition-all"
										style="width:{pct.toFixed(1)}%"></div>
								</div>
								<span class="text-[10px] text-slate-500 tabular-nums">{fmt(po._received)} / {fmt(po.amount)}</span>
								{#if po.dueDate}<span class="text-[10px] {isLate ? 'text-red-400' : 'text-slate-500'}">Due {fmtDate(po.dueDate)}</span>{/if}
							</div>
						</div>

						<!-- Right: amount + chevron -->
						<div class="flex items-center gap-2 shrink-0">
							<span class="text-sm font-black tabular-nums text-slate-100">{fmt(po.amount)}</span>
							<ChevronDown class="size-4 text-slate-500 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
						</div>
					</button>

					<!-- Expanded detail -->
					{#if isOpen}
						<div class="border-t border-slate-700 divide-y divide-slate-800">

							<!-- Description / notes -->
							{#if po.description || po.disputeReason || po.writeOffReason}
								<div class="px-4 py-3 space-y-1">
									{#if po.description}<p class="text-xs text-slate-400">{po.description}</p>{/if}
									{#if po.disputeReason}<p class="text-xs text-orange-300 flex items-center gap-1"><TriangleAlert class="size-3"/>Dispute: {po.disputeReason}</p>{/if}
									{#if po.writeOffReason}<p class="text-xs text-slate-500 flex items-center gap-1"><Ban class="size-3"/>Write-off: {po.writeOffReason}</p>{/if}
								</div>
							{/if}

							<!-- Quick action buttons -->
							<div class="px-4 py-2.5 flex gap-1.5 flex-wrap">
								{#if po.status === 'draft'}
									<button onclick={() => patchPO(po.id, 'sent')} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition-colors">Send PO</button>
								{:else if po.status === 'sent'}
									<button onclick={() => patchPO(po.id, 'acknowledged')} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 transition-colors">Acknowledge</button>
									<button onclick={() => { noteModal = { po, toStage: 'overdue' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Mark Overdue</button>
								{:else if po.status === 'acknowledged'}
									<button onclick={() => patchPO(po.id, 'invoiced')} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors">Invoice</button>
								{:else if po.status === 'invoiced' || po.status === 'partial'}
									<button onclick={() => { noteModal = { po, toStage: 'paid' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
									<button onclick={() => { noteModal = { po, toStage: 'overdue' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Overdue</button>
								{:else if po.status === 'overdue'}
									<button onclick={() => { noteModal = { po, toStage: 'paid' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
									<button onclick={() => { noteModal = { po, toStage: 'disputed' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-orange-500/40 text-orange-300 hover:bg-orange-500/10 transition-colors">Dispute</button>
									{#if isAdmin}
										<button onclick={() => { noteModal = { po, toStage: 'write_off' }; noteText = ''; }} disabled={moving}
											class="text-[10px] px-2.5 py-1 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors">Write Off</button>
									{/if}
								{:else if po.status === 'disputed'}
									<button onclick={() => patchPO(po.id, 'resolved')} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-teal-500/40 text-teal-300 hover:bg-teal-500/10 transition-colors">Resolve</button>
									{#if isAdmin}
										<button onclick={() => { noteModal = { po, toStage: 'write_off' }; noteText = ''; }} disabled={moving}
											class="text-[10px] px-2.5 py-1 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors">Write Off</button>
									{/if}
								{:else if po.status === 'resolved'}
									<button onclick={() => patchPO(po.id, 'invoiced')} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors">Re-Invoice</button>
									<button onclick={() => { noteModal = { po, toStage: 'paid' }; noteText = ''; }} disabled={moving}
										class="text-[10px] px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors">Paid → WO</button>
								{/if}
							</div>

							<!-- Payments -->
							{#if po._payments.length > 0}
								<div class="px-4 py-3">
									<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Payments</p>
									<div class="space-y-1.5">
										{#each po._payments as pmt (pmt.id)}
											{@const ps = PMT_STATUS[pmt.status] ?? PMT_STATUS.scheduled}
											<div class="flex items-center gap-2 text-xs">
												<span class="font-semibold {ps.color} shrink-0 w-16">{ps.label}</span>
												<span class="text-slate-400 flex-1">{pmt.paymentType ?? 'payment'}
													{#if pmt.invoiceNumber}<span class="text-slate-600"> · {pmt.invoiceNumber}</span>{/if}
												</span>
												{#if pmt.dueDate}<span class="text-slate-500 text-[10px]">Due {fmtDate(pmt.dueDate)}</span>{/if}
												{#if pmt.receivedDate}<span class="text-emerald-400 text-[10px]">Rcvd {fmtDate(pmt.receivedDate)}</span>{/if}
												{#if pmt.qb_transaction_id}<span class="text-slate-500 text-[10px]">QB#{pmt.qb_transaction_id}</span>{/if}
												<span class="font-black tabular-nums text-slate-100 shrink-0">{fmt(pmt.amount)}</span>
												{#if pmt.status !== 'received' && !['write_off','bad_debt'].includes(pmt.status)}
													<button onclick={() => { receivedModal = pmt; receivedForm = { receivedDate: today(), notes: '', qbTransactionId: '' }; modalErr = ''; }}
														class="text-[10px] px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10 transition-colors shrink-0">Received</button>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Audit log -->
							{#if po._auditLog.length > 0}
								<div class="px-4 py-2">
									<button onclick={() => toggleAudit(po.id)}
										class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-300 transition-colors py-1">
										<History class="size-3" /> History ({po._auditLog.length})
										<ChevronDown class="size-3 transition-transform {showAudit[po.id] ? 'rotate-180' : ''}" />
									</button>
									{#if showAudit[po.id]}
										<div class="space-y-1 pb-2 mt-1">
											{#each po._auditLog as entry (entry.id)}
												<div class="flex items-center gap-2 text-[10px] text-slate-500">
													<span class="text-slate-600 shrink-0 tabular-nums w-28">{fmtDT(entry.created)}</span>
													<span class="text-slate-300 font-medium">{AUDIT_LABELS[entry.action] ?? entry.action}</span>
													{#if entry.amount}<span>{fmt(entry.amount)}</span>{/if}
													{#if entry.notes}<span class="italic truncate max-w-[180px]">{entry.notes}</span>{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/if}

							<!-- Footer -->
							<div class="px-4 py-2.5 flex items-center justify-between bg-slate-900/40">
								<div class="flex gap-2">
									<button onclick={() => generateReport(po, 'print')}
										class="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors">
										<Printer class="size-3" /> Print
									</button>
									<button onclick={() => generateReport(po, 'pdf')} disabled={reportLoading[po.id]}
										class="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50">
										<Download class="size-3" /> {reportLoading[po.id] ? '…' : 'PDF'}
									</button>
								</div>
								<a href="/dashboard/sponsors/{po._sponsor?.id}" class="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
									Sponsor record <ArrowRight class="size-3" />
								</a>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- ── Post-paid success modal ────────────────────────────────────────────── -->
{#if paidResult}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-emerald-700/60 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="p-6 text-center space-y-4">
			<!-- Icon -->
			<div class="mx-auto size-14 rounded-full bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center">
				<CheckCircle2 class="size-7 text-emerald-400" />
			</div>

			<div>
				<h2 class="text-lg font-semibold text-slate-100">Payment Confirmed</h2>
				<p class="text-sm text-slate-400 mt-1">
					A Work Order has been created and all linked payments marked received.
				</p>
			</div>

			<!-- WO callout -->
			<div class="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-3 text-left space-y-1">
				<p class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Work Order Created</p>
				<p class="font-mono font-bold text-emerald-300 text-base">{paidResult.woNumber}</p>
				<p class="text-xs text-slate-400">Visible in <a href="/dashboard/work-orders" class="text-emerald-400 hover:underline">Work Orders</a></p>
			</div>

			<!-- Sponsor status prompt — only show if still contracted -->
			{#if paidResult.sponsorStatus === 'contracted'}
				<div class="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-left space-y-2">
					<p class="text-xs font-semibold text-slate-300">Next step</p>
					<p class="text-xs text-slate-400 leading-relaxed">
						<span class="font-medium text-slate-200">{paidResult.sponsorName}</span> is still marked
						<span class="font-mono text-orange-300">contracted</span>. Now that payment is confirmed,
						move them to <span class="font-mono text-emerald-300">active</span> to reflect the live partnership.
					</p>
					<button
						onclick={activateSponsor}
						disabled={activating}
						class="w-full mt-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
					>
						{activating ? 'Updating…' : `Move ${paidResult.sponsorName} → Active`}
					</button>
				</div>
			{/if}

			<button
				onclick={() => paidResult = null}
				class="w-full py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
			>
				{paidResult.sponsorStatus === 'contracted' ? 'Skip — keep as Contracted' : 'Done'}
			</button>
		</div>
	</div>
</div>
{/if}

<!-- ── Stage advance confirmation modal ──────────────────────────────────── -->
{#if noteModal}
{@const cfg = MODAL_CONFIG[noteModal.toStage] ?? { title: 'Confirm', desc: '', btnLabel: 'Confirm', btnClass: 'bg-slate-600', needsReason: false }}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">{cfg.title}</h2>
				<p class="text-xs text-slate-400 mt-0.5">{noteModal.po._sponsor?.companyName} · {noteModal.po.po_number} · {fmt(noteModal.po.amount)}</p>
			</div>
			<button onclick={() => noteModal = null}><X class="size-5 text-slate-400 hover:text-slate-100" /></button>
		</div>
		<form onsubmit={submitNote} class="p-5 space-y-4">
			{#if cfg.desc}
				<p class="text-xs text-slate-400 leading-relaxed">{cfg.desc}</p>
			{/if}
			{#if ['write_off','bad_debt'].includes(noteModal.toStage)}
				<div class="rounded-lg bg-red-950/40 border border-red-800/50 p-3 text-xs text-red-300">
					⚠ Admin action — permanently closes this PO. Cannot be undone.
				</div>
			{/if}
			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1">
					{cfg.needsReason ? 'Reason *' : 'Notes (optional)'}
				</label>
				<textarea bind:value={noteText} rows="3"
					placeholder={cfg.needsReason ? 'Required — describe the reason…' : 'QB transaction ID, check number, etc.'}
					class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none placeholder:text-slate-500"></textarea>
			</div>
			<div class="flex gap-3 justify-end pt-1">
				<button type="button" onclick={() => noteModal = null}
					class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button type="submit" disabled={noteSaving || (cfg.needsReason && !noteText.trim())}
					class="px-4 py-2 rounded-lg {cfg.btnClass} text-white text-sm font-semibold transition-colors disabled:opacity-50">
					{noteSaving ? 'Saving…' : cfg.btnLabel}
				</button>
			</div>
		</form>
	</div>
</div>
{/if}

<!-- ── Mark Payment Received modal ────────────────────────────────────────── -->
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
				<input type="date" bind:value={receivedForm.receivedDate}
					class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">QB Transaction ID</label>
				<input bind:value={receivedForm.qbTransactionId} placeholder="e.g. 1042"
					class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" /></div>
			<div><label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
				<textarea bind:value={receivedForm.notes} rows="2"
					class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-500"
					placeholder="Check #, wire ref, etc."></textarea></div>
			<div class="flex justify-end gap-3 pt-1">
				<button onclick={() => receivedModal = null}
					class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={markPaymentReceived} disabled={modalLoading}
					class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
					<CheckCircle2 class="size-4" />{modalLoading ? 'Saving…' : 'Confirm Received'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
