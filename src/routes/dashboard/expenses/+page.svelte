<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
</script>

<svelte:head>
	<title>Expenses - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Expenses</h1>
		<Button>Add Expense</Button>
	</div>

	<Card class="p-6">
		<p class="text-slate-600">Expense management interface coming soon...</p>
		<p class="text-slate-600 mt-2">This will track expenses, invoices, and payouts.</p>
	</Card>
</div>
