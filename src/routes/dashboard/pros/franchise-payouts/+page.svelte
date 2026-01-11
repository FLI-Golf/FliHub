<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const totalPending = $derived(
		data.payouts
			.filter((p) => p.status === 'pending')
			.reduce((sum, p) => sum + p.totalEarnings, 0)
	);

	const totalPaid = $derived(
		data.payouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.totalEarnings, 0)
	);

	const totalAll = $derived(data.payouts.reduce((sum, p) => sum + p.totalEarnings, 0));
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Franchise Payouts</h1>
			<p class="text-muted-foreground">Track franchise earnings from tournament results</p>
		</div>
		<Button href="/dashboard/pros">← Back to Pros</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Total Pending</div>
			<div class="text-3xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
		</div>
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Total Paid</div>
			<div class="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
		</div>
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Total All Time</div>
			<div class="text-3xl font-bold">{formatCurrency(totalAll)}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg border p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium">Franchise</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					onchange={(e) => {
						const franchiseId = e.currentTarget.value;
						window.location.href = franchiseId
							? `/dashboard/pros/franchise-payouts?franchise=${franchiseId}`
							: '/dashboard/pros/franchise-payouts';
					}}
				>
					<option value="">All Franchises</option>
					{#each data.franchises as franchise}
						<option value={franchise.id} selected={data.currentFranchiseId === franchise.id}>
							{franchise.name}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Franchise Summary -->
	{#if !data.currentFranchiseId}
		<div class="bg-white rounded-lg border">
			<div class="p-6 border-b">
				<h2 class="text-xl font-semibold">Franchise Summary</h2>
			</div>
			<div class="divide-y">
				{#each data.franchises as franchise}
					{@const totals = data.franchiseTotals[franchise.id]}
					{#if totals}
						<div class="p-4 hover:bg-gray-50">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="font-semibold">{franchise.name}</h3>
									<div class="text-sm text-muted-foreground mt-1">
										Pending: {formatCurrency(totals.pending)} | Paid: {formatCurrency(totals.paid)}
									</div>
								</div>
								<div class="text-right">
									<div class="text-2xl font-bold">{formatCurrency(totals.total)}</div>
									<Button
										href="/dashboard/pros/franchise-payouts?franchise={franchise.id}"
										variant="outline"
										size="sm"
										class="mt-2">View Details</Button
									>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Payouts List -->
	<div class="bg-white rounded-lg border">
		<div class="p-6 border-b">
			<h2 class="text-xl font-semibold">
				{data.currentFranchiseId ? 'Franchise Payout Details' : 'All Payouts'}
			</h2>
		</div>
		<div class="divide-y">
			{#each data.payouts as payout}
				<div class="p-4 hover:bg-gray-50">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-semibold">
									{payout.expand?.franchise?.name || 'Unknown Franchise'}
								</h3>
								<Badge class={getStatusColor(payout.status)}>{payout.status}</Badge>
							</div>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								<div>
									🏆 {payout.expand?.tournament?.name || 'Unknown Tournament'} (Season {payout
										.expand?.tournament?.season || 'N/A'})
								</div>
								<div>
									👥 {payout.numberOfPros} pro{payout.numberOfPros !== 1 ? 's' : ''}
								</div>
								<div>
									Men's: {formatCurrency(payout.mensEarnings)} | Women's: {formatCurrency(
										payout.womensEarnings
									)}
								</div>
								{#if payout.paymentDate}
									<div>Paid: {formatDate(payout.paymentDate)}</div>
								{/if}
							</div>
						</div>
						<div class="text-right space-y-2">
							<div class="text-2xl font-bold">{formatCurrency(payout.totalEarnings)}</div>
							<div class="flex gap-2">
								{#if payout.status === 'pending'}
									<form method="POST" action="?/markPaid" use:enhance>
										<input type="hidden" name="id" value={payout.id} />
										<Button type="submit" size="sm" variant="outline">Mark Paid</Button>
									</form>
								{:else if payout.status === 'paid'}
									<form method="POST" action="?/markPending" use:enhance>
										<input type="hidden" name="id" value={payout.id} />
										<Button type="submit" size="sm" variant="outline">Mark Pending</Button>
									</form>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					No franchise payouts found. Add tournament results to generate payouts.
				</div>
			{/each}
		</div>
	</div>
</div>
