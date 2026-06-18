<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CheckCircle2, XCircle, Clock, AlertCircle,
		DollarSign, Receipt, FolderKanban, Wallet,
		MessageSquare, User, Calendar, Users, Settings2, Loader2,
		FileEdit, ArrowRight, FlaskConical, RefreshCw, Plus, ChevronDown, Send
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const APPROVAL_STATUS_ORDER = ['pending', 'approved', 'rejected', 'revision_requested'];
	const APPROVAL_TYPE_ORDER = ['expense', 'project', 'budget', 'bid'];

	let searchTerm = $state('');
	let selectedStatuses = $state<string[]>([]);
	let selectedTypes = $state<string[]>([]);
	let eventPaymentsOnly = $state(false);
	let minAmountFilter = $state('');
	let maxAmountFilter = $state('');
	let requestedFrom = $state('');
	let requestedTo = $state('');
	let sortBy = $state('requested_desc');

	let actionMessages = $state<Record<string, string>>({});
	let processingId   = $state<string | null>(null);

	// Quorum editor state
	let editingQuorum  = $state(false);
	let quorumInput    = $state('2');
	let savingQuorum   = $state(false);
	let quorumError    = $state('');

	// ── Test data panel ───────────────────────────────────────────────────────
	let showTestPanel  = $state(false);
	let seedCount      = $state(20);
	let seedStatuses   = $state({ pending: true, approved: true, rejected: true, revision_requested: false });
	let testBusy       = $state<'seed'|'reset'|'reset-seed'|null>(null);
	let testMsg        = $state('');

	async function seedData() {
		testBusy = 'seed'; testMsg = '';
		const statuses = Object.entries(seedStatuses).filter(([,v]) => v).map(([k]) => k);
		if (!statuses.length) { testMsg = 'Select at least one status.'; testBusy = null; return; }
		const r = await fetch('/api/approvals/test-data', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ count: seedCount, statuses })
		});
		const d = await r.json();
		testMsg = r.ok ? `✅ Created ${d.created} approvals.` : `❌ ${d.message}`;
		testBusy = null;
		await invalidateAll();
	}

	async function resetData() {
		if (!confirm(`Delete ALL expenses, approvals, and work orders? This cannot be undone.`)) return;
		testBusy = 'reset'; testMsg = '';
		const r = await fetch('/api/approvals/test-data', { method: 'DELETE' });
		const d = await r.json();
		if (r.ok) {
			const res = d.deleted;
			testMsg = `✅ Deleted ${res.expenses} expenses, ${res.approvals} approvals, ${res.work_orders} work orders.`;
		} else {
			testMsg = `❌ ${d.message}`;
		}
		testBusy = null;
		await invalidateAll();
	}

	async function resetAndSeed() {
		if (!confirm(`Delete ALL test data then seed ${seedCount} fresh approvals?`)) return;
		testBusy = 'reset-seed'; testMsg = '';
		const del = await fetch('/api/approvals/test-data', { method: 'DELETE' });
		if (!del.ok) { testMsg = '❌ Reset failed.'; testBusy = null; return; }
		const statuses = Object.entries(seedStatuses).filter(([,v]) => v).map(([k]) => k);
		const seed = await fetch('/api/approvals/test-data', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ count: seedCount, statuses })
		});
		const d = await seed.json();
		testMsg = seed.ok ? `✅ Reset & seeded ${d.created} approvals.` : `❌ ${d.message}`;
		testBusy = null;
		await invalidateAll();
	}

	// keep old name so nothing else breaks
	const resetting = $derived(testBusy === 'reset');
	const resetMessage = $derived(testMsg);

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

	function fmtDate(d: string): string {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function statusColor(s: string): string {
		switch (s) {
			case 'pending':            return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
			case 'approved':           return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
			case 'rejected':           return 'bg-red-500/15 text-red-400 border border-red-500/30';
			case 'revision_requested': return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
			default:                   return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
		}
	}

	function typeIcon(t: string) {
		switch (t) {
			case 'expense': return Receipt;
			case 'project': return FolderKanban;
			case 'budget':  return Wallet;
			case 'bid':     return Send;
			default:        return DollarSign;
		}
	}

	function paymentRecipientLabel(payment: any) {
		if (!payment) return '';
		if (payment.recipient === 'manager') return 'Manager';
		if (payment.isBonus) return 'Talent bonus';
		return 'Talent';
	}

	const statusOptions = $derived.by(() => {
		const fromData = Array.from(new Set((data.approvals as any[]).map(a => String(a.status ?? '')))).filter(Boolean);
		const ordered = APPROVAL_STATUS_ORDER.filter(s => fromData.includes(s));
		const remainder = fromData.filter(s => !APPROVAL_STATUS_ORDER.includes(s)).sort();
		return [...ordered, ...remainder];
	});

	const typeOptions = $derived.by(() => {
		const fromData = Array.from(new Set((data.approvals as any[]).map(a => String(a.entityType ?? '')))).filter(Boolean);
		const ordered = APPROVAL_TYPE_ORDER.filter(t => fromData.includes(t));
		const remainder = fromData.filter(t => !APPROVAL_TYPE_ORDER.includes(t)).sort();
		return [...ordered, ...remainder];
	});

	$effect(() => {
		if (!editingQuorum) {
			quorumInput = String(data.quorum ?? 2);
		}
	});

	$effect(() => {
		if (selectedStatuses.length === 0 && statusOptions.length > 0) {
			selectedStatuses = [...statusOptions];
		}
		if (selectedTypes.length === 0 && typeOptions.length > 0) {
			selectedTypes = [...typeOptions];
		}
	});

	function toggleStatus(status: string) {
		selectedStatuses = selectedStatuses.includes(status)
			? selectedStatuses.filter(s => s !== status)
			: [...selectedStatuses, status];
	}

	function toggleType(type: string) {
		selectedTypes = selectedTypes.includes(type)
			? selectedTypes.filter(t => t !== type)
			: [...selectedTypes, type];
	}

	function clearFilters() {
		searchTerm = '';
		selectedStatuses = [...statusOptions];
		selectedTypes = [...typeOptions];
		eventPaymentsOnly = false;
		minAmountFilter = '';
		maxAmountFilter = '';
		requestedFrom = '';
		requestedTo = '';
		sortBy = 'requested_desc';
	}

	function isEventPaymentApproval(approval: any) {
		const expenseNotes = String(approval?.expand?.expenseId?.notes ?? '');
		return expenseNotes.includes('[EP:');
	}

	let filtered = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		const minAmount = minAmountFilter ? Number(minAmountFilter) : null;
		const maxAmount = maxAmountFilter ? Number(maxAmountFilter) : null;
		const fromTs = requestedFrom ? new Date(`${requestedFrom}T00:00:00`).getTime() : null;
		const toTs = requestedTo ? new Date(`${requestedTo}T23:59:59`).getTime() : null;

		let list = (data.approvals as any[]).filter((a: any) => {
			if (selectedStatuses.length > 0 && !selectedStatuses.includes(a.status)) return false;
			if (selectedTypes.length > 0 && !selectedTypes.includes(a.entityType)) return false;
			if (eventPaymentsOnly && !isEventPaymentApproval(a)) return false;

			const amount = Number(a.amount ?? 0);
			if (minAmount !== null && !Number.isNaN(minAmount) && amount < minAmount) return false;
			if (maxAmount !== null && !Number.isNaN(maxAmount) && amount > maxAmount) return false;

			if (fromTs !== null || toTs !== null) {
				const ts = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
				if (fromTs !== null && ts < fromTs) return false;
				if (toTs !== null && ts > toTs) return false;
			}

			if (q) {
				const expense = a.expand?.expenseId;
				const bid = a.expand?.bidId;
				const requestedBy = `${a.expand?.requestedBy?.firstName ?? ''} ${a.expand?.requestedBy?.lastName ?? ''}`.trim();
				const eventPayment = a.eventPayment;
				const haystack = [
					String(a.id ?? ''),
					String(a.entityType ?? ''),
					String(a.status ?? ''),
					String(a.comments ?? ''),
					String(expense?.description ?? ''),
					String(expense?.work_order_number ?? ''),
					String(expense?.category ?? ''),
					String(bid?.expand?.vendorId?.name ?? ''),
					String(eventPayment?.eventName ?? ''),
					String(eventPayment?.paymentTypeLabel ?? ''),
					String(eventPayment?.talentName ?? ''),
					requestedBy
				].join(' ').toLowerCase();
				if (!haystack.includes(q)) return false;
			}

			return true;
		});

		list = [...list].sort((a: any, b: any) => {
			switch (sortBy) {
				case 'requested_asc':
					return new Date(a.requestedDate ?? 0).getTime() - new Date(b.requestedDate ?? 0).getTime();
				case 'amount_desc':
					return Number(b.amount ?? 0) - Number(a.amount ?? 0);
				case 'amount_asc':
					return Number(a.amount ?? 0) - Number(b.amount ?? 0);
				case 'status_az':
					return String(a.status ?? '').localeCompare(String(b.status ?? ''));
				case 'type_az':
					return String(a.entityType ?? '').localeCompare(String(b.entityType ?? ''));
				case 'requested_desc':
				default:
					return new Date(b.requestedDate ?? 0).getTime() - new Date(a.requestedDate ?? 0).getTime();
			}
		});

		return list;
	});

	const filteredStats = $derived({
		pending: filtered.filter((a: any) => a.status === 'pending').length,
		approved: filtered.filter((a: any) => a.status === 'approved').length,
		rejected: filtered.filter((a: any) => a.status === 'rejected').length,
		totalAmount: filtered.reduce((s: number, a: any) => s + (a.amount || 0), 0),
		pendingAmount: filtered.filter((a: any) => a.status === 'pending').reduce((s: number, a: any) => s + (a.amount || 0), 0),
	});

	// Group filtered approvals by work order number (from linked expense)
	const byWorkOrder = $derived.by(() => {
		const map = new Map<string, { key: string; label: string; approvals: any[] }>();
		for (const a of filtered) {
			const wo    = a.expand?.expenseId?.work_order_number ?? '';
			const label = wo || 'Other';
			if (!map.has(label)) map.set(label, { key: label, label, approvals: [] });
			map.get(label)!.approvals.push(a);
		}
		// Sort: work-order groups first (alphabetical), then "Other"
		return Array.from(map.values()).sort((a, b) => {
			if (a.key === 'Other') return 1;
			if (b.key === 'Other') return -1;
			return a.key.localeCompare(b.key);
		});
	});

	// Track which groups are expanded (all collapsed by default)
	let expandedGroups = $state<Set<string>>(new Set());
	const toggleGroup = (key: string) => {
		const next = new Set(expandedGroups);
		if (next.has(key)) next.delete(key); else next.add(key);
		expandedGroups = next;
	};

	const isAdmin    = $derived(data.userProfile?.role === 'admin');
	const isLeader   = $derived(data.userProfile?.role === 'leader');
	const canApprove = $derived(isAdmin || isLeader);

	async function handleApprove(approvalId: string) {
		processingId = approvalId;
		actionMessages = { ...actionMessages, [approvalId]: '' };
		try {
			const res    = await fetch('/api/approvals/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId }) });
			const result = await res.json();
			if (result.success) {
				actionMessages = { ...actionMessages, [approvalId]: result.message };
				await invalidateAll();
			} else {
				actionMessages = { ...actionMessages, [approvalId]: result.error ?? 'Failed' };
			}
		} catch (e: any) {
			actionMessages = { ...actionMessages, [approvalId]: e.message };
		} finally {
			processingId = null;
		}
	}

	async function handleReject(approvalId: string) {
		processingId = approvalId;
		actionMessages = { ...actionMessages, [approvalId]: '' };
		try {
			const res    = await fetch('/api/approvals/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId }) });
			const result = await res.json();
			if (result.success) {
				actionMessages = { ...actionMessages, [approvalId]: 'Rejected.' };
				await invalidateAll();
			} else {
				actionMessages = { ...actionMessages, [approvalId]: result.error ?? 'Failed' };
			}
		} catch (e: any) {
			actionMessages = { ...actionMessages, [approvalId]: e.message };
		} finally {
			processingId = null;
		}
	}

	async function saveQuorum() {
		const val = parseInt(quorumInput, 10);
		if (isNaN(val) || val < 1) { quorumError = 'Must be at least 1'; return; }
		savingQuorum = true; quorumError = '';
		try {
			const res = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.quorumSettingId, key: 'approval_quorum', value: String(val) })
			});
			if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
			editingQuorum = false;
			await invalidateAll();
		} catch (e: any) {
			quorumError = e.message;
		} finally {
			savingQuorum = false;
		}
	}
</script>

<svelte:head><title>Approvals — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-4xl font-bold mb-1 tracking-tight">Approvals</h1>
			<p class="text-muted-foreground">Review and manage approval requests</p>
		</div>

		<!-- Test data panel (admin only) — moved below header -->

	</div>

	<!-- Quorum setting banner — always visible, edit restricted to admins -->
	{#if true}
		<div class="rounded-xl border border-blue-800/50 bg-blue-950/30 px-5 py-4 flex items-center gap-4 flex-wrap">
			<div class="flex items-center gap-3 flex-1">
				<Users class="size-5 text-blue-400 shrink-0" />
				<div>
					<p class="text-sm font-semibold text-blue-200">Approval Quorum</p>
					<p class="text-xs text-blue-300/70">Number of admins required to approve each expense before it is processed</p>
				</div>
			</div>
			{#if editingQuorum}
				<div class="flex items-center gap-2">
					<input
						type="number" min="1" max="10"
						bind:value={quorumInput}
						class="w-16 text-center rounded-md border border-blue-600 bg-slate-900 text-slate-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button type="button" onclick={saveQuorum} disabled={savingQuorum}
						class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50">
						{#if savingQuorum}<Loader2 class="size-3 animate-spin inline mr-1" />{/if}Save
					</button>
					<button type="button" onclick={() => { editingQuorum = false; quorumInput = String(data.quorum); quorumError = ''; }}
						class="text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
					{#if quorumError}<span class="text-xs text-red-400">{quorumError}</span>{/if}
				</div>
			{:else}
				<div class="flex items-center gap-3">
					<div class="text-center">
						<span class="text-3xl font-black text-blue-300">{data.quorum}</span>
						<p class="text-xs text-blue-400/70">required</p>
					</div>
					<button type="button" onclick={() => { editingQuorum = true; quorumInput = String(data.quorum); }}

						class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-700/60 text-blue-300 hover:bg-blue-900/40 transition-colors">
						<Settings2 class="size-3.5" /> Edit
					</button>
				</div>

			{/if}
		</div>
	{/if}

	<!-- Test data panel -->
	{#if isAdmin}
	<div class="rounded-xl border border-amber-700/40 bg-amber-950/20 overflow-hidden">
		<button onclick={() => showTestPanel = !showTestPanel}
			class="w-full flex items-center justify-between px-5 py-3 hover:bg-amber-900/20 transition-colors text-left">
			<div class="flex items-center gap-2.5">
				<FlaskConical class="size-4 text-amber-400 shrink-0" />
				<span class="text-sm font-medium text-amber-300">Test Data Tools</span>
				<span class="text-xs text-amber-600 bg-amber-900/40 border border-amber-700/40 px-2 py-0.5 rounded">dev only</span>
			</div>
			<ChevronDown class="size-4 text-amber-600 transition-transform {showTestPanel ? 'rotate-180' : ''}" />
		</button>

		{#if showTestPanel}
		<div class="border-t border-amber-700/30 px-5 py-4 space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

				<!-- Seed controls -->
				<div class="space-y-3">
					<p class="text-xs font-semibold text-amber-400 uppercase tracking-wide">Seed Approvals</p>

					<div class="flex items-center gap-3">
						<label for="approvals-seed-count" class="text-xs text-slate-400 whitespace-nowrap">Count</label>
						<input id="approvals-seed-count" type="number" bind:value={seedCount} min="1" max="200"
							class="w-24 rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 [color-scheme:dark]" />
					</div>

					<div>
						<p class="text-xs text-slate-400 mb-2">Include statuses</p>
						<div class="flex flex-wrap gap-2">
							{#each [
								['pending',            'Pending',            'bg-amber-900/60 text-amber-300'],
								['approved',           'Approved',           'bg-emerald-900/60 text-emerald-300'],
								['rejected',           'Rejected',           'bg-red-900/60 text-red-300'],
								['revision_requested', 'Revision Requested', 'bg-blue-900/60 text-blue-300'],
							] as [key, label, cls]}
								<label class="flex items-center gap-1.5 cursor-pointer">
									<input type="checkbox" bind:checked={seedStatuses[key as keyof typeof seedStatuses]}
										class="rounded border-slate-600 accent-amber-500" />
									<span class="text-xs px-2 py-0.5 rounded {cls}">{label}</span>
								</label>
							{/each}
						</div>
					</div>

					<button onclick={seedData} disabled={!!testBusy}
						class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-amber-700/50 border border-amber-600/50 text-amber-200 hover:bg-amber-700/70 transition-colors disabled:opacity-50">
						{#if testBusy === 'seed'}
							<RefreshCw class="size-4 animate-spin" /> Seeding…
						{:else}
							<Plus class="size-4" /> Seed {seedCount} Approvals
						{/if}
					</button>
				</div>

				<!-- Danger zone -->
				<div class="space-y-3">
					<p class="text-xs font-semibold text-red-400 uppercase tracking-wide">Danger Zone</p>
					<p class="text-xs text-slate-400">Currently <strong class="text-slate-200">{data.stats.total}</strong> approvals · <strong class="text-slate-200">{data.stats.total}</strong> expenses in the database.</p>

					<div class="flex flex-col gap-2">
						<button onclick={resetAndSeed} disabled={!!testBusy}
							class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-amber-900/40 border border-amber-700/40 text-amber-300 hover:bg-amber-900/60 transition-colors disabled:opacity-50">
							{#if testBusy === 'reset-seed'}
								<RefreshCw class="size-4 animate-spin" /> Working…
							{:else}
								<RefreshCw class="size-4" /> Reset & Seed {seedCount} Fresh
							{/if}
						</button>

						<button onclick={resetData} disabled={!!testBusy}
							class="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-900/40 transition-colors disabled:opacity-50">
							{#if testBusy === 'reset'}
								<RefreshCw class="size-4 animate-spin" /> Deleting…
							{:else}
								<XCircle class="size-4" /> Delete All Test Data
							{/if}
						</button>
					</div>
				</div>
			</div>

			{#if testMsg}
				<p class="text-sm {testMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}">{testMsg}</p>
			{/if}
		</div>
		{/if}
	</div>
	{/if}

	<!-- Stat cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Pending</p>
					<p class="text-2xl font-bold">{filteredStats.pending}</p>
					<p class="text-xs text-muted-foreground mt-1">{fmt(filteredStats.pendingAmount)}</p>
				</div>
				<Clock class="size-8 text-amber-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Approved</p>
					<p class="text-2xl font-bold">{filteredStats.approved}</p>
				</div>
				<CheckCircle2 class="size-8 text-emerald-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Rejected</p>
					<p class="text-2xl font-bold">{filteredStats.rejected}</p>
				</div>
				<XCircle class="size-8 text-red-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total Amount</p>
					<p class="text-2xl font-bold">{fmt(filteredStats.totalAmount)}</p>
					<p class="text-xs text-muted-foreground mt-1">{filtered.length} of {data.approvals.length}</p>
				</div>
				<DollarSign class="size-8 text-blue-500 opacity-40" />
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="space-y-4">
			<div class="flex flex-wrap items-end gap-3">
				<div class="min-w-[220px] flex-1">
					<label for="approvals-search" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Search</label>
					<input
						id="approvals-search"
						bind:value={searchTerm}
						placeholder="Work order, vendor, requester, comments"
						class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
					/>
				</div>
				<div class="w-36">
					<label for="approvals-min-amount" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Min Amount</label>
					<input id="approvals-min-amount" bind:value={minAmountFilter} type="number" min="0" placeholder="0" class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
				</div>
				<div class="w-36">
					<label for="approvals-max-amount" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Max Amount</label>
					<input id="approvals-max-amount" bind:value={maxAmountFilter} type="number" min="0" placeholder="No max" class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
				</div>
				<div class="w-44">
					<label for="approvals-requested-from" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Requested From</label>
					<input id="approvals-requested-from" bind:value={requestedFrom} type="date" class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" />
				</div>
				<div class="w-44">
					<label for="approvals-requested-to" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Requested To</label>
					<input id="approvals-requested-to" bind:value={requestedTo} type="date" class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:dark]" />
				</div>
				<div class="w-48">
					<label for="approvals-sort" class="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">Sort</label>
					<select id="approvals-sort" bind:value={sortBy} class="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
						<option value="requested_desc">Newest requested</option>
						<option value="requested_asc">Oldest requested</option>
						<option value="amount_desc">Amount high → low</option>
						<option value="amount_asc">Amount low → high</option>
						<option value="status_az">Status A → Z</option>
						<option value="type_az">Type A → Z</option>
					</select>
				</div>
				<button
					type="button"
					onclick={clearFilters}
					class="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-slate-400 hover:text-slate-100 transition-colors"
				>
					Clear Filters
				</button>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Status</span>
				{#each statusOptions as status}
					<button
						type="button"
						onclick={() => toggleStatus(status)}
						class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedStatuses.includes(status)
							? statusColor(status)
							: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
					>
						{status.replace('_', ' ')}
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Type</span>
				{#each typeOptions as type}
					<button
						type="button"
						onclick={() => toggleType(type)}
						class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedTypes.includes(type)
							? 'bg-blue-900/40 text-blue-300 border-blue-700/50'
							: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
					>
						{type}
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Quick Filter</span>
				<button
					type="button"
					onclick={() => eventPaymentsOnly = !eventPaymentsOnly}
					class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${eventPaymentsOnly
						? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
						: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
				>
					Event Payments
				</button>
			</div>

			<p class="text-sm text-slate-500">Showing {filtered.length} of {data.approvals.length}</p>
		</div>
	</Card>

	<!-- Draft Expenses -->
	{#if data.draftExpenses && data.draftExpenses.length > 0}
		<div>
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<FileEdit class="size-4 text-slate-400" />
					<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Draft Expenses</h2>
					<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
						{data.draftExpenses.length}
					</span>
				</div>
				<a
					href="/dashboard/expenses"
					class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
				>
					View all expenses <ArrowRight class="size-3" />
				</a>
			</div>
			<div class="space-y-3">
				{#each data.draftExpenses as draft (draft.id)}
					<Card class="p-4 border-slate-700/60">
						<div class="flex items-center justify-between gap-4">
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<div class="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
									<Receipt class="size-4 text-slate-400" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-200 truncate">{draft.description}</p>
									<div class="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
										<span>{fmt(draft.amount || 0)}</span>
										{#if draft.category}<span>·</span><span>{draft.category}</span>{/if}
										{#if draft.date}<span>·</span><span>{new Date(draft.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>{/if}
									</div>
								</div>
							</div>
							<a
								href="/dashboard/expenses"
								class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 hover:border-emerald-500/60 transition-colors shrink-0"
							>
								Submit <ArrowRight class="size-3" />
							</a>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	{/if}

	<!-- List grouped by work order -->
	<div class="space-y-4">
		{#if filtered.length === 0}
			<Card class="p-10 text-center text-muted-foreground">No approval requests found</Card>
		{:else}
			{#each byWorkOrder as group (group.key)}
				{@const groupPending  = group.approvals.filter((a: any) => a.status === 'pending').length}
				{@const groupApproved = group.approvals.filter((a: any) => a.status === 'approved').length}
				{@const groupTotal    = group.approvals.reduce((s: number, a: any) => s + (a.amount || 0), 0)}
				{@const isOpen        = expandedGroups.has(group.key)}
				<div class="rounded-xl border border-slate-700 overflow-hidden">
					<!-- Group header -->
					<button type="button" onclick={() => toggleGroup(group.key)}
						class="w-full flex items-center justify-between px-5 py-4 bg-slate-800 hover:bg-slate-700/60 transition-colors text-left group">
						<div class="flex items-center gap-3 flex-1 min-w-0">
							<span class="font-mono text-xs text-slate-400 shrink-0">{group.label}</span>
							<div class="flex items-center gap-2 flex-wrap">
								{#if groupPending > 0}
									<span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">{groupPending} pending</span>
								{/if}
								{#if groupApproved > 0}
									<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">{groupApproved} approved</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-4 shrink-0">
							<span class="text-sm font-semibold text-emerald-300">{fmt(groupTotal)}</span>
							<span class="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">{isOpen ? '▲' : '▼'}</span>
						</div>
					</button>

					<!-- Group cards -->
					{#if isOpen}
						<div class="divide-y divide-slate-700/50 bg-slate-900/30">
							{#each group.approvals as approval (approval.id)}
				{@const Icon      = typeIcon(approval.entityType)}
				{@const voteCount = approval.voteCount ?? 0}
				{@const quorum    = data.quorum ?? 2}
				{@const votePct   = Math.min(100, (voteCount / quorum) * 100)}
				{@const msg       = actionMessages[approval.id]}
				{@const expense   = approval.expand?.expenseId}
				{@const bid       = approval.expand?.bidId}
				{@const eventPayment = approval.eventPayment}
				{@const isMgrCut  = expense?.description?.startsWith('Manager cut')}
				{@const cardTitle = eventPayment
					? `${eventPayment.eventName ?? 'Event'} — ${eventPayment.paymentTypeLabel}${eventPayment.talentName ? ` · ${paymentRecipientLabel(eventPayment)}: ${eventPayment.talentName}` : ''}`
					: approval.entityType === 'bid'
					? `Vendor Bid — ${bid?.expand?.vendorId?.name ?? expense?.description ?? 'Bid Approval'}`
					: expense?.description ?? `${approval.entityType} Approval`}
				<div class="p-5 hover:bg-slate-800/40 transition-colors">
					<div class="flex items-start justify-between gap-4">
						<!-- Left: icon + details -->
						<div class="flex items-start gap-4 flex-1 min-w-0">
							<div class="p-3 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
								<Icon class="size-5 text-slate-300" />
							</div>

							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1 flex-wrap">
									<h3 class="font-semibold text-slate-100 truncate">
										{cardTitle}
									</h3>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 {statusColor(approval.status)}">
										{approval.status.replace('_', ' ')}
									</span>
								</div>

								{#if eventPayment}
									<div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
										<span class="text-cyan-400 font-medium">Event payment</span>
										{#if eventPayment.eventName}
											<span>· {eventPayment.eventName}</span>
										{/if}
										<span>· {eventPayment.paymentTypeLabel}</span>
										{#if eventPayment.talentName}
											<span>· {paymentRecipientLabel(eventPayment)}: {eventPayment.talentName}</span>
										{/if}
										{#if eventPayment.recipient === 'manager'}
											<span>· Manager payout</span>
										{/if}
									</div>
								{/if}

								{#if approval.entityType === 'bid'}
									<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mb-3">
										<span class="text-orange-400 font-medium">Vendor Bid</span>
										{#if expense?.work_order_number}
											<span class="font-mono text-emerald-400">· PO: {expense.work_order_number}</span>
										{/if}
									</div>
								{:else if expense}
									<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mb-3">
										{#if expense.work_order_number}
											<span class="font-mono text-slate-400">{expense.work_order_number}</span>
										{/if}
										{#if expense.category}
											<span>· {expense.category}</span>
										{/if}
										{#if isMgrCut}
											<span class="text-amber-500">· Manager cut</span>
										{:else}
											<span class="text-emerald-500">· Player payment</span>
										{/if}
									</div>
								{/if}

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
									<div class="flex items-center gap-2 text-muted-foreground">
										<DollarSign class="size-3.5 shrink-0" />
										<span>Amount: <span class="font-semibold text-foreground">{fmt(approval.amount || 0)}</span></span>
									</div>
									<div class="flex items-center gap-2 text-muted-foreground">
										<User class="size-3.5 shrink-0" />
										<span>Requested by: <span class="font-semibold text-foreground">{approval.expand?.requestedBy?.firstName} {approval.expand?.requestedBy?.lastName}</span></span>
									</div>
									<div class="flex items-center gap-2 text-muted-foreground">
										<Calendar class="size-3.5 shrink-0" />
										{#if approval.reviewedDate}
											<span>{approval.status === 'approved' ? 'Approved' : 'Reviewed'}: <span class="font-semibold text-foreground">{fmtDate(approval.reviewedDate)}</span></span>
										{:else}
											<span>Submitted: <span class="font-semibold text-foreground">{fmtDate(approval.requestedDate)}</span></span>
										{/if}
									</div>
								</div>

								<!-- Quorum progress (pending only) -->
								{#if approval.status === 'pending'}
									<div class="mb-3">
										<div class="flex items-center justify-between text-xs mb-1.5">
											<span class="flex items-center gap-1.5 text-muted-foreground">
												<Users class="size-3.5" />
												Approvals received
											</span>
											<span class="font-semibold {voteCount >= quorum ? 'text-emerald-400' : 'text-amber-400'}">
												{voteCount} / {quorum} required
											</span>
										</div>
										<div class="h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
											<div
												class="h-full rounded-full transition-all duration-500 {voteCount >= quorum ? 'bg-emerald-500' : 'bg-amber-400'}"
												style="width:{votePct}%"
											></div>
										</div>
										{#if approval.hasVoted}
											<p class="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
												<CheckCircle2 class="size-3" /> You have approved this
											</p>
										{/if}
									</div>
								{/if}

								{#if approval.comments && !(approval.status === 'approved' && approval.comments.includes('required approvers'))}
									<div class="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm">
										<div class="flex items-start gap-2">
											<MessageSquare class="size-3.5 mt-0.5 shrink-0 text-slate-400" />
											<div class="prose prose-sm dark:prose-invert max-w-none text-slate-300">{@html approval.comments}</div>
										</div>
									</div>
								{/if}

								{#if msg}
									<p class="text-xs mt-2 {msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('already') ? 'text-red-400' : 'text-emerald-400'}">
										{msg}
									</p>
								{/if}
							</div>
						</div>

						<!-- Right: action buttons -->
						{#if approval.status === 'pending' && canApprove}
							<div class="flex flex-col gap-2 shrink-0">
								<Button
									onclick={() => handleApprove(approval.id)}
									disabled={processingId === approval.id || approval.hasVoted}
									size="sm"
									class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
								>
									{#if processingId === approval.id}
										<Loader2 class="size-4 mr-1.5 animate-spin" />
									{:else}
										<CheckCircle2 class="size-4 mr-1.5" />
									{/if}
									{approval.hasVoted ? 'Voted' : 'Approve'}
								</Button>
								<Button
									onclick={() => handleReject(approval.id)}
									disabled={processingId === approval.id}
									variant="outline"
									size="sm"
									class="border-red-600/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
								>
									<XCircle class="size-4 mr-1.5" />
									Reject
								</Button>
							</div>
						{/if}
					</div>
							</div>
						{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
