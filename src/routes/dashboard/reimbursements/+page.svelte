<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, X, Receipt, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, Pencil, Trash2, Send, DollarSign, Hash, UserCircle, Building2, ShieldCheck, Info, FileText, ArrowRight } from 'lucide-svelte';
	import type { PageData } from './$types';
	import {
		CLAIM_STATUS_LABELS, CLAIM_STATUS_COLORS, CLAIMANT_PIPELINE,
		ITEM_CATEGORY_LABELS, PAYMENT_METHOD_LABELS
	} from '$lib/domain/schemas/reimbursement.schema';

	let { data }: { data: PageData } = $props();

	const fmt     = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	// ── UI state ──────────────────────────────────────────────────────────────
	let showNewClaim    = $state(false);
	let showInstructions = $state(false);
	let showAbout       = $state(false);
	let expandedClaim   = $state<string | null>(null);
	let adminExpanded   = $state<string | null>(null);
	let saving        = $state(false);
	let err           = $state('');

	// ── New claim form ────────────────────────────────────────────────────────
	let claimTitle = $state('');
	let claimNotes = $state('');
	let lineItems  = $state<{ description: string; amount: string; date: string; category: string; vendor: string; vendorId: string; notes: string; receipts: FileList | null }[]>([
		{ description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }
	]);

	function addLine() {
		lineItems = [...lineItems, { description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }];
	}
	function removeLine(i: number) {
		if (lineItems.length === 1) return;
		lineItems = lineItems.filter((_, idx) => idx !== i);
	}

	const lineTotal = $derived(lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0));

	async function submitNewClaim(e: SubmitEvent) {
		e.preventDefault();
		if (!claimTitle.trim()) { err = 'Title is required'; return; }
		const validLines = lineItems.filter(l => l.description.trim() && Number(l.amount) > 0);
		if (!validLines.length) { err = 'Add at least one line item with a description and amount'; return; }
		saving = true; err = '';
		try {
			const res = await fetch('/api/reimbursements', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: claimTitle.trim(), notes: claimNotes.trim(), items: validLines.map(l => ({ ...l, amount: Number(l.amount), receipts: undefined })) })
			});
			if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
			showNewClaim = false;
			claimTitle = ''; claimNotes = '';
			lineItems = [{ description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }];
			await invalidateAll();
		} catch (e: any) { err = e.message ?? 'Failed'; }
		finally { saving = false; }
	}

	// Upload receipt images for a line item after the claim+item is created
	async function uploadReceipts(claimId: string, itemId: string, files: FileList) {
		if (!files?.length) return;
		const fd = new FormData();
		for (const f of Array.from(files)) fd.append('receipts', f);
		await fetch(`/api/reimbursements/${claimId}/items/${itemId}/receipts`, { method: 'POST', body: fd }).catch(() => {});
	}

	// ── Save draft then immediately submit for review ─────────────────────────
	async function submitAndSend(e: MouseEvent) {
		if (!claimTitle.trim()) { err = 'Title is required'; return; }
		const validLines = lineItems.filter(l => l.description.trim() && Number(l.amount) > 0);
		if (!validLines.length) { err = 'Add at least one line item with a description and amount'; return; }
		saving = true; err = '';
		try {
			const res = await fetch('/api/reimbursements', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: claimTitle.trim(), notes: claimNotes.trim(), items: validLines.map(l => ({ ...l, amount: Number(l.amount), receipts: undefined })) })
			});
			if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
			const claim = await res.json();
			// Immediately submit for review
			await fetch(`/api/reimbursements/${claim.id}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'submitted' })
			});
			showNewClaim = false;
			claimTitle = ''; claimNotes = '';
			lineItems = [{ description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }];
			await invalidateAll();
		} catch (e: any) { err = e.message ?? 'Failed'; }
		finally { saving = false; }
	}

	// ── Submit a draft claim for review ──────────────────────────────────────
	async function submitForReview(claimId: string) {
		await fetch(`/api/reimbursements/${claimId}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'submitted' })
		});
		await invalidateAll();
	}

	// ── Delete a draft claim ─────────────────────────────────────────────────
	async function deleteClaim(claimId: string) {
		if (!confirm('Delete this draft claim?')) return;
		await fetch(`/api/reimbursements/${claimId}`, { method: 'DELETE' });
		await invalidateAll();
	}

	// ── Admin: assign reference + mark paid ──────────────────────────────────
	let adminForm = $state<Record<string, { refNum: string; payMethod: string; paidDate: string; reviewNotes: string }>>({});

	// Pre-populate adminForm entries so getAdminForm never mutates state during rendering
	$effect(() => {
		const today = new Date().toISOString().slice(0, 10);
		for (const claim of data.allClaims) {
			if (!adminForm[claim.id]) {
				adminForm[claim.id] = { refNum: '', payMethod: 'bank_transfer', paidDate: today, reviewNotes: '' };
			}
		}
	});

	function getAdminForm(id: string) {
		return adminForm[id] ?? { refNum: '', payMethod: 'bank_transfer', paidDate: new Date().toISOString().slice(0,10), reviewNotes: '' };
	}

	async function adminAction(claimId: string, action: 'approve' | 'pay' | 'reject' | 'review') {
		const f = getAdminForm(claimId);
		const statusMap = { approve: 'approved', pay: 'paid', reject: 'rejected', review: 'under_review' };
		const update: Record<string, any> = { status: statusMap[action], reviewNotes: f.reviewNotes };
		if (action === 'pay') {
			if (!f.refNum.trim()) { alert('Reference number is required to mark as paid'); return; }
			update.referenceNumber = f.refNum.trim();
			update.paymentMethod   = f.payMethod;
			update.paidDate        = f.paidDate;
		}
		await fetch(`/api/reimbursements/${claimId}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(update)
		});
		await invalidateAll();
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	function itemsForClaim(claimId: string, source: any[]) {
		return source.filter((i: any) => i.claim === claimId);
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

<svelte:head><title>Reimbursements — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Reimbursements</h1>
			<p class="text-muted-foreground mt-1">Submit expenses for reimbursement — group multiple transactions into one claim</p>
		</div>
		<div class="flex items-center gap-3">
			{#if data.isAdmin}
				<a href="/dashboard/reimbursements/admin"
					class="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
					<FileText class="size-4" /> Admin View
				</a>
			{/if}
			<Button onclick={() => { showNewClaim = true; err = ''; }} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-4" /> New Claim
			</Button>
		</div>
	</div>

	<!-- About this page -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<button
			onclick={() => showAbout = !showAbout}
			class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/30 transition-colors text-left"
		>
			<div class="flex items-center gap-2.5">
				<Info class="size-4 text-slate-400 shrink-0" />
				<span class="text-sm font-medium text-slate-300">About this page &amp; how the pipeline works</span>
			</div>
			<ChevronDown class="size-4 text-slate-500 transition-transform {showAbout ? 'rotate-180' : ''}" />
		</button>

		{#if showAbout}
		<div class="border-t border-slate-700 px-5 py-5 space-y-5 text-sm text-slate-300">

			<!-- What is this -->
			<div class="space-y-1.5">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">What is this?</p>
				<p>The Reimbursements module lets FLI Golf team members submit out-of-pocket business expenses for reimbursement. Expenses are grouped into <strong class="text-slate-100">claims</strong> — each claim can contain multiple line items (receipts, transactions, etc.). Every claim is reviewed by Ina Masten (CPA, Masten Solutions) to verify tax treatment and IRS compliance before payment is authorized.</p>
			</div>

			<!-- Pipeline -->
			<div class="space-y-3">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">The Pipeline</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
					{#each [
						{ status: 'Draft',        color: 'border-slate-600 bg-slate-800/60',       dot: 'bg-slate-500',   who: 'Claimant',  desc: 'Claim created but not yet submitted. You can edit or delete it.' },
						{ status: 'Submitted',    color: 'border-blue-700/50 bg-blue-950/30',      dot: 'bg-blue-400',    who: 'Claimant',  desc: 'Sent for admin review. No further edits allowed.' },
						{ status: 'Under Review', color: 'border-yellow-700/50 bg-yellow-950/30',  dot: 'bg-yellow-400',  who: 'Admin',     desc: 'Admin is actively reviewing the claim and line items.' },
						{ status: 'Approved',     color: 'border-violet-700/50 bg-violet-950/30',  dot: 'bg-violet-400',  who: 'Admin',     desc: 'Claim approved. Admin will assign a reference number and process payment.' },
						{ status: 'Paid',         color: 'border-emerald-700/50 bg-emerald-950/30',dot: 'bg-emerald-400', who: 'Admin',     desc: 'Payment issued. A Work Order record is created automatically — this is the electronic record Ina uses to enter the payment in QuickBooks.' },
					] as stage}
						<div class="rounded-lg border {stage.color} p-3 space-y-1.5">
							<div class="flex items-center gap-2">
								<span class="size-2 rounded-full {stage.dot} shrink-0"></span>
								<span class="font-semibold text-slate-100 text-xs">{stage.status}</span>
								<span class="ml-auto text-[10px] text-slate-500">{stage.who}</span>
							</div>
							<p class="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
						</div>
					{/each}
				</div>
				<p class="text-xs text-slate-500">Claims can also be <span class="text-red-400 font-medium">Rejected</span> at any point — the claimant will see a review note explaining why.</p>
			</div>

			<!-- How to submit -->
			<div class="space-y-1.5">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">How to submit a claim</p>
				<ol class="space-y-1 text-xs text-slate-400 list-none">
					{#each [
						'Click New Claim and give it a descriptive title (e.g. "March Travel — Phoenix Conference").',
						'Add one line item per expense — description, amount, date, category, and vendor.',
						'Click Submit for Review to send it to the admin queue. Or save as a draft to finish later.',
						'Once paid, your claim will show a Work Order number (WO-NNN). This is the reference Ina uses to enter the payment in QuickBooks — keep it for your records.',
					] as step, i}
						<li class="flex items-start gap-2.5">
							<span class="size-5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
							<span>{step}</span>
						</li>
					{/each}
				</ol>
			</div>

			<!-- Admin actions -->
			{#if data.isAdmin}
			<div class="space-y-1.5 border-t border-slate-700 pt-4">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">Admin actions</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
					<div class="flex items-start gap-2"><ArrowRight class="size-3.5 text-blue-400 mt-0.5 shrink-0" /><span><strong class="text-slate-200">Mark Under Review</strong> — signals to the claimant that you're actively reviewing their claim.</span></div>
					<div class="flex items-start gap-2"><ArrowRight class="size-3.5 text-violet-400 mt-0.5 shrink-0" /><span><strong class="text-slate-200">Approve</strong> — confirms the claim is valid and queued for payment.</span></div>
					<div class="flex items-start gap-2"><ArrowRight class="size-3.5 text-emerald-400 mt-0.5 shrink-0" /><span><strong class="text-slate-200">Mark Paid</strong> — requires a reference number (WO-NNN) and payment method. Automatically creates a <strong class="text-slate-200">Work Order</strong> record — the electronic payment record Ina enters in QuickBooks. Also stamps the WO number on the claim and every line item, and debits the department budget.</span></div>
					<div class="flex items-start gap-2"><ArrowRight class="size-3.5 text-red-400 mt-0.5 shrink-0" /><span><strong class="text-slate-200">Reject</strong> — closes the claim. Add a review note so the claimant knows why.</span></div>
				</div>
			</div>
			{/if}

		</div>
		{/if}
	</div>

	<!-- Department info card -->
	{#if data.reimbDept}
	<div class="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
		<div class="flex items-start gap-4 flex-wrap">
			<div class="flex items-center gap-3 min-w-0">
				<div class="size-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
					<Building2 class="size-5 text-emerald-400" />
				</div>
				<div class="min-w-0">
					<p class="text-xs font-bold uppercase tracking-wide text-emerald-400">Department</p>
					<p class="text-sm font-bold text-white">{data.reimbDept.name}</p>
					<p class="text-xs text-muted-foreground mt-0.5">{data.reimbDept.description}</p>
				</div>
			</div>
			{#if data.cpa}
			<div class="flex items-center gap-3 ml-auto shrink-0">
				<div class="size-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
					<UserCircle class="size-5 text-violet-400" />
				</div>
				<div>
					<p class="text-xs font-bold uppercase tracking-wide text-violet-400">CPA / Department Head</p>
					<p class="text-sm font-bold text-white">{data.cpa.firstName} {data.cpa.lastName}</p>
					<div class="flex items-center gap-1.5 mt-0.5">
						<ShieldCheck class="size-3 text-emerald-400" />
						<a href="mailto:{data.cpa.email}" class="text-xs text-emerald-400 hover:underline">{data.cpa.email}</a>
					</div>
				</div>
			</div>
			{/if}
		</div>
	</div>
	{/if}

	<!-- Admin metrics -->
	{#if data.isAdmin && data.metrics}
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card class="p-4 bg-blue-950/40 border-blue-800/50 text-center">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Pending Review</p>
			<p class="text-2xl font-bold text-blue-300">{data.metrics.pendingCount}</p>
		</Card>
		<Card class="p-4 bg-yellow-950/40 border-yellow-800/50 text-center">
			<p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">Approved (Unpaid)</p>
			<p class="text-2xl font-bold text-yellow-300">{fmt(data.metrics.approvedTotal)}</p>
		</Card>
		<Card class="p-4 bg-emerald-950/40 border-emerald-800/50 text-center">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Total Paid Out</p>
			<p class="text-2xl font-bold text-emerald-300">{fmt(data.metrics.paidTotal)}</p>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700 text-center">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Claims</p>
			<p class="text-2xl font-bold text-slate-200">{data.metrics.totalClaims}</p>
		</Card>
	</div>
	{/if}

	<!-- My Claims -->
	<div>
		<h2 class="text-lg font-semibold text-slate-200 mb-3">My Claims</h2>
		{#if data.myClaims.length === 0}
			<Card class="p-8 text-center bg-slate-800/40 border-slate-700">
				<Receipt class="size-10 text-slate-600 mx-auto mb-3" />
				<p class="text-slate-400 text-sm">No claims yet. Click <strong class="text-slate-200">New Claim</strong> to submit your first reimbursement request.</p>
			</Card>
		{:else}
			<div class="space-y-3">
				{#each data.myClaims as claim}
					{@const items = itemsForClaim(claim.id, data.myItems)}
					{@const isOpen = expandedClaim === claim.id}
					<Card class="overflow-hidden bg-slate-800/50 border-slate-700">
						<!-- Claim header row -->
						<button
							onclick={() => expandedClaim = isOpen ? null : claim.id}
							class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors text-left"
						>
							<div class="flex items-center gap-3 min-w-0">
								<ChevronRight class="size-4 text-slate-500 shrink-0 transition-transform {isOpen ? 'rotate-90' : ''}" />
								<div class="min-w-0">
									<p class="font-semibold text-slate-100 truncate">{claim.title}</p>
									<p class="text-xs text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} · submitted {fmtDate(claim.created)}</p>
								</div>
							</div>
							<div class="flex items-center gap-3 shrink-0 ml-4">
								{#if claim.referenceNumber}
									<span class="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">{claim.referenceNumber}</span>
								{/if}
								<span class="font-bold text-emerald-400">{fmt(claim.totalAmount || 0)}</span>
								<span class="text-[10px] px-2 py-0.5 rounded border font-medium {CLAIM_STATUS_COLORS[claim.status]}">{CLAIM_STATUS_LABELS[claim.status]}</span>
							</div>
						</button>

						<!-- Expanded detail -->
						{#if isOpen}
						<div class="border-t border-slate-700 px-5 py-4 space-y-4">
							<!-- Pipeline progress -->
							{#if claim.status !== 'rejected'}
							<div class="flex items-center gap-0">
								{#each CLAIMANT_PIPELINE as stage, i}
									{@const done   = CLAIMANT_PIPELINE.indexOf(claim.status) > i}
									{@const active = claim.status === stage}
									<div class="flex items-center flex-1">
										<div class="flex flex-col items-center gap-1 flex-1">
											<div class="size-2.5 rounded-full {active ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : done ? 'bg-emerald-600' : 'bg-slate-700'}"></div>
											<span class="text-[9px] {active ? 'text-emerald-400 font-semibold' : done ? 'text-slate-400' : 'text-slate-600'}">{CLAIM_STATUS_LABELS[stage]}</span>
										</div>
										{#if i < CLAIMANT_PIPELINE.length - 1}
											<div class="h-px flex-1 mb-3 {done ? 'bg-emerald-600' : 'bg-slate-700'} mx-0.5"></div>
										{/if}
									</div>
								{/each}
							</div>
							{/if}

							<!-- Line items table -->
							<table class="w-full text-xs">
								<thead>
									<tr class="text-left text-slate-400 uppercase tracking-wide border-b border-slate-700">
										<th class="pb-1.5 pr-3">Description</th>
										<th class="pb-1.5 pr-3">Category</th>
										<th class="pb-1.5 pr-3">Vendor</th>
										<th class="pb-1.5 pr-3">Date</th>
										<th class="pb-1.5 text-right">Amount</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-700/40">
									{#each items as item}
										<tr class="hover:bg-slate-700/20 align-top">
											<td class="py-1.5 pr-3 text-slate-200">
												{item.description}
												{#if item.receipts?.length}
													<span class="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
														{item.receipts.length} receipt{item.receipts.length !== 1 ? 's' : ''}
													</span>
												{/if}
											</td>
											<td class="py-1.5 pr-3 text-slate-400 capitalize">{ITEM_CATEGORY_LABELS[item.category] ?? item.category}</td>
											<td class="py-1.5 pr-3 text-slate-400">{item.expand?.vendorId?.name || item.vendor || '—'}</td>
											<td class="py-1.5 pr-3 text-slate-400">{fmtDate(item.date)}</td>
											<td class="py-1.5 text-right font-semibold text-emerald-400">{fmt(item.amount)}</td>
										</tr>
									{/each}
								</tbody>
								<tfoot class="border-t border-slate-600">
									<tr>
										<td colspan="4" class="pt-2 text-slate-400 font-semibold text-xs">Total</td>
										<td class="pt-2 text-right font-bold text-emerald-300">{fmt(claim.totalAmount || 0)}</td>
									</tr>
								</tfoot>
							</table>

							{#if claim.notes}
								<p class="text-xs text-slate-400 italic">"{claim.notes}"</p>
							{/if}
							{#if claim.reviewNotes}
								<div class="p-3 rounded-lg bg-yellow-950/30 border border-yellow-800/40 text-xs text-yellow-300">
									<span class="font-semibold">Admin note:</span> {claim.reviewNotes}
								</div>
							{/if}
							{#if claim.referenceNumber}
								<div class="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3">
									<span class="text-lg font-black font-mono text-emerald-400">{claim.referenceNumber}</span>
									<div class="text-xs text-emerald-300/70">
										<p>QuickBooks reference — use this number when entering the payment in QB.</p>
										{#if claim.paidDate}<p class="mt-0.5 text-slate-400">Paid {fmtDate(claim.paidDate)}</p>{/if}
									</div>
								</div>
							{/if}

							<!-- Actions for draft -->
							{#if claim.status === 'draft'}
							<div class="flex gap-2 pt-1">
								<Button onclick={() => submitForReview(claim.id)} class="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs px-3">
									<Send class="size-3.5" /> Submit for Review
								</Button>
								<Button onclick={() => deleteClaim(claim.id)} variant="outline" class="gap-2 border-red-800 text-red-400 hover:bg-red-900/30 h-8 text-xs px-3">
									<Trash2 class="size-3.5" /> Delete Draft
								</Button>
							</div>
							{/if}
						</div>
						{/if}
					</Card>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Admin: All Claims -->
	{#if data.isAdmin && data.allClaims.length > 0}
	<div>
		<h2 class="text-lg font-semibold text-slate-200 mb-3">All Claims — Admin View</h2>
		<div class="space-y-3">
			{#each data.allClaims as claim}
				{@const items  = itemsForClaim(claim.id, data.allItems)}
				{@const isOpen = adminExpanded === claim.id}
				{@const af     = getAdminForm(claim.id)}
				<Card class="overflow-hidden bg-slate-800/50 border-slate-700">
					<button
						onclick={() => adminExpanded = isOpen ? null : claim.id}
						class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors text-left"
					>
						<div class="flex items-center gap-3 min-w-0">
							<ChevronRight class="size-4 text-slate-500 shrink-0 transition-transform {isOpen ? 'rotate-90' : ''}" />
							<div class="min-w-0">
								<p class="font-semibold text-slate-100 truncate">{claim.title}</p>
								<p class="text-xs text-slate-400 mt-0.5">
									{claim.expand?.claimant?.firstName ?? ''} {claim.expand?.claimant?.lastName ?? claim.claimant}
									· {items.length} item{items.length !== 1 ? 's' : ''}
									· {fmtDate(claim.created)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-3 shrink-0 ml-4">
							{#if claim.referenceNumber}
								<span class="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">{claim.referenceNumber}</span>
							{/if}
							<span class="font-bold text-emerald-400">{fmt(claim.totalAmount || 0)}</span>
							<span class="text-[10px] px-2 py-0.5 rounded border font-medium {CLAIM_STATUS_COLORS[claim.status]}">{CLAIM_STATUS_LABELS[claim.status]}</span>
						</div>
					</button>

					{#if isOpen}
					<div class="border-t border-slate-700 px-5 py-4 space-y-4">
						<!-- Line items -->
						<table class="w-full text-xs">
							<thead>
								<tr class="text-left text-slate-400 uppercase tracking-wide border-b border-slate-700">
									<th class="pb-1.5 pr-3">Description</th>
									<th class="pb-1.5 pr-3">Category</th>
									<th class="pb-1.5 pr-3">Vendor</th>
									<th class="pb-1.5 pr-3">Date</th>
									<th class="pb-1.5 text-right">Amount</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-700/40">
								{#each items as item}
									<tr class="hover:bg-slate-700/20 align-top">
										<td class="py-1.5 pr-3 text-slate-200">
											{item.description}
											{#if item.receipts?.length}
												<span class="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
													{item.receipts.length} receipt{item.receipts.length !== 1 ? 's' : ''}
												</span>
											{/if}
										</td>
										<td class="py-1.5 pr-3 text-slate-400 capitalize">{ITEM_CATEGORY_LABELS[item.category] ?? item.category}</td>
										<td class="py-1.5 pr-3 text-slate-400">{item.expand?.vendorId?.name || item.vendor || '—'}</td>
										<td class="py-1.5 pr-3 text-slate-400">{fmtDate(item.date)}</td>
										<td class="py-1.5 text-right font-semibold text-emerald-400">{fmt(item.amount)}</td>
									</tr>
								{/each}
							</tbody>
							<tfoot class="border-t border-slate-600">
								<tr>
									<td colspan="4" class="pt-2 text-slate-400 font-semibold">Total</td>
									<td class="pt-2 text-right font-bold text-emerald-300">{fmt(claim.totalAmount || 0)}</td>
								</tr>
							</tfoot>
						</table>

						{#if claim.notes}<p class="text-xs text-slate-400 italic">Claimant note: "{claim.notes}"</p>{/if}

						<!-- Admin action panel -->
						{#if claim.status !== 'paid' && claim.status !== 'rejected'}
						<div class="p-4 bg-slate-900/60 border border-slate-600 rounded-xl space-y-3">
							<p class="text-xs font-semibold text-slate-300 uppercase tracking-wide">Admin Actions</p>

							<div>
								<label class={LABEL}>Review Notes (visible to claimant)</label>
								<textarea bind:value={af.reviewNotes} rows="2" class="{INPUT} resize-none" placeholder="Feedback, questions, or approval notes…"></textarea>
							</div>

							{#if claim.status === 'approved'}
							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class={LABEL}>Reference Number *</label>
									<input bind:value={af.refNum} class={INPUT} placeholder="REF-2026-001" />
								</div>
								<div>
									<label class={LABEL}>Payment Method</label>
									<select bind:value={af.payMethod} class={INPUT}>
										{#each Object.entries(PAYMENT_METHOD_LABELS) as [val, label]}
											<option value={val}>{label}</option>
										{/each}
									</select>
								</div>
								<div>
									<label class={LABEL}>Paid Date</label>
									<input bind:value={af.paidDate} type="date" class={INPUT} />
								</div>
							</div>
							{/if}

							<div class="flex flex-wrap gap-2">
								{#if claim.status === 'submitted'}
									<Button onclick={() => adminAction(claim.id, 'review')} variant="outline" class="gap-1.5 h-8 text-xs border-yellow-700 text-yellow-300 hover:bg-yellow-900/30">
										<Clock class="size-3.5" /> Mark Under Review
									</Button>
									<Button onclick={() => adminAction(claim.id, 'approve')} class="gap-1.5 h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white">
										<CheckCircle2 class="size-3.5" /> Approve
									</Button>
								{/if}
								{#if claim.status === 'under_review'}
									<Button onclick={() => adminAction(claim.id, 'approve')} class="gap-1.5 h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white">
										<CheckCircle2 class="size-3.5" /> Approve
									</Button>
								{/if}
								{#if claim.status === 'approved'}
									<Button onclick={() => adminAction(claim.id, 'pay')} class="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
										<DollarSign class="size-3.5" /> Mark as Paid
									</Button>
								{/if}
								<Button onclick={() => adminAction(claim.id, 'reject')} variant="outline" class="gap-1.5 h-8 text-xs border-red-800 text-red-400 hover:bg-red-900/30">
									<X class="size-3.5" /> Reject
								</Button>
							</div>
						</div>
						{:else if claim.status === 'paid'}
						<div class="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex flex-wrap items-center gap-3">
							<CheckCircle2 class="size-4 shrink-0" />
							<span>Paid via <strong>{PAYMENT_METHOD_LABELS[claim.paymentMethod] ?? claim.paymentMethod}</strong></span>
							<span class="font-mono flex items-center gap-1"><Hash class="size-3" />{claim.referenceNumber}</span>
							{#if claim.paidDate}<span class="text-slate-400">on {fmtDate(claim.paidDate)}</span>{/if}
							{#if claim.expand?.paidBy}<span class="text-slate-400">by {claim.expand.paidBy.firstName} {claim.expand.paidBy.lastName}</span>{/if}
						</div>
						{:else if claim.status === 'rejected'}
						<div class="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300">
							<span class="font-semibold">Rejected</span>{#if claim.reviewNotes} — {claim.reviewNotes}{/if}
						</div>
						{/if}
					</div>
					{/if}
				</Card>
			{/each}
		</div>
	</div>
	{/if}

</div>

<!-- New Claim Modal -->
{#if showNewClaim}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
		<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
			<div class="flex items-center gap-2">
				<Receipt class="size-5 text-emerald-400" />
				<span class="font-semibold text-slate-100">New Reimbursement Claim</span>
			</div>
			<button onclick={() => showNewClaim = false} class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close"><X class="size-5" /></button>
		</div>

		<form onsubmit={submitNewClaim} class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
			{#if err}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{err}</p>{/if}

			<!-- Collapsible instructions -->
			<div class="rounded-xl border border-slate-700 overflow-hidden">
				<button
					type="button"
					onclick={() => showInstructions = !showInstructions}
					class="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<AlertCircle class="size-4 text-blue-400 shrink-0" />
						<span class="text-sm font-medium text-slate-200">How reimbursements work</span>
					</div>
					<ChevronDown class="size-4 text-slate-400 transition-transform {showInstructions ? 'rotate-180' : ''}" />
				</button>
				{#if showInstructions}
				<div class="px-4 py-4 bg-slate-900/60 border-t border-slate-700 space-y-3 text-xs text-slate-300">
					<div class="flex gap-3">
						<span class="size-5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
						<div>
							<p class="font-semibold text-slate-200 mb-0.5">Your claim is tied to your account</p>
							<p class="text-slate-400">This claim is automatically linked to your user profile — you don't need to enter your name or ID. Admins will see who submitted it.</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="size-5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
						<div>
							<p class="font-semibold text-slate-200 mb-0.5">Group multiple transactions into one claim</p>
							<p class="text-slate-400">Add as many line items as you need — 10 receipts from a business trip, a month of software subscriptions, founder out-of-pocket expenses. One claim, one reference number when paid.</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="size-5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
						<div>
							<p class="font-semibold text-slate-200 mb-0.5">Attach receipts per line item</p>
							<p class="text-slate-400">Each line item has its own receipt upload (jpg, png, pdf). You can also link a vendor from the vendor list or type one manually.</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="size-5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold shrink-0 text-[10px]">4</span>
						<div>
							<p class="font-semibold text-slate-200 mb-0.5">Save as draft or submit immediately</p>
							<p class="text-slate-400"><strong class="text-slate-200">Save as Draft</strong> — keeps it private so you can add more items later. <strong class="text-slate-200">Save & Submit</strong> — sends it to the approvals queue right away.</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="size-5 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300 flex items-center justify-center font-bold shrink-0 text-[10px]">5</span>
						<div>
							<p class="font-semibold text-slate-200 mb-0.5">You'll receive a reference number when paid</p>
							<p class="text-slate-400">Once approved and paid, an admin assigns a reference number (e.g. <span class="font-mono text-slate-300">REF-2026-001</span>) to the whole batch. That single number covers every line item in the claim.</p>
						</div>
					</div>
				</div>
				{/if}
			</div>

			<div>
				<label class={LABEL}>Claim Title *</label>
				<input bind:value={claimTitle} required class={INPUT} placeholder="e.g. Q1 2026 Founder Expenses, March Travel Reimbursement" />
			</div>

			<!-- Line items -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class={LABEL}>Line Items *</label>
					<span class="text-xs text-slate-400">Total: <span class="font-bold text-emerald-400">{fmt(lineTotal)}</span></span>
				</div>
				<div class="space-y-2">
					{#each lineItems as item, i}
					<div class="p-3 rounded-xl border border-slate-700 bg-slate-800/60 space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-slate-400">Item {i + 1}</span>
							{#if lineItems.length > 1}
							<button type="button" onclick={() => removeLine(i)} class="text-slate-500 hover:text-red-400 transition-colors"><X class="size-3.5" /></button>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-2">
							<div class="col-span-2">
								<input bind:value={item.description} class={INPUT} placeholder="Description *" />
							</div>
							<div>
								<input bind:value={item.amount} type="number" min="0.01" step="0.01" class={INPUT} placeholder="Amount ($) *" />
							</div>
							<div>
								<input bind:value={item.date} type="date" class={INPUT} />
							</div>
							<div>
								<select bind:value={item.category} class={INPUT}>
									{#each Object.entries(ITEM_CATEGORY_LABELS) as [val, label]}
										<option value={val}>{label}</option>
									{/each}
								</select>
							</div>
							<!-- Vendor — pick from list or type free text -->
							<div>
								{#if data.vendors?.length}
									<select bind:value={item.vendorId} class={INPUT}
										onchange={() => { if (item.vendorId) item.vendor = ''; }}>
										<option value="">— Vendor (optional) —</option>
										{#each data.vendors as v}
											<option value={v.id}>{v.name}</option>
										{/each}
									</select>
								{:else}
									<input bind:value={item.vendor} class={INPUT} placeholder="Vendor / Merchant (optional)" />
								{/if}
							</div>
							{#if data.vendors?.length && !item.vendorId}
							<div class="col-span-2">
								<input bind:value={item.vendor} class={INPUT} placeholder="Or type vendor name manually (optional)" />
							</div>
							{/if}
							<!-- Receipt images -->
							<div class="col-span-2">
								<label class="block text-xs font-medium text-slate-400 mb-1">
									Receipts / Images <span class="text-slate-600">(optional — jpg, png, pdf, up to 10 files)</span>
								</label>
								<input
									type="file"
									multiple
									accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
									onchange={(e) => { item.receipts = (e.target as HTMLInputElement).files; }}
									class="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-600 file:bg-slate-700 file:text-slate-300 file:text-xs hover:file:bg-slate-600 file:transition-colors cursor-pointer"
								/>
								{#if item.receipts?.length}
									<p class="text-[10px] text-emerald-400 mt-1">{item.receipts.length} file{item.receipts.length !== 1 ? 's' : ''} selected</p>
								{/if}
							</div>
							<div class="col-span-2">
								<input bind:value={item.notes} class={INPUT} placeholder="Notes (optional)" />
							</div>
						</div>
					</div>
					{/each}
				</div>
				<button type="button" onclick={addLine}
					class="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-emerald-600 hover:text-emerald-400 transition-colors text-sm">
					<Plus class="size-4" /> Add Another Item
				</button>
			</div>

			<div>
				<label class={LABEL}>Notes (optional)</label>
				<textarea bind:value={claimNotes} rows="2" class="{INPUT} resize-none" placeholder="Context for the reviewer — what these expenses relate to…"></textarea>
			</div>

			<!-- Total summary -->
			<div class="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
				<span class="text-sm text-slate-300">{lineItems.filter(l => l.description && Number(l.amount) > 0).length} valid item{lineItems.filter(l => l.description && Number(l.amount) > 0).length !== 1 ? 's' : ''}</span>
				<span class="text-lg font-bold text-emerald-300">{fmt(lineTotal)}</span>
			</div>
		</form>

		<div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
			<Button type="button" variant="outline" onclick={() => showNewClaim = false} class="border-slate-600 text-slate-300">Cancel</Button>
			<Button onclick={submitNewClaim} disabled={saving} class="gap-2 bg-slate-700 hover:bg-slate-600 text-white">
				<Receipt class="size-4" />{saving ? 'Saving…' : 'Save as Draft'}
			</Button>
			<Button onclick={submitAndSend} disabled={saving} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Send class="size-4" />{saving ? 'Saving…' : 'Save & Submit'}
			</Button>
		</div>
	</div>
</div>
{/if}
