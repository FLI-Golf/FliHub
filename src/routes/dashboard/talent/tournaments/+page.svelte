<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let editingTournament = $state<any>(null);

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

	// Map tournament number → scheduled purse from the season budget
	const purseByNumber = $derived(
		Object.fromEntries(
			(data.seasonPurseSchedule ?? []).map((p: any) => [p.tournamentNumber, p])
		)
	);

	// Franchise cut % (default 20)
	const franchisePct = 20;
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Tournaments</h1>
			<p class="text-muted-foreground">Manage tournament events and prize pools</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent">← Back to Pros</Button>
			<Button onclick={openCreateModal}>Create Tournament</Button>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-slate-800 rounded-lg border border-slate-700 p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium text-slate-300">Season</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2"
					onchange={(e) => {
						const s = e.currentTarget.value;
						window.location.href = s
							? `/dashboard/talent/tournaments?season=${s}`
							: '/dashboard/talent/tournaments';
					}}
				>
					<option value="">All Seasons</option>
					{#each data.seasons as season}
						<option value={season} selected={data.currentSeason === season}>{season}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-slate-300">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2"
					onchange={(e) => {
						const s = e.currentTarget.value;
						window.location.href = s
							? `/dashboard/talent/tournaments?status=${s}`
							: '/dashboard/talent/tournaments';
					}}
				>
					<option value="">All Statuses</option>
					<option value="scheduled"  selected={data.currentStatus === 'scheduled'}>Scheduled</option>
					<option value="in_progress" selected={data.currentStatus === 'in_progress'}>In Progress</option>
					<option value="completed"  selected={data.currentStatus === 'completed'}>Completed</option>
					<option value="cancelled"  selected={data.currentStatus === 'cancelled'}>Cancelled</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Season Budget Summary -->
	{#if data.activeSeason && data.seasonBudget > 0}
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
			<h2 class="text-xl font-semibold text-slate-100 mb-4">
				Season {data.activeSeason} — Prize Budget
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="text-center p-4 bg-yellow-900/30 border border-yellow-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Season Budget</div>
					<div class="text-2xl font-bold text-yellow-300">{formatCurrency(data.seasonBudget)}</div>
				</div>
				<div class="text-center p-4 bg-purple-900/30 border border-purple-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Franchise Cut (20%)</div>
					<div class="text-2xl font-bold text-purple-300">{formatCurrency(data.seasonFranchiseCut)}</div>
				</div>
				<div class="text-center p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Pro Cut (80%)</div>
					<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.seasonProCut)}</div>
				</div>
				<div class="text-center p-4 bg-cyan-900/30 border border-cyan-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Tournaments</div>
					<div class="text-2xl font-bold text-cyan-300">{data.seasonPurseSchedule?.length ?? 0}</div>
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
							{@const franchiseCut = purse.totalPurse * (franchisePct / 100)}
							{@const proCut = purse.totalPurse - franchiseCut}
							{@const divisionPurse = proCut / 2}
							<div class="bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-center">
								<div class="text-xs text-slate-400 mb-1">Tournament #{purse.tournamentNumber}</div>
								<div class="text-lg font-bold text-slate-100">{formatCurrency(purse.totalPurse)}</div>
								<div class="mt-2 space-y-1 text-xs text-slate-400">
									<div class="flex justify-between">
										<span>Franchise</span>
										<span class="text-purple-300">{formatCurrency(franchiseCut)}</span>
									</div>
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
				{@const scheduledPurse = purseByNumber[tournament.tournamentNumber]}
				{@const displayPurse = tournament.prizePool || scheduledPurse?.totalPurse || 0}
				{@const franchiseCut = displayPurse * (franchisePct / 100)}
				{@const proCut = displayPurse - franchiseCut}
				{@const divisionPurse = proCut / 2}
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
									<span>Franchise (20%)</span>
									<span class="text-purple-300 font-medium">{formatCurrency(franchiseCut)}</span>
								</div>
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
								<Button
									href="/dashboard/talent/tournaments/{tournament.id}"
									variant="outline"
									size="sm">View</Button
								>
								<Button onclick={() => openEditModal(tournament)} variant="outline" size="sm"
									>Edit</Button
								>
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
</div>

<!-- Create/Edit Modal -->
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
							<input
								type="number"
								name="season"
								value={editingTournament?.season || new Date().getFullYear()}
								required
								min="2024"
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
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
								value={editingTournament?.location || ''}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Venue</label>
							<input
								type="text"
								name="venue"
								value={editingTournament?.venue || ''}
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
