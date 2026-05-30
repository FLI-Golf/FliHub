<script lang="ts">
	import type { PageData } from './$types';
	import { FileText, Building2, FolderKanban, DollarSign, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const orders = $derived((data.workOrders ?? []) as any[]);

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	const statusConfig: Record<string, { label: string; icon: any; class: string }> = {
		open:      { label: 'Open',      icon: Clock,         class: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		paid:      { label: 'Paid',      icon: CheckCircle2,  class: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		cancelled: { label: 'Cancelled', icon: XCircle,       class: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
	};

	const totalValue  = $derived(orders.reduce((s: number, o: any) => s + (o.amount ?? 0), 0));
	const openCount   = $derived(orders.filter((o: any) => o.status === 'open').length);
	const paidCount   = $derived(orders.filter((o: any) => o.status === 'paid').length);
</script>

<svelte:head><title>Work Orders — FliHub</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Work Orders</h1>
			<p class="text-sm text-slate-400 mt-0.5">Work orders generated from awarded vendor bids</p>
		</div>
		<a href="/dashboard/bids" class="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
			<ExternalLink class="size-3.5" /> Bid Pipeline
		</a>
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		{#each [
			{ label: 'Total WOs',    value: String(orders.length), sub: 'all time' },
			{ label: 'Open',         value: String(openCount),     sub: 'awaiting payment' },
			{ label: 'Paid',         value: String(paidCount),     sub: 'completed' },
			{ label: 'Total Value',  value: fmt(totalValue),       sub: 'across all WOs' },
		] as kpi}
			<div class="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
				<p class="text-xs text-slate-500">{kpi.label}</p>
				<p class="text-xl font-bold text-slate-100 mt-0.5">{kpi.value}</p>
				<p class="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Table -->
	{#if orders.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/30 px-6 py-16 text-center">
			<FileText class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400 font-medium">No work orders yet</p>
			<p class="text-sm text-slate-600 mt-1">Work orders are created automatically when a bid is awarded in the <a href="/dashboard/bids" class="text-orange-400 hover:underline">Bid Pipeline</a>.</p>
		</div>
	{:else}
		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-800/60">
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">WO Number</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendor</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Project</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Description</th>
						<th class="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Issued</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/60">
					{#each orders as wo (wo.id)}
						{@const cfg = statusConfig[wo.status] ?? statusConfig.open}
						<tr class="bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
							<!-- WO Number -->
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<FileText class="size-3.5 text-slate-500 shrink-0" />
									<span class="font-mono font-semibold text-slate-200">{wo.work_order_number}</span>
								</div>
							</td>

							<!-- Vendor -->
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<Building2 class="size-3.5 text-slate-500 shrink-0" />
									<span class="text-slate-300">{wo.expand?.vendorId?.name ?? wo.projectName ?? '—'}</span>
								</div>
							</td>

							<!-- Project -->
							<td class="px-4 py-3 hidden md:table-cell">
								<div class="flex items-center gap-2">
									<FolderKanban class="size-3.5 text-slate-500 shrink-0" />
									{#if wo.expand?.project?.id}
										<a href="/dashboard/projects/{wo.expand.project.id}"
											class="text-slate-300 hover:text-blue-400 transition-colors">
											{wo.expand.project.name}
										</a>
									{:else}
										<span class="text-slate-500">{wo.projectName || '—'}</span>
									{/if}
								</div>
							</td>

							<!-- Description -->
							<td class="px-4 py-3 hidden lg:table-cell">
								<p class="text-slate-400 truncate max-w-xs">{wo.description || '—'}</p>
							</td>

							<!-- Amount -->
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<DollarSign class="size-3.5 text-slate-500" />
									<span class="font-semibold text-slate-200">{fmt(wo.amount ?? 0)}</span>
								</div>
							</td>

							<!-- Status -->
							<td class="px-4 py-3">
								<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border {cfg.class}">
									<svelte:component this={cfg.icon} class="size-3" />
									{cfg.label}
								</span>
							</td>

							<!-- Issued date -->
							<td class="px-4 py-3 hidden sm:table-cell text-slate-500 text-xs">
								{fmtDate(wo.approvedDate || wo.created)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
