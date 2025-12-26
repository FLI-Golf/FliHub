<script lang="ts" module>
	import {
		LayoutDashboard,
		Users,
		ListTodo,
		UserCircle,
		FolderKanban,
		Receipt,
		Upload
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
				title: 'People',
				url: '/dashboard/people',
				icon: UserCircle
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
				title: 'Import Data',
				url: '/dashboard/import',
				icon: Upload
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
		<div class="flex items-center gap-2 px-4 py-2">
			<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<span class="text-lg font-bold">F</span>
			</div>
			<div class="flex flex-col">
				<span class="text-sm font-semibold">FliHub</span>
				<span class="text-xs text-muted-foreground">Business OS</span>
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
									<a href={item.url} {...props} class="flex items-center gap-2">
										<svelte:component this={item.icon} class="size-4" />
										<span>{item.title}</span>
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
