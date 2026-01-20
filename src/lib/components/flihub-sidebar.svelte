<script lang="ts" module>
	import {
		LayoutDashboard,
		Users,
		ListTodo,
		Store,
		FolderKanban,
		Receipt,
		Building2,
		CheckSquare,
		Trophy,
		Award,
		TrendingUp,
		Star,
		UserCircle,
		Network,
		Target
	} from 'lucide-svelte';

	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: LayoutDashboard
			},
			{
				title: 'Sponsors',
				url: '/dashboard/sponsors',
				icon: Star,
				roles: ['sales', 'admin']
			},
			{
				title: 'Franchise Sales Overview',
				url: '/dashboard/sales',
				icon: TrendingUp,
				roles: ['sales', 'admin']
			},
			{
				title: 'Franchise Forecast',
				url: '/dashboard/franchise-sales',
				icon: TrendingUp,
				roles: ['sales', 'admin']
			},
			{
				title: 'Marketing Goals',
				url: '/dashboard/marketing-goals',
				icon: Target
			},
			{
				title: 'League',
				url: '/dashboard/league',
				icon: Award
			},
			{
				title: 'Franchises',
				url: '/dashboard/franchises',
				icon: Trophy
			},
			{
				title: 'Talent Management',
				url: '/dashboard/talent',
				icon: UserCircle
			},
			{
				title: 'Manager Dashboard',
				url: '/dashboard/managers',
				icon: Users,
				roles: ['admin']
			},
			{
				title: 'Departments',
				url: '/dashboard/departments',
				icon: Building2
			},
			{
				title: 'People',
				url: '/dashboard/people',
				icon: Users
			},
			{
				title: 'Tasks',
				url: '/dashboard/tasks',
				icon: ListTodo
			},
			{
				title: 'Vendors',
				url: '/dashboard/vendors',
				icon: Store
			},
			{
				title: 'Projects',
				url: '/dashboard/projects',
				icon: FolderKanban
			},
			{
				title: 'Expenses',
				url: '/dashboard/expenses',
				icon: Receipt
			},
			{
				title: 'Approvals',
				url: '/dashboard/approvals',
				icon: CheckSquare
			},
			{
				title: 'Schema Guide',
				url: '/dashboard/schema-guide',
				icon: Network
			}
		]
	};
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/stores';

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const isActive = (url: string) => $page.url.pathname === url;
	
	// Get user role from page data
	const userRole = $derived($page.data?.userProfile?.role || 'leader');
	
	// Filter navigation based on role
	const filteredNav = $derived(data.navMain.filter(item => {
		// Admin sees everything - skip all filters
		if (userRole === 'admin') {
			return true;
		}

		// If item has specific roles, check if user has one of them
		if (item.roles && !item.roles.includes(userRole)) {
			return false;
		}

		if (userRole === 'sales') {
			// Sales reps see: Sponsors, Franchise Sales, Dashboard, Projects, Tasks
			return ['Dashboard', 'Sponsors', 'Franchise Sales', 'Projects', 'Tasks'].includes(item.title);
		}
		if (userRole === 'vendor') {
			// Vendors only see: Dashboard, Projects (their projects), Expenses (their invoices)
			return ['Dashboard', 'Projects', 'Expenses'].includes(item.title);
		}
		if (userRole === 'leader') {
			// Leaders see: Dashboard (their department), Projects, Tasks, Expenses, Approvals, Schema Guide
			return ['Dashboard', 'Projects', 'Tasks', 'Expenses', 'Approvals', 'Schema Guide'].includes(item.title);
		}
		if (userRole === 'pro' || userRole === 'franchise_owner') {
			// Pros and franchise owners see limited views
			return !['People', 'Vendors', 'Approvals', 'Franchise Sales'].includes(item.title);
		}
		// Default: show item
		return true;
	}));
</script>

<Sidebar.Root {...restProps} bind:ref>
	<Sidebar.Header>
		<div class="flex items-center gap-3 px-4 py-4 border-b">
			<div class="flex size-10 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
				<span class="text-xl font-bold">F</span>
			</div>
			<div class="flex flex-col">
				<span class="text-base font-bold tracking-tight">FliHub</span>
				<span class="text-xs text-muted-foreground uppercase tracking-wider">Business OS</span>
			</div>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each filteredNav as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={isActive(item.url)}>
								{#snippet child({ props })}
									{@const Icon = item.icon}
									<a href={item.url} {...props}>
										<Icon class="size-5 stroke-[2]" />
										<span class="font-medium">{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
