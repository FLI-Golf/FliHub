<script lang="ts">
	import type { PageData } from './$types';
	import { MapPin } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-amber-400');
</script>
<svelte:head><title>Territories — Portal · FliHub</title></svelte:head>
<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<MapPin class="size-6 {accentText}" /> Territories
	</h1>
	<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
		<MapPin class="size-10 text-slate-700 mx-auto mb-3" />
		<p class="text-sm text-slate-500">Territories view — coming soon.</p>
	</div>
</div>
	import type { PageData } from './';
	import { MapPin } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-amber-400');
</script>
<svelte:head><title>Territories — Portal · FliHub</title></svelte:head>
<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<MapPin class="size-6 {accentText}" /> Territories
	</h1>
	<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
		<MapPin class="size-10 text-slate-700 mx-auto mb-3" />
		<p class="text-sm text-slate-500">Territories view coming soon.</p>
	</div>
</div>
