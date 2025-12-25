<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
</script>

<svelte:head>
	<title>Managers - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Managers</h1>
		<Button>Add Manager</Button>
	</div>

	<Card class="p-6">
		<p class="text-slate-600">Manager management interface coming soon...</p>
		<p class="text-slate-600 mt-2">This will display team members from the CSV data with their departments, goals, and contact information.</p>
	</Card>
</div>
