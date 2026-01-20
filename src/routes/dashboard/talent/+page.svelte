<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchInput = $state(data.filters?.search || '');
	
	// Update searchInput when data changes (e.g., on navigation)
	$effect(() => {
		searchInput = data.filters?.search || '';
	});
	let tournamentsExpanded = $state(false);
	
	// Sorting state
	type SortField = 'name' | 'role' | 'franchise' | 'contact' | 'tournaments' | 'wins' | 'earnings' | 'status';
	type SortDirection = 'asc' | 'desc';
	
	let sortField = $state<SortField | null>(null);
	let sortDirection = $state<SortDirection>('asc');
	
	const toggleSort = (field: SortField) => {
		if (sortField === field) {
			if (sortDirection === 'asc') {
				sortDirection = 'desc';
			} else {
				sortField = null;
				sortDirection = 'asc';
			}
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
	};
	
	// Filtered and sorted talent data
	const filteredAndSortedTalent = $derived.by(() => {
		// First filter by search
		let filtered = data.talent;
		
		if (searchInput.trim()) {
			const query = searchInput.toLowerCase().trim();
			filtered = data.talent.filter(t => 
				t.name?.toLowerCase().includes(query) ||
				t.nickname?.toLowerCase().includes(query) ||
				t.email?.toLowerCase().includes(query) ||
				t.franchise?.name?.toLowerCase().includes(query) ||
				t.role?.toLowerCase().includes(query) ||
				t.country?.toLowerCase().includes(query)
			);
		}
		
		// Then sort
		if (!sortField) return filtered;
		
		return [...filtered].sort((a, b) => {
			let aVal: any;
			let bVal: any;
			
			switch (sortField) {
				case 'name':
					aVal = a.name?.toLowerCase() || '';
					bVal = b.name?.toLowerCase() || '';
					break;
				case 'role':
					aVal = a.role || '';
					bVal = b.role || '';
					break;
				case 'franchise':
					aVal = a.franchise?.name?.toLowerCase() || 'zzz'; // Put null at end
					bVal = b.franchise?.name?.toLowerCase() || 'zzz';
					break;
				case 'contact':
					aVal = a.email?.toLowerCase() || a.phone || 'zzz';
					bVal = b.email?.toLowerCase() || b.phone || 'zzz';
					break;
				case 'tournaments':
					aVal = a.talentType?.includes('player') ? (a.tournamentsPlayed || 0) : -1;
					bVal = b.talentType?.includes('player') ? (b.tournamentsPlayed || 0) : -1;
					break;
				case 'wins':
					aVal = a.talentType?.includes('player') ? (a.wins || 0) : -1;
					bVal = b.talentType?.includes('player') ? (b.wins || 0) : -1;
					break;
				case 'earnings':
					aVal = a.talentType?.includes('player') ? (a.totalEarnings || 0) : -1;
					bVal = b.talentType?.includes('player') ? (b.totalEarnings || 0) : -1;
					break;
				case 'status':
					aVal = a.status || '';
					bVal = b.status || '';
					break;
				default:
					return 0;
			}
			
			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	});

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

	const getTalentTypeColor = (type: string) => {
		switch (type) {
			case 'player':
				return 'bg-purple-600 text-white';
			case 'broadcaster':
				return 'bg-orange-600 text-white';
			case 'commentator':
				return 'bg-cyan-600 text-white';
			case 'analyst':
				return 'bg-blue-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};

	const getTalentTypeLabel = (type: string) => {
		switch (type) {
			case 'player':
				return 'Player';
			case 'broadcaster':
				return 'Broadcaster';
			case 'commentator':
				return 'Commentator';
			case 'analyst':
				return 'Analyst';
			default:
				return type;
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
		
		goto(`/dashboard/talent?${params.toString()}`);
	};

	const handleSearch = () => {
		applyFilters({ search: searchInput || null });
	};

	const clearFilters = () => {
		searchInput = '';
		goto('/dashboard/talent');
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Talent Management</h1>
			<p class="text-gray-400">Manage talent, tournaments, and payments</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent/tournaments">Tournaments</Button>
			<Button href="/dashboard/talent/payments">Payments</Button>
			<Button href="/dashboard/talent/special-events">Special Events</Button>
			<Button href="/dashboard/talent/franchise-payouts">Franchise Payouts</Button>
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
		<div class="bg-slate-800 p-6 rounded-lg border border-slate-600">
			<div class="text-sm text-slate-400">Total Talent</div>
			<div class="text-3xl font-bold text-white">{data.overallStats.totalTalent}</div>
		</div>
		<div class="bg-green-900/50 p-6 rounded-lg border border-green-700">
			<div class="text-sm text-green-400">Active</div>
			<div class="text-3xl font-bold text-green-400">{data.overallStats.activeTalent}</div>
		</div>
		<div class="bg-purple-900/50 p-6 rounded-lg border border-purple-700">
			<div class="text-sm text-purple-400">Players</div>
			<div class="text-3xl font-bold text-purple-400">{data.overallStats.totalPlayers}</div>
		</div>
		<div class="bg-orange-900/50 p-6 rounded-lg border border-orange-700">
			<div class="text-sm text-orange-400">Broadcasters</div>
			<div class="text-3xl font-bold text-orange-400">{data.overallStats.totalBroadcasters}</div>
		</div>
		<div class="bg-cyan-900/50 p-6 rounded-lg border border-cyan-700">
			<div class="text-sm text-cyan-400">Commentators</div>
			<div class="text-3xl font-bold text-cyan-400">{data.overallStats.totalCommentators}</div>
		</div>
		<div class="bg-blue-900/50 p-6 rounded-lg border border-blue-700">
			<div class="text-sm text-blue-400">Analysts</div>
			<div class="text-3xl font-bold text-blue-400">{data.overallStats.totalAnalysts}</div>
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
						placeholder="Search by name, franchise, role..."
						class="flex-1 rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white placeholder-gray-400"
					/>
					{#if searchInput.trim()}
						<Button variant="outline" onclick={() => searchInput = ''}>Clear</Button>
					{/if}
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
				<label class="text-sm font-medium text-gray-300">Talent Type</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					value={data.filters.talentType || ''}
					onchange={(e) => applyFilters({ talentType: e.currentTarget.value || null })}
				>
					<option value="">All Types</option>
					<option value="player">Players</option>
					<option value="broadcaster">Broadcasters</option>
					<option value="commentator">Commentators</option>
					<option value="analyst">Analysts</option>
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
			{#if data.filters.status || data.filters.gender || data.filters.franchise || data.filters.talentType || data.filters.search}
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

	<!-- Talent List -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<div class="p-6 border-b border-gray-700">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-white">
					Talent ({filteredAndSortedTalent.length}{searchInput.trim() ? ` of ${data.talent.length}` : ''})
				</h2>
				<Button href="/dashboard/talent/new" variant="outline">Add Talent</Button>
			</div>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-900 border-b border-gray-700">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('name')}>
								Name
								{#if sortField === 'name'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
							Type
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('franchise')}>
								Franchise
								{#if sortField === 'franchise'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('contact')}>
								Contact
								{#if sortField === 'contact'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 justify-end hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('tournaments')}>
								Tournaments
								{#if sortField === 'tournaments'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 justify-end hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('wins')}>
								Wins
								{#if sortField === 'wins'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-right text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 justify-end hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('earnings')}>
								Earnings
								{#if sortField === 'earnings'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">
							<button type="button" class="flex items-center gap-1 justify-center hover:text-white transition-colors cursor-pointer" onclick={() => toggleSort('status')}>
								Status
								{#if sortField === 'status'}
									{#if sortDirection === 'asc'}<ArrowUp class="w-4 h-4" />{:else}<ArrowDown class="w-4 h-4" />{/if}
								{:else}
									<ArrowUpDown class="w-4 h-4 opacity-30" />
								{/if}
							</button>
						</th>
						<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-700">
					{#each filteredAndSortedTalent as talent}
						<tr class="hover:bg-gray-700/50">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									{#if talent.photo || talent.avatar}
										<img
											src={talent.photo || talent.avatar}
											alt={talent.name}
											class="w-10 h-10 rounded-full object-cover"
										/>
									{:else}
										<div
											class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 font-semibold text-sm"
										>
											{talent.name.charAt(0)}
										</div>
									{/if}
									<div>
										<div class="font-medium text-white">{talent.name}</div>
										{#if talent.nickname}
											<div class="text-xs text-gray-400">"{talent.nickname}"</div>
										{:else if talent.country}
											<div class="text-xs text-gray-400">{talent.country}</div>
										{/if}
									</div>
								</div>
							</td>
							<td class="px-4 py-3">
								<Badge class={getTalentTypeColor(talent.talentType[0] || "player")}>{talent.talentType.map(t => getTalentTypeLabel(t)).join(", ")}</Badge>
								{#if talent.gender}
									<span class="ml-2 text-xs {talent.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}">
										{talent.gender === 'male' ? '♂' : '♀'}
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm">
								{#if talent.franchise}
									<a href="/dashboard/franchises/{talent.franchise.id}" class="text-blue-400 hover:underline">
										{talent.franchise.name}
									</a>
								{:else}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-sm">
								{#if talent.email}
									<div class="text-gray-300">{talent.email}</div>
								{/if}
								{#if talent.phone}
									<div class="text-gray-400 text-xs">{talent.phone}</div>
								{/if}
								{#if !talent.email && !talent.phone}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm text-white">
								{#if talent.talentType.includes('player')}
									{talent.tournamentsPlayed || 0}
								{:else}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm font-medium">
								{#if talent.talentType.includes('player')}
									{#if talent.wins && talent.wins > 0}
										<span class="text-yellow-400">🏆 {talent.wins}</span>
									{:else}
										<span class="text-gray-400">0</span>
									{/if}
								{:else}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm font-bold text-white">
								{#if talent.talentType.includes('player')}
									{formatCurrency(talent.totalEarnings || 0)}
								{:else}
									<span class="text-gray-500">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-center">
								<Badge class={getStatusColor(talent.status)}>{talent.status}</Badge>
							</td>
							<td class="px-4 py-3 text-center">
								{#if talent.talentType.includes('player')}
									<Button href="/dashboard/talent/{talent.id}" variant="outline" size="sm">View</Button>
								{:else}
									<Button href="/dashboard/people?search={encodeURIComponent(talent.name)}" variant="outline" size="sm">View</Button>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="p-8 text-center text-gray-400">
								No talent found. Try adjusting your filters.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Recent Tournaments (Collapsible) -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<button
			class="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors"
			onclick={() => tournamentsExpanded = !tournamentsExpanded}
		>
			<div class="flex items-center gap-3">
				<h2 class="text-xl font-semibold text-white">Recent Tournaments</h2>
				<span class="text-sm text-gray-400">({data.tournaments.length})</span>
			</div>
			<div class="flex items-center gap-2">
				<Button href="/dashboard/talent/tournaments" variant="outline" onclick={(e) => e.stopPropagation()}>View All</Button>
				{#if tournamentsExpanded}
					<ChevronUp class="w-5 h-5 text-gray-400" />
				{:else}
					<ChevronDown class="w-5 h-5 text-gray-400" />
				{/if}
			</div>
		</button>
		{#if tournamentsExpanded}
			<div class="divide-y divide-gray-700 border-t border-gray-700">
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
		{/if}
	</div>
</div>
