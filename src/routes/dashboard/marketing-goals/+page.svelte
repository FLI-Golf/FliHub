<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { PageData } from './$types';
	import { Target, Plus, TrendingUp, CheckCircle, Clock, Pause, Calendar, Flag, X, ListTodo, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let sheetOpen = $state(false);
	let selectedGoal = $state<any>(null);
	let updating = $state(false);
	let updateSuccess = $state(false);

	function openGoalSheet(goal: any) {
		selectedGoal = goal;
		sheetOpen = true;
	}

	function handleOpenChange(open: boolean) {
		sheetOpen = open;
		if (!open) {
			selectedGoal = null;
		}
	}

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
			month: 'short',
			day: 'numeric'
		});
	};

	// Calculate progress percentage from currentValue and targetValue
	const getProgress = (current: number, target: number) => {
		if (!target || target === 0) return 0;
		return Math.min(Math.round((current / target) * 100), 100);
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Marketing Goals</h1>
			<p class="text-gray-400">Track and manage marketing objectives and campaigns</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/marketing-goals/new">
				<Plus class="size-4 mr-2" />
				New Goal
			</Button>
		</div>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="bg-slate-800 p-6 rounded-lg border border-slate-600">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-slate-700 rounded-lg">
					<Target class="size-5 text-slate-300" />
				</div>
				<div>
					<div class="text-sm text-slate-400">Total Goals</div>
					<div class="text-2xl font-bold text-white">{data.stats.total}</div>
				</div>
			</div>
		</div>
		<div class="bg-green-900/50 p-6 rounded-lg border border-green-700">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-green-800 rounded-lg">
					<TrendingUp class="size-5 text-green-300" />
				</div>
				<div>
					<div class="text-sm text-green-400">In Progress</div>
					<div class="text-2xl font-bold text-green-400">{data.stats.byStatus.inProgress}</div>
				</div>
			</div>
		</div>
		<div class="bg-blue-900/50 p-6 rounded-lg border border-blue-700">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-blue-800 rounded-lg">
					<CheckCircle class="size-5 text-blue-300" />
				</div>
				<div>
					<div class="text-sm text-blue-400">Completed</div>
					<div class="text-2xl font-bold text-blue-400">{data.stats.byStatus.completed}</div>
				</div>
			</div>
		</div>
		<div class="bg-amber-900/50 p-6 rounded-lg border border-amber-700">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-amber-800 rounded-lg">
					<Pause class="size-5 text-amber-300" />
				</div>
				<div>
					<div class="text-sm text-amber-400">On Hold</div>
					<div class="text-2xl font-bold text-amber-400">{data.stats.byStatus.onHold}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Goals List -->
	<div class="bg-gray-800 rounded-lg border border-gray-700">
		<div class="p-6 border-b border-gray-700">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-white">All Marketing Goals</h2>
			</div>
		</div>
		
		{#if data.marketingGoals.length > 0}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-900 border-b border-gray-700">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Goal</th>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Target Metric</th>
							<th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Deadline</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Progress</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Priority</th>

							<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Status</th>
							<th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-700">
						{#each data.marketingGoals as goal}
							{@const progress = getProgress(goal.currentValue, goal.targetValue)}
							<tr 
								class="hover:bg-gray-700/50 cursor-pointer"
								onclick={() => openGoalSheet(goal)}
							>
								<td class="px-4 py-3">
									<div class="font-medium text-white">{goal.goalName}</div>
									{#if goal.description}
										<div class="text-sm text-gray-400 truncate max-w-xs">{goal.description}</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm text-gray-300">{goal.category || 'N/A'}</td>
								<td class="px-4 py-3 text-sm">
									<div class="text-gray-300">{goal.targetMetric || 'N/A'}</div>
									<div class="text-xs text-gray-500">{goal.currentValue || 0} / {goal.targetValue || 0}</div>
								</td>
								<td class="px-4 py-3 text-sm text-gray-300">{formatDate(goal.deadline)}</td>
								<td class="px-4 py-3 text-center">
									<div class="flex items-center justify-center gap-2">
										<div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
											<div 
												class="h-full rounded-full transition-all {progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}" 
												style="width: {progress}%"
											></div>
										</div>
										<span class="text-sm text-gray-300">{progress}%</span>
									</div>
								</td>
								<td class="px-4 py-3 text-center">
									<Badge class={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
								</td>
								<td class="px-4 py-3 text-center">
									<Badge class={getStatusColor(goal.status)}>{goal.status}</Badge>
								</td>
								<td class="px-4 py-3 text-center">
									{#if goal.taskCount?.total > 0}
										<span class="inline-flex items-center gap-1 text-xs text-slate-400">
											<ListTodo class="size-3.5" />
											{goal.taskCount.completed}/{goal.taskCount.total}
											{#if goal.taskCount.needsApproval > 0}
												<AlertCircle class="size-3 text-yellow-400" />
											{/if}
										</span>
									{:else}
										<span class="text-xs text-slate-600">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-center">
									<Button 
										variant="outline" 
										size="sm"
										onclick={(e: MouseEvent) => { e.stopPropagation(); openGoalSheet(goal); }}
									>
										View
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="p-12 text-center">
				<Target class="size-12 text-gray-600 mx-auto mb-4" />
				<h3 class="text-lg font-medium text-white mb-2">No Marketing Goals Yet</h3>
				<p class="text-gray-400 mb-4">Create your first marketing goal to start tracking objectives.</p>
				<Button href="/dashboard/marketing-goals/new">
					<Plus class="size-4 mr-2" />
					Create First Goal
				</Button>
			</div>
		{/if}
	</div>
</div>

<!-- Goal Details Sheet -->
<Sheet.Root open={sheetOpen} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Target class="size-5" />
				Goal Details
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				View marketing goal information and progress
			</Sheet.Description>
		</Sheet.Header>

		{#if selectedGoal}
			{@const progress = getProgress(selectedGoal.currentValue, selectedGoal.targetValue)}
			<div class="space-y-6">
				<!-- Goal Name & Status -->
				<div>
					<h3 class="text-2xl font-bold text-white mb-2">{selectedGoal.goalName}</h3>
					<div class="flex gap-2">
						<Badge class={getPriorityColor(selectedGoal.priority)}>{selectedGoal.priority}</Badge>
						<Badge class={getStatusColor(selectedGoal.status)}>{selectedGoal.status}</Badge>
					</div>
				</div>

				<!-- Description -->
				{#if selectedGoal.description}
					<div class="bg-slate-800 rounded-lg p-4">
						<h4 class="text-sm font-medium text-slate-400 mb-2">Description</h4>
						<p class="text-white">{selectedGoal.description}</p>
					</div>
				{/if}

				<!-- Progress (editable) -->
				<div class="bg-slate-800 rounded-lg p-4">
					<h4 class="text-sm font-medium text-slate-400 mb-3">Progress</h4>
					<div class="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-2">
						<div
							class="h-full rounded-full transition-all {progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}"
							style="width: {progress}%"
						></div>
					</div>
					<div class="flex justify-between text-sm mb-4">
						<span class="text-slate-400">Current: {selectedGoal.currentValue || 0}</span>
						<span class="text-white font-medium">{progress}%</span>
						<span class="text-slate-400">Target: {selectedGoal.targetValue || 0}</span>
					</div>

					<!-- Inline update form -->
					<form
						method="POST"
						action="?/updateProgress"
						use:enhance={() => {
							updating = true;
							updateSuccess = false;
							return async ({ result, update }) => {
								updating = false;
								if (result.type === 'success') {
									updateSuccess = true;
									// patch local state so bar updates immediately
									const u = (result.data as any)?.updated;
									if (u) {
										selectedGoal = { ...selectedGoal, currentValue: u.currentValue, status: u.status };
									}
									setTimeout(() => updateSuccess = false, 2500);
								}
								await update({ reset: false });
							};
						}}
						class="space-y-3"
					>
						<input type="hidden" name="id" value={selectedGoal.id} />
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-xs text-slate-400 mb-1">Current Value</label>
								<input
									name="currentValue"
									type="number"
									min="0"
									step="any"
									value={selectedGoal.currentValue || 0}
									class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
								/>
							</div>
							<div>
								<label class="block text-xs text-slate-400 mb-1">Status</label>
								<select
									name="status"
									class="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
								>
									{#each ['Not Started','In Progress','On Track','At Risk','Completed','On Hold'] as s}
										<option value={s} selected={selectedGoal.status === s}>{s}</option>
									{/each}
								</select>
							</div>
						</div>
						<button
							type="submit"
							disabled={updating}
							class="w-full rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-1.5 transition-colors"
						>
							{updating ? 'Saving…' : updateSuccess ? '✅ Saved' : 'Update Progress'}
						</button>
					</form>
				</div>

				<!-- Details Grid -->
				<div class="grid grid-cols-2 gap-4">
					<div class="bg-slate-800 rounded-lg p-4">
						<div class="flex items-center gap-2 text-slate-400 mb-1">
							<Flag class="size-4" />
							<span class="text-sm">Category</span>
						</div>
						<p class="text-white font-medium">{selectedGoal.category || 'N/A'}</p>
					</div>

					<div class="bg-slate-800 rounded-lg p-4">
						<div class="flex items-center gap-2 text-slate-400 mb-1">
							<TrendingUp class="size-4" />
							<span class="text-sm">Target Metric</span>
						</div>
						<p class="text-white font-medium">{selectedGoal.targetMetric || 'N/A'}</p>
					</div>

					<div class="bg-slate-800 rounded-lg p-4">
						<div class="flex items-center gap-2 text-slate-400 mb-1">
							<Calendar class="size-4" />
							<span class="text-sm">Deadline</span>
						</div>
						<p class="text-white font-medium">{formatDate(selectedGoal.deadline)}</p>
					</div>

					<div class="bg-slate-800 rounded-lg p-4">
						<div class="flex items-center gap-2 text-slate-400 mb-1">
							<Target class="size-4" />
							<span class="text-sm">Values</span>
						</div>
						<p class="text-white font-medium">{selectedGoal.currentValue || 0} / {selectedGoal.targetValue || 0}</p>
					</div>
				</div>

				<!-- Task summary -->
				{#if selectedGoal.taskCount}
					<div class="pt-4 border-t border-slate-700">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2 text-slate-300 text-sm font-medium">
								<ListTodo class="size-4" />
								Tasks
							</div>
							<a href="/dashboard/marketing-goals/{selectedGoal.id}#tasks"
								class="text-xs text-emerald-400 hover:underline">View all</a>
						</div>
						<div class="flex items-center gap-3 text-sm">
							<span class="text-slate-400">
								<span class="text-white font-semibold">{selectedGoal.taskCount.completed}</span>
								/ {selectedGoal.taskCount.total} done
							</span>
							{#if selectedGoal.taskCount.needsApproval > 0}
								<span class="flex items-center gap-1 text-yellow-400 text-xs">
									<AlertCircle class="size-3.5" />
									{selectedGoal.taskCount.needsApproval} need approval
								</span>
							{/if}
						</div>
						{#if selectedGoal.taskCount.total > 0}
							<div class="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
								<div class="h-full rounded-full bg-emerald-500 transition-all"
								     style="width: {Math.round((selectedGoal.taskCount.completed / selectedGoal.taskCount.total) * 100)}%">
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-3 pt-4 border-t border-slate-700">
					<Button 
						variant="outline" 
						class="flex-1"
						onclick={() => sheetOpen = false}
					>
						Close
					</Button>
					<Button 
						href="/dashboard/marketing-goals/{selectedGoal.id}"
						class="flex-1"
					>
						Full Details
					</Button>
				</div>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
