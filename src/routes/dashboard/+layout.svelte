<script lang="ts">
	import type { LayoutData } from './$types';
	import FliHubSidebar from '$lib/components/flihub-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronDown, User, LogOut, Settings, PanelLeft } from 'lucide-svelte';
	import { page } from '$app/stores';
	import {
		ROLE_MENU_CONTROL_ITEMS,
		ROLE_MENU_CONTROL_ROLES,
		type RoleMenuControlRole,
		type RoleMenuVisibility,
	} from '$lib/config/role-menu-controls';

	export let data: LayoutData;

	// Derive a display name from email
	$: displayName = data.user?.email?.split('@')[0] ?? 'User';
	$: initials = displayName.slice(0, 2).toUpperCase();

	// Map current path to a readable breadcrumb label
	const routeLabels: Record<string, string> = {
		'/dashboard': 'Dashboard',
		'/dashboard/sales': 'Franchise Sales',
		'/dashboard/franchise-sales': 'Franchise Forecast',
		'/dashboard/franchises': 'Franchises',
		'/dashboard/sponsors': 'Sponsors',
		'/dashboard/departments': 'Departments',
		'/dashboard/people': 'People',
		'/dashboard/projects': 'Projects',
		'/dashboard/tasks': 'Tasks',
		'/dashboard/manage-media-content': 'Manage Media Content',
		'/dashboard/expenses': 'Expenses',
		'/dashboard/vendors': 'Vendors',
		'/dashboard/approvals': 'Approvals',
		'/dashboard/work-orders': 'Work Orders',
		'/dashboard/sponsor-collections': 'Collections',
		'/dashboard/media': 'Media',
		'/dashboard/league': 'League Logos',
		'/dashboard/talent': 'Talent Management',
		'/dashboard/talent/tournaments': 'Tournaments',
		'/dashboard/events': 'Events',
		'/dashboard/talent/special-events': 'Special Events',
		'/dashboard/talent/franchise-payouts': 'Franchise Payouts',
		'/dashboard/talent/payments': 'Pro Payments',
		'/dashboard/marketing-goals': 'Marketing Goals',
		'/dashboard/managers': 'Manager Dashboard',
		'/dashboard/reimbursements': 'Reimbursements',
		'/dashboard/trademarks': 'Trademark Pipeline',
		'/dashboard/import': 'Import Data',
		'/dashboard/admin': 'Admin Panel',
		'/dashboard/funding-model': 'Funding Model',
		'/dashboard/use-of-proceeds': 'Use of Proceeds',
		'/dashboard/travel-budget': 'Travel Budget',
		'/dashboard/prize-purse': 'Prize Purse',
		'/dashboard/entertainment': 'Entertainment',
		'/dashboard/player-travel': 'Player Travel',
		'/dashboard/stage-production': 'Stage Production',
		'/dashboard/on-course-branding': 'On-Course Branding',
		'/dashboard/legal-budget': 'Legal Budget',
		'/dashboard/advertising': 'Advertising',
		'/dashboard/stadium-course': 'Stadium Course #1',
		'/dashboard/sponsorship-revenue': 'Sponsorship Revenue',
		'/dashboard/bag-licensing': 'Bag Licensing',
		'/dashboard/disc-licensing': 'Disc Licensing',
		'/dashboard/fantasy-gaming': 'Fantasy & Gaming',
		'/dashboard/streaming-media': 'Streaming & Media',
		'/dashboard/league-licensing': 'League Licensing',
		'/dashboard/onboarding': 'Onboarding',
		'/dashboard/player-profile': 'Player Profile',
		'/dashboard/settings': 'Settings',
		'/dashboard/income':           'Income Pipeline',
		'/dashboard/bank-accounts':    'Manage Bank Accounts',
		'/dashboard/active-goals':     'Active Goals',
		'/dashboard/manage-media-content': 'Manage Media Content',
		'/dashboard/bids':             'Bid Pipeline',
		'/dashboard/purchase-orders':  'Purchase Orders',
		'/dashboard/continuous-improvements': 'Continuous Improvements'
	};

	$: currentLabel = routeLabels[$page.url.pathname] ?? 'Dashboard';
	$: settingsEmailStatus = data.sidebarNotes?.['/dashboard/settings'] ?? '';
	$: role = String(data.userProfile?.role ?? '').toLowerCase();
	$: roleMenuVisibility = (data.roleMenuVisibility as RoleMenuVisibility | null) ?? {};

	const defaultHeaderQuickLinkUrls = [
		'/dashboard',
		'/dashboard/projects',
		'/dashboard/approvals',
		'/dashboard/work-orders',
		'/dashboard/sponsors',
		'/dashboard/campaigns',
		'/dashboard/events',
		'/dashboard/settings',
		'/dashboard/reimbursements',
		'/dashboard/my-payments',
		'/dashboard/onboarding',
		'/dashboard/player-profile',
		'/dashboard/talent/tournaments',
		'/dashboard/talent/special-events',
		'/dashboard/sales'
	];

	const roleHeaderQuickLinkPriority: Record<string, string[]> = {
		pro: [
			'/dashboard/my-payments',
			'/dashboard/onboarding',
			'/dashboard/player-profile',
			'/dashboard/talent/tournaments',
			'/dashboard/talent/special-events'
		],
		manager: [
			'/dashboard/my-payments',
			'/dashboard/onboarding',
			'/dashboard/player-profile',
			'/dashboard/reimbursements',
			'/dashboard/talent/tournaments'
		],
		broadcaster: [
			'/dashboard/my-payments',
			'/dashboard/onboarding',
			'/dashboard/player-profile',
			'/dashboard/talent/tournaments',
			'/dashboard/events'
		],
		sales: [
			'/dashboard/sales',
			'/dashboard/sponsors',
			'/dashboard/reimbursements',
			'/dashboard/projects',
			'/dashboard/settings'
		],
		marketing: [
			'/dashboard/campaigns',
			'/dashboard/sponsors',
			'/dashboard/projects',
			'/dashboard/reimbursements',
			'/dashboard/settings'
		],
		marketing_lead: [
			'/dashboard/campaigns',
			'/dashboard/sponsors',
			'/dashboard/projects',
			'/dashboard/approvals',
			'/dashboard/settings'
		],
		leader: [
			'/dashboard/projects',
			'/dashboard/approvals',
			'/dashboard/work-orders',
			'/dashboard/events',
			'/dashboard/sponsors'
		],
		admin: [
			'/dashboard/projects',
			'/dashboard/approvals',
			'/dashboard/work-orders',
			'/dashboard/events',
			'/dashboard/sponsors'
		]
	};

	function canSeeRoleControlledUrl(url: string): boolean {
		if (role === 'admin' || role === 'league_owner') return true;
		if (!ROLE_MENU_CONTROL_ROLES.includes(role as RoleMenuControlRole)) return false;

		const controlled = roleMenuVisibility[url];
		if (!controlled) return false;
		return Boolean(controlled[role as RoleMenuControlRole]);
	}

	function getQuickLabel(url: string): string {
		if (url === '/dashboard') return 'Dashboard';
		const controlled = ROLE_MENU_CONTROL_ITEMS.find((item) => item.url === url);
		return controlled?.title ?? routeLabels[url] ?? 'Open';
	}

	$: orderedHeaderQuickLinkUrls = [
		...(roleHeaderQuickLinkPriority[role] ?? []),
		...defaultHeaderQuickLinkUrls
	].filter((url, idx, arr) => arr.indexOf(url) === idx);

	$: headerQuickLinks = orderedHeaderQuickLinkUrls
		.filter((url) => canSeeRoleControlledUrl(url))
		.slice(0, 5)
		.map((url) => ({ url, label: getQuickLabel(url) }));

	function isQuickLinkActive(url: string): boolean {
		const pathname = $page.url.pathname;
		if (url === '/dashboard') return pathname === '/dashboard';
		return pathname === url || pathname.startsWith(`${url}/`);
	}
</script>

<Sidebar.Provider class="h-svh overflow-hidden">
	<FliHubSidebar collapsible="offcanvas" />
	<Sidebar.Inset class="h-svh overflow-hidden">
		<header class="flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
			<div class="flex items-center gap-3 px-4 flex-1 min-w-0">
				<!-- Larger tap target on mobile -->
				<Sidebar.Trigger class="-ms-1 size-9 hover:bg-muted rounded-md transition-colors" />
				<Separator orientation="vertical" class="h-5 opacity-50" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link
								href="/dashboard"
								class="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
							>
								FliHub
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						{#if currentLabel !== 'Dashboard'}
							<Breadcrumb.Item>
								<span class="text-blue-400/80 mx-1">/</span>
							</Breadcrumb.Item>
							<Breadcrumb.Item>
								<Breadcrumb.Page class="text-sm font-semibold text-blue-700">
									{currentLabel}
								</Breadcrumb.Page>
							</Breadcrumb.Item>
						{/if}
					</Breadcrumb.List>
				</Breadcrumb.Root>

				{#if headerQuickLinks.length > 0}
					<div class="hidden md:flex items-center gap-3 min-w-0 overflow-hidden font-serif">
						{#each headerQuickLinks as link}
							<a
								href={link.url}
								class={`inline-flex items-center py-0.5 text-[13px] font-semibold text-emerald-700 underline-offset-4 decoration-2 transition-colors whitespace-nowrap hover:text-emerald-800 hover:underline hover:decoration-emerald-700 ${isQuickLinkActive(link.url) ? 'underline decoration-emerald-500' : 'no-underline decoration-emerald-500/0'}`}
							>
								{link.label}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-3 px-4">
				<form method="POST" action="/auth/logout">
					<button
						type="submit"
						class="hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
						title="Logout"
					>
						<LogOut class="size-4 shrink-0" />
						<span>Logout</span>
					</button>
				</form>
				<Separator orientation="vertical" class="h-5 opacity-30" />
			</div>

			<div class="flex items-center gap-2 px-4">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium
							transition-all duration-150 hover:bg-muted border border-transparent hover:border-border
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<!-- Avatar circle -->
						<span class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white text-xs font-bold shrink-0">
							{initials}
						</span>
						<span class="hidden sm:block text-sm truncate max-w-[140px]">{data.user?.email}</span>
						<ChevronDown class="size-3.5 text-muted-foreground shrink-0" />
					</DropdownMenu.Trigger>

					<DropdownMenu.Content align="end" class="w-52">
						<div class="px-3 py-2 border-b">
							<p class="text-xs font-semibold truncate">{data.user?.email}</p>
							<p class="text-[10px] text-muted-foreground capitalize mt-0.5">
								{data.userProfile?.role ?? 'user'}
							</p>
						</div>
						<DropdownMenu.Item class="gap-2 cursor-pointer p-0">
							<a href="/dashboard/player-profile" class="flex items-center gap-2 w-full px-2 py-1.5">
								<User class="size-4 text-muted-foreground" />
								<span>Profile</span>
							</a>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="gap-2 cursor-pointer p-0">
							<a href="/dashboard/settings" class="flex items-center gap-2 w-full px-2 py-1.5">
								<Settings class="size-4 text-muted-foreground" />
								<span class="flex items-center justify-between w-full gap-2">
									<span>Settings</span>
									{#if settingsEmailStatus}
										<span class="text-[10px] uppercase tracking-wide text-muted-foreground/80">{settingsEmailStatus}</span>
									{/if}
								</span>
							</a>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="gap-2 cursor-pointer p-0">
							<form method="POST" action="/auth/logout" class="w-full">
								<button type="submit" class="flex items-center gap-2 w-full px-2 py-1.5 text-red-500 hover:bg-red-500/10 transition-colors">
									<LogOut class="size-4" />
									<span>Logout</span>
								</button>
							</form>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</header>

		<div data-scroll-root class="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto p-6 min-w-0">
			<slot />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

