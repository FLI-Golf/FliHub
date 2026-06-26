<script lang="ts">
	let { children }: { children: any } = $props();
</script>

<!-- Legacy /vendor routes are now compatibility redirects in +layout.server.ts -->
{@render children()}
