<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Search, ChevronDown, ChevronUp, CheckCircle2, Clock,
		AlertCircle, XCircle, DollarSign, FileText, ArrowRight,
		ChevronsUpDown, ChevronRight, Receipt, Trash2
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Helpers ───────────────────────────────────────────────────────────────
	const fmt     = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	function claimantName(c: any) {
		const u = c.expand?.claimant;
		if (!u) return '—';
		return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
	}
	function itemsFor(claimId: string) {
		return (data.items as any[]).filter(i => i.claim === claimId);
	}

	// ── Filters / search ──────────────────────────────────────────────────────
	let search    = $state('');
	let fStatus   = $state('all');
	let fClaimant = $state('all');

	// ── Sorting ───────────────────────────────────────────────────────────────
	type SortCol = 'claimant' | 'title' | 'amount' | 'status' | 'items';
	let sortCol = $state<SortCol>('status');
	let sortDir = $state<'asc'|'desc'>('asc');
	function toggleSort(col: SortCol) {
		if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortCol = col; sortDir = 'asc'; }
	}

	const STATUS_ORDER: Record<string,number> = { submitted: 0, under_review: 1, approved: 2, draft: 3, paid: 4, rejected: 5 };

	// ── Unique claimants for filter ───────────────────────────────────────────
	let claimants = $derived(
		[...new Map(
			(data.claims as any[])
				.filter(c => c.expand?.claimant)
				.map(c => [c.claimant, { id: c.claimant, name: claimantName(c) }])
		).values()].sort((a,b) => a.name.localeCompare(b.name))
	);

	// ── Filtered + sorted rows ────────────────────────────────────────────────
	let rows = $derived(() => {
		const q = search.trim().toLowerCase();
		let list = (data.claims as any[]).filter(c => {
			if (fStatus   !== 'all' && c.status   !== fStatus)   return false;
			if (fClaimant !== 'all' && c.claimant !== fClaimant) return false;
			if (q && !c.title?.toLowerCase().includes(q) && !claimantName(c).toLowerCase().includes(q) && !c.referenceNumber?.toLowerCase().includes(q)) return false;
			return true;
		});
		list = [...list].sort((a,b) => {
			let cmp = 0;
			if (sortCol === 'status')   cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
			if (sortCol === 'claimant') cmp = claimantName(a).localeCompare(claimantName(b));
			if (sortCol === 'title')    cmp = (a.title ?? '').localeCompare(b.title ?? '');
			if (sortCol === 'amount')   cmp = (a.totalAmount ?? 0) - (b.totalAmount ?? 0);
			if (sortCol === 'items')    cmp = itemsFor(a.id).length - itemsFor(b.id).length;
			return sortDir === 'asc' ? cmp : -cmp;
		});
		return list;
	});

	// ── Expanded row ──────────────────────────────────────────────────────────
	let expanded = $state<string|null>(null);
	let selectedClaimIds = $state<string[]>([]);
	let selectedItemIdsByClaim = $state<Record<string, string[]>>({});
	let rollupBusy = $state(false);
	let itemDeleteBusyByClaim = $state<Record<string, boolean>>({});
	let rollupToast = $state<{ type: 'success' | 'error'; message: string } | null>(null);
	let itemToast = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	function showItemToast(type: 'success' | 'error', message: string, timeoutMs = 3200) {
		itemToast = { type, message };
		setTimeout(() => {
			itemToast = null;
		}, timeoutMs);
	}

	const selectableRows = $derived(() => rows().filter((c: any) => c.status !== 'paid' && c.status !== 'rejected'));
	const allSelectableSelected = $derived(() =>
		selectableRows().length > 0 && selectableRows().every((c: any) => selectedClaimIds.includes(c.id))
	);

	function toggleClaimSelected(claimId: string) {
		if (selectedClaimIds.includes(claimId)) {
			selectedClaimIds = selectedClaimIds.filter((id) => id !== claimId);
		} else {
			selectedClaimIds = [...selectedClaimIds, claimId];
		}
	}

	function toggleSelectAllVisible() {
		if (allSelectableSelected()) {
			const visibleIds = new Set(selectableRows().map((c: any) => c.id));
			selectedClaimIds = selectedClaimIds.filter((id) => !visibleIds.has(id));
			return;
		}

		const merged = new Set([...selectedClaimIds, ...selectableRows().map((c: any) => c.id)]);
		selectedClaimIds = [...merged];
	}

	async function rollupSelectedClaims() {
		if (selectedClaimIds.length < 2) {
			alert('Select at least 2 claims to roll up');
			return;
		}

		if (!confirm(`Roll up ${selectedClaimIds.length} selected claims? This will re-bucket line items under the max claim limit.`)) {
			return;
		}

		rollupBusy = true;
		try {
			const sourceCount = selectedClaimIds.length;
			const res = await fetch('/api/reimbursements/rollup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ claimIds: selectedClaimIds })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				const details = body?.details ? ` (${JSON.stringify(body.details)})` : '';
				throw new Error((body.message ?? 'Rollup failed') + details);
			}
			const createdCount = Array.isArray(body.rolledClaimIds) ? body.rolledClaimIds.length : 0;
			rollupToast = {
				type: 'success',
				message: `Rolled up ${sourceCount} claim${sourceCount !== 1 ? 's' : ''} into ${createdCount} new claim${createdCount !== 1 ? 's' : ''}.`
			};
			setTimeout(() => { rollupToast = null; }, 3500);
			selectedClaimIds = [];
			await invalidateAll();
		} catch (e: any) {
			const msg = e?.message ?? 'Rollup failed';
			rollupToast = { type: 'error', message: msg };
			setTimeout(() => { rollupToast = null; }, 4500);
		} finally {
			rollupBusy = false;
		}
	}

	function selectedItemsForClaim(claimId: string) {
		return selectedItemIdsByClaim[claimId] ?? [];
	}

	function isItemSelected(claimId: string, itemId: string) {
		return selectedItemsForClaim(claimId).includes(itemId);
	}

	function toggleItemSelected(claimId: string, itemId: string) {
		const selected = selectedItemsForClaim(claimId);
		selectedItemIdsByClaim = {
			...selectedItemIdsByClaim,
			[claimId]: selected.includes(itemId)
				? selected.filter((id) => id !== itemId)
				: [...selected, itemId]
		};
	}

	function toggleAllItemsSelected(claimId: string, items: any[]) {
		if (!items.length) return;
		const selected = selectedItemsForClaim(claimId);
		const allSelected = items.every((item) => selected.includes(item.id));
		selectedItemIdsByClaim = {
			...selectedItemIdsByClaim,
			[claimId]: allSelected ? [] : items.map((item) => item.id)
		};
	}

	async function removeSingleItem(claimId: string, itemId: string) {
		if (!confirm('Remove this reimbursement line item?')) return;
		itemDeleteBusyByClaim = { ...itemDeleteBusyByClaim, [claimId]: true };
		try {
			const res = await fetch(`/api/reimbursements/${claimId}/items/${itemId}`, { method: 'DELETE' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? 'Failed to remove line item');
			selectedItemIdsByClaim = {
				...selectedItemIdsByClaim,
				[claimId]: selectedItemsForClaim(claimId).filter((id) => id !== itemId)
			};
			await invalidateAll();
			showItemToast('success', 'Line item removed.');
		} catch (err: any) {
			showItemToast('error', err?.message ?? 'Failed to remove line item', 4200);
		} finally {
			itemDeleteBusyByClaim = { ...itemDeleteBusyByClaim, [claimId]: false };
		}
	}

	async function removeSelectedItems(claimId: string) {
		const selected = selectedItemsForClaim(claimId);
		if (!selected.length) {
			showItemToast('error', 'Select at least one line item to remove.', 3600);
			return;
		}
		if (!confirm(`Remove ${selected.length} selected line item${selected.length !== 1 ? 's' : ''}?`)) return;

		itemDeleteBusyByClaim = { ...itemDeleteBusyByClaim, [claimId]: true };
		try {
			const selectedCount = selected.length;
			for (const itemId of selected) {
				const res = await fetch(`/api/reimbursements/${claimId}/items/${itemId}`, { method: 'DELETE' });
				const body = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(body?.message ?? 'Failed to remove selected line items');
			}
			selectedItemIdsByClaim = { ...selectedItemIdsByClaim, [claimId]: [] };
			await invalidateAll();
			showItemToast('success', `Removed ${selectedCount} line item${selectedCount !== 1 ? 's' : ''}.`);
		} catch (err: any) {
			showItemToast('error', err?.message ?? 'Failed to remove selected line items', 4200);
		} finally {
			itemDeleteBusyByClaim = { ...itemDeleteBusyByClaim, [claimId]: false };
		}
	}

	// ── Per-claim admin form ──────────────────────────────────────────────────
	let forms = $state<Record<string,{ refNum:string; payMethod:string; paidDate:string; reviewNotes:string }>>({});
	$effect(() => {
		const today = new Date().toISOString().slice(0,10);
		for (const c of data.claims as any[]) {
			if (!forms[c.id]) forms[c.id] = { refNum: c.referenceNumber ?? '', payMethod: c.paymentMethod || 'bank_transfer', paidDate: today, reviewNotes: c.reviewNotes ?? '' };
		}
	});
	function form(id: string) {
		return forms[id] ?? { refNum: '', payMethod: 'bank_transfer', paidDate: new Date().toISOString().slice(0,10), reviewNotes: '' };
	}

	// ── Saving state ──────────────────────────────────────────────────────────
	let saving = $state<string|null>(null);

	async function action(claimId: string, status: string) {
		saving = claimId;
		const f = form(claimId);
		const body: Record<string,any> = { status, reviewNotes: f.reviewNotes };
		if (status === 'paid') {
			if (!f.refNum.trim()) { alert('Reference number required'); saving = null; return; }
			body.referenceNumber = f.refNum.trim();
			body.paymentMethod   = f.payMethod;
			body.paidDate        = f.paidDate;
		}
		await fetch(`/api/reimbursements/${claimId}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		await invalidateAll();
		saving = null;
	}

	// ── Status display ────────────────────────────────────────────────────────
	const STATUS_LABEL: Record<string,string> = {
		draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
		approved: 'Approved', paid: 'Paid', rejected: 'Rejected'
	};
	const STATUS_CLASS: Record<string,string> = {
		draft:        'bg-slate-700 text-slate-300',
		submitted:    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
		under_review: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
		approved:     'bg-violet-900/60 text-violet-300 border border-violet-700/50',
		paid:         'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
		rejected:     'bg-red-900/60 text-red-300 border border-red-700/50',
	};

	const INPUT = 'w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wide';

	// ── Pipeline counts for header ────────────────────────────────────────────
	const PIPELINE = [
		{ key: 'submitted',    label: 'Submitted',    color: 'text-blue-400',    bg: 'bg-blue-950/40 border-blue-800/50' },
		{ key: 'under_review', label: 'Under Review', color: 'text-yellow-400',  bg: 'bg-yellow-950/40 border-yellow-800/50' },
		{ key: 'approved',     label: 'Approved',     color: 'text-violet-400',  bg: 'bg-violet-950/40 border-violet-800/50' },
		{ key: 'paid',         label: 'Paid',         color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/50' },
	];
</script>

<svelte:head><title>Reimbursements Admin — FliHub</title></svelte:head>

<div class="flex flex-col gap-5">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Reimbursements — Admin</h1>
			<p class="text-sm text-slate-400 mt-0.5">Review, approve, and process reimbursement claims</p>
		</div>
		<a href="/dashboard/reimbursements" class="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2">← Claimant view</a>
	</div>

	<!-- Pipeline metrics -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each PIPELINE as p}
			<button
				onclick={() => fStatus = fStatus === p.key ? 'all' : p.key}
				class="rounded-xl border p-4 text-left transition-all hover:brightness-110 {p.bg} {fStatus === p.key ? 'ring-2 ring-white/20' : ''}"
			>
				<p class="text-xs uppercase tracking-wide font-medium {p.color}">{p.label}</p>
				<p class="text-2xl font-bold text-slate-100 mt-1">{(data.metrics as any)[p.key]}</p>
				{#if p.key === 'submitted' || p.key === 'under_review'}
					<p class="text-xs {p.color} mt-0.5">{fmt((data.metrics as any).totalPending)} pending</p>
				{:else if p.key === 'approved'}
					<p class="text-xs {p.color} mt-0.5">{fmt((data.metrics as any).totalApproved)} to pay</p>
				{:else if p.key === 'paid'}
					<p class="text-xs {p.color} mt-0.5">{fmt((data.metrics as any).totalPaid)} paid out</p>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<Card class="bg-slate-800/50 border-slate-700 p-4">
		<div class="flex flex-wrap gap-3 items-center">
			<div class="relative flex-1 min-w-48">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
				<Input bind:value={search} placeholder="Search by title, claimant, or reference…"
					class="pl-9 bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9" />
			</div>

			<select bind:value={fStatus}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none [color-scheme:dark]">
				<option value="all">All Statuses</option>
				<option value="draft">Draft</option>
				<option value="submitted">Submitted</option>
				<option value="under_review">Under Review</option>
				<option value="approved">Approved</option>
				<option value="paid">Paid</option>
				<option value="rejected">Rejected</option>
			</select>

			<select bind:value={fClaimant}
				class="h-9 rounded-md border border-slate-600 bg-slate-900 text-slate-200 text-sm px-3 focus:outline-none [color-scheme:dark] max-w-48">
				<option value="all">All Claimants</option>
				{#each claimants as c}
					<option value={(c as any).id}>{(c as any).name}</option>
				{/each}
			</select>

			{#if search || fStatus !== 'all' || fClaimant !== 'all'}
				<button onclick={() => { search=''; fStatus='all'; fClaimant='all'; }}
					class="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 whitespace-nowrap">
					Clear
				</button>
			{/if}

			<Button
				onclick={rollupSelectedClaims}
				disabled={rollupBusy || selectedClaimIds.length < 2}
				class="h-9 bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50"
			>
				{#if rollupBusy}
					Rolling up…
				{:else}
					Roll Up Selected ({selectedClaimIds.length})
				{/if}
			</Button>

			<span class="text-[11px] text-slate-500 whitespace-nowrap">max per rolled claim: {fmt(data.maxClaimTotal ?? 1500)}</span>

			<span class="ml-auto text-xs text-slate-500">{rows().length} claims</span>
		</div>
	</Card>

	<!-- Table -->
	<Card class="bg-slate-800/50 border-slate-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-900/40">
						<th class="w-10 px-2 py-3 text-center text-xs font-medium text-slate-400">#</th>
						<th class="w-8 px-3 py-3">
							<input
								type="checkbox"
								checked={allSelectableSelected()}
								onchange={toggleSelectAllVisible}
								class="rounded border-slate-600 accent-emerald-500"
								title="Select all visible eligible claims"
							/>
						</th>
						<th class="w-8 px-3 py-3"></th>
						{#each ([['status','Status'],['claimant','Claimant'],['title','Title'],['items','Items'],['amount','Amount']] as const) as [col, label]}
							<th class="px-4 py-3 text-left font-medium text-slate-400">
								<button onclick={() => toggleSort(col)} class="flex items-center gap-1.5 hover:text-slate-200 transition-colors group">
									{label}
									<span class="text-slate-600 group-hover:text-slate-400">
										{#if sortCol === col}{#if sortDir === 'asc'}<ChevronUp class="size-3.5"/>{:else}<ChevronDown class="size-3.5"/>{/if}{:else}<ChevronsUpDown class="size-3.5"/>{/if}
									</span>
								</button>
							</th>
						{/each}
						<th class="px-4 py-3 text-left font-medium text-slate-400">Reference</th>
						<th class="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/50">
					{#if rows().length === 0}
						<tr><td colspan="10" class="px-4 py-12 text-center text-slate-500">No claims match the current filters.</td></tr>
					{:else}
						{#each rows() as claim, rowIndex (claim.id)}
							{@const isOpen = expanded === claim.id}
							{@const items  = itemsFor(claim.id)}
							{@const f      = form(claim.id)}
							{@const busy   = saving === claim.id}
							{@const selectable = claim.status !== 'paid' && claim.status !== 'rejected'}

							<!-- Main row -->
							<tr class="hover:bg-slate-700/30 transition-colors {isOpen ? 'bg-slate-700/20' : ''}">
								<td class="px-2 py-3 text-center text-xs text-slate-500">{rowIndex + 1}</td>
								<td class="px-3 py-3">
									{#if selectable}
										<input
											type="checkbox"
											checked={selectedClaimIds.includes(claim.id)}
											onchange={() => toggleClaimSelected(claim.id)}
											class="rounded border-slate-600 accent-emerald-500"
										/>
									{/if}
								</td>
								<td class="px-3 py-3">
									{#if selectable}
										<input
											type="checkbox"
											checked={selectedClaimIds.includes(claim.id)}
											onchange={() => toggleClaimSelected(claim.id)}
											class="rounded border-slate-600 accent-emerald-500"
										/>
									{/if}
								</td>
								<td class="px-3 py-3">
									<button onclick={() => expanded = isOpen ? null : claim.id}
										class="text-slate-500 hover:text-slate-300 transition-colors">
										<ChevronRight class="size-4 transition-transform {isOpen ? 'rotate-90' : ''}" />
									</button>
								</td>
								<td class="px-4 py-3 whitespace-nowrap">
									<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {STATUS_CLASS[claim.status] ?? ''}">
										{STATUS_LABEL[claim.status] ?? claim.status}
									</span>
								</td>
								<td class="px-4 py-3 whitespace-nowrap text-slate-300 text-xs">{claimantName(claim)}</td>
								<td class="px-4 py-3 max-w-xs">
									<p class="text-slate-100 truncate">{claim.title}</p>
								</td>
								<td class="px-4 py-3 text-slate-400 text-xs">{items.length}</td>
								<td class="px-4 py-3 font-semibold text-emerald-400 whitespace-nowrap">{fmt(claim.totalAmount || 0)}</td>
								<td class="px-4 py-3 text-xs font-mono text-slate-400">{claim.referenceNumber || '—'}</td>
								<td class="px-4 py-3">
									<!-- Quick action buttons based on current status -->
									<div class="flex items-center gap-1.5 flex-wrap">
										{#if claim.status === 'submitted'}
											<button onclick={() => action(claim.id, 'under_review')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-yellow-900/50 border border-yellow-700/50 text-yellow-300 hover:bg-yellow-800/60 transition-colors disabled:opacity-50 whitespace-nowrap">
												{busy ? '…' : 'Start Review'}
											</button>
											<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
												{busy ? '…' : 'Reject'}
											</button>
										{:else if claim.status === 'under_review'}
											<button onclick={() => action(claim.id, 'approved')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-violet-900/50 border border-violet-700/50 text-violet-300 hover:bg-violet-800/60 transition-colors disabled:opacity-50">
												{busy ? '…' : 'Approve'}
											</button>
											<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
												{busy ? '…' : 'Reject'}
											</button>
										{:else if claim.status === 'approved'}
											<button onclick={() => expanded = isOpen ? null : claim.id}
												class="text-xs px-2 py-1 rounded bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/60 transition-colors whitespace-nowrap">
												Mark Paid ↓
											</button>
										{:else if claim.status === 'draft'}
											<span class="text-xs text-slate-600 italic">awaiting submission</span>
										{:else if claim.status === 'paid'}
											<span class="text-xs text-emerald-600">✓ Complete</span>
										{:else if claim.status === 'rejected'}
											<span class="text-xs text-red-600">✗ Rejected</span>
										{/if}
									</div>
								</td>
							</tr>

							<!-- Expanded detail row -->
							{#if isOpen}
							<tr class="bg-slate-900/40">
								<td colspan="10" class="px-6 py-4">
									<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

										<!-- Line items -->
										<div>
											<div class="mb-2 flex items-center justify-between gap-2">
												<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Line Items</p>
												<div class="flex items-center gap-2">
													{#if selectedItemsForClaim(claim.id).length > 0}
														<span class="text-[11px] text-slate-500">{selectedItemsForClaim(claim.id).length} selected</span>
													{/if}
													<button
														onclick={() => removeSelectedItems(claim.id)}
														disabled={(itemDeleteBusyByClaim[claim.id] ?? false) || selectedItemsForClaim(claim.id).length === 0}
														class="text-[11px] px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
													>
														{#if itemDeleteBusyByClaim[claim.id] ?? false}
															Removing...
														{:else}
															Remove Selected
														{/if}
													</button>
												</div>
											</div>
											{#if items.length === 0}
												<p class="text-xs text-slate-600">No items.</p>
											{:else}
												<table class="w-full text-xs">
													<thead>
														<tr class="text-left text-slate-500 border-b border-slate-700">
															<th class="pb-1.5 pr-2 w-8 text-center">#</th>
															<th class="pb-1.5 pr-2 w-8">
																<input
																	type="checkbox"
																	checked={items.length > 0 && items.every((item) => isItemSelected(claim.id, item.id))}
																	onchange={() => toggleAllItemsSelected(claim.id, items)}
																	class="rounded border-slate-600 accent-red-500"
																	title="Select all line items"
																/>
															</th>
															<th class="pb-1.5 pr-3">Description</th>
															<th class="pb-1.5 pr-3">Category</th>
															<th class="pb-1.5 pr-3">Vendor</th>
															<th class="pb-1.5 pr-3">Date</th>
															<th class="pb-1.5 text-right">Amount</th>
															<th class="pb-1.5 pl-3 text-right">Actions</th>
														</tr>
													</thead>
													<tbody class="divide-y divide-slate-700/30">
														{#each items as item, index}
															<tr>
																<td class="py-1.5 pr-2 text-center text-[11px] text-slate-500">{index + 1}</td>
																<td class="py-1.5 pr-2">
																	<input
																		type="checkbox"
																		checked={isItemSelected(claim.id, item.id)}
																		onchange={() => toggleItemSelected(claim.id, item.id)}
																		class="rounded border-slate-600 accent-red-500"
																		disabled={itemDeleteBusyByClaim[claim.id] ?? false}
																	/>
																</td>
																<td class="py-1.5 pr-3 text-slate-200">{item.description}</td>
																<td class="py-1.5 pr-3 text-slate-400 capitalize">{item.category}</td>
																<td class="py-1.5 pr-3 text-slate-400">{item.vendor || '—'}</td>
																<td class="py-1.5 pr-3 text-slate-400">{fmtDate(item.date)}</td>
																<td class="py-1.5 text-right font-semibold text-emerald-400">{fmt(item.amount)}</td>
																<td class="py-1.5 pl-3 text-right">
																	<button
																		onclick={() => removeSingleItem(claim.id, item.id)}
																		disabled={itemDeleteBusyByClaim[claim.id] ?? false}
																		class="inline-flex items-center gap-1 rounded border border-red-700/40 bg-red-900/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
																		title="Remove line item"
																	>
																		<Trash2 class="size-3" />
																		Remove
																	</button>
																</td>
															</tr>
														{/each}
													</tbody>
													<tfoot class="border-t border-slate-600">
														<tr>
															<td colspan="6" class="pt-2 text-slate-400 font-semibold">Total</td>
															<td class="pt-2 text-right font-bold text-emerald-300">{fmt(claim.totalAmount || 0)}</td>
															<td></td>
														</tr>
													</tfoot>
												</table>
											{/if}
											{#if claim.notes}
												<p class="mt-2 text-xs text-slate-500 italic">"{claim.notes}"</p>
											{/if}
										</div>

										<!-- Admin action panel -->
										<div class="space-y-3">
											<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Admin Panel</p>

											{#if claim.status === 'paid'}
												<div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
													<p class="font-semibold">Payment complete</p>
													<p>Ref: <span class="font-mono font-bold">{claim.referenceNumber}</span></p>
													{#if claim.paidDate}<p>Paid: {fmtDate(claim.paidDate)}</p>{/if}
													{#if claim.paymentMethod}<p>Method: {claim.paymentMethod.replace('_',' ')}</p>{/if}
												</div>
											{:else if claim.status === 'rejected'}
												<div class="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300">
													<p class="font-semibold">Rejected</p>
													{#if claim.reviewNotes}<p class="mt-1">{claim.reviewNotes}</p>{/if}
												</div>
											{:else}
												<div>
													<label class={LABEL}>Review Notes (visible to claimant)</label>
													<textarea bind:value={f.reviewNotes} rows="2"
														class="{INPUT} resize-none" placeholder="Feedback or approval notes…"></textarea>
												</div>

												{#if claim.status === 'approved'}
													<div class="grid grid-cols-3 gap-2">
														<div>
															<label class={LABEL}>Reference # *</label>
															<input bind:value={f.refNum} class={INPUT} placeholder="WO-001" />
														</div>
														<div>
															<label class={LABEL}>Method</label>
															<select bind:value={f.payMethod} class="{INPUT} [color-scheme:dark]">
																<option value="bank_transfer">Bank Transfer</option>
																<option value="check">Check</option>
																<option value="zelle">Zelle</option>
																<option value="paypal">PayPal</option>
																<option value="cash">Cash</option>
															</select>
														</div>
														<div>
															<label class={LABEL}>Paid Date</label>
															<input type="date" bind:value={f.paidDate} class="{INPUT} [color-scheme:dark]" />
														</div>
													</div>
												{/if}

												<div class="flex gap-2 flex-wrap pt-1">
													{#if claim.status === 'submitted'}
														<button onclick={() => action(claim.id, 'under_review')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-yellow-900/50 border border-yellow-700/50 text-yellow-300 hover:bg-yellow-800/60 disabled:opacity-50">
															{busy ? 'Saving…' : 'Start Review'}
														</button>
														<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50">
															{busy ? '…' : 'Reject'}
														</button>
													{:else if claim.status === 'under_review'}
														<button onclick={() => action(claim.id, 'approved')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-violet-900/50 border border-violet-700/50 text-violet-300 hover:bg-violet-800/60 disabled:opacity-50">
															{busy ? 'Saving…' : 'Approve'}
														</button>
														<button onclick={() => action(claim.id, 'submitted')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-50">
															{busy ? '…' : '← Back to Submitted'}
														</button>
														<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50">
															{busy ? '…' : 'Reject'}
														</button>
													{:else if claim.status === 'approved'}
														<button onclick={() => action(claim.id, 'paid')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/60 disabled:opacity-50 font-semibold">
															{busy ? 'Saving…' : '✓ Mark as Paid'}
														</button>
														<button onclick={() => action(claim.id, 'under_review')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-50">
															{busy ? '…' : '← Back to Review'}
														</button>
													{:else if claim.status === 'draft'}
														<button onclick={() => action(claim.id, 'submitted')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-blue-900/50 border border-blue-700/50 text-blue-300 hover:bg-blue-800/60 disabled:opacity-50">
															{busy ? '…' : 'Force Submit'}
														</button>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								</td>
							</tr>
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="px-4 py-2.5 border-t border-slate-700/50 text-xs text-slate-500">
			{rows().length} claims
			{#if rows().length !== (data.claims as any[]).length} · filtered from {(data.claims as any[]).length}{/if}
		</div>
	</Card>
</div>

{#if rollupToast}
	<div class="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur-sm
		{rollupToast.type === 'success'
			? 'border-emerald-700 bg-emerald-950/90 text-emerald-200'
			: 'border-red-700 bg-red-950/90 text-red-200'}">
		{rollupToast.message}
	</div>
{/if}

{#if itemToast}
	<div class="fixed bottom-20 right-4 z-50 max-w-sm rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur-sm
		{itemToast.type === 'success'
			? 'border-emerald-700 bg-emerald-950/90 text-emerald-200'
			: 'border-red-700 bg-red-950/90 text-red-200'}">
		{itemToast.message}
	</div>
{/if}
