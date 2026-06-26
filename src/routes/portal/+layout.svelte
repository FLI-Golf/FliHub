<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import {
		LayoutDashboard, FolderKanban, FolderOpen, Star, Trophy, Users,
		DollarSign, Upload, Zap, TrendingUp, Target, MapPin, Calendar,
		Film, Tv, Images, CheckSquare, CheckCircle2, Receipt, Briefcase,
		User, FileText, LogOut, ChevronRight, Megaphone, Handshake,
	} from 'lucide-svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const config  = $derived((data.portalConfig ?? {}) as any);
	const profile = $derived((data.portalProfile ?? {}) as any);

	const displayName = $derived(
		[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
		profile?.email?.split('@')[0] ||
		(config?.label ?? 'User')
	);
	const initials = $derived(
		displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
	);

	const ICON_MAP: Record<string, any> = {
		LayoutDashboard, FolderKanban, FolderOpen, Star, Trophy, Users,
		DollarSign, Upload, Zap, TrendingUp, Target, MapPin, Calendar,
		Film, Tv, Images, CheckSquare, CheckCircle2, Receipt, Briefcase,
		User, FileText, Megaphone, Handshake,
	};
	function icon(name: string) { return ICON_MAP[name] ?? FileText; }

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		return path === href || (href !== '/portal/dashboard' && path.startsWith(href + '/'));
	}

	const accentText      = $derived(config?.accentTw?.split(' ')[0] ?? 'text-violet-400');
	const accentBorder    = $derived(config?.accentTw?.split(' ')[1] ?? 'border-violet-500');
	const accentColorName = $derived(accentText?.split('-')[1] ?? 'violet');
</script>

<div class="min-h-screen bg-slate-950 flex">

	<!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
	<aside class="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">

		<!-- Logo -->
		<div class="px-5 py-5 border-b border-slate-800">
			<a href={config.primaryAction.href} class="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<div class="size-9 rounded-xl bg-gradient-to-br {config.logoGradient} flex items-center justify-center shadow-lg">
					<span class="text-lg font-black text-white">F</span>
				</div>
				<div>
					<p class="text-sm font-bold text-white leading-none">FliHub</p>
					<p class="text-[10px] uppercase tracking-wider mt-0.5 {accentText} hover:underline cursor-pointer">{config.tagline}</p>
				</div>
			</a>
		</div>

		<!-- User identity -->
		<div class="px-5 py-4 border-b border-slate-800">
			<div class="flex items-center gap-2.5">
				<div class="size-9 rounded-lg bg-gradient-to-br {config.logoGradient} flex items-center justify-center shrink-0 shadow">
					<span class="text-xs font-bold text-white">{initials}</span>
				</div>
				<div class="min-w-0">
					<p class="text-xs font-semibold text-white truncate">{displayName}</p>
					<span class="inline-flex items-center text-[10px] font-bold uppercase tracking-widest
						px-1.5 py-0.5 rounded bg-slate-800 border {accentBorder} {accentText} mt-0.5">
						{config.label}
					</span>
				</div>
			</div>
		</div>

		<!-- Nav -->
		<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
			{#each config.nav as item}
				{@const NavIcon = icon(item.icon)}
				{@const active = isActive(item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
						{active
							? `bg-${accentColorName}-500/15 ${accentText} border border-${accentColorName}-500/20`
							: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
				>
					<NavIcon class="size-4 shrink-0" />
					{item.label}
					{#if active}<ChevronRight class="size-3.5 ml-auto opacity-60" />{/if}
				</a>
			{/each}
		</nav>

		<!-- Footer: sign out -->
		<div class="px-3 py-4 border-t border-slate-800">
			<form method="POST" action="/auth/logout">
				<button type="submit"
					class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500
						hover:text-red-400 hover:bg-red-950/30 transition-colors">
					<LogOut class="size-3.5" /> Sign Out
				</button>
			</form>
		</div>
	</aside>

	<!-- ── Main ─────────────────────────────────────────────────────────────── -->
	<main class="flex-1 overflow-auto flex flex-col">

		<!-- Sticky top navbar -->
		<header class="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800
			flex items-center justify-between px-6 h-14 shrink-0">

			<!-- Nav links -->
			<nav class="flex items-center gap-1">
				{#each config.nav as item}
					{@const NavIcon = icon(item.icon)}
					{@const active = isActive(item.href)}
					<a
						href={item.href}
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
							{active
								? `bg-${accentColorName}-500/15 ${accentText} border border-${accentColorName}-500/20`
								: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
					>
						<NavIcon class="size-4 shrink-0" />
						{item.label}
					</a>
				{/each}

				<!-- Navbar divider -->
				<div class="w-px h-5 bg-slate-700 mx-2"></div>

				<!-- Profile link -->
				<a
					href="/portal/profile"
					class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800"
				>
					<User class="size-4 shrink-0" />
					Profile
				</a>

				<!-- Sign out form -->
				<form method="POST" action="/auth/logout" class="inline">
					<button
						type="submit"
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-red-950/30"
					>
						<LogOut class="size-3.5 shrink-0" />
						Sign Out
					</button>
				</form>
			</nav>

			<div class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium border border-slate-700 bg-slate-800/60">
				<span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br {config.logoGradient} text-white text-xs font-bold shrink-0">
					{initials}
				</span>
				<span class="hidden sm:block text-sm text-slate-300 truncate max-w-[180px]">{displayName}</span>
			</div>
		</header>

		<!-- Page content -->
		<div class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
			{@render children()}
		</div>
	</main>

</div>
