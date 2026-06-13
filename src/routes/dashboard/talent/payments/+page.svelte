<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData } from './$types';
	import { DollarSign, Users, TrendingUp, Clock, CheckCircle, ChevronDown, ChevronUp, FileText, History } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

	const statusColor = (s: string) =>
		s === 'paid'    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700' :
		s === 'pending' ? 'text-amber-400 bg-amber-950/40 border-amber-700' :
		s === 'overdue' ? 'text-red-400 bg-red-950/40 border-red-700' :
		                  'text-slate-400 bg-slate-800 border-slate-600';

	const woStatusColor = (s: string) =>
		s === 'paid' ? 'text-emerald-400 border-emerald-700' :
		s === 'open' ? 'text-blue-400 border-blue-700' :
		               'text-slate-400 border-slate-600';

	let expandedGroup  = $state<string | null>(null);
	let expandedAudit  = $state<string | null>(null);

	const toggle      = (id: string) => expandedGroup = expandedGroup === id ? null : id;
	const toggleAudit = (id: string) => expandedAudit = expandedAudit === id ? null : id;

	const fmtDateTime = (iso: string) => {
		if (!iso) return '—';
		const d = new Date(iso);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
			+ ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	};
</script>

<svelte:head><title>Pro & Manager Payments — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-3xl font-bold">Pro & Manager Payments</h1>
			<p class="text-muted-foreground">Tournament earnings · per-pro breakdown · manager splits</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/dashboard/my-payments" class="text-xs px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800 transition-colors">
				Preview Manager Portal
			</a>
			<a href="/dashboard/talent" class="text-sm text-slate-400 hover:text-white transition-colors">← Back to Talent</a>
		</div>
	</div>

	<!-- Summary strip -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
		{#each [
			{ label: 'Total Gross',       value: fmt(data.summary.totalGross),     color: 'border-slate-600',   icon: DollarSign,  iconColor: 'text-slate-400' },
			{ label: 'Total to Pros',     value: fmt(data.summary.totalNet),       color: 'border-emerald-700', icon: TrendingUp,  iconColor: 'text-emerald-400' },
			{ label: 'Total to Managers', value: fmt(data.summary.totalManager),   color: 'border-amber-700',   icon: Users,       iconColor: 'text-amber-400' },
			{ label: 'Pending — Pros',    value: fmt(data.summary.pendingPro),     color: 'border-amber-700',   icon: Clock,       iconColor: 'text-amber-400' },
			{ label: 'Pending — Mgrs',    value: fmt(data.summary.pendingManager), color: 'border-amber-700',   icon: Clock,       iconColor: 'text-amber-400' },
			{ label: 'Payment Records',   value: data.summary.totalPayments,       color: 'border-slate-600',   icon: CheckCircle, iconColor: 'text-slate-400' },
		] as s}
			<div class="rounded-xl border {s.color} bg-slate-800/40 px-4 py-3">
				<svelte:component this={s.icon} class="size-4 {s.iconColor} mb-1" />
				<p class="text-lg font-black text-white">{s.value}</p>
				<p class="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
			</div>
		{/each}
	</div>

	<!-- Work Orders strip -->
	{#if data.workOrders && data.workOrders.length > 0}
		<div>
			<p class="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
				<FileText class="size-3" /> Work Orders
			</p>
			<div class="flex flex-wrap gap-2">
				{#each data.workOrders as wo}
					<a
						href="/dashboard/work-orders"
						class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-slate-800 {woStatusColor(wo.status)} bg-slate-800/40"
					>
						<span class="font-mono font-semibold">{wo.work_order_number}</span>
						<span class="text-slate-500">·</span>
						<span class="text-slate-300">{wo.projectName}</span>
						<span class="text-slate-500">·</span>
						<span class="font-semibold">{fmt(wo.amount)}</span>
						<span class="uppercase tracking-wide opacity-60 text-[10px]">{wo.status}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<form method="GET" class="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4">
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
			<div class="xl:col-span-2">
				<p class="text-xs text-slate-400 mb-1">Search</p>
				<input
					type="text"
					name="q"
					value={data.filterQuery}
					placeholder="Pro name, notes, transaction ID, method..."
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Status</p>
				<select name="status" class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
					<option value="">All</option>
					<option value="pending" selected={data.filterStatus === 'pending'}>Pending</option>
					<option value="paid" selected={data.filterStatus === 'paid'}>Paid</option>
					<option value="overdue" selected={data.filterStatus === 'overdue'}>Overdue</option>
				</select>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Recipient</p>
				<select name="recipient" class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
					<option value="">All</option>
					<option value="pro" selected={data.filterRecipient === 'pro'}>Pro</option>
					<option value="manager" selected={data.filterRecipient === 'manager'}>Manager</option>
				</select>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Season</p>
				<select name="season" class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
					<option value="">All Seasons</option>
					{#each data.seasons as s}
						<option value={s.id} selected={data.filterSeason === s.id}>{s.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Min Amount</p>
				<input
					type="number"
					name="minAmount"
					min="0"
					step="1"
					value={data.minAmount}
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Max Amount</p>
				<input
					type="number"
					name="maxAmount"
					min="0"
					step="1"
					value={data.maxAmount}
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">From Date</p>
				<input
					type="date"
					name="fromDate"
					value={data.fromDate}
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">To Date</p>
				<input
					type="date"
					name="toDate"
					value={data.toDate}
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
				/>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Sort By</p>
				<select name="sortBy" class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
					<option value="created" selected={data.sortBy === 'created'}>Created</option>
					<option value="dueDate" selected={data.sortBy === 'dueDate'}>Due Date</option>
					<option value="paymentDate" selected={data.sortBy === 'paymentDate'}>Payment Date</option>
					<option value="amount" selected={data.sortBy === 'amount'}>Amount</option>
					<option value="status" selected={data.sortBy === 'status'}>Status</option>
					<option value="recipient" selected={data.sortBy === 'recipient'}>Recipient</option>
					<option value="proName" selected={data.sortBy === 'proName'}>Pro Name</option>
				</select>
			</div>

			<div>
				<p class="text-xs text-slate-400 mb-1">Direction</p>
				<select name="sortDir" class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
					<option value="desc" selected={data.sortDir === 'desc'}>Descending</option>
					<option value="asc" selected={data.sortDir === 'asc'}>Ascending</option>
				</select>
			</div>
		</div>

		<div class="flex items-center gap-2 mt-4">
			<button type="submit" class="text-xs px-3 py-1.5 rounded-lg bg-orange-900/50 hover:bg-orange-800 text-orange-300 border border-orange-700 transition-colors font-semibold">
				Apply Filters
			</button>
			<a href="/dashboard/talent/payments" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-colors font-semibold">
				Reset
			</a>
		</div>
	</form>

	<!-- Per-pro groups -->
	{#if data.groups.length === 0}
		<Card class="p-12 text-center text-slate-400">
			No payment records yet. Add tournament results to auto-generate payments.
		</Card>
	{/if}

	{#each data.groups as group}
		{@const isOpen     = expandedGroup === group.pro.id}
		{@const hasManager = group.pro.managerName && group.pro.managerCutPercentage > 0}

		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<!-- Group header -->
			<button
				type="button"
				onclick={() => toggle(group.pro.id)}
				class="w-full flex items-center justify-between px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
			>
				<div>
					<p class="font-bold text-white text-base">{group.pro.name}</p>
					{#if hasManager}
						<p class="text-xs text-amber-400">Manager: {group.pro.managerName} · {group.pro.managerCutPercentage}% cut</p>
					{:else}
						<p class="text-xs text-slate-500">No manager</p>
					{/if}
				</div>
				<div class="flex items-center gap-6">
					<div class="text-right hidden sm:block">
						<p class="text-[10px] text-slate-500 uppercase tracking-wide">Pro net</p>
						<p class="text-sm font-bold text-emerald-300">{fmt(group.totalNet)}</p>
						{#if group.pendingPro > 0}
							<p class="text-[10px] text-amber-400">{fmt(group.pendingPro)} pending</p>
						{:else}
							<p class="text-[10px] text-emerald-500">All paid ✓</p>
						{/if}
					</div>
					{#if hasManager}
						<div class="text-right hidden sm:block">
							<p class="text-[10px] text-slate-500 uppercase tracking-wide">Manager</p>
							<p class="text-sm font-bold text-amber-300">{fmt(group.totalManager)}</p>
							{#if group.pendingManager > 0}
								<p class="text-[10px] text-amber-400">{fmt(group.pendingManager)} pending</p>
							{:else}
								<p class="text-[10px] text-emerald-500">All paid ✓</p>
							{/if}
						</div>
					{/if}
					<div class="text-right hidden lg:block">
						<p class="text-[10px] text-slate-500 uppercase tracking-wide">Gross</p>
						<p class="text-sm font-bold text-slate-300">{fmt(group.totalGross)}</p>
					</div>
					<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="size-4 text-slate-500 shrink-0" />
				</div>
			</button>

			<!-- Expanded rows -->
			{#if isOpen}
				<div class="divide-y divide-slate-800">

					<!-- Pro payments -->
					{#if group.proPayments.length > 0}
						<div class="px-5 py-3 bg-slate-900/40">
							<p class="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Pro Payments — {group.pro.name}</p>
							<div class="space-y-2">
								{#each group.proPayments as p}
									{@const auditOpen = expandedAudit === p.id}
									<div class="rounded-lg bg-slate-800/60 border border-slate-700 overflow-hidden">
										<div class="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
											<div class="flex-1 min-w-0">
												<p class="text-sm text-slate-200 font-medium truncate">{p.description || p.expand?.tournament?.name || 'Payment'}</p>
												<div class="flex items-center gap-2 flex-wrap mt-0.5">
													<p class="text-xs text-slate-500">
														Due: {p.dueDate || '—'}
														{#if p.paidAt} · Paid: {p.paidAt}{/if}
														{#if p.paymentMethod} · {p.paymentMethod}{/if}
													</p>
													{#if p._workOrder}
														<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border {woStatusColor(p._workOrder.status)} bg-slate-900/40">
															{p._workOrder.work_order_number}
														</span>
													{/if}
												</div>
											</div>
											<div class="flex items-center gap-2 shrink-0">
												<div class="text-right">
													<p class="text-sm font-bold text-emerald-300">{fmt(p.amount)}</p>
													{#if p.grossAmount && p.grossAmount !== p.amount}
														<p class="text-[10px] text-slate-500">Gross: {fmt(p.grossAmount)}</p>
													{/if}
												</div>
												<span class="text-[10px] font-semibold px-2 py-0.5 rounded border {statusColor(p.status)}">{p.status}</span>
												{#if p._auditLog?.length > 0}
													<button type="button" onclick={() => toggleAudit(p.id)}
														class="p-1 rounded transition-colors {auditOpen ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}"
														title="{p._auditLog.length} audit entries">
														<History class="size-3.5" />
													</button>
												{/if}
												{#if p.status !== 'paid'}
													<form method="POST" action="?/markPaid" use:enhance>
														<input type="hidden" name="id" value={p.id} />
														<button type="submit" class="text-xs px-2.5 py-1 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 transition-colors">Mark Paid</button>
													</form>
												{:else}
													<form method="POST" action="?/markPending" use:enhance>
														<input type="hidden" name="id" value={p.id} />
														<button type="submit" class="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 border border-slate-600 transition-colors">Undo</button>
													</form>
												{/if}
											</div>
										</div>
										{#if auditOpen}
											<div class="border-t border-slate-700 bg-slate-900/70 px-4 py-2.5">
												<p class="text-[10px] text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
													<History class="size-3" /> Audit Trail
												</p>
												<div class="space-y-1.5">
													{#each p._auditLog as entry}
														<div class="flex items-start gap-3 text-xs">
															<span class="text-slate-600 font-mono text-[10px] shrink-0 pt-0.5">{fmtDateTime(entry.changedAt)}</span>
															<span class="shrink-0">
																<span class="text-slate-500">{entry.fromStatus || 'created'}</span>
																<span class="text-slate-600 mx-1">→</span>
																<span class="{entry.toStatus === 'paid' ? 'text-emerald-400' : entry.toStatus === 'pending' ? 'text-amber-400' : 'text-slate-300'} font-semibold">{entry.toStatus}</span>
															</span>
															{#if entry.changedBy && entry.changedBy !== 'system'}
																<span class="text-slate-500">by {entry.changedBy}</span>
															{/if}
															{#if entry.notes}
																<span class="text-slate-600 truncate">· {entry.notes}</span>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Manager payments -->
					{#if group.managerPayments.length > 0}
						<div class="px-5 py-3 bg-slate-900/20">
							<p class="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
								Manager Payments — {group.pro.managerName}
								{#if group.pro.managerEmail}<span class="text-slate-500 normal-case font-normal">· {group.pro.managerEmail}</span>{/if}
							</p>
							<div class="space-y-2">
								{#each group.managerPayments as p}
									{@const auditOpen = expandedAudit === p.id}
									<div class="rounded-lg bg-amber-950/20 border border-amber-900/40 overflow-hidden">
										<div class="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap">
											<div class="flex-1 min-w-0">
												<p class="text-sm text-slate-200 font-medium truncate">{p.description || p.expand?.tournament?.name || 'Manager cut'}</p>
												<div class="flex items-center gap-2 flex-wrap mt-0.5">
													<p class="text-xs text-slate-500">
														{p.managerCutPercentage}% of {fmt(p.grossAmount ?? 0)}
														· Due: {p.dueDate || '—'}
														{#if p.paidAt} · Paid: {p.paidAt}{/if}
													</p>
													{#if p._workOrder}
														<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border {woStatusColor(p._workOrder.status)} bg-slate-900/40">
															{p._workOrder.work_order_number}
														</span>
													{/if}
												</div>
											</div>
											<div class="flex items-center gap-2 shrink-0">
												<p class="text-sm font-bold text-amber-300">{fmt(p.amount)}</p>
												<span class="text-[10px] font-semibold px-2 py-0.5 rounded border {statusColor(p.status)}">{p.status}</span>
												{#if p._auditLog?.length > 0}
													<button type="button" onclick={() => toggleAudit(p.id)}
														class="p-1 rounded transition-colors {auditOpen ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}"
														title="{p._auditLog.length} audit entries">
														<History class="size-3.5" />
													</button>
												{/if}
												{#if p.status !== 'paid'}
													<form method="POST" action="?/markPaid" use:enhance>
														<input type="hidden" name="id" value={p.id} />
														<button type="submit" class="text-xs px-2.5 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-800 text-amber-300 border border-amber-700 transition-colors">Mark Paid</button>
													</form>
												{:else}
													<form method="POST" action="?/markPending" use:enhance>
														<input type="hidden" name="id" value={p.id} />
														<button type="submit" class="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 border border-slate-600 transition-colors">Undo</button>
													</form>
												{/if}
											</div>
										</div>
										{#if auditOpen}
											<div class="border-t border-amber-900/30 bg-slate-900/70 px-4 py-2.5">
												<p class="text-[10px] text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
													<History class="size-3" /> Audit Trail
												</p>
												<div class="space-y-1.5">
													{#each p._auditLog as entry}
														<div class="flex items-start gap-3 text-xs">
															<span class="text-slate-600 font-mono text-[10px] shrink-0 pt-0.5">{fmtDateTime(entry.changedAt)}</span>
															<span class="shrink-0">
																<span class="text-slate-500">{entry.fromStatus || 'created'}</span>
																<span class="text-slate-600 mx-1">→</span>
																<span class="{entry.toStatus === 'paid' ? 'text-emerald-400' : entry.toStatus === 'pending' ? 'text-amber-400' : 'text-slate-300'} font-semibold">{entry.toStatus}</span>
															</span>
															{#if entry.changedBy && entry.changedBy !== 'system'}
																<span class="text-slate-500">by {entry.changedBy}</span>
															{/if}
															{#if entry.notes}
																<span class="text-slate-600 truncate">· {entry.notes}</span>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if hasManager}
						<div class="px-5 py-3 bg-slate-900/20">
							<p class="text-xs text-slate-500 italic">No manager payment records yet for {group.pro.managerName}.</p>
						</div>
					{/if}

					<!-- Mark all pending -->
					{#if group.pendingPro > 0 || group.pendingManager > 0}
						<div class="px-5 py-3 bg-slate-900/60 flex items-center justify-between flex-wrap gap-2">
							<p class="text-xs text-slate-400">
								{fmt(group.pendingPro + group.pendingManager)} total pending for {group.pro.name}
								{#if hasManager} + {group.pro.managerName}{/if}
							</p>
							<form method="POST" action="?/markPaid" use:enhance>
								<input type="hidden" name="ids" value={[...group.proPayments, ...group.managerPayments].filter(p => p.status === 'pending').map(p => p.id).join(',')} />
								<button type="submit" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 transition-colors font-semibold">
									Mark All Paid
								</button>
							</form>
						</div>
					{/if}

				</div>
			{/if}
		</div>
	{/each}

</div>
