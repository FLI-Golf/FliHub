<script lang="ts">
	import type { PageData } from './$types';
	import { Film } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-cyan-400');
</script>
<svelte:head><title>Media Hub — Portal · FliHub</title></svelte:head>
<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Film class="size-6 {accentText}" /> Media Hub
	</h1>
	<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
		<Film class="size-10 text-slate-700 mx-auto mb-3" />
		<p class="text-sm text-slate-500">Media Hub — coming soon.</p>
	</div>
</div>
