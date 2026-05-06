<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { ClipboardList, CheckCircle2, Clock, XCircle, DollarSign, Copy, Check } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let statusFilter  = $state('all');
	let projectFilter = $state('all');
	let copied        = $state<string | null>(null);
	let markingPaid   = $state<string | null>(null);

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
									{#if wo.status === 'open'}
										<button
											type="button"
											onclick={() => markPaid(wo.id, wo.expenseId)}
											disabled={markingPaid === wo.id}
											class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
										>
											{markingPaid === wo.id ? 'Saving…' : 'Mark Paid'}
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>
