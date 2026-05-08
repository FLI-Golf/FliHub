<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { ClipboardList, CheckCircle2, Clock, XCircle, DollarSign, Copy, Check, Info, ChevronDown, FileDown, ArrowRight } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let statusFilter  = $state('all');
	let projectFilter = $state('all');
	let copied        = $state<string | null>(null);
	let markingPaid   = $state<string | null>(null);
	let showAbout     = $state(false);
	let expandedQB    = $state<string | null>(null);
	let savingQB      = $state<string | null>(null);

	// QB form state per WO
	let qbForms = $state<Record<string, { txnId: string; enteredBy: string; enteredDate: string; account: string; notes: string }>>({});

	$effect(() => {
		const today = new Date().toISOString().slice(0, 10);
		for (const wo of data.workOrders as any[]) {
			if (!qbForms[wo.id]) {
				qbForms[wo.id] = {
					txnId:       wo.qb_transaction_id  ?? '',
					enteredBy:   wo.qb_entered_by      ?? '',
					enteredDate: wo.qb_entered_date?.slice(0,10) ?? today,
					account:     wo.qb_account         ?? '',
					notes:       wo.qb_notes           ?? '',
				};
			}
		}
	});

	async function saveQB(woId: string) {
		savingQB = woId;
		const f = qbForms[woId];
		await fetch(`/api/work-orders/${woId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				qb_transaction_id: f.txnId,
				qb_entered_by:     f.enteredBy || null,
				qb_entered_date:   f.enteredDate,
				qb_account:        f.account,
				qb_notes:          f.notes,
				status:            'paid',
			})
		});
		savingQB = null;
		expandedQB = null;
		await invalidateAll();
	}

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
		catch { return '—'; }
	}

	const projects = $derived([...new Set((data.workOrders as any[]).map((w: any) => w.projectName).filter(Boolean))].sort());

	const filtered = $derived.by(() => {
		let list = data.workOrders as any[];
		if (statusFilter  !== 'all') list = list.filter((w: any) => w.status === statusFilter);
		if (projectFilter !== 'all') list = list.filter((w: any) => w.projectName === projectFilter);
		return list;
	});

	function statusColor(s: string) {
		switch (s) {
			case 'open':      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
			case 'paid':      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
			case 'cancelled': return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
			default:          return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
		}
	}

	async function copyWO(wo: string) {
		await navigator.clipboard.writeText(wo).catch(() => {});
		copied = wo;
		setTimeout(() => { copied = null; }, 1800);
	}

	function userName(u: any) {
		if (!u) return '—';
		return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
	}

	function generatePDF(wo: any) {
		const fmt2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
		const d = (s: string) => { try { return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return s || '—'; } };

		const isReimb   = wo.source === 'reimbursement';
		const isExpense = wo.source === 'expense';

		const claimItems = (wo._claimItems ?? []).map((item: any) => `
			<tr>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${item.description || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.category || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${item.vendor || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${d(item.date)}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${fmt2(item.amount)}</td>
			</tr>`).join('');

		const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Work Order Audit Report — ${wo.work_order_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a202c; background: #fff; padding: 40px; font-size: 13px; }
  .header { border-bottom: 3px solid #1a202c; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .wo-number { font-size: 28px; font-weight: 800; color: #2d3748; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-paid { background: #c6f6d5; color: #276749; }
  .badge-open { background: #fefcbf; color: #744210; }
  .badge-reimb { background: #e9d8fd; color: #553c9a; }
  .badge-expense { background: #bee3f8; color: #2a4365; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #718096; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .field label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #a0aec0; display: block; margin-bottom: 2px; }
  .field span { font-size: 13px; color: #2d3748; font-weight: 500; }
  .amount-big { font-size: 32px; font-weight: 800; color: #276749; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f7fafc; padding: 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; border-bottom: 2px solid #e2e8f0; }
  th:last-child, td:last-child { text-align: right; }
  .chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .chain-step { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 12px; }
  .chain-step strong { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #a0aec0; margin-bottom: 2px; }
  .arrow { color: #a0aec0; font-size: 16px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; display: flex; justify-content: space-between; }
  .note { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #744210; margin-bottom: 16px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">FLI Golf</div>
    <div style="color:#718096;font-size:12px;margin-top:2px">Work Order Audit Report</div>
  </div>
  <div style="text-align:right">
    <div class="wo-number">${wo.work_order_number}</div>
    <div style="margin-top:4px">
      <span class="badge ${wo.status === 'paid' ? 'badge-paid' : 'badge-open'}">${wo.status}</span>
      &nbsp;
      <span class="badge ${isReimb ? 'badge-reimb' : 'badge-expense'}">${isReimb ? 'Reimbursement' : 'Expense'}</span>
    </div>
    <div style="color:#718096;font-size:11px;margin-top:6px">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Payment Summary</div>
  <div class="grid3">
    <div class="field"><label>Total Amount</label><span class="amount-big">${fmt2(wo.amount)}</span></div>
    <div class="field"><label>Payment Method</label><span>${(wo.paymentMethod || '—').replace('_',' ')}</span></div>
    <div class="field"><label>Paid Date</label><span>${d(wo.paidDate)}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Audit Chain — How This Payment Was Authorized</div>
  <div class="chain">
    ${isReimb ? `
    <div class="chain-step"><strong>1. Submission</strong>${userName(wo._submittedBy)} submitted a reimbursement claim</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>2. Admin Review</strong>Claim reviewed &amp; approved by ${userName(wo._approver)}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>3. Payment</strong>Marked paid · ${d(wo.paidDate)}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>4. Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
    ` : `
    <div class="chain-step"><strong>1. Submission</strong>${userName(wo._submittedBy)} submitted an expense</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>2. Approval</strong>${wo._approval ? `Approved by ${userName(wo._approval?.expand?.approver)} on ${d(wo._approval?.reviewedDate)}` : 'Approved'}</div>
    <span class="arrow">→</span>
    ${wo._task ? `<div class="chain-step"><strong>3. Task</strong>${wo._task?.title || '—'}</div><span class="arrow">→</span>` : ''}
    ${wo._project ? `<div class="chain-step"><strong>${wo._task ? '4' : '3'}. Project</strong>${wo._project?.name || '—'}</div><span class="arrow">→</span>` : ''}
    <div class="chain-step"><strong>Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
    `}
  </div>
</div>

<div class="grid2">
  <div class="section">
    <div class="section-title">Submitted By</div>
    <div class="field"><label>Name</label><span>${userName(wo._submittedBy)}</span></div>
    ${wo._submittedBy?.email ? `<div class="field" style="margin-top:8px"><label>Email</label><span>${wo._submittedBy.email}</span></div>` : ''}
  </div>
  <div class="section">
    <div class="section-title">Approved By</div>
    <div class="field"><label>Name</label><span>${userName(wo._approver)}</span></div>
    <div class="field" style="margin-top:8px"><label>Approved Date</label><span>${d(wo.approvedDate)}</span></div>
  </div>
</div>

${wo._project || wo._task ? `
<div class="section">
  <div class="section-title">Project / Task Reference</div>
  <div class="grid2">
    ${wo._project ? `<div class="field"><label>Project</label><span>${wo._project?.name || '—'}</span></div>` : ''}
    ${wo._task ? `<div class="field"><label>Task</label><span>${wo._task?.title || '—'}</span></div>` : ''}
  </div>
</div>` : ''}

${isReimb && wo._claim ? `
<div class="section">
  <div class="section-title">Reimbursement Claim — ${wo._claim?.title || ''}</div>
  <div class="grid3" style="margin-bottom:12px">
    <div class="field"><label>Reference</label><span>${wo._claim?.referenceNumber || '—'}</span></div>
    <div class="field"><label>Status</label><span>${wo._claim?.status || '—'}</span></div>
    <div class="field"><label>Total</label><span>${fmt2(wo._claim?.totalAmount)}</span></div>
  </div>
  ${claimItems ? `
  <table>
    <thead><tr><th>Description</th><th>Category</th><th>Vendor</th><th>Date</th><th>Amount</th></tr></thead>
    <tbody>${claimItems}</tbody>
    <tfoot><tr>
      <td colspan="4" style="padding:8px;font-weight:700;border-top:2px solid #2d3748">Total</td>
      <td style="padding:8px;font-weight:800;text-align:right;border-top:2px solid #2d3748;color:#276749">${fmt2(wo._claim?.totalAmount)}</td>
    </tr></tfoot>
  </table>` : ''}
  ${wo._claim?.notes ? `<div class="note" style="margin-top:12px">Notes: ${wo._claim.notes}</div>` : ''}
</div>` : ''}

${isExpense && wo._expense ? `
<div class="section">
  <div class="section-title">Expense Detail</div>
  <div class="grid3">
    <div class="field"><label>Description</label><span>${wo._expense?.description || '—'}</span></div>
    <div class="field"><label>Category</label><span>${wo._expense?.category || '—'}</span></div>
    <div class="field"><label>Date</label><span>${d(wo._expense?.date)}</span></div>
  </div>
  ${wo._expense?.notes ? `<div class="note" style="margin-top:12px">${wo._expense.notes.replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${wo._approval ? `
<div class="section">
  <div class="section-title">Approval Record</div>
  <div class="grid3">
    <div class="field"><label>Status</label><span>${wo._approval?.status || '—'}</span></div>
    <div class="field"><label>Requested</label><span>${d(wo._approval?.requestedDate)}</span></div>
    <div class="field"><label>Reviewed</label><span>${d(wo._approval?.reviewedDate)}</span></div>
  </div>
  ${wo._approval?.comments ? `<div class="note" style="margin-top:12px">${wo._approval.comments.replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${wo.notes ? `
<div class="section">
  <div class="section-title">Notes</div>
  <div class="note">${wo.notes}</div>
</div>` : ''}

<div class="section" style="border:2px solid ${wo.qb_transaction_id ? '#276749' : '#e2e8f0'};border-radius:8px;padding:16px;background:${wo.qb_transaction_id ? '#f0fff4' : '#fffbeb'}">
  <div class="section-title" style="color:${wo.qb_transaction_id ? '#276749' : '#744210'}">QuickBooks Entry ${wo.qb_transaction_id ? '— Recorded' : '— Pending'}</div>
  ${wo.qb_transaction_id ? `
  <div class="grid3">
    <div class="field"><label>QB Transaction ID</label><span style="font-size:18px;font-weight:800;color:#276749">${wo.qb_transaction_id}</span></div>
    <div class="field"><label>QB Account</label><span>${wo.qb_account || '—'}</span></div>
    <div class="field"><label>Date Entered</label><span>${d(wo.qb_entered_date)}</span></div>
  </div>
  ${wo._qbEnteredBy ? `<div class="field" style="margin-top:8px"><label>Entered By</label><span>${userName(wo._qbEnteredBy)}</span></div>` : wo.qb_entered_by ? `<div class="field" style="margin-top:8px"><label>Entered By</label><span>${wo.qb_entered_by}</span></div>` : ''}
  ${wo.qb_notes ? `<div class="note" style="margin-top:10px;background:#c6f6d5;border-color:#9ae6b4;color:#276749">${wo.qb_notes}</div>` : ''}
  ` : `
  <p style="color:#744210;font-size:12px">⚠️ This work order has not yet been recorded in QuickBooks. The audit chain is incomplete until a QB transaction ID is entered.</p>
  `}
</div>

<div class="footer">
  <span>FLI Golf — Confidential Financial Document</span>
  <span>${wo.work_order_number} · Generated ${new Date().toISOString()}</span>
</div>

</body>
</html>`;

		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(html);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 400);
	}

	async function markPaid(woId: string, expenseId: string) {
		markingPaid = woId;
		try {
			const res = await fetch('/api/expenses', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expenseId, status: 'paid', paidDate: new Date().toISOString() })
			});
			if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
			await invalidateAll();
		} catch (e: any) {
			alert('Failed to mark paid: ' + e.message);
		} finally {
			markingPaid = null;
		}
	}
</script>

<svelte:head><title>Work Orders — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold mb-1 tracking-tight">Work Orders</h1>
		<p class="text-muted-foreground">Approved expenses ready for QuickBooks payment processing</p>
	</div>

	<!-- About this page -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<button onclick={() => showAbout = !showAbout}
			class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/30 transition-colors text-left">
			<div class="flex items-center gap-2.5">
				<Info class="size-4 text-slate-400 shrink-0" />
				<span class="text-sm font-medium text-slate-300">About this page &amp; how work orders are created</span>
			</div>
			<ChevronDown class="size-4 text-slate-500 transition-transform {showAbout ? 'rotate-180' : ''}" />
		</button>

		{#if showAbout}
		<div class="border-t border-slate-700 px-5 py-5 space-y-5 text-sm text-slate-300">

			<div class="space-y-1.5">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">What is a Work Order?</p>
				<p>A Work Order (WO) is the single authoritative record of a payment made by FLI Golf. Every payment — whether from an approved expense or a paid reimbursement claim — generates exactly one Work Order. The WO number is the reference used when entering the payment in QuickBooks, and it is stamped on every related record so any payment can be fully traced from origin to settlement.</p>
			</div>

			<div class="space-y-3">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">How Work Orders Are Created</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="rounded-lg border border-blue-700/40 bg-blue-950/20 p-4 space-y-2">
						<p class="text-xs font-bold text-blue-300 uppercase tracking-wide">Path 1 — Expense Approval</p>
						<div class="flex flex-col gap-1.5 text-xs text-slate-400">
							{#each [
								['Submitted', 'Team member submits an expense linked to a task'],
								['Approval queue', 'Expense appears in /dashboard/approvals for admin review'],
								['Approved', 'Admin approves — quorum met'],
								['Work Order created', 'WO number stamped on expense, task, and work_orders record'],
								['QuickBooks', 'Finance enters payment using the WO number'],
							] as [step, desc], i}
								<div class="flex items-start gap-2">
									<span class="size-5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
									<span><strong class="text-slate-200">{step}</strong> — {desc}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-violet-700/40 bg-violet-950/20 p-4 space-y-2">
						<p class="text-xs font-bold text-violet-300 uppercase tracking-wide">Path 2 — Reimbursement Claim</p>
						<div class="flex flex-col gap-1.5 text-xs text-slate-400">
							{#each [
								['New Claim', 'Team member creates a claim with one or more line items'],
								['Submitted', 'Claim submitted for CPA review'],
								['Under Review', 'Admin/CPA reviews line items and receipts'],
								['Approved → Paid', 'Admin marks paid with reference number and payment method'],
								['Work Order created', 'WO number stamped on claim, all line items, and work_orders record'],
							] as [step, desc], i}
								<div class="flex items-start gap-2">
									<span class="size-5 rounded-full bg-violet-900/60 text-violet-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
									<span><strong class="text-slate-200">{step}</strong> — {desc}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-1.5">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">Audit Trail</p>
				<p class="text-xs text-slate-400">Every Work Order links back to its full origin — the submitter, the approver, the expense or claim, the task, and the project. Click <strong class="text-slate-200">Audit Report</strong> on any row to generate a PDF showing the complete payment chain. This document is suitable for IRS audit, QuickBooks reconciliation, or internal review.</p>
			</div>

		</div>
		{/if}
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Open</p>
					<p class="text-2xl font-bold">{data.stats.open}</p>
					<p class="text-xs text-amber-400 mt-1">{fmt(data.stats.openAmount)}</p>
				</div>
				<Clock class="size-8 text-amber-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Paid</p>
					<p class="text-2xl font-bold">{data.stats.paid}</p>
				</div>
				<CheckCircle2 class="size-8 text-emerald-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Cancelled</p>
					<p class="text-2xl font-bold">{data.stats.cancelled}</p>
				</div>
				<XCircle class="size-8 text-slate-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total Amount</p>
					<p class="text-2xl font-bold">{fmt(data.stats.totalAmount)}</p>
				</div>
				<DollarSign class="size-8 text-blue-500 opacity-40" />
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-wrap items-end gap-4">
			<div>
				<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Status</label>
				<select bind:value={statusFilter} class="px-3 py-2 border rounded-lg bg-background text-sm">
					<option value="all">All</option>
					<option value="open">Open</option>
					<option value="paid">Paid</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
			<div>
				<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Project</label>
				<select bind:value={projectFilter} class="px-3 py-2 border rounded-lg bg-background text-sm">
					<option value="all">All Projects</option>
					{#each projects as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</div>
			<p class="text-sm text-muted-foreground pb-2">Showing {filtered.length} of {data.workOrders.length}</p>
		</div>
	</Card>

	<!-- Table -->
	{#if filtered.length === 0}
		<Card class="p-10 text-center">
			<ClipboardList class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-muted-foreground">No work orders yet. They are created automatically when an expense is approved.</p>
		</Card>
	{:else}
		<Card class="overflow-hidden p-0">
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-slate-700 bg-slate-800/50">
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">WO #</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Project</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
							<th class="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Approved</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each filtered as wo (wo.id)}
							<tr class="hover:bg-slate-800/30 transition-colors">
								<!-- WO Number — copy to clipboard -->
								<td class="px-4 py-3">
									<button
										type="button"
										onclick={() => copyWO(wo.work_order_number)}
										class="flex items-center gap-1.5 font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
										title="Copy to clipboard"
									>
										{wo.work_order_number}
										{#if copied === wo.work_order_number}
											<Check class="size-3.5 text-emerald-400" />
										{:else}
											<Copy class="size-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
										{/if}
									</button>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-slate-200 truncate max-w-[160px]">{wo.projectName || '—'}</div>
									<div class="text-xs text-slate-500">{wo.projectCode}</div>
								</td>
								<td class="px-4 py-3 text-slate-300 max-w-[200px] truncate">{wo.description || '—'}</td>
								<td class="px-4 py-3 text-right font-semibold tabular-nums text-slate-100">{fmt(wo.amount)}</td>
								<td class="px-4 py-3 text-slate-400 text-xs">{fmtDate(wo.approvedDate)}</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(wo.status)}">
										{wo.status}
									</span>
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center gap-2 flex-wrap">
										<!-- QB entry button — shown when no QB txn yet -->
										{#if !wo.qb_transaction_id}
											<button
												type="button"
												onclick={() => expandedQB = expandedQB === wo.id ? null : wo.id}
												class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-700/40 text-blue-300 hover:bg-blue-900/60 transition-colors whitespace-nowrap"
											>
												<DollarSign class="size-3.5" /> Record in QB
											</button>
										{:else}
											<span class="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 font-mono">
												<CheckCircle2 class="size-3" /> {wo.qb_transaction_id}
											</span>
											<button
												type="button"
												onclick={() => expandedQB = expandedQB === wo.id ? null : wo.id}
												class="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
											>edit</button>
										{/if}
										<button
											type="button"
											onclick={() => generatePDF(wo)}
											class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60 hover:text-slate-100 transition-colors whitespace-nowrap"
										>
											<FileDown class="size-3.5" /> Audit Report
										</button>
									</div>
								</td>
							</tr>

							<!-- QB entry panel -->
							{#if expandedQB === wo.id}
							{@const f = qbForms[wo.id] ?? { txnId:'', enteredBy:'', enteredDate: new Date().toISOString().slice(0,10), account:'', notes:'' }}
							<tr class="bg-blue-950/20 border-b border-blue-800/30">
								<td colspan="8" class="px-6 py-4">
									<div class="max-w-3xl space-y-3">
										<p class="text-xs font-bold text-blue-300 uppercase tracking-wide flex items-center gap-2">
											<DollarSign class="size-3.5" /> QuickBooks Transaction Entry
										</p>
										<p class="text-xs text-slate-400">Record the QB transaction details after entering this payment in QuickBooks. This completes the audit chain.</p>
										<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Transaction ID *</label>
												<input bind:value={f.txnId} placeholder="e.g. 1042"
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
											</div>
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Account</label>
												<input bind:value={f.account} placeholder="e.g. Operating Expenses"
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
											</div>
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Date Entered in QB</label>
												<input type="date" bind:value={f.enteredDate}
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]" />
											</div>
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Entered By</label>
												<input bind:value={f.enteredBy} placeholder="Name or user ID"
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
											</div>
										</div>
										<div>
											<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Notes</label>
											<input bind:value={f.notes} placeholder="Any additional notes for the QB entry…"
												class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
										</div>
										<div class="flex items-center gap-3 pt-1">
											<button onclick={() => saveQB(wo.id)} disabled={savingQB === wo.id || !f.txnId.trim()}
												class="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-blue-700/60 border border-blue-600/50 text-blue-100 hover:bg-blue-700/80 transition-colors disabled:opacity-50 font-semibold">
												{savingQB === wo.id ? 'Saving…' : '✓ Save QB Entry'}
											</button>
											<button onclick={() => expandedQB = null}
												class="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">Cancel</button>
										</div>
									</div>
								</td>
							</tr>
							{/if}

						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>
