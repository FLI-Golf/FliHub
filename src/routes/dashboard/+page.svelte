<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Users, ListTodo, UserCircle, FolderKanban, Receipt, Shield, Settings } from 'lucide-svelte';
	
	export let data: PageData;
	
	$: role = data.userProfile?.role || 'leader';
	$: isAdmin = role === 'admin';
	$: userName = data.userProfile ? `${data.userProfile.firstName} ${data.userProfile.lastName}` : data.user?.email;
</script>

<svelte:head>
	<title>Dashboard - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-4xl font-bold mb-2 tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground text-base">Welcome to FliHub, {userName}</p>
		{#if isAdmin}
			<div class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
				<Shield class="size-4" />
				Administrator
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<Card class="p-6 hover:shadow-lg transition-shadow border-2 {isAdmin ? 'border-primary/50' : ''}">
			<div class="flex items-center gap-4 mb-4">
				<div class="flex size-12 items-center justify-center rounded-xl {isAdmin ? 'bg-primary text-primary-foreground' : 'bg-black dark:bg-white text-white dark:text-black'}">
					<Users class="size-6 stroke-[2]" />
				</div>
				<h3 class="text-xl font-bold">{isAdmin ? 'Managers - Update Role' : 'Managers'}</h3>
			</div>
			<p class="text-muted-foreground mb-6">
				{isAdmin ? 'Manage user roles and permissions' : 'Team members and departments'}
			</p>
			<Button href="/dashboard/managers" class="w-full font-semibold">
				{isAdmin ? 'Manage Users' : 'View Managers'}
			</Button>
		</Card>

		{#if !isAdmin}
			<Card class="p-6 hover:shadow-lg transition-shadow border-2">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
						<ListTodo class="size-6 stroke-[2]" />
					</div>
					<h3 class="text-xl font-bold">Tasks</h3>
				</div>
				<p class="text-muted-foreground mb-6">Business roadmap and checklists</p>
				<Button href="/dashboard/tasks" class="w-full font-semibold">View Tasks</Button>
			</Card>

			<Card class="p-6 hover:shadow-lg transition-shadow border-2">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
						<UserCircle class="size-6 stroke-[2]" />
					</div>
					<h3 class="text-xl font-bold">People</h3>
				</div>
				<p class="text-muted-foreground mb-6">Contacts, sponsors, partners, and pros</p>
				<Button href="/dashboard/people" class="w-full font-semibold">View People</Button>
			</Card>

			<Card class="p-6 hover:shadow-lg transition-shadow border-2">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
						<FolderKanban class="size-6 stroke-[2]" />
					</div>
					<h3 class="text-xl font-bold">Projects</h3>
				</div>
				<p class="text-muted-foreground mb-6">Tournaments, events, and campaigns</p>
				<Button href="/dashboard/projects" class="w-full font-semibold">View Projects</Button>
			</Card>

			<Card class="p-6 hover:shadow-lg transition-shadow border-2">
				<div class="flex items-center gap-4 mb-4">
					<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
						<Receipt class="size-6 stroke-[2]" />
					</div>
					<h3 class="text-xl font-bold">Expenses</h3>
				</div>
				<p class="text-muted-foreground mb-6">Financial tracking and approvals</p>
				<Button href="/dashboard/expenses" class="w-full font-semibold">View Expenses</Button>
			</Card>
		{/if}
	</div>
</div>
