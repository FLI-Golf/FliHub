<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="icon" class="size-9">
			<Sun class="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 stroke-[2]" />
			<Moon class="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 stroke-[2]" />
			<span class="sr-only">Toggle theme</span>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item on:click={() => toggleMode()}>
			<Sun class="size-4 mr-2 stroke-[2]" />
			<span class="font-medium">Light</span>
		</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => toggleMode()}>
			<Moon class="size-4 mr-2 stroke-[2]" />
			<span class="font-medium">Dark</span>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
