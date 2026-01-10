<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-svelte';
	
	let {
		totalFranchiseValue = 10000000,
		sponsorshipDiscount = 0,
		negotiatedValue,
		netFranchiseValue = 10000000,
		initialPayment = 0,
		totalPaidToDate = 0,
		outstandingBalance = 10000000,
		sponsorBridgeId
	}: {
		totalFranchiseValue?: number;
		sponsorshipDiscount?: number;
		negotiatedValue?: number;
		netFranchiseValue?: number;
		initialPayment?: number;
		totalPaidToDate?: number;
		outstandingBalance?: number;
		sponsorBridgeId?: string;
	} = $props();
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatPercent(value: number): string {
		return `${value.toFixed(1)}%`;
	}
	
	let discountPercent = $derived(
		totalFranchiseValue > 0 ? (sponsorshipDiscount / totalFranchiseValue) * 100 : 0
	);
	
	let paymentProgress = $derived(
		netFranchiseValue > 0 ? (totalPaidToDate / netFranchiseValue) * 100 : 0
	);
	
	let hasDiscount = $derived(sponsorshipDiscount > 0);
	let hasSponsorConversion = $derived(!!sponsorBridgeId);
</script>

<Card class="p-6">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h3 class="text-lg font-semibold mb-2">Financial Summary</h3>
			<p class="text-sm text-muted-foreground">Franchise value and payment breakdown</p>
		</div>
		
		<!-- Financial Breakdown -->
		<div class="space-y-4">
			<!-- Base Value -->
			<div class="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
						<DollarSign class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-sm font-medium text-blue-900 dark:text-blue-100">Base Franchise Value</p>
						<p class="text-xs text-blue-700 dark:text-blue-300">Standard franchise worth</p>
					</div>
				</div>
				<p class="text-lg font-bold text-blue-900 dark:text-blue-100">
					{formatCurrency(totalFranchiseValue)}
				</p>
			</div>
			
			<!-- Sponsorship Discount (if applicable) -->
			{#if hasDiscount}
				<div class="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-green-100 dark:bg-green-900">
							<TrendingDown class="size-5 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p class="text-sm font-medium text-green-900 dark:text-green-100">
								Sponsorship Discount
								{#if hasSponsorConversion}
									<span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
										Sponsor Conversion
									</span>
								{/if}
							</p>
							<p class="text-xs text-green-700 dark:text-green-300">
								{formatPercent(discountPercent)} discount applied
							</p>
						</div>
					</div>
					<p class="text-lg font-bold text-green-600 dark:text-green-400">
						-{formatCurrency(sponsorshipDiscount)}
					</p>
				</div>
			{/if}
			
			<!-- Negotiated Adjustment (if different) -->
			{#if negotiatedValue && negotiatedValue !== netFranchiseValue}
				<div class="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
					<div class="flex items-center gap-3">
						<div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
							<Percent class="size-5 text-purple-600 dark:text-purple-400" />
						</div>
						<div>
							<p class="text-sm font-medium text-purple-900 dark:text-purple-100">Negotiated Value</p>
							<p class="text-xs text-purple-700 dark:text-purple-300">Custom deal terms</p>
						</div>
					</div>
					<p class="text-lg font-bold text-purple-900 dark:text-purple-100">
						{formatCurrency(negotiatedValue)}
					</p>
				</div>
			{/if}
			
			<!-- Net Franchise Value -->
			<div class="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
				<div class="flex items-center gap-3">
					<div class="p-2 rounded-lg bg-white/20">
						<DollarSign class="size-6" />
					</div>
					<div>
						<p class="font-semibold">Net Franchise Value</p>
						<p class="text-xs opacity-90">Final agreed amount</p>
					</div>
				</div>
				<p class="text-2xl font-bold">
					{formatCurrency(netFranchiseValue)}
				</p>
			</div>
		</div>
		
		<!-- Payment Status -->
		<div class="space-y-3 pt-4 border-t">
			<h4 class="font-medium text-sm">Payment Status</h4>
			
			<div class="grid grid-cols-3 gap-3">
				<div class="text-center p-3 rounded-lg bg-muted">
					<p class="text-xs text-muted-foreground mb-1">Initial Payment</p>
					<p class="font-semibold">{formatCurrency(initialPayment)}</p>
				</div>
				
				<div class="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
					<p class="text-xs text-green-700 dark:text-green-300 mb-1">Total Paid</p>
					<p class="font-semibold text-green-900 dark:text-green-100">{formatCurrency(totalPaidToDate)}</p>
				</div>
				
				<div class="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
					<p class="text-xs text-orange-700 dark:text-orange-300 mb-1">Outstanding</p>
					<p class="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(outstandingBalance)}</p>
				</div>
			</div>
			
			<!-- Progress Bar -->
			<div class="space-y-2">
				<div class="flex items-center justify-between text-xs">
					<span class="text-muted-foreground">Payment Progress</span>
					<span class="font-medium">{formatPercent(paymentProgress)}</span>
				</div>
				<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
					<div 
						class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
						style="width: {paymentProgress}%"
					></div>
				</div>
			</div>
		</div>
	</div>
</Card>
