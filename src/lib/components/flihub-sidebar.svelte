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
		PenLine,
		ClipboardList,
		BadgeCheck,
		Zap,
		Monitor,
		ArrowDownLeft,
		Send,
		Plus,
		Ticket
	} from 'lucide-svelte';
import { ROLE_MENU_CONTROL_ROLES, type RoleMenuVisibility } from '$lib/config/role-menu-controls';

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
		// ── My Portal — manager + pro + broadcaster personal section ──
		{
			id: 'manager-portal',
			title: 'My Portal',
			labelClass: 'text-amber-600 dark:text-amber-400',
			activeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100',
			hoverClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-100',
			borderClass: 'border-amber-500',
			iconActiveClass: 'text-amber-600 dark:text-amber-400',
			roles: ['manager', 'pro', 'broadcaster'],
			items: [
				{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'My Payments', url: '/dashboard/my-payments', icon: Wallet, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'My Reimbursements', url: '/dashboard/reimbursements', icon: Receipt, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'Reimbursements Admin', url: '/dashboard/reimbursements/admin', icon: ShieldCheck, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'Import Data', url: '/dashboard/import', icon: Upload, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'My Profile', url: '/dashboard/player-profile', icon: UserCircle, roles: ['manager', 'pro', 'broadcaster'] },
				{ title: 'Settings', url: '/dashboard/settings', icon: BadgeCheck, roles: ['manager', 'pro', 'broadcaster'] },
			]
		},
		// ── My Onboarding — pro, manager, broadcaster ──
		{
			id: 'onboarding',
			title: 'My Onboarding',
			labelClass: 'text-emerald-600 dark:text-emerald-400',
			activeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100',
			hoverClass: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-100',
			borderClass: 'border-emerald-500',
			iconActiveClass: 'text-emerald-600 dark:text-emerald-400',
			roles: ['pro', 'manager', 'broadcaster'],
			items: [
				{ title: 'Documents & Signing', url: '/dashboard/onboarding',         icon: FileText,     roles: ['pro', 'manager', 'broadcaster'] },
				{ title: 'Player Profile',      url: '/dashboard/player-profile',     icon: ClipboardList, roles: ['pro', 'manager', 'broadcaster'] },
				{ title: 'Onboarding Pipeline', url: '/dashboard/onboarding/admin',   icon: FolderKanban, roles: ['admin', 'leader'] }
			]
		},
		{
			id: 'overview',
			title: 'Overview',
			labelClass: 'text-slate-500 dark:text-slate-400',
			activeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
			hoverClass: 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
			borderClass: 'border-slate-500',
			iconActiveClass: 'text-slate-700 dark:text-slate-200',
			roles: ['admin', 'leader', 'sales', 'marketing', 'marketing_lead'],
			items: [
				{ title: 'Dashboard',       url: '/dashboard',                 icon: LayoutDashboard, roles: ['admin', 'leader', 'sales', 'marketing', 'marketing_lead'] },
				{ title: 'Active Projects', url: '/dashboard/active-projects', icon: Zap,             roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Active Goals',    url: '/dashboard/active-goals',    icon: Target,          roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Manage Events',  url: '/dashboard/manage-events',    icon: PartyPopper,     roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Manage Media Content', url: '/dashboard/manage-media-content', icon: Images, roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Manage Bank Accounts', url: '/dashboard/bank-accounts', icon: Landmark, roles: ['admin', 'leader'] },
				{ title: 'Active Income',   url: '/dashboard/active-income',   icon: TrendingUp,      roles: ['admin', 'leader'] }
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
				{ title: 'Sponsors', url: '/dashboard/sponsors', icon: Star, roles: ['sales', 'admin', 'marketing_lead'] },
				{ title: 'Collections', url: '/dashboard/sponsor-collections', icon: DollarSign, roles: ['sales', 'admin', 'marketing_lead'] },
				{ title: 'Active Collections', url: '/dashboard/active-collections', icon: DollarSign, roles: ['admin'] },
				{ title: 'Territories', url: '/dashboard/territories', icon: MapPin, roles: ['sales', 'admin'] }
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
			roles: ['admin', 'leader', 'marketing_lead', 'sales', 'franchise_owner', 'league_owner'],
			items: [
				{ title: 'Departments',          url: '/dashboard/departments',          icon: Building2,    roles: ['admin', 'leader'] },
				{ title: 'People',               url: '/dashboard/people',               icon: Users,        roles: ['admin', 'leader'] },
				{ title: 'Projects',             url: '/dashboard/projects',             icon: FolderKanban, roles: ['admin', 'leader'] },
				{ title: 'Tasks',                url: '/dashboard/tasks',                icon: ListTodo,     roles: ['admin', 'leader'] },
				{ title: 'Expenses',             url: '/dashboard/expenses',             icon: Receipt,      roles: ['admin', 'leader'] },
				{ title: 'Vendors',              url: '/dashboard/vendors',              icon: Store,        roles: ['admin', 'leader'] },
				{ title: 'Bid Pipeline',         url: '/dashboard/bids',                 icon: Send,         roles: ['admin', 'leader'] },
				{ title: 'Purchase Orders',      url: '/dashboard/purchase-orders',      icon: FileText,     roles: ['admin', 'leader'] },
				{ title: 'Approvals',            url: '/dashboard/approvals',            icon: CheckSquare,  roles: ['admin', 'leader'] },
				{ title: 'Work Orders',          url: '/dashboard/work-orders',          icon: ClipboardList, roles: ['admin', 'leader'] },
				{ title: 'Import Data',          url: '/dashboard/import',               icon: Upload,       roles: ['admin', 'leader', 'marketing_lead', 'sales', 'franchise_owner', 'league_owner'] },
				{ title: 'Reimbursements',       url: '/dashboard/reimbursements',       icon: Wallet,       roles: ['admin', 'leader', 'marketing_lead', 'sales', 'franchise_owner', 'league_owner'] },
				{ title: 'Reimbursements Admin', url: '/dashboard/reimbursements/admin', icon: ShieldCheck,  roles: ['admin', 'leader', 'marketing_lead', 'sales', 'franchise_owner', 'league_owner'] },
				{ title: 'Media',                url: '/dashboard/media',                icon: Images,       roles: ['admin', 'leader'] },
				{ title: 'Content Pipeline',     url: '/dashboard/content',              icon: FolderKanban, roles: ['admin', 'leader'] },
				{ title: 'Continuous Improvements', url: '/dashboard/continuous-improvements', icon: Zap, roles: ['admin', 'leader'] }
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
			roles: ['admin', 'leader'],
			items: [
				{ title: 'League Logos',      url: '/dashboard/league',                    icon: Award,       roles: ['admin', 'leader'] },
				{ title: 'Talent Management', url: '/dashboard/talent',                    icon: UserCircle,  roles: ['admin', 'leader'] },
				{ title: 'Tournaments',       url: '/dashboard/talent/tournaments',        icon: Trophy,      roles: ['admin', 'leader'] },
				{ title: 'Events',            url: '/dashboard/events',                    icon: PartyPopper, roles: ['admin', 'leader'] },
				{ title: 'Event Bookings',    url: '/dashboard/events/bookings',           icon: Music,       roles: ['admin', 'leader'] },
				{ title: 'Special Events',    url: '/dashboard/talent/special-events',     icon: Medal,       roles: ['admin', 'leader'] },
				{ title: 'Franchise Payouts', url: '/dashboard/talent/franchise-payouts',  icon: DollarSign,  roles: ['admin', 'leader'] },
				{ title: 'Pro Payments',      url: '/dashboard/talent/payments',           icon: Flag,        roles: ['admin', 'leader'] },
				{ title: 'Payout Testing',    url: '/dashboard/talent/payout-testing',     icon: Zap,         roles: ['admin', 'leader'] },
			]
		},
		{
			id: 'marketing',
			title: 'Marketing',
			roles: ['admin', 'leader', 'marketing', 'marketing_lead'],
			labelClass: 'text-orange-600 dark:text-orange-400',
			activeClass: 'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-100',
			hoverClass: 'hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-900 dark:hover:text-orange-100',
			borderClass: 'border-orange-500',
			iconActiveClass: 'text-orange-600 dark:text-orange-400',
			items: [
				{ title: 'Marketing Goals',  url: '/dashboard/marketing-goals',        icon: Target,      roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Geo Marketing',    url: '/dashboard/geo-marketing',          icon: MapPin,      roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Campaigns',        url: '/dashboard/campaigns',              icon: Megaphone,   roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'New Campaign',     url: '/dashboard/marketing/campaigns/new', icon: Plus,        roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Talent & Ambassadors', url: '/dashboard/marketing/talent',   icon: UserCircle,  roles: ['admin', 'leader', 'marketing', 'marketing_lead'] },
				{ title: 'Manager Dashboard', url: '/dashboard/managers',              icon: Users,       roles: ['admin'] }
			]
		},
		{
			id: 'legal',
			title: 'Legal & IP',
			labelClass: 'text-violet-600 dark:text-violet-400',
			activeClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100',
			hoverClass: 'hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-900 dark:hover:text-violet-100',
			borderClass: 'border-violet-500',
			iconActiveClass: 'text-violet-600 dark:text-violet-400',
			roles: ['admin'],
			items: [
				{ title: 'Trademark Pipeline', url: '/dashboard/trademarks', icon: BadgeCheck, roles: ['admin'] },
				{ title: 'Legal Budget',        url: '/dashboard/legal-budget', icon: Scale,      roles: ['admin'] }
			]
		},
		{
			id: 'finance',
			title: 'Finance',
			labelClass: 'text-amber-600 dark:text-amber-400',
			activeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100',
			hoverClass: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-100',
			borderClass: 'border-amber-500',
			iconActiveClass: 'text-amber-600 dark:text-amber-400',
			roles: ['admin', 'marketing', 'marketing_lead'],
			items: [
				{ title: 'Payments & Income',      url: '/dashboard/payments',                icon: Wallet,       roles: ['admin'] },
				{ title: 'Income Pipeline',        url: '/dashboard/income',                  icon: ArrowDownLeft, roles: ['admin'] },
				{ title: 'Ticket Revenue',         url: '/dashboard/ticket-revenue',          icon: Ticket,        roles: ['admin', 'leader'] },
				{ title: 'Financial Projections',  url: '/dashboard/financial-projections',   icon: BarChart3,    roles: ['admin', 'marketing', 'marketing_lead'] },
				{ title: 'Funding Model',          url: '/dashboard/funding-model',           icon: Landmark,     roles: ['admin'] },
				{ title: 'Use of Proceeds',        url: '/dashboard/use-of-proceeds',         icon: DollarSign,   roles: ['admin', 'marketing', 'marketing_lead'] },
				{ title: 'Travel Budget',          url: '/dashboard/travel-budget',           icon: Plane,        roles: ['admin'] },
				{ title: 'Prize Purse',            url: '/dashboard/prize-purse',             icon: Trophy,       roles: ['admin'] },
				{ title: 'Entertainment',          url: '/dashboard/entertainment',           icon: Music,        roles: ['admin'] },
				{ title: 'Player Travel',          url: '/dashboard/player-travel',           icon: Luggage,      roles: ['admin'] },
				{ title: 'Stage Production',       url: '/dashboard/stage-production',        icon: Mic2,         roles: ['admin'] },
				{ title: 'On-Course Branding',     url: '/dashboard/on-course-branding',      icon: Flag,         roles: ['admin'] },
				{ title: 'Branding Revenue',       url: '/dashboard/on-course-branding/pipeline', icon: TrendingUp,  roles: ['admin', 'leader'] },
				{ title: 'Advertising',            url: '/dashboard/advertising',             icon: Megaphone,    roles: ['admin', 'marketing', 'marketing_lead'] },
				{ title: 'Stadium Course #1',      url: '/dashboard/stadium-course',          icon: Hammer,       roles: ['admin'] },
				{ title: 'Scoreboards',            url: '/dashboard/stadium-course/scoreboards', icon: Monitor,   roles: ['admin'] },
				{ title: 'Sponsorship Revenue',    url: '/dashboard/sponsorship-revenue',     icon: Star,         roles: ['admin', 'marketing', 'marketing_lead'] },
				{ title: 'Bag Licensing',          url: '/dashboard/bag-licensing',           icon: ShoppingBag,  roles: ['admin'] },
				{ title: 'Disc Licensing',         url: '/dashboard/disc-licensing',          icon: Disc3,        roles: ['admin'] },
				{ title: 'Fantasy & Gaming',       url: '/dashboard/fantasy-gaming',          icon: Gamepad2,     roles: ['admin'] },
				{ title: 'Streaming & Media',      url: '/dashboard/streaming-media',         icon: Tv,           roles: ['admin'] },
				{ title: 'League Licensing',       url: '/dashboard/league-licensing',        icon: FileText,     roles: ['admin'] }
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
			roles: ['admin', 'leader', 'marketing_lead', 'sales'],
			items: [
				{ title: 'Admin Panel', url: '/dashboard/admin', icon: ShieldCheck, roles: ['admin'] },
				{ title: '[TEMP] Pipeline Tests', url: '/dashboard/pipeline-tests', icon: Zap, roles: ['admin'] }
			]
		}
	];
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/stores';
	import { X, PanelLeft, ChevronUp } from 'lucide-svelte';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const sidebar = useSidebar();

	const isActive = (url: string) => {
		if (url === '/dashboard/my-payments') {
			return $page.url.pathname === url || $page.url.pathname.startsWith('/dashboard/my-payments/');
		}
		return $page.url.pathname === url;
	};

	const userRole = $derived($page.data?.userProfile?.role || 'admin');
	const roleMenuVisibility = $derived(($page.data?.roleMenuVisibility as RoleMenuVisibility | null) ?? null);

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

	function canSeeGroup(group: NavGroup): boolean {
		if (userRole === 'admin' || userRole === 'league_owner') return true;
		if (group.roles && !group.roles.includes(userRole)) return false;
		return true;
	}

	function canSeeItem(item: NavItem): boolean {
		if (userRole === 'admin' || userRole === 'league_owner') return true;
		if (item.roles && !item.roles.includes(userRole)) return false;

		const controlled = roleMenuVisibility?.[item.url];
		if (controlled) {
			if (!ROLE_MENU_CONTROL_ROLES.includes(userRole as any)) return false;
			return Boolean(controlled[userRole as keyof typeof controlled]);
		}

		return true;
	}

	function resolveItemUrl(item: NavItem): string {
		if (item.url !== '/dashboard/my-payments') return item.url;

		const profile = $page.data?.userProfile;
		if (!profile) return item.url;

		if (userRole === 'pro' || userRole === 'broadcaster') {
			const proReference = (profile.proReference || profile.talentReference || '') as string;
			if (proReference) return `/dashboard/my-payments/${proReference}`;
			return profile.id ? `/dashboard/my-payments/${profile.id}` : '/dashboard/my-payments';
		}

		if (userRole === 'manager') {
			return profile.id ? `/dashboard/my-payments/${profile.id}` : item.url;
		}

		return item.url;
	}

	const visibleGroups = $derived(navGroups.filter(canSeeGroup));
	const sidebarNotes = $derived(($page.data?.sidebarNotes as Record<string, string> | null) ?? {});
	const sidebarNoteLines = $derived(($page.data?.sidebarNoteLines as Record<string, string[]> | null) ?? {});
	const onboardingBadge = $derived(($page.data?.onboardingBadge as string | null) ?? null);
	const playerProfileNote = $derived(($page.data?.playerProfileNote as string | null) ?? null);
	const onboardingPipelineStats = $derived(($page.data?.onboardingPipelineStats as {
		total: number;
		invited: number;
		docsSent: number;
		docsSigned: number;
		approved: number;
		rejected: number;
	} | null) ?? null);

	function getItemInlineNote(item: NavItem): string | null {
		const genericNote = sidebarNotes[item.url];
		if (genericNote) return genericNote;
		if (item.url === '/dashboard/onboarding' && onboardingBadge) return onboardingBadge;
		if (item.url === '/dashboard/player-profile' && playerProfileNote) return playerProfileNote;
		return null;
	}

	function getPillBadge(item: NavItem): string | null {
		return item.badge ?? null;
	}

	function getOnboardingPipelineLines(item: NavItem): string[] {
		const genericLines = sidebarNoteLines[item.url];
		if (genericLines?.length) return genericLines;
		if (item.url !== '/dashboard/onboarding/admin' || !onboardingPipelineStats) return [];
		return [
			`${onboardingPipelineStats.total} total`,
			`${onboardingPipelineStats.invited} invited`,
			`${onboardingPipelineStats.docsSent} docs sent`,
			`${onboardingPipelineStats.docsSigned} docs signed`,
			`${onboardingPipelineStats.approved} approved`,
			`${onboardingPipelineStats.rejected} rejected`
		];
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

	function handleMobileSidebarClose(): void {
		sidebar.setOpenMobile(false);
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
				onclick={handleMobileSidebarClose}
				aria-label="Close navigation"
				class="ml-2 shrink-0 flex items-center justify-center size-9 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-100"
			>
				<X class="size-5" />
			</button>
		{/if}
		</div>
	</Sidebar.Header>

	<!-- flex-1 + min-h-0 + overflow-y-auto ensures the nav scrolls independently -->
	<Sidebar.Content class="px-2 py-2 gap-0 flex-1 h-0 min-h-0 overflow-y-scroll overscroll-contain bg-sidebar">
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
								{@const itemHref = resolveItemUrl(item)}
								{@const itemInlineNote = getItemInlineNote(item)}
								{@const itemBadge = getPillBadge(item)}
								{@const onboardingPipelineLines = getOnboardingPipelineLines(item)}
								<a
									href={itemHref}
									onclick={(event) => handleSidebarNavigation(event, itemHref)}
									class="
										group/item relative flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium
										transition-all duration-150 border-l-2
										{active
											? `${group.activeClass} ${group.borderClass} shadow-sm`
											: `border-transparent text-muted-foreground ${group.hoverClass}`
										}
									"
								>
									<Icon
										class="size-4 shrink-0 mt-0.5 transition-colors duration-150
											{active ? group.iconActiveClass : `${group.iconActiveClass} opacity-50 group-hover/item:opacity-100`}"
									/>
									<div class="min-w-0 flex-1">
										<span class="truncate leading-none block">{item.title}</span>
										{#if itemInlineNote}
											<p class="text-[10px] mt-1 leading-none text-emerald-500 dark:text-emerald-400">
												{itemInlineNote}
											</p>
										{/if}
										{#if onboardingPipelineLines.length > 0}
											<div class="mt-1 space-y-0.5">
												{#each onboardingPipelineLines as line}
													<p class="text-[10px] leading-none text-emerald-500 dark:text-emerald-400">{line}</p>
												{/each}
											</div>
										{/if}
									</div>

									{#if itemBadge && !itemInlineNote}
										<span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full {group.activeClass}">
											{itemBadge}
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
