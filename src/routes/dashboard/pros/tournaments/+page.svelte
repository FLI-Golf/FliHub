<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let editingTournament = $state<any>(null);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800';
			case 'scheduled':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const openCreateModal = () => {
		editingTournament = null;
		showCreateModal = true;
	};

	const openEditModal = (tournament: any) => {
		editingTournament = tournament;
		showCreateModal = true;
	};

	const closeModal = () => {
		showCreateModal = false;
		editingTournament = null;
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Tournaments</h1>
			<p class="text-muted-foreground">Manage tournament events and prize pools</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/pros">← Back to Pros</Button>
			<Button onclick={openCreateModal}>Create Tournament</Button>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg border p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium">Season</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					onchange={(e) => {
						const season = e.currentTarget.value;
						window.location.href = season
							? `/dashboard/pros/tournaments?season=${season}`
							: '/dashboard/pros/tournaments';
					}}
				>
					<option value="">All Seasons</option>
					{#each data.seasons as season}
						<option value={season} selected={data.currentSeason === season}>{season}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="text-sm font-medium">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					onchange={(e) => {
						const status = e.currentTarget.value;
						window.location.href = status
							? `/dashboard/pros/tournaments?status=${status}`
							: '/dashboard/pros/tournaments';
					}}
				>
					<option value="">All Statuses</option>
					<option value="scheduled" selected={data.currentStatus === 'scheduled'}>Scheduled</option>
					<option value="in_progress" selected={data.currentStatus === 'in_progress'}
						>In Progress</option
					>
					<option value="completed" selected={data.currentStatus === 'completed'}>Completed</option>
					<option value="cancelled" selected={data.currentStatus === 'cancelled'}>Cancelled</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Tournaments List -->
	<div class="bg-white rounded-lg border">
		<div class="divide-y">
			{#each data.tournaments as tournament}
				<div class="p-4 hover:bg-gray-50">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-semibold">{tournament.name}</h3>
								<Badge class={getStatusColor(tournament.status)}>{tournament.status}</Badge>
							</div>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								<div>
									Season {tournament.season}
									{#if tournament.tournamentNumber}
										• Tournament #{tournament.tournamentNumber}
									{/if}
								</div>
								<div>
									{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
								</div>
								{#if tournament.location}
									<div>📍 {tournament.location}</div>
								{/if}
								{#if tournament.venue}
									<div>🏟️ {tournament.venue}</div>
								{/if}
							</div>
						</div>
						<div class="text-right space-y-2">
							<div>
								<div class="text-sm text-muted-foreground">Prize Pool</div>
								<div class="text-xl font-bold">{formatCurrency(tournament.prizePool)}</div>
							</div>
							<div class="flex gap-2">
								<Button
									href="/dashboard/pros/tournaments/{tournament.id}"
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
				<div class="p-8 text-center text-muted-foreground">
					No tournaments found. Create your first tournament to get started.
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-4">
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
							<select
								name="status"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="scheduled" selected={editingTournament?.status === 'scheduled'}
									>Scheduled</option
								>
								<option value="in_progress" selected={editingTournament?.status === 'in_progress'}
									>In Progress</option
								>
								<option value="completed" selected={editingTournament?.status === 'completed'}
									>Completed</option
								>
								<option value="cancelled" selected={editingTournament?.status === 'cancelled'}
									>Cancelled</option
								>
							</select>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Description</label>
						<textarea
							name="description"
							value={editingTournament?.description || ''}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea
							name="notes"
							value={editingTournament?.notes || ''}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
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
