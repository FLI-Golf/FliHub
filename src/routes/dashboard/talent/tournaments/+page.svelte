<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Heart } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let editingTournament = $state<any>(null);
	let activeTab = $state<'tournaments' | 'seasons'>('tournaments');
	let showSeasonModal = $state(false);
	let editingSeason = $state<any>(null);
	let seasonSaving = $state(false);
	const canManage = data.canManage;
	const canShowInterest = data.canShowInterest;
	let interestMap = $state<Record<string, boolean>>({});

	$effect(() => {
		interestMap = Object.fromEntries((data.userInterests ?? []).map((interest: any) => [interest.tournament, true]));
	});

	const openSeasonModal = (s?: any) => { editingSeason = s ?? null; showSeasonModal = true; };
	const closeSeasonModal = () => { showSeasonModal = false; editingSeason = null; };

	const seasonStatusColor = (s: string) =>
		s === 'active'    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700' :
		s === 'completed' ? 'text-slate-400 bg-slate-800 border-slate-600' :
		                    'text-amber-400 bg-amber-950/40 border-amber-700';

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

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':   return 'bg-green-100 text-green-800';
			case 'in_progress': return 'bg-blue-100 text-blue-800';
			case 'scheduled':   return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':   return 'bg-red-100 text-red-800';
			default:            return 'bg-gray-100 text-gray-800';
		}
	};

	const openCreateModal = () => { editingTournament = null; showCreateModal = true; };
	const openEditModal = (t: any) => { editingTournament = t; showCreateModal = true; };
	const closeModal = () => { showCreateModal = false; editingTournament = null; };

	// Season 1 = franchiseCutPercentage === 0; pre-fill venue for new tournaments
	const SEASON1_LOCATION = 'Arizona';
	const SEASON1_VENUE    = 'Turf Paradise';

	let modalSeasonId = $state<string>('');
	const modalSeason = $derived(data.seasonRecords.find((s: any) => s.id === modalSeasonId));
	const isSeason1Modal = $derived((modalSeason?.franchiseCutPercentage ?? 1) === 0);

	$effect(() => {
		if (showCreateModal && !editingTournament) {
			// Default to the active/most-recent season
			modalSeasonId = data.activeSeasonRecord?.id ?? data.seasonRecords[0]?.id ?? '';
		} else if (showCreateModal && editingTournament) {
			modalSeasonId = editingTournament.seasonRef ?? '';
		}
	});

	// Map tournament number → scheduled purse from the season budget
	const purseByNumber = $derived(
		Object.fromEntries(
			(data.seasonPurseSchedule ?? []).map((p: any) => [p.tournamentNumber, p])
		)
	);
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Tournaments</h1>
			<p class="text-muted-foreground">{canManage ? 'Manage tournament events and prize pools' : 'Browse tournament opportunities and signal booking interest'}</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent">← Back to Pros</Button>
			{#if canManage && activeTab === 'seasons'}
				<Button onclick={() => openSeasonModal()}>+ New Season</Button>
			{:else if canManage}
				<Button onclick={openCreateModal}>Create Tournament</Button>
			{/if}
		</div>
	</div>
	{#if canShowInterest}
		<div class="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-3 text-sm text-emerald-200">
			Use the heart icon to register vendor interest in a tournament. This creates a lightweight pipeline for future booking review without exposing tournament management.
		</div>
	{/if}

	<!-- Phase 2 context banner -->
	<div class="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-5 py-3 flex items-center gap-4 flex-wrap">
		<div class="flex items-center gap-2 shrink-0">
			<span class="size-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">2</span>
			<span class="text-xs font-bold text-emerald-400 uppercase tracking-wide">Phase 2 — Tournaments Live</span>
		</div>
		<div class="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
			<span>Season 2027 · First tournament <span class="text-white font-semibold">Apr 24, 2027</span></span>
			<span class="text-slate-600">·</span>
			<span>6 tournaments · prize pools escalate each event</span>
			<span class="text-slate-600">·</span>
			<span>Spending profile changes dramatically from Phase 1 — prize payouts, pro payments &amp; franchise cuts activate</span>
		</div>
		<a href="/dashboard/financial-projections" class="ml-auto shrink-0 text-[10px] text-emerald-600 hover:text-emerald-400 transition-colors">
			View projections →
		</a>
	</div>

	<!-- Tab toggle -->
	{#if canManage}
	<div class="flex gap-2">
		<button
			class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeTab === 'tournaments' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}"
			onclick={() => activeTab = 'tournaments'}
		>Tournaments</button>
		<button
			class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors {activeTab === 'seasons' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}"
			onclick={() => activeTab = 'seasons'}
		>Season Settings</button>
	</div>
	{/if}

	{#if activeTab === 'tournaments'}
	<!-- Filters -->
	<div class="bg-slate-800 rounded-lg border border-slate-700 p-4">
		<div class="flex gap-4 flex-wrap items-end">
			<div>
				<label class="text-sm font-medium text-slate-300">Season</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2"
					onchange={(e) => {
						const p = new URLSearchParams(window.location.search);
						const v = e.currentTarget.value;
						if (v) p.set('season', v); else p.delete('season');
						window.location.href = `/dashboard/talent/tournaments${p.toString() ? '?' + p.toString() : ''}`;
					}}
				>
					<option value="">All Seasons</option>
					{#each data.seasonRecords as s}
						<option value={s.id} selected={data.currentSeasonId === s.id}>{s.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-slate-300">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2"
					onchange={(e) => {
						const p = new URLSearchParams(window.location.search);
						const v = e.currentTarget.value;
						if (v) p.set('status', v); else p.delete('status');
						window.location.href = `/dashboard/talent/tournaments${p.toString() ? '?' + p.toString() : ''}`;
					}}
				>
					<option value="">All Statuses</option>
					<option value="scheduled"   selected={data.currentStatus === 'scheduled'}>Scheduled</option>
					<option value="in_progress" selected={data.currentStatus === 'in_progress'}>In Progress</option>
					<option value="completed"   selected={data.currentStatus === 'completed'}>Completed</option>
					<option value="cancelled"   selected={data.currentStatus === 'cancelled'}>Cancelled</option>
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-slate-300">Sort</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2"
					onchange={(e) => {
						const p = new URLSearchParams(window.location.search);
						const v = e.currentTarget.value;
						if (v) p.set('sort', v); else p.delete('sort');
						window.location.href = `/dashboard/talent/tournaments${p.toString() ? '?' + p.toString() : ''}`;
					}}
				>
					<option value=""        selected={!data.currentSort}>Date Ascending</option>
					<option value="number"  selected={data.currentSort === 'number'}># Ascending</option>
					<option value="-number" selected={data.currentSort === '-number'}># Descending</option>
					<option value="date"    selected={data.currentSort === 'date'}>Date Ascending</option>
					<option value="-date"   selected={data.currentSort === '-date'}>Date Descending</option>
					<option value="name"    selected={data.currentSort === 'name'}>Name A–Z</option>
					<option value="-name"   selected={data.currentSort === '-name'}>Name Z–A</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Season Budget Summary -->
	{#if data.activeSeasonRecord && data.seasonBudget > 0}
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
			<h2 class="text-xl font-semibold text-slate-100 mb-4">
				Season {data.activeSeasonRecord.year ?? data.activeSeasonRecord.name} — Prize Budget
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="text-center p-4 bg-yellow-900/30 border border-yellow-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Season Budget</div>
					<div class="text-2xl font-bold text-yellow-300">{formatCurrency(data.seasonBudget)}</div>
				</div>
				<div class="text-center p-4 bg-cyan-900/30 border border-cyan-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Men's Total</div>
					<div class="text-2xl font-bold text-cyan-300">{formatCurrency(data.seasonBudget / 2)}</div>
				</div>
				<div class="text-center p-4 bg-pink-900/30 border border-pink-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Women's Total</div>
					<div class="text-2xl font-bold text-pink-300">{formatCurrency(data.seasonBudget / 2)}</div>
				</div>
				<div class="text-center p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Tournaments</div>
					<div class="text-2xl font-bold text-slate-100">{data.seasonPurseSchedule?.length ?? 0}</div>
				</div>
			</div>

			<!-- Progressive purse schedule -->
			{#if data.seasonPurseSchedule && data.seasonPurseSchedule.length > 0}
				<div class="border-t border-slate-700 pt-4">
					<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
						Progressive Prize Distribution
					</h3>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
						{#each data.seasonPurseSchedule as purse}
							{@const divisionPurse = purse.totalPurse / 2}
							<div class="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
								<div class="text-xs text-slate-400 mb-1">Tournament #{purse.tournamentNumber}</div>
								<div class="text-lg font-bold text-slate-100">{formatCurrency(purse.totalPurse)}</div>
								<div class="mt-2 space-y-1 text-xs text-slate-400">
									<div class="flex justify-between">
										<span>Men's</span>
										<span class="text-cyan-300">{formatCurrency(divisionPurse)}</span>
									</div>
									<div class="flex justify-between">
										<span>Women's</span>
										<span class="text-pink-300">{formatCurrency(divisionPurse)}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Tournaments List -->
	<div class="rounded-lg border border-slate-700 overflow-hidden">
		<div class="divide-y divide-slate-700">
			{#each data.tournaments as tournament, i}
				{@const scheduledPurse = purseByNumber[tournament.tournamentNumber ?? 0]}
				{@const displayPurse = tournament.prizePool || scheduledPurse?.totalPurse || 0}
				{@const divisionPurse = displayPurse / 2}
				<div class="p-4 {i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/60'} hover:bg-slate-600/50 transition-colors">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-semibold text-slate-100">{tournament.name}</h3>
								<Badge class={getStatusColor(tournament.status)}>{tournament.status}</Badge>
							</div>
							<div class="mt-2 space-y-1 text-sm text-slate-400">
								<div>
									Season {tournament.season}
									{#if tournament.tournamentNumber}
										• Tournament #{tournament.tournamentNumber}
									{/if}
								</div>
								<div>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</div>
								{#if tournament.location}
									<div>📍 {tournament.location}</div>
								{/if}
								{#if tournament.venue}
									<div>🏟️ {tournament.venue}</div>
								{/if}
							</div>
						</div>

						<div class="text-right space-y-3 min-w-[200px]">
							<!-- Prize pool -->
							<div>
								<div class="text-xs text-slate-400 uppercase tracking-wide">Prize Pool</div>
								<div class="text-xl font-bold text-slate-100">{formatCurrency(displayPurse)}</div>
							</div>

							<!-- Payout breakdown -->
							<div class="bg-slate-900/50 border border-slate-600 rounded-lg p-2 text-xs space-y-1">
								<div class="flex justify-between text-slate-400">
									<span>Men's purse</span>
									<span class="text-cyan-300 font-medium">{formatCurrency(divisionPurse)}</span>
								</div>
								<div class="flex justify-between text-slate-400">
									<span>Women's purse</span>
									<span class="text-pink-300 font-medium">{formatCurrency(divisionPurse)}</span>
								</div>
							</div>

							<div class="flex gap-2 justify-end">
								{#if canShowInterest}
									<form method="POST" action="?/showInterest" use:enhance class="flex items-center">
										<input type="hidden" name="tournamentId" value={tournament.id} />
										<button
											type="submit"
											class="p-2 rounded transition-colors {interestMap[tournament.id]
												? 'text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50'
												: 'text-slate-400 hover:text-red-400 hover:bg-red-900/30'}"
											title={interestMap[tournament.id] ? 'Remove interest' : 'Show interest'}
										>
											<Heart class="w-4 h-4 {interestMap[tournament.id] ? 'fill-current' : ''}" />
										</button>
									</form>
								{/if}
								<Button
									href="/dashboard/talent/tournaments/{tournament.id}"
									variant="outline"
									size="sm">View</Button
								>
								{#if canManage}
									<Button onclick={() => openEditModal(tournament)} variant="outline" size="sm"
										>Edit</Button
									>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-slate-400 bg-slate-800">
					No tournaments found. Create your first tournament to get started.
				</div>
			{/each}
		</div>
	</div>
{/if} <!-- end activeTab === 'tournaments' -->
</div>

<!-- Create/Edit Modal -->

<!-- ── Seasons Settings Tab ──────────────────────────────────────────────── -->
{#if canManage && activeTab === 'seasons'}
<div class="space-y-4">
	{#if data.seasonRecords?.length === 0}
		<div class="text-center py-12 text-slate-400">
			No seasons yet. Click <strong>+ New Season</strong> to create one.
		</div>
	{/if}
	{#each data.seasonRecords as s}
		{@const cfg = { totalBudget: s.totalBudget, numberOfTournaments: s.numberOfTournaments, franchiseCutPercentage: s.franchiseCutPercentage ?? 0, numberOfPlacements: s.numberOfPlacements ?? 12 }}
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-5">
			<div class="flex items-start justify-between mb-4">
				<div>
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-bold text-white">{s.name}</h3>
						<span class="text-xs font-semibold px-2 py-0.5 rounded border {seasonStatusColor(s.status)}">{s.status}</span>
					</div>
					{#if s.notes}
						<p class="text-sm text-slate-400 mt-1">{s.notes}</p>
					{/if}
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => openSeasonModal(s)}
						class="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-colors"
					>Edit</button>
					<form method="POST" action="?/deleteSeason" use:enhance>
						<input type="hidden" name="id" value={s.id} />
						<button
							type="submit"
							onclick={(e) => { if (!confirm('Delete this season? This will not delete tournaments.')) e.preventDefault(); }}
							class="text-xs px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 transition-colors"
						>Delete</button>
					</form>
				</div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
				{#each [
					{ label: 'Year',              value: s.year },
					{ label: 'Total Budget',      value: new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(s.totalBudget) },
					{ label: 'Tournaments',       value: s.numberOfTournaments },
					{ label: 'Franchise Cut',     value: (s.franchiseCutPercentage ?? 0) + '%' },
					{ label: 'Placements Paid',   value: s.numberOfPlacements ?? 12 },
					{ label: 'Budget / Event',    value: new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(s.totalBudget / s.numberOfTournaments) },
				] as stat}
					<div class="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-2">
						<p class="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
						<p class="text-sm font-bold text-white mt-0.5">{stat.value}</p>
					</div>
				{/each}
			</div>

			{#if cfg.franchiseCutPercentage === 0}
				<div class="mt-3 flex items-center gap-4 flex-wrap">
					<p class="text-xs text-emerald-400">★ Franchise cut waived this season — 100% of prize pool goes to pros.</p>
					<form method="POST" action="?/bulkUpdateLocation" use:enhance={() => {
						return async ({ update }) => { await update(); };
					}}>
						<input type="hidden" name="seasonId"  value={s.id} />
						<input type="hidden" name="location"  value="Arizona" />
						<input type="hidden" name="venue"     value="Turf Paradise" />
						<button type="submit"
							onclick={(e) => { if (!confirm('Set location to Arizona / Turf Paradise on all tournaments in this season?')) e.preventDefault(); }}
							class="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-colors">
							📍 Set all to Turf Paradise, AZ
						</button>
					</form>
				</div>
			{/if}
		</div>
	{/each}
</div>
{/if}

<!-- ── Season Create / Edit Modal ────────────────────────────────────────── -->
{#if showSeasonModal}
	<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
			<h2 class="text-xl font-bold mb-5">{editingSeason ? 'Edit Season' : 'New Season'}</h2>
			<form
				method="POST"
				action={editingSeason ? '?/updateSeason' : '?/createSeason'}
				use:enhance={() => {
					seasonSaving = true;
					return async ({ update }) => { seasonSaving = false; closeSeasonModal(); await update(); };
				}}
				class="space-y-4"
			>
				{#if editingSeason}
					<input type="hidden" name="id" value={editingSeason.id} />
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Season Name *</label>
						<input type="text" name="name" required value={editingSeason?.name ?? ''}
							placeholder="e.g. Season 2028"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Year *</label>
						<input type="number" name="year" required value={editingSeason?.year ?? new Date().getFullYear() + 1}
							min="2024"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Total Budget ($) *</label>
						<input type="number" name="totalBudget" required value={editingSeason?.totalBudget ?? 4000000}
							min="0" step="1000"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Number of Tournaments *</label>
						<input type="number" name="numberOfTournaments" required value={editingSeason?.numberOfTournaments ?? 6}
							min="1" max="20"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Franchise Cut %</label>
						<input type="number" name="franchiseCutPercentage" value={editingSeason?.franchiseCutPercentage ?? 0}
							min="0" max="100" step="1"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
						<p class="text-[10px] text-slate-500 mt-1">Set to 0 to waive franchise cut (Season 1)</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Placements Paid</label>
						<input type="number" name="numberOfPlacements" value={editingSeason?.numberOfPlacements ?? 12}
							min="1" max="20"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
						<p class="text-[10px] text-slate-500 mt-1">Typically equals number of franchises</p>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Status</label>
						<select name="status" class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
							{#each ['upcoming','active','completed'] as st}
								<option value={st} selected={editingSeason?.status === st}>{st}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-300 mb-1">Notes</label>
						<input type="text" name="notes" value={editingSeason?.notes ?? ''}
							placeholder="Optional notes"
							class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
					</div>
				</div>

				<div class="flex gap-3 pt-2">
					<button type="submit" disabled={seasonSaving}
						class="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 text-sm transition-colors">
						{seasonSaving ? 'Saving…' : editingSeason ? 'Update Season' : 'Create Season'}
					</button>
					<button type="button" onclick={closeSeasonModal}
						class="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 text-sm transition-colors">
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-4 text-slate-100">
				{editingTournament ? 'Edit Tournament' : 'Create Tournament'}
			</h2>
			<form method="POST" action="?/{editingTournament ? 'update' : 'create'}" use:enhance>
				{#if editingTournament}
					<input type="hidden" name="id" value={editingTournament.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-1">Tournament Name *</label>
						<input
							type="text"
							name="name"
							value={editingTournament?.name || ''}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Season *</label>
							<select name="seasonRef" required class="w-full rounded-md border border-gray-300 px-3 py-2"
								onchange={(e) => { modalSeasonId = e.currentTarget.value; }}>
								{#each data.seasonRecords as s}
									<option value={s.id} selected={modalSeasonId === s.id}>{s.name}</option>
								{/each}
							</select>
							<input type="hidden" name="season" value={editingTournament?.season || new Date().getFullYear()} />
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Tournament Number</label>
							<input
								type="number"
								name="tournamentNumber"
								value={editingTournament?.tournamentNumber || ''}
								min="1"
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Start Date *</label>
							<input
								type="date"
								name="startDate"
								value={editingTournament?.startDate || ''}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">End Date *</label>
							<input
								type="date"
								name="endDate"
								value={editingTournament?.endDate || ''}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Location</label>
							<input
								type="text"
								name="location"
								value={editingTournament?.location || (isSeason1Modal ? SEASON1_LOCATION : '')}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Venue</label>
							<input
								type="text"
								name="venue"
								value={editingTournament?.venue || (isSeason1Modal ? SEASON1_VENUE : '')}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Prize Pool *</label>
							<input
								type="number"
								name="prizePool"
								value={editingTournament?.prizePool || 0}
								required
								min="0"
								step="0.01"
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Status *</label>
							<select name="status" required class="w-full rounded-md border border-gray-300 px-3 py-2">
								<option value="scheduled"  selected={editingTournament?.status === 'scheduled'}>Scheduled</option>
								<option value="in_progress" selected={editingTournament?.status === 'in_progress'}>In Progress</option>
								<option value="completed"  selected={editingTournament?.status === 'completed'}>Completed</option>
								<option value="cancelled"  selected={editingTournament?.status === 'cancelled'}>Cancelled</option>
							</select>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Description</label>
						<textarea name="description" value={editingTournament?.description || ''} rows="3" class="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea name="notes" value={editingTournament?.notes || ''} rows="3" class="w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
					<Button type="submit">{editingTournament ? 'Update' : 'Create'}</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
