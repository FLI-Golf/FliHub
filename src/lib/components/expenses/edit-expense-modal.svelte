<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { X, Save } from 'lucide-svelte';

	let {
		open = $bindable(false),
		expense = null as any,
		onUpdated = (_e: any) => {}
	} = $props();

	let formData = $state({
		description: '',
		amount: '',
		category: 'Marketing',
		status: 'draft',
		date: '',
		notes: '',
		paymentMethod: '',
		reimbursementTo: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');

	// Populate form when expense changes
	$effect(() => {
		if (expense) {
			formData = {
				description:     expense.description     || '',
				amount:          expense.amount?.toString() || '',
				category:        expense.category        || 'Marketing',
				status:          expense.status          || 'draft',
				date:            expense.date            ? expense.date.split(' ')[0] : '',
				notes:           expense.notes           || '',
				paymentMethod:   expense.paymentMethod   || '',
				reimbursementTo: expense.reimbursementTo || ''
			};
		}
	});

	const categories = [
		'Executive/Management Staff', 'Office Staff', 'Consultants', 'Commisions',
		'Marketing', 'Public relations', 'Legal', 'Advertising', 'Tech/App Development',
		'Course Build/Materials', 'Course Build/Tools', 'Course Build/Miscellaneous',
		'Office/San Diego', 'Office/Scottsdale', 'Production Studio', 'Warehouse',
		'Utilities', 'Internal Tech Budget', 'Hardware', 'Software', 'Mobile Data',
		'Expenses/MPO (Male)', 'Expenses/FPO (Female)', 'Travel/Airefare',
		'Travel/Lodging', 'Travel/Auto Rental', 'Travel/Miscellaneous',
		'E-Commerce/Clothing', 'E-Commerce/Accesories', 'E-Commerce/Shoes',
		'E-Commerce/Bags', 'Docunentary', 'Office Upgrades', 'Arizona/Warehouse',
		'League Insurance', 'Payroll Processing Fees', 'Employee Relocation',
		'Employee Insurance', 'Reserves'
	];

	const paymentMethods = [
		{ value: 'credit_card',   label: 'Credit Card' },
		{ value: 'debit_card',    label: 'Debit Card' },
		{ value: 'cash',          label: 'Cash' },
		{ value: 'check',         label: 'Check' },
		{ value: 'wire_transfer', label: 'Wire Transfer' },
		{ value: 'other',         label: 'Other' }
	];

	const statusOptions = [
		{ value: 'draft',     label: 'Draft' },
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'approved',  label: 'Approved' },
		{ value: 'paid',      label: 'Paid' },
		{ value: 'rejected',  label: 'Rejected' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!expense?.id) return;
		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/expenses', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					expenseId:       expense.id,
					description:     formData.description,
					amount:          formData.amount ? parseFloat(formData.amount) : 0,
					category:        formData.category,
					status:          formData.status,
					date:            formData.date ? formData.date + ' 00:00:00.000Z' : null,
					notes:           formData.notes,
					paymentMethod:   formData.paymentMethod,
					reimbursementTo: formData.reimbursementTo
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || data.message || 'Failed to update expense');
			}

			const result = await response.json();
			open = false;
			onUpdated(result.expense);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) error = '';
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="text-xl text-white">Edit Expense</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update the expense details below.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description" class="text-slate-200">Description *</Label>
				<Input
					id="edit-description"
					bind:value={formData.description}
					placeholder="e.g., Marketing materials for tournament"
					required
					maxlength="500"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Amount and Date -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="edit-amount" class="text-slate-200">Amount *</Label>
					<Input
						id="edit-amount"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.amount}
						placeholder="0.00"
						required
						class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
					/>
				</div>
				<div class="space-y-2">
					<Label for="edit-date" class="text-slate-200">Date *</Label>
					<Input
						id="edit-date"
						type="date"
						bind:value={formData.date}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<!-- Category -->
			<div class="space-y-2">
				<Label for="edit-category" class="text-slate-200">Category *</Label>
				<select
					id="edit-category"
					bind:value={formData.category}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<!-- Status -->
			<div class="space-y-2">
				<Label for="edit-status" class="text-slate-200">Status</Label>
				<select
					id="edit-status"
					bind:value={formData.status}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				>
					{#each statusOptions as s}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
			</div>

			<!-- Payment Method -->
			<div class="space-y-2">
				<Label for="edit-payment" class="text-slate-200">Payment Method</Label>
				<select
					id="edit-payment"
					bind:value={formData.paymentMethod}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
				>
					<option value="">Select payment method...</option>
					{#each paymentMethods as method}
						<option value={method.value}>{method.label}</option>
					{/each}
				</select>
			</div>

			<!-- Reimbursement To -->
			<div class="space-y-2">
				<Label for="edit-reimbursement" class="text-slate-200">Reimbursement To</Label>
				<Input
					id="edit-reimbursement"
					bind:value={formData.reimbursementTo}
					placeholder="e.g., John Doe"
					maxlength="255"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
				<p class="text-xs text-slate-400">Person to be reimbursed (if applicable)</p>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="edit-notes" class="text-slate-200">Notes</Label>
				<textarea
					id="edit-notes"
					bind:value={formData.notes}
					placeholder="Additional details about this expense..."
					rows="4"
					class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				></textarea>
			</div>

			<Sheet.Footer class="flex gap-2 pt-6 border-t border-slate-700 mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={() => (open = false)}
					disabled={isSubmitting}
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					<X class="size-4 mr-2" />
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting} class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
					<Save class="size-4 mr-2" />
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
