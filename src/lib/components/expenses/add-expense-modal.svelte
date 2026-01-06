<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { X, Save } from 'lucide-svelte';

	let { open = $bindable(false), projectId = '' } = $props();

	let formData = $state({
		description: '',
		amount: '',
		category: 'Marketing',
		status: 'draft',
		date: '',
		notes: '',
		paymentMethod: '',
		reimbursementTo: '',
		projectId: projectId
	});

	// Update projectId in formData when prop changes
	$effect(() => {
		if (projectId) {
			formData.projectId = projectId;
		}
	});

	let isSubmitting = $state(false);
	let error = $state('');

	const categories = [
		'Executive/Management Staff',
		'Office Staff',
		'Consultants',
		'Commisions',
		'Marketing',
		'Public relations',
		'Legal',
		'Advertising',
		'Tech/App Development',
		'Course Build/Materials',
		'Course Build/Tools',
		'Course Build/Miscellaneous',
		'Office/San Diego',
		'Office/Scottsdale',
		'Production Studio',
		'Warehouse',
		'Utilities',
		'Internal Tech Budget',
		'Hardware',
		'Software',
		'Mobile Data',
		'Expenses/MPO (Male)',
		'Expenses/FPO (Female)',
		'Travel/Airefare',
		'Travel/Lodging',
		'Travel/Auto Rental',
		'Travel/Miscellaneous',
		'E-Commerce/Clothing',
		'E-Commerce/Accesories',
		'E-Commerce/Shoes',
		'E-Commerce/Bags',
		'Docunentary',
		'Office Upgrades',
		'Arizona/Warehouse',
		'League Insurance',
		'Payroll Processing Fees',
		'Employee Relocation',
		'Employee Insurance',
		'Reserves'
	];

	const paymentMethods = [
		{ value: 'credit_card', label: 'Credit Card' },
		{ value: 'debit_card', label: 'Debit Card' },
		{ value: 'cash', label: 'Cash' },
		{ value: 'check', label: 'Check' },
		{ value: 'wire_transfer', label: 'Wire Transfer' },
		{ value: 'other', label: 'Other' }
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			const payload = {
				...formData,
				amount: formData.amount ? parseFloat(formData.amount) : 0
			};

			const response = await fetch('/api/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || data.error || 'Failed to create expense');
			}

			resetForm();
			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		formData = {
			description: '',
			amount: '',
			category: 'Marketing',
			status: 'draft',
			date: '',
			notes: '',
			paymentMethod: '',
			reimbursementTo: '',
			projectId: projectId
		};
		error = '';
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) resetForm();
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="text-xl text-white">Add New Expense</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Create a new expense entry. It will be saved as a draft.
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
				<Label for="description" class="text-slate-200">Description *</Label>
				<Input
					id="description"
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
					<Label for="amount" class="text-slate-200">Amount *</Label>
					<Input
						id="amount"
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
					<Label for="date" class="text-slate-200">Date *</Label>
					<Input
						id="date"
						type="date"
						bind:value={formData.date}
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<!-- Category -->
			<div class="space-y-2">
				<Label for="category" class="text-slate-200">Category *</Label>
				<select
					id="category"
					bind:value={formData.category}
					required
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					{#each categories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</div>

			<!-- Payment Method -->
			<div class="space-y-2">
				<Label for="paymentMethod" class="text-slate-200">Payment Method</Label>
				<select
					id="paymentMethod"
					bind:value={formData.paymentMethod}
					class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
				>
					<option value="">Select payment method...</option>
					{#each paymentMethods as method}
						<option value={method.value}>{method.label}</option>
					{/each}
				</select>
			</div>

			<!-- Reimbursement To -->
			<div class="space-y-2">
				<Label for="reimbursementTo" class="text-slate-200">Reimbursement To</Label>
				<Input
					id="reimbursementTo"
					bind:value={formData.reimbursementTo}
					placeholder="e.g., John Doe"
					maxlength="255"
					class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
				/>
				<p class="text-xs text-slate-400">Person to be reimbursed (if applicable)</p>
			</div>

			<!-- Notes -->
			<div class="space-y-2">
				<Label for="notes" class="text-slate-200">Notes</Label>
				<textarea
					id="notes"
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
					{isSubmitting ? 'Creating...' : 'Create Expense'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
