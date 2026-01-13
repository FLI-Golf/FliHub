<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { ArrowLeft, Target, Calendar, TrendingUp, Flag } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const goal = $derived(data.goal);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'In Progress':
				return 'bg-green-600 text-white';
			case 'Completed':
				return 'bg-blue-600 text-white';
			case 'Not Started':
				return 'bg-gray-600 text-white';
			case 'On Hold':
				return 'bg-amber-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'High':
				return 'bg-red-600 text-white';
			case 'Medium':
				return 'bg-amber-600 text-white';
			case 'Low':
				return 'bg-green-600 text-white';
			default:
				return 'bg-gray-600 text-white';
		}
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	// Calculate progress percentage
	const getProgress = (current: number, target: number) => {
		if (!target || target === 0) return 0;
		return Math.min(Math.round((current / target) * 100), 100);
	};

	const progress = $derived(getProgress(goal.currentValue, goal.targetValue));
</script>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button href="/dashboard/marketing-goals" variant="outline" size="sm">
			<ArrowLeft class="size-4 mr-2" />
			Back
		</Button>
	</div>

	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-3 mb-2">
				<Target class="size-8 text-blue-400" />
				<h1 class="text-3xl font-bold text-white">{goal.goalName}</h1>
			</div>
			<p class="text-gray-400">{goal.description || 'No description provided'}</p>
		</div>
		<div class="flex gap-2">
			<Badge class={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
			<Badge class={getStatusColor(goal.status)}>{goal.status}</Badge>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
			<div class="flex items-center gap-3">
				<Calendar class="size-5 text-gray-400" />
				<div>
					<div class="text-sm text-gray-400">Deadline</div>
					<div class="text-lg font-semibold text-white">{formatDate(goal.deadline)}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
			<div class="flex items-center gap-3">
				<Flag class="size-5 text-gray-400" />
				<div>
					<div class="text-sm text-gray-400">Category</div>
					<div class="text-lg font-semibold text-white">{goal.category || 'N/A'}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
			<div class="flex items-center gap-3">
				<TrendingUp class="size-5 text-gray-400" />
				<div>
					<div class="text-sm text-gray-400">Target Metric</div>
					<div class="text-lg font-semibold text-white">{goal.targetMetric || 'N/A'}</div>
				</div>
			</div>
		</div>
		<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
			<div>
				<div class="text-sm text-gray-400">Current / Target</div>
				<div class="text-lg font-semibold text-white">{goal.currentValue || 0} / {goal.targetValue || 0}</div>
			</div>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
		<h3 class="text-lg font-semibold text-white mb-4">Progress</h3>
		<div class="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
			<div 
				class="h-full rounded-full transition-all duration-500 {progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}" 
				style="width: {progress}%"
			></div>
		</div>
		<div class="flex justify-between mt-2 text-sm text-gray-400">
			<span>0</span>
			<span class="text-white font-medium">{progress}% Complete ({goal.currentValue || 0} of {goal.targetValue || 0})</span>
			<span>{goal.targetValue || 0}</span>
		</div>
	</div>

	<!-- Details -->
	<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
		<h3 class="text-lg font-semibold text-white mb-4">Details</h3>
		<div class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<span class="text-gray-400">Created:</span>
				<span class="text-white ml-2">{formatDate(goal.created)}</span>
			</div>
			<div>
				<span class="text-gray-400">Last Updated:</span>
				<span class="text-white ml-2">{formatDate(goal.updated)}</span>
			</div>
			<div>
				<span class="text-gray-400">Status:</span>
				<span class="text-white ml-2">{goal.status}</span>
			</div>
			<div>
				<span class="text-gray-400">Priority:</span>
				<span class="text-white ml-2">{goal.priority}</span>
			</div>
		</div>
	</div>

	{#if goal.description}
		<div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
			<h3 class="text-lg font-semibold text-white mb-4">Description</h3>
			<p class="text-gray-300 whitespace-pre-wrap">{goal.description}</p>
		</div>
	{/if}
</div>
