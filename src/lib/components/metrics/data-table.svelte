<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import type { ComponentType } from 'svelte';
	
	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		component?: ComponentType;
		format?: (value: any) => string;
	}
	
	interface Props {
		columns: Column[];
		data: any[];
		title?: string;
		emptyMessage?: string;
	}
	
	let { columns, data, title, emptyMessage = 'No data available' }: Props = $props();
	
	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	
	function handleSort(column: Column) {
		if (!column.sortable) return;
		
		if (sortKey === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = column.key;
			sortDirection = 'asc';
		}
	}
	
	const sortedData = $derived(() => {
		if (!sortKey) return data;
		
		return [...data].sort((a, b) => {
			const aVal = a[sortKey];
			const bVal = b[sortKey];
			
			if (aVal === bVal) return 0;
			
			const comparison = aVal > bVal ? 1 : -1;
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});
</script>

<Card class="overflow-hidden">
	{#if title}
		<div class="px-6 py-4 border-b">
			<h3 class="text-lg font-semibold">{title}</h3>
		</div>
	{/if}
	
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead class="bg-slate-50 dark:bg-slate-900 border-b">
				<tr>
					{#each columns as column}
						<th 
							class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
							class:cursor-pointer={column.sortable}
							onclick={() => handleSort(column)}
						>
							<div class="flex items-center gap-2">
								{column.label}
								{#if column.sortable && sortKey === column.key}
									<span class="text-primary">
										{sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
				{#if sortedData().length === 0}
					<tr>
						<td colspan={columns.length} class="px-6 py-8 text-center text-muted-foreground">
							{emptyMessage}
						</td>
					</tr>
				{:else}
					{#each sortedData() as row}
						<tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
							{#each columns as column}
								<td class="px-6 py-4 text-sm">
									{#if column.component}
										<svelte:component this={column.component} {...row} />
									{:else if column.format}
										{column.format(row[column.key])}
									{:else}
										{row[column.key] ?? '-'}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</Card>
