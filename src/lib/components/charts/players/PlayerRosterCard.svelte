<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Users, UserCheck, UserX, UserMinus } from 'lucide-svelte';
	
	interface Props {
		total: number;
		active: number;
		inactive: number;
		retired: number;
	}
	
	let { total, active, inactive, retired }: Props = $props();
	
	const activePercentage = $derived(total > 0 ? (active / total) * 100 : 0);
</script>

<Card class="p-6 bg-gradient-to-br from-purple-950 to-indigo-900 border-purple-800">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold text-white">Pro Roster</h3>
		<Users class="size-6 text-purple-400" />
	</div>
	
	<div class="space-y-4">
		<!-- Total Pros -->
		<div class="text-center pb-4 border-b border-purple-800">
			<p class="text-sm text-purple-200 mb-1">Total Pros</p>
			<p class="text-4xl font-bold text-white">{total}</p>
		</div>

		<!-- Active Pros -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<UserCheck class="size-4 text-green-400" />
					<span class="text-sm font-medium text-white">Active</span>
				</div>
				<div class="text-right">
					<span class="text-2xl font-bold text-green-400">{active}</span>
					<span class="text-xs text-purple-300 ml-2">({activePercentage.toFixed(0)}%)</span>
				</div>
			</div>
			<div class="w-full bg-purple-900/50 rounded-full h-2">
				<div 
					class="bg-green-400 h-2 rounded-full transition-all duration-300" 
					style="width: {activePercentage}%"
				></div>
			</div>
		</div>

		<!-- Inactive Pros -->
		<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-800">
			<div class="flex items-center gap-2">
				<UserX class="size-4 text-yellow-400" />
				<span class="text-sm font-medium text-white">Inactive</span>
			</div>
			<span class="text-lg font-bold text-yellow-400">{inactive}</span>
		</div>

		<!-- Retired Pros -->
		<div class="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-800">
			<div class="flex items-center gap-2">
				<UserMinus class="size-4 text-gray-400" />
				<span class="text-sm font-medium text-white">Retired</span>
			</div>
			<span class="text-lg font-bold text-gray-400">{retired}</span>
		</div>
	</div>
</Card>
