<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let searchInput = $state(data.filters.search || '');

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
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
			case 'active':
				return 'bg-green-600 text-white';
			case 'inactive':
				return 'bg-gray-600 text-white';
			case 'retired':
				return 'bg-blue-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};

	const applyFilters = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(window.location.search);
		
		Object.entries(updates).forEach(([key, value]) => {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});
		
		goto(`/dashboard/pros?${params.toString()}`);
	};

	const handleSearch = () => {
		applyFilters({ search: searchInput || null });
	};

	const clearFilters = () => {
		searchInput = '';
		goto('/dashboard/pros');
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Pro Management</h1>
			<p class="text-gray-400">Manage professional players, tournaments, and payments</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/pros/tournaments">Tournaments</Button>
			<Button href="/dashboard/pros/payments">Payments</Button>
			<Button href="/dashboard/pros/special-events">Special Events</Button>
			<Button href="/dashboard/pros/franchise-payouts">Franchise Payouts</Button>
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
		<div class="bg-slate-800 p-6 rounded-lg border border-slate-600">
			<div class="text-sm text-slate-400">Total Pros</div>
			<div class="text-3xl font-bold text-white">{data.overallStats.totalPros}</div>
		</div>
		<div class="bg-green-900/50 p-6 rounded-lg border border-green-700">
			<div class="text-sm text-green-400">Active</div>
			<div class="text-3xl font-bold text-green-400">{data.overallStats.activePros}</div>
		</div>
		<div class="bg-blue-900/50 p-6 rounded-lg border border-blue-700">
			<div class="text-sm text-blue-400">Men</div>
			<div class="text-3xl font-bold text-blue-400">{data.overallStats.mensPros}</div>
		</div>
		<div class="bg-pink-900/50 p-6 rounded-lg border border-pink-700">
			<div class="text-sm text-pink-400">Women</div>
			<div class="text-3xl font-bold text-pink-400">{data.overallStats.womensPros}</div>
		</div>
		<div class="bg-emerald-900/50 p-6 rounded-lg border border-emerald-700">
			<div class="text-sm text-emerald-400">Total Earnings</div>
			<div class="text-2xl font-bold text-emerald-400">{formatCurrency(data.overallStats.totalEarnings)}</div>
		</div>
		<div class="bg-amber-900/50 p-6 rounded-lg border border-amber-700">
			<div class="text-sm text-amber-400">Pending Payments</div>
			<div class="text-3xl font-bold text-amber-400">{data.pendingPayments.length}</div>
		</div>
		<div class="bg-red-900/50 p-6 rounded-lg border border-red-700">
			<div class="text-sm text-red-400">Overdue</div>
			<div class="text-3xl font-bold text-red-400">{data.overduePayments.length}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
		<div class="flex flex-wrap gap-4">
			<div class="flex-1 min-w-[200px]">
				<label class="text-sm font-medium text-gray-300">Search</label>
				<div class="flex gap-2 mt-1">
					<input
						type="text"
						bind:value={searchInput}
						placeholder="Search by name..."
						class="flex-1 rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white placeholder-gray-400"
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
					<Button onclick={handleSearch}>Search</Button>
				</div>
			</div>
			<div>
				<label class="text-sm font-medium text-gray-300">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					value={data.filters.status || ''}
					onchange={(e) => applyFilters({ status: e.currentTarget.value || null })}
				>
					<option value="">All Statuses</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="retired">Retired</option>
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-gray-300">Gender</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					value={data.filters.gender || ''}
					onchange={(e) => applyFilters({ gender: e.currentTarget.value || null })}
				>
					<option value="">All Genders</option>
					<option value="male">Male</option>
					<option value="female">Female</option>
					<option value="other">Other</option>
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-gray-300">Franchise</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					value={data.filters.franchise || ''}
					onchange={(e) => applyFilters({ franchise: e.currentTarget.value || null })}
				>
					<option value="">All Franchises</option>
					{#each data.franchises as franchise}
						<option value={franchise.id}>{franchise.name}</option>
					{/each}
				</select>
			</div>
			{#if data.filters.status || data.filters.gender || data.filters.franchise || data.filters.search}
				<div class="flex items-end">
					<Button variant="outline" onclick={clearFilters}>Clear Filters</Button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Overdue Payments Alert -->
	{#if data.overduePayments.length > 0}
		<div class="bg-red-900/30 border border-red-700 rounded-lg p-4">
			<h3 class="text-lg font-semibold text-red-400 mb-2">⚠️ Overdue Payments</h3>
			<div class="space-y-2">
				{#each data.overduePayments as payment}
					<div class="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-700">
						<div>
							<div class="font-medium text-white">{payment.expand?.pro?.name || 'Unknown Pro'}</div>
							<div class="text-sm text-gray-400">
								Due: {formatDate(payment.dueDate)}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-red-400">{formatCurrency(payment.amount)}</div>
							<Badge class={getStatusColor(payment.status)}>{payment.status}</Badge>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Tournaments -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<div class="p-6 border-b border-gray-700">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-white">Recent Tournaments</h2>
				<Button href="/dashboard/pros/tournaments" variant="outline">View All</Button>
			</div>
		</div>
		<div class="divide-y divide-gray-700">
			{#each data.tournaments.slice(0, 5) as tournament}
				<div class="p-4 hover:bg-gray-700/50">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-medium text-white">{tournament.name}</h3>
							<div class="text-sm text-gray-400">
								Season {tournament.season} • {formatDate(tournament.startDate)} - {formatDate(
									tournament.endDate
								)}
							</div>
						</div>
						<div class="text-right">
							<div class="font-semibold text-white">{formatCurrency(tournament.prizePool)}</div>
							<Badge
								class={tournament.status === 'completed'
									? 'bg-green-600 text-white'
									: tournament.status === 'in_progress'
										? 'bg-blue-600 text-white'
										: 'bg-gray-600 text-white'}
							>
								{tournament.status}
							</Badge>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-gray-400">No tournaments found</div>
			{/each}
		</div>
	</div>

	<!-- Pros List -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<div class="p-6 border-b border-gray-700">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-white">
					Professional Players ({data.pros.length})
				</h2>
				<Button href="/dashboard/pros/new" variant="outline">Add Pro</Button>
			</div>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-900 border-b border-gray-700">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Pro</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Franchise</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Gender</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Tournaments</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Wins</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Podiums</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">Earnings</th>
						<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
						<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each data.pros as pro}
						{@const stats = data.proStats[pro.id] || {}}
						<tr class="hover:bg-gray-700/50">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									{#if pro.photo}
										<img
											src={pro.photo}
											alt={pro.name}
											class="w-10 h-10 rounded-full object-cover"
										/>
									{:else}
										<div
											class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold text-sm"
										>
											{pro.name.charAt(0)}
										</div>
									{/if}
									<div>
										<div class="font-medium text-white">{pro.name}</div>
										{#if pro.nickname}
											<div class="text-xs text-gray-400">"{pro.nickname}"</div>
										{/if}
									</div>
								</div>
							</td>
							<td class="px-4 py-3 text-sm">
								{#if pro.expand?.franchise}
									<span class="text-blue-400">{pro.expand.franchise.name}</span>
								{:else}
									<span class="text-gray-400">Independent</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm">
								{#if pro.gender === 'male'}
									<span class="text-blue-400">♂ Male</span>
								{:else if pro.gender === 'female'}
									<span class="text-pink-400">♀ Female</span>
								{:else}
									<span class="text-gray-400">{pro.gender || 'N/A'}</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm text-white">{stats.tournamentsPlayed || 0}</td>
							<td class="px-4 py-3 text-right text-sm font-medium">
								{#if stats.wins > 0}
									<span class="text-yellow-400">🏆 {stats.wins}</span>
								{:else}
									<span class="text-gray-400">0</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm">
								{#if stats.podiums > 0}
									<span class="text-orange-400">{stats.podiums}</span>
								{:else}
									<span class="text-gray-400">0</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm font-bold text-white">
								{formatCurrency(stats.totalEarnings || 0)}
							</td>
							<td class="px-4 py-3 text-center">
								<Badge class={getStatusColor(pro.status)}>{pro.status}</Badge>
							</td>
							<td class="px-4 py-3 text-center">
								<Button href="/dashboard/pros/{pro.id}" variant="outline" size="sm"
									>View</Button
								>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="p-8 text-center text-gray-400">
								No pros found. Try adjusting your filters.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
