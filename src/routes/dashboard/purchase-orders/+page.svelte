<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { FileText, ExternalLink, CheckCircle2, Send, AlertCircle, XCircle, Building2, Printer } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const pos = $derived((data.purchaseOrders ?? []) as any[]);

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	const STATUS_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
		draft:        { label: 'Draft',        icon: FileText,     class: 'bg-slate-700/40 text-slate-300 border-slate-600' },
		sent:         { label: 'Sent',         icon: Send,         class: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		acknowledged: { label: 'Acknowledged', icon: CheckCircle2, class: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
		invoiced:     { label: 'Invoiced',     icon: FileText,     class: 'bg-amber-900/40 text-amber-300 border-amber-700/50' },
		partial:      { label: 'Partial',      icon: AlertCircle,  class: 'bg-orange-900/40 text-orange-300 border-orange-700/50' },
		paid:         { label: 'Paid',         icon: CheckCircle2, class: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		overdue:      { label: 'Overdue',      icon: AlertCircle,  class: 'bg-red-900/40 text-red-300 border-red-700/50' },
		cancelled:    { label: 'Cancelled',    icon: XCircle,      class: 'bg-slate-800/40 text-slate-500 border-slate-700' },
	};

	const totalValue   = $derived(pos.reduce((s: number, p: any) => s + (p.amount ?? 0), 0));
	const draftCount   = $derived(pos.filter((p: any) => p.status === 'draft').length);
	const sentCount    = $derived(pos.filter((p: any) => ['sent', 'acknowledged', 'invoiced', 'partial'].includes(p.status)).length);
	const paidCount    = $derived(pos.filter((p: any) => p.status === 'paid').length);
	const overdueCount = $derived(pos.filter((p: any) => p.status === 'overdue').length);

	let actionLoading = $state<string | null>(null);
	let actionErr = $state('');

	const NEXT_STATUS: Record<string, { label: string; next: string }> = {
		draft:        { label: 'Mark Sent',         next: 'sent' },
		sent:         { label: 'Mark Acknowledged', next: 'acknowledged' },
		acknowledged: { label: 'Mark Invoiced',     next: 'invoiced' },
		invoiced:     { label: 'Mark Paid',         next: 'paid' },
		partial:      { label: 'Mark Paid',         next: 'paid' },
		overdue:      { label: 'Mark Invoiced',     next: 'invoiced' },
	};

	async function advanceStatus(po: any) {
		const next = NEXT_STATUS[po.status];
		if (!next || actionLoading) return;
		actionLoading = po.id;
		actionErr = '';
		try {
			const res = await fetch(`/api/sponsor-purchase-orders/${po.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: next.next }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? `Error ${res.status}`);
			}
			await invalidateAll();
		} catch (e: any) {
			actionErr = e.message;
		} finally {
			actionLoading = null;
		}
	}
</script>

<svelte:head><title>Purchase Orders — FliHub</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Sponsor Purchase Orders</h1>
			<p class="text-sm text-slate-400 mt-0.5">Draft POs are created when a sponsor is moved to Contracted. Advance each through to Paid.</p>
		</div>
		<a href="/dashboard/sponsor-collections" class="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
			<ExternalLink class="size-3.5" /> Collections
		</a>
	</div>

	{#if actionErr}
		<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{actionErr}</p>
	{/if}

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		{#each [
			{ label: 'Draft',     value: String(draftCount),   sub: 'awaiting send',   cls: 'border-slate-700' },
			{ label: 'In Flight', value: String(sentCount),    sub: 'sent → invoiced', cls: 'border-blue-800/50' },
			{ label: 'Overdue',   value: String(overdueCount), sub: 'needs attention', cls: overdueCount > 0 ? 'border-red-800/50' : 'border-slate-700' },
			{ label: 'Total Value', value: fmt(totalValue),    sub: pos.length + ' POs', cls: 'border-slate-700' },
		] as kpi}
			<div class="rounded-xl border {kpi.cls} bg-slate-800/50 px-4 py-3">
				<p class="text-xs text-slate-500">{kpi.label}</p>
				<p class="text-xl font-bold text-slate-100 mt-0.5">{kpi.value}</p>
				<p class="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
			</div>
		{/each}
	</div>

	{#if pos.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/30 px-6 py-16 text-center">
			<FileText class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400 font-medium">No purchase orders yet</p>
			<p class="text-sm text-slate-600 mt-1">
				POs are created automatically when a sponsor is moved to
				<a href="/dashboard/sponsors" class="text-orange-400 hover:underline">Contracted</a>
				in the pipeline.
			</p>
		</div>
	{:else}
		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-800/60">
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">PO Number</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sponsor</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Description</th>
						<th class="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Year</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/60">
					{#each pos as po (po.id)}
						{@const cfg = STATUS_CONFIG[po.status] ?? STATUS_CONFIG.draft}
						{@const sponsorName = po.expand?.sponsorId?.companyName ?? '—'}
						{@const sponsorId = typeof po.sponsorId === 'string' ? po.sponsorId : po.sponsorId?.id}
						{@const nextAction = NEXT_STATUS[po.status]}
						<tr class="bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<FileText class="size-3.5 text-slate-500 shrink-0" />
									<span class="font-mono font-semibold text-slate-200 text-xs">{po.po_number}</span>
								</div>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<Building2 class="size-3.5 text-slate-500 shrink-0" />
									{#if sponsorId}
										<a href="/dashboard/sponsors/{sponsorId}" class="text-slate-300 hover:text-orange-400 transition-colors">
											{sponsorName}
										</a>
									{:else}
										<span class="text-slate-400">{sponsorName}</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3 hidden md:table-cell">
								<p class="text-slate-400 truncate max-w-xs text-xs">{po.description || '—'}</p>
							</td>
							<td class="px-4 py-3 text-right font-semibold text-slate-200">
								{fmt(po.amount ?? 0)}
							</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border {cfg.class}">
									<svelte:component this={cfg.icon} class="size-3" />
									{cfg.label}
								</span>
							</td>
							<td class="px-4 py-3 hidden sm:table-cell text-slate-500 text-xs">{po.year ?? '—'}</td>
							<td class="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">{fmtDate(po.created)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									{#if nextAction}
										<button
											onclick={() => advanceStatus(po)}
											disabled={actionLoading === po.id}
											class="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors disabled:opacity-50 whitespace-nowrap"
										>
											{actionLoading === po.id ? 'Saving…' : nextAction.label}
										</button>
									{/if}
									<a
										href="/api/sponsor-purchase-orders/{po.id}/print"
										target="_blank"
										rel="noopener"
										class="text-slate-500 hover:text-slate-300 transition-colors"
										title="Print / Save as PDF"
									>
										<Printer class="size-3.5" />
									</a>
									{#if sponsorId}
										<a href="/dashboard/sponsors/{sponsorId}" class="text-slate-500 hover:text-slate-300 transition-colors" title="View sponsor">
											<ExternalLink class="size-3.5" />
										</a>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
