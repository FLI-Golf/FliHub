<script lang="ts">
	import type { PageData } from './$types';
	import { Calendar, MapPin, Trophy, Clock, DollarSign, Disc, ChevronDown } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const config      = $derived((data as any).portalConfig);
	const tournaments = $derived((data as any).tournaments ?? []);
	const role        = $derived((data as any).portalRole ?? 'pro');

	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-emerald-400');

	// Grouping / filtering
	let statusFilter = $state<string>('upcoming');

	const today = new Date().toISOString().split('T')[0];

	const filtered = $derived((() => {
		if (statusFilter === 'upcoming') {
			return tournaments.filter((t: any) =>
				(t.status === 'scheduled' || t.status === 'in_progress') && t.startDate >= today
			);
		}
		if (statusFilter === 'completed') return tournaments.filter((t: any) => t.status === 'completed');
		if (statusFilter === 'live')      return tournaments.filter((t: any) => t.status === 'in_progress');
		return tournaments;
	})());

	const STATUS_STYLE: Record<string, string> = {
		scheduled:   'bg-blue-950/50 text-blue-300 border-blue-700/50',
		in_progress: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
		completed:   'bg-slate-800 text-slate-400 border-slate-700',
		cancelled:   'bg-red-950/50 text-red-400 border-red-800/50',
	};
	const STATUS_LABEL: Record<string, string> = {
		scheduled:   'Scheduled',
		in_progress: '🔴 Live Now',
		completed:   'Completed',
		cancelled:   'Cancelled',
	};

	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		const dateOnly = d.includes('T') ? d.split('T')[0] : d.split(' ')[0];
		const [y, m, day] = dateOnly.split('-').map(Number);
		if (!y || !m || !day) return '—';
		return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function daysUntil(d: string | null | undefined): string {
		if (!d) return '';
		const dateOnly = d.includes('T') ? d.split('T')[0] : d.split(' ')[0];
		const [y, m, day] = dateOnly.split('-').map(Number);
		if (!y || !m || !day) return '';
		const diff = Math.ceil((new Date(y, m - 1, day).getTime() - Date.now()) / 86_400_000);
		if (diff === 0) return 'Today';
		if (diff === 1) return 'Tomorrow';
		if (diff < 0)  return `${Math.abs(diff)}d ago`;
		return `In ${diff} days`;
	}
	function stripHtml(html: string | null | undefined): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	}

	const counts = $derived({
		upcoming:  tournaments.filter((t: any) => (t.status === 'scheduled' || t.status === 'in_progress') && t.startDate >= today).length,
		live:      tournaments.filter((t: any) => t.status === 'in_progress').length,
		completed: tournaments.filter((t: any) => t.status === 'completed').length,
		all:       tournaments.length,
	});

	// Expandable description
	let expanded = $state<Record<string, boolean>>({});
</script>

<svelte:head><title>Tournament Schedule — {config?.label} Portal · FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-white flex items-center gap-2">
			<Trophy class="size-6 {accentText}" />
			Tournament Schedule
		</h1>
		<p class="text-sm text-slate-400 mt-1">{tournaments.length} tournaments total</p>
	</div>

	<!-- Filter tabs -->
	<div class="flex items-center gap-2 flex-wrap">
		{#each [
			{ key: 'upcoming',  label: 'Upcoming',  count: counts.upcoming  },
			{ key: 'live',      label: 'Live Now',   count: counts.live      },
			{ key: 'completed', label: 'Completed',  count: counts.completed },
			{ key: 'all',       label: 'All',        count: counts.all       },
		] as tab}
			<button
				type="button"
				onclick={() => statusFilter = tab.key}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
					{statusFilter === tab.key
						? `${accentText} border-current bg-slate-800`
						: 'text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300'}"
			>
				{tab.label}
				<span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold
					{statusFilter === tab.key ? 'bg-slate-700' : 'bg-slate-800'}">{tab.count}</span>
			</button>
		{/each}
	</div>

	<!-- Tournament list -->
	{#if filtered.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<Disc class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No tournaments in this category yet.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each filtered as t}
				{@const isLive    = t.status === 'in_progress'}
				{@const isDone    = t.status === 'completed'}
				{@const badgeStyle = STATUS_STYLE[t.status] ?? STATUS_STYLE.scheduled}
				{@const badgeLabel = STATUS_LABEL[t.status] ?? t.status}
				{@const isExpanded = !!expanded[t.id]}

				<div class="bg-slate-900 border rounded-xl overflow-hidden
					{isLive ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-slate-800'}">

					<!-- Header row -->
					<div class="flex items-center justify-between px-5 py-4 gap-4">
						<div class="flex items-center gap-3 min-w-0">
							{#if isLive}
								<span class="relative flex size-2.5 shrink-0">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									<span class="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
								</span>
							{:else}
								<Trophy class="size-4 {isDone ? 'text-slate-600' : accentText} shrink-0" />
							{/if}
							<div class="min-w-0">
								<p class="text-sm font-bold text-white truncate">
									{t.tournamentNumber ? `#${t.tournamentNumber} — ` : ''}{t.name}
								</p>
								{#if t.expand?.seasonRef?.name}
									<p class="text-[11px] text-slate-500">{t.expand.seasonRef.name}</p>
								{:else if t.season}
									<p class="text-[11px] text-slate-500">Season {t.season}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border {badgeStyle}">
								{badgeLabel}
							</span>
							<button
								type="button"
								onclick={() => { expanded[t.id] = !expanded[t.id]; expanded = expanded; }}
								class="text-slate-600 hover:text-slate-300 transition-colors"
								aria-label="Toggle details"
							>
								<ChevronDown class="size-4 transition-transform {isExpanded ? 'rotate-180' : ''}" />
							</button>
						</div>
					</div>

					<!-- Data grid (always visible) -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t border-slate-800/60">
						<div class="px-5 py-3 border-r border-slate-800/60">
							<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Start Date</p>
							<p class="text-sm font-semibold text-slate-200">{fmtDate(t.startDate)}</p>
							<p class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
								<Clock class="size-3" />{daysUntil(t.startDate)}
							</p>
						</div>
						<div class="px-5 py-3 border-r border-slate-800/60 sm:border-r">
							<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-1">End Date</p>
							<p class="text-sm font-semibold text-slate-200">{fmtDate(t.endDate)}</p>
						</div>
						<div class="px-5 py-3 border-r border-slate-800/60 border-t border-t-slate-800/60 sm:border-t-0">
							<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Location</p>
							<p class="text-sm font-semibold text-slate-200 flex items-center gap-1">
								<MapPin class="size-3 shrink-0 opacity-50" />{t.location ?? '—'}
							</p>
							{#if t.venue}
								<p class="text-[11px] text-slate-500 mt-0.5">{t.venue}</p>
							{/if}
						</div>
						<div class="px-5 py-3 border-t border-t-slate-800/60 sm:border-t-0">
							<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-1">Prize Pool</p>
							<p class="text-sm font-bold {t.prizePool > 0 ? accentText : 'text-slate-500'}">
								{t.prizePool > 0 ? fmt(t.prizePool) : 'TBD'}
							</p>
						</div>
					</div>

					<!-- Expandable: description + notes -->
					{#if isExpanded && (t.description || t.notes)}
						<div class="px-5 py-4 border-t border-slate-800 space-y-2 bg-slate-900/40">
							{#if t.description}
								<p class="text-sm text-slate-300 leading-relaxed">{stripHtml(t.description)}</p>
							{/if}
							{#if t.notes}
								<p class="text-xs text-slate-500 italic">{stripHtml(t.notes)}</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

</div>
