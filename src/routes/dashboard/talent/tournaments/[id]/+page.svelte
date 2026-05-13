<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { RotateCcw, Loader2, FileText, CheckCircle, ExternalLink, Users, ChevronDown, ChevronUp } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let showAddResultModal = $state(false);
	let clearingTestData   = $state(false);
	let generatingWO       = $state(false);
	let markingQb          = $state(false);
	let showQbForm         = $state(false);

	// Per-pro manager cut editing state: resultId → { editing, cutPct, saving }
	let mgrEdits = $state<Record<string, { editing: boolean; cutPct: number; saving: boolean }>>({});
	const getMgrEdit = (resultId: string, defaultPct: number) => {
		if (!mgrEdits[resultId]) mgrEdits[resultId] = { editing: false, cutPct: defaultPct, saving: false };
		return mgrEdits[resultId];
	};

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	const fmtFull = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

	const formatCurrency = fmt;

	// Group results by franchise
	const byFranchise = $derived(() => {
		const map = new Map<string, { franchiseId: string; franchiseName: string; results: any[] }>();
		for (const r of data.results) {
			const fid   = r.franchise ?? '__none__';
			const fname = r.expand?.franchise?.name ?? 'No Franchise';
			if (!map.has(fid)) map.set(fid, { franchiseId: fid, franchiseName: fname, results: [] });
			map.get(fid)!.results.push(r);
		}
		// Sort each franchise's results by placement
		for (const g of map.values()) g.results.sort((a, b) => a.placement - b.placement);
		// Sort franchises by total gross earnings desc
		return Array.from(map.values()).sort((a, b) => {
			const aTotal = a.results.reduce((s, r) => s + (r.proEarnings || 0), 0);
			const bTotal = b.results.reduce((s, r) => s + (r.proEarnings || 0), 0);
			return bTotal - aTotal;
		});
	});

	const totalProPayments = $derived(
		(data.proPayments ?? []).filter((p: any) => p.recipient === 'pro').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
	const totalMgrPayments = $derived(
		(data.proPayments ?? []).filter((p: any) => p.recipient === 'manager').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
	const totalPayments = $derived(totalProPayments + totalMgrPayments);
	const pendingCount  = $derived((data.proPayments ?? []).filter((p: any) => p.status === 'pending').length);
	const paidCount     = $derived((data.proPayments ?? []).filter((p: any) => p.status === 'paid').length);

	let expandedFranchise = $state<string | null>(null);
	let expandedPayout    = $state<number | null>(null);
	const toggleFranchise = (id: string) => expandedFranchise = expandedFranchise === id ? null : id;
	const togglePayout    = (n: number)  => expandedPayout    = expandedPayout    === n  ? null : n;

	const totalFranchiseCut = $derived(data.results.reduce((s: number, r: any) => s + (r.franchiseEarnings || 0), 0));
	const franchiseCutPct   = $derived(data.franchiseCutPercentage ?? 0);
	const noFranchiseCut    = $derived(franchiseCutPct === 0);

	// Payment lookup by tournamentResult id
	const paymentByResult = $derived(() => {
		const map: Record<string, { pro: any; mgr: any }> = {};
		for (const p of (data.proPayments ?? [])) {
			if (!p.tournamentResult) continue;
			if (!map[p.tournamentResult]) map[p.tournamentResult] = { pro: null, mgr: null };
			if (p.recipient === 'pro')     map[p.tournamentResult].pro = p;
			if (p.recipient === 'manager') map[p.tournamentResult].mgr = p;
		}
		return map;
	});

	const placementLabel = (n: number) =>
		n === 1 ? '🥇 1st' : n === 2 ? '🥈 2nd' : n === 3 ? '🥉 3rd' : `${n}${ordinal(n)}`;
	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return s[(v - 20) % 10] || s[v] || s[0];
	}
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{data.tournament.name}</h1>
			<p class="text-muted-foreground">
				Season {data.tournament.season} • Tournament #{data.tournament.tournamentNumber || 'N/A'}
			</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent/tournaments">← Back</Button>
			<Button onclick={() => (showAddResultModal = true)}>Add Result</Button>
		</div>
	</div>

	<!-- Tournament Details -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<h2 class="text-xl font-semibold mb-4 text-slate-100">Tournament Details</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div>
				<div class="text-sm text-muted-foreground">Dates</div>
				<div class="font-medium">
					{formatDate(data.tournament.startDate)} - {formatDate(data.tournament.endDate)}
				</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Location</div>
				<div class="font-medium">{data.tournament.location || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Venue</div>
				<div class="font-medium">{data.tournament.venue || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Status</div>
				<Badge
					class={data.tournament.status === 'completed'
						? 'bg-green-100 text-green-800'
						: data.tournament.status === 'in_progress'
							? 'bg-blue-100 text-blue-800'
							: 'bg-gray-100 text-gray-800'}
				>
					{data.tournament.status}
				</Badge>
			</div>
		</div>
	</div>

	<!-- Payout Structure -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-slate-100">Payout Structure</h2>
			{#if noFranchiseCut}
				<span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300">
					★ Season 1 — 100% to Pros · No Franchise Cut
				</span>
			{:else}
				<span class="text-xs text-slate-500">Franchise cut: {franchiseCutPct}%</span>
			{/if}
		</div>

		<!-- Summary cards -->
		<div class="grid grid-cols-2 {noFranchiseCut ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4 mb-6">
			<div class="text-center p-4 bg-blue-900/30 border border-blue-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Prize Pool</div>
				<div class="text-2xl font-bold text-blue-300">{formatCurrency(data.tournament.prizePool)}</div>
			</div>
			{#if !noFranchiseCut}
				<div class="text-center p-4 bg-purple-900/30 border border-purple-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Franchise Cut ({franchiseCutPct}%)</div>
					<div class="text-2xl font-bold text-purple-300">{formatCurrency(data.franchiseCut)}</div>
				</div>
				<div class="text-center p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Pro Cut ({100 - franchiseCutPct}%)</div>
					<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.proCut)}</div>
				</div>
			{:else}
				<div class="text-center p-4 bg-emerald-900/30 border border-emerald-600/60 rounded-lg col-span-1">
					<div class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Pro Cut (100%)</div>
					<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.proCut)}</div>
				</div>
			{/if}
			<div class="text-center p-4 bg-cyan-900/30 border border-cyan-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Men's Purse</div>
				<div class="text-2xl font-bold text-cyan-300">{formatCurrency(data.divisionPurse)}</div>
			</div>
			{#if !noFranchiseCut}
				<div class="text-center p-4 bg-pink-900/30 border border-pink-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Women's Purse</div>
					<div class="text-2xl font-bold text-pink-300">{formatCurrency(data.divisionPurse)}</div>
				</div>
			{/if}
		</div>

		<!-- Interactive placement payout accordion -->
		<div class="border-t border-slate-700 pt-4">
			<h3 class="font-semibold mb-3 text-slate-200">
				Placement Payouts — Per Division
				<span class="text-xs font-normal text-slate-400 ml-2">(click a row to see breakdown · every team gets a cheque)</span>
			</h3>
			<div class="space-y-1">
				{#each data.payoutStructure as payout}
					{@const isOpen = expandedPayout === payout.placement}
					{@const topThree = payout.placement <= 3}
					<div class="rounded-lg border {topThree ? 'border-slate-600' : 'border-slate-700/60'} overflow-hidden">
						<!-- Summary row -->
						<button
							type="button"
							onclick={() => togglePayout(payout.placement)}
							class="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-700/50 {topThree ? 'bg-slate-700/30' : 'bg-slate-800/30'} text-left"
						>
							<span class="font-semibold text-slate-200 w-20 shrink-0">{placementLabel(payout.placement)}</span>
							<div class="flex items-center gap-6 ml-auto">
								<span class="font-bold text-emerald-300">{formatCurrency(payout.amount)}</span>
								{#if !noFranchiseCut}
									<span class="text-xs text-purple-300 hidden sm:inline">Franchise: {formatCurrency(payout.franchiseAmount)}</span>
									<span class="text-xs text-slate-300 hidden sm:inline">Total: {formatCurrency(payout.totalAmount)}</span>
								{/if}
								<span class="text-slate-500 text-xs w-4">{isOpen ? '▲' : '▼'}</span>
							</div>
						</button>

						<!-- Expanded breakdown -->
						{#if isOpen}
							{@const resultAtPlacement = data.results.filter(r => r.placement === payout.placement)}
							<div class="border-t border-slate-700 px-4 py-3 bg-slate-800/60 space-y-2">
								<div class="flex flex-wrap gap-x-6 gap-y-1 text-xs">
									<span class="text-slate-400">Gross per division: <span class="text-emerald-300 font-semibold">{formatCurrency(payout.amount)}</span></span>
									{#if !noFranchiseCut}
										<span class="text-slate-400">Franchise cut: <span class="text-purple-300 font-semibold">−{formatCurrency(payout.franchiseAmount)}</span></span>
									{/if}
									<span class="text-slate-400">% of purse: <span class="text-blue-300 font-semibold">{((payout.amount / data.divisionPurse) * 100).toFixed(1)}%</span></span>
								</div>
								{#if resultAtPlacement.length > 0}
									<div class="flex flex-wrap gap-2 pt-1">
										{#each resultAtPlacement as r}
											<span class="text-xs px-2 py-0.5 rounded border border-slate-600 bg-slate-700/50 text-slate-300">
												{r.expand?.pro?.name ?? r.pro} · {r.expand?.franchise?.name ?? ''}
												{#if r.managerCutPercentage > 0}<span class="text-amber-400"> · {r.managerCutPercentage}% mgr</span>{/if}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}

				<!-- Totals row -->
				<div class="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-sm font-semibold mt-1">
					<span class="text-slate-300">Total</span>
					<div class="flex items-center gap-6">
						<span class="text-emerald-300">{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.amount, 0))}</span>
						{#if !noFranchiseCut}
							<span class="text-purple-300 hidden sm:inline">{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.franchiseAmount, 0))}</span>
							<span class="text-slate-100 hidden sm:inline">{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.totalAmount, 0))}</span>
						{/if}
						<span class="w-4"></span>
					</div>
				</div>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				* Amounts shown are per division (Men's and Women's each receive the same schedule).
				{#if noFranchiseCut}Season 1: franchise cut waived — pros receive 100% of the purse.{/if}
			</p>
		</div>
	</div>

	<!-- Results by Franchise -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
		<div class="border-b border-slate-700">
			<div class="flex items-center justify-between px-5 py-3">
				<p class="font-semibold text-slate-200 text-sm">Results by Franchise ({data.results.length})</p>
				<Button onclick={() => (showAddResultModal = true)} size="sm" variant="outline">+ Add Result</Button>
			</div>
		</div>

		{#if data.results.length === 0}
			<div class="text-center py-12 text-slate-500">No results yet. Add results to see payouts.</div>
		{:else}
			<div class="divide-y divide-slate-700/50">
				{#each byFranchise() as group}
					{@const groupTotal = group.results.reduce((s, r) => s + (r.proEarnings || 0), 0)}
					{@const groupMgr   = group.results.reduce((s, r) => s + (r.managerEarnings || 0), 0)}
					{@const groupNet   = groupTotal - groupMgr}
					{@const isOpen     = expandedFranchise === group.franchiseId}

					<div>
						<!-- Franchise header row -->
						<button type="button" onclick={() => toggleFranchise(group.franchiseId)}
							class="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-700/30 transition-colors text-left">
							<div class="flex items-center gap-3">
								<div class="size-8 rounded-lg bg-purple-900/50 border border-purple-700/50 flex items-center justify-center shrink-0">
									<span class="text-purple-300 text-xs font-black">{group.results.length}</span>
								</div>
								<div>
									<p class="font-bold text-white text-sm">{group.franchiseName}</p>
									<p class="text-xs text-slate-500">{group.results.length} pro{group.results.length !== 1 ? 's' : ''} · gross {fmt(groupTotal)}{groupMgr > 0 ? ` · mgr ${fmt(groupMgr)}` : ''}</p>
								</div>
							</div>
							<div class="flex items-center gap-4 shrink-0">
								<div class="text-right">
									<p class="font-bold text-emerald-300 text-sm">{fmt(groupNet)}</p>
									<p class="text-[10px] text-slate-500">net to pros</p>
								</div>
								<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="size-4 text-slate-500" />
							</div>
						</button>

						<!-- Per-pro rows -->
						{#if isOpen}
							<div class="bg-slate-900/40 divide-y divide-slate-800">
								{#each group.results as result}
									{@const payments = paymentByResult()[result.id] ?? { pro: null, mgr: null }}
									{@const gross    = result.proEarnings || 0}
									{@const mgrPct   = result.managerCutPercentage || 0}
									{@const mgrAmt   = result.managerEarnings || 0}
									{@const netAmt   = result.netProEarnings || gross}
									{@const edit     = getMgrEdit(result.id, mgrPct)}

									<div class="px-5 py-3">
										<div class="flex items-center gap-3 flex-wrap">
											<!-- Placement badge -->
											<span class="text-xs font-black w-8 text-center shrink-0 {result.placement <= 3 ? 'text-amber-400' : 'text-slate-500'}">
												#{result.placement}
											</span>

											<!-- Pro name + division -->
											<div class="flex-1 min-w-0">
												<p class="font-semibold text-slate-100 text-sm">{result.expand?.pro?.name || 'Unknown'}</p>
												<p class="text-xs text-slate-500">{result.division === 'womens' ? 'FPO' : 'MPO'}</p>
											</div>

											<!-- Earnings columns -->
											<div class="flex items-center gap-4 text-xs shrink-0">
												<div class="text-right">
													<p class="text-slate-400 text-[10px]">Gross</p>
													<p class="font-semibold text-slate-200">{fmt(gross)}</p>
												</div>
												{#if mgrPct > 0}
													<div class="text-right">
														<p class="text-amber-400 text-[10px]">Mgr {mgrPct}%</p>
														<p class="font-semibold text-amber-300">−{fmt(mgrAmt)}</p>
													</div>
												{/if}
												<div class="text-right">
													<p class="text-emerald-400 text-[10px]">Net</p>
													<p class="font-bold text-emerald-300">{fmt(netAmt)}</p>
												</div>
												<!-- Payment status -->
												{#if payments.pro}
													<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border
														{payments.pro.status === 'paid' ? 'text-emerald-400 border-emerald-700 bg-emerald-950/40' : 'text-amber-400 border-amber-700 bg-amber-950/40'}">
														{payments.pro.status}
													</span>
												{/if}

												<!-- Manager cut edit button -->
												<button type="button"
													onclick={() => { edit.editing = !edit.editing; edit.cutPct = mgrPct; }}
													class="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-semibold transition-colors
														{edit.editing ? 'border-amber-600 bg-amber-900/40 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-700'}">
													<Users class="size-3" />
													{mgrPct > 0 ? `${mgrPct}%` : 'Mgr'}
												</button>
											</div>
										</div>

										<!-- Manager cut editor (inline) -->
										{#if edit.editing}
											<div class="mt-2 ml-11 flex items-center gap-2 flex-wrap">
												<form method="POST" action="?/setManagerCut" use:enhance={() => {
													edit.saving = true;
													return async ({ update }) => { await update(); edit.saving = false; edit.editing = false; };
												}} class="flex items-center gap-2">
													<input type="hidden" name="proId"    value={result.pro} />
													<input type="hidden" name="resultId" value={result.id} />
													<label class="text-xs text-slate-400">Manager cut %</label>
													<input type="number" name="cutPct" min="0" max="50" step="1"
														value={edit.cutPct}
														oninput={(e) => { edit.cutPct = Number((e.target as HTMLInputElement).value); }}
														class="w-20 rounded border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1 text-sm text-center" />
													<button type="submit" disabled={edit.saving}
														class="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
														{#if edit.saving}<Loader2 class="size-3 animate-spin" />{:else}Apply{/if}
													</button>
													<button type="button" onclick={() => edit.editing = false}
														class="px-2 py-1 rounded border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors">Cancel</button>
												</form>
												{#if result.expand?.pro?.managerName}
													<span class="text-xs text-amber-400/70">{result.expand.pro.managerName}</span>
												{/if}
											</div>
										{/if}
									</div>
								{/each}

								<!-- Franchise subtotal -->
								<div class="px-5 py-2 flex items-center justify-between bg-slate-800/60 text-xs">
									<span class="text-slate-500 font-semibold uppercase tracking-wide">{group.franchiseName} subtotal</span>
									<div class="flex items-center gap-4">
										<span class="text-slate-400">Gross: <span class="text-slate-200 font-semibold">{fmt(groupTotal)}</span></span>
										{#if groupMgr > 0}<span class="text-slate-400">Mgr: <span class="text-amber-300 font-semibold">−{fmt(groupMgr)}</span></span>{/if}
										<span class="text-slate-400">Net: <span class="text-emerald-300 font-bold">{fmt(groupNet)}</span></span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Work Order & QuickBooks Panel -->
{#if data.results.length > 0}
<div class="container mx-auto px-6 pb-2">
	<div class="rounded-xl border {data.workOrder ? (data.workOrder.status === 'paid' ? 'border-emerald-700 bg-emerald-950/20' : 'border-blue-700 bg-blue-950/20') : 'border-slate-700 bg-slate-800/40'} overflow-hidden">

		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-4 gap-3 flex-wrap">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg flex items-center justify-center shrink-0
					{data.workOrder?.status === 'paid' ? 'bg-emerald-900/60 border border-emerald-700' : 'bg-blue-900/40 border border-blue-700'}">
					{#if data.workOrder?.status === 'paid'}
						<CheckCircle class="size-4 text-emerald-400" />
					{:else}
						<FileText class="size-4 text-blue-400" />
					{/if}
				</div>
				<div>
					<p class="font-bold text-white text-sm">
						{#if data.workOrder}
							Work Order <span class="font-mono text-blue-300">{data.workOrder.work_order_number}</span>
						{:else}
							Work Order
						{/if}
					</p>
					<p class="text-xs text-slate-500 mt-0.5">
						{#if data.workOrder}
							{fmt(data.workOrder.amount)} total · {data.workOrder.status}
							{#if data.workOrder.qb_entered_date} · QB entered {data.workOrder.qb_entered_date}{/if}
						{:else}
							{(data.proPayments ?? []).length} payment records ready · {fmt(totalPayments)} total
						{/if}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				{#if !data.workOrder}
					<!-- Generate WO -->
					<form method="POST" action="?/generateWorkOrder" use:enhance={() => {
						generatingWO = true;
						return async ({ update }) => { await update(); generatingWO = false; };
					}}>
						<button type="submit" disabled={generatingWO || (data.proPayments ?? []).length === 0}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
							{#if generatingWO}<Loader2 class="size-3.5 animate-spin" />{:else}<FileText class="size-3.5" />{/if}
							Generate Work Order
						</button>
					</form>
				{:else if data.workOrder.status !== 'paid'}
					<!-- Regenerate -->
					<form method="POST" action="?/generateWorkOrder" use:enhance={() => {
						generatingWO = true;
						return async ({ update }) => { await update(); generatingWO = false; };
					}}>
						<button type="submit" disabled={generatingWO}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50 text-slate-300 text-xs transition-colors">
							{#if generatingWO}<Loader2 class="size-3.5 animate-spin" />{:else}<RotateCcw class="size-3.5" />{/if}
							Refresh
						</button>
					</form>
					<!-- Mark QB entered -->
					<button type="button" onclick={() => showQbForm = !showQbForm}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors">
						<CheckCircle class="size-3.5" /> Mark QB Entered
					</button>
				{:else}
					<span class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
						<CheckCircle class="size-3.5" /> Entered in QuickBooks
					</span>
				{/if}
				<a href="/dashboard/work-orders" class="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 transition-colors" title="View all work orders">
					<ExternalLink class="size-3.5" />
				</a>
			</div>
		</div>

		<!-- Payment summary strip -->
		{#if (data.proPayments ?? []).length > 0}
			<div class="border-t border-slate-700/50 px-5 py-3 flex flex-wrap gap-5 text-xs bg-slate-900/30">
				<span class="text-slate-400">Pros: <span class="text-emerald-300 font-semibold">{fmt(totalProPayments)}</span></span>
				<span class="text-slate-400">Managers: <span class="text-amber-300 font-semibold">{fmt(totalMgrPayments)}</span></span>
				<span class="text-slate-400">Total: <span class="text-white font-bold">{fmt(totalPayments)}</span></span>
				<span class="text-slate-400 ml-auto">
					{#if pendingCount > 0}
						<span class="text-amber-400">{pendingCount} pending</span>
					{/if}
					{#if paidCount > 0}
						<span class="text-emerald-400 ml-2">{paidCount} paid</span>
					{/if}
				</span>
			</div>
		{/if}

		<!-- QB entry form -->
		{#if showQbForm && data.workOrder && data.workOrder.status !== 'paid'}
			<div class="border-t border-slate-700 px-5 py-4 bg-slate-900/60">
				<p class="text-xs font-semibold text-slate-300 mb-3">QuickBooks Entry Details</p>
				<form method="POST" action="?/markQbEntered" use:enhance={() => {
					markingQb = true;
					return async ({ update }) => { await update(); markingQb = false; showQbForm = false; };
				}} class="space-y-3">
					<input type="hidden" name="woId" value={data.workOrder.id} />
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label class="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">QB Account</label>
							<input type="text" name="qbAccount"
								value={data.workOrder.qb_account || 'Player Payouts'}
								class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm" />
						</div>
						<div>
							<label class="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">QB Notes</label>
							<input type="text" name="qbNotes"
								value={data.workOrder.qb_notes || ''}
								placeholder="Transaction reference, memo..."
								class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm" />
						</div>
					</div>
					<div class="flex items-center gap-2 justify-end">
						<button type="button" onclick={() => showQbForm = false}
							class="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors">Cancel</button>
						<button type="submit" disabled={markingQb}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
							{#if markingQb}<Loader2 class="size-3.5 animate-spin" />{:else}<CheckCircle class="size-3.5" />{/if}
							Confirm — Mark Paid & QB Entered
						</button>
					</div>
				</form>
			</div>
		{/if}

	</div>
</div>
{/if}

<!-- Testing Tools -->
{#if data.results.length > 0}
	<div class="container mx-auto px-6 pb-2">
		<details class="group rounded-xl border border-red-900/40 bg-red-950/10 overflow-hidden">
			<summary class="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-semibold text-red-400 hover:text-red-300 list-none select-none">
				<RotateCcw class="size-3.5" />
				Testing Tools
				<span class="text-red-700 font-normal ml-1">— clear seeded data for this tournament</span>
			</summary>
			<div class="px-4 pb-4 pt-1 border-t border-red-900/30">
				<p class="text-xs text-slate-500 mb-3">
					Deletes all {data.results.length} results, associated payments, and work orders for this tournament. Resets status to <span class="text-slate-400">scheduled</span>.
				</p>
				<form method="POST" action="?/clearTestData" use:enhance={() => {
					clearingTestData = true;
					return async ({ update }) => { await update(); clearingTestData = false; };
				}}>
					<button type="submit" disabled={clearingTestData}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 text-red-300 text-xs font-semibold transition-colors disabled:opacity-50">
						{#if clearingTestData}
							<Loader2 class="size-3.5 animate-spin" />
						{:else}
							<RotateCcw class="size-3.5" />
						{/if}
						Clear Test Data
					</button>
				</form>
			</div>
		</details>
	</div>
{/if}

<!-- Add Result Modal -->
{#if showAddResultModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
			<h2 class="text-2xl font-bold mb-4 text-slate-100">Add Tournament Result</h2>
			<form method="POST" action="?/addResult" use:enhance>
				<div class="space-y-4">
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Division *</label>
						<select name="division" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="mens">Men's</option>
							<option value="womens">Women's</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Pro *</label>
						<select name="pro" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">Select Pro</option>
							{#each data.pros as pro}
								<option value={pro.id}>{pro.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Franchise</label>
						<select name="franchise" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">None / Independent</option>
							{#each data.franchises as franchise}
								<option value={franchise.id}>{franchise.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Placement *</label>
						<input
							type="number"
							name="placement"
							required
							min="1"
							max="20"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Score</label>
						<input
							type="text"
							name="score"
							placeholder="e.g., -15"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Rounds</label>
						<input
							type="number"
							name="rounds"
							min="1"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Notes</label>
						<textarea name="notes" rows="2" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={() => (showAddResultModal = false)}>Cancel</Button>
					<Button type="submit">Add Result</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
