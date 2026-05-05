<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, Plus, Search, User } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const leads       = $derived(data.leads       ?? []);
	const territories = $derived(data.territories ?? []);

	let search       = $state('');
	let filterStatus = $state('');

	const STATUS_COLORS: Record<string,string> = {
		new:         'bg-blue-900/40 text-blue-300 border-blue-700/40',
		contacted:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
		qualified:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
		unqualified: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
		converted:   'bg-violet-900/40 text-violet-300 border-violet-700/40',
		lost:        'bg-red-900/40 text-red-300 border-red-700/40',
	};

	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
	}

	function territoryName(id: string) {
		return territories.find((t: any) => t.id === id)?.name ?? '';
	}

	const filtered = $derived(leads.filter((l: any) => {
		const q = search.toLowerCase();
		const matchSearch = !q ||
			`${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
			(l.email ?? '').toLowerCase().includes(q) ||
			(l.company ?? '').toLowerCase().includes(q) ||
			(l.location ?? '').toLowerCase().includes(q);
		const matchStatus = !filterStatus || l.status === filterStatus;
		return matchSearch && matchStatus;
	}));
</script>

<div class="max-w-5xl mx-auto px-4 py-8 space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/dashboard/sales" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
				<ArrowLeft class="size-4" />
			</a>
			<div>
				<h1 class="text-xl font-bold text-white">Franchise Leads</h1>
				<p class="text-sm text-slate-400">{leads.length} total</p>
			</div>
		</div>
		<a href="/dashboard/sales/leads/new"
			class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
			<Plus class="size-4" /> Add Lead
		</a>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-3">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
			<input bind:value={search} placeholder="Search leads…"
				class="w-full rounded-lg bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
		</div>
		<select bind:value={filterStatus}
			class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
			<option value="">All statuses</option>
			<option value="new">New</option>
			<option value="contacted">Contacted</option>
			<option value="qualified">Qualified</option>
			<option value="unqualified">Unqualified</option>
			<option value="converted">Converted</option>
			<option value="lost">Lost</option>
		</select>
	</div>

	<!-- Table -->
	{#if filtered.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/40 py-16 text-center">
			<User class="size-8 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400 text-sm">
				{search || filterStatus ? 'No leads match your filters.' : 'No leads yet.'}
			</p>
			{#if !search && !filterStatus}
				<a href="/dashboard/sales/leads/new" class="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:underline">
					<Plus class="size-3.5" /> Add your first lead
				</a>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<table class="w-full text-sm">
				<thead class="bg-slate-800/80 border-b border-slate-700">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Territory</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Source</th>
						<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Added</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/60">
					{#each filtered as lead}
						<tr class="bg-slate-800/20 hover:bg-slate-800/60 transition-colors group">
							<td class="px-4 py-3">
								<p class="font-medium text-white">{lead.firstName} {lead.lastName}</p>
								<p class="text-xs text-slate-500">{lead.email}</p>
								{#if lead.company}
									<p class="text-xs text-slate-500">{lead.company}</p>
								{/if}
							</td>
							<td class="px-4 py-3">
								<span class="px-2 py-0.5 rounded-full text-xs font-medium border {STATUS_COLORS[lead.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}">
									{lead.status.replace('_',' ')}
								</span>
							</td>
							<td class="px-4 py-3 hidden md:table-cell text-slate-400 text-xs">
								{territoryName(lead.territory) || '—'}
							</td>
							<td class="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs capitalize">
								{lead.source?.replace('_',' ') ?? '—'}
							</td>
							<td class="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
								{fmtDate(lead.created)}
							</td>
							<td class="px-4 py-3 text-right">
								<a href="/dashboard/sales/leads/{lead.id}"
									class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400 hover:underline">
									View →
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

</div>
