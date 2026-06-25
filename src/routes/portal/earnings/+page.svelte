<script lang="ts">
	import type { PageData } from './$types';
	import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config   = $derived((data as any).portalConfig);
	const earnings = $derived((data as any).earnings ?? []);
	const totals   = $derived((data as any).totals ?? { ytd: 0, pending: 0 });
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

	const byTournament = $derived(
		earnings.reduce((acc: Record<string, any[]>, e: any) => {
			const key = e.expand?.workOrder?.tournament ?? 'Other';
			(acc[key] = acc[key] ?? []).push(e);
			return acc;
		}, {})
	);
</script>

<svelte:head><title>Earnings — Pro Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<TrendingUp class="size-6 {accentText}" /> Earnings
	</h1>

	<!-- Totals strip -->
	<div class="grid grid-cols-2 gap-4">
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Year-to-Date</p>
			<p class="text-2xl font-bold text-emerald-400">{fmt(totals.ytd)}</p>
			<p class="text-[11px] text-slate-600 mt-1">{earnings.filter((e: any) => e.status === 'paid').length} paid</p>
		</div>
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Pending / On Hold</p>
			<p class="text-2xl font-bold text-amber-400">{fmt(totals.pending)}</p>
			<p class="text-[11px] text-slate-600 mt-1">{earnings.filter((e: any) => e.status !== 'paid').length} remaining</p>
		</div>
	</div>

	<!-- Breakdown by tournament -->
	{#if earnings.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<DollarSign class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No earnings yet.</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(byTournament) as [tournament, items]}
				<div>
					<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
						<Calendar class="size-3.5" /> {tournament}
					</h2>
					<div class="space-y-2">
						{#each items as e}
							{@const s = STATUS[e.status] ?? STATUS.pending}
							{@const StatusIcon = s.icon}
							<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
								<div class="flex items-center gap-3 min-w-0">
									<StatusIcon class="size-4 shrink-0 {s.style.split(' ')[1]}" />
									<div class="min-w-0">
										<p class="text-sm font-semibold text-slate-200 truncate">
											{e.expand?.workOrder?.description ?? 'Payment'}
										</p>
										<p class="text-[11px] text-slate-500">{fmtDate(e.paidAt ?? e.created)}</p>
									</div>
								</div>
								<div class="shrink-0 text-right flex items-center gap-3">
									<p class="text-sm font-bold {accentText}">{fmt(e.amount ?? 0)}</p>
									<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border {s.style}">
										{s.label}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
