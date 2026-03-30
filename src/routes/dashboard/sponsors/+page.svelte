<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import { 
		DollarSign, 
		Users, 
		TrendingUp, 
		Building2,
		Star,
		ArrowRight,
		Plus,
		Mail,
		Phone,
		MapPin,
		Calendar,
		Award
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const getTierLabel = (tier: string) => {
		const labels: Record<string, string> = {
			tier_1: 'Tier 1 - Premium',
			tier_2: 'Tier 2 - Elite',
			tier_3: 'Tier 3 - Standard',
			tier_4: 'Tier 4 - Growth'
		};
		return labels[tier] || tier;
	};

	const getTierColor = (tier: string) => {
		const colors: Record<string, string> = {
			tier_1: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			tier_2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			tier_3: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			tier_4: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
		};
		return colors[tier] || colors.tier_3;
	};

	const getStatusColor = (status: string) => {
		const colors: Record<string, string> = {
			prospect: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
			negotiating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
			active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			renewed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
			expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
			converted_to_franchise: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
		};
		return colors[status] || colors.prospect;
	};

	const getTypeIcon = (type: string) => {
		return type === 'casino' ? '🎰' : type === 'resort' ? '🏨' : '🏢';
	};

	// Tier pricing data
	const tierPricing = {
		tier_1: { 2026: 7000000, 2027: 5000000, 2028: 3000000 },
		tier_2: { 2026: 5000000, 2027: 7000000, 2028: 9000000 },
		tier_3: { 2026: 1000000, 2027: 1000000, 2028: 2000000 },
		tier_4: { 2026: 1000000, 2027: 1500000, 2028: 2000000 }
	};

	// Add sponsor modal
	let showAddModal = $state(false);
	let isSubmitting = $state(false);
	let submitError = $state('');
	let form = $state({
		companyName: '',
		type: 'corporate',
		tier: 'tier_3',
		status: 'prospect',
		contactName: '',
		contactEmail: '',
		contactPhone: '',
		location: '',
		annualCommitment: '',
		franchiseInterest: false,
		notes: ''
	});

	async function handleAddSponsor(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		submitError = '';
		try {
			const res = await fetch('/api/sponsors', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					annualCommitment: form.annualCommitment ? Number(form.annualCommitment) : 0
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message ?? `Error ${res.status}`);
			}
			showAddModal = false;
			// Reload to reflect new sponsor
			window.location.reload();
		} catch (err: any) {
			submitError = err.message ?? 'Failed to create sponsor';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sponsors - FliHub</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Sponsors</h1>
			<p class="text-muted-foreground mt-1">Manage casino and corporate sponsorships</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => showAddModal = true} class="gap-2">
				<Plus class="size-4" />
				Add Sponsor
			</Button>
		</div>
	</div>

	<!-- Metrics -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<MetricCard
			title="Active Sponsors"
			value={data.metrics.activeSponsors.toString()}
			subtitle={`${data.metrics.prospectSponsors} prospects`}
			icon={Users}
		/>
		<MetricCard
			title="Total Revenue"
			value={formatCurrency(data.metrics.totalRevenue)}
			subtitle="From active sponsors"
			icon={DollarSign}
		/>
		<MetricCard
			title="Franchise Interest"
			value={data.metrics.franchiseInterested.toString()}
			subtitle={`${data.metrics.activeBridges} in conversion`}
			icon={TrendingUp}
		/>
		<MetricCard
			title="Converted"
			value={data.metrics.convertedSponsors.toString()}
			subtitle="To franchise owners"
			icon={Award}
		/>
	</div>

	<!-- Tier Pricing Reference -->
	<Card class="p-6">
		<h2 class="text-xl font-semibold mb-4">Sponsorship Tier Pricing</h2>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b">
						<th class="text-left py-3 px-4 font-semibold">Tier</th>
						<th class="text-right py-3 px-4 font-semibold">2026</th>
						<th class="text-right py-3 px-4 font-semibold">2027</th>
						<th class="text-right py-3 px-4 font-semibold">2028</th>
						<th class="text-right py-3 px-4 font-semibold">Total</th>
						<th class="text-center py-3 px-4 font-semibold">Count</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(tierPricing) as [tier, pricing]}
						{@const total = pricing[2026] + pricing[2027] + pricing[2028]}
						{@const count = data.metrics.sponsorsByTier[tier as keyof typeof data.metrics.sponsorsByTier]}
						<tr class="border-b hover:bg-accent/50">
							<td class="py-3 px-4">
								<span class="px-2 py-1 text-xs font-medium rounded-full {getTierColor(tier)}">
									{getTierLabel(tier)}
								</span>
							</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2026])}</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2027])}</td>
							<td class="text-right py-3 px-4">{formatCurrency(pricing[2028])}</td>
							<td class="text-right py-3 px-4 font-semibold">{formatCurrency(total)}</td>
							<td class="text-center py-3 px-4">
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-black dark:text-black">
									{count}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="text-sm text-muted-foreground mt-4">
			💡 Sponsors who convert to franchise owners receive discounts based on their sponsorship value
		</p>
	</Card>

	<!-- Active Sponsors -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Active Sponsors</h2>
			<Button href="/dashboard/sponsors?filter=active" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.sponsors.filter((s: any) => s.status === 'active').length === 0}
				<p class="text-muted-foreground text-center py-8">No active sponsors yet.</p>
			{:else}
				{#each data.sponsors.filter((s: any) => s.status === 'active').slice(0, 5) as sponsor}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{getTypeIcon(sponsor.type)}</span>
								<div>
									<div class="flex items-center gap-2">
										<h3 class="font-semibold">{sponsor.companyName}</h3>
										<span class="px-2 py-1 text-xs font-medium rounded-full {getTierColor(sponsor.tier)}">
											{getTierLabel(sponsor.tier)}
										</span>
										{#if sponsor.franchiseInterest}
											<span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
												🎯 Franchise Interest
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										{#if sponsor.location}
											<div class="flex items-center gap-1">
												<MapPin class="size-3" />
												<span>{sponsor.location}</span>
											</div>
										{/if}
										{#if sponsor.annualCommitment}
											<div class="flex items-center gap-1">
												<DollarSign class="size-3" />
												<span>{formatCurrency(sponsor.annualCommitment)}/year</span>
											</div>
										{/if}
										{#if sponsor.contractEndDate}
											<div class="flex items-center gap-1">
												<Calendar class="size-3" />
												<span>Until {formatDate(sponsor.contractEndDate)}</span>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
						<Button href="/dashboard/sponsors/{sponsor.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>

	<!-- Franchise Conversion Pipeline -->
	<Card class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Franchise Conversion Pipeline</h2>
			<Button href="/dashboard/sponsors/conversions" variant="ghost" size="sm">View All</Button>
		</div>
		<div class="space-y-3">
			{#if data.bridges.filter((b: any) => b.status !== 'declined' && b.status !== 'converted').length === 0}
				<p class="text-muted-foreground text-center py-8">No active conversions in progress.</p>
			{:else}
				{#each data.bridges.filter((b: any) => b.status !== 'declined' && b.status !== 'converted').slice(0, 5) as bridge}
					{@const sponsor = data.sponsors.find((s: any) => s.id === bridge.sponsorId)}
					<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<span class="text-2xl">🎰</span>
								<div>
									<h3 class="font-semibold">{sponsor?.companyName || 'Unknown Sponsor'}</h3>
									<div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
										<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											{bridge.status.replace(/_/g, ' ')}
										</span>
										{#if bridge.sponsorshipValueToDate}
											<div class="flex items-center gap-1">
												<DollarSign class="size-3" />
												<span>{formatCurrency(bridge.sponsorshipValueToDate)} invested</span>
											</div>
										{/if}
										{#if bridge.netFranchiseValue || bridge.netFranchiseFee}
											<div class="flex items-center gap-1">
												<ArrowRight class="size-3" />
												<span>{formatCurrency(bridge.netFranchiseValue || bridge.netFranchiseFee)} franchise value</span>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
						<Button href="/dashboard/sponsors/bridge/{bridge.id}" variant="ghost" size="sm">View</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Card>
</div>

<!-- Add Sponsor Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b border-slate-700">
				<h2 class="text-lg font-semibold text-slate-100">Add Sponsor</h2>
				<button onclick={() => showAddModal = false} class="text-slate-400 hover:text-slate-100 transition-colors">
					<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<form onsubmit={handleAddSponsor} class="p-6 space-y-4">
				{#if submitError}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{submitError}</p>
				{/if}

				<!-- Company Name -->
				<div>
					<label class="block text-xs font-medium text-slate-400 mb-1">Company Name *</label>
					<input bind:value={form.companyName} required
						class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
						placeholder="Acme Corp" />
				</div>

				<!-- Type + Tier -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Type</label>
						<select bind:value={form.type} class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
							<option value="corporate">Corporate</option>
							<option value="casino">Casino</option>
							<option value="resort">Resort</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Tier</label>
						<select bind:value={form.tier} class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
							<option value="tier_1">Tier 1 — Premium</option>
							<option value="tier_2">Tier 2 — Elite</option>
							<option value="tier_3">Tier 3 — Standard</option>
							<option value="tier_4">Tier 4 — Growth</option>
						</select>
					</div>
				</div>

				<!-- Status + Annual Commitment -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Status</label>
						<select bind:value={form.status} class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
							<option value="prospect">Prospect</option>
							<option value="negotiating">Negotiating</option>
							<option value="active">Active</option>
							<option value="renewed">Renewed</option>
							<option value="expired">Expired</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Annual Commitment ($)</label>
						<input bind:value={form.annualCommitment} type="number" min="0"
							class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="0" />
					</div>
				</div>

				<!-- Contact Name + Email -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
						<input bind:value={form.contactName}
							class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="Jane Smith" />
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Contact Email</label>
						<input bind:value={form.contactEmail} type="email"
							class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="jane@acme.com" />
					</div>
				</div>

				<!-- Phone + Location -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Phone</label>
						<input bind:value={form.contactPhone}
							class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="+1 555 000 0000" />
					</div>
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1">Location</label>
						<input bind:value={form.location}
							class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
							placeholder="Las Vegas, NV" />
					</div>
				</div>

				<!-- Franchise Interest -->
				<label class="flex items-center gap-3 cursor-pointer">
					<input type="checkbox" bind:checked={form.franchiseInterest} class="size-4 rounded border-slate-600 bg-slate-800 accent-emerald-500" />
					<span class="text-sm text-slate-300">Franchise interest</span>
				</label>

				<!-- Notes -->
				<div>
					<label class="block text-xs font-medium text-slate-400 mb-1">Notes</label>
					<textarea bind:value={form.notes} rows="3"
						class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
						placeholder="Additional context..."></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => showAddModal = false}>Cancel</Button>
					<Button type="submit" disabled={isSubmitting} class="gap-2">
						<Plus class="size-4" />
						{isSubmitting ? 'Saving…' : 'Add Sponsor'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
