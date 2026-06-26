<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { ModeWatcher } from 'mode-watcher';
</script>

{#if browser}
	<ModeWatcher defaultMode="dark" />
{/if}
<slot />
