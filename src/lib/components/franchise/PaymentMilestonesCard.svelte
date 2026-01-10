<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-svelte';
	
	interface PaymentMilestone {
		milestoneNumber: number;
		description?: string;
		amountDue: number;
		dueDate?: string;
		amountPaid: number;
		paidDate?: string;
		status: 'pending' | 'partial' | 'paid' | 'overdue';
		notes?: string;
	}
	
	let { 
		milestones = [],
		totalValue = 0,
		totalPaid = 0,
		outstandingBalance = 0
	}: {
		milestones?: PaymentMilestone[];
		totalValue?: number;
		totalPaid?: number;
		outstandingBalance?: number;
	} = $props();
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateString?: string): string {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function getStatusIcon(status: string) {
		switch (status) {
			case 'paid':
				return CheckCircle2;
			case 'partial':
				return Clock;
			case 'overdue':
				return AlertCircle;
			default:
				return Circle;
		}
	}
	
	function getStatusColor(status: string) {
		switch (status) {
			case 'paid':
				return 'text-green-600 dark:text-green-400';
			case 'partial':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'overdue':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-gray-400 dark:text-gray-600';
		}
	}
	
	function getProgressPercentage(milestone: PaymentMilestone): number {
		if (milestone.amountDue === 0) return 0;
		return Math.min(100, (milestone.amountPaid / milestone.amountDue) * 100);
	}
	
	let overallProgress = $derived(totalValue > 0 ? (totalPaid / totalValue) * 100 : 0);
</script>

<Card class="p-6">
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h3 class="text-lg font-semibold mb-2">Payment Milestones</h3>
			<p class="text-sm text-muted-foreground">Track staged payments for this franchise</p>
		</div>
		
		<!-- Overall Progress -->
		<div class="space-y-2">
			<div class="flex items-center justify-between text-sm">
				<span class="font-medium">Overall Progress</span>
				<span class="text-muted-foreground">{overallProgress.toFixed(1)}%</span>
			</div>
			<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
				<div 
					class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
					style="width: {overallProgress}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>Paid: {formatCurrency(totalPaid)}</span>
				<span>Outstanding: {formatCurrency(outstandingBalance)}</span>
			</div>
		</div>
		
		<!-- Milestones List -->
		{#if milestones && milestones.length > 0}
			<div class="space-y-3">
				{#each milestones as milestone}
					{@const Icon = getStatusIcon(milestone.status)}
					{@const progress = getProgressPercentage(milestone)}
					
					<div class="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
						<!-- Milestone Header -->
						<div class="flex items-start justify-between">
							<div class="flex items-start gap-3 flex-1">
								<Icon class="size-5 {getStatusColor(milestone.status)} mt-0.5" />
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<h4 class="font-medium">Milestone {milestone.milestoneNumber}</h4>
										<span class="px-2 py-0.5 text-xs rounded-full capitalize
											{milestone.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
											{milestone.status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
											{milestone.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
											{milestone.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' : ''}
										">
											{milestone.status}
										</span>
									</div>
									{#if milestone.description}
										<p class="text-sm text-muted-foreground mt-1">{milestone.description}</p>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<p class="font-semibold">{formatCurrency(milestone.amountDue)}</p>
								{#if milestone.amountPaid > 0}
									<p class="text-xs text-green-600 dark:text-green-400">
										{formatCurrency(milestone.amountPaid)} paid
									</p>
								{/if}
							</div>
						</div>
						
						<!-- Progress Bar (for partial payments) -->
						{#if milestone.status === 'partial'}
							<div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
								<div 
									class="bg-yellow-500 h-full transition-all duration-500"
									style="width: {progress}%"
								></div>
							</div>
						{/if}
						
						<!-- Dates -->
						<div class="flex items-center gap-4 text-xs text-muted-foreground">
							{#if milestone.dueDate}
								<span>Due: {formatDate(milestone.dueDate)}</span>
							{/if}
							{#if milestone.paidDate}
								<span class="text-green-600 dark:text-green-400">
									Paid: {formatDate(milestone.paidDate)}
								</span>
							{/if}
						</div>
						
						<!-- Notes -->
						{#if milestone.notes}
							<p class="text-xs text-muted-foreground italic border-l-2 border-gray-300 dark:border-gray-700 pl-3">
								{milestone.notes}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">
				<p>No payment milestones configured</p>
				<p class="text-xs mt-1">Milestones will be created when the deal is finalized</p>
			</div>
		{/if}
	</div>
</Card>
