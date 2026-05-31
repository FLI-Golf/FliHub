<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { DollarSign, ChevronDown, CheckCircle2, Clock, AlertCircle, ArrowRight, ScrollText, Building2, UserCircle, Plus, X } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const sponsors = $derived((data as any).sponsors ?? []);
	const summary  = $derived((data as any).summary ?? {});

	// Expanded sponsor rows
	let expanded = $state<Record<string, boolean>>({});
	const toggle = (id: string) => expanded = { ...expanded, [id]: !expanded[id] };

	// Mark-received modal
	let markModal   = $state<any>(null);  // the payment record
	let markLoading = $state(false);
	let markErr     = $state('');
	let markForm    = $state({ receivedDate: new Date().toISOString().slice(0, 10), notes: '', qbTransactionId: '' });

	async function markReceived() {
		if (!markModal) return;
		markLoading = true; markErr = '';
		try {
			const res = await fetch(`/api/sponsor-payments/${markModal.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'received', receivedDate: markForm.receivedDate, notes: markForm.notes, qbTransactionId: markForm.qbTransactionId }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			markModal = null;
			await invalidateAll();
		} catch (e: any) {
			markErr = e.message;
		} finally {
			markLoading = false;
		}
	}

	// Mark overdue
	async function markOverdue(payment: any) {
		await fetch(`/api/sponsor-payments/${payment.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'overdue' }),
		});
		await invalidateAll();
	}

	let poActionLoading = $state(false);
	async function updatePO(poId: string, status: string, extra: Record<string, any> = {}) {
		poActionLoading = true;
		try {
			await fetch(`/api/sponsor-purchase-orders/${poId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, ...extra }),
			});
			await invalidateAll();
		} finally {
			poActionLoading = false;
		}
	}

	const PO_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
		draft:        { label: 'Draft',        color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600' },
		sent:         { label: 'Sent',         color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
		acknowledged: { label: 'Acknowledged', color: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
		invoiced:     { label: 'Invoiced',     color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
		partial:      { label: 'Partial',      color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30' },
		paid:         { label: 'Paid',         color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
		overdue:      { label: 'Overdue',      color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
		cancelled:    { label: 'Cancelled',    color: 'text-slate-500',   bg: 'bg-slate-800',      border: 'border-slate-700' },
	};

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		const dt = new Date(d);
		return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
		scheduled: { label: 'Scheduled',  color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600',    icon: Clock },
		invoiced:  { label: 'Invoiced',   color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',  icon: ScrollText },
		partial:   { label: 'Partial',    color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30', icon: AlertCircle },
		overdue:   { label: 'Overdue',    color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',   icon: AlertCircle },
		received:  { label: 'Received',   color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
	};

	const TIER_LABELS: Record<string, string> = {
		tier_1: 'Tier 1 — Naming Rights',
		tier_2: 'Tier 2 — League Partners',
		tier_3: 'Tier 3 — Event Vendors',
		tier_4: 'Tier 4 — Growth',
	};

	const PAYMENT_TYPE_LABELS: Record<string, string> = {
		annual_fee:    'Annual Fee',
		installment:   'Installment',
		initial_deposit: 'Initial Deposit',
		renewal:       'Renewal',
		bonus:         'Bonus',
		other:         'Other',
	};

	function repName(sp: any) {
		const p = sp?.expand?.assignedTo;
		if (!p) return null;
		return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || null;
	}

	// Collection stage for a sponsor based on their payment rollup
	function collectionStage(sp: any): { label: string; color: string } {
		const r = sp._rollup;
		if (!r || r.total === 0)       return { label: 'No Payments',  color: 'text-slate-500' };
		if (r.overdue > 0)             return { label: 'Overdue',      color: 'text-red-400' };
		if (r.received >= r.total)     return { label: 'Fully Paid',   color: 'text-emerald-400' };
		if (r.partial > 0 || (r.received > 0 && r.received < r.total))
		                               return { label: 'Partially Paid', color: 'text-amber-400' };
		if (r.invoiced > 0)            return { label: 'Invoiced',     color: 'text-blue-400' };
		return                                { label: 'Scheduled',    color: 'text-slate-400' };
	}
</script>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-black tracking-tight">Sponsor Collections</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Payment schedules, invoices, and collection status for active sponsors</p>
		</div>
		<a href="/dashboard/sponsors" class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
			All Sponsors <ArrowRight class="size-3" />
		</a>
	</div>

	<!-- Summary tiles -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		{#each [
			{ label: 'Received',  value: summary.totalReceived,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
			{ label: 'Invoiced',  value: summary.totalInvoiced,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
			{ label: 'Scheduled', value: summary.totalScheduled, color: 'text-slate-300',   bg: 'bg-slate-700/40 border-slate-600/50' },
			{ label: 'Overdue',   value: summary.totalOverdue,   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
		] as tile}
			<div class="rounded-xl border {tile.bg} p-4">
				<p class="text-xs text-muted-foreground mb-1">{tile.label}</p>
				<p class="text-xl font-black {tile.color} tabular-nums">{fmt(tile.value ?? 0)}</p>
			</div>
		{/each}
	</div>

	<!-- Sponsor collection cards -->
	{#if sponsors.length === 0}
		<div class="text-center py-16 text-muted-foreground">
			<DollarSign class="size-10 mx-auto mb-3 opacity-30" />
			<p class="font-medium">No active sponsors yet</p>
			<p class="text-sm mt-1">Sponsors in contracted, active, or renewed status will appear here.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each sponsors as sp (sp.id)}
				{@const stage = collectionStage(sp)}
				{@const r = sp._rollup}
				{@const isOpen = expanded[sp.id]}
				{@const pctPaid = r.total > 0 ? Math.min(100, (r.received / r.total) * 100) : 0}

				<div class="rounded-xl border border-slate-700 overflow-hidden">
					<!-- Sponsor row header -->
					<button
						onclick={() => toggle(sp.id)}
						class="w-full flex items-center gap-4 px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
					>
						<!-- Icon -->
						<div class="size-9 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
							<Building2 class="size-4 text-slate-400" />
						</div>

						<!-- Name + meta -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<p class="text-sm font-bold text-slate-100">{sp.companyName}</p>
								<span class="text-[10px] px-1.5 py-0.5 rounded border bg-slate-700 border-slate-600 text-slate-400">{TIER_LABELS[sp.tier] ?? sp.tier}</span>
								<span class="text-[10px] font-semibold {stage.color}">{stage.label}</span>
							</div>
							<div class="flex items-center gap-3 mt-1">
								<!-- Progress bar -->
								<div class="flex-1 max-w-[160px] h-1.5 rounded-full bg-slate-700 overflow-hidden">
									<div class="h-full bg-emerald-500 transition-all duration-500" style="width:{pctPaid.toFixed(1)}%"></div>
								</div>
								<span class="text-[10px] text-slate-400 tabular-nums">{fmt(r.received)} of {fmt(sp.annualCommitment ?? r.total)}</span>
								{#if repName(sp)}<span class="text-[10px] text-slate-500 flex items-center gap-0.5"><UserCircle class="size-2.5" />{repName(sp)}</span>{/if}
							</div>
						</div>

						<!-- Right: status badges + chevron -->
						<div class="flex items-center gap-2 shrink-0">
							{#if r.overdue > 0}
								<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">⚠ {fmt(r.overdue)} overdue</span>
							{/if}
							{#if r.invoiced > 0}
								<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">{fmt(r.invoiced)} invoiced</span>
							{/if}
							<span class="text-sm font-black text-slate-200 tabular-nums">{fmt(sp.annualCommitment ?? 0)}</span>
							<ChevronDown class="size-4 text-slate-500 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
						</div>
					</button>

					<!-- Expanded: POs then payments -->
					{#if isOpen}
						<div class="border-t border-slate-700">

							<!-- Purchase Orders section -->
							<div class="px-5 pt-3 pb-1">
								<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
									<ScrollText class="size-3" /> Purchase Orders
								</p>
								{#if sp._pos.length === 0}
									<p class="text-xs text-slate-500 pb-2">No POs yet — <a href="/dashboard/sponsors/{sp.id}" class="text-blue-400 hover:underline">create one on the sponsor page</a>.</p>
								{:else}
									<div class="space-y-1.5 mb-3">
										{#each sp._pos as po (po.id)}
											{@const ps = PO_STATUS[po.status] ?? PO_STATUS.draft}
											<div class="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/40">
												<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {ps.bg} {ps.border} {ps.color} shrink-0">{ps.label}</span>
												<div class="flex-1 min-w-0">
													<span class="text-xs font-bold text-slate-200">{po.po_number}</span>
													{#if po.dueDate}<span class="text-[10px] text-slate-500 ml-2">Due {fmtDate(po.dueDate)}</span>{/if}
													{#if po.year}<span class="text-[10px] text-slate-500 ml-1">FY{po.year}</span>{/if}
												</div>
												<span class="text-xs font-black tabular-nums text-slate-100 shrink-0">{fmt(po.amount)}</span>
												<!-- Stage actions -->
												<div class="flex items-center gap-1 shrink-0">
													{#if po.status === 'draft'}
														<button disabled={poActionLoading} onclick={() => updatePO(po.id, 'sent')} class="text-[10px] px-2 py-0.5 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10 transition-colors">Send</button>
													{:else if po.status === 'sent'}
														<button disabled={poActionLoading} onclick={() => updatePO(po.id, 'acknowledged')} class="text-[10px] px-2 py-0.5 rounded border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 transition-colors">Ack</button>
														<button disabled={poActionLoading} onclick={() => updatePO(po.id, 'overdue')} class="text-[10px] px-2 py-0.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors">Overdue</button>
													{:else if po.status === 'acknowledged' || po.status === 'invoiced' || po.status === 'partial'}
														<button disabled={poActionLoading} onclick={() => updatePO(po.id, 'paid')} class="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors font-semibold">Paid → WO</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Payments section -->
							{#if sp._payments.length > 0}
								<div class="border-t border-slate-800 px-5 pt-3 pb-1">
									<p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
										<DollarSign class="size-3" /> Payments
									</p>
									<div class="divide-y divide-slate-800/60">
										{#each sp._payments as payment (payment.id)}
											{@const sc = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.scheduled}
											{@const StatusIcon = sc.icon}
											<div class="flex items-center gap-3 py-2">
												<span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border {sc.bg} {sc.border} {sc.color} shrink-0 min-w-[72px] justify-center">
													<StatusIcon class="size-2.5" />{sc.label}
												</span>
												<div class="flex-1 min-w-0">
													<p class="text-xs text-slate-300">{PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType}
														{#if payment.invoiceNumber}<span class="text-slate-500"> · {payment.invoiceNumber}</span>{/if}
													</p>
													<div class="flex gap-2 text-[10px] text-slate-500">
														{#if payment.dueDate}<span>Due {fmtDate(payment.dueDate)}</span>{/if}
														{#if payment.receivedDate}<span class="text-emerald-400">Rcvd {fmtDate(payment.receivedDate)}</span>{/if}
													</div>
												</div>
												<p class="text-xs font-black tabular-nums text-slate-100 shrink-0">{fmt(payment.amount)}</p>
												<div class="flex gap-1 shrink-0">
													{#if payment.status !== 'received'}
														<button onclick={() => { markModal = payment; markForm = { receivedDate: new Date().toISOString().slice(0,10), notes: '', qbTransactionId: '' }; markErr = ''; }}
															class="text-[10px] px-2 py-0.5 rounded border border-emerald-600/50 text-emerald-300 hover:bg-emerald-600/10 transition-colors">Received</button>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Footer -->
							<div class="px-5 py-2.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
								<span class="text-[10px] text-slate-500">{sp._pos.length} PO{sp._pos.length !== 1 ? 's' : ''} · {sp._payments.length} payment{sp._payments.length !== 1 ? 's' : ''}</span>
								<a href="/dashboard/sponsors/{sp.id}" class="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
									Full record <ArrowRight class="size-3" />
								</a>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Mark Received Modal -->
{#if markModal}
{@const sc = STATUS_CONFIG[markModal.status] ?? STATUS_CONFIG.scheduled}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Mark Payment Received</h2>
				<p class="text-xs text-slate-400 mt-0.5">{markModal.expand?.sponsor?.companyName ?? ''} · {fmt(markModal.amount)}</p>
			</div>
			<button onclick={() => markModal = null} class="text-slate-400 hover:text-slate-100"><X class="size-5" /></button>
		</div>
		<div class="p-5 space-y-4">
			{#if markErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{markErr}</p>{/if}

			<div><label class="block text-xs font-medium text-slate-400 mb-1">Date Received *</label>
				<input type="date" bind:value={markForm.receivedDate} class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>

			<div><label class="block text-xs font-medium text-slate-400 mb-1">QB Transaction ID</label>
				<input bind:value={markForm.qbTransactionId} placeholder="e.g. 1042" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" /></div>

			<div><label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
				<textarea bind:value={markForm.notes} rows="2" class="w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-500" placeholder="Wire transfer ref, check number, etc."></textarea></div>

			<div class="flex justify-end gap-3 pt-1">
				<button type="button" onclick={() => markModal = null} class="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancel</button>
				<button onclick={markReceived} disabled={markLoading} class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
					<CheckCircle2 class="size-4" />{markLoading ? 'Saving…' : 'Confirm Received'}
				</button>
			</div>
		</div>
	</div>
</div>
{/if}
