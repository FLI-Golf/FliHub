<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddResultModal = $state(false);
	let selectedDivision = $state<'mens' | 'womens'>('mens');

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const mensResults = $derived(
		data.results.filter((r) => r.division === 'mens').sort((a, b) => a.placement - b.placement)
	);

	const womensResults = $derived(
		data.results.filter((r) => r.division === 'womens').sort((a, b) => a.placement - b.placement)
	);

	const totalMensPaid = $derived(mensResults.reduce((sum, r) => sum + (r.proEarnings || 0), 0));
	const totalWomensPaid = $derived(
		womensResults.reduce((sum, r) => sum + (r.proEarnings || 0), 0)
	);
	const totalFranchiseCut = $derived(
		data.results.reduce((sum, r) => sum + (r.franchiseEarnings || 0), 0)
	);
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{data.tournament.name}</h1>
			<p class="text-muted-foreground">
				Season {data.tournament.season} • Tournament #{data.tournament.tournamentNumber || 'N/A'}
			</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent/tournaments">← Back</Button>
			<Button onclick={() => (showAddResultModal = true)}>Add Result</Button>
		</div>
	</div>

	<!-- Tournament Details -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-xl font-semibold mb-4">Tournament Details</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div>
				<div class="text-sm text-muted-foreground">Dates</div>
				<div class="font-medium">
					{formatDate(data.tournament.startDate)} - {formatDate(data.tournament.endDate)}
				</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Location</div>
				<div class="font-medium">{data.tournament.location || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Venue</div>
				<div class="font-medium">{data.tournament.venue || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Status</div>
				<Badge
					class={data.tournament.status === 'completed'
						? 'bg-green-100 text-green-800'
						: data.tournament.status === 'in_progress'
							? 'bg-blue-100 text-blue-800'
							: 'bg-gray-100 text-gray-800'}
				>
					{data.tournament.status}
				</Badge>
			</div>
		</div>
	</div>

	<!-- Payout Structure -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-xl font-semibold mb-4">Payout Structure</h2>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
			<div class="text-center p-4 bg-blue-50 rounded-lg">
				<div class="text-sm text-muted-foreground">Total Prize Pool</div>
				<div class="text-2xl font-bold">{formatCurrency(data.tournament.prizePool)}</div>
			</div>
			<div class="text-center p-4 bg-purple-50 rounded-lg">
				<div class="text-sm text-muted-foreground">Franchise Cut (20%)</div>
				<div class="text-2xl font-bold">{formatCurrency(data.franchiseCut)}</div>
			</div>
			<div class="text-center p-4 bg-green-50 rounded-lg">
				<div class="text-sm text-muted-foreground">Pro Cut (80%)</div>
				<div class="text-2xl font-bold">{formatCurrency(data.proCut)}</div>
			</div>
			<div class="text-center p-4 bg-cyan-50 rounded-lg">
				<div class="text-sm text-muted-foreground">Men's Purse</div>
				<div class="text-2xl font-bold">{formatCurrency(data.divisionPurse)}</div>
			</div>
			<div class="text-center p-4 bg-pink-50 rounded-lg">
				<div class="text-sm text-muted-foreground">Women's Purse</div>
				<div class="text-2xl font-bold">{formatCurrency(data.divisionPurse)}</div>
			</div>
		</div>

		<div class="border-t pt-4">
			<h3 class="font-semibold mb-3">Placement Payouts (Per Division)</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
				{#each data.payoutStructure.slice(0, 20) as payout}
					<div class="flex justify-between p-2 bg-gray-50 rounded">
						<span class="font-medium">
							{payout.placement === 1
								? '🥇'
								: payout.placement === 2
									? '🥈'
									: payout.placement === 3
										? '🥉'
										: `${payout.placement}.`}
							{payout.placement <= 3 ? '' : `${payout.placement}th`}
						</span>
						<span class="font-bold">{formatCurrency(payout.amount)}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Results Tabs -->
	<div class="bg-white rounded-lg border">
		<div class="border-b">
			<div class="flex">
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'mens'
						? 'border-blue-600 text-blue-600'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'mens')}
				>
					Men's Division ({mensResults.length})
				</button>
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'womens'
						? 'border-pink-600 text-pink-600'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'womens')}
				>
					Women's Division ({womensResults.length})
				</button>
			</div>
		</div>

		<div class="p-6">
			{#if selectedDivision === 'mens'}
				<div class="mb-4">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-green-600"
							>{formatCurrency(totalMensPaid)}</span
						>
					</div>
				</div>
				<div class="space-y-2">
					{#each mensResults as result}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex items-center gap-4">
								<div class="text-2xl font-bold w-12">
									{result.placement === 1
										? '🥇'
										: result.placement === 2
											? '🥈'
											: result.placement === 3
												? '🥉'
												: `${result.placement}.`}
								</div>
								<div>
									<div class="font-semibold">{result.expand?.pro?.name || 'Unknown'}</div>
									{#if result.expand?.franchise}
										<div class="text-sm text-muted-foreground">
											{result.expand.franchise.name}
										</div>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-bold text-lg">{formatCurrency(result.proEarnings || 0)}</div>
								<div class="text-xs text-muted-foreground">
									Franchise: {formatCurrency(result.franchiseEarnings || 0)}
								</div>
								<form method="POST" action="?/deleteResult" use:enhance class="mt-1">
									<input type="hidden" name="id" value={result.id} />
									<Button
										type="submit"
										variant="outline"
										size="sm"
										onclick={(e) => {
											if (!confirm('Remove this result?')) e.preventDefault();
										}}>Remove</Button
									>
								</form>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-muted-foreground">
							No results yet. Add results to see payouts.
						</div>
					{/each}
				</div>
			{:else}
				<div class="mb-4">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-green-600"
							>{formatCurrency(totalWomensPaid)}</span
						>
					</div>
				</div>
				<div class="space-y-2">
					{#each womensResults as result}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex items-center gap-4">
								<div class="text-2xl font-bold w-12">
									{result.placement === 1
										? '🥇'
										: result.placement === 2
											? '🥈'
											: result.placement === 3
												? '🥉'
												: `${result.placement}.`}
								</div>
								<div>
									<div class="font-semibold">{result.expand?.pro?.name || 'Unknown'}</div>
									{#if result.expand?.franchise}
										<div class="text-sm text-muted-foreground">
											{result.expand.franchise.name}
										</div>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-bold text-lg">{formatCurrency(result.proEarnings || 0)}</div>
								<div class="text-xs text-muted-foreground">
									Franchise: {formatCurrency(result.franchiseEarnings || 0)}
								</div>
								<form method="POST" action="?/deleteResult" use:enhance class="mt-1">
									<input type="hidden" name="id" value={result.id} />
									<Button
										type="submit"
										variant="outline"
										size="sm"
										onclick={(e) => {
											if (!confirm('Remove this result?')) e.preventDefault();
										}}>Remove</Button
									>
								</form>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-muted-foreground">
							No results yet. Add results to see payouts.
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Franchise Payouts -->
	{#if data.franchisePayouts.length > 0}
		<div class="bg-white rounded-lg border p-6">
			<h2 class="text-xl font-semibold mb-4">Franchise Payouts</h2>
			<div class="space-y-2">
				{#each data.franchisePayouts as payout}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div>
							<div class="font-semibold">{payout.expand?.franchise?.name || 'Unknown'}</div>
							<div class="text-sm text-muted-foreground">
								{payout.numberOfPros} pro{payout.numberOfPros !== 1 ? 's' : ''}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg">{formatCurrency(payout.totalEarnings)}</div>
							<div class="text-xs text-muted-foreground">
								Men's: {formatCurrency(payout.mensEarnings)} | Women's: {formatCurrency(
									payout.womensEarnings
								)}
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-4 border-t">
				<div class="flex justify-between text-lg font-bold">
					<span>Total Franchise Cut:</span>
					<span>{formatCurrency(totalFranchiseCut)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add Result Modal -->
{#if showAddResultModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full">
			<h2 class="text-2xl font-bold mb-4">Add Tournament Result</h2>
			<form method="POST" action="?/addResult" use:enhance>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-1">Division *</label>
						<select name="division" required class="w-full rounded-md border border-gray-300 px-3 py-2">
							<option value="mens">Men's</option>
							<option value="womens">Women's</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Pro *</label>
						<select name="pro" required class="w-full rounded-md border border-gray-300 px-3 py-2">
							<option value="">Select Pro</option>
							{#each data.pros as pro}
								<option value={pro.id}>{pro.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Franchise</label>
						<select name="franchise" class="w-full rounded-md border border-gray-300 px-3 py-2">
							<option value="">None / Independent</option>
							{#each data.franchises as franchise}
								<option value={franchise.id}>{franchise.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Placement *</label>
						<input
							type="number"
							name="placement"
							required
							min="1"
							max="20"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Score</label>
						<input
							type="text"
							name="score"
							placeholder="e.g., -15"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Rounds</label>
						<input
							type="number"
							name="rounds"
							min="1"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea
							name="notes"
							rows="2"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={() => (showAddResultModal = false)}
						>Cancel</Button
					>
					<Button type="submit">Add Result</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
