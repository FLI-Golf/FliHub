<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import ScrollToTop from '$lib/components/ui/scroll-to-top.svelte';
</script>

<ModeWatcher defaultMode="dark" />
<slot />
<ScrollToTop />
