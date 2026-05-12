<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Target } from 'lucide-svelte';

	let submitting = $state(false);
	let error = $state('');

	const categories = [
		'Brand Awareness', 'Lead Generation', 'Engagement', 'Revenue Growth',
		'Market Expansion', 'Customer Satisfaction', 'Innovation', 'Other'
	];
	const statuses  = ['Not Started', 'In Progress', 'On Track', 'At Risk', 'Completed', 'On Hold'];
	const priorities = ['High', 'Medium', 'Low'];
</script>

<svelte:head><title>New Marketing Goal — FliHub</title></svelte:head>

<div class="container mx-auto p-6 max-w-2xl space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button href="/dashboard/marketing-goals" variant="outline" size="sm">
			<ArrowLeft class="size-4 mr-2" />
			Back
		</Button>
	</div>

	<div class="flex items-center gap-3">
		<Target class="size-7 text-orange-400" />
		<h1 class="text-2xl font-bold text-white">New Marketing Goal</h1>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-950/50 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			error = '';
			return async ({ result, update }) => {
				submitting = false;
				if (result.type === 'failure') {
					error = (result.data as any)?.error ?? 'Something went wrong.';
				} else {
					await update();
				}
			};
		}}
		class="space-y-5"
	>
		<!-- Example goals -->
		<div class="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
			<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Example Goals — click to use</p>
			<div class="flex flex-wrap gap-2">
				{#each [
					'Reach 100K Social Media Followers',
					'Generate 5,000 Qualified Leads',
					'Achieve 15% Email Open Rate',
					'Increase Merchandise Revenue by 50%',
					'Launch Disc Golf Fantasy League Campaign',
					'Secure 10 Tier-1 Sponsorships',
					'Grow DGN Podcast Subscribers to 50K',
					'Drive 1M Impressions in Nordic Markets',
					'Convert 500 Parks Dept Consultations',
					'Reach 1M Annual Interactions (Smartboost)',
				] as example}
					<button
						type="button"
						onclick={() => {
							const input = document.getElementById('goalName') as HTMLInputElement;
							if (input) input.value = example;
						}}
						class="text-xs px-2.5 py-1 rounded-full bg-slate-700 hover:bg-orange-500/20 hover:border-orange-500 border border-slate-600 text-slate-300 hover:text-orange-300 transition-colors"
					>{example}</button>
				{/each}
			</div>
		</div>

		<!-- Goal name -->
		<div>
			<label for="goalName" class="block text-sm font-medium text-slate-300 mb-1.5">
				Goal Name <span class="text-red-400">*</span>
			</label>
			<input
				id="goalName"
				name="goalName"
				type="text"
				required
				placeholder="e.g. Reach 100K Social Media Followers"
				class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
			/>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				placeholder="What does success look like for this goal?"
				class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
			></textarea>
		</div>

		<!-- Category + Priority -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="category" class="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
				<select
					id="category"
					name="category"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				>
					<option value="">— Select —</option>
					{#each categories as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="priority" class="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
				<select
					id="priority"
					name="priority"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				>
					{#each priorities as p}
						<option value={p}>{p}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Status + Deadline -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="status" class="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
				<select
					id="status"
					name="status"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				>
					{#each statuses as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="deadline" class="block text-sm font-medium text-slate-300 mb-1.5">Deadline</label>
				<input
					id="deadline"
					name="deadline"
					type="date"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				/>
			</div>
		</div>

		<!-- Target metric -->
		<div>
			<label for="targetMetric" class="block text-sm font-medium text-slate-300 mb-1.5">Target Metric</label>
			<input
				id="targetMetric"
				name="targetMetric"
				type="text"
				placeholder="e.g. Total Followers, Qualified Leads, Email Open Rate"
				class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
			/>
		</div>

		<!-- Current + Target values -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="currentValue" class="block text-sm font-medium text-slate-300 mb-1.5">Current Value</label>
				<input
					id="currentValue"
					name="currentValue"
					type="number"
					min="0"
					step="any"
					placeholder="0"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				/>
			</div>
			<div>
				<label for="targetValue" class="block text-sm font-medium text-slate-300 mb-1.5">Target Value</label>
				<input
					id="targetValue"
					name="targetValue"
					type="number"
					min="0"
					step="any"
					placeholder="0"
					class="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
				/>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 pt-2">
			<Button
				type="submit"
				disabled={submitting}
				class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
			>
				{submitting ? 'Creating…' : 'Create Goal'}
			</Button>
			<Button href="/dashboard/marketing-goals" variant="outline" class="flex-1">
				Cancel
			</Button>
		</div>
	</form>
</div>
