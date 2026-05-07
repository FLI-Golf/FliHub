<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { X, ChevronRight, ChevronLeft, Receipt, CheckCircle2, AlertCircle, Building2, FolderKanban, ListTodo, DollarSign, ArrowRight } from 'lucide-svelte';

	// ── Props ─────────────────────────────────────────────────────────────────
	// task: the full task record (must have id, title, task_budget, task_actual_cost, projectId)
	// project: optional expanded project record (name, department name)
	// vendors: list of vendor records for the vendor dropdown
	// onClose: called when modal should close
	let {
		open = $bindable(false),
		task,
		project = null,
		departmentName = '',
		vendors = []
	}: {
		open: boolean;
		task: any;
		project?: any;
		departmentName?: string;
		vendors?: any[];
	} = $props();

	// ── Steps ─────────────────────────────────────────────────────────────────
	// 1 = Context review   2 = Expense details   3 = Submit & confirm
	let step = $state(1);

	// ── Form state ────────────────────────────────────────────────────────────
	let form = $state({
		description:     task?.title ?? '',
		amount:          task?.task_budget ? String(task.task_budget) : '',
		billingType:     'fixed',   // 'fixed' | 'hourly'
		hours:           '',
		hourlyRate:      '',
		category:        'Marketing',
		paymentMethod:   '',
		vendor:          '',
		reimbursementTo: '',
		date:            new Date().toISOString().slice(0, 10),
		status:          'draft',   // draft | submitted
		notes:           ''
	});

	// Auto-calculate amount when billing type is hourly
	$effect(() => {
		if (form.billingType === 'hourly' && form.hours && form.hourlyRate) {
			const calc = (Number(form.hours) * Number(form.hourlyRate)).toFixed(2);
			form.amount = calc;
		}
	});

	let saving      = $state(false);
	let err         = $state('');
	let success     = $state(false);
	let savedStatus = $state<'draft' | 'submitted'>('submitted');

	// Budget context
	const budget  = $derived(task?.task_budget    || 0);
	const actual  = $derived(task?.task_actual_cost || 0);
	const remaining = $derived(budget - actual);
	const newAmount = $derived(form.amount ? Number(form.amount) : 0);
	const wouldExceed = $derived(budget > 0 && (actual + newAmount) > budget);

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

	const CATEGORIES = [
		'Executive/Management Staff','Office Staff','Consultants','Commisions',
		'Marketing','Public relations','Legal','Advertising','Tech/App Development',
		'Course Build/Materials','Course Build/Tools','Course Build/Miscellaneous',
		'Office/San Diego','Office/Scottsdale','Production Studio','Warehouse',
		'Utilities','Internal Tech Budget','Hardware','Software','Mobile Data',
		'Expenses/MPO (Male)','Expenses/FPO (Female)','Travel/Airefare',
		'Travel/Lodging','Travel/Auto Rental','Travel/Miscellaneous',
		'E-Commerce/Clothing','E-Commerce/Accesories','E-Commerce/Shoes',
		'E-Commerce/Bags','Docunentary','Office Upgrades','Arizona/Warehouse',
		'League Insurance','Payroll Processing Fees','Employee Relocation',
		'Employee Insurance','Reserves'
	];

	const PAYMENT_METHODS = [
		{ value: 'credit_card',   label: 'Credit Card' },
		{ value: 'debit_card',    label: 'Debit Card' },
		{ value: 'cash',          label: 'Cash' },
		{ value: 'check',         label: 'Check' },
		{ value: 'wire_transfer', label: 'Wire Transfer' },
		{ value: 'other',         label: 'Other' }
	];

	// ── Validation per step ───────────────────────────────────────────────────
	const step2Valid = $derived(
		form.description.trim().length > 0 &&
		String(form.amount ?? '').trim().length > 0 &&
		Number(form.amount) > 0 &&
		form.category.length > 0 &&
		form.date.length > 0 &&
		(form.billingType === 'fixed' || (!!form.hours && !!form.hourlyRate))
	);

	// ── Submit ────────────────────────────────────────────────────────────────
	async function submit() {
		saving = true; err = '';
		try {
			// Prepend hourly breakdown to notes so it's always visible on the record
			let notesValue = form.notes.trim();
			if (form.billingType === 'hourly' && form.hours && form.hourlyRate) {
				const breakdown = `[Hourly: ${form.hours} hrs × $${Number(form.hourlyRate).toFixed(2)}/hr = $${(Number(form.hours) * Number(form.hourlyRate)).toFixed(2)}]`;
				notesValue = notesValue ? `${breakdown}\n${notesValue}` : breakdown;
			}

			const payload: Record<string, any> = {
				description:     form.description.trim(),
				amount:          Number(form.amount),
				category:        form.category,
				status:          form.status,
				date:            form.date,
				taskId:          task.id,
				notes:           notesValue
			};
			// projectId is not a field on the expenses collection — resolved server-side via taskId
			if (form.paymentMethod)   payload.paymentMethod   = form.paymentMethod;
			if (form.vendor)          payload.vendor          = form.vendor;
			if (form.reimbursementTo) payload.reimbursementTo = form.reimbursementTo.trim();

			const res = await fetch('/api/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error ?? data.message ?? `Error ${res.status}`);
			}

			savedStatus = form.status as 'draft' | 'submitted';
			success = true;
			await invalidateAll();
			if (savedStatus === 'submitted') {
				setTimeout(() => {
					open = false;
					reset();
				}, 1400);
			}
		} catch (e: any) {
			err = e.message ?? 'Failed to create expense';
		} finally {
			saving = false;
		}
	}

	function reset() {
		step = 1; success = false; err = ''; savedStatus = 'submitted';
		form = {
			description: task?.title ?? '', amount: task?.task_budget ? String(task.task_budget) : '', billingType: 'fixed', hours: '', hourlyRate: '',
			category: 'Marketing', paymentMethod: '', vendor: '', reimbursementTo: '',
			date: new Date().toISOString().slice(0, 10),
			status: 'submitted', notes: ''
		};
	}

	function close() { open = false; reset(); }

	$effect(() => { if (open) reset(); });

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

{#if open}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">

		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
			<div class="flex items-center gap-2">
				<Receipt class="size-5 text-emerald-400" />
				<span class="font-semibold text-slate-100">Log Expense</span>
				<span class="text-xs text-slate-500 ml-1">— from task</span>
			</div>
			<button onclick={close} class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<X class="size-5" />
			</button>
		</div>

		<!-- Step indicator -->
		<div class="flex items-center gap-0 px-6 pt-4 shrink-0">
			{#each [
				{ n: 1, label: 'Context' },
				{ n: 2, label: 'Details' },
				{ n: 3, label: 'Submit' }
			] as s}
				<div class="flex items-center gap-0 flex-1">
					<div class="flex flex-col items-center gap-1 flex-1">
						<div class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
							{step > s.n ? 'bg-emerald-600 text-white' : step === s.n ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/40' : 'bg-slate-700 text-slate-400'}">
							{#if step > s.n}
								<CheckCircle2 class="size-4" />
							{:else}
								{s.n}
							{/if}
						</div>
						<span class="text-[10px] {step === s.n ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">{s.label}</span>
					</div>
					{#if s.n < 3}
						<div class="h-px flex-1 mb-4 {step > s.n ? 'bg-emerald-600' : 'bg-slate-700'} mx-1"></div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">

			<!-- ── Step 1: Context ─────────────────────────────────────────── -->
			{#if step === 1}
				<p class="text-sm text-slate-400">Review the context for this expense. All of this will be attached automatically.</p>

				<!-- Context cards -->
				<div class="space-y-2">
					{#if departmentName}
					<div class="flex items-center gap-3 p-3 rounded-xl bg-blue-950/40 border border-blue-800/50">
						<Building2 class="size-4 text-blue-400 shrink-0" />
						<div>
							<p class="text-[10px] text-blue-400 uppercase tracking-wide">Department</p>
							<p class="text-sm font-semibold text-slate-100">{departmentName}</p>
						</div>
					</div>
					{/if}

					{#if project}
					<div class="flex items-center gap-3 p-3 rounded-xl bg-violet-950/40 border border-violet-800/50">
						<FolderKanban class="size-4 text-violet-400 shrink-0" />
						<div>
							<p class="text-[10px] text-violet-400 uppercase tracking-wide">Project</p>
							<p class="text-sm font-semibold text-slate-100">{project.name}</p>
							{#if project.status}
								<p class="text-[10px] text-slate-400 capitalize mt-0.5">{project.status.replace('_',' ')}</p>
							{/if}
						</div>
					</div>
					{/if}

					<div class="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
						<ListTodo class="size-4 text-emerald-400 shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="text-[10px] text-emerald-400 uppercase tracking-wide">Task</p>
							<p class="text-sm font-semibold text-slate-100 truncate">{task?.title}</p>
							{#if task?.status}
								<p class="text-[10px] text-slate-400 capitalize mt-0.5">{task.status.replace('_',' ')} · {task.priority ?? 'no priority'}</p>
							{/if}
						</div>
					</div>

					<!-- Budget bar -->
					<div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
						<div class="flex items-center gap-2 mb-2">
							<DollarSign class="size-4 text-slate-400 shrink-0" />
							<p class="text-[10px] text-slate-400 uppercase tracking-wide">Task Budget</p>
						</div>
						{#if budget > 0}
							<div class="flex justify-between text-xs mb-1.5">
								<span class="text-slate-400">Spent <span class="text-slate-200 font-semibold">{fmt(actual)}</span></span>
								<span class="text-slate-400">Budget <span class="text-slate-200 font-semibold">{fmt(budget)}</span></span>
							</div>
							<div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
								<div class="h-full rounded-full {Math.min(100,(actual/budget)*100) > 90 ? 'bg-red-500' : Math.min(100,(actual/budget)*100) > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}"
									style="width:{Math.min(100,(actual/budget)*100).toFixed(1)}%"></div>
							</div>
							<p class="text-[10px] text-slate-500 mt-1">{fmt(remaining)} remaining</p>
						{:else}
							<p class="text-xs text-slate-500">No budget set for this task</p>
						{/if}
					</div>
				</div>

			<!-- ── Step 2: Details ─────────────────────────────────────────── -->
			{:else if step === 2}
				<div>
					<label class={LABEL}>Description *</label>
					<input bind:value={form.description} class={INPUT} placeholder="What was this expense for?" />
				</div>

				<!-- Billing type toggle -->
				<div>
					<label class={LABEL}>Billing Type</label>
					<div class="flex rounded-lg border border-slate-600 overflow-hidden">
						<button type="button"
							onclick={() => form.billingType = 'fixed'}
							class="flex-1 py-2 text-sm font-medium transition-colors
								{form.billingType === 'fixed' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
							Fixed Amount
						</button>
						<button type="button"
							onclick={() => form.billingType = 'hourly'}
							class="flex-1 py-2 text-sm font-medium transition-colors border-l border-slate-600
								{form.billingType === 'hourly' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
							Hourly Rate
						</button>
					</div>
				</div>

				{#if form.billingType === 'hourly'}
				<!-- Hourly rate inputs — amount auto-calculates -->
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Hours Worked *</label>
						<input bind:value={form.hours} type="number" min="0.25" step="0.25" class={INPUT} placeholder="e.g. 8" />
					</div>
					<div>
						<label class={LABEL}>Hourly Rate ($/hr) *</label>
						<input bind:value={form.hourlyRate} type="number" min="1" step="0.01" class={INPUT} placeholder="e.g. 150" />
					</div>
				</div>
				{#if form.hours && form.hourlyRate}
				<div class="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-sm">
					<span class="text-slate-400">{form.hours} hrs × {fmt(Number(form.hourlyRate))}/hr</span>
					<span class="font-bold text-emerald-300">{fmt(Number(form.hours) * Number(form.hourlyRate))}</span>
				</div>
				{/if}
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>{form.billingType === 'hourly' ? 'Total Amount (auto-calculated)' : 'Amount ($) *'}</label>
						<input
							value={form.amount}
							oninput={(e) => { form.amount = (e.currentTarget as HTMLInputElement).value; }}
							type="number" min="0.01" step="0.01"
							readonly={form.billingType === 'hourly'}
							class="{INPUT} {form.billingType === 'hourly' ? 'opacity-60 cursor-not-allowed' : ''}"
							placeholder="0.00"
						/>
						{#if wouldExceed}
							<p class="text-[10px] text-yellow-400 mt-1 flex items-center gap-1">
								<AlertCircle class="size-3" /> Exceeds task budget by {fmt((actual + newAmount) - budget)}
							</p>
						{/if}
					</div>
					<div>
						<label class={LABEL}>Expense Date * <span class="font-normal text-slate-500">(incurred or invoiced)</span></label>
						<input bind:value={form.date} type="date" class={INPUT} />
					</div>
				</div>

				<div>
					<label class={LABEL}>Category *</label>
					<select bind:value={form.category} class={INPUT}>
						{#each CATEGORIES as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Payment Method</label>
						<select bind:value={form.paymentMethod} class={INPUT}>
							<option value="">— Select —</option>
							{#each PAYMENT_METHODS as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Vendor</label>
						<select bind:value={form.vendor} class={INPUT}>
							<option value="">— None —</option>
							{#each vendors as v}
								<option value={v.id}>{v.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label class={LABEL}>Reimbursement To</label>
					<input bind:value={form.reimbursementTo} class={INPUT} placeholder="Name of person to reimburse (if any)" />
				</div>

			<!-- ── Step 3: Submit ──────────────────────────────────────────── -->
			{:else if step === 3}

				{#if success}
					<div class="flex flex-col items-center justify-center py-8 gap-3 text-center">
						<CheckCircle2 class="size-12 text-emerald-400" />
						<p class="text-lg font-semibold text-emerald-300">Expense created!</p>
						{#if savedStatus === 'draft'}
							<p class="text-sm text-slate-400">Saved as a draft. You can find and submit it from the Expenses or Approvals page.</p>
							<div class="flex flex-col gap-2 mt-1 w-full max-w-xs">
								<a
									href="/dashboard/approvals"
									onclick={close}
									class="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
								>
									Go to Approvals <ArrowRight class="size-4" />
								</a>
								<a
									href="/dashboard/expenses"
									onclick={close}
									class="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
								>
									Go to Expenses
								</a>
								<button
									type="button"
									onclick={close}
									class="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
								>
									Stay here
								</button>
							</div>
						{:else}
							<p class="text-sm text-slate-400">Submitted for approval.</p>
						{/if}
					</div>
				{:else}
					<!-- Summary -->
					<div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2 text-sm">
						<p class="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Summary</p>
						<div class="flex justify-between"><span class="text-slate-400">Task</span><span class="text-slate-100 font-medium truncate max-w-48">{task?.title}</span></div>
						{#if project}<div class="flex justify-between"><span class="text-slate-400">Project</span><span class="text-slate-100">{project.name}</span></div>{/if}
						<div class="flex justify-between"><span class="text-slate-400">Description</span><span class="text-slate-100 truncate max-w-48">{form.description}</span></div>
						<div class="flex justify-between"><span class="text-slate-400">Amount</span><span class="font-bold text-emerald-400 text-base">{fmt(newAmount)}</span></div>
						{#if form.billingType === 'hourly'}
						<div class="flex justify-between text-xs">
							<span class="text-slate-400">Rate</span>
							<span class="text-slate-300">{form.hours} hrs × {fmt(Number(form.hourlyRate))}/hr</span>
						</div>
						{/if}
						<div class="flex justify-between"><span class="text-slate-400">Category</span><span class="text-slate-100">{form.category}</span></div>
						<div class="flex justify-between"><span class="text-slate-400">Date</span><span class="text-slate-100">{form.date}</span></div>
						{#if form.vendor}
							{@const v = vendors.find(v => v.id === form.vendor)}
							<div class="flex justify-between"><span class="text-slate-400">Vendor</span><span class="text-slate-100">{v?.name ?? form.vendor}</span></div>
						{/if}
						{#if wouldExceed}
							<div class="flex items-center gap-2 pt-1 text-yellow-400 text-xs">
								<AlertCircle class="size-3.5 shrink-0" />
								This expense exceeds the task budget by {fmt((actual + newAmount) - budget)}
							</div>
						{/if}
					</div>

					<!-- Notes -->
					<div>
						<label class={LABEL}>Notes (optional)</label>
						<textarea bind:value={form.notes} rows="3" class="{INPUT} resize-none" placeholder="Any additional context for approvers…"></textarea>
					</div>

					<!-- Submit as draft or submit for approval -->
					<div class="space-y-2">
						<p class="text-xs text-slate-400 uppercase tracking-wide font-semibold">How would you like to save this?</p>
						<label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
							{form.status === 'submitted' ? 'border-emerald-600 bg-emerald-950/30' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}">
							<input type="radio" bind:group={form.status} value="submitted" class="mt-0.5 accent-emerald-500" />
							<div>
								<p class="text-sm font-semibold text-slate-200">Submit for Approval</p>
								<p class="text-xs text-slate-400">Sends to the approvals queue immediately — recommended in most cases</p>
							</div>
						</label>
						<label class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
							{form.status === 'draft' ? 'border-slate-500 bg-slate-800' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}">
							<input type="radio" bind:group={form.status} value="draft" class="mt-0.5 accent-emerald-500" />
							<div>
								<p class="text-sm font-semibold text-slate-300">Save as Draft</p>
								<p class="text-xs text-slate-500 mt-0.5">Only use this if you need to:</p>
								<ul class="text-xs text-slate-500 mt-1 space-y-0.5 list-disc list-inside">
									<li>Gather a missing receipt or invoice before submitting</li>
									<li>Confirm the final amount with a vendor</li>
									<li>Get sign-off from your manager before it enters the queue</li>
								</ul>
								<p class="text-xs text-slate-600 mt-1.5">Drafts do not enter the approval queue until submitted.</p>
							</div>
						</label>
					</div>

					{#if err}
						<div class="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
							<AlertCircle class="size-4 shrink-0" />{err}
						</div>
					{/if}
				{/if}
			{/if}
		</div>

		<!-- Footer nav -->
		{#if !success}
		<div class="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
			{#if step > 1}
				<button onclick={() => step--} class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
					<ChevronLeft class="size-4" /> Back
				</button>
			{:else}
				<button onclick={close} class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
			{/if}

			{#if step < 3}
				<button
					onclick={() => step++}
					disabled={step === 2 && !step2Valid}
					class="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
					Continue <ChevronRight class="size-4" />
				</button>
			{:else}
				<button
					onclick={submit}
					disabled={saving}
					class="flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60">
					{#if saving}
						<span class="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving…
					{:else}
						<Receipt class="size-4" />
						{form.status === 'submitted' ? 'Submit for Approval' : 'Save as Draft'}
					{/if}
				</button>
			{/if}
		</div>
		{/if}

	</div>
</div>
{/if}
