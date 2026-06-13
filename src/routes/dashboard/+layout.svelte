<script lang="ts">
	import type { LayoutData } from './$types';
	import FliHubSidebar from '$lib/components/flihub-sidebar.svelte';
	import ScrollToTop from '$lib/components/ui/scroll-to-top.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronDown, User, LogOut, Settings, PanelLeft } from 'lucide-svelte';
	import { page } from '$app/stores';

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
		'/dashboard/expenses': 'Expenses',
		'/dashboard/vendors': 'Vendors',
		'/dashboard/approvals': 'Approvals',
		'/dashboard/work-orders': 'Work Orders',
		'/dashboard/sponsor-collections': 'Collections',
		'/dashboard/media': 'Media',
		'/dashboard/league': 'League Overview',
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
		'/dashboard/schema-guide': 'Schema Guide',
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
		'/dashboard/welcome': 'Welcome',
		'/dashboard/onboarding': 'Onboarding',
		'/dashboard/player-profile': 'Player Profile',
		'/dashboard/settings': 'Settings',
		'/dashboard/income':           'Income Pipeline',
		'/dashboard/bank-accounts':    'Manage Bank Accounts',
		'/dashboard/active-goals':     'Active Goals',
		'/dashboard/bids':             'Bid Pipeline',
		'/dashboard/purchase-orders':  'Purchase Orders'
	};

	$: currentLabel = routeLabels[$page.url.pathname] ?? 'Dashboard';
</script>

<Sidebar.Provider class="h-svh overflow-hidden">
	<FliHubSidebar collapsible="none" />
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
								class="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
							>
								FliHub
							</Breadcrumb.Link>
						</Breadcrumb.Item>
						{#if currentLabel !== 'Dashboard'}
							<Breadcrumb.Item>
								<span class="text-muted-foreground/50 mx-1">/</span>
							</Breadcrumb.Item>
							<Breadcrumb.Item>
								<Breadcrumb.Page class="text-sm font-semibold text-foreground">
									{currentLabel}
								</Breadcrumb.Page>
							</Breadcrumb.Item>
						{/if}
					</Breadcrumb.List>
				</Breadcrumb.Root>
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
								<span>Settings</span>
							</a>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<div class="px-1 pb-1">
							<form method="POST" action="/auth/logout">
								<button
									type="submit"
									class="flex w-full items-center gap-2 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 px-3 py-2 text-sm font-semibold text-white transition-colors"
								>
									<LogOut class="size-4 shrink-0" />
									Logout
								</button>
							</form>
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</header>

		<div class="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto p-6 min-w-0">
			<slot />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<ScrollToTop />
