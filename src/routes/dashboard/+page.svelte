<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Users, ListTodo, UserCircle, FolderKanban, Receipt } from 'lucide-svelte';
	
	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-4 py-4">
	<div>
		<h1 class="text-3xl font-bold mb-2">Dashboard</h1>
		<p class="text-muted-foreground">Welcome to FliHub, {data.user?.email}</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<Card class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<Users class="size-5 text-primary" />
				</div>
				<h3 class="text-xl font-semibold">Managers</h3>
			</div>
			<p class="text-muted-foreground mb-4">Team members and departments</p>
			<Button href="/dashboard/managers" class="w-full">View Managers</Button>
		</Card>

		<Card class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<ListTodo class="size-5 text-primary" />
				</div>
				<h3 class="text-xl font-semibold">Tasks</h3>
			</div>
			<p class="text-muted-foreground mb-4">Business roadmap and checklists</p>
			<Button href="/dashboard/tasks" class="w-full">View Tasks</Button>
		</Card>

		<Card class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<UserCircle class="size-5 text-primary" />
				</div>
				<h3 class="text-xl font-semibold">People</h3>
			</div>
			<p class="text-muted-foreground mb-4">Contacts, sponsors, partners, and pros</p>
			<Button href="/dashboard/people" class="w-full">View People</Button>
		</Card>

		<Card class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<FolderKanban class="size-5 text-primary" />
				</div>
				<h3 class="text-xl font-semibold">Projects</h3>
			</div>
			<p class="text-muted-foreground mb-4">Tournaments, events, and campaigns</p>
			<Button href="/dashboard/projects" class="w-full">View Projects</Button>
		</Card>

		<Card class="p-6">
			<div class="flex items-center gap-3 mb-4">
				<div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<Receipt class="size-5 text-primary" />
				</div>
				<h3 class="text-xl font-semibold">Expenses</h3>
			</div>
			<p class="text-muted-foreground mb-4">Financial tracking and approvals</p>
			<Button href="/dashboard/expenses" class="w-full">View Expenses</Button>
		</Card>
	</div>
</div>
