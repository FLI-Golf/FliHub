<script lang="ts">
	import type { LayoutData } from './$types';
	import FliHubSidebar from '$lib/components/flihub-sidebar.svelte';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChevronDown } from 'lucide-svelte';
	
	export let data: LayoutData;
</script>

<Sidebar.Provider>
	<FliHubSidebar />
	<Sidebar.Inset>
		<header class="flex h-16 shrink-0 items-center gap-2 border-b bg-background">
			<div class="flex items-center gap-3 px-6 flex-1">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 h-5" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item>
							<Breadcrumb.Link href="/dashboard" class="font-semibold">FliHub</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			<div class="flex items-center gap-2 px-6">
				<ModeToggle />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="sm" class="gap-2 font-medium">
							<span class="text-sm">{data.user?.email}</span>
							<ChevronDown class="size-4 stroke-[2]" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-48">
						<DropdownMenu.Item>
							<form method="POST" action="/auth/logout" class="w-full">
								<button type="submit" class="w-full text-left font-medium">Logout</button>
							</form>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-6 p-6 pt-6">
			<slot />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
