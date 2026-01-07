<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Building2, Users, DollarSign, Plus } from 'lucide-svelte';
	import AddDepartmentModal from '$lib/components/departments/add-department-modal.svelte';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Departments - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold mb-2 tracking-tight">Departments</h1>
			<p class="text-muted-foreground text-base">
				Manage organizational departments and budgets
			</p>
		</div>
		<Button onclick={() => showAddModal = true} class="gap-2">
			<Plus class="size-4" />
			Add Department
		</Button>
	</div>

	<!-- Departments Grid -->
	{#if data.departments.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.departments as department}
				<a href="/dashboard/departments/{department.id}" class="group">
					<Card class="p-5 h-full flex flex-col hover:bg-slate-700 dark:hover:bg-slate-700 hover:text-white transition-colors duration-200 cursor-pointer">
						<div class="flex items-start gap-3 mb-3">
							<div class="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
								<Building2 class="size-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-base font-semibold mb-1 truncate group-hover:text-primary transition-colors">
									{department.name}
								</h3>
								{#if department.code}
									<p class="text-sm text-muted-foreground truncate">{department.code}</p>
								{/if}
							</div>
						</div>
						
						<div class="space-y-2.5">
							{#if department.expand?.headOfDepartment}
								<div class="flex items-center gap-2 text-sm text-muted-foreground">
									<Users class="size-4 flex-shrink-0" />
									<span class="truncate">
										{department.expand.headOfDepartment.firstName} 
										{department.expand.headOfDepartment.lastName}
									</span>
								</div>
							{/if}

							{#if department.annualBudget}
								<div class="flex items-center gap-2 text-sm font-medium">
									<DollarSign class="size-4 flex-shrink-0" />
									<span class="truncate">{formatCurrency(department.annualBudget)}</span>
								</div>
							{/if}
						</div>

						{#if department.status === 'inactive'}
							<div class="mt-3 pt-3 border-t">
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
									Inactive
								</span>
							</div>
						{/if}
					</Card>
				</a>
			{/each}
		</div>
	{:else}
		<Card class="p-12">
			<div class="text-center">
				<Building2 class="size-12 mx-auto text-muted-foreground mb-4" />
				<h3 class="text-lg font-semibold mb-2">No departments found</h3>
				<p class="text-muted-foreground mb-4">
					Get started by creating your first department
				</p>
				<Button onclick={() => showAddModal = true} class="gap-2">
					<Plus class="size-4" />
					Add Department
				</Button>
			</div>
		</Card>
	{/if}
</div>

<!-- Add Department Modal -->
<AddDepartmentModal bind:open={showAddModal} allUserProfiles={data.userProfiles} />
