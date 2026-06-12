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
	const allStatuses = $derived(Object.keys(STATUS_CONFIG));

	let searchTerm = $state('');
	let statusFilters = $state<string[]>(Object.keys(STATUS_CONFIG));
	let yearFilter = $state('all');
	let minAmountFilter = $state('');
	let maxAmountFilter = $state('');
	let sortBy = $state('created_desc');

	const yearOptions = $derived(
		Array.from(
			new Set(
				pos
					.map((p: any) => Number(p.year))
					.filter((y: number) => Number.isFinite(y) && y > 0)
			)
		).sort((a, b) => b - a)
	);

	function toggleStatusFilter(status: string) {
		statusFilters = statusFilters.includes(status)
			? statusFilters.filter((s) => s !== status)
			: [...statusFilters, status];
	}

	function resetFilters() {
		searchTerm = '';
		statusFilters = Object.keys(STATUS_CONFIG);
		yearFilter = 'all';
		minAmountFilter = '';
		maxAmountFilter = '';
		sortBy = 'created_desc';
	}

	const filteredPos = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		const minAmount = minAmountFilter ? Number(minAmountFilter) : null;
		const maxAmount = maxAmountFilter ? Number(maxAmountFilter) : null;

		let rows = pos.filter((po: any) => {
			const statusOk = statusFilters.includes(po.status);
			if (!statusOk) return false;

			if (yearFilter !== 'all' && String(po.year ?? '') !== yearFilter) return false;

			const amount = Number(po.amount ?? 0);
			if (minAmount !== null && !Number.isNaN(minAmount) && amount < minAmount) return false;
			if (maxAmount !== null && !Number.isNaN(maxAmount) && amount > maxAmount) return false;

			if (q) {
				const sponsorName = (po.expand?.sponsorId?.companyName ?? '').toLowerCase();
				const haystack = [
					String(po.po_number ?? '').toLowerCase(),
					String(po.description ?? '').toLowerCase(),
					String(po.status ?? '').toLowerCase(),
					sponsorName
				].join(' ');
				if (!haystack.includes(q)) return false;
			}

			return true;
		});

		rows = [...rows].sort((a: any, b: any) => {
			switch (sortBy) {
				case 'created_asc':
					return new Date(a.created ?? 0).getTime() - new Date(b.created ?? 0).getTime();
				case 'amount_desc':
					return Number(b.amount ?? 0) - Number(a.amount ?? 0);
				case 'amount_asc':
					return Number(a.amount ?? 0) - Number(b.amount ?? 0);
				case 'year_desc':
					return Number(b.year ?? 0) - Number(a.year ?? 0);
				case 'year_asc':
					return Number(a.year ?? 0) - Number(b.year ?? 0);
				case 'sponsor_az': {
					const aName = String(a.expand?.sponsorId?.companyName ?? '').toLowerCase();
					const bName = String(b.expand?.sponsorId?.companyName ?? '').toLowerCase();
					return aName.localeCompare(bName);
				}
				case 'status_az':
					return String(a.status ?? '').localeCompare(String(b.status ?? ''));
				case 'po_az':
					return String(a.po_number ?? '').localeCompare(String(b.po_number ?? ''));
				case 'created_desc':
				default:
					return new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime();
			}
		});

		return rows;
	});

	const totalValue   = $derived(filteredPos.reduce((s: number, p: any) => s + (p.amount ?? 0), 0));
	const draftCount   = $derived(filteredPos.filter((p: any) => p.status === 'draft').length);
	const sentCount    = $derived(filteredPos.filter((p: any) => ['sent', 'acknowledged', 'invoiced', 'partial'].includes(p.status)).length);
	const overdueCount = $derived(filteredPos.filter((p: any) => p.status === 'overdue').length);

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
			<p class="text-sm text-slate-400 mt-0.5">POs are created as Sent when a sponsor is moved to Contracted. Advance each through to Paid.</p>
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
			{ label: 'Total Value', value: fmt(totalValue),    sub: filteredPos.length + ' of ' + pos.length + ' POs', cls: 'border-slate-700' },
		] as kpi}
			<div class="rounded-xl border {kpi.cls} bg-slate-800/50 px-4 py-3">
				<p class="text-xs text-slate-500">{kpi.label}</p>
				<p class="text-xl font-bold text-slate-100 mt-0.5">{kpi.value}</p>
				<p class="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
			</div>
		{/each}
	</div>

	<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="min-w-[220px] flex-1">
				<label class="block text-xs font-medium text-slate-400 mb-1">Search</label>
				<input
					bind:value={searchTerm}
					placeholder="PO #, sponsor, description, status"
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
				/>
			</div>
			<div class="w-32">
				<label class="block text-xs font-medium text-slate-400 mb-1">Year</label>
				<select bind:value={yearFilter} class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
					<option value="all">All</option>
					{#each yearOptions as y}
						<option value={String(y)}>{y}</option>
					{/each}
				</select>
			</div>
			<div class="w-36">
				<label class="block text-xs font-medium text-slate-400 mb-1">Min Amount</label>
				<input bind:value={minAmountFilter} type="number" min="0" placeholder="0" class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
			</div>
			<div class="w-36">
				<label class="block text-xs font-medium text-slate-400 mb-1">Max Amount</label>
				<input bind:value={maxAmountFilter} type="number" min="0" placeholder="No max" class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
			</div>
			<div class="min-w-[190px]">
				<label class="block text-xs font-medium text-slate-400 mb-1">Sort</label>
				<select bind:value={sortBy} class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
					<option value="created_desc">Newest first</option>
					<option value="created_asc">Oldest first</option>
					<option value="amount_desc">Amount high → low</option>
					<option value="amount_asc">Amount low → high</option>
					<option value="year_desc">Year high → low</option>
					<option value="year_asc">Year low → high</option>
					<option value="sponsor_az">Sponsor A → Z</option>
					<option value="status_az">Status A → Z</option>
					<option value="po_az">PO number A → Z</option>
				</select>
			</div>
			<button
				type="button"
				onclick={resetFilters}
				class="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors"
			>
				Reset Filters
			</button>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs text-slate-400 mr-1">Status:</span>
			{#each allStatuses as status}
				{@const cfg = STATUS_CONFIG[status]}
				<button
					type="button"
					onclick={() => toggleStatusFilter(status)}
					class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusFilters.includes(status)
						? cfg.class
						: 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300 hover:border-slate-500'}`}
				>
					<svelte:component this={cfg.icon} class="size-3" />
					{cfg.label}
				</button>
			{/each}
		</div>
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
	{:else if filteredPos.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/30 px-6 py-12 text-center space-y-2">
			<p class="text-slate-300 font-medium">No purchase orders match these filters</p>
			<p class="text-sm text-slate-500">Try broadening your search, status, year, or amount range.</p>
			<div>
				<button
					type="button"
					onclick={resetFilters}
					class="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors"
				>
					Clear Filters
				</button>
			</div>
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
					{#each filteredPos as po (po.id)}
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
