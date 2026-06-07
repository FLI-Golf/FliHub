<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Search, ChevronDown, ChevronUp, CheckCircle2, Clock,
		AlertCircle, XCircle, DollarSign, FileText, ArrowRight,
		ChevronsUpDown, ChevronRight, Receipt, Loader2
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
	function workOrderForClaim(claim: any) {
		const workOrders = (data.workOrders ?? []) as any[];
		const claimId = String(claim?.id || '').trim();
		const byClaim = workOrders.find((wo: any) => String(wo?.claimId || '').trim() === claimId);
		if (byClaim) return byClaim;

		const ref = String(claim?.work_order_number || claim?.referenceNumber || '').trim().toLowerCase();
		if (!ref) return null;

		return workOrders.find((wo: any) => String(wo?.work_order_number || '').trim().toLowerCase() === ref) ?? null;
	}

	function debugPaidClaimQB(claim: any, wo: any) {
		if (!import.meta.env.DEV || claim?.status !== 'paid') return;
		console.log('[reimb-admin-ui] paid claim qb render', {
			claimId: claim?.id,
			claimRef: claim?.referenceNumber || null,
			claimWO: claim?.work_order_number || null,
			matchedWOId: wo?.id || null,
			matchedWONumber: wo?.work_order_number || null,
			matchedClaimId: wo?.claimId || null,
			qbTransactionId: wo?.qb_transaction_id || null,
			loadedWorkOrders: (data.workOrders ?? []).length
		});
	}

	$effect(() => {
		if (!import.meta.env.DEV) return;
		for (const claim of data.claims as any[]) {
			if (claim?.status !== 'paid') continue;
			debugPaidClaimQB(claim, workOrderForClaim(claim));
		}
	});

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

	const STATUS_ORDER: Record<string,number> = { submitted: 0, under_review: 1, approved: 2, paid: 3, rejected: 4, draft: 5 };

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

	function claimTitle(claimId: string) {
		return ((data.claims as any[]).find(c => c.id === claimId)?.title as string) || 'this claim';
	}

	// ── Saving state ──────────────────────────────────────────────────────────
	let saving = $state<string|null>(null);
	let actionNotice = $state<string>('');
	let deletingItem = $state<string|null>(null);
	let bulkDeletingClaim = $state<string|null>(null);
	let selectedItemIds = $state<Record<string, boolean>>({});

	async function deleteLineItem(claimId: string, itemId: string, description: string) {
		const willDeleteClaim = itemsFor(claimId).length === 1;
		const ok = confirm(
			willDeleteClaim
				? `Remove this line item?\n\n${description || 'Untitled item'}\n\nThis is the last line item. The claim "${claimTitle(claimId)}" will also be deleted.\n\nThis cannot be undone.`
				: `Remove this line item?\n\n${description || 'Untitled item'}\n\nThis cannot be undone.`
		);
		if (!ok) return;

		deletingItem = itemId;
		try {
			const res = await fetch(`/api/reimbursements/${claimId}/items/${itemId}`, { method: 'DELETE' });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				alert(err?.message || 'Failed to remove line item');
				return;
			}
			await invalidateAll();
		} finally {
			deletingItem = null;
		}
	}

	function isItemSelected(itemId: string) {
		return !!selectedItemIds[itemId];
	}

	function toggleItemSelected(itemId: string, checked: boolean) {
		selectedItemIds = { ...selectedItemIds, [itemId]: checked };
	}

	function selectedCountForClaim(claimId: string) {
		return itemsFor(claimId).filter((it: any) => !!selectedItemIds[it.id]).length;
	}

	function toggleSelectAllForClaim(claimId: string, checked: boolean) {
		const next = { ...selectedItemIds };
		for (const item of itemsFor(claimId)) next[item.id] = checked;
		selectedItemIds = next;
	}

	async function deleteSelectedForClaim(claimId: string) {
		const items = itemsFor(claimId);
		const selected = items.filter((it: any) => !!selectedItemIds[it.id]);
		if (!selected.length) return;
		const willDeleteClaim = selected.length === items.length;

		const ok = confirm(
			willDeleteClaim
				? `Remove ${selected.length} selected line item${selected.length === 1 ? '' : 's'}?\n\nAll line items are selected. The claim "${claimTitle(claimId)}" will also be deleted.\n\nThis cannot be undone.`
				: `Remove ${selected.length} selected line item${selected.length === 1 ? '' : 's'}?\n\nThis cannot be undone.`
		);
		if (!ok) return;

		bulkDeletingClaim = claimId;
		let failed = 0;
		try {
			for (const item of selected) {
				const res = await fetch(`/api/reimbursements/${claimId}/items/${item.id}`, { method: 'DELETE' });
				if (!res.ok) failed++;
			}

			const next = { ...selectedItemIds };
			for (const item of selected) delete next[item.id];
			selectedItemIds = next;

			await invalidateAll();
			if (failed) alert(`Removed ${selected.length - failed} item(s), ${failed} failed.`);
		} finally {
			bulkDeletingClaim = null;
		}
	}

	async function action(claimId: string, status: string) {
		if (saving) return;
		saving = claimId;
		actionNotice = '';
		const f = form(claimId);
		try {
			if (status === 'under_review') {
				const approvalRes = await fetch(`/api/reimbursements/${claimId}/request-approval`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' }
				});
				const approvalPayload = await approvalRes.json().catch(() => ({}));
				if (!approvalRes.ok) {
					const msg = approvalPayload?.error || approvalPayload?.message || 'Failed to create approval';
					actionNotice = `Approval request failed: ${msg}`;
					alert(msg);
					return;
				}
				actionNotice = `Approval requested successfully (ID: ${approvalPayload?.approvalId || 'created'}).`;
				await invalidateAll();
				return;
			}

			const res = await fetch(`/api/reimbursements/${claimId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					status,
					reviewNotes: f.reviewNotes || '',
					referenceNumber: f.refNum || undefined,
					paymentMethod: f.payMethod || undefined,
					paidDate: f.paidDate || undefined
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				alert(err?.message || 'Failed to update claim');
				return;
			}

			const payload = await res.json().catch(() => ({}));
			if (Array.isArray(payload?._woWarnings) && payload._woWarnings.length) {
				alert(`Saved with warning:\n- ${payload._woWarnings.join('\n- ')}`);
			}

			await invalidateAll();
		} finally {
			saving = null;
		}
	}

	async function openApprovalsForClaim(claimId: string) {
		if (saving) return;
		saving = claimId;
		actionNotice = '';
		try {
			const approvalRes = await fetch(`/api/reimbursements/${claimId}/request-approval`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' }
			});
			const payload = await approvalRes.json().catch(() => ({}));
			if (!approvalRes.ok) {
				const msg = payload?.error || payload?.message || 'Failed to open approvals';
				actionNotice = `Approval request failed: ${msg}`;
				alert(msg);
				return;
			}
			actionNotice = `Approval ready (ID: ${payload?.approvalId || 'created'}). Redirecting to Approvals…`;
			window.location.href = '/dashboard/approvals';
		} finally {
			saving = null;
		}
	}

	// ── Status display ────────────────────────────────────────────────────────
	const STATUS_LABEL: Record<string,string> = {
		draft: 'Draft', submitted: 'Pending', under_review: 'Approval In Progress',
		approved: 'Pending Payment', paid: 'Paid', rejected: 'Rejected'
	};
	const STATUS_CLASS: Record<string,string> = {
		draft:        'bg-slate-700 text-slate-300',
		submitted:    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
		under_review: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50',
		approved:     'bg-amber-900/60 text-amber-300 border border-amber-700/50',
		paid:         'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
		rejected:     'bg-red-900/60 text-red-300 border border-red-700/50',
	};

	const INPUT = 'w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wide';

	// ── Pipeline counts for header ────────────────────────────────────────────
	const PIPELINE = [
		{ key: 'under_review', label: 'Approval In Progress', color: 'text-yellow-400',  bg: 'bg-yellow-950/40 border-yellow-800/50' },
		{ key: 'submitted',    label: 'Pending', color: 'text-blue-400',    bg: 'bg-blue-950/40 border-blue-800/50' },
		{ key: 'approved',     label: 'Pending Payment',     color: 'text-amber-400',  bg: 'bg-amber-950/40 border-amber-800/50' },
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
				<option value="submitted">Pending</option>
				<option value="under_review">Approval In Progress</option>
				<option value="approved">Pending Payment</option>
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

			<span class="ml-auto text-xs text-slate-500">{rows().length} claims</span>
		</div>
		{#if actionNotice}
			<p class="mt-3 text-xs text-slate-300">{actionNotice}</p>
		{/if}
	</Card>

	<!-- Table -->
	<Card class="bg-slate-800/50 border-slate-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-900/40">
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
						<tr><td colspan="8" class="px-4 py-12 text-center text-slate-500">No claims match the current filters.</td></tr>
					{:else}
						{#each rows() as claim (claim.id)}
							{@const isOpen = expanded === claim.id}
							{@const items  = itemsFor(claim.id)}
							{@const wo     = workOrderForClaim(claim)}
							{@const f      = form(claim.id)}
							{@const busy   = saving === claim.id}
							{@const isLocked = claim.status === 'approved' || claim.status === 'paid'}

							<!-- Main row -->
							<tr class="hover:bg-slate-700/30 transition-colors {isOpen ? 'bg-slate-700/20' : ''}">
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
												{busy ? '…' : 'Create Approval'}
											</button>
											<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
												{busy ? '…' : 'Reject'}
											</button>
										{:else if claim.status === 'under_review'}
											<button onclick={() => openApprovalsForClaim(claim.id)} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-violet-900/50 border border-violet-700/50 text-violet-300 hover:bg-violet-800/60 transition-colors">
												{#if busy}
													<span class="inline-flex items-center gap-1"><Loader2 class="size-3 animate-spin" /> Opening…</span>
												{:else}
													Open Approvals
												{/if}
											</button>
											<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
												class="text-xs px-2 py-1 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
												{busy ? '…' : 'Reject'}
											</button>
										{:else if claim.status === 'approved'}
											<span class="text-xs px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-300 whitespace-nowrap">
												Pending - submit to QB on Work Orders
											</span>
										{:else if claim.status === 'draft'}
											<span class="text-xs text-slate-600 italic">awaiting submission</span>
										{:else if claim.status === 'paid'}
											<span class="text-xs text-emerald-600">✓ Complete{#if wo?.qb_transaction_id} · QB {wo.qb_transaction_id}{/if}</span>
										{:else if claim.status === 'rejected'}
											<span class="text-xs text-red-600">✗ Rejected</span>
										{/if}
									</div>
								</td>
							</tr>

							<!-- Expanded detail row -->
							{#if isOpen}
							<tr class="bg-slate-900/40">
								<td colspan="8" class="px-6 py-4">
									<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

										<!-- Line items -->
										<div>
											<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Line Items</p>
											{#if items.length === 0}
												<p class="text-xs text-slate-600">No items.</p>
											{:else}
												<table class="w-full text-xs">
													<thead>
														<tr class="text-left text-slate-500 border-b border-slate-700">
															<th class="pb-1.5 pr-3">
																<input
																	type="checkbox"
																	disabled={isLocked}
																	checked={items.length > 0 && selectedCountForClaim(claim.id) === items.length}
																	onchange={(e) => toggleSelectAllForClaim(claim.id, (e.currentTarget as HTMLInputElement).checked)}
																	class="rounded border-slate-600 accent-red-500"
																	title="Select all line items"
																/>
															</th>
															<th class="pb-1.5 pr-3">Description</th>
															<th class="pb-1.5 pr-3">Category</th>
															<th class="pb-1.5 pr-3">Vendor</th>
															<th class="pb-1.5 pr-3">Date</th>
															<th class="pb-1.5 text-right">Amount</th>
															<th class="pb-1.5 text-right">Action</th>
														</tr>
													</thead>
													<tbody class="divide-y divide-slate-700/30">
														{#each items as item}
															<tr>
																<td class="py-1.5 pr-3">
																	<input
																		type="checkbox"
																		disabled={isLocked}
																		checked={isItemSelected(item.id)}
																		onchange={(e) => toggleItemSelected(item.id, (e.currentTarget as HTMLInputElement).checked)}
																		class="rounded border-slate-600 accent-red-500"
																		title="Select line item"
																	/>
																</td>
																<td class="py-1.5 pr-3 text-slate-200">{item.description}</td>
																<td class="py-1.5 pr-3 text-slate-400 capitalize">{item.category}</td>
																<td class="py-1.5 pr-3 text-slate-400">{item.vendor || '—'}</td>
																<td class="py-1.5 pr-3 text-slate-400">{fmtDate(item.date)}</td>
																<td class="py-1.5 text-right font-semibold text-emerald-400">{fmt(item.amount)}</td>
																<td class="py-1.5 text-right">
																	{#if isLocked}
																		<span class="text-[11px] text-slate-500">Locked</span>
																	{:else}
																		<button
																			onclick={() => deleteLineItem(claim.id, item.id, item.description)}
																			disabled={deletingItem === item.id}
																			class="text-[11px] px-2 py-1 rounded border border-red-700/50 bg-red-950/40 text-red-300 hover:bg-red-900/50 disabled:opacity-50"
																		>
																			{deletingItem === item.id ? 'Removing…' : 'Remove'}
																		</button>
																	{/if}
																</td>
															</tr>
														{/each}
													</tbody>
													<tfoot class="border-t border-slate-600">
														{#if !isLocked}
															<tr>
																<td colspan="7" class="pt-2 pb-1">
																	<div class="flex items-center justify-between">
																		<p class="text-[11px] text-slate-500">
																			{selectedCountForClaim(claim.id)} selected
																		</p>
																		<button
																			onclick={() => deleteSelectedForClaim(claim.id)}
																			disabled={selectedCountForClaim(claim.id) === 0 || bulkDeletingClaim === claim.id}
																			class="text-[11px] px-2 py-1 rounded border border-red-700/50 bg-red-950/40 text-red-300 hover:bg-red-900/50 disabled:opacity-50"
																		>
																			{bulkDeletingClaim === claim.id ? 'Removing…' : `Remove Selected (${selectedCountForClaim(claim.id)})`}
																		</button>
																	</div>
																</td>
															</tr>
														{:else}
															<tr>
																<td colspan="7" class="pt-2 pb-1 text-[11px] text-slate-500">
																	Line items are locked after approval/payment.
																</td>
															</tr>
														{/if}
														<tr>
															<td colspan="6" class="pt-2 text-slate-400 font-semibold">Total</td>
															<td class="pt-2 text-right font-bold text-emerald-300">{fmt(claim.totalAmount || 0)}</td>
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
													<p>Ref: <span class="font-mono font-bold">{claim.referenceNumber || wo?.work_order_number || '—'}</span></p>
													{#if claim.paidDate}<p>Paid: {fmtDate(claim.paidDate)}</p>{/if}
													{#if claim.expand?.paidBy}<p>Paid By: {claimantName({ expand: { claimant: claim.expand.paidBy } })}</p>{/if}
													{#if claim.paymentMethod}<p>Method: {claim.paymentMethod.replace('_',' ')}</p>{/if}
																										<p>QB Ref: <span class="font-mono">{wo?.qb_transaction_id || 'not entered'}</span></p>
													{#if wo?.qb_account}<p>QB Account: {wo.qb_account}</p>{/if}
													{#if wo?.qb_entered_date}<p>QB Entered: {fmtDate(wo.qb_entered_date)}</p>{/if}
													{#if wo?.qb_notes}<p class="text-emerald-200/90">QB Notes: {wo.qb_notes}</p>{/if}
													<p class="text-emerald-200/90">Items: {items.length} · Total: {fmt(claim.totalAmount || 0)}</p>
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
													<div class="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-xs text-slate-300">
														<p class="font-semibold text-slate-200">QuickBooks handoff required</p>
														<p class="mt-1">This claim now creates a work order. Enter the QB check number on the Work Orders page after the work order is created.</p>
														{#if claim.referenceNumber}<p class="mt-1 font-mono text-slate-400">WO: {claim.referenceNumber}</p>{/if}
													</div>
												{/if}

												<div class="flex gap-2 flex-wrap pt-1">
													{#if claim.status === 'submitted'}
														<button onclick={() => action(claim.id, 'under_review')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-yellow-900/50 border border-yellow-700/50 text-yellow-300 hover:bg-yellow-800/60 disabled:opacity-50">
															{busy ? 'Saving…' : 'Create Approval'}
														</button>
														<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50">
															{busy ? '…' : 'Reject'}
														</button>
													{:else if claim.status === 'under_review'}
														<button onclick={() => openApprovalsForClaim(claim.id)} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-violet-900/50 border border-violet-700/50 text-violet-300 hover:bg-violet-800/60">
															{#if busy}
																<span class="inline-flex items-center gap-1"><Loader2 class="size-3.5 animate-spin" /> Opening Approvals…</span>
															{:else}
																Open Approvals Queue
															{/if}
														</button>
														<button onclick={() => action(claim.id, 'submitted')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-50">
															{busy ? '…' : '← Back to Pending Approvals'}
														</button>
														<button onclick={() => action(claim.id, 'rejected')} disabled={busy}
															class="text-xs px-3 py-1.5 rounded bg-red-900/40 border border-red-700/40 text-red-400 hover:bg-red-900/60 disabled:opacity-50">
															{busy ? '…' : 'Reject'}
														</button>
													{:else if claim.status === 'approved'}
														<button disabled
															class="text-xs px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-400 cursor-not-allowed font-semibold">
															Pending - complete in Work Orders
														</button>
														<button onclick={() => window.location.href = '/dashboard/work-orders'}
															class="text-xs px-3 py-1.5 rounded bg-amber-900/50 border border-amber-700/50 text-amber-300 hover:bg-amber-800/60">
															Open Work Orders
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
