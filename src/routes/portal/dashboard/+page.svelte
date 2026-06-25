<script lang="ts">
	import type { PageData } from './$types';
	import { PortholeFactory }  from '$lib/domain/porthole/RolePorthole';
	import {
		LayoutDashboard, FolderKanban, FolderOpen, Star, Trophy, Users,
		DollarSign, Upload, Zap, TrendingUp, Target, MapPin, Calendar,
		Film, Tv, Images, CheckSquare, CheckCircle2, Receipt, Briefcase,
		User, FileText, ArrowRight, Clock, Disc,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const config      = $derived((data as any).portalConfig);
	const profile     = $derived((data as any).portalProfile);
	const stats       = $derived((data as any).stats ?? {});
	const role        = $derived((data as any).portalRole ?? 'admin');
	const tournaments = $derived((data as any).tournaments ?? []);

	const porthole = $derived(PortholeFactory.for(role));

	const displayName = $derived(
		[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
		profile?.email?.split('@')[0] ||
		'User'
	);

	const ICON_MAP: Record<string, any> = {
		LayoutDashboard, FolderKanban, FolderOpen, Star, Trophy, Users,
		DollarSign, Upload, Zap, TrendingUp, Target, MapPin, Calendar,
		Film, Tv, Images, CheckSquare, CheckCircle2, Receipt, Briefcase,
		User, FileText,
	};

	function icon(name: string) { return ICON_MAP[name] ?? FileText; }

	/** Map a stat key to its count from server data */
	function statValue(key: string): string {
		const v = (stats as any)[key];
		return v !== undefined ? String(v) : '—';
	}

	/** Accent color classes, split on space */
	const accentText   = $derived(config?.accentTw?.split(' ')[0] ?? 'text-violet-400');
	const accentBorder = $derived(config?.accentTw?.split(' ')[1] ?? 'border-violet-500');

	const STATUS_STYLE: Record<string, string> = {
		scheduled:   'bg-blue-950/50 text-blue-300 border-blue-700/50',
		in_progress: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
		completed:   'bg-slate-800 text-slate-400 border-slate-700',
		cancelled:   'bg-red-950/50 text-red-400 border-red-800/50',
	};
	const STATUS_LABEL: Record<string, string> = {
		scheduled:   'Scheduled',
		in_progress: 'Live Now',
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
</script>

<svelte:head><title>{config?.label ?? 'Portal'} Dashboard — FliHub</title></svelte:head>

<div class="space-y-8">

	<!-- ── Welcome header ── -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border
					{accentBorder} {accentText} bg-slate-900">
					{config?.label} Portal · {config?.userCount} users
				</span>
			</div>
			<h1 class="text-2xl font-bold text-white">{porthole.greet(displayName)}</h1>
			<p class="text-sm text-slate-400 mt-1">{config?.tagline}</p>
		</div>
		<a
			href={config?.primaryAction?.href}
			class="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
				text-white transition-colors bg-gradient-to-r {config?.logoGradient}
				hover:opacity-90 shadow-lg"
		>
			{config?.primaryAction?.label}
			<ArrowRight class="size-4" />
		</a>
	</div>

	<!-- ── KPI strip ── -->
	{#if config?.quickStats?.length}
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each config.quickStats as qs}
				{@const StatIcon = icon(qs.icon)}
				<div class="bg-slate-900 border border-slate-800 border-l-4 {accentBorder} rounded-xl p-5">
					<div class="flex items-center justify-between mb-1">
						<p class="text-xs text-slate-400 uppercase tracking-wide">{qs.label}</p>
						<StatIcon class="size-3.5 {accentText} opacity-60" />
					</div>
					<p class="text-2xl font-bold text-white">{statValue(qs.key)}</p>
					<p class="text-xs text-slate-500 mt-0.5">{qs.sub}</p>
				</div>
			{/each}
		</div>
	{/if}

	<!-- ── Quick nav cards ── -->
	<div>
		<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Access</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
			{#each config?.nav ?? [] as item}
				{@const NavIcon = icon(item.icon)}
				<a
					href={item.href}
					class="group flex flex-col gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800
						hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-150"
				>
					<div class="size-9 rounded-lg bg-gradient-to-br {config.logoGradient} bg-opacity-20
						flex items-center justify-center shadow">
						<NavIcon class="size-4 text-white" />
					</div>
					<div>
						<p class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
							{item.label}
						</p>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- ── Upcoming Tournaments (pro / broadcaster / manager) ── -->
	{#if ['pro', 'broadcaster', 'manager'].includes(role)}
		<div>
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
					<Calendar class="size-3.5" /> Upcoming Tournaments
				</h2>
				<a href="/dashboard/talent/tournaments"
					class="text-xs {accentText} hover:underline flex items-center gap-1">
					Full schedule <ArrowRight class="size-3" />
				</a>
			</div>

			{#if tournaments.length === 0}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-10 text-center">
					<Disc class="size-8 text-slate-700 mx-auto mb-3" />
					<p class="text-sm text-slate-500">No upcoming tournaments scheduled yet.</p>
					<p class="text-xs text-slate-600 mt-1">Check back soon — the schedule is being finalized.</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each tournaments as t}
						{@const statusStyle = STATUS_STYLE[t.status] ?? STATUS_STYLE.scheduled}
						{@const statusLabel = STATUS_LABEL[t.status] ?? t.status}
						{@const isLive      = t.status === 'in_progress'}
						<div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden
							{isLive ? 'ring-1 ring-emerald-500/40' : ''}">

							<!-- Top bar: tournament # + status -->
							<div class="flex items-center justify-between px-5 py-3 border-b border-slate-800">
								<div class="flex items-center gap-2.5">
									{#if isLive}
										<span class="relative flex size-2">
											<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
											<span class="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
										</span>
									{:else}
										<Trophy class="size-3.5 {accentText} opacity-70" />
									{/if}
									<span class="text-sm font-bold text-white">
										{t.tournamentNumber ? `#${t.tournamentNumber} — ` : ''}{t.name}
									</span>
								</div>
								<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border {statusStyle}">
									{statusLabel}
								</span>
							</div>

							<!-- Body: dates, location, prize -->
							<div class="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div>
									<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Start Date</p>
									<p class="text-sm font-semibold text-slate-200">{fmtDate(t.startDate)}</p>
									<p class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
										<Clock class="size-3" /> {daysUntil(t.startDate)}
									</p>
								</div>
								<div>
									<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">End Date</p>
									<p class="text-sm font-semibold text-slate-200">{fmtDate(t.endDate)}</p>
								</div>
								<div>
									<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Location</p>
									<p class="text-sm font-semibold text-slate-200 flex items-center gap-1">
										<MapPin class="size-3 shrink-0 opacity-60" />
										{t.location ?? '—'}
									</p>
									{#if t.venue}
										<p class="text-[11px] text-slate-500 mt-0.5">{t.venue}</p>
									{/if}
								</div>
								<div>
									<p class="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Prize Pool</p>
									<p class="text-sm font-bold {accentText}">
										{t.prizePool > 0 ? fmt(t.prizePool) : 'TBD'}
									</p>
									{#if t.expand?.seasonRef?.name}
										<p class="text-[11px] text-slate-500 mt-0.5">{t.expand.seasonRef.name}</p>
									{:else if t.season}
										<p class="text-[11px] text-slate-500 mt-0.5">Season {t.season}</p>
									{/if}
								</div>
							</div>

							{#if t.description}
								<div class="px-5 pb-4">
									<p class="text-xs text-slate-500 leading-relaxed">{stripHtml(t.description)}</p>
								</div>
							{/if}

							{#if t.notes}
								<div class="px-5 pb-4">
									<p class="text-[11px] text-slate-600 italic">{stripHtml(t.notes)}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ── Role summary footer ── -->
	<div class="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="size-8 rounded-lg bg-gradient-to-br {config?.logoGradient} flex items-center justify-center shrink-0">
				<span class="text-xs font-bold text-white">{config?.label?.slice(0,2).toUpperCase()}</span>
			</div>
			<div>
				<p class="text-sm font-semibold text-slate-200">{config?.label} Porthole</p>
				<p class="text-xs text-slate-500">{config?.userCount} user{config?.userCount !== 1 ? 's' : ''} with this role</p>
			</div>
		</div>
		<form method="POST" action="/auth/logout">
			<button type="submit" class="text-xs text-slate-500 hover:text-rose-400 transition-colors">
				Sign out →
			</button>
		</form>
	</div>

</div>
