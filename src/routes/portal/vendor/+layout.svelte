<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { LayoutDashboard, FolderOpen, FileText, LogOut, Building2, ChevronRight, User } from 'lucide-svelte';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const vendor  = $derived(data.vendor);
	const profile = $derived(data.profile);
	const user    = $derived((data as any).user);

	const displayName = $derived(user?.email?.split('@')[0] ?? 'Vendor');
	const initials    = $derived(displayName.slice(0, 2).toUpperCase());

	const NAV = [
		{ href: '/portal/vendor/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
		{ href: '/portal/vendor/projects',  label: 'Open Projects', icon: FolderOpen },
		{ href: '/portal/vendor/bids',      label: 'My Bids',       icon: FileText },
	];
</script>

<div class="min-h-screen bg-slate-950 flex">

	<!-- Sidebar -->
	<aside class="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
		<!-- Logo -->
		<div class="px-5 py-5 border-b border-slate-800">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
					<span class="text-lg font-black text-white">F</span>
				</div>
				<div>
					<p class="text-sm font-bold text-white leading-none">FliHub</p>
					<p class="text-[10px] text-orange-400 uppercase tracking-wider mt-0.5">Vendor Portal</p>
				</div>
			</div>
		</div>

		<!-- Vendor identity -->
		{#if vendor}
			<div class="px-5 py-4 border-b border-slate-800">
				<div class="flex items-center gap-2.5">
					<div class="size-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
						<Building2 class="size-4 text-orange-400" />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold text-white truncate">{vendor.name}</p>
						<p class="text-[10px] text-slate-500 truncate">{vendor.category ?? ''}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Nav -->
		<nav class="flex-1 px-3 py-4 space-y-1">
			{#each NAV as item}
				{@const active = $page.url.pathname === item.href}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
					       {active
					         ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20'
					         : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
				>
					<svelte:component this={item.icon} class="size-4 shrink-0" />
					{item.label}
					{#if active}<ChevronRight class="size-3.5 ml-auto opacity-60" />{/if}
				</a>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="px-3 py-4 border-t border-slate-800 space-y-1">
			<a href="/portal/profile" class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
				<User class="size-3.5" /> My Profile
			</a>
			<form method="POST" action="/auth/logout">
				<button type="submit" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors">
					<LogOut class="size-3.5" /> Sign Out
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-auto flex flex-col">
		<header class="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 h-14 shrink-0">
			<nav class="flex items-center gap-1">
				{#each NAV as item}
					{@const active = $page.url.pathname === item.href}
					<a
						href={item.href}
						class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
						       {active
						         ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20'
						         : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
					>
						<svelte:component this={item.icon} class="size-4 shrink-0" />
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-3">
				{#if vendor}
					<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
						<Building2 class="size-3.5 text-orange-400 shrink-0" />
						<span class="text-xs font-medium text-slate-300 truncate max-w-[160px]">{vendor.name}</span>
					</div>
				{/if}
				<div class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium border border-slate-700 bg-slate-800/60">
					<span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">
						{initials}
					</span>
					<span class="hidden sm:block text-sm text-slate-300 truncate max-w-[180px]">{user?.email}</span>
				</div>
				<form method="POST" action="/auth/logout" class="inline">
					<button type="submit" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-red-950/30">
						<LogOut class="size-3.5 shrink-0" />
						<span class="hidden sm:inline">Sign Out</span>
					</button>
				</form>
			</div>
		</header>

		<div class="flex-1 max-w-5xl mx-auto w-full px-8 py-8">
			{@render children()}
		</div>
	</main>

</div>
