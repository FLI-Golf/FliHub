<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import {
		DollarSign, CheckCircle, Clock, TrendingUp, Users, FileText,
		ChevronDown, ChevronUp, History, AlertTriangle, Trophy, Wallet,
		Play, RotateCcw, ArrowRight, Loader2
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

	let loading = $state<Record<string, string>>({});
	const setLoading = (tid: string, action: string) => { loading = { ...loading, [tid]: action }; };
	const clearLoading = (tid: string) => { const l = { ...loading }; delete l[tid]; loading = l; };

	let expandedTournament = $state<string | null>(null);
	let expandedPro        = $state<string | null>(null);
	let expandedAudit      = $state<string | null>(null);

	const toggleT = (id: string) => expandedTournament = expandedTournament === id ? null : id;
	const toggleP = (id: string) => expandedPro        = expandedPro        === id ? null : id;
	const toggleA = (id: string) => expandedAudit      = expandedAudit      === id ? null : id;

	const s = $derived(data.seasonSummary);

	function getTournamentStep(t: typeof data.byTournament[0]): 'seed' | 'pay-pros' | 'pay-managers' | 'done' {
		if (t.resultCount === 0) return 'seed';
		if (t.paymentCount === 0) return 'seed'; // results exist but no payments yet (shouldn't happen, but guard)
		if (t.pendingProCount > 0) return 'pay-pros';
		if (t.pendingMgrCount > 0) return 'pay-managers';
		return 'done';
	}

	const allDone = $derived(data.byTournament.length > 0 && data.byTournament.every(t => getTournamentStep(t) === 'done'));
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
			<p class="text-muted-foreground mt-1">Seed results → pay pros → pay managers → verify math</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<a href="/dashboard/talent/payments" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Payments</a>
			<a href="/dashboard/talent/tournaments" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors">Tournaments</a>
			<a href="/dashboard/work-orders" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1">
				<FileText class="size-3" /> Work Orders
			</a>
		</div>
	</div>

	<!-- Season summary strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
		{#each [
			{ label: 'Prize Pool',    value: fmt(s.totalPrizePool),        icon: Trophy,     color: 'border-slate-600',   ic: 'text-slate-400'   },
			{ label: 'Payments',      value: fmt(s.totalPayments),         icon: DollarSign, color: 'border-slate-600',   ic: 'text-slate-400'   },
			{ label: 'To Pros',       value: fmt(s.proPaymentTotal),       icon: TrendingUp, color: 'border-emerald-700', ic: 'text-emerald-400' },
			{ label: 'To Managers',   value: fmt(s.managerPaymentTotal),   icon: Users,      color: 'border-amber-700',   ic: 'text-amber-400'   },
			{ label: 'Paid Out',      value: fmt(s.totalPaid),             icon: CheckCircle,color: 'border-emerald-700', ic: 'text-emerald-400' },
			{ label: 'Pending',       value: fmt(s.totalPending),          icon: Clock,      color: 'border-amber-700',   ic: 'text-amber-400'   },
			{ label: 'Work Orders',   value: s.workOrderCount,             icon: FileText,   color: 'border-blue-700',    ic: 'text-blue-400'    },
			{ label: 'Audit Entries', value: s.auditEntries,               icon: History,    color: 'border-slate-600',   ic: 'text-slate-400'   },
		] as stat}
			<div class="rounded-xl border {stat.color} bg-slate-800/40 px-3 py-2.5">
				<svelte:component this={stat.icon} class="size-3.5 {stat.ic} mb-1" />
				<p class="text-base font-black text-white leading-tight">{stat.value}</p>
				<p class="text-[9px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- All done banner -->
	{#if allDone}
		<div class="rounded-xl border border-emerald-700 bg-emerald-950/30 px-5 py-4 flex items-center gap-3">
			<CheckCircle class="size-5 text-emerald-400 shrink-0" />
			<div>
				<p class="font-bold text-emerald-300">All tournaments paid out</p>
				<p class="text-xs text-emerald-600 mt-0.5">{fmt(s.totalPaid)} distributed · {s.paymentRecords} payment records · {s.workOrderCount} work orders · {s.auditEntries} audit entries</p>
			</div>
		</div>
	{/if}

	<!-- Per-tournament cards -->
	{#each data.byTournament as t}
		{@const step = getTournamentStep(t)}
		{@const isOpen = expandedTournament === t.tournament.id}
		{@const tid = t.tournament.id}
		{@const busy = loading[tid]}

		<div class="rounded-xl border {step === 'done' ? 'border-emerald-800/50' : step === 'seed' ? 'border-slate-700' : 'border-amber-800/50'} overflow-hidden">

			<!-- Header row -->
			<div class="flex items-center gap-3 px-5 py-4 bg-slate-800/60">
				<div class="size-9 rounded-lg shrink-0 flex items-center justify-center
					{step === 'done' ? 'bg-emerald-900/60 border border-emerald-700' :
					 step === 'seed' ? 'bg-slate-700 border border-slate-600' :
					 'bg-amber-900/40 border border-amber-700'}">
					{#if step === 'done'}
						<CheckCircle class="size-4 text-emerald-400" />
					{:else if step === 'seed'}
						<Trophy class="size-4 text-slate-400" />
					{:else}
						<DollarSign class="size-4 text-amber-400" />
					{/if}
				</div>

				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 flex-wrap">
						<p class="font-bold text-white">{t.tournament.name}</p>
						<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border
							{step === 'done'          ? 'text-emerald-400 border-emerald-700 bg-emerald-950/40' :
							 step === 'seed'          ? 'text-slate-400 border-slate-600 bg-slate-800' :
							 step === 'pay-pros'      ? 'text-amber-400 border-amber-700 bg-amber-950/40' :
							                           'text-orange-400 border-orange-700 bg-orange-950/40'}">
							{step === 'done' ? 'Complete' : step === 'seed' ? 'Not seeded' : step === 'pay-pros' ? 'Pros pending' : 'Managers pending'}
						</span>
						{#if t.paymentCount > 0}
						{#if t.mathOk}
							<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border text-emerald-400 border-emerald-800 bg-emerald-950/30 flex items-center gap-1">
								<CheckCircle class="size-2.5" /> Math OK
							</span>
						{:else}
							<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border text-red-400 border-red-800 bg-red-950/30 flex items-center gap-1">
								<AlertTriangle class="size-2.5" /> Math mismatch
							</span>
						{/if}
					{/if}
					</div>
					<p class="text-xs text-slate-500 mt-0.5">
						#{t.tournament.tournamentNumber} · {t.tournament.startDate?.slice(0, 10)} · {fmt(t.tournament.prizePool)} pool
						{#if t.resultCount > 0} · {t.resultCount} results · {t.paymentCount} payments{/if}
					</p>
				</div>

				<div class="flex items-center gap-2 shrink-0">
					{#if step === 'seed'}
						<form method="POST" action="?/seedTournament" use:enhance={() => {
							setLoading(tid, 'seed');
							return async ({ update }) => { await update(); clearLoading(tid); };
						}}>
							<input type="hidden" name="tournamentId" value={tid} />
							<button type="submit" disabled={!!busy}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
								{#if busy === 'seed'}<Loader2 class="size-3.5 animate-spin" />{:else}<Play class="size-3.5" />{/if}
								Seed Results
							</button>
						</form>
					{:else if step === 'pay-pros'}
						<form method="POST" action="?/markProsPaid" use:enhance={() => {
							setLoading(tid, 'pros');
							return async ({ update }) => { await update(); clearLoading(tid); };
						}}>
							<input type="hidden" name="tournamentId" value={tid} />
							<button type="submit" disabled={!!busy}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
								{#if busy === 'pros'}<Loader2 class="size-3.5 animate-spin" />{:else}<CheckCircle class="size-3.5" />{/if}
								Pay {t.pendingProCount} Pros
							</button>
						</form>
					{:else if step === 'pay-managers'}
						<form method="POST" action="?/markManagersPaid" use:enhance={() => {
							setLoading(tid, 'mgrs');
							return async ({ update }) => { await update(); clearLoading(tid); };
						}}>
							<input type="hidden" name="tournamentId" value={tid} />
							<button type="submit" disabled={!!busy}
								class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
								{#if busy === 'mgrs'}<Loader2 class="size-3.5 animate-spin" />{:else}<Users class="size-3.5" />{/if}
								Pay {t.pendingMgrCount} Managers
							</button>
						</form>
					{/if}

					{#if t.resultCount > 0}
						<form method="POST" action="?/resetTournament" use:enhance={() => {
							setLoading(tid, 'reset');
							return async ({ update }) => { await update(); clearLoading(tid); };
						}}>
							<input type="hidden" name="tournamentId" value={tid} />
							<button type="submit" disabled={!!busy}
								class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-red-900/60 border border-slate-600 hover:border-red-700 disabled:opacity-50 text-slate-400 hover:text-red-400 text-xs transition-colors"
								title="Reset this tournament">
								{#if busy === 'reset'}<Loader2 class="size-3.5 animate-spin" />{:else}<RotateCcw class="size-3.5" />{/if}
							</button>
						</form>

						<button type="button" onclick={() => toggleT(tid)}
							class="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 transition-colors">
							<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="size-4" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Progress bar -->
			{#if t.paymentCount > 0}
				{@const paidPct = t.totalPaid + t.totalPending > 0 ? Math.round((t.totalPaid / (t.totalPaid + t.totalPending)) * 100) : 0}
				<div class="h-1 bg-slate-800">
					<div class="h-full bg-emerald-500 transition-all duration-500" style="width: {paidPct}%"></div>
				</div>
			{/if}

			<!-- Expanded detail -->
			{#if isOpen && t.resultCount > 0}
				<div class="divide-y divide-slate-800">

					<!-- Math check -->
					<div class="px-5 py-3 bg-slate-900/60 flex items-center gap-3 flex-wrap text-xs">
						<span class="text-slate-500 uppercase tracking-wide font-semibold">Math Check</span>
						<span class="text-slate-400">Pool: <span class="text-white font-semibold">{fmtFull(t.tournament.prizePool)}</span></span>
						<ArrowRight class="size-3 text-slate-600" />
						<span class="text-slate-400">Payments: <span class="{t.mathOk ? 'text-emerald-400' : 'text-red-400'} font-semibold">{fmtFull(t.paymentSum)}</span></span>
						<ArrowRight class="size-3 text-slate-600" />
						<span class="text-slate-400">Diff: <span class="{t.mathOk ? 'text-emerald-400' : 'text-red-400'} font-semibold">{fmtFull(t.paymentSum - t.tournament.prizePool)}</span></span>
						{#if t.wo}
							<span class="ml-auto font-mono text-blue-400 text-[10px] border border-blue-800 rounded px-1.5 py-0.5">{t.wo.work_order_number}</span>
						{/if}
					</div>

					<!-- Results by franchise -->
					{#each t.byFranchise as group}
						{@const groupGross = group.rows.reduce((s: number, r: any) => s + (r.proEarnings || 0), 0)}
						{@const groupMgr   = group.rows.reduce((s: number, r: any) => s + (r.managerEarnings || 0), 0)}
						{@const groupNet   = groupGross - groupMgr}
						<div class="border-t border-slate-800">
							<!-- Franchise header -->
							<div class="px-5 py-2 bg-slate-900/50 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="size-5 rounded bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-[9px] font-black text-purple-300">{group.rows.length}</span>
									<span class="text-xs font-bold text-purple-300">{group.franchiseName}</span>
								</div>
								<div class="flex items-center gap-4 text-xs">
									<span class="text-slate-500">Gross <span class="text-slate-300 font-semibold">{fmt(groupGross)}</span></span>
									{#if groupMgr > 0}<span class="text-slate-500">Mgr <span class="text-amber-300">−{fmt(groupMgr)}</span></span>{/if}
									<span class="text-slate-500">Net <span class="text-emerald-300 font-bold">{fmt(groupNet)}</span></span>
								</div>
							</div>
							<!-- Pro rows -->
							<div class="overflow-x-auto">
								<table class="w-full text-xs">
									<tbody class="divide-y divide-slate-800/40">
										{#each group.rows as row}
											<tr class="hover:bg-slate-800/20 transition-colors">
												<td class="py-1.5 pl-5 pr-3 font-black w-10 {row.placement <= 3 ? 'text-amber-400' : 'text-slate-600'}">#{row.placement}</td>
												<td class="py-1.5 pr-3">
													<span class="text-slate-200 font-medium">{row.proName}</span>
													<span class="text-slate-600 ml-1.5 text-[10px]">{row.division}</span>
												</td>
												<td class="py-1.5 pr-3 text-right text-slate-300">{fmtFull(row.proEarnings)}</td>
												<td class="py-1.5 pr-3 text-right">
													{#if row.managerCutPercentage > 0}
														<span class="text-amber-400">{row.managerCutPercentage}%</span>
													{:else}
														<span class="text-slate-700">—</span>
													{/if}
												</td>
												<td class="py-1.5 pr-3 text-right font-semibold text-emerald-300">{fmtFull(row.netProEarnings)}</td>
												<td class="py-1.5 pr-3 text-right text-amber-300">{row.mgrPayment ? fmtFull(row.mgrPayment.amount) : '—'}</td>
												<td class="py-1.5 pr-5 text-right">
													{#if row.proPayment}
														<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border {statusColor(row.proPayment.status)}">{row.proPayment.status}</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/each}

					<!-- Payment records accordion -->
					<div class="px-5 py-3 bg-slate-900/20">
						<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
							<Wallet class="size-3" /> Payment Records
						</p>
						<div class="space-y-1.5">
							{#each t.proBreakdown as pro}
								{@const proKey = tid + pro.resultId}
								{@const proOpen = expandedPro === proKey}
								{@const allProPayments = [pro.proPayment, pro.mgrPayment].filter(Boolean)}
								{#if allProPayments.length > 0}
									<div class="rounded-lg border border-slate-700 overflow-hidden">
										<button type="button" onclick={() => toggleP(proKey)}
											class="w-full flex items-center justify-between px-3 py-2 bg-slate-800/40 hover:bg-slate-800 transition-colors text-left">
											<div class="flex items-center gap-2">
												<span class="text-sm font-semibold text-slate-200">{pro.proName}</span>
												<span class="text-[10px] text-slate-500">{pro.division}</span>
												{#if pro.managerName}
													<span class="text-[10px] text-amber-400 border border-amber-800 rounded px-1.5 py-0.5">{pro.managerName}</span>
												{/if}
											</div>
											<div class="flex items-center gap-3 text-xs">
												{#if pro.proPayment}<span class="text-emerald-300 font-semibold">{fmt(pro.proPayment.amount)}</span>{/if}
												{#if pro.mgrPayment}<span class="text-amber-300">+{fmt(pro.mgrPayment.amount)} mgr</span>{/if}
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
																<span class="text-[10px] text-slate-500 ml-2 truncate">{p.description}</span>
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
																		<span class="text-slate-700">{entry.changedBy}</span>
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
								{/if}
							{/each}
						</div>
					</div>

				</div>
			{/if}
		</div>
	{/each}

	<!-- Work orders -->
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
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>
