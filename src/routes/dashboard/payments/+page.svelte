<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { invalidateAll } from '$app/navigation';
	import {
		DollarSign, ArrowDownLeft, ArrowUpRight, Clock,
		CheckCircle2, AlertCircle, ChevronDown, Info,
		Receipt, Wallet, Building2, Star, TrendingUp,
		ArrowRight, UserCircle, ShieldCheck, X, Plus
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const payments      = $derived(data.payments ?? []);
	const actionQueue   = $derived(data.actionQueue ?? []);
	const sponsorPmts   = $derived(data.sponsorPayments ?? []);
	const metrics       = $derived(data.metrics);
	const seedFunding   = $derived(metrics?.seedFunding ?? { grossCommitted: 7_500_000, grossRecorded: 0, netReceived: 0, deductions: 0, count: 0 });
	const seedReceipts  = $derived(data.seedFundingReceipts ?? []);

	let tab          = $state<'all' | 'outgoing' | 'incoming'>('all');
	let infoExpanded = $state(false);
	let showSeedModal = $state(false);
	let seedBusy = $state(false);
	let seedError = $state('');
	let seedForm = $state({
		grossAmount: '7500000',
		netReceived: '',
		bankFees: '',
		brokerCommission: '',
		legalClosingFees: '',
		otherDeductions: '',
		receivedDate: new Date().toISOString().slice(0, 10),
		bankAccount: '',
		referenceNumber: '',
		notes: ''
	});

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
		pending_approval: { label: 'Pending Approval', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
		approved:         { label: 'Approved',         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
		scheduled:        { label: 'Scheduled',        color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30' },
		paid:             { label: 'Paid',             color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
		received:         { label: 'Received',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
		void:             { label: 'Void',             color: 'text-slate-500',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30' },
		rejected:         { label: 'Rejected',         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
	};

	const TYPE_LABELS: Record<string, string> = {
		reimbursement:    'Reimbursement',
		expense:          'Expense',
		vendor_invoice:   'Vendor Invoice',
		pro_payment:      'Pro Payment',
		franchise_payout: 'Franchise Payout',
		sponsor_payment:  'Sponsor Payment',
		franchise_fee:    'Franchise Fee',
		merchandise:      'Merchandise',
		other_income:     'Other Income',
		other_expense:    'Other Expense',
	};

	function getStatus(s: string) {
		return STATUS_CONFIG[s] ?? { label: s, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
	}

	const filtered = $derived(
		tab === 'all' ? payments : payments.filter((p: any) => p.direction === tab)
	);

	// Pending sponsor payments (not yet received)
	const pendingSponsorPmts = $derived(
		sponsorPmts.filter((p: any) => p.status !== 'received' && p.status !== 'paid')
	);

	const netPosition = $derived(
		(metrics?.totalIncoming ?? 0) - (metrics?.totalOutgoing ?? 0)
	);
	const seedCashAvailable = $derived((seedFunding.netReceived ?? 0) - (metrics?.totalOutgoing ?? 0));
	const totalSeedDeductions = $derived(
		Number(seedForm.bankFees || 0) +
		Number(seedForm.brokerCommission || 0) +
		Number(seedForm.legalClosingFees || 0) +
		Number(seedForm.otherDeductions || 0)
	);

	$effect(() => {
		const gross = Number(seedForm.grossAmount || 0);
		if (gross > 0 && totalSeedDeductions >= 0 && !seedBusy) {
			const next = Math.max(0, gross - totalSeedDeductions);
			if (!seedForm.netReceived || Number(seedForm.netReceived) > gross) {
				seedForm.netReceived = String(next);
			}
		}
	});

	async function submitSeedReceipt(e: SubmitEvent) {
		e.preventDefault();
		seedBusy = true;
		seedError = '';

		try {
			const res = await fetch('/api/seed-funding-receipts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(seedForm)
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'Failed to record seed receipt');
			}
			showSeedModal = false;
			seedForm = {
				grossAmount: '7500000',
				netReceived: '',
				bankFees: '',
				brokerCommission: '',
				legalClosingFees: '',
				otherDeductions: '',
				receivedDate: new Date().toISOString().slice(0, 10),
				bankAccount: '',
				referenceNumber: '',
				notes: ''
			};
			await invalidateAll();
		} catch (err: any) {
			seedError = err?.message ?? 'Failed to record seed receipt';
		} finally {
			seedBusy = false;
		}
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

<svelte:head><title>Payments & Income — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Payments & Income</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Outgoing payments and incoming revenue — all tracked against QuickBooks work order references.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button onclick={() => showSeedModal = true} size="sm" class="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-3.5" /> Seed Receipt
			</Button>
			<Button href="/dashboard/reimbursements" variant="outline" size="sm" class="gap-1.5">
				<Receipt class="size-3.5" /> Reimbursements
			</Button>
			<Button href="/dashboard/expenses" variant="outline" size="sm" class="gap-1.5">
				<DollarSign class="size-3.5" /> Expenses
			</Button>
		</div>
	</div>

	<!-- Info card -->
	<button onclick={() => infoExpanded = !infoExpanded} class="w-full text-left group/info">
		<div class="rounded-xl border border-yellow-500/20 {infoExpanded ? 'bg-slate-800/80' : 'bg-slate-800/40'} hover:bg-slate-800/80 transition-colors px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div class="size-7 rounded-lg bg-yellow-500/15 flex items-center justify-center shrink-0">
						<Info class="size-3.5 text-yellow-400" />
					</div>
					<p class="text-xs font-medium text-yellow-300">{infoExpanded ? 'About Payments & Income' : 'How this works'}</p>
				</div>
				<ChevronDown class="size-4 text-slate-500 group-hover/info:text-slate-300 transition-all duration-200 shrink-0 {infoExpanded ? 'rotate-180' : ''}" />
			</div>
			{#if infoExpanded}
				<div class="text-xs text-yellow-200/70 leading-relaxed mt-3 pl-9 space-y-2">
					<p>
						This page is Ina's working view for all money moving in and out of FLI Golf. <span class="font-semibold text-yellow-300">Outgoing</span> payments are created when an expense, reimbursement work order, or vendor invoice is approved — Ina reviews, schedules, and marks them paid. <span class="font-semibold text-yellow-300">Incoming</span> records capture every dollar received — sponsor payments, franchise fees, and other revenue.
					</p>
					<p>
						Every payment record carries a <span class="font-semibold text-yellow-300">reference number</span> (WO-001 for reimbursements, or auto-assigned for other types) that Ina enters as the memo in QuickBooks. This keeps both systems in sync without a direct integration — reconciliation is a simple reference number lookup.
					</p>
				</div>
			{/if}
		</div>
	</button>

	<!-- CPA badge -->
	<div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-950/20">
		<div class="size-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
			<UserCircle class="size-5 text-violet-400" />
		</div>
		<div>
			<p class="text-xs font-bold uppercase tracking-wide text-violet-400">Department Head · CPA</p>
			<p class="text-sm font-bold text-white">Ina Masten</p>
		</div>
		<div class="ml-auto flex items-center gap-1.5">
			<ShieldCheck class="size-3.5 text-emerald-400" />
			<a href="mailto:inam@mastensolutions.com" class="text-xs text-emerald-400 hover:underline">inam@mastensolutions.com</a>
		</div>
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="p-4 border-l-4 border-l-red-500 bg-red-950/20">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-red-300/70 font-medium">Total Paid Out</p>
				<div class="size-7 rounded-lg bg-red-500/20 flex items-center justify-center">
					<ArrowUpRight class="size-3.5 text-red-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{fmt(metrics?.totalOutgoing ?? 0)}</p>
			<p class="text-xs text-red-300/60 mt-0.5">{fmt(metrics?.pendingOut ?? 0)} pending</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/20">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-emerald-300/70 font-medium">Total Received</p>
				<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
					<ArrowDownLeft class="size-3.5 text-emerald-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{fmt(metrics?.totalIncoming ?? 0)}</p>
			<p class="text-xs text-emerald-300/60 mt-0.5">{fmt(metrics?.pendingIn ?? 0)} expected</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/20">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-amber-300/70 font-medium">Action Queue</p>
				<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
					<Clock class="size-3.5 text-amber-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{actionQueue.length}</p>
			<p class="text-xs text-amber-300/60 mt-0.5">approved, awaiting payment</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/20">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-blue-300/70 font-medium">All Transactions</p>
				<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<Wallet class="size-3.5 text-blue-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{metrics?.count ?? 0}</p>
			<p class="text-xs text-blue-300/60 mt-0.5">recorded to date</p>
		</Card>
	</div>

	<!-- Seed funding receipt -->
	<Card class="p-5 border-l-4 border-l-emerald-500 bg-emerald-950/10">
		<div class="flex items-start justify-between gap-4 flex-wrap">
			<div>
				<p class="text-xs font-bold uppercase tracking-wide text-emerald-400">Seed Funding Receipt</p>
				<h2 class="text-lg font-bold text-white mt-1">Gross raise vs. actual cash received</h2>
				<p class="text-xs text-slate-400 mt-1 max-w-2xl">
					Use this for the starting cash balance after the $7.5M raise clears the bank. Gross committed stays at $7.5M; operating cash should use the net amount after commissions, closing costs, and bank fees.
				</p>
			</div>
			<Button onclick={() => showSeedModal = true} variant="outline" size="sm" class="gap-1.5 border-emerald-700 text-emerald-300">
				<Plus class="size-3.5" /> Record Actual Receipt
			</Button>
		</div>
		<div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
			<div class="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
				<p class="text-[10px] uppercase tracking-wide text-slate-500">Gross Committed</p>
				<p class="text-xl font-black text-white mt-1">{fmt(seedFunding.grossCommitted)}</p>
			</div>
			<div class="rounded-lg border border-emerald-700/50 bg-emerald-950/30 p-3">
				<p class="text-[10px] uppercase tracking-wide text-emerald-400">Net Received</p>
				<p class="text-xl font-black text-emerald-300 mt-1">{fmt(seedFunding.netReceived)}</p>
			</div>
			<div class="rounded-lg border border-amber-700/50 bg-amber-950/20 p-3">
				<p class="text-[10px] uppercase tracking-wide text-amber-400">Deductions</p>
				<p class="text-xl font-black text-amber-300 mt-1">{fmt(seedFunding.deductions)}</p>
			</div>
			<div class="rounded-lg border border-blue-700/50 bg-blue-950/20 p-3">
				<p class="text-[10px] uppercase tracking-wide text-blue-400">Cash Available</p>
				<p class="text-xl font-black {seedCashAvailable >= 0 ? 'text-blue-300' : 'text-red-300'} mt-1">{fmt(seedCashAvailable)}</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
				<p class="text-[10px] uppercase tracking-wide text-slate-500">Receipt Records</p>
				<p class="text-xl font-black text-white mt-1">{seedFunding.count}</p>
			</div>
		</div>
		{#if seedReceipts.length > 0}
			<div class="mt-4 space-y-2">
				{#each seedReceipts.slice(0, 3) as receipt}
					<div class="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
						<div class="min-w-0">
							<p class="text-xs font-medium text-slate-200">{receipt.referenceNumber || 'Seed funding receipt'}</p>
							<p class="text-[10px] text-slate-500">{fmtDate(receipt.receivedDate)}{receipt.bankAccount ? ` · ${receipt.bankAccount}` : ''}</p>
						</div>
						<div class="text-right shrink-0">
							<p class="text-sm font-bold text-emerald-300">{fmt(receipt.netReceived)}</p>
							<p class="text-[10px] text-slate-500">gross {fmt(receipt.grossAmount)}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Main ledger -->
		<div class="lg:col-span-2 flex flex-col gap-4">

			<!-- Action queue — approved items awaiting payment -->
			{#if actionQueue.length > 0}
				<div>
					<h2 class="text-sm font-bold mb-3 flex items-center gap-2">
						<AlertCircle class="size-4 text-amber-400" />
						Action Queue — Approved, Awaiting Payment
					</h2>
					<div class="space-y-2">
						{#each actionQueue as item, i}
							{@const rowEven = i % 2 === 0}
							<Card class="p-4 border-l-4 border-l-amber-500 {rowEven ? 'bg-slate-900' : 'bg-slate-800/60'}">
								<div class="flex items-center justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="size-8 rounded-lg {rowEven ? 'bg-slate-700' : 'bg-slate-700/80'} flex items-center justify-center shrink-0">
											{#if item.sourceType === 'reimbursement'}
												<Receipt class="size-3.5 text-amber-400" />
											{:else}
												<DollarSign class="size-3.5 text-amber-400" />
											{/if}
										</div>
										<div class="min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-xs">{item.label}</span>
												<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium capitalize">{item.sourceType}</span>
											</div>
											{#if item.sublabel}
												<p class="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
											{/if}
										</div>
									</div>
									<div class="text-right shrink-0">
										<p class="text-sm font-bold text-white">{fmt(item.amount)}</p>
										<a href="/dashboard/{item.sourceType === 'reimbursement' ? 'reimbursements' : 'expenses'}"
											class="text-[10px] text-blue-400 hover:underline">view →</a>
									</div>
								</div>
							</Card>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Sponsor payments due -->
			{#if pendingSponsorPmts.length > 0}
				<div>
					<h2 class="text-sm font-bold mb-3 flex items-center gap-2">
						<Star class="size-4 text-blue-400" />
						Sponsor Payments Expected
					</h2>
					<div class="space-y-2">
						{#each pendingSponsorPmts as pmt, i}
							{@const rowEven = i % 2 === 0}
							{@const sponsor = pmt.expand?.sponsor}
							<Card class="p-4 border-l-4 border-l-blue-500 {rowEven ? 'bg-slate-900' : 'bg-slate-800/60'}">
								<div class="flex items-center justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="size-8 rounded-lg {rowEven ? 'bg-slate-700' : 'bg-slate-700/80'} flex items-center justify-center shrink-0">
											<Building2 class="size-3.5 text-blue-400" />
										</div>
										<div class="min-w-0">
											<p class="text-sm font-medium">{sponsor?.companyName ?? 'Unknown Sponsor'}</p>
											<div class="flex items-center gap-2 mt-0.5">
												<span class="text-[10px] text-muted-foreground capitalize">{pmt.paymentType ?? 'payment'}</span>
												{#if pmt.dueDate}
													<span class="text-[10px] text-amber-400">Due {fmtDate(pmt.dueDate)}</span>
												{/if}
												{#if pmt.invoiceNumber}
													<span class="text-[10px] font-mono text-slate-400">{pmt.invoiceNumber}</span>
												{/if}
											</div>
										</div>
									</div>
									<div class="text-right shrink-0">
										<p class="text-sm font-bold text-emerald-400">{fmt(pmt.amount)}</p>
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 capitalize">{pmt.status}</span>
									</div>
								</div>
							</Card>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Payments ledger -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-bold">Transaction Ledger</h2>
					<div class="flex gap-1">
						{#each [['all','All'], ['outgoing','Outgoing'], ['incoming','Incoming']] as [id, label]}
							<button
								onclick={() => tab = id as any}
								class="px-3 py-1 rounded-lg text-xs font-medium transition-colors
									{tab === id ? 'bg-slate-700 text-white' : 'text-muted-foreground hover:text-slate-300 hover:bg-slate-800'}"
							>{label}</button>
						{/each}
					</div>
				</div>

				{#if filtered.length === 0}
					<Card class="p-8 text-center">
						<Wallet class="size-8 text-slate-600 mx-auto mb-2" />
						<p class="text-sm text-muted-foreground">No transactions recorded yet.</p>
						<p class="text-xs text-muted-foreground mt-1">Payments will appear here as they are processed.</p>
					</Card>
				{:else}
					<div class="space-y-2">
						{#each filtered as pmt, i (pmt.id)}
							{@const s = getStatus(pmt.status)}
							{@const rowEven = i % 2 === 0}
							{@const isOut = pmt.direction === 'outgoing'}
							<Card class="p-4 border-l-4 {isOut ? 'border-l-red-500' : 'border-l-emerald-500'} {rowEven ? 'bg-slate-900' : 'bg-slate-800/60'}">
								<div class="flex items-center justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="size-8 rounded-lg {rowEven ? 'bg-slate-700' : 'bg-slate-700/80'} flex items-center justify-center shrink-0">
											{#if isOut}
												<ArrowUpRight class="size-3.5 text-red-400" />
											{:else}
												<ArrowDownLeft class="size-3.5 text-emerald-400" />
											{/if}
										</div>
										<div class="min-w-0">
											<div class="flex items-center gap-2 flex-wrap">
												{#if pmt.referenceNumber}
													<span class="text-xs font-black font-mono {isOut ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'} border px-2 py-0.5 rounded">{pmt.referenceNumber}</span>
												{/if}
												<span class="text-xs text-muted-foreground">{TYPE_LABELS[pmt.type] ?? pmt.type}</span>
											</div>
											<p class="text-xs text-slate-300 mt-0.5 truncate">{pmt.description}</p>
											{#if pmt.paidDate || pmt.receivedDate}
												<p class="text-[10px] text-muted-foreground mt-0.5">{fmtDate(pmt.paidDate || pmt.receivedDate)}</p>
											{/if}
										</div>
									</div>
									<div class="text-right shrink-0">
										<p class="text-sm font-bold {isOut ? 'text-red-400' : 'text-emerald-400'}">{isOut ? '-' : '+'}{fmt(pmt.amount)}</p>
										<span class="text-[10px] px-1.5 py-0.5 rounded {s.bg} {s.border} {s.color} border">{s.label}</span>
									</div>
								</div>
							</Card>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right sidebar -->
		<div class="flex flex-col gap-4">

			<!-- Net position -->
			<Card class="p-4">
				<h2 class="text-sm font-bold mb-3">Net Position</h2>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Total received</span>
						<span class="font-bold text-emerald-400">{fmt(metrics?.totalIncoming ?? 0)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Total paid out</span>
						<span class="font-bold text-red-400">({fmt(metrics?.totalOutgoing ?? 0)})</span>
					</div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="flex justify-between">
						<span class="font-semibold">Net</span>
						<span class="font-black {netPosition >= 0 ? 'text-emerald-400' : 'text-red-400'}">{fmt(netPosition)}</span>
					</div>
					<div class="h-px bg-slate-700 my-1"></div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Pending outgoing</span>
						<span class="text-amber-400">{fmt(metrics?.pendingOut ?? 0)}</span>
					</div>
					<div class="flex justify-between text-xs">
						<span class="text-muted-foreground">Expected incoming</span>
						<span class="text-blue-400">{fmt(metrics?.pendingIn ?? 0)}</span>
					</div>
				</div>
			</Card>

			<!-- Quick links -->
			<Card class="p-4 space-y-2">
				<h2 class="text-sm font-bold mb-1">Related</h2>
				{#each [
					{ label: 'Reimbursements',      href: '/dashboard/reimbursements',      icon: Receipt,    desc: 'WO work orders' },
					{ label: 'Expenses',            href: '/dashboard/expenses',            icon: DollarSign, desc: 'Approved expenses' },
					{ label: 'Sponsor Payments',    href: '/dashboard/sponsors',            icon: Star,       desc: 'Incoming from sponsors' },
					{ label: 'Sponsorship Revenue', href: '/dashboard/sponsorship-revenue', icon: TrendingUp, desc: 'Revenue projections' },
				] as link}
					{@const LinkIcon = link.icon}
					<a href={link.href} class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors group">
						<div class="size-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-600 transition-colors">
							<LinkIcon class="size-3.5 text-slate-300" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-xs font-medium">{link.label}</p>
							<p class="text-[10px] text-muted-foreground">{link.desc}</p>
						</div>
						<ArrowRight class="size-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
					</a>
				{/each}
			</Card>

		</div>
	</div>

</div>

{#if showSeedModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<div>
					<h2 class="text-base font-semibold text-slate-100">Record Seed Funding Receipt</h2>
					<p class="text-xs text-slate-500 mt-0.5">Track the actual starting cash after raise deductions.</p>
				</div>
				<button onclick={() => showSeedModal = false} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<form onsubmit={submitSeedReceipt} class="p-5 space-y-4">
				{#if seedError}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{seedError}</p>
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="seed-gross" class={LABEL}>Gross Raise Amount *</label>
						<input id="seed-gross" bind:value={seedForm.grossAmount} type="number" min="0" step="0.01" class={INPUT} required />
					</div>
					<div>
						<label for="seed-net" class={LABEL}>Actual Net Received *</label>
						<input id="seed-net" bind:value={seedForm.netReceived} type="number" min="0" step="0.01" class={INPUT} placeholder="Amount deposited" required />
					</div>
				</div>

				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div>
						<label for="seed-bank-fees" class={LABEL}>Bank/Wire Fees</label>
						<input id="seed-bank-fees" bind:value={seedForm.bankFees} type="number" min="0" step="0.01" class={INPUT} placeholder="0" />
					</div>
					<div>
						<label for="seed-commission" class={LABEL}>Broker Commission</label>
						<input id="seed-commission" bind:value={seedForm.brokerCommission} type="number" min="0" step="0.01" class={INPUT} placeholder="0" />
					</div>
					<div>
						<label for="seed-legal" class={LABEL}>Legal/Closing Fees</label>
						<input id="seed-legal" bind:value={seedForm.legalClosingFees} type="number" min="0" step="0.01" class={INPUT} placeholder="0" />
					</div>
					<div>
						<label for="seed-other" class={LABEL}>Other Deductions</label>
						<input id="seed-other" bind:value={seedForm.otherDeductions} type="number" min="0" step="0.01" class={INPUT} placeholder="0" />
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div>
						<label for="seed-date" class={LABEL}>Received Date *</label>
						<input id="seed-date" bind:value={seedForm.receivedDate} type="date" class={INPUT} required />
					</div>
					<div>
						<label for="seed-account" class={LABEL}>Bank / Account</label>
						<input id="seed-account" bind:value={seedForm.bankAccount} class={INPUT} placeholder="Operating account" />
					</div>
					<div>
						<label for="seed-reference" class={LABEL}>Reference Number</label>
						<input id="seed-reference" bind:value={seedForm.referenceNumber} class={INPUT} placeholder="Wire / QB ref" />
					</div>
				</div>

				<div>
					<label for="seed-notes" class={LABEL}>Notes</label>
					<textarea id="seed-notes" bind:value={seedForm.notes} rows="3" class="{INPUT} resize-none" placeholder="Broker statement, commission assumptions, reconciliation notes..."></textarea>
				</div>

				<div class="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-400">
					<div class="flex justify-between"><span>Gross raise</span><span>{fmt(Number(seedForm.grossAmount || 0))}</span></div>
					<div class="flex justify-between"><span>Total deductions entered</span><span>{fmt(totalSeedDeductions)}</span></div>
					<div class="flex justify-between font-semibold text-emerald-300 mt-1"><span>Expected net</span><span>{fmt(Math.max(0, Number(seedForm.grossAmount || 0) - totalSeedDeductions))}</span></div>
				</div>

				<div class="flex justify-end gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showSeedModal = false} class="border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={seedBusy} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
						<Plus class="size-4" />{seedBusy ? 'Recording...' : 'Record Receipt'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
