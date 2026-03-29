<script lang="ts" module>
	import {
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
		Network,
		ShieldCheck,
		ChevronRight
	} from 'lucide-svelte';

	type NavItem = {
		title: string;
		url: string;
		icon: any;
		roles?: string[];
		badge?: string;
	};

	type NavGroup = {
		id: string;
		title: string;
		labelClass: string;
		activeClass: string;
		hoverClass: string;
		borderClass: string;
		iconActiveClass: string;
		items: NavItem[];
		roles?: string[];
	};

	const navGroups: NavGroup[] = [
		{
			id: 'overview',
			title: 'Overview',
			labelClass: 'text-slate-500 dark:text-slate-400',
			activeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
			hoverClass: 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
			borderClass: 'border-slate-500',
			iconActiveClass: 'text-slate-700 dark:text-slate-200',
			items: [
				{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard }
			]
		},
		{
			id: 'sales',
			title: 'Sales',
			labelClass: 'text-emerald-600 dark:text-emerald-400',
			activeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100',
			hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-100',
			borderClass: 'border-emerald-500',
			iconActiveClass: 'text-emerald-600 dark:text-emerald-400',
			roles: ['sales', 'admin'],
			items: [
				{ title: 'Franchise Sales', url: '/dashboard/sales', icon: TrendingUp, roles: ['sales', 'admin'] },
				{ title: 'Franchise Forecast', url: '/dashboard/franchise-sales', icon: BarChart3, roles: ['sales', 'admin'] },
				{ title: 'Franchises', url: '/dashboard/franchises', icon: Trophy },
				{ title: 'Sponsors', url: '/dashboard/sponsors', icon: Star, roles: ['sales', 'admin'] },
				{ title: 'Territories', url: '/dashboard/sales', icon: MapPin, roles: ['sales', 'admin'] }
			]
		},
		{
			id: 'operations',
			title: 'Operations',
			labelClass: 'text-blue-600 dark:text-blue-400',
			activeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100',
			hoverClass: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-900 dark:hover:text-blue-100',
			borderClass: 'border-blue-500',
			iconActiveClass: 'text-blue-600 dark:text-blue-400',
			items: [
				{ title: 'Departments', url: '/dashboard/departments', icon: Building2 },
				{ title: 'People', url: '/dashboard/people', icon: Users },
				{ title: 'Projects', url: '/dashboard/projects', icon: FolderKanban },
				{ title: 'Tasks', url: '/dashboard/tasks', icon: ListTodo },
				{ title: 'Expenses', url: '/dashboard/expenses', icon: Receipt },
				{ title: 'Vendors', url: '/dashboard/vendors', icon: Store },
				{ title: 'Approvals', url: '/dashboard/approvals', icon: CheckSquare },
				{ title: 'Media', url: '/dashboard/media', icon: Images }
			]
		},
		{
			id: 'league',
			title: 'League Management',
			labelClass: 'text-violet-600 dark:text-violet-400',
			activeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100',
			hoverClass: 'hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-900 dark:hover:text-violet-100',
			borderClass: 'border-violet-500',
			iconActiveClass: 'text-violet-600 dark:text-violet-400',
			items: [
				{ title: 'League Overview', url: '/dashboard/league', icon: Award },
				{ title: 'Talent Management', url: '/dashboard/talent', icon: UserCircle },
				{ title: 'Tournaments', url: '/dashboard/talent/tournaments', icon: Trophy },
				{ title: 'Special Events', url: '/dashboard/talent/special-events', icon: Medal },
				{ title: 'Franchise Payouts', url: '/dashboard/talent/franchise-payouts', icon: DollarSign },
				{ title: 'Pro Payments', url: '/dashboard/talent/payments', icon: Flag }
			]
		},
		{
			id: 'marketing',
			title: 'Marketing',
			labelClass: 'text-orange-600 dark:text-orange-400',
			activeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-100',
			hoverClass: 'hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-900 dark:hover:text-orange-100',
			borderClass: 'border-orange-500',
			iconActiveClass: 'text-orange-600 dark:text-orange-400',
			items: [
				{ title: 'Marketing Goals', url: '/dashboard/marketing-goals', icon: Target },
				{ title: 'Campaigns', url: '/dashboard/marketing-goals', icon: Megaphone },
				{ title: 'Manager Dashboard', url: '/dashboard/managers', icon: Users, roles: ['admin'] }
			]
		},
		{
			id: 'system',
			title: 'System',
			labelClass: 'text-rose-600 dark:text-rose-400',
			activeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100',
			hoverClass: 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-900 dark:hover:text-rose-100',
			borderClass: 'border-rose-500',
			iconActiveClass: 'text-rose-600 dark:text-rose-400',
			roles: ['admin'],
			items: [
				{ title: 'Schema Guide', url: '/dashboard/schema-guide', icon: Network, roles: ['admin'] },
				{ title: 'Admin Panel', url: '/dashboard/admin', icon: ShieldCheck, roles: ['admin'] }
			]
		}
	];
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/stores';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const isActive = (url: string) =>
		$page.url.pathname === url || ($page.url.pathname.startsWith(url + '/') && url !== '/dashboard');

	const userRole = $derived($page.data?.userProfile?.role || 'admin');

	let expandedGroups = $state<Record<string, boolean>>({
		overview: true,
		sales: true,
		operations: true,
		league: true,
		marketing: true,
		system: true
	});

	function toggleGroup(id: string) {
		expandedGroups[id] = !expandedGroups[id];
	}

	function canSeeGroup(group: NavGroup): boolean {
		if (userRole === 'admin') return true;
		if (group.roles && !group.roles.includes(userRole)) return false;
		return true;
	}

	function canSeeItem(item: NavItem): boolean {
		if (userRole === 'admin') return true;
		if (item.roles && !item.roles.includes(userRole)) return false;
		return true;
	}

	const visibleGroups = $derived(navGroups.filter(canSeeGroup));
</script>

<Sidebar.Root {...restProps} bind:ref>
	<!-- Brand header -->
	<Sidebar.Header>
		<div class="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
			<div class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shrink-0">
				<span class="text-lg font-black tracking-tighter">F</span>
			</div>
			<div class="flex flex-col min-w-0">
				<span class="text-base font-bold tracking-tight truncate">FliHub</span>
				<span class="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Business OS</span>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-2 gap-0">
		{#each visibleGroups as group (group.id)}
			{@const visibleItems = group.items.filter(canSeeItem)}
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
								{@const Icon = item.icon}
								<a
									href={item.url}
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
											{active ? group.iconActiveClass : 'text-muted-foreground/70 group-hover/item:text-foreground/80'}"
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
