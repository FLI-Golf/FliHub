<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';

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
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'inactive':
				return 'bg-gray-100 text-gray-800';
			case 'retired':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getPlacementBadge = (placement: number) => {
		if (placement === 1) return '🥇';
		if (placement === 2) return '🥈';
		if (placement === 3) return '🥉';
		return `${placement}th`;
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-start gap-6">
			{#if data.pro.photo}
				<img
					src={data.pro.photo}
					alt={data.pro.name}
					class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
				/>
			{:else}
				<div
					class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-4xl border-4 border-white shadow-lg"
				>
					{data.pro.name.charAt(0)}
				</div>
			{/if}
			<div>
				<h1 class="text-4xl font-bold">{data.pro.name}</h1>
				{#if data.pro.nickname}
					<p class="text-xl text-muted-foreground mt-1">"{data.pro.nickname}"</p>
				{/if}
				<div class="flex items-center gap-3 mt-3">
					<Badge class={getStatusColor(data.pro.status)}>{data.pro.status}</Badge>
					{#if data.pro.gender}
						<Badge variant="outline">
							{data.pro.gender === 'male' ? '♂ Male' : data.pro.gender === 'female' ? '♀ Female' : data.pro.gender}
						</Badge>
					{/if}
					{#if data.pro.worldRanking}
						<Badge variant="outline">World Rank #{data.pro.worldRanking}</Badge>
					{/if}
				</div>
				<div class="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
					{#if data.pro.country}
						<span>🌍 {data.pro.country}</span>
					{/if}
					{#if data.pro.expand?.franchise}
						<span>🏢 {data.pro.expand.franchise.name}</span>
					{/if}
					{#if data.pro.yearTurnedPro}
						<span>📅 Pro since {data.pro.yearTurnedPro}</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/pros">← Back</Button>
			<Button href="/dashboard/pros/{data.pro.id}/edit" variant="outline">Edit</Button>
		</div>
	</div>

	<!-- Career Stats -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-2xl font-bold mb-4">Career Statistics</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
			<div class="text-center p-4 bg-green-50 rounded-lg">
				<div class="text-3xl font-bold text-green-600">{formatCurrency(data.stats.totalEarnings)}</div>
				<div class="text-sm text-muted-foreground mt-1">Total Earnings</div>
			</div>
			<div class="text-center p-4 bg-blue-50 rounded-lg">
				<div class="text-3xl font-bold text-blue-600">{data.stats.tournamentsPlayed}</div>
				<div class="text-sm text-muted-foreground mt-1">Tournaments</div>
			</div>
			<div class="text-center p-4 bg-yellow-50 rounded-lg">
				<div class="text-3xl font-bold text-yellow-600">🏆 {data.stats.wins}</div>
				<div class="text-sm text-muted-foreground mt-1">Wins</div>
			</div>
			<div class="text-center p-4 bg-orange-50 rounded-lg">
				<div class="text-3xl font-bold text-orange-600">{data.stats.podiums}</div>
				<div class="text-sm text-muted-foreground mt-1">Podiums</div>
			</div>
			<div class="text-center p-4 bg-purple-50 rounded-lg">
				<div class="text-3xl font-bold text-purple-600">{data.stats.topTens}</div>
				<div class="text-sm text-muted-foreground mt-1">Top 10s</div>
			</div>
			<div class="text-center p-4 bg-gray-50 rounded-lg">
				<div class="text-3xl font-bold text-gray-600">
					{data.stats.avgPlacement > 0 ? data.stats.avgPlacement.toFixed(1) : 'N/A'}
				</div>
				<div class="text-sm text-muted-foreground mt-1">Avg Placement</div>
			</div>
		</div>

		<!-- Detailed Breakdown -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
			<div>
				<div class="text-sm text-muted-foreground">Best Finish</div>
				<div class="text-2xl font-bold">
					{data.stats.bestPlacement ? getPlacementBadge(data.stats.bestPlacement) : 'N/A'}
				</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">2nd Place</div>
				<div class="text-2xl font-bold">🥈 {data.stats.secondPlace}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">3rd Place</div>
				<div class="text-2xl font-bold">🥉 {data.stats.thirdPlace}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Top 5s</div>
				<div class="text-2xl font-bold">{data.stats.topFives}</div>
			</div>
		</div>

		{#if data.pro.expand?.franchise}
			<div class="mt-6 pt-6 border-t">
				<div class="text-sm text-muted-foreground mb-2">Franchise Earnings</div>
				<div class="text-2xl font-bold text-purple-600">
					{formatCurrency(data.stats.franchiseEarnings)}
				</div>
				<div class="text-sm text-muted-foreground mt-1">
					Earned for {data.pro.expand.franchise.name}
				</div>
			</div>
		{/if}
	</div>

	<!-- Season Performance -->
	{#if data.seasonStats.length > 0}
		<div class="bg-white rounded-lg border p-6">
			<h2 class="text-2xl font-bold mb-4">Season Performance</h2>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b">
						<tr>
							<th class="px-4 py-3 text-left text-sm font-medium">Season</th>
							<th class="px-4 py-3 text-right text-sm font-medium">Tournaments</th>
							<th class="px-4 py-3 text-right text-sm font-medium">Wins</th>
							<th class="px-4 py-3 text-right text-sm font-medium">Podiums</th>
							<th class="px-4 py-3 text-right text-sm font-medium">Avg Place</th>
							<th class="px-4 py-3 text-right text-sm font-medium">Earnings</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each data.seasonStats as season}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 font-medium">{season.season}</td>
								<td class="px-4 py-3 text-right">{season.tournaments}</td>
								<td class="px-4 py-3 text-right">
									{#if season.wins > 0}
										<span class="text-yellow-600 font-bold">🏆 {season.wins}</span>
									{:else}
										<span class="text-gray-400">0</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-right">{season.podiums}</td>
								<td class="px-4 py-3 text-right">{season.avgPlacement.toFixed(1)}</td>
								<td class="px-4 py-3 text-right font-bold">{formatCurrency(season.earnings)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Tournament Results -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-2xl font-bold mb-4">Tournament Results ({data.results.length})</h2>
		{#if data.results.length > 0}
			<div class="space-y-3">
				{#each data.results as result}
					<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
						<div class="flex items-center gap-4">
							<div class="text-3xl font-bold w-16 text-center">
								{getPlacementBadge(result.placement)}
							</div>
							<div>
								<div class="font-semibold">
									{result.expand?.tournament?.name || 'Unknown Tournament'}
								</div>
								<div class="text-sm text-muted-foreground">
									Season {result.expand?.tournament?.season || 'N/A'} •
									{result.division === 'mens' ? "Men's" : "Women's"} Division
									{#if result.score}
										• Score: {result.score}
									{/if}
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-xl font-bold text-green-600">
								{formatCurrency(result.proEarnings || 0)}
							</div>
							{#if result.franchiseEarnings}
								<div class="text-xs text-muted-foreground">
									+{formatCurrency(result.franchiseEarnings)} franchise
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">No tournament results yet</div>
		{/if}
	</div>

	<!-- Payment History -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-2xl font-bold mb-4">Payment History</h2>
		<div class="grid grid-cols-3 gap-4 mb-6">
			<div class="text-center p-4 bg-green-50 rounded-lg">
				<div class="text-2xl font-bold text-green-600">
					{formatCurrency(data.paymentStats.totalPaid)}
				</div>
				<div class="text-sm text-muted-foreground">Total Paid</div>
			</div>
			<div class="text-center p-4 bg-yellow-50 rounded-lg">
				<div class="text-2xl font-bold text-yellow-600">
					{formatCurrency(data.paymentStats.totalPending)}
				</div>
				<div class="text-sm text-muted-foreground">Pending</div>
			</div>
			<div class="text-center p-4 bg-blue-50 rounded-lg">
				<div class="text-2xl font-bold text-blue-600">{data.paymentStats.totalPayments}</div>
				<div class="text-sm text-muted-foreground">Total Payments</div>
			</div>
		</div>

		{#if data.payments.length > 0}
			<div class="space-y-2">
				{#each data.payments as payment}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div>
							<div class="font-medium">{payment.description || payment.paymentType}</div>
							<div class="text-sm text-muted-foreground">
								{#if payment.dueDate}
									Due: {formatDate(payment.dueDate)}
								{/if}
								{#if payment.paymentDate}
									• Paid: {formatDate(payment.paymentDate)}
								{/if}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold">{formatCurrency(payment.amount)}</div>
							<Badge
								class={payment.status === 'paid'
									? 'bg-green-100 text-green-800'
									: payment.status === 'pending'
										? 'bg-yellow-100 text-yellow-800'
										: 'bg-gray-100 text-gray-800'}
							>
								{payment.status}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">No payment records</div>
		{/if}
	</div>

	<!-- Bio & Additional Info -->
	{#if data.pro.bio || data.pro.careerHighlights || data.pro.personalMotivation}
		<div class="bg-white rounded-lg border p-6">
			<h2 class="text-2xl font-bold mb-4">About</h2>
			{#if data.pro.bio}
				<div class="prose max-w-none mb-6">
					<h3 class="text-lg font-semibold">Biography</h3>
					{@html data.pro.bio}
				</div>
			{/if}
			{#if data.pro.careerHighlights}
				<div class="prose max-w-none mb-6">
					<h3 class="text-lg font-semibold">Career Highlights</h3>
					{@html data.pro.careerHighlights}
				</div>
			{/if}
			{#if data.pro.personalMotivation}
				<div class="prose max-w-none">
					<h3 class="text-lg font-semibold">Personal Motivation</h3>
					{@html data.pro.personalMotivation}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Additional Details -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-2xl font-bold mb-4">Additional Information</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 gap-6">
			{#if data.pro.residence}
				<div>
					<div class="text-sm text-muted-foreground">Residence</div>
					<div class="font-medium">{data.pro.residence}</div>
				</div>
			{/if}
			{#if data.pro.dateOfBirth}
				<div>
					<div class="text-sm text-muted-foreground">Date of Birth</div>
					<div class="font-medium">{formatDate(data.pro.dateOfBirth)}</div>
				</div>
			{/if}
			{#if data.pro.height}
				<div>
					<div class="text-sm text-muted-foreground">Height</div>
					<div class="font-medium">{data.pro.height}</div>
				</div>
			{/if}
			{#if data.pro.weight}
				<div>
					<div class="text-sm text-muted-foreground">Weight</div>
					<div class="font-medium">{data.pro.weight}</div>
				</div>
			{/if}
			{#if data.pro.primarySponsor}
				<div>
					<div class="text-sm text-muted-foreground">Primary Sponsor</div>
					<div class="font-medium">{data.pro.primarySponsor}</div>
				</div>
			{/if}
			{#if data.pro.favoriteDisc}
				<div>
					<div class="text-sm text-muted-foreground">Favorite Disc</div>
					<div class="font-medium">{data.pro.favoriteDisc}</div>
				</div>
			{/if}
		</div>
	</div>
</div>
