<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	
	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<h1 class="text-3xl font-bold mb-2">Dashboard</h1>
	<p class="text-slate-600 mb-8">Welcome to FliHub, {data.user?.email}</p>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<Card class="p-6">
			<h3 class="text-xl font-semibold mb-2">Managers</h3>
			<p class="text-slate-600 mb-4">Team members and departments</p>
			<a 
				href="/dashboard/managers" 
				class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
			>
				View Managers
			</a>
		</Card>

		<Card class="p-6">
			<h3 class="text-xl font-semibold mb-2">Tasks</h3>
			<p class="text-slate-600 mb-4">Business roadmap and checklists</p>
			<a 
				href="/dashboard/tasks" 
				class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
			>
				View Tasks
			</a>
		</Card>

		<Card class="p-6">
			<h3 class="text-xl font-semibold mb-2">People</h3>
			<p class="text-slate-600 mb-4">Contacts, sponsors, partners, and pros</p>
			<a 
				href="/dashboard/people" 
				class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
			>
				View People
			</a>
		</Card>

		<Card class="p-6">
			<h3 class="text-xl font-semibold mb-2">Projects</h3>
			<p class="text-slate-600 mb-4">Tournaments, events, and campaigns</p>
			<a 
				href="/dashboard/projects" 
				class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
			>
				View Projects
			</a>
		</Card>

		<Card class="p-6">
			<h3 class="text-xl font-semibold mb-2">Expenses</h3>
			<p class="text-slate-600 mb-4">Financial tracking and approvals</p>
			<a 
				href="/dashboard/expenses" 
				class="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
			>
				View Expenses
			</a>
		</Card>
	</div>
</div>
