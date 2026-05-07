<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { X, Receipt, CheckCircle2, AlertCircle, ArrowRight, Pencil, Loader2 } from 'lucide-svelte';

	let {
		open = $bindable(false),
		expense = null as any,
		onSubmitted = () => {},
		onEdit = () => {}
	}: {
		open: boolean;
		expense: any;
		onSubmitted?: () => void;
		onEdit?: () => void;
	} = $props();

	let submitting = $state(false);
	let submitted  = $state(false);
	let err        = $state('');

	$effect(() => {
		if (open) { submitting = false; submitted = false; err = ''; }
	});

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

	function fmtDate(d: string) {
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const PAYMENT_LABELS: Record<string, string> = {
		credit_card: 'Credit Card', debit_card: 'Debit Card', cash: 'Cash',
		check: 'Check', wire_transfer: 'Wire Transfer', other: 'Other'
	};

	async function handleSubmit() {
		submitting = true; err = '';
		try {
			const res = await fetch('/api/expenses', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expenseId: expense.id, status: 'submitted' })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? data.message ?? `Error ${res.status}`);
			submitted = true;
			await invalidateAll();
			setTimeout(() => {
				open = false;
				onSubmitted();
			}, 1400);
		} catch (e: any) {
			err = e.message ?? 'Failed to submit expense';
		} finally {
			submitting = false;
		}
	}

	function handleEdit() {
		open = false;
		onEdit();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
		role="button"
		tabindex="-1"
		aria-label="Close"
		onclick={() => { if (!submitting) open = false; }}
		onkeydown={(e) => { if (e.key === 'Escape' && !submitting) open = false; }}
	></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">

			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
				<div class="flex items-center gap-2">
					<Receipt class="size-4 text-slate-400" />
					<h2 class="text-base font-semibold text-slate-100">Review Draft Expense</h2>
				</div>
				{#if !submitting}
					<button onclick={() => open = false} class="text-slate-500 hover:text-slate-300 transition-colors">
						<X class="size-4" />
					</button>
				{/if}
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
				{#if submitted}
					<div class="flex flex-col items-center justify-center py-8 gap-3 text-center">
						<CheckCircle2 class="size-12 text-emerald-400" />
						<p class="text-lg font-semibold text-emerald-300">Submitted for approval!</p>
						<p class="text-sm text-slate-400">This expense is now in the approvals queue.</p>
					</div>
				{:else}
					<!-- Summary card -->
					<div class="rounded-xl bg-slate-800/60 border border-slate-700 divide-y divide-slate-700/60 text-sm">
						<div class="flex justify-between px-4 py-2.5">
							<span class="text-slate-400">Description</span>
							<span class="text-slate-100 font-medium text-right max-w-[60%]">{expense?.description}</span>
						</div>
						<div class="flex justify-between px-4 py-2.5">
							<span class="text-slate-400">Amount</span>
							<span class="text-emerald-400 font-bold text-base">{fmt(expense?.amount ?? 0)}</span>
						</div>
						<div class="flex justify-between px-4 py-2.5">
							<span class="text-slate-400">Category</span>
							<span class="text-slate-100">{expense?.category}</span>
						</div>
						<div class="flex justify-between px-4 py-2.5">
							<span class="text-slate-400">Date</span>
							<span class="text-slate-100">{expense?.date ? fmtDate(expense.date) : '—'}</span>
						</div>
						{#if expense?.paymentMethod}
							<div class="flex justify-between px-4 py-2.5">
								<span class="text-slate-400">Payment method</span>
								<span class="text-slate-100">{PAYMENT_LABELS[expense.paymentMethod] ?? expense.paymentMethod}</span>
							</div>
						{/if}
						{#if expense?.reimbursementTo}
							<div class="flex justify-between px-4 py-2.5">
								<span class="text-slate-400">Reimburse to</span>
								<span class="text-slate-100">{expense.reimbursementTo}</span>
							</div>
						{/if}
						{#if expense?.notes}
							<div class="px-4 py-2.5">
								<p class="text-slate-400 mb-1">Notes</p>
								<p class="text-slate-300 text-xs leading-relaxed">{expense.notes}</p>
							</div>
						{/if}
					</div>

					<!-- Info callout -->
					<div class="flex items-start gap-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/30 px-3 py-2.5">
						<AlertCircle class="size-4 text-emerald-400 shrink-0 mt-0.5" />
						<p class="text-xs text-emerald-300">Submitting will send this expense to the approvals queue. You won't be able to edit it once submitted.</p>
					</div>

					{#if err}
						<div class="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
							<AlertCircle class="size-4 shrink-0" />{err}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			{#if !submitted}
				<div class="flex items-center gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
					<button
						type="button"
						onclick={handleEdit}
						disabled={submitting}
						class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
					>
						<Pencil class="size-3.5" /> Edit details
					</button>
					<button
						type="button"
						onclick={handleSubmit}
						disabled={submitting}
						class="ml-auto flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60"
					>
						{#if submitting}
							<Loader2 class="size-4 animate-spin" /> Submitting…
						{:else}
							Submit for Approval <ArrowRight class="size-4" />
						{/if}
					</button>
				</div>
			{/if}

		</div>
	</div>
{/if}
