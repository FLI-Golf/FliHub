<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>Projects - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Projects</h1>
		<Button>Add Project</Button>
	</div>

	<Card class="p-6">
		<p class="text-slate-600">Project management interface coming soon...</p>
		<p class="text-slate-600 mt-2">This will track tournaments, events, activations, and campaigns.</p>
	</Card>
</div>
