<script lang="ts">
	import type { PageData } from './$types';
	import {
		DollarSign, CheckCircle, Clock, TrendingUp, Users, FileText,
		ChevronDown, ChevronUp, History, AlertTriangle, Trophy, Wallet
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

	const fmtFull = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

	const statusColor = (s: string) =>
		s === 'paid'    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700' :
		s === 'pending' ? 'text-amber-400 bg-amber-950/40 border-amber-700' :
		                  'text-slate-400 bg-slate-800 border-slate-600';

	let expandedTournament = $state<string | null>(null);
	let expandedPro        = $state<string | null>(null);
	let expandedAudit      = $state<string | null>(null);

	const toggleT = (id: string) => expandedTournament = expandedTournament === id ? null : id;
	const toggleP = (id: string) => expandedPro        = expandedPro        === id ? null : id;
	const toggleA = (id: string) => expandedAudit      = expandedAudit      === id ? null : id;

	const s = data.seasonSummary;
</script>

<svelte:head><title>Payout Testing — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div class="flex items-start justify-between flex-wrap gap-3">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="size-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">2</span>
				<span class="text-xs font-bold text-emerald-400 uppercase tracking-wide">Phase 2 — Tournaments Live</span>
			</div>
			<h1 class="text-3xl font-bold">Payout Testing</h1>
			<p class="text-muted-foreground mt-1">Verify tournament results, payment math, manager splits, and work order generation</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<a href="/dashboard/talent/payments" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">
				Payments Page
			</a>
			<a href="/dashboard/talent/tournaments" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">
				Tournaments
			</a>
			<a href="/dashboard/work-orders" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1">
				<FileText class="size-3" /> Work Orders
			</a>
		</div>
	</div>

	<!-- Season summary strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
		{#each [
			{ label: 'Prize Pool',      value: fmt(s.totalPrizePool),        icon: Trophy,    color: 'border-slate-600',   ic: 'text-slate-400' },
			{ label: 'Payments Total',  value: fmt(s.totalPayments),         icon: DollarSign,color: 'border-slate-600',   ic: 'text-slate-400' },
			{ label: 'To Pros',         value: fmt(s.proPaymentTotal),       icon: TrendingUp,color: 'border-emerald-700', ic: 'text-emerald-400' },
			{ label: 'To Managers',     value: fmt(s.managerPaymentTotal),   icon: Users,     color: 'border-amber-700',   ic: 'text-amber-400' },
			{ label: 'Paid Out',        value: fmt(s.totalPaid),             icon: CheckCircle,color:'border-emerald-700', ic: 'text-emerald-400' },
			{ label: 'Pending',         value: fmt(s.totalPending),          icon: Clock,     color: 'border-amber-700',   ic: 'text-amber-400' },
			{ label: 'Work Orders',     value: s.workOrderCount,             icon: FileText,  color: 'border-blue-700',    ic: 'text-blue-400' },
			{ label: 'Audit Entries',   value: s.auditEntries,               icon: History,   color: 'border-slate-600',   ic: 'text-slate-400' },
		] as stat}
			<div class="rounded-xl border {stat.color} bg-slate-800/40 px-3 py-2.5">
				<svelte:component this={stat.icon} class="size-3.5 {stat.ic} mb-1" />
				<p class="text-base font-black text-white leading-tight">{stat.value}</p>
				<p class="text-[9px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Work Orders -->
	{#if data.workOrders.length > 0}
		<div>
			<p class="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
				<FileText class="size-3" /> Work Orders ({data.workOrders.length})
			</p>
			<div class="flex flex-wrap gap-2">
				{#each data.workOrders as wo}
					<div class="flex items-center gap-2 rounded-lg border border-blue-800/50 bg-blue-950/20 px-3 py-2 text-xs">
						<span class="font-mono font-bold text-blue-300">{wo.work_order_number}</span>
						<span class="text-slate-500">·</span>
						<span class="text-slate-300">{wo.projectName}</span>
						<span class="text-slate-500">·</span>
						<span class="font-semibold text-white">{fmt(wo.amount)}</span>
						<span class="text-[10px] uppercase px-1.5 py-0.5 rounded border {wo.status === 'paid' ? 'text-emerald-400 border-emerald-700' : 'text-amber-400 border-amber-700'}">{wo.status}</span>
						<span class="text-slate-600">{(wo.proPayment ?? []).length} payments</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Per-tournament breakdown -->
	{#if data.byTournament.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-12 text-center">
			<Trophy class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400 font-semibold">No tournament data yet</p>
			<p class="text-sm text-slate-500 mt-1">Run the seed script to populate test data:</p>
			<code class="text-xs text-emerald-400 mt-2 block">node scripts/seed-payout-scenario.mjs</code>
		</div>
	{/if}

	{#each data.byTournament as t}
		{@const isOpen = expandedTournament === t.tournament.id}
		{@const hasData = t.resultCount > 0}

		<div class="rounded-xl border {hasData ? 'border-slate-700' : 'border-slate-800'} overflow-hidden">

			<!-- Tournament header -->
			<button
				type="button"
				onclick={() => toggleT(t.tournament.id)}
				class="w-full flex items-center justify-between px-5 py-4 {hasData ? 'bg-slate-800/60 hover:bg-slate-800' : 'bg-slate-900/40'} transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="size-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
						<span class="text-xs font-black text-slate-300">#{t.tournament.tournamentNumber}</span>
					</div>
					<div>
						<p class="font-bold text-white">{t.tournament.name}</p>
						<p class="text-xs text-slate-500">{t.tournament.startDate} · Prize pool {fmt(t.tournament.prizePool)}</p>
					</div>
					<!-- Math check badge -->
					{#if hasData}
						{#if t.mathOk}
							<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 flex items-center gap-1">
								<CheckCircle class="size-3" /> Math OK
							</span>
						{:else}
							<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800 flex items-center gap-1">
								<AlertTriangle class="size-3" /> Math mismatch
							</span>
						{/if}
					{/if}
				</div>

				<div class="flex items-center gap-5 shrink-0">
					{#if hasData}
						<div class="text-right hidden sm:block">
							<p class="text-[10px] text-slate-500 uppercase tracking-wide">Results</p>
							<p class="text-sm font-bold text-white">{t.resultCount}</p>
						</div>
						<div class="text-right hidden sm:block">
							<p class="text-[10px] text-slate-500 uppercase tracking-wide">Payments</p>
							<p class="text-sm font-bold text-white">{t.paymentCount}</p>
						</div>
						<div class="text-right hidden md:block">
							<p class="text-[10px] text-slate-500 uppercase tracking-wide">Pending</p>
							<p class="text-sm font-bold text-amber-400">{fmt(t.totalPending)}</p>
						</div>
						<div class="text-right hidden md:block">
							<p class="text-[10px] text-slate-500 uppercase tracking-wide">Paid</p>
							<p class="text-sm font-bold text-emerald-400">{fmt(t.totalPaid)}</p>
						</div>
					{:else}
						<span class="text-xs text-slate-600 italic">No results seeded</span>
					{/if}
					<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="size-4 text-slate-500" />
				</div>
			</button>

			{#if isOpen && hasData}
				<div class="divide-y divide-slate-800">

					<!-- Math verification row -->
					<div class="px-5 py-3 bg-slate-900/60 flex items-center gap-4 flex-wrap text-xs">
						<span class="text-slate-500 uppercase tracking-wide font-semibold">Math Check</span>
						<span class="text-slate-400">Prize pool: <span class="text-white font-semibold">{fmtFull(t.tournament.prizePool)}</span></span>
						<span class="text-slate-600">→</span>
						<span class="text-slate-400">Payment sum: <span class="{t.mathOk ? 'text-emerald-400' : 'text-red-400'} font-semibold">{fmtFull(t.paymentSum)}</span></span>
						<span class="text-slate-600">→</span>
						<span class="text-slate-400">Diff: <span class="{Math.abs(t.paymentSum - t.tournament.prizePool) < 1 ? 'text-emerald-400' : 'text-red-400'} font-semibold">{fmtFull(t.paymentSum - t.tournament.prizePool)}</span></span>
						{#if t.wo}
							<span class="ml-auto font-mono text-blue-400 text-[10px]">{t.wo.work_order_number}</span>
						{/if}
					</div>

					<!-- Per-division results table -->
					{#each ['MPO', 'FPO'] as division}
						{@const divResults = t.results.filter((r: any) => r.division === division).sort((a: any, b: any) => a.placement - b.placement)}
						{#if divResults.length > 0}
							<div class="px-5 py-3 bg-slate-900/30">
								<p class="text-xs font-bold {division === 'MPO' ? 'text-blue-400' : 'text-pink-400'} uppercase tracking-wide mb-2">
									{division === 'MPO' ? 'Men\'s Division (MPO)' : 'Women\'s Division (FPO)'}
								</p>
								<div class="overflow-x-auto">
									<table class="w-full text-xs">
										<thead>
											<tr class="text-slate-500 border-b border-slate-800">
												<th class="text-left py-1.5 pr-4 font-medium">Place</th>
												<th class="text-left py-1.5 pr-4 font-medium">Pro</th>
												<th class="text-right py-1.5 pr-4 font-medium">Gross</th>
												<th class="text-right py-1.5 pr-4 font-medium">Mgr Cut</th>
												<th class="text-right py-1.5 pr-4 font-medium">Net to Pro</th>
												<th class="text-right py-1.5 pr-4 font-medium">Mgr Amount</th>
												<th class="text-right py-1.5 font-medium">Status</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-slate-800/50">
											{#each divResults as r}
												{@const proPayment = t.proPayments.find((p: any) => p.tournamentResult === r.id)}
												{@const mgrPayment = t.managerPayments.find((p: any) => p.tournamentResult === r.id)}
												<tr class="hover:bg-slate-800/30 transition-colors">
													<td class="py-1.5 pr-4">
														<span class="font-black {r.placement <= 3 ? 'text-amber-400' : 'text-slate-400'}">#{r.placement}</span>
													</td>
													<td class="py-1.5 pr-4">
														<span class="text-slate-200 font-medium">{r.expand?.pro?.name ?? r.pro}</span>
														{#if r.managerName}
															<span class="text-slate-500 ml-1">· {r.managerName}</span>
														{/if}
													</td>
													<td class="py-1.5 pr-4 text-right text-slate-300">{fmtFull(r.proEarnings ?? 0)}</td>
													<td class="py-1.5 pr-4 text-right">
														{#if r.managerName}
															<span class="text-amber-400">{r.managerCutPercentage ?? mgrPayment?.managerCutPercentage ?? 0}%</span>
														{:else}
															<span class="text-slate-600">—</span>
														{/if}
													</td>
													<td class="py-1.5 pr-4 text-right font-semibold text-emerald-300">{fmtFull(proPayment?.amount ?? 0)}</td>
													<td class="py-1.5 pr-4 text-right text-amber-300">{mgrPayment ? fmtFull(mgrPayment.amount) : '—'}</td>
													<td class="py-1.5 text-right">
														{#if proPayment}
															<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {statusColor(proPayment.status)}">{proPayment.status}</span>
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					{/each}

					<!-- Per-pro accordion (payments + audit) -->
					<div class="px-5 py-3 bg-slate-900/20">
						<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
							<Wallet class="size-3" /> Payment Records by Pro
						</p>
						<div class="space-y-1.5">
							{#each t.proBreakdown as pro}
								{@const proOpen = expandedPro === (t.tournament.id + pro.proId)}
								{@const allProPayments = [...pro.proPayments, ...pro.managerPayments]}
								<div class="rounded-lg border border-slate-700 overflow-hidden">
									<button
										type="button"
										onclick={() => toggleP(t.tournament.id + pro.proId)}
										class="w-full flex items-center justify-between px-3 py-2 bg-slate-800/40 hover:bg-slate-800 transition-colors text-left"
									>
										<div class="flex items-center gap-2">
											<span class="text-sm font-semibold text-slate-200">{pro.proName}</span>
											<span class="text-[10px] text-slate-500">{pro.division}</span>
											{#if pro.managerPayments.length > 0}
												<span class="text-[10px] text-amber-400 border border-amber-800 rounded px-1.5 py-0.5">
													{pro.managerPayments[0]?.managerName ?? 'Manager'}
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-3 text-xs">
											<span class="text-emerald-300 font-semibold">{fmt(pro.proPayments.reduce((s: number, p: any) => s + p.amount, 0))}</span>
											{#if pro.managerPayments.length > 0}
												<span class="text-amber-300">+{fmt(pro.managerPayments.reduce((s: number, p: any) => s + p.amount, 0))} mgr</span>
											{/if}
											<svelte:component this={proOpen ? ChevronUp : ChevronDown} class="size-3.5 text-slate-500" />
										</div>
									</button>
									{#if proOpen}
										<div class="px-3 py-2 bg-slate-900/60 space-y-1.5">
											{#each allProPayments as p}
												{@const auditOpen = expandedAudit === p.id}
												{@const auditEntries = data.auditByPayment[p.id] ?? []}
												<div class="rounded border {p.recipient === 'manager' ? 'border-amber-900/40 bg-amber-950/10' : 'border-slate-700 bg-slate-800/30'} overflow-hidden">
													<div class="flex items-center justify-between gap-2 px-3 py-1.5 flex-wrap">
														<div class="flex-1 min-w-0">
															<span class="text-xs font-medium {p.recipient === 'manager' ? 'text-amber-300' : 'text-slate-200'}">
																{p.recipient === 'manager' ? '↳ Manager cut' : 'Pro payment'}
															</span>
															<span class="text-[10px] text-slate-500 ml-2">{p.description}</span>
														</div>
														<div class="flex items-center gap-2 shrink-0">
															<span class="text-sm font-bold {p.recipient === 'manager' ? 'text-amber-300' : 'text-emerald-300'}">{fmtFull(p.amount)}</span>
															<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {statusColor(p.status)}">{p.status}</span>
															{#if auditEntries.length > 0}
																<button type="button" onclick={() => toggleA(p.id)}
																	class="p-0.5 rounded {auditOpen ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'} transition-colors"
																	title="{auditEntries.length} audit entries">
																	<History class="size-3.5" />
																</button>
															{/if}
														</div>
													</div>
													{#if auditOpen}
														<div class="border-t border-slate-700 px-3 py-1.5 bg-slate-900/80">
															{#each auditEntries as entry}
																<div class="flex items-center gap-2 text-[10px] text-slate-500 py-0.5">
																	<span class="font-mono shrink-0">{entry.changedAt?.slice(0, 16).replace('T', ' ')}</span>
																	<span>{entry.fromStatus || 'created'} → <span class="text-slate-300 font-semibold">{entry.toStatus}</span></span>
																	{#if entry.changedBy !== 'system' && entry.changedBy !== 'seed-script'}
																		<span>by {entry.changedBy}</span>
																	{:else}
																		<span class="text-slate-700">{entry.changedBy}</span>
																	{/if}
																	{#if entry.notes}<span class="text-slate-700 truncate">· {entry.notes}</span>{/if}
																</div>
															{/each}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

				</div>
			{/if}

		</div>
	{/each}

	<!-- Seed instructions -->
	<div class="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
		<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Seed / Reset Scripts</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
			<div class="space-y-1">
				<p class="text-slate-300 font-semibold">Seed full scenario (3 tournaments)</p>
				<code class="block bg-slate-800 rounded px-3 py-2 text-emerald-400 font-mono">node scripts/seed-payout-scenario.mjs</code>
				<p class="text-slate-600">Adds manager data to 8 pros, seeds results for tournaments #1–#3, creates pro + manager payments, work orders, and audit log entries.</p>
			</div>
			<div class="space-y-1">
				<p class="text-slate-300 font-semibold">Reset (wipe all payout data)</p>
				<code class="block bg-slate-800 rounded px-3 py-2 text-red-400 font-mono">node scripts/reset-payout-scenario.mjs</code>
				<p class="text-slate-600">Deletes all tournament_results, pro_payments, franchise_payouts, audit_log, and pro_payment work orders. Resets tournament statuses and clears manager data.</p>
			</div>
		</div>
	</div>

</div>
