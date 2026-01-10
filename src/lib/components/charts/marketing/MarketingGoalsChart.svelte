<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Target, CheckCircle2, Clock, Circle } from 'lucide-svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';
	
	interface Props {
		total: number;
		completed: number;
		inProgress: number;
		notStarted: number;
		completionRate: number;
	}
	
	let { total, completed, inProgress, notStarted, completionRate }: Props = $props();
	
	const completedPercentage = $derived(total > 0 ? (completed / total) * 100 : 0);
	const inProgressPercentage = $derived(total > 0 ? (inProgress / total) * 100 : 0);
	const notStartedPercentage = $derived(total > 0 ? (notStarted / total) * 100 : 0);
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold">Marketing Goals</h3>
		<Target class="size-5 text-muted-foreground" />
	</div>

	{#if total === 0}
		<div class="text-center text-muted-foreground py-8">
			No marketing goals available
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Total Goals & Completion Rate -->
			<div class="grid grid-cols-2 gap-4 pb-4 border-b">
				<div>
					<p class="text-sm text-muted-foreground mb-1">Total Goals</p>
					<p class="text-3xl font-bold">{total}</p>
				</div>
				<div>
					<p class="text-sm text-muted-foreground mb-1">Completion Rate</p>
					<p class="text-3xl font-bold text-green-600">{completionRate.toFixed(0)}%</p>
				</div>
			</div>

			<!-- Completed Goals -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<CheckCircle2 class="size-4 text-green-600" />
						<span class="text-sm font-medium">Completed</span>
					</div>
					<div class="text-right">
						<span class="text-xl font-bold text-green-600">{completed}</span>
						<span class="text-xs text-muted-foreground ml-2">({completedPercentage.toFixed(0)}%)</span>
					</div>
				</div>
				<ProgressBar value={completedPercentage} max={100} color="green" />
			</div>

			<!-- In Progress Goals -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Clock class="size-4 text-blue-600" />
						<span class="text-sm font-medium">In Progress</span>
					</div>
					<div class="text-right">
						<span class="text-xl font-bold text-blue-600">{inProgress}</span>
						<span class="text-xs text-muted-foreground ml-2">({inProgressPercentage.toFixed(0)}%)</span>
					</div>
				</div>
				<ProgressBar value={inProgressPercentage} max={100} color="blue" />
			</div>

			<!-- Not Started Goals -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Circle class="size-4 text-gray-600" />
						<span class="text-sm font-medium">Not Started</span>
					</div>
					<div class="text-right">
						<span class="text-xl font-bold text-gray-600">{notStarted}</span>
						<span class="text-xs text-muted-foreground ml-2">({notStartedPercentage.toFixed(0)}%)</span>
					</div>
				</div>
				<ProgressBar value={notStartedPercentage} max={100} color="gray" />
			</div>
		</div>
	{/if}
</Card>
