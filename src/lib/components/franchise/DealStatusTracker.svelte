<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { FileSignature, CheckCircle2, DollarSign, Clock, Users as UsersIcon, XCircle } from 'lucide-svelte';
	
	interface Props {
		pendingSignature: number;
		signed: number;
		paymentPending: number;
		paymentReceived: number;
		onboarding: number;
		active: number;
		cancelled: number;
	}
	
	let { pendingSignature, signed, paymentPending, paymentReceived, onboarding, active, cancelled }: Props = $props();
	
	const total = $derived(pendingSignature + signed + paymentPending + paymentReceived + onboarding + active + cancelled);
</script>

<Card class="p-6">
	<h2 class="text-2xl font-bold mb-6">Deal Status Tracker</h2>
	
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<!-- Pending Signature -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<FileSignature class="size-4 text-yellow-600" />
				<span class="text-xs font-medium text-muted-foreground">Pending Signature</span>
			</div>
			<p class="text-2xl font-bold">{pendingSignature}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((pendingSignature / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Signed -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<CheckCircle2 class="size-4 text-blue-600" />
				<span class="text-xs font-medium text-muted-foreground">Signed</span>
			</div>
			<p class="text-2xl font-bold text-blue-600">{signed}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((signed / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Payment Pending -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<Clock class="size-4 text-orange-600" />
				<span class="text-xs font-medium text-muted-foreground">Payment Pending</span>
			</div>
			<p class="text-2xl font-bold text-orange-600">{paymentPending}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((paymentPending / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Payment Received -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<DollarSign class="size-4 text-green-600" />
				<span class="text-xs font-medium text-muted-foreground">Payment Received</span>
			</div>
			<p class="text-2xl font-bold text-green-600">{paymentReceived}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((paymentReceived / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Onboarding -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<UsersIcon class="size-4 text-purple-600" />
				<span class="text-xs font-medium text-muted-foreground">Onboarding</span>
			</div>
			<p class="text-2xl font-bold text-purple-600">{onboarding}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((onboarding / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Active -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<CheckCircle2 class="size-4 text-emerald-600" />
				<span class="text-xs font-medium text-muted-foreground">Active</span>
			</div>
			<p class="text-2xl font-bold text-emerald-600">{active}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((active / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Cancelled -->
		<div class="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<XCircle class="size-4 text-red-600" />
				<span class="text-xs font-medium text-muted-foreground">Cancelled</span>
			</div>
			<p class="text-2xl font-bold text-red-600">{cancelled}</p>
			{#if total > 0}
				<p class="text-xs text-muted-foreground mt-1">{((cancelled / total) * 100).toFixed(0)}% of total</p>
			{/if}
		</div>

		<!-- Total -->
		<div class="p-4 rounded-lg border bg-primary/5 hover:shadow-md transition-shadow">
			<div class="flex items-center gap-2 mb-2">
				<span class="text-xs font-medium text-muted-foreground">Total Deals</span>
			</div>
			<p class="text-2xl font-bold text-primary">{total}</p>
			<p class="text-xs text-muted-foreground mt-1">All statuses</p>
		</div>
	</div>
</Card>
