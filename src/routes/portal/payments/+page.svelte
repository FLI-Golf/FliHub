<script lang="ts">
	import type { PageData } from './$types';
	import { DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config   = $derived((data as any).portalConfig);
	const payments = $derived((data as any).payments ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-emerald-400');

	const STATUS: Record<string, { label: string; style: string; icon: any }> = {
		paid:    { label: 'Paid',    style: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50', icon: CheckCircle2 },
		pending: { label: 'Pending', style: 'bg-amber-950/50  text-amber-300  border-amber-700/50',    icon: Clock },
		hold:    { label: 'On Hold', style: 'bg-red-950/50    text-red-300    border-red-700/50',       icon: AlertCircle },
	};

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}
	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		const dateOnly = d.includes('T') ? d.split('T')[0] : d.split(' ')[0];
		const [y, m, day] = dateOnly.split('-').map(Number);
		if (!y) return '—';
		return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const totalPaid = $derived(
		payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
	const totalPending = $derived(
		payments.filter((p: any) => p.status !== 'paid').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
</script>

<svelte:head><title>Payments — {config?.label} Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<DollarSign class="size-6 {accentText}" /> My Payments
	</h1>

	<!-- Totals strip -->
	<div class="grid grid-cols-2 gap-4">
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Total Paid</p>
			<p class="text-xl font-bold text-emerald-400">{fmt(totalPaid)}</p>
		</div>
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Pending</p>
			<p class="text-xl font-bold text-amber-400">{fmt(totalPending)}</p>
		</div>
	</div>

	<!-- Payment list -->
	{#if payments.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<DollarSign class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No payments on record yet.</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each payments as p}
				{@const s = STATUS[p.status] ?? STATUS.pending}
				{@const StatusIcon = s.icon}
				<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4
					flex items-center justify-between gap-4">
					<div class="flex items-center gap-3 min-w-0">
						<StatusIcon class="size-4 shrink-0 {s.style.split(' ')[1]}" />
						<div class="min-w-0">
							<p class="text-sm font-semibold text-slate-200 truncate">
								{p.description ?? p.expand?.workOrder?.description ?? 'Payment'}
							</p>
							<p class="text-[11px] text-slate-500">{fmtDate(p.paidAt ?? p.created)}</p>
						</div>
					</div>
					<div class="shrink-0 text-right flex items-center gap-3">
						<p class="text-sm font-bold {accentText}">{fmt(p.amount ?? 0)}</p>
						<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border {s.style}">
							{s.label}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
