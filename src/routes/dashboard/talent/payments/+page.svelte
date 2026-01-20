<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let editingPayment = $state<any>(null);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
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
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getPaymentTypeLabel = (type: string) => {
		switch (type) {
			case 'tournament':
				return '🏆 Tournament';
			case 'special_event':
				return '⭐ Special Event';
			case 'bonus':
				return '💰 Bonus';
			default:
				return '📄 Other';
		}
	};

	const openCreateModal = () => {
		editingPayment = null;
		showCreateModal = true;
	};

	const openEditModal = (payment: any) => {
		editingPayment = payment;
		showCreateModal = true;
	};

	const closeModal = () => {
		showCreateModal = false;
		editingPayment = null;
	};

	const totalPending = $derived(
		data.payments
			.filter((p) => p.status === 'pending')
			.reduce((sum, p) => sum + p.amount, 0)
	);

	const totalPaid = $derived(
		data.payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
	);
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Pro Payments</h1>
			<p class="text-muted-foreground">Manage payments to professional players</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent">← Back to Pros</Button>
			<Button onclick={openCreateModal}>Create Payment</Button>
		</div>
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
			<div class="text-sm text-muted-foreground">Total Payments</div>
			<div class="text-3xl font-bold">{data.payments.length}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg border p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					onchange={(e) => {
						const status = e.currentTarget.value;
						window.location.href = status
							? `/dashboard/talent/payments?status=${status}`
							: '/dashboard/talent/payments';
					}}
				>
					<option value="">All Statuses</option>
					<option value="pending" selected={data.currentStatus === 'pending'}>Pending</option>
					<option value="processing" selected={data.currentStatus === 'processing'}
						>Processing</option
					>
					<option value="paid" selected={data.currentStatus === 'paid'}>Paid</option>
					<option value="cancelled" selected={data.currentStatus === 'cancelled'}>Cancelled</option>
				</select>
			</div>
			<div>
				<label class="text-sm font-medium">Pro</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					onchange={(e) => {
						const proId = e.currentTarget.value;
						window.location.href = proId
							? `/dashboard/talent/payments?pro=${proId}`
							: '/dashboard/talent/payments';
					}}
				>
					<option value="">All Pros</option>
					{#each data.pros as pro}
						<option value={pro.id} selected={data.currentProId === pro.id}>{pro.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Payments List -->
	<div class="bg-white rounded-lg border">
		<div class="divide-y">
			{#each data.payments as payment}
				<div class="p-4 hover:bg-gray-50">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-semibold">
									{payment.expand?.pro?.name || 'Unknown Pro'}
								</h3>
								<Badge class={getStatusColor(payment.status)}>{payment.status}</Badge>
								<span class="text-sm text-muted-foreground">
									{getPaymentTypeLabel(payment.paymentType)}
								</span>
							</div>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								{#if payment.tournament && payment.expand?.tournament}
									<div>🏆 {payment.expand.tournament.name}</div>
								{/if}
								{#if payment.specialEvent && payment.expand?.specialEvent}
									<div>⭐ {payment.expand.specialEvent.name}</div>
								{/if}
								{#if payment.description}
									<div>{payment.description}</div>
								{/if}
								<div class="flex gap-4">
									{#if payment.dueDate}
										<span>Due: {formatDate(payment.dueDate)}</span>
									{/if}
									{#if payment.paymentDate}
										<span>Paid: {formatDate(payment.paymentDate)}</span>
									{/if}
									{#if payment.paymentMethod}
										<span>Method: {payment.paymentMethod}</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="text-right space-y-2">
							<div class="text-2xl font-bold">{formatCurrency(payment.amount)}</div>
							<div class="flex gap-2">
								{#if payment.status === 'pending'}
									<form method="POST" action="?/markPaid" use:enhance>
										<input type="hidden" name="id" value={payment.id} />
										<Button type="submit" size="sm" variant="outline">Mark Paid</Button>
									</form>
								{/if}
								<Button onclick={() => openEditModal(payment)} variant="outline" size="sm"
									>Edit</Button
								>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					No payments found. Create your first payment to get started.
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-4">
				{editingPayment ? 'Edit Payment' : 'Create Payment'}
			</h2>
			<form method="POST" action="?/{editingPayment ? 'update' : 'create'}" use:enhance>
				{#if editingPayment}
					<input type="hidden" name="id" value={editingPayment.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-1">Pro *</label>
						<select
							name="pro"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						>
							<option value="">Select Pro</option>
							{#each data.pros as pro}
								<option value={pro.id} selected={editingPayment?.pro === pro.id}
									>{pro.name}</option
								>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Payment Type *</label>
						<select
							name="paymentType"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						>
							<option value="tournament" selected={editingPayment?.paymentType === 'tournament'}
								>Tournament</option
							>
							<option
								value="special_event"
								selected={editingPayment?.paymentType === 'special_event'}
								>Special Event</option
							>
							<option value="bonus" selected={editingPayment?.paymentType === 'bonus'}
								>Bonus</option
							>
							<option value="other" selected={editingPayment?.paymentType === 'other'}
								>Other</option
							>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Tournament (if applicable)</label>
						<select name="tournament" class="w-full rounded-md border border-gray-300 px-3 py-2">
							<option value="">None</option>
							{#each data.tournaments as tournament}
								<option value={tournament.id} selected={editingPayment?.tournament === tournament.id}
									>{tournament.name} (Season {tournament.season})</option
								>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Special Event (if applicable)</label>
						<select
							name="specialEvent"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						>
							<option value="">None</option>
							{#each data.specialEvents as event}
								<option value={event.id} selected={editingPayment?.specialEvent === event.id}
									>{event.name}</option
								>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Amount *</label>
						<input
							type="number"
							name="amount"
							value={editingPayment?.amount || 0}
							required
							min="0"
							step="0.01"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Due Date</label>
							<input
								type="date"
								name="dueDate"
								value={editingPayment?.dueDate || ''}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Payment Date</label>
							<input
								type="date"
								name="paymentDate"
								value={editingPayment?.paymentDate || ''}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Status *</label>
							<select
								name="status"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="pending" selected={editingPayment?.status === 'pending'}
									>Pending</option
								>
								<option value="processing" selected={editingPayment?.status === 'processing'}
									>Processing</option
								>
								<option value="paid" selected={editingPayment?.status === 'paid'}>Paid</option>
								<option value="cancelled" selected={editingPayment?.status === 'cancelled'}
									>Cancelled</option
								>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Payment Method</label>
							<select
								name="paymentMethod"
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							>
								<option value="">Select Method</option>
								<option
									value="bank_transfer"
									selected={editingPayment?.paymentMethod === 'bank_transfer'}
									>Bank Transfer</option
								>
								<option value="check" selected={editingPayment?.paymentMethod === 'check'}
									>Check</option
								>
								<option value="paypal" selected={editingPayment?.paymentMethod === 'paypal'}
									>PayPal</option
								>
								<option value="venmo" selected={editingPayment?.paymentMethod === 'venmo'}
									>Venmo</option
								>
								<option value="zelle" selected={editingPayment?.paymentMethod === 'zelle'}
									>Zelle</option
								>
								<option value="other" selected={editingPayment?.paymentMethod === 'other'}
									>Other</option
								>
							</select>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Transaction ID</label>
						<input
							type="text"
							name="transactionId"
							value={editingPayment?.transactionId || ''}
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Description</label>
						<textarea
							name="description"
							value={editingPayment?.description || ''}
							rows="2"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea
							name="notes"
							value={editingPayment?.notes || ''}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
					<Button type="submit">{editingPayment ? 'Update' : 'Create'}</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
