<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CheckCircle2, XCircle, Clock, AlertCircle,
		DollarSign, Receipt, FolderKanban, Wallet,
		MessageSquare, User, Calendar, Users, Settings2, Loader2
	} from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let statusFilter   = $state<string>('all');
	let typeFilter     = $state<string>('all');
	let actionMessages = $state<Record<string, string>>({});
	let processingId   = $state<string | null>(null);

	// Quorum editor state
	let editingQuorum  = $state(false);
	let quorumInput    = $state(String(data.quorum ?? 2));
	let savingQuorum   = $state(false);
	let quorumError    = $state('');

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
			default:        return DollarSign;
		}
	}

	let filtered = $derived.by(() => {
		let list = data.approvals as any[];
		if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
		if (typeFilter  !== 'all') list = list.filter(a => a.entityType === typeFilter);
		return list;
	});

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

		<!-- Quorum setting -->
		{#if canApprove}
			<div class="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shrink-0">
				<Users class="size-4 text-slate-400 shrink-0" />
				<span class="text-sm text-slate-400">Required approvals:</span>
				{#if editingQuorum}
					<input
						type="number" min="1" max="10"
						bind:value={quorumInput}
						class="w-14 text-center rounded-md border border-slate-600 bg-slate-900 text-slate-100 text-sm px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
					/>
					<button
						type="button"
						onclick={saveQuorum}
						disabled={savingQuorum}
						class="text-xs font-semibold px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
					>
						{#if savingQuorum}<Loader2 class="size-3 animate-spin" />{:else}Save{/if}
					</button>
					<button type="button" onclick={() => { editingQuorum = false; quorumInput = String(data.quorum); quorumError = ''; }} class="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
					{#if quorumError}<span class="text-xs text-red-400">{quorumError}</span>{/if}
				{:else}
					<span class="text-lg font-bold text-emerald-400">{data.quorum}</span>
					<button type="button" onclick={() => { editingQuorum = true; quorumInput = String(data.quorum); }} class="text-slate-500 hover:text-slate-300 transition-colors" title="Edit quorum">
						<Settings2 class="size-3.5" />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Pending</p>
					<p class="text-2xl font-bold">{data.stats.pending}</p>
					<p class="text-xs text-muted-foreground mt-1">{fmt(data.stats.pendingAmount)}</p>
				</div>
				<Clock class="size-8 text-amber-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Approved</p>
					<p class="text-2xl font-bold">{data.stats.approved}</p>
				</div>
				<CheckCircle2 class="size-8 text-emerald-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Rejected</p>
					<p class="text-2xl font-bold">{data.stats.rejected}</p>
				</div>
				<XCircle class="size-8 text-red-500 opacity-40" />
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
					<option value="all">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="revision_requested">Revision Requested</option>
				</select>
			</div>
			<div>
				<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Type</label>
				<select bind:value={typeFilter} class="px-3 py-2 border rounded-lg bg-background text-sm">
					<option value="all">All Types</option>
					<option value="expense">Expenses</option>
					<option value="project">Projects</option>
					<option value="budget">Budgets</option>
				</select>
			</div>
			<p class="text-sm text-muted-foreground pb-2">Showing {filtered.length} of {data.approvals.length}</p>
		</div>
	</Card>

	<!-- List -->
	<div class="space-y-4">
		{#if filtered.length === 0}
			<Card class="p-10 text-center text-muted-foreground">No approval requests found</Card>
		{:else}
			{#each filtered as approval (approval.id)}
				{@const Icon      = typeIcon(approval.entityType)}
				{@const voteCount = approval.voteCount ?? 0}
				{@const quorum    = data.quorum ?? 2}
				{@const votePct   = Math.min(100, (voteCount / quorum) * 100)}
				{@const msg       = actionMessages[approval.id]}
				<Card class="p-6">
					<div class="flex items-start justify-between gap-4">
						<!-- Left: icon + details -->
						<div class="flex items-start gap-4 flex-1 min-w-0">
							<div class="p-3 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
								<Icon class="size-5 text-slate-300" />
							</div>

							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-3 flex-wrap">
									<h3 class="font-semibold capitalize">{approval.entityType} Approval</h3>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(approval.status)}">
										{approval.status.replace('_', ' ')}
									</span>
								</div>

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

								{#if approval.comments}
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
				</Card>
			{/each}
		{/if}
	</div>
</div>
