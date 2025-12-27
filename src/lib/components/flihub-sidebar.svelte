<script lang="ts" module>
	import {
		LayoutDashboard,
		Users,
		ListTodo,
		Store,
		FolderKanban,
		Receipt
	} from 'lucide-svelte';

	const data = {
		navMain: [
			{
				title: 'Dashboard',
				url: '/dashboard',
				icon: LayoutDashboard
			},
			{
				title: 'Managers',
				url: '/dashboard/managers',
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
					{#each data.navMain as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={isActive(item.url)}>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<svelte:component this={item.icon} class="size-5 stroke-[2]" />
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
