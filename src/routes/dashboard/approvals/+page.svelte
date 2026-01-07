<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { 
		CheckCircle2, 
		XCircle, 
		Clock, 
		AlertCircle,
		DollarSign,
		Receipt,
		FolderKanban,
		Wallet,
		MessageSquare,
		User,
		Calendar
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let statusFilter = $state<string>('all');
	let typeFilter = $state<string>('all');
	let actionMessage = $state<string>('');
	let processingId = $state<string | null>(null);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
			case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'revision_requested': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
			default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'expense': return Receipt;
			case 'project': return FolderKanban;
			case 'budget': return Wallet;
			default: return DollarSign;
		}
	}

	let filteredApprovals = $derived.by(() => {
		let filtered = data.approvals;

		if (statusFilter !== 'all') {
			filtered = filtered.filter(a => a.status === statusFilter);
		}

		if (typeFilter !== 'all') {
			filtered = filtered.filter(a => a.entityType === typeFilter);
		}

		return filtered;
	});

	async function handleApprove(approvalId: string) {
		processingId = approvalId;
		actionMessage = '';

		try {
			const response = await fetch('/api/approvals/approve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ approvalId })
			});

			const result = await response.json();

			if (result.success) {
				actionMessage = '✅ Approval approved successfully!';
				setTimeout(() => window.location.reload(), 1000);
			} else {
				actionMessage = `❌ Error: ${result.error}`;
			}
		} catch (error: any) {
			actionMessage = `❌ Error: ${error.message}`;
		} finally {
			processingId = null;
		}
	}

	async function handleReject(approvalId: string) {
		processingId = approvalId;
		actionMessage = '';

		try {
			const response = await fetch('/api/approvals/reject', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ approvalId })
			});

			const result = await response.json();

			if (result.success) {
				actionMessage = '✅ Approval rejected successfully!';
				setTimeout(() => window.location.reload(), 1000);
			} else {
				actionMessage = `❌ Error: ${result.error}`;
			}
		} catch (error: any) {
			actionMessage = `❌ Error: ${error.message}`;
		} finally {
			processingId = null;
		}
	}

	let isAdmin = $derived(data.userProfile?.role === 'admin');
	let isLeader = $derived(data.userProfile?.role === 'leader');
	let canApprove = $derived(isAdmin || isLeader);
</script>

<svelte:head>
	<title>Approvals - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold mb-2 tracking-tight">Approvals</h1>
		<p class="text-muted-foreground">Review and manage approval requests</p>
	</div>

	<!-- Action Message -->
	{#if actionMessage}
		<div class="p-4 rounded-lg {actionMessage.includes('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}">
			{actionMessage}
		</div>
	{/if}

	<!-- Statistics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground mb-1">Pending</p>
					<p class="text-2xl font-bold">{data.stats.pending}</p>
					<p class="text-xs text-muted-foreground mt-1">{formatCurrency(data.stats.pendingAmount)}</p>
				</div>
				<Clock class="size-8 text-yellow-500 opacity-50" />
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground mb-1">Approved</p>
					<p class="text-2xl font-bold">{data.stats.approved}</p>
				</div>
				<CheckCircle2 class="size-8 text-green-500 opacity-50" />
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground mb-1">Rejected</p>
					<p class="text-2xl font-bold">{data.stats.rejected}</p>
				</div>
				<XCircle class="size-8 text-red-500 opacity-50" />
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-muted-foreground mb-1">Total Amount</p>
					<p class="text-2xl font-bold">{formatCurrency(data.stats.totalAmount)}</p>
				</div>
				<DollarSign class="size-8 text-blue-500 opacity-50" />
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-wrap gap-4">
			<div>
				<label class="text-sm font-medium mb-2 block">Status</label>
				<select bind:value={statusFilter} class="px-3 py-2 border rounded-md bg-background">
					<option value="all">All Statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="revision_requested">Revision Requested</option>
				</select>
			</div>

			<div>
				<label class="text-sm font-medium mb-2 block">Type</label>
				<select bind:value={typeFilter} class="px-3 py-2 border rounded-md bg-background">
					<option value="all">All Types</option>
					<option value="expense">Expenses</option>
					<option value="project">Projects</option>
					<option value="budget">Budgets</option>
				</select>
			</div>

			<div class="flex items-end gap-2">
				<div class="text-sm text-muted-foreground">
					Showing {filteredApprovals.length} of {data.approvals.length} approvals
				</div>
			</div>
		</div>
	</Card>

	<!-- Approvals List -->
	<div class="space-y-4">
		{#if filteredApprovals.length === 0}
			<Card class="p-8 text-center text-muted-foreground">
				No approval requests found
			</Card>
		{:else}
			{#each filteredApprovals as approval}
				{@const TypeIcon = getTypeIcon(approval.entityType)}
				<Card class="p-6 hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between gap-4">
						<div class="flex items-start gap-4 flex-1">
							<!-- Icon -->
							<div class="p-3 rounded-lg bg-muted">
								<svelte:component this={TypeIcon} class="size-6" />
							</div>

							<!-- Details -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3 mb-2">
									<h3 class="text-lg font-semibold capitalize">{approval.entityType} Approval</h3>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(approval.status)}">
										{approval.status.replace('_', ' ')}
									</span>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
									<div class="flex items-center gap-2 text-muted-foreground">
										<DollarSign class="size-4" />
										<span>Amount: <span class="font-semibold text-foreground">{formatCurrency(approval.amount || 0)}</span></span>
									</div>

									<div class="flex items-center gap-2 text-muted-foreground">
										<User class="size-4" />
										<span>Requested by: <span class="font-semibold text-foreground">
											{approval.expand?.requestedBy?.firstName} {approval.expand?.requestedBy?.lastName}
										</span></span>
									</div>

									<div class="flex items-center gap-2 text-muted-foreground">
										<Calendar class="size-4" />
										<span>Requested: <span class="font-semibold text-foreground">{formatDate(approval.requestedDate)}</span></span>
									</div>

									{#if approval.reviewedDate}
										<div class="flex items-center gap-2 text-muted-foreground">
											<Calendar class="size-4" />
											<span>Reviewed: <span class="font-semibold text-foreground">{formatDate(approval.reviewedDate)}</span></span>
										</div>
									{/if}

									{#if approval.expand?.approver}
										<div class="flex items-center gap-2 text-muted-foreground">
											<User class="size-4" />
											<span>Approver: <span class="font-semibold text-foreground">
												{approval.expand.approver.firstName} {approval.expand.approver.lastName}
											</span></span>
										</div>
									{/if}
								</div>

								{#if approval.comments}
									<div class="mt-3 p-3 bg-muted rounded-lg">
										<div class="flex items-start gap-2">
											<MessageSquare class="size-4 mt-0.5 flex-shrink-0" />
											<div class="text-sm prose dark:prose-invert max-w-none">
												{@html approval.comments}
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						{#if approval.status === 'pending' && canApprove}
							<div class="flex gap-2">
								<Button 
									onclick={() => handleApprove(approval.id)}
									disabled={processingId === approval.id}
									size="sm"
									class="bg-green-600 hover:bg-green-700"
								>
									<CheckCircle2 class="size-4 mr-2" />
									Approve
								</Button>
								<Button 
									onclick={() => handleReject(approval.id)}
									disabled={processingId === approval.id}
									variant="outline"
									size="sm"
									class="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
								>
									<XCircle class="size-4 mr-2" />
									Reject
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</div>
