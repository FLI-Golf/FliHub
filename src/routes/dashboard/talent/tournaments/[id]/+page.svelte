<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddResultModal = $state(false);
	let selectedDivision = $state<'mens' | 'womens'>('mens');
	let expandedResult = $state<string | null>(null);
	const toggleResult = (id: string) => expandedResult = expandedResult === id ? null : id;

	let expandedPayout = $state<number | null>(null);
	const togglePayout = (n: number) => expandedPayout = expandedPayout === n ? null : n;

	// Manager overlay — user-adjustable cut % applied to the payout table preview
	let managerOverlayOn  = $state(false);
	let managerOverlayCut = $state(15);
	const applyMgr = (gross: number) => managerOverlayOn
		? { gross, mgr: Math.round(gross * (managerOverlayCut / 100)), net: Math.round(gross * (1 - managerOverlayCut / 100)) }
		: { gross, mgr: 0, net: gross };

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	const mensResults = $derived(
		data.results.filter((r) => r.division === 'mens').sort((a, b) => a.placement - b.placement)
	);
	const womensResults = $derived(
		data.results.filter((r) => r.division === 'womens').sort((a, b) => a.placement - b.placement)
	);

	const totalMensPaid    = $derived(mensResults.reduce((s, r) => s + (r.proEarnings || 0), 0));
	const totalWomensPaid  = $derived(womensResults.reduce((s, r) => s + (r.proEarnings || 0), 0));
	const totalFranchiseCut = $derived(data.results.reduce((s, r) => s + (r.franchiseEarnings || 0), 0));

	const franchiseCutPct = $derived(data.franchiseCutPercentage ?? 0);
	const noFranchiseCut  = $derived(franchiseCutPct === 0);

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
							{@const mens   = mensResults.find(r => r.placement === payout.placement) ?? null}
							{@const womens = womensResults.find(r => r.placement === payout.placement) ?? null}
							{@const mMgr   = applyMgr(payout.amount)}
							<div class="border-t border-slate-700 px-4 py-4 bg-slate-800/60 space-y-4">

								<!-- Header row: label + manager toggle -->
								<div class="flex items-center justify-between flex-wrap gap-2">
									<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Breakdown — {placementLabel(payout.placement)}</p>
									<div class="flex items-center gap-2">
										<span class="text-xs text-slate-400">Manager overlay</span>
										<button
											type="button"
											onclick={() => managerOverlayOn = !managerOverlayOn}
											class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors {managerOverlayOn ? 'bg-amber-500' : 'bg-slate-600'}"
										>
											<span class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {managerOverlayOn ? 'translate-x-4' : 'translate-x-0'}"></span>
										</button>
										{#if managerOverlayOn}
											<div class="flex items-center gap-1">
												<input
													type="number"
													min="1" max="50" step="1"
													bind:value={managerOverlayCut}
													class="w-12 rounded bg-slate-700 border border-slate-600 px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
												/>
												<span class="text-xs text-slate-400">%</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Men's / Women's side-by-side columns -->
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{#each [
										{ label: "Men's Division", result: mens, accent: 'cyan', border: 'border-cyan-800/40', bg: 'bg-cyan-950/20' },
										{ label: "Women's Division", result: womens, accent: 'pink', border: 'border-pink-800/40', bg: 'bg-pink-950/20' },
									] as div}
										<div class="rounded-xl border {div.border} {div.bg} px-4 py-3 space-y-3">
											<p class="text-xs font-bold text-{div.accent}-400 uppercase tracking-wide">{div.label}</p>

											{#if div.result}
												<div class="text-sm text-slate-300 font-semibold">{div.result.expand?.pro?.name || 'Unknown'}</div>
												{#if div.result.expand?.franchise}
													<div class="text-xs text-slate-500">{div.result.expand.franchise.name}</div>
												{/if}
											{:else}
												<div class="space-y-1.5">
													<div class="text-xs text-slate-500 italic">No result entered</div>
													<div class="flex gap-1.5 flex-wrap">
														{#each [10, 15, 20] as pct}
															<button
																type="button"
																onclick={() => { managerOverlayOn = true; managerOverlayCut = pct; }}
																class="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors {managerOverlayOn && managerOverlayCut === pct ? 'bg-amber-500 border-amber-400 text-white' : 'bg-amber-950/40 border-amber-700/50 text-amber-400 hover:bg-amber-900/50'}"
															>{pct}% mgr</button>
														{/each}
													</div>
												</div>
											{/if}

											<!-- Earnings breakdown -->
											<div class="space-y-1.5 pt-1 border-t border-slate-700/50">
												<div class="flex justify-between text-xs">
													<span class="text-slate-400">Gross earnings</span>
													<span class="font-semibold text-emerald-300">{formatCurrency(payout.amount)}</span>
												</div>

												{#if managerOverlayOn}
													<div class="flex justify-between text-xs">
														<span class="text-amber-400">Manager cut ({managerOverlayCut}%)</span>
														<span class="font-semibold text-amber-300">−{formatCurrency(mMgr.mgr)}</span>
													</div>
												{/if}

												{#if !noFranchiseCut}
													<div class="flex justify-between text-xs">
														<span class="text-purple-400">Franchise cut ({franchiseCutPct}%)</span>
														<span class="font-semibold text-purple-300">−{formatCurrency(payout.franchiseAmount)}</span>
													</div>
												{/if}

												<div class="flex justify-between text-xs pt-1 border-t border-slate-700/50 font-bold">
													<span class="text-white">Pro takes home</span>
													<span class="text-emerald-300">
														{formatCurrency(managerOverlayOn ? mMgr.net : payout.amount)}
													</span>
												</div>

												{#if managerOverlayOn}
													<div class="flex justify-between text-xs">
														<span class="text-amber-400">Manager receives</span>
														<span class="font-semibold text-amber-300">{formatCurrency(mMgr.mgr)}</span>
													</div>
												{/if}

												{#if div.result?.managerName}
													<div class="text-[10px] text-amber-400/70 pt-0.5">
														Actual mgr: {div.result.managerName} ({div.result.managerCutPercentage}%)
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>

								<!-- % of purse + totals strip -->
								<div class="rounded-lg bg-slate-700/40 border border-slate-600 px-3 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
									<span class="text-slate-400">% of purse: <span class="text-blue-300 font-semibold">{((payout.amount / data.divisionPurse) * 100).toFixed(1)}%</span></span>
									<span class="text-slate-400">Per division: <span class="text-white font-semibold">{formatCurrency(payout.amount)}</span></span>
									<span class="text-slate-400">Both divisions: <span class="text-white font-semibold">{formatCurrency(payout.amount * 2)}</span></span>
									{#if managerOverlayOn}
										<span class="text-amber-400">Manager (both): <span class="font-semibold">{formatCurrency(mMgr.mgr * 2)}</span></span>
										<span class="text-emerald-400">Pros net (both): <span class="font-semibold">{formatCurrency(mMgr.net * 2)}</span></span>
									{/if}
								</div>
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

	<!-- Results Tabs -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
		<div class="border-b border-slate-700">
			<div class="flex">
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'mens'
						? 'border-blue-600 text-blue-400'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'mens')}
				>
					Men's Division ({mensResults.length})
				</button>
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'womens'
						? 'border-pink-600 text-pink-400'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'womens')}
				>
					Women's Division ({womensResults.length})
				</button>
			</div>
		</div>

		<div class="p-6">
			{#if selectedDivision === 'mens'}
				<div class="mb-4 flex items-center justify-between">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-emerald-400">{formatCurrency(totalMensPaid)}</span>
					</div>
					<div class="text-sm text-muted-foreground">
						Division Purse: <span class="font-bold text-cyan-400">{formatCurrency(data.divisionPurse)}</span>
					</div>
				</div>
				<div class="space-y-2">
					{#each mensResults as result}
						{@const isOpen = expandedResult === result.id}
						{@const hasManager = result.managerName && result.managerEarnings > 0}
						<div class="rounded-lg border border-slate-700 bg-slate-700/40 overflow-hidden">
							<!-- Summary row (always visible) -->
							<button
								type="button"
								onclick={() => toggleResult(result.id)}
								class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/60 transition-colors text-left"
							>
								<div class="flex items-center gap-4">
									<span class="text-xl font-bold w-14 text-center shrink-0">{placementLabel(result.placement)}</span>
									<div>
										<div class="font-semibold text-white">{result.expand?.pro?.name || 'Unknown'}</div>
										<div class="text-xs text-slate-400 flex items-center gap-2">
											{#if result.expand?.franchise}<span>{result.expand.franchise.name}</span>{/if}
											{#if hasManager}<span class="text-amber-400">· Manager: {result.managerName}</span>{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<div class="font-bold text-emerald-300">{formatCurrency(result.proEarnings || 0)}</div>
										{#if hasManager}
											<div class="text-xs text-slate-400">Net: {formatCurrency(result.netProEarnings || 0)}</div>
										{/if}
									</div>
									<span class="text-slate-500 text-xs">{isOpen ? '▲' : '▼'}</span>
								</div>
							</button>

							<!-- Expanded payment breakdown -->
							{#if isOpen}
								<div class="border-t border-slate-600 px-4 py-4 bg-slate-800/60 space-y-3">
									<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Breakdown</p>

									<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<!-- Pro gross -->
										<div class="rounded-lg bg-emerald-950/40 border border-emerald-800/50 px-4 py-3">
											<p class="text-[10px] text-emerald-400 uppercase tracking-wide mb-1">Pro Gross Earnings</p>
											<p class="text-xl font-black text-emerald-300">{formatCurrency(result.proEarnings || 0)}</p>
											<p class="text-xs text-slate-400 mt-0.5">{placementLabel(result.placement)} · {result.expand?.pro?.name}</p>
										</div>

										<!-- Manager cut -->
										{#if hasManager}
											<div class="rounded-lg bg-amber-950/40 border border-amber-800/50 px-4 py-3">
												<p class="text-[10px] text-amber-400 uppercase tracking-wide mb-1">Manager Cut ({result.managerCutPercentage}%)</p>
												<p class="text-xl font-black text-amber-300">{formatCurrency(result.managerEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.managerName}</p>
												{#if result.managerEmail}
													<p class="text-xs text-slate-500">{result.managerEmail}</p>
												{/if}
											</div>
										{/if}

										<!-- Net to pro -->
										{#if hasManager}
											<div class="rounded-lg bg-blue-950/40 border border-blue-800/50 px-4 py-3">
												<p class="text-[10px] text-blue-400 uppercase tracking-wide mb-1">Net to Pro (after manager)</p>
												<p class="text-xl font-black text-blue-300">{formatCurrency(result.netProEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.expand?.pro?.name} takes home</p>
											</div>
										{/if}

										<!-- Franchise cut -->
										{#if !noFranchiseCut && result.franchiseEarnings > 0}
											<div class="rounded-lg bg-purple-950/40 border border-purple-800/50 px-4 py-3">
												<p class="text-[10px] text-purple-400 uppercase tracking-wide mb-1">Franchise Cut ({franchiseCutPct}%)</p>
												<p class="text-xl font-black text-purple-300">{formatCurrency(result.franchiseEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.expand?.franchise?.name || 'Franchise'}</p>
											</div>
										{/if}
									</div>

									<!-- Payment summary line -->
									<div class="rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 flex flex-wrap gap-4 text-xs">
										<span class="text-slate-400">Gross: <span class="text-white font-semibold">{formatCurrency(result.proEarnings || 0)}</span></span>
										{#if hasManager}<span class="text-slate-400">Manager: <span class="text-amber-300 font-semibold">−{formatCurrency(result.managerEarnings || 0)}</span></span>{/if}
										{#if !noFranchiseCut}<span class="text-slate-400">Franchise: <span class="text-purple-300 font-semibold">−{formatCurrency(result.franchiseEarnings || 0)}</span></span>{/if}
										<span class="text-slate-400 ml-auto">Pro takes home: <span class="text-emerald-300 font-bold">{formatCurrency(hasManager ? (result.netProEarnings || 0) : (result.proEarnings || 0))}</span></span>
									</div>

									{#if result.score}<p class="text-xs text-slate-500">Score: {result.score}{result.rounds ? ` · ${result.rounds} rounds` : ''}</p>{/if}

									<form method="POST" action="?/deleteResult" use:enhance class="flex justify-end">
										<input type="hidden" name="id" value={result.id} />
										<button
											type="submit"
											onclick={(e) => { if (!confirm('Remove this result?')) e.preventDefault(); }}
											class="text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 transition-colors"
										>Remove Result</button>
									</form>
								</div>
							{/if}
						</div>
					{:else}
						<div class="text-center py-8 text-slate-400">No results yet. Add results to see payouts.</div>
					{/each}
				</div>
			{:else}
				<div class="mb-4 flex items-center justify-between">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-emerald-400">{formatCurrency(totalWomensPaid)}</span>
					</div>
					<div class="text-sm text-muted-foreground">
						Division Purse: <span class="font-bold text-pink-400">{formatCurrency(data.divisionPurse)}</span>
					</div>
				</div>
				<div class="space-y-2">
					{#each womensResults as result}
						{@const isOpen = expandedResult === result.id}
						{@const hasManager = result.managerName && result.managerEarnings > 0}
						<div class="rounded-lg border border-slate-700 bg-slate-700/40 overflow-hidden">
							<button
								type="button"
								onclick={() => toggleResult(result.id)}
								class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/60 transition-colors text-left"
							>
								<div class="flex items-center gap-4">
									<span class="text-xl font-bold w-14 text-center shrink-0">{placementLabel(result.placement)}</span>
									<div>
										<div class="font-semibold text-white">{result.expand?.pro?.name || 'Unknown'}</div>
										<div class="text-xs text-slate-400 flex items-center gap-2">
											{#if result.expand?.franchise}<span>{result.expand.franchise.name}</span>{/if}
											{#if hasManager}<span class="text-amber-400">· Manager: {result.managerName}</span>{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-4">
									<div class="text-right">
										<div class="font-bold text-emerald-300">{formatCurrency(result.proEarnings || 0)}</div>
										{#if hasManager}
											<div class="text-xs text-slate-400">Net: {formatCurrency(result.netProEarnings || 0)}</div>
										{/if}
									</div>
									<span class="text-slate-500 text-xs">{isOpen ? '▲' : '▼'}</span>
								</div>
							</button>

							{#if isOpen}
								<div class="border-t border-slate-600 px-4 py-4 bg-slate-800/60 space-y-3">
									<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Breakdown</p>
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div class="rounded-lg bg-emerald-950/40 border border-emerald-800/50 px-4 py-3">
											<p class="text-[10px] text-emerald-400 uppercase tracking-wide mb-1">Pro Gross Earnings</p>
											<p class="text-xl font-black text-emerald-300">{formatCurrency(result.proEarnings || 0)}</p>
											<p class="text-xs text-slate-400 mt-0.5">{placementLabel(result.placement)} · {result.expand?.pro?.name}</p>
										</div>
										{#if hasManager}
											<div class="rounded-lg bg-amber-950/40 border border-amber-800/50 px-4 py-3">
												<p class="text-[10px] text-amber-400 uppercase tracking-wide mb-1">Manager Cut ({result.managerCutPercentage}%)</p>
												<p class="text-xl font-black text-amber-300">{formatCurrency(result.managerEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.managerName}</p>
												{#if result.managerEmail}<p class="text-xs text-slate-500">{result.managerEmail}</p>{/if}
											</div>
											<div class="rounded-lg bg-blue-950/40 border border-blue-800/50 px-4 py-3">
												<p class="text-[10px] text-blue-400 uppercase tracking-wide mb-1">Net to Pro (after manager)</p>
												<p class="text-xl font-black text-blue-300">{formatCurrency(result.netProEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.expand?.pro?.name} takes home</p>
											</div>
										{/if}
										{#if !noFranchiseCut && result.franchiseEarnings > 0}
											<div class="rounded-lg bg-purple-950/40 border border-purple-800/50 px-4 py-3">
												<p class="text-[10px] text-purple-400 uppercase tracking-wide mb-1">Franchise Cut ({franchiseCutPct}%)</p>
												<p class="text-xl font-black text-purple-300">{formatCurrency(result.franchiseEarnings || 0)}</p>
												<p class="text-xs text-slate-400 mt-0.5">{result.expand?.franchise?.name || 'Franchise'}</p>
											</div>
										{/if}
									</div>
									<div class="rounded-lg bg-slate-700/50 border border-slate-600 px-4 py-2 flex flex-wrap gap-4 text-xs">
										<span class="text-slate-400">Gross: <span class="text-white font-semibold">{formatCurrency(result.proEarnings || 0)}</span></span>
										{#if hasManager}<span class="text-slate-400">Manager: <span class="text-amber-300 font-semibold">−{formatCurrency(result.managerEarnings || 0)}</span></span>{/if}
										{#if !noFranchiseCut}<span class="text-slate-400">Franchise: <span class="text-purple-300 font-semibold">−{formatCurrency(result.franchiseEarnings || 0)}</span></span>{/if}
										<span class="text-slate-400 ml-auto">Pro takes home: <span class="text-emerald-300 font-bold">{formatCurrency(hasManager ? (result.netProEarnings || 0) : (result.proEarnings || 0))}</span></span>
									</div>
									{#if result.score}<p class="text-xs text-slate-500">Score: {result.score}{result.rounds ? ` · ${result.rounds} rounds` : ''}</p>{/if}
									<form method="POST" action="?/deleteResult" use:enhance class="flex justify-end">
										<input type="hidden" name="id" value={result.id} />
										<button
											type="submit"
											onclick={(e) => { if (!confirm('Remove this result?')) e.preventDefault(); }}
											class="text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 transition-colors"
										>Remove Result</button>
									</form>
								</div>
							{/if}
						</div>
					{:else}
						<div class="text-center py-8 text-slate-400">No results yet. Add results to see payouts.</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Franchise Payouts -->
	{#if data.franchisePayouts.length > 0}
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
			<h2 class="text-xl font-semibold mb-4 text-slate-100">Franchise Payouts</h2>
			<div class="space-y-2">
				{#each data.franchisePayouts as payout}
					<div class="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
						<div>
							<div class="font-semibold">{payout.expand?.franchise?.name || 'Unknown'}</div>
							<div class="text-sm text-muted-foreground">
								{payout.numberOfPros} pro{payout.numberOfPros !== 1 ? 's' : ''}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg text-purple-300">{formatCurrency(payout.totalEarnings)}</div>
							<div class="text-xs text-muted-foreground">
								Men's: {formatCurrency(payout.mensEarnings)} | Women's: {formatCurrency(payout.womensEarnings)}
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-4 border-t border-slate-700">
				<div class="flex justify-between text-lg font-bold text-slate-100">
					<span>Total Franchise Cut:</span>
					<span class="text-purple-300">{formatCurrency(totalFranchiseCut)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

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
