<script lang="ts" module>
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/stores';
	import {
		X,
		PanelLeft,
		LayoutDashboard,
		TrendingUp,
		Users,
		Star,
		MapPin,
		DollarSign,
		Target,
		Building2,
		FolderKanban,
		Receipt,
		Store,
		ListTodo,
		CheckSquare,
		Images,
		UserCircle,
		Trophy,
		Award,
		Medal,
		Flag,
		Megaphone,
		BarChart3,
		ShieldCheck,
		ChevronRight,
		Landmark,
		Plane,
		Music,
		Luggage,
		Mic2,
		Scale,
		Hammer,
		ShoppingBag,
		Disc3,
		Gamepad2,
		Tv,
		PartyPopper,
		FileText,
		Wallet,
		Upload,
		ClipboardList,
		BadgeCheck,
		Zap,
		Monitor,
		ArrowDownLeft,
		Send,
		Plus,
		Ticket
	} from 'lucide-svelte';
	import {
		getDashboardNavGroups,
		type DashboardNavGroup,
		type DashboardNavItem
	} from '$lib/domain/routing/RoleRouteManifest';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = useSidebar();

	const isActive = (url: string) => {
		if (url === '/dashboard/my-payments') {
			return $page.url.pathname === url || $page.url.pathname.startsWith('/dashboard/my-payments/');
		}
		return $page.url.pathname === url;
	};

	const userRole = $derived($page.data?.userProfile?.role || 'admin');
	const iconMap: Record<string, any> = {
		LayoutDashboard,
		TrendingUp,
		Users,
		Star,
		MapPin,
		DollarSign,
		Target,
		Building2,
		FolderKanban,
		Receipt,
		Store,
		ListTodo,
		CheckSquare,
		Images,
		UserCircle,
		Trophy,
		Award,
		Medal,
		Flag,
		Megaphone,
		BarChart3,
		ShieldCheck,
		ChevronRight,
		Landmark,
		Plane,
		Music,
		Luggage,
		Mic2,
		Scale,
		Hammer,
		ShoppingBag,
		Disc3,
		Gamepad2,
		Tv,
		PartyPopper,
		FileText,
		Wallet,
		Upload,
		ClipboardList,
		BadgeCheck,
		Zap,
		Monitor,
		ArrowDownLeft,
		Send,
		Plus,
		Ticket,
	};

	let expandedGroups = $state<Record<string, boolean>>({
		'manager-portal': true,
		onboarding: true,
		overview: true,
		sales: true,
		operations: true,
		league: true,
		marketing: true,
		legal: true,
		finance: true,
		system: true
	});

	function toggleGroup(id: string) {
		expandedGroups[id] = !expandedGroups[id];
	}

	function resolveItemUrl(item: DashboardNavItem): string {
		if (item.url !== '/dashboard/my-payments') return item.url;

		const profile = $page.data?.userProfile;
		if (!profile) return item.url;

		if (userRole === 'pro' || userRole === 'broadcaster') {
			const talentReference = (profile.talentReference || '') as string;
			if (talentReference) return `/dashboard/my-payments/${talentReference}`;
			return profile.id ? `/dashboard/my-payments/${profile.id}` : '/dashboard/my-payments';
		}

		if (userRole === 'manager') {
			return profile.id ? `/dashboard/my-payments/${profile.id}` : item.url;
		}

		return item.url;
	}

	const visibleGroups = $derived(getDashboardNavGroups(userRole));

	function getIconComponent(name: string) {
		return iconMap[name] ?? LayoutDashboard;
	}

	function handleSidebarNavigation(event: MouseEvent, href: string) {
		if (event.defaultPrevented) return;
		if (event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		const anchor = event.currentTarget as HTMLAnchorElement | null;
		if (anchor?.target && anchor.target !== '_self') return;

		event.preventDefault();
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
		window.location.assign(href);
	}
</script>

<Sidebar.Root {...restProps} bind:ref class="bg-sidebar">
	<!-- Brand header -->
	<Sidebar.Header class="shrink-0">
		<div class="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
			<a
				href="/dashboard"
				onclick={(event) => handleSidebarNavigation(event, '/dashboard')}
				class="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
			>
				<div class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shrink-0">
					<span class="text-lg font-black tracking-tighter">F</span>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="text-base font-bold tracking-tight truncate">FliHub</span>
					<span class="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Business OS</span>
				</div>
			</a>
			<!-- Mobile close button inside the sheet -->
			{#if sidebar.isMobile}
				<button
					type="button"
					onclick={() => sidebar.toggle()}
					aria-label="Close navigation"
					class="ml-2 shrink-0 flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
				>
					<X class="size-5" />
				</button>
			{/if}
		</div>
	</Sidebar.Header>

	<!-- flex-1 + min-h-0 + overflow-y-auto ensures the nav scrolls independently -->
	<Sidebar.Content class="px-2 py-2 gap-0 flex-1 h-0 min-h-0 overflow-y-scroll overscroll-contain bg-sidebar">
		{#each visibleGroups as group (group.id)}
			{@const visibleItems = group.items}
			{#if visibleItems.length > 0}
				<div class="mb-0.5">
					<!-- Collapsible group header -->
					<button
						onclick={() => toggleGroup(group.id)}
						class="group/label flex w-full items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150 hover:bg-muted/50 cursor-pointer"
					>
						<span class="text-[10px] font-bold uppercase tracking-widest {group.labelClass} transition-colors">
							{group.title}
						</span>
						<ChevronRight
							class="size-3 {group.labelClass} transition-transform duration-200 {expandedGroups[group.id] ? 'rotate-90' : ''}"
						/>
					</button>

					<!-- Nav items -->
					{#if expandedGroups[group.id]}
						<div class="mt-0.5 space-y-px pl-1">
							{#each visibleItems as item (item.title)}
								{@const active = isActive(item.url)}
								{@const Icon = getIconComponent(item.icon)}
								{@const itemHref = resolveItemUrl(item)}
								<a
									href={itemHref}
									onclick={(event) => handleSidebarNavigation(event, itemHref)}
									class="
										group/item relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium
										transition-all duration-150 border-l-2
										{active
											? `${group.activeClass} ${group.borderClass} shadow-sm`
											: `border-transparent text-muted-foreground ${group.hoverClass}`
										}
									"
								>
									<Icon
										class="size-4 shrink-0 transition-colors duration-150
											{active ? group.iconActiveClass : `${group.iconActiveClass} opacity-50 group-hover/item:opacity-100`}"
									/>
									<span class="truncate leading-none">{item.title}</span>

									{#if item.badge}
										<span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full {group.activeClass}">
											{item.badge}
										</span>
									{/if}
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<div class="my-1.5 mx-2 h-px bg-border/40"></div>
			{/if}
		{/each}
	</Sidebar.Content>

	<!-- Connection status footer -->
	<Sidebar.Footer>
		<div class="px-4 py-3 border-t border-sidebar-border">
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<span class="relative flex size-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
				</span>
				<span>Connected to PocketBase</span>
			</div>
		</div>
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>

<!-- Mobile FAB: fixed bottom-left, only when sidebar is closed on mobile -->
{#if sidebar.isMobile && !sidebar.openMobile}
	<button
		type="button"
		onclick={() => sidebar.toggle()}
		aria-label="Open navigation"
		class="fixed bottom-6 left-4 z-50 flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700 shadow-xl shadow-black/40 px-4 py-3 text-sm font-semibold text-white active:scale-95 transition-transform duration-100"
	>
		<PanelLeft class="size-5 shrink-0" />
		<span>Menu</span>
	</button>
{/if}
