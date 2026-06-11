<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, X, Receipt, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, Pencil, Trash2, Send, DollarSign, Hash, UserCircle, Building2, ShieldCheck, Info, FileText, ArrowRight, Upload, Loader2 } from 'lucide-svelte';
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
	let showMyClaims    = $state(false);
	let showItemFinder  = $state(false);
	let expandedClaim   = $state<string | null>(null);
	let adminExpanded   = $state<string | null>(null);
	let saving        = $state(false);
	let err           = $state('');
	let itemFilter    = $state('');
	let attachingReceiptItemId = $state<string | null>(null);
	let removingReceiptItemId = $state<string | null>(null);
	let attachReceiptErr = $state('');
	let selectedItemIds = $state<Record<string, boolean>>({});
	let bankStatementFile = $state<File | null>(null);
	let bankStatementUploading = $state(false);
	let bankStatementErr = $state('');

	// ── New claim form ────────────────────────────────────────────────────────
	let claimTitle = $state('');
	let claimNotes = $state('');
	let lineItems  = $state<{ description: string; amount: string; date: string; category: string; vendor: string; vendorId: string; notes: string; receipts: FileList | null }[]>([
		{ description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }
	]);
	let editingMaxClaimTotal = $state(false);
	let maxClaimTotalInput = $state(String(data.maxClaimTotal ?? 1500));
	let maxClaimTotalError = $state('');
	let savingMaxClaimTotal = $state(false);

	function addLine() {
		lineItems = [...lineItems, { description: '', amount: '', date: '', category: 'other', vendor: '', vendorId: '', notes: '', receipts: null }];
	}
	function removeLine(i: number) {
		if (lineItems.length === 1) return;
		lineItems = lineItems.filter((_, idx) => idx !== i);
	}

	const lineTotal = $derived(lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0));
	const maxClaimTotal = $derived(Number(data.maxClaimTotal ?? 1500));
	const remainingClaimLimit = $derived(Math.max(0, maxClaimTotal - lineTotal));
	const isOverClaimLimit = $derived(lineTotal > maxClaimTotal);

	async function submitNewClaim(e: SubmitEvent) {
		e.preventDefault();
		if (!claimTitle.trim()) { err = 'Title is required'; return; }
		const validLines = lineItems.filter(l => l.description.trim() && Number(l.amount) > 0);
		if (!validLines.length) { err = 'Add at least one line item with a description and amount'; return; }
		if (lineTotal > maxClaimTotal) { err = `Claim total cannot exceed ${fmt(maxClaimTotal)}`; return; }
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
		const res = await fetch(`/api/reimbursements/${claimId}/items/${itemId}/receipts`, { method: 'POST', body: fd });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.message ?? 'Upload failed');
		}
	}

	async function attachReceiptToItem(claimId: string, itemId: string, files: FileList | null) {
		if (!files?.length) return;
		attachingReceiptItemId = itemId;
		attachReceiptErr = '';
		try {
			await uploadReceipts(claimId, itemId, files);
			await invalidateAll();
		} catch (e: any) {
			attachReceiptErr = e?.message ?? 'Failed to attach receipt';
		} finally {
			attachingReceiptItemId = null;
		}
	}

	async function removeReceiptsFromItem(claimId: string, itemId: string, receipts: string[] | undefined) {
		if (!receipts?.length) {
			attachReceiptErr = 'This item has no receipts to remove yet.';
			return;
		}
		if (!confirm(`Remove ${receipts.length} receipt${receipts.length === 1 ? '' : 's'} from this item?`)) return;

		removingReceiptItemId = itemId;
		attachReceiptErr = '';
		try {
			const res = await fetch(`/api/reimbursements/${claimId}/items/${itemId}/receipts`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ receipts })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'Remove failed');
			}

			await invalidateAll();
		} catch (e: any) {
			attachReceiptErr = e?.message ?? 'Failed to remove receipt';
		} finally {
			removingReceiptItemId = null;
		}
	}

	function toggleSelectItem(itemId: string, checked: boolean) {
		selectedItemIds = { ...selectedItemIds, [itemId]: checked };
	}

	function toggleSelectAllFiltered(checked: boolean) {
		const next = { ...selectedItemIds };
		for (const item of filteredMyItems as any[]) {
			next[item.id] = checked;
		}
		selectedItemIds = next;
	}

	const selectedFilteredItems = $derived.by(() => {
		const source = (filteredMyItems as any[]) ?? [];
		return source.filter((item: any) => !!selectedItemIds[item.id]);
	});

	const selectedFilteredWithReceipts = $derived.by(() => {
		const source = (selectedFilteredItems as any[]) ?? [];
		return source.filter((item: any) => Array.isArray(item.receipts) && item.receipts.length > 0);
	});

	const allFilteredSelected = $derived.by(() => {
		const source = (filteredMyItems as any[]) ?? [];
		if (!source.length) return false;
		return source.every((item: any) => !!selectedItemIds[item.id]);
	});

	async function removeReceiptsFromSelectedItems() {
		const selected = (selectedFilteredWithReceipts as any[]) ?? [];
		if (!selected.length) {
			attachReceiptErr = 'Select at least one item that has receipts.';
			return;
		}

		const totalReceipts = selected.reduce((sum: number, item: any) => sum + ((item.receipts?.length ?? 0)), 0);
		if (!confirm(`Remove ${totalReceipts} receipt${totalReceipts === 1 ? '' : 's'} from ${selected.length} selected item${selected.length === 1 ? '' : 's'}?`)) return;

		attachReceiptErr = '';
		for (const item of selected) {
			removingReceiptItemId = item.id;
			const res = await fetch(`/api/reimbursements/${item.claim}/items/${item.id}/receipts`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ receipts: item.receipts })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				attachReceiptErr = body.message ?? `Failed to remove receipts for item ${item.description || item.id}`;
				removingReceiptItemId = null;
				return;
			}
		}

		removingReceiptItemId = null;
		selectedItemIds = {};
		await invalidateAll();
	}

	// ── Save draft then immediately submit for review ─────────────────────────
	async function submitAndSend(e: MouseEvent) {
		if (!claimTitle.trim()) { err = 'Title is required'; return; }
		const validLines = lineItems.filter(l => l.description.trim() && Number(l.amount) > 0);
		if (!validLines.length) { err = 'Add at least one line item with a description and amount'; return; }
		if (lineTotal > maxClaimTotal) { err = `Claim total cannot exceed ${fmt(maxClaimTotal)}`; return; }
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
		const res = await fetch(`/api/reimbursements/${claimId}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'submitted' })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			alert(body.message ?? 'Unable to submit claim');
			return;
		}
		await invalidateAll();
	}

	async function saveMaxClaimTotal() {
		const val = Number(maxClaimTotalInput);
		if (!Number.isFinite(val) || val <= 0) {
			maxClaimTotalError = 'Enter a number greater than 0';
			return;
		}

		savingMaxClaimTotal = true;
		maxClaimTotalError = '';
		try {
			const res = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: data.maxClaimTotalSettingId,
					key: 'reimbursement_claim_max_total',
					label: 'Reimbursement Max Claim Total',
					value: String(val)
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'Failed to save setting');
			}
			editingMaxClaimTotal = false;
			await invalidateAll();
		} catch (e: any) {
			maxClaimTotalError = e?.message ?? 'Failed to save setting';
		} finally {
			savingMaxClaimTotal = false;
		}
	}

	async function uploadBankStatement() {
		if (!bankStatementFile) {
			bankStatementErr = 'Please choose a PDF file first';
			return;
		}

		bankStatementUploading = true;
		bankStatementErr = '';
		try {
			const formData = new FormData();
			formData.append('pdf_file', bankStatementFile);

			const res = await fetch('/api/bank-statements', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'Upload failed');
			}

			bankStatementFile = null;
			const input = document.getElementById('bank-statement-upload-input') as HTMLInputElement | null;
			if (input) input.value = '';
			await invalidateAll();
		} catch (e: any) {
			bankStatementErr = e?.message ?? 'Upload failed';
		} finally {
			bankStatementUploading = false;
		}
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

	function claimTitleFor(item: any): string {
		const claim = (data.myClaims as any[]).find((c) => c.id === item.claim);
		return claim?.title ?? 'Unknown claim';
	}

	const filteredMyItems = $derived.by(() => {
		const source = (data.myItems as any[]) ?? [];
		const q = itemFilter.trim().toLowerCase();
		if (!q) return source;

		return source.filter((item: any) => {
			const claimTitle = claimTitleFor(item).toLowerCase();
			const haystack = [
				item.description,
				item.category,
				item.notes,
				item.workOrderReference,
				claimTitle
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return haystack.includes(q);
		});
	});

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

	<div class="rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-5 py-4 flex items-center gap-4 flex-wrap">
		<div class="flex-1">
			<p class="text-sm font-semibold text-emerald-200">Claim total cap</p>
			<p class="text-xs text-emerald-300/75">Each reimbursement claim can include unlimited line items, but the claim total is capped.</p>
		</div>
		{#if data.isAdmin && editingMaxClaimTotal}
			<div class="flex items-center gap-2">
				<input
					type="number"
					min="1"
					step="0.01"
					bind:value={maxClaimTotalInput}
					class="w-32 rounded-md border border-emerald-700 bg-slate-900 text-slate-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
				/>
				<button
					type="button"
					onclick={saveMaxClaimTotal}
					disabled={savingMaxClaimTotal}
					class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
				>
					{savingMaxClaimTotal ? 'Saving…' : 'Save'}
				</button>
				<button
					type="button"
					onclick={() => { editingMaxClaimTotal = false; maxClaimTotalInput = String(data.maxClaimTotal ?? 1500); maxClaimTotalError = ''; }}
					class="text-xs text-slate-400 hover:text-slate-200"
				>
					Cancel
				</button>
			</div>
		{:else}
			<div class="flex items-center gap-3">
				<div class="text-right">
					<p class="text-xs text-emerald-400/70 uppercase tracking-wide">Max per claim</p>
					<p class="text-lg font-bold text-emerald-300">{fmt(maxClaimTotal)}</p>
				</div>
				{#if data.isAdmin}
					<button
						type="button"
						onclick={() => { editingMaxClaimTotal = true; maxClaimTotalInput = String(data.maxClaimTotal ?? 1500); }}
						class="text-xs px-3 py-1.5 rounded-lg border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/40"
					>
						Edit
					</button>
				{/if}
			</div>
		{/if}
		{#if maxClaimTotalError}
			<p class="w-full text-xs text-red-400">{maxClaimTotalError}</p>
		{/if}
	</div>

	<!-- Bank statement vault -->
	<Card class="p-5 bg-slate-800/40 border-slate-700 space-y-4">
		<div class="flex items-center justify-between gap-3 flex-wrap">
			<div>
				<h2 class="text-lg font-semibold text-slate-100">Bank Statement Vault</h2>
				<p class="text-sm text-slate-400">Upload one bank statement PDF at a time for historical backup.</p>
			</div>
			<span class="text-xs px-2.5 py-1 rounded-md border border-slate-600 text-slate-300">
				{data.myBankStatements?.length ?? 0} file{(data.myBankStatements?.length ?? 0) === 1 ? '' : 's'}
			</span>
		</div>

		<div class="flex items-center gap-3 flex-wrap">
			<input
				id="bank-statement-upload-input"
				type="file"
				accept="application/pdf,.pdf"
				onchange={(e) => {
					bankStatementErr = '';
					bankStatementFile = ((e.currentTarget as HTMLInputElement).files?.[0] ?? null);
				}}
				class="block w-full max-w-md text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-600 file:bg-slate-700 file:text-slate-300 file:text-xs hover:file:bg-slate-600 file:transition-colors cursor-pointer"
			/>
			<Button onclick={uploadBankStatement} disabled={bankStatementUploading || !bankStatementFile} class="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
				{#if bankStatementUploading}
					<Loader2 class="size-4 animate-spin" /> Uploading...
				{:else}
					<Upload class="size-4" /> Upload PDF
				{/if}
			</Button>
		</div>

		{#if bankStatementErr}
			<p class="text-xs text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{bankStatementErr}</p>
		{/if}

		{#if !data.myBankStatements?.length}
			<p class="text-xs text-slate-400">No bank statements uploaded yet.</p>
		{:else}
			<div class="rounded-lg border border-slate-700 overflow-hidden">
				<table class="w-full text-xs">
					<thead class="bg-slate-900/40 border-b border-slate-700">
						<tr class="text-left text-slate-400 uppercase tracking-wide">
							<th class="px-3 py-2">File</th>
							<th class="px-3 py-2">Uploaded</th>
							<th class="px-3 py-2 text-right">Action</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-700/40">
						{#each data.myBankStatements as statement}
							{@const fileName = Array.isArray(statement.pdf_file) ? statement.pdf_file[0] : statement.pdf_file}
							<tr>
								<td class="px-3 py-2 text-slate-200">{fileName || 'PDF file'}</td>
								<td class="px-3 py-2 text-slate-400">{fmtDate(statement.created)}</td>
								<td class="px-3 py-2 text-right">
									{#if fileName}
										<a
											href="/api/pb-file/{statement.collectionId}/{statement.id}/{fileName}"
											target="_blank"
											rel="noopener noreferrer"
											class="text-blue-400 hover:text-blue-300 hover:underline"
										>
											View PDF
										</a>
									{:else}
										<span class="text-slate-500">Unavailable</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>

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
						{ status: 'Paid',         color: 'border-emerald-700/50 bg-emerald-950/30',dot: 'bg-emerald-400', who: 'Admin',     desc: 'Payment issued. A Work Order (WO-NNN) is created automatically — Ina uses this to enter the payment in QuickBooks. Once the QB transaction ID is recorded on the Work Order, an Expense record is automatically submitted to the approval pipeline to fully settle the payment.' },
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

				<!-- Full audit chain callout -->
				<div class="rounded-lg border border-slate-600/50 bg-slate-800/40 p-4 space-y-2">
					<p class="text-xs font-bold uppercase tracking-wide text-slate-400">Every paid claim produces 3 linked records</p>
					<div class="flex flex-col sm:flex-row gap-2 text-xs">
						<div class="flex-1 flex items-start gap-2">
							<span class="size-5 rounded-full bg-violet-900/60 text-violet-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
							<div><p class="font-semibold text-slate-200">Reimbursement Claim</p><p class="text-slate-500">Original request, line items, CPA review. WO number stamped when paid.</p></div>
						</div>
						<div class="flex-1 flex items-start gap-2">
							<span class="size-5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
							<div><p class="font-semibold text-slate-200">Work Order</p><p class="text-slate-500">Payment authorization record. Ina enters the WO number in QuickBooks and records the transaction ID here.</p></div>
						</div>
						<div class="flex-1 flex items-start gap-2">
							<span class="size-5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
							<div><p class="font-semibold text-slate-200">Expense (Reimbursement)</p><p class="text-slate-500">Auto-created when QB entry is saved. Approved in the expenses pipeline to fully settle the payment.</p></div>
						</div>
					</div>
				</div>
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

	<!-- Find items + attach receipts -->
	<Card class="overflow-hidden bg-slate-900/40 border-slate-700">
		<button
			onclick={() => showItemFinder = !showItemFinder}
			class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
		>
			<div class="flex items-center gap-2">
				<ChevronRight class="size-4 text-slate-500 shrink-0 transition-transform {showItemFinder ? 'rotate-90' : ''}" />
				<div>
					<p class="text-sm font-semibold text-slate-200">Find My Reimbursement Items</p>
					<p class="text-[11px] text-slate-400">Filter your line items and attach receipts or a photo from your phone camera.</p>
				</div>
			</div>
			<span class="text-xs text-slate-400">{filteredMyItems.length} items</span>
		</button>

		{#if showItemFinder}
		<div class="border-t border-slate-700 px-4 py-4 space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<input
					type="text"
					bind:value={itemFilter}
					placeholder="Filter by description, claim title, category, notes, WO#..."
					class={`${INPUT} flex-1 min-w-[240px]`}
				/>
				<Button
					type="button"
					variant="outline"
					class="h-9 text-[11px] border-red-800 text-red-400 hover:bg-red-900/30"
					disabled={removingReceiptItemId !== null || attachingReceiptItemId !== null}
					onclick={removeReceiptsFromSelectedItems}
				>
					<Trash2 class="size-3.5 mr-1" /> Remove Selected Receipts ({selectedFilteredWithReceipts.length})
				</Button>
			</div>

			{#if attachReceiptErr}
				<p class="text-xs text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{attachReceiptErr}</p>
			{/if}

			<div class="rounded-lg border border-slate-700 overflow-hidden">
				<table class="w-full text-xs">
					<thead class="bg-slate-900/30">
						<tr class="text-left text-slate-400 uppercase tracking-wide border-b border-slate-700">
							<th class="px-3 py-2 w-8">
								<input
									type="checkbox"
									class="rounded border-slate-500 bg-slate-800"
									checked={allFilteredSelected}
									onchange={(e) => toggleSelectAllFiltered((e.currentTarget as HTMLInputElement).checked)}
									title="Select all filtered items"
								/>
							</th>
							<th class="px-3 py-2">Description</th>
							<th class="px-3 py-2">Category</th>
							<th class="px-3 py-2">Notes</th>
							<th class="px-3 py-2">WO#</th>
							<th class="px-3 py-2">Receipts</th>
							<th class="px-3 py-2 text-right">Amount</th>
							<th class="px-3 py-2 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-700/40">
						{#if filteredMyItems.length === 0}
							<tr>
								<td colspan="8" class="px-3 py-4 text-slate-400 text-center">No items match your filter.</td>
							</tr>
						{:else}
							{#each filteredMyItems as item}
								<tr>
									<td class="px-3 py-2 align-top">
										<input
											type="checkbox"
											class="rounded border-slate-500 bg-slate-800"
											checked={!!selectedItemIds[item.id]}
											onchange={(e) => toggleSelectItem(item.id, (e.currentTarget as HTMLInputElement).checked)}
											title="Select item for bulk receipt removal"
										/>
									</td>
									<td class="px-3 py-2 text-slate-200">
										<div>{item.description}</div>
										<div class="text-[10px] text-slate-500 mt-0.5">{claimTitleFor(item)}</div>
									</td>
									<td class="px-3 py-2 text-slate-400 capitalize">{ITEM_CATEGORY_LABELS[item.category] ?? item.category}</td>
									<td class="px-3 py-2 text-slate-400">{item.notes || '—'}</td>
									<td class="px-3 py-2 text-slate-300 font-mono">{item.workOrderReference || '—'}</td>
									<td class="px-3 py-2 text-slate-400">{item.receipts?.length ?? 0}</td>
									<td class="px-3 py-2 text-right font-semibold text-emerald-400">{fmt(item.amount)}</td>
									<td class="px-3 py-2 text-right">
										<input
											type="file"
											id="attach-receipt-{item.id}"
											class="hidden"
											accept="image/*,application/pdf"
											capture="environment"
											onchange={(e) => attachReceiptToItem(item.claim, item.id, (e.currentTarget as HTMLInputElement).files)}
										/>
										<div class="flex items-center justify-end gap-2">
											<Button
												type="button"
												variant="outline"
												class="h-7 text-[11px] border-slate-600 text-slate-300"
												disabled={attachingReceiptItemId === item.id || removingReceiptItemId === item.id}
												onclick={() => (document.getElementById(`attach-receipt-${item.id}`) as HTMLInputElement | null)?.click()}
											>
												{#if attachingReceiptItemId === item.id}
													<Loader2 class="size-3 mr-1 animate-spin" /> Uploading
												{:else}
													<Upload class="size-3 mr-1" /> Attach
												{/if}
											</Button>
											<Button
												type="button"
												variant="outline"
												class="h-7 text-[11px] border-red-800 text-red-400 hover:bg-red-900/30"
												disabled={removingReceiptItemId === item.id || attachingReceiptItemId === item.id}
												onclick={() => removeReceiptsFromItem(item.claim, item.id, item.receipts)}
											>
												{#if removingReceiptItemId === item.id}
													<Loader2 class="size-3 mr-1 animate-spin" /> Removing
												{:else}
													<Trash2 class="size-3 mr-1" /> Remove
												{/if}
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
		{/if}
	</Card>

	<!-- My Claims -->
	<Card class="overflow-hidden bg-slate-800/50 border-slate-700">
		<button
			onclick={() => showMyClaims = !showMyClaims}
			class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/40 transition-colors text-left"
		>
			<div class="flex items-center gap-3 min-w-0">
				<ChevronRight class="size-4 text-slate-500 shrink-0 transition-transform {showMyClaims ? 'rotate-90' : ''}" />
				<div class="min-w-0">
					<h2 class="text-lg font-semibold text-slate-200">My Claims</h2>
					<p class="text-xs text-slate-400 mt-0.5">{data.myClaims.length} claim{data.myClaims.length !== 1 ? 's' : ''}</p>
				</div>
			</div>
		</button>

		{#if showMyClaims}
		<div class="border-t border-slate-700 px-4 py-4">
			{#if data.myClaims.length === 0}
				<div class="p-8 text-center bg-slate-800/40 border border-slate-700 rounded-xl">
					<Receipt class="size-10 text-slate-600 mx-auto mb-3" />
					<p class="text-slate-400 text-sm">No claims yet. Click <strong class="text-slate-200">New Claim</strong> to submit your first reimbursement request.</p>
				</div>
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
											<th class="pb-1.5 pr-3">Notes</th>
											<th class="pb-1.5 pr-3">WO#</th>
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
												<td class="py-1.5 pr-3 text-slate-400">{item.notes || '—'}</td>
												<td class="py-1.5 pr-3 text-slate-300 font-mono">{item.workOrderReference || claim.referenceNumber || '—'}</td>
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
		{/if}
	</Card>



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
							<p class="text-slate-400">Add as many line items as you need — receipts from a business trip, a month of software subscriptions, founder out-of-pocket expenses. One claim, one reference number when paid.</p>
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
				<div>
					<span class="text-sm text-slate-300">{lineItems.filter(l => l.description && Number(l.amount) > 0).length} valid item{lineItems.filter(l => l.description && Number(l.amount) > 0).length !== 1 ? 's' : ''}</span>
					<p class="text-[11px] text-slate-400 mt-0.5">Max allowed: {fmt(maxClaimTotal)} · Remaining: {fmt(remainingClaimLimit)}</p>
				</div>
				<span class="text-lg font-bold {isOverClaimLimit ? 'text-red-300' : 'text-emerald-300'}">{fmt(lineTotal)}</span>
			</div>
			{#if isOverClaimLimit}
				<p class="text-xs text-red-400">Claim total exceeds {fmt(maxClaimTotal)}. Reduce line-item amounts before saving.</p>
			{/if}
		</form>

		<div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
			<Button type="button" variant="outline" onclick={() => showNewClaim = false} class="border-slate-600 text-slate-300">Cancel</Button>
			<Button onclick={submitNewClaim} disabled={saving || isOverClaimLimit} class="gap-2 bg-slate-700 hover:bg-slate-600 text-white">
				<Receipt class="size-4" />{saving ? 'Saving…' : 'Save as Draft'}
			</Button>
			<Button onclick={submitAndSend} disabled={saving || isOverClaimLimit} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Send class="size-4" />{saving ? 'Saving…' : 'Save & Submit'}
			</Button>
		</div>
	</div>
</div>
{/if}
