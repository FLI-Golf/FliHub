<script lang="ts">
	import type { LayoutData } from './$types';
	import FliHubSidebar from '$lib/components/flihub-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronDown, User, LogOut, Settings } from 'lucide-svelte';
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
		'/dashboard/media': 'Media',
		'/dashboard/league': 'League Overview',
		'/dashboard/talent': 'Talent Management',
		'/dashboard/talent/tournaments': 'Tournaments',
		'/dashboard/talent/special-events': 'Special Events',
		'/dashboard/talent/franchise-payouts': 'Franchise Payouts',
		'/dashboard/talent/payments': 'Pro Payments',
		'/dashboard/marketing-goals': 'Marketing Goals',
		'/dashboard/managers': 'Manager Dashboard',
		'/dashboard/schema-guide': 'Schema Guide',
		'/dashboard/admin': 'Admin Panel'
	};

	$: currentLabel = routeLabels[$page.url.pathname] ?? 'Dashboard';
</script>

<Sidebar.Provider>
	<FliHubSidebar />
	<Sidebar.Inset>
		<header class="flex h-14 shrink-0 items-center gap-2 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
			<div class="flex items-center gap-3 px-4 flex-1 min-w-0">
				<Sidebar.Trigger class="-ms-1 hover:bg-muted rounded-md transition-colors" />
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
						<DropdownMenu.Item class="gap-2 cursor-pointer">
							<User class="size-4 text-muted-foreground" />
							<span>Profile</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="gap-2 cursor-pointer">
							<Settings class="size-4 text-muted-foreground" />
							<span>Settings</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item class="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
							<LogOut class="size-4" />
							<form method="POST" action="/auth/logout" class="w-full">
								<button type="submit" class="w-full text-left">Logout</button>
							</form>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</header>

		<div class="flex flex-1 flex-col gap-6 p-6">
			<slot />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
