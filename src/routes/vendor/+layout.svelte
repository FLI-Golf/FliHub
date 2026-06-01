<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { LayoutDashboard, FolderOpen, FileText, LogOut, Building2, ChevronRight, ChevronDown, User } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const vendor  = $derived(data.vendor);
	const profile = $derived(data.profile);
	const user    = $derived((data as any).user);

	const displayName = $derived(user?.email?.split('@')[0] ?? 'Vendor');
	const initials    = $derived(displayName.slice(0, 2).toUpperCase());

	const NAV = [
		{ href: '/vendor/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
		{ href: '/vendor/projects',  label: 'Open Projects', icon: FolderOpen },
		{ href: '/vendor/bids',      label: 'My Bids',       icon: FileText },
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
			{#if profile?.role === 'admin'}
				<a href="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
					<LayoutDashboard class="size-3.5" /> Admin Dashboard
				</a>
			{/if}
			<form method="POST" action="/auth/logout">
				<button type="submit" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors">
					<LogOut class="size-3.5" /> Sign Out
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-auto flex flex-col">

		<!-- Top navbar -->
		<header class="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 h-14 shrink-0">

			<!-- Nav links -->
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

			<!-- Right: vendor name + user dropdown -->
			<div class="flex items-center gap-3">
				{#if vendor}
					<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
						<Building2 class="size-3.5 text-orange-400 shrink-0" />
						<span class="text-xs font-medium text-slate-300 truncate max-w-[160px]">{vendor.name}</span>
					</div>
				{/if}

				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium
						       transition-all hover:bg-slate-800 border border-transparent hover:border-slate-700
						       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
					>
						<span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold shrink-0">
							{initials}
						</span>
						<span class="hidden sm:block text-sm text-slate-300 truncate max-w-[140px]">{user?.email}</span>
						<ChevronDown class="size-3.5 text-slate-500 shrink-0" />
					</DropdownMenu.Trigger>

					<DropdownMenu.Content align="end" class="w-56">
						<!-- Identity header -->
						<div class="px-3 py-2.5 border-b border-border">
							<p class="text-xs font-semibold truncate">{user?.email}</p>
							<p class="text-[10px] text-muted-foreground mt-0.5 capitalize">
								{profile?.role ?? 'vendor'}{vendor ? ` · ${vendor.name}` : ''}
							</p>
						</div>

						{#if profile?.role === 'admin'}
							<DropdownMenu.Item class="gap-2 cursor-pointer p-0">
								<a href="/dashboard" class="flex items-center gap-2 w-full px-2 py-1.5">
									<LayoutDashboard class="size-4 text-muted-foreground" />
									<span>Admin Dashboard</span>
								</a>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
						{/if}

						<div class="px-1 pb-1 pt-1">
							<form method="POST" action="/auth/logout">
								<button
									type="submit"
									class="flex w-full items-center gap-2 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 px-3 py-2 text-sm font-semibold text-white transition-colors"
								>
									<LogOut class="size-4 shrink-0" />
									Sign Out
								</button>
							</form>
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</header>

		<div class="flex-1 max-w-5xl mx-auto w-full px-8 py-8">
			{@render children()}
		</div>
	</main>

</div>
