<script lang="ts">
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config   = $derived((data as any).portalConfig);
	const rawEarnings = $derived((data as any).earnings ?? []);
	const serverTotals = $derived((data as any).totals ?? { paidYtd: 0, accruedYtd: 0, unpaidBalance: 0, paidCount: 0, unpaidCount: 0 });
	const debug    = $derived((data as any).debug ?? null);
	const viewerType = $derived((data as any).viewerType ?? 'unknown');
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-emerald-400');

	const STATUS: Record<string, { label: string; style: string; icon: any }> = {
		paid:    { label: 'Paid',    style: 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50', icon: CheckCircle2 },
		pending: { label: 'Pending', style: 'bg-amber-950/50  text-amber-300  border-amber-700/50',    icon: Clock },
		hold:    { label: 'On Hold', style: 'bg-red-950/50    text-red-300    border-red-700/50',       icon: AlertCircle },
		overdue: { label: 'Overdue', style: 'bg-red-950/50    text-red-300    border-red-700/50',       icon: AlertCircle },
		processing: { label: 'Processing', style: 'bg-sky-950/50 text-sky-300 border-sky-700/50', icon: Clock },
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

	function normalizeStatus(status: string | null | undefined) {
		const normalized = String(status ?? '').trim().toLowerCase();
		if (normalized === 'open') return 'pending';
		if (normalized === 'completed' || normalized === 'settled') return 'paid';
		return normalized;
	}

	function isPaidStatus(status: string | null | undefined) {
		const s = normalizeStatus(status);
		return s === 'paid';
	}

	function isAccruedStatus(status: string | null | undefined) {
		const s = normalizeStatus(status);
		return s !== 'void' && s !== 'cancelled' && s !== 'canceled';
	}

	function normalizeRecipient(recipient: string | null | undefined) {
		return String(recipient ?? '').trim().toLowerCase();
	}

	const clientFilteredEarnings = $derived(
		rawEarnings.filter((e: any) => {
			if (viewerType === 'pro') {
				if (normalizeRecipient(e?.recipient) !== 'pro') return false;
				const expectedProId = String(debug?.resolvedTalentId ?? '');
				if (!expectedProId) return true;
				return String(e?.pro ?? '') === expectedProId;
			}
			if (viewerType === 'manager') {
				if (normalizeRecipient(e?.recipient) !== 'manager') return false;
				const expectedManagerEmail = String(debug?.managerEmail ?? '').toLowerCase();
				if (!expectedManagerEmail) return true;
				return String(e?.managerEmail ?? '').toLowerCase() === expectedManagerEmail;
			}
			return true;
		})
	);

	const totals = $derived.by(() => {
		const paidYtd = clientFilteredEarnings
			.filter((e: any) => isPaidStatus(e?.status))
			.reduce((sum: number, e: any) => sum + Number(e?.amount ?? 0), 0);

		const accruedYtd = clientFilteredEarnings
			.filter((e: any) => isAccruedStatus(e?.status))
			.reduce((sum: number, e: any) => sum + Number(e?.amount ?? 0), 0);

		const unpaidBalance = clientFilteredEarnings
			.filter((e: any) => isAccruedStatus(e?.status) && !isPaidStatus(e?.status))
			.reduce((sum: number, e: any) => sum + Number(e?.amount ?? 0), 0);

		const paidCount = clientFilteredEarnings.filter((e: any) => isPaidStatus(e?.status)).length;
		const unpaidCount = clientFilteredEarnings.filter((e: any) => isAccruedStatus(e?.status) && !isPaidStatus(e?.status)).length;

		return { paidYtd, accruedYtd, unpaidBalance, paidCount, unpaidCount };
	});

	$effect(() => {
		if (!browser) return;
		console.groupCollapsed('[portal/earnings] client-debug');
		console.log('viewerType', viewerType);
		console.log('server.debug', debug);
		console.log('raw count', rawEarnings.length);
		console.log('client filtered count', clientFilteredEarnings.length);
		console.log('server totals', serverTotals);
		console.log('client totals', totals);
		console.table(
			clientFilteredEarnings.map((e: any) => ({
				id: e.id,
				recipient: e.recipient,
				pro: e.pro,
				managerEmail: e.managerEmail,
				statusRaw: e.status,
				statusNormalized: normalizeStatus(e.status),
				amount: e.amount,
				description: e.expand?.workOrder?.description ?? e.description ?? 'Payment',
			}))
		);
		console.groupEnd();
	});

	const byTournament = $derived(
		clientFilteredEarnings.reduce((acc: Record<string, any[]>, e: any) => {
			const key = e.expand?.tournament?.name ?? e.expand?.workOrder?.tournament ?? 'Other';
			(acc[key] = acc[key] ?? []).push(e);
			return acc;
		}, {})
	);

	const tournamentGroups = $derived(Object.entries(byTournament) as Array<[string, any[]]>);
</script>

<svelte:head><title>Earnings — Pro Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<TrendingUp class="size-6 {accentText}" /> Earnings
	</h1>

	<!-- Totals strip -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-sky-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Paid Year-to-Date</p>
			<p class="text-2xl font-bold text-sky-400">{fmt(totals.paidYtd)}</p>
			<p class="text-[11px] text-slate-600 mt-1">{totals.paidCount} paid</p>
		</div>
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Accrued Year-to-Date</p>
			<p class="text-2xl font-bold text-emerald-400">{fmt(totals.accruedYtd)}</p>
			<p class="text-[11px] text-slate-600 mt-1">Paid + pending pipeline</p>
		</div>
		<div class="bg-slate-900 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl px-5 py-4">
			<p class="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Unpaid Balance</p>
			<p class="text-2xl font-bold text-amber-400">{fmt(totals.unpaidBalance)}</p>
			<p class="text-[11px] text-slate-600 mt-1">{totals.unpaidCount} remaining</p>
		</div>
	</div>

	{#if debug}
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-4">
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Debug</p>
			<pre class="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
		</div>
	{/if}

	<!-- Breakdown by tournament -->
	{#if clientFilteredEarnings.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<DollarSign class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No earnings yet.</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each tournamentGroups as [tournament, items]}
				<div>
					<h2 class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
						<Calendar class="size-3.5" /> {tournament}
					</h2>
					<div class="space-y-2">
						{#each items as e}
							{@const s = STATUS[normalizeStatus(e.status)] ?? STATUS.pending}
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
