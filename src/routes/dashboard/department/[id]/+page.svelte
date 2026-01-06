<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	export let data: PageData;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};
</script>

<svelte:head>
	<title>{data.department.name} Dashboard - FliHub</title>
</svelte:head>

<div class="space-y-6">
	<!-- Department Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{data.department.name}</h1>
			{#if data.department.description}
				<p class="text-muted-foreground mt-1">{data.department.description}</p>
			{/if}
			{#if data.department.expand?.headOfDepartment}
				<p class="text-sm text-muted-foreground mt-1">
					Head: {data.department.expand.headOfDepartment.firstName} {data.department.expand.headOfDepartment.lastName}
				</p>
			{/if}
		</div>
		<Button href="/dashboard">View All Departments</Button>
	</div>

	<!-- Metrics Overview -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<Card class="p-6">
			<div class="flex flex-row items-center justify-between space-y-0 pb-2">
				<h3 class="text-sm font-medium">Annual Budget</h3>
			</div>
			<div>
				<div class="text-2xl font-bold">{formatCurrency(data.metrics.budget.total)}</div>
				<p class="text-xs text-muted-foreground">
					{formatCurrency(data.metrics.budget.remaining)} remaining
				</p>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex flex-row items-center justify-between space-y-0 pb-2">
				<h3 class="text-sm font-medium">Total Spent</h3>
			</div>
			<div>
				<div class="text-2xl font-bold">{formatCurrency(data.metrics.budget.spent)}</div>
				<p class="text-xs text-muted-foreground">
					{((data.metrics.budget.spent / data.metrics.budget.total) * 100).toFixed(1)}% of budget
				</p>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex flex-row items-center justify-between space-y-0 pb-2">
				<h3 class="text-sm font-medium">Active Projects</h3>
			</div>
			<div>
				<div class="text-2xl font-bold">{data.metrics.projects.active}</div>
				<p class="text-xs text-muted-foreground">
					{data.metrics.projects.total} total projects
				</p>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex flex-row items-center justify-between space-y-0 pb-2">
				<h3 class="text-sm font-medium">Pending Expenses</h3>
			</div>
			<div>
				<div class="text-2xl font-bold">{data.metrics.expenses.pending}</div>
				<p class="text-xs text-muted-foreground">
					{formatCurrency(data.metrics.expenses.totalAmount)} total
				</p>
			</div>
		</Card>
	</div>

	<!-- Recent Projects -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Recent Projects</h2>
			<Button href="/dashboard/projects" variant="outline" size="sm">View All</Button>
		</div>
		{#if data.projects.length > 0}
			<div class="space-y-4">
				{#each data.projects as project}
					<div class="flex items-center justify-between border-b pb-3 last:border-0">
						<div>
							<a href="/dashboard/projects/{project.id}" class="font-medium hover:underline">
								{project.name}
							</a>
							<p class="text-sm text-muted-foreground">{project.description || 'No description'}</p>
						</div>
						<div class="text-right">
							<div class="text-sm font-medium">{formatCurrency(project.budget || 0)}</div>
							<div class="text-xs text-muted-foreground capitalize">{project.status}</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground text-center py-8">No projects found</p>
		{/if}
	</Card>

	<!-- Recent Tasks and Expenses -->
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Recent Tasks -->
		<Card class="p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">Recent Tasks</h2>
				<Button href="/dashboard/tasks" variant="outline" size="sm">View All</Button>
			</div>
			{#if data.tasks.length > 0}
				<div class="space-y-3">
					{#each data.tasks as task}
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="font-medium text-sm">{task.title}</p>
								<p class="text-xs text-muted-foreground capitalize">{task.status}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center py-8">No tasks found</p>
			{/if}
		</Card>

		<!-- Recent Expenses -->
		<Card class="p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">Recent Expenses</h2>
				<Button href="/dashboard/expenses" variant="outline" size="sm">View All</Button>
			</div>
			{#if data.expenses.length > 0}
				<div class="space-y-3">
					{#each data.expenses as expense}
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-sm">{expense.description || 'No description'}</p>
								<p class="text-xs text-muted-foreground capitalize">{expense.status}</p>
							</div>
							<div class="text-sm font-medium">{formatCurrency(expense.amount || 0)}</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-center py-8">No expenses found</p>
			{/if}
		</Card>
	</div>
</div>
