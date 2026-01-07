<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Building2, TrendingUp, TrendingDown } from 'lucide-svelte';

	interface DepartmentBudget {
		id: string;
		name: string;
		budget: number;
		actual: number;
		forecasted: number;
		projectCount: number;
	}

	interface Props {
		departments: DepartmentBudget[];
		phase: string;
	}

	let { departments = [], phase = 'all' }: Props = $props();

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function calculatePercentage(value: number, total: number): number {
		return total > 0 ? (value / total) * 100 : 0;
	}

	let sortedDepartments = $derived(
		[...departments].sort((a, b) => b.actual - a.actual)
	);

	let totalActual = $derived(
		departments.reduce((sum, d) => sum + d.actual, 0)
	);

	let totalForecasted = $derived(
		departments.reduce((sum, d) => sum + d.forecasted, 0)
	);

	let totalBudget = $derived(
		departments.reduce((sum, d) => sum + d.budget, 0)
	);
</script>

<div class="space-y-4">
	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Total Allocated</p>
					<p class="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
				</div>
				<Building2 class="size-8 text-blue-500 opacity-50" />
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Actual Spent</p>
					<p class="text-2xl font-bold">{formatCurrency(totalActual)}</p>
				</div>
				<TrendingDown class="size-8 text-green-500 opacity-50" />
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground">Forecasted</p>
					<p class="text-2xl font-bold">{formatCurrency(totalForecasted)}</p>
				</div>
				<TrendingUp class="size-8 text-orange-500 opacity-50" />
			</div>
		</Card>
	</div>

	<!-- Department Table -->
	<Card class="overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-muted border-b">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
							Department
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							Projects
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							Budget
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							Actual Spent
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							Forecasted
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							% of Total
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#if sortedDepartments.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-8 text-center text-muted-foreground">
								No department data available for this phase
							</td>
						</tr>
					{:else}
						{#each sortedDepartments as dept}
							{@const percentOfTotal = calculatePercentage(dept.actual, totalActual)}
							{@const isOverBudget = dept.actual > dept.budget}
							{@const utilizationRate = calculatePercentage(dept.actual, dept.budget)}
							<tr class="hover:bg-muted/50 transition-colors">
								<td class="px-6 py-4">
									<div class="font-medium">{dept.name}</div>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="text-sm">{dept.projectCount}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="font-medium">{formatCurrency(dept.budget)}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="font-semibold {isOverBudget ? 'text-red-500' : 'text-green-500'}">
										{formatCurrency(dept.actual)}
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="font-medium text-orange-500">
										{formatCurrency(dept.forecasted)}
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="text-sm font-medium">
										{percentOfTotal.toFixed(1)}%
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									{#if isOverBudget}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
											Over Budget
										</span>
									{:else if utilizationRate > 80}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
											High Usage
										</span>
									{:else}
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
											On Track
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</Card>
</div>
