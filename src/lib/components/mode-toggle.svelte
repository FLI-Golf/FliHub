<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { setMode } from 'mode-watcher';
	import { onMount } from 'svelte';

	let isDark = $state(false);

	onMount(() => {
		// Initialize state
		isDark = document.documentElement.classList.contains('dark');
		
		// Watch for changes to the dark class
		const observer = new MutationObserver(() => {
			isDark = document.documentElement.classList.contains('dark');
		});
		
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		
		return () => observer.disconnect();
	});

	function handleToggle() {
		setMode(isDark ? 'light' : 'dark');
	}
</script>

<button 
	onclick={handleToggle} 
	type="button"
	class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground size-9 relative"
>
	{#if isDark}
		<Moon class="h-[1.2rem] w-[1.2rem]" />
	{:else}
		<Sun class="h-[1.2rem] w-[1.2rem]" />
	{/if}
	<span class="sr-only">Toggle theme</span>
</button>
