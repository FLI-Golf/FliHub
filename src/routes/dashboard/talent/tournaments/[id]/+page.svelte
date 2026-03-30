<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showAddResultModal = $state(false);
	let selectedDivision = $state<'mens' | 'womens'>('mens');

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	const mensResults = $derived(
		data.results.filter((r) => r.division === 'mens').sort((a, b) => a.placement - b.placement)
	);
	const womensResults = $derived(
		data.results.filter((r) => r.division === 'womens').sort((a, b) => a.placement - b.placement)
	);

	const totalMensPaid    = $derived(mensResults.reduce((s, r) => s + (r.proEarnings || 0), 0));
	const totalWomensPaid  = $derived(womensResults.reduce((s, r) => s + (r.proEarnings || 0), 0));
	const totalFranchiseCut = $derived(data.results.reduce((s, r) => s + (r.franchiseEarnings || 0), 0));

	const placementLabel = (n: number) =>
		n === 1 ? '🥇 1st' : n === 2 ? '🥈 2nd' : n === 3 ? '🥉 3rd' : `${n}${ordinal(n)}`;

	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return s[(v - 20) % 10] || s[v] || s[0];
	}
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
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<h2 class="text-xl font-semibold mb-4 text-slate-100">Tournament Details</h2>
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
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<h2 class="text-xl font-semibold mb-4 text-slate-100">Payout Structure</h2>

		<!-- Summary cards -->
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
			<div class="text-center p-4 bg-blue-900/30 border border-blue-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Prize Pool</div>
				<div class="text-2xl font-bold text-blue-300">{formatCurrency(data.tournament.prizePool)}</div>
			</div>
			<div class="text-center p-4 bg-purple-900/30 border border-purple-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Franchise Cut (20%)</div>
				<div class="text-2xl font-bold text-purple-300">{formatCurrency(data.franchiseCut)}</div>
			</div>
			<div class="text-center p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Pro Cut (80%)</div>
				<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.proCut)}</div>
			</div>
			<div class="text-center p-4 bg-cyan-900/30 border border-cyan-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Men's Purse</div>
				<div class="text-2xl font-bold text-cyan-300">{formatCurrency(data.divisionPurse)}</div>
			</div>
			<div class="text-center p-4 bg-pink-900/30 border border-pink-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Women's Purse</div>
				<div class="text-2xl font-bold text-pink-300">{formatCurrency(data.divisionPurse)}</div>
			</div>
		</div>

		<!-- Full placement payout table (per division) -->
		<div class="border-t border-slate-700 pt-4">
			<h3 class="font-semibold mb-3 text-slate-200">
				Placement Payouts — Per Division
				<span class="text-xs font-normal text-slate-400 ml-2">(every team gets a cheque)</span>
			</h3>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700">
							<th class="pb-2 pr-4">Place</th>
							<th class="pb-2 pr-4 text-right">Pro Earnings</th>
							<th class="pb-2 pr-4 text-right">Franchise Cut</th>
							<th class="pb-2 text-right">Total Payout</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-700/50">
						{#each data.payoutStructure as payout}
							<tr class="hover:bg-slate-700/30 transition-colors {payout.placement <= 3 ? 'bg-slate-700/20' : ''}">
								<td class="py-2 pr-4 font-semibold text-slate-200">
									{placementLabel(payout.placement)}
								</td>
								<td class="py-2 pr-4 text-right font-bold text-emerald-300">
									{formatCurrency(payout.amount)}
								</td>
								<td class="py-2 pr-4 text-right text-purple-300">
									{formatCurrency(payout.franchiseAmount)}
								</td>
								<td class="py-2 text-right font-bold text-slate-100">
									{formatCurrency(payout.totalAmount)}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="border-t border-slate-600">
						<tr class="text-slate-300 font-semibold">
							<td class="pt-3 pr-4">Total</td>
							<td class="pt-3 pr-4 text-right text-emerald-300">
								{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.amount, 0))}
							</td>
							<td class="pt-3 pr-4 text-right text-purple-300">
								{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.franchiseAmount, 0))}
							</td>
							<td class="pt-3 text-right text-slate-100">
								{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.totalAmount, 0))}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				* Amounts shown are per division (Men's and Women's each receive the same schedule).
			</p>
		</div>
	</div>

	<!-- Results Tabs -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
		<div class="border-b border-slate-700">
			<div class="flex">
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'mens'
						? 'border-blue-600 text-blue-400'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'mens')}
				>
					Men's Division ({mensResults.length})
				</button>
				<button
					class="px-6 py-3 font-medium border-b-2 {selectedDivision === 'womens'
						? 'border-pink-600 text-pink-400'
						: 'border-transparent text-gray-500'}"
					onclick={() => (selectedDivision = 'womens')}
				>
					Women's Division ({womensResults.length})
				</button>
			</div>
		</div>

		<div class="p-6">
			{#if selectedDivision === 'mens'}
				<div class="mb-4 flex items-center justify-between">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-emerald-400">{formatCurrency(totalMensPaid)}</span>
					</div>
					<div class="text-sm text-muted-foreground">
						Division Purse: <span class="font-bold text-cyan-400">{formatCurrency(data.divisionPurse)}</span>
					</div>
				</div>
				<div class="space-y-2">
					{#each mensResults as result}
						<div class="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
							<div class="flex items-center gap-4">
								<div class="text-xl font-bold w-14 text-center">
									{placementLabel(result.placement)}
								</div>
								<div>
									<div class="font-semibold">{result.expand?.pro?.name || 'Unknown'}</div>
									{#if result.expand?.franchise}
										<div class="text-sm text-muted-foreground">{result.expand.franchise.name}</div>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-bold text-lg text-emerald-300">{formatCurrency(result.proEarnings || 0)}</div>
								<div class="text-xs text-purple-300">
									Franchise: {formatCurrency(result.franchiseEarnings || 0)}
								</div>
								<div class="text-xs text-slate-400">
									Total: {formatCurrency((result.proEarnings || 0) + (result.franchiseEarnings || 0))}
								</div>
								<form method="POST" action="?/deleteResult" use:enhance class="mt-1">
									<input type="hidden" name="id" value={result.id} />
									<Button
										type="submit"
										variant="outline"
										size="sm"
										onclick={(e) => { if (!confirm('Remove this result?')) e.preventDefault(); }}
										>Remove</Button
									>
								</form>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-slate-400">
							No results yet. Add results to see payouts.
						</div>
					{/each}
				</div>
			{:else}
				<div class="mb-4 flex items-center justify-between">
					<div class="text-sm text-muted-foreground">
						Total Paid to Pros: <span class="font-bold text-emerald-400">{formatCurrency(totalWomensPaid)}</span>
					</div>
					<div class="text-sm text-muted-foreground">
						Division Purse: <span class="font-bold text-pink-400">{formatCurrency(data.divisionPurse)}</span>
					</div>
				</div>
				<div class="space-y-2">
					{#each womensResults as result}
						<div class="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
							<div class="flex items-center gap-4">
								<div class="text-xl font-bold w-14 text-center">
									{placementLabel(result.placement)}
								</div>
								<div>
									<div class="font-semibold">{result.expand?.pro?.name || 'Unknown'}</div>
									{#if result.expand?.franchise}
										<div class="text-sm text-muted-foreground">{result.expand.franchise.name}</div>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<div class="font-bold text-lg text-emerald-300">{formatCurrency(result.proEarnings || 0)}</div>
								<div class="text-xs text-purple-300">
									Franchise: {formatCurrency(result.franchiseEarnings || 0)}
								</div>
								<div class="text-xs text-slate-400">
									Total: {formatCurrency((result.proEarnings || 0) + (result.franchiseEarnings || 0))}
								</div>
								<form method="POST" action="?/deleteResult" use:enhance class="mt-1">
									<input type="hidden" name="id" value={result.id} />
									<Button
										type="submit"
										variant="outline"
										size="sm"
										onclick={(e) => { if (!confirm('Remove this result?')) e.preventDefault(); }}
										>Remove</Button
									>
								</form>
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-slate-400">
							No results yet. Add results to see payouts.
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Franchise Payouts -->
	{#if data.franchisePayouts.length > 0}
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
			<h2 class="text-xl font-semibold mb-4 text-slate-100">Franchise Payouts</h2>
			<div class="space-y-2">
				{#each data.franchisePayouts as payout}
					<div class="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
						<div>
							<div class="font-semibold">{payout.expand?.franchise?.name || 'Unknown'}</div>
							<div class="text-sm text-muted-foreground">
								{payout.numberOfPros} pro{payout.numberOfPros !== 1 ? 's' : ''}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold text-lg text-purple-300">{formatCurrency(payout.totalEarnings)}</div>
							<div class="text-xs text-muted-foreground">
								Men's: {formatCurrency(payout.mensEarnings)} | Women's: {formatCurrency(payout.womensEarnings)}
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-4 pt-4 border-t border-slate-700">
				<div class="flex justify-between text-lg font-bold text-slate-100">
					<span>Total Franchise Cut:</span>
					<span class="text-purple-300">{formatCurrency(totalFranchiseCut)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add Result Modal -->
{#if showAddResultModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
			<h2 class="text-2xl font-bold mb-4 text-slate-100">Add Tournament Result</h2>
			<form method="POST" action="?/addResult" use:enhance>
				<div class="space-y-4">
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Division *</label>
						<select name="division" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="mens">Men's</option>
							<option value="womens">Women's</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Pro *</label>
						<select name="pro" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">Select Pro</option>
							{#each data.pros as pro}
								<option value={pro.id}>{pro.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Franchise</label>
						<select name="franchise" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">None / Independent</option>
							{#each data.franchises as franchise}
								<option value={franchise.id}>{franchise.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Placement *</label>
						<input
							type="number"
							name="placement"
							required
							min="1"
							max="20"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Score</label>
						<input
							type="text"
							name="score"
							placeholder="e.g., -15"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Rounds</label>
						<input
							type="number"
							name="rounds"
							min="1"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Notes</label>
						<textarea name="notes" rows="2" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={() => (showAddResultModal = false)}>Cancel</Button>
					<Button type="submit">Add Result</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
