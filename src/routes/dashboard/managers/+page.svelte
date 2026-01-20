<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-600 text-white';
			case 'inactive':
				return 'bg-gray-600 text-white';
			case 'pending':
				return 'bg-yellow-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Manager Dashboard</h1>
			<p class="text-gray-400">Manage talent managers and their assignments</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/people?role=manager" variant="outline">View in People</Button>
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="bg-slate-800 p-6 rounded-lg border border-slate-600">
			<div class="text-sm text-slate-400">Total Managers</div>
			<div class="text-3xl font-bold text-white">{data.stats.totalManagers}</div>
		</div>
		<div class="bg-green-900/50 p-6 rounded-lg border border-green-700">
			<div class="text-sm text-green-400">Active</div>
			<div class="text-3xl font-bold text-green-400">{data.stats.activeManagers}</div>
		</div>
		<div class="bg-purple-900/50 p-6 rounded-lg border border-purple-700">
			<div class="text-sm text-purple-400">Managed Talent</div>
			<div class="text-3xl font-bold text-purple-400">{data.stats.totalManagedTalent}</div>
		</div>
		<div class="bg-amber-900/50 p-6 rounded-lg border border-amber-700">
			<div class="text-sm text-amber-400">Unassigned Talent</div>
			<div class="text-3xl font-bold text-amber-400">{data.stats.unassignedTalent}</div>
		</div>
	</div>

	<!-- Managers List -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<div class="p-6 border-b border-gray-700">
			<h2 class="text-xl font-semibold text-white">Managers ({data.managers.length})</h2>
		</div>
		
		{#if data.managers.length === 0}
			<div class="p-8 text-center text-gray-400">
				No managers found. Managers are user profiles with the "manager" role.
			</div>
		{:else}
			<div class="divide-y divide-gray-700">
				{#each data.managers as manager}
					<div class="p-6 hover:bg-gray-700/50">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-4">
								{#if manager.avatar}
									<img
										src={manager.avatar}
										alt={manager.name}
										class="w-12 h-12 rounded-full object-cover"
									/>
								{:else}
									<div class="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white font-semibold">
										{manager.firstName?.charAt(0)}{manager.lastName?.charAt(0)}
									</div>
								{/if}
								<div>
									<div class="font-medium text-white text-lg">{manager.name}</div>
									{#if manager.organization}
										<div class="text-sm text-gray-400">{manager.organization}</div>
									{/if}
									<div class="flex items-center gap-2 mt-1">
										<Badge class={getStatusColor(manager.status)}>{manager.status}</Badge>
										<span class="text-sm text-gray-400">
											Managing {manager.managedTalentCount} talent
										</span>
									</div>
								</div>
							</div>
							<div class="text-right">
								{#if manager.email}
									<div class="text-sm text-gray-300">{manager.email}</div>
								{/if}
								{#if manager.phone}
									<div class="text-sm text-gray-400">{manager.phone}</div>
								{/if}
							</div>
						</div>
						
						{#if manager.managedTalent.length > 0}
							<div class="mt-4 pl-16">
								<div class="text-sm text-gray-400 mb-2">Managed Talent:</div>
								<div class="flex flex-wrap gap-2">
									{#each manager.managedTalent as talent}
										<a 
											href="/dashboard/talent/{talent.id}" 
											class="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm text-white hover:bg-gray-600 transition-colors"
										>
											{talent.name}
											{#if talent.talentType?.includes('player')}
												<span class="text-purple-400">Player</span>
											{/if}
										</a>
									{/each}
								</div>
							</div>
						{:else}
							<div class="mt-4 pl-16 text-sm text-gray-500">
								No talent assigned yet
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Unassigned Talent Section -->
	{#if data.stats.unassignedTalent > 0}
		<div class="bg-amber-900/20 rounded-lg border border-amber-700 p-6">
			<h3 class="text-lg font-semibold text-amber-400 mb-4">Unassigned Talent</h3>
			<p class="text-gray-400 mb-4">
				The following talent do not have a manager assigned. Use the pro_access collection to assign managers.
			</p>
			<div class="flex flex-wrap gap-2">
				{#each data.allTalent.filter(t => !data.managers.some(m => m.managedTalent.some(mt => mt.id === t.id))) as talent}
					<a 
						href="/dashboard/talent/{talent.id}" 
						class="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full text-sm text-white hover:bg-gray-600 transition-colors"
					>
						{talent.name}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
