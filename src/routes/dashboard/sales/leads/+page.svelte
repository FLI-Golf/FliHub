<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import {
		ArrowLeft, Plus, Search, User, LayoutGrid, List,
		DollarSign, TrendingUp, Star, AlertCircle, CheckCircle2,
		Building2, MapPin, Zap
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const leads       = $derived(data.leads       ?? []);
	const territories = $derived(data.territories ?? []);
	const userProfiles= $derived(data.userProfiles ?? []);

	// ── View toggle ───────────────────────────────────────────────────────────
	let view = $state<'kanban' | 'table'>('kanban');

	// ── Filters ───────────────────────────────────────────────────────────────
	let search        = $state('');
	let filterStatus  = $state('');
	let filterRep     = $state('');

	// ── Stage advance ─────────────────────────────────────────────────────────
	let moving = $state(false);

	// ── Formatting ────────────────────────────────────────────────────────────
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	}
	function territoryName(id: string) {
		return territories.find((t: any) => t.id === id)?.name ?? '';
	}

	// ── Stage config ──────────────────────────────────────────────────────────
	const STAGES = [
		{ key: 'new',         label: 'New',         colorClass: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		{ key: 'contacted',   label: 'Contacted',   colorClass: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
		{ key: 'qualified',   label: 'Qualified',   colorClass: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		{ key: 'converted',   label: 'Converted',   colorClass: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
	];
	const TERMINAL_STAGES = [
		{ key: 'unqualified', label: 'Unqualified', colorClass: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
		{ key: 'lost',        label: 'Lost',        colorClass: 'bg-red-900/40 text-red-300 border-red-700/50' },
	];
	const ALL_STAGE_COLORS: Record<string, string> = {
		new:         'bg-blue-900/40 text-blue-300 border-blue-700/40',
		contacted:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
		qualified:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
		unqualified: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
		converted:   'bg-violet-900/40 text-violet-300 border-violet-700/40',
		lost:        'bg-red-900/40 text-red-300 border-red-700/40',
	};

	// ── Qual score helpers ────────────────────────────────────────────────────
	function qualColor(score: number) {
		if (score >= 70) return 'text-emerald-400';
		if (score >= 40) return 'text-yellow-400';
		return 'text-red-400';
	}
	function qualLabel(score: number) {
		if (score >= 70) return 'Strong';
		if (score >= 40) return 'Moderate';
		return 'Weak';
	}

	// ── Filtered leads ────────────────────────────────────────────────────────
	const filtered = $derived(leads.filter((l: any) => {
		const q = search.toLowerCase();
		const matchSearch = !q ||
			`${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
			(l.email ?? '').toLowerCase().includes(q) ||
			(l.company ?? '').toLowerCase().includes(q) ||
			(l.location ?? '').toLowerCase().includes(q);
		const matchStatus = !filterStatus || l.status === filterStatus;
		const matchRep    = !filterRep    || l.assignedTo === filterRep;
		return matchSearch && matchStatus && matchRep;
	}));

	// ── PipelineBoard config ──────────────────────────────────────────────────
	const boardConfig: PipelineBoardConfig = {
		columnWidth: 'w-64',
		stages: STAGES,
		terminalStages: TERMINAL_STAGES,
	};

	const boardItems = $derived<PipelineCardItem[]>(
		filtered.map((l: any) => {
			const tags: PipelineCardItem['tags'] = [];

			if (l.qualScore >= 70)
				tags.push({ label: `★ ${qualLabel(l.qualScore)}`, colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' });
			else if (l.qualScore >= 40)
				tags.push({ label: `◑ ${qualLabel(l.qualScore)}`, colorClass: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' });
			else if (l.qualScore > 0)
				tags.push({ label: `○ ${qualLabel(l.qualScore)}`, colorClass: 'bg-red-900/50 text-red-300 border-red-700' });

			if (l.activeOpp)
				tags.push({ label: fmt(l.activeOpp.dealValue ?? 0), colorClass: 'bg-violet-900/50 text-violet-300 border-violet-700' });

			if (l.deal)
				tags.push({ label: 'Deal closed', colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' });

			const metaParts: string[] = [];
			if (l.liquidCapital) metaParts.push(`${fmt(l.liquidCapital)} liquid`);
			if (l.assignedName)  metaParts.push(l.assignedName);

			return {
				id:       l.id,
				title:    `${l.firstName} ${l.lastName}`,
				subtitle: l.company || l.location || undefined,
				status:   l.status,
				href:     `/dashboard/sales/leads/${l.id}`,
				tags,
				meta:     metaParts.join(' · ') || undefined,
			} satisfies PipelineCardItem;
		})
	);

	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;
		moving = true;
		try {
			const res = await fetch(`/api/franchise-leads/${e.item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: e.to }),
			});
			if (!res.ok) throw new Error('Failed');
			await invalidateAll();
		} catch (err) {
			console.error('stage move failed:', err);
		} finally {
			moving = false;
		}
	}

	// ── Summary metrics ───────────────────────────────────────────────────────
	const totalLeads     = $derived(leads.length);
	const qualifiedCount = $derived(leads.filter((l: any) => l.status === 'qualified').length);
	const convertedCount = $derived(leads.filter((l: any) => l.status === 'converted').length);
	const strongCount    = $derived(leads.filter((l: any) => l.qualScore >= 70).length);
</script>

<svelte:head><title>Franchise Leads — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/dashboard/sales" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
				<ArrowLeft class="size-4" />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-white">Franchise Leads</h1>
				<p class="text-slate-400 text-sm mt-0.5">
					{totalLeads} total · {qualifiedCount} qualified · {convertedCount} converted
					{#if data.pipelineValue > 0}
						· <span class="text-violet-300">{fmt(data.pipelineValue)} pipeline value</span>
					{/if}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<!-- View toggle -->
			<div class="flex rounded-lg border border-slate-700 overflow-hidden">
				<button
					onclick={() => view = 'kanban'}
					class="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5
					       {view === 'kanban' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}"
				>
					<LayoutGrid class="size-3.5" /> Pipeline
				</button>
				<button
					onclick={() => view = 'table'}
					class="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5
					       {view === 'table' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}"
				>
					<List class="size-3.5" /> Table
				</button>
			</div>
			<a href="/dashboard/sales/leads/new"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
				<Plus class="size-4" /> Add Lead
			</a>
		</div>
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		{#each [
			{ label: 'Total Leads',   value: totalLeads,     sub: 'in pipeline',          color: 'border-l-blue-500',    icon: User },
			{ label: 'Qualified',     value: qualifiedCount, sub: 'financially screened',  color: 'border-l-emerald-500', icon: CheckCircle2 },
			{ label: 'Strong Fit',    value: strongCount,    sub: 'qual score ≥ 70',       color: 'border-l-yellow-500',  icon: Star },
			{ label: 'Converted',     value: convertedCount, sub: 'deals in progress',     color: 'border-l-violet-500',  icon: TrendingUp },
		] as kpi}
			<Card class="p-4 border-l-4 {kpi.color} bg-slate-800/40">
				<div class="flex items-center justify-between mb-1">
					<p class="text-xs text-slate-400 uppercase tracking-wide">{kpi.label}</p>
					<svelte:component this={kpi.icon} class="size-3.5 text-slate-500" />
				</div>
				<p class="text-2xl font-bold text-white">{kpi.value}</p>
				<p class="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
			</Card>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="relative flex-1 min-w-48 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
			<input bind:value={search} placeholder="Search leads…"
				class="w-full rounded-lg bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
		</div>
		<select bind:value={filterStatus}
			class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
			<option value="">All stages</option>
			{#each [...STAGES, ...TERMINAL_STAGES] as s}
				<option value={s.key}>{s.label} {data.stageCounts?.[s.key] ? `(${data.stageCounts[s.key]})` : ''}</option>
			{/each}
		</select>
		<select bind:value={filterRep}
			class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
			<option value="">All reps</option>
			{#each userProfiles as rep}
				<option value={rep.id}>{rep.firstName} {rep.lastName}</option>
			{/each}
		</select>
		{#if moving}
			<span class="text-xs text-slate-400 animate-pulse">Saving…</span>
		{/if}
	</div>

	<!-- ── KANBAN VIEW ──────────────────────────────────────────────────────── -->
	{#if view === 'kanban'}
		<div>
			<p class="text-xs text-slate-500 mb-3">Drag cards to advance stage · click card to open detail · ★ = strong financial fit</p>
			<PipelineBoard
				config={boardConfig}
				items={boardItems}
				onmove={handleMove}
			/>
		</div>

	<!-- ── TABLE VIEW ───────────────────────────────────────────────────────── -->
	{:else}
		{#if filtered.length === 0}
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 py-16 text-center">
				<User class="size-8 text-slate-600 mx-auto mb-3" />
				<p class="text-slate-400 text-sm">
					{search || filterStatus || filterRep ? 'No leads match your filters.' : 'No leads yet.'}
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
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stage</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Qualification</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Financials</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Territory</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Rep</th>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Opportunity</th>
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
									<span class="px-2 py-0.5 rounded-full text-xs font-medium border {ALL_STAGE_COLORS[lead.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}">
										{lead.status.replace('_',' ')}
									</span>
								</td>
								<td class="px-4 py-3 hidden md:table-cell">
									{#if lead.qualScore > 0}
										<div class="flex items-center gap-2">
											<div class="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
												<div class="h-full rounded-full transition-all
													{lead.qualScore >= 70 ? 'bg-emerald-500' : lead.qualScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}"
													style="width:{lead.qualScore}%">
												</div>
											</div>
											<span class="text-xs font-semibold {qualColor(lead.qualScore)}">{qualLabel(lead.qualScore)}</span>
										</div>
									{:else}
										<span class="text-xs text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 hidden lg:table-cell">
									{#if lead.liquidCapital || lead.netWorth}
										<p class="text-xs text-slate-300">{lead.liquidCapital ? fmt(lead.liquidCapital) : '—'} <span class="text-slate-600">liquid</span></p>
										<p class="text-xs text-slate-500">{lead.netWorth ? fmt(lead.netWorth) : '—'} <span class="text-slate-600">net worth</span></p>
									{:else}
										<span class="text-xs text-slate-600">Not entered</span>
									{/if}
								</td>
								<td class="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
									{territoryName(lead.territory) || '—'}
								</td>
								<td class="px-4 py-3 hidden xl:table-cell text-xs text-slate-400">
									{lead.assignedName || '—'}
								</td>
								<td class="px-4 py-3 hidden xl:table-cell">
									{#if lead.activeOpp}
										<p class="text-xs font-semibold text-violet-300">{fmt(lead.activeOpp.dealValue ?? 0)}</p>
										<p class="text-[10px] text-slate-500 capitalize">{lead.activeOpp.stage?.replace(/_/g,' ')}</p>
									{:else if lead.deal}
										<p class="text-xs font-semibold text-emerald-300">Deal closed</p>
										<p class="text-[10px] text-slate-500">{fmt(lead.deal.totalFranchiseValue ?? 0)}</p>
									{:else}
										<span class="text-xs text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
									{lead.created ? new Date(lead.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
								</td>
								<td class="px-4 py-3 text-right">
									<a href="/dashboard/sales/leads/{lead.id}"
										class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-400 hover:underline whitespace-nowrap">
										View →
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

</div>
