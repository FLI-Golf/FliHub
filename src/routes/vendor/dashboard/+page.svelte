<script lang="ts">
	import type { PageData } from './$types';
	import { Building2, FolderOpen, FileText, CheckCircle2, Clock, Star, ArrowRight, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const vendor  = $derived((data as any).vendor);
	const profile = $derived((data as any).profile);
	const stats   = $derived((data as any).stats);
	const bids    = $derived((data as any).bids ?? []);
	const openProjects = $derived((data as any).openProjects ?? []);

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}

	const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
		submitted:    { label: 'Submitted',    color: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
		under_review: { label: 'Under Review', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' },
		shortlisted:  { label: 'Shortlisted',  color: 'bg-violet-900/40 text-violet-300 border-violet-700/50' },
		awarded:      { label: 'Awarded ✓',    color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
		rejected:     { label: 'Not Selected', color: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
	};
</script>

<svelte:head><title>Vendor Dashboard — FliHub</title></svelte:head>

<div class="space-y-8">

	<!-- Welcome header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">
				Welcome back, {profile?.firstName ?? 'Vendor'}
			</h1>
			{#if vendor}
				<div class="flex items-center gap-2 mt-1">
					<Building2 class="size-3.5 text-orange-400" />
					<span class="text-sm text-slate-400">{vendor.name}</span>
					<span class="text-slate-600">·</span>
					<span class="text-xs text-slate-500">{vendor.category ?? ''}</span>
				</div>
			{/if}
		</div>
		<a href="/vendor/projects"
			class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors">
			Browse Projects <ArrowRight class="size-4" />
		</a>
	</div>

	<!-- KPI strip -->
	{#if stats}
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		{#each [
			{ label: 'Open Projects',  value: stats.openProjects, sub: 'available to bid',    color: 'border-l-orange-500',  icon: FolderOpen },
			{ label: 'Total Bids',     value: stats.totalBids,    sub: 'submitted by you',    color: 'border-l-blue-500',    icon: FileText },
			{ label: 'Shortlisted',    value: stats.shortlisted,  sub: 'in final review',     color: 'border-l-violet-500',  icon: Star },
			{ label: 'Awarded',        value: stats.awarded,       sub: 'projects won',        color: 'border-l-emerald-500', icon: CheckCircle2 },
		] as kpi}
			<div class="bg-slate-900 border border-slate-800 border-l-4 {kpi.color} rounded-xl p-5">
				<div class="flex items-center justify-between mb-1">
					<p class="text-xs text-slate-400 uppercase tracking-wide">{kpi.label}</p>
					<svelte:component this={kpi.icon} class="size-3.5 text-slate-600" />
				</div>
				<p class="text-2xl font-bold text-white">{kpi.value}</p>
				<p class="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
			</div>
		{/each}
	</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

		<!-- Recent bids -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-slate-800">
				<h2 class="text-sm font-semibold text-slate-200">Your Recent Bids</h2>
				<a href="/vendor/bids" class="text-xs text-orange-400 hover:underline">View all →</a>
			</div>
			{#if bids.length === 0}
				<div class="px-5 py-10 text-center">
					<FileText class="size-8 text-slate-700 mx-auto mb-3" />
					<p class="text-sm text-slate-500">No bids submitted yet.</p>
					<a href="/vendor/projects" class="mt-2 inline-flex items-center gap-1 text-xs text-orange-400 hover:underline">
						Browse open projects <ArrowRight class="size-3" />
					</a>
				</div>
			{:else}
				<div class="divide-y divide-slate-800">
					{#each bids.slice(0, 5) as bid}
						{@const cfg = STATUS_CONFIG[bid.status] ?? STATUS_CONFIG.submitted}
						<div class="px-5 py-3 flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="text-sm font-medium text-white truncate">
									{bid.expand?.projectId?.name ?? 'Project'}
								</p>
								<p class="text-xs text-slate-500">{bid.amount ? fmt(bid.amount) : 'No amount'} · {bid.timeline ?? '—'}</p>
							</div>
							<span class="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border {cfg.color}">
								{cfg.label}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Open projects -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
			<div class="flex items-center justify-between px-5 py-4 border-b border-slate-800">
				<h2 class="text-sm font-semibold text-slate-200">Open for Bidding</h2>
				<a href="/vendor/projects" class="text-xs text-orange-400 hover:underline">View all →</a>
			</div>
			{#if openProjects.length === 0}
				<div class="px-5 py-10 text-center">
					<FolderOpen class="size-8 text-slate-700 mx-auto mb-3" />
					<p class="text-sm text-slate-500">No projects open for bidding right now.</p>
					<p class="text-xs text-slate-600 mt-1">Check back soon — new projects are added regularly.</p>
				</div>
			{:else}
				<div class="divide-y divide-slate-800">
					{#each openProjects.slice(0, 5) as project}
						<a href="/vendor/projects/{project.id}"
							class="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/50 transition-colors group">
							<div class="min-w-0">
								<p class="text-sm font-medium text-white truncate group-hover:text-orange-300 transition-colors">{project.name}</p>
								<p class="text-xs text-slate-500 capitalize">{project.type?.replace('_',' ')} · {project.project_budget ? fmt(project.project_budget) + ' budget' : 'Budget TBD'}</p>
							</div>
							<ArrowRight class="size-3.5 text-slate-600 group-hover:text-orange-400 shrink-0 transition-colors" />
						</a>
					{/each}
				</div>
			{/if}
		</div>

	</div>

	<!-- Profile completeness -->
	{#if vendor}
	{@const fields = [
		{ label: 'Company name',  done: !!vendor.name },
		{ label: 'Category',      done: !!vendor.category },
		{ label: 'Phone',         done: !!vendor.phone },
		{ label: 'Website',       done: !!vendor.website },
		{ label: 'About / bio',   done: !!vendor.about },
		{ label: 'Location',      done: !!vendor.location },
	]}
	{@const complete = fields.filter(f => f.done).length}
	{@const pct = Math.round((complete / fields.length) * 100)}
	{#if pct < 100}
	<div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-2">
				<AlertCircle class="size-4 text-yellow-400" />
				<h3 class="text-sm font-semibold text-slate-200">Complete your profile</h3>
			</div>
			<span class="text-xs font-bold text-yellow-400">{pct}%</span>
		</div>
		<div class="w-full h-1.5 bg-slate-800 rounded-full mb-4">
			<div class="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all" style="width:{pct}%"></div>
		</div>
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
			{#each fields as f}
				<div class="flex items-center gap-2 text-xs {f.done ? 'text-slate-500' : 'text-slate-300'}">
					{#if f.done}
						<CheckCircle2 class="size-3.5 text-emerald-500 shrink-0" />
					{:else}
						<Clock class="size-3.5 text-yellow-500 shrink-0" />
					{/if}
					{f.label}
				</div>
			{/each}
		</div>
		<p class="text-xs text-slate-500 mt-3">A complete profile increases your chances of being shortlisted.</p>
	</div>
	{/if}
	{/if}

</div>
