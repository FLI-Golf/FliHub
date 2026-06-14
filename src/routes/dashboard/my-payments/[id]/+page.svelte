<script lang="ts">
	import type { PageData } from './$types';
	import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

	const statusColor = (s: string) =>
		s === 'paid'    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700' :
		s === 'processing' ? 'text-blue-400 bg-blue-950/40 border-blue-700' :
		s === 'pending' ? 'text-amber-400 bg-amber-950/40 border-amber-700' :
		s === 'overdue' ? 'text-red-400 bg-red-950/40 border-red-700' :
		                  'text-slate-400 bg-slate-800 border-slate-600';

	const grouped = $derived(() => {
		const map: Record<string, { proName: string; payments: any[] }> = {};
		for (const p of data.payments) {
			const proName = p.expand?.pro?.name ?? p.recipient ?? 'Unknown Pro';
			if (!map[proName]) map[proName] = { proName, payments: [] };
			map[proName].payments.push(p);
		}
		return Object.values(map);
	});
</script>

<svelte:head><title>My Payments - FliHub</title></svelte:head>

<div class="flex flex-col gap-6 max-w-4xl mx-auto">
	<div>
		<h1 class="text-3xl font-bold">My Payments</h1>
		<p class="text-muted-foreground mt-1">
			{#if data.ownerName}
				{data.ownerName} ·
			{/if}
			{data.pageSubheading}
		</p>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		{#each [
			{ label: 'Total Earned',   value: fmt(data.summary.totalEarned),  icon: TrendingUp,    color: 'border-slate-600',   iconColor: 'text-slate-400' },
			{ label: 'Paid Out',       value: fmt(data.summary.totalPaid),    icon: CheckCircle,   color: 'border-emerald-700', iconColor: 'text-emerald-400' },
			{ label: 'Pending',        value: fmt(data.summary.totalPending), icon: Clock,         color: 'border-amber-700',   iconColor: 'text-amber-400' },
			{ label: 'Payments',       value: data.summary.paymentCount,      icon: DollarSign,    color: 'border-slate-600',   iconColor: 'text-slate-400' },
		] as s}
			<div class="rounded-xl border {s.color} bg-slate-800/40 px-4 py-3">
				<svelte:component this={s.icon} class="size-4 {s.iconColor} mb-1" />
				<p class="text-xl font-black text-white">{s.value}</p>
				<p class="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
			</div>
		{/each}
	</div>

	<div class="flex flex-wrap gap-3 items-end">
		<div>
			<p class="text-xs text-slate-400 mb-1">Status</p>
			<select
				class="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
				onchange={(e) => {
					const u = new URL(window.location.href);
					if (e.currentTarget.value) u.searchParams.set('status', e.currentTarget.value);
					else u.searchParams.delete('status');
					window.location.href = u.toString();
				}}
			>
				{#each [['', 'All'], ['pending', 'Pending'], ['processing', 'Processing'], ['paid', 'Paid'], ['overdue', 'Overdue']] as [val, label]}
					<option value={val} selected={data.filterStatus === val}>{label}</option>
				{/each}
			</select>
		</div>
		<div>
			<p class="text-xs text-slate-400 mb-1">Season</p>
			<select
				class="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
				onchange={(e) => {
					const u = new URL(window.location.href);
					if (e.currentTarget.value) u.searchParams.set('season', e.currentTarget.value);
					else u.searchParams.delete('season');
					window.location.href = u.toString();
				}}
			>
				<option value="">All Seasons</option>
				{#each data.seasons as s}
					<option value={s.id} selected={data.filterSeason === s.id}>{s.name}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if data.payments.length === 0}
		<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-12 text-center">
			<DollarSign class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400">No payment records found.</p>
			<p class="text-sm text-slate-500 mt-1">Payments are created automatically when tournament results are entered.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each grouped() as group}
				<div class="rounded-xl border border-slate-700 overflow-hidden">
					<div class="px-5 py-3 bg-slate-800/60 border-b border-slate-700">
						<p class="text-sm font-semibold text-slate-200">{group.proName}</p>
					</div>

					<div class="divide-y divide-slate-800">
						{#each group.payments as p}
							<div class="flex items-center justify-between gap-3 px-5 py-3 bg-slate-900/30 flex-wrap">
								<div class="flex-1 min-w-0">
									<p class="text-sm text-slate-200 font-medium truncate">
										{p.description || p.expand?.tournament?.name || 'Tournament payment'}
									</p>
									<p class="text-xs text-slate-500 mt-0.5">
										{p.managerCutPercentage}% of {fmt(p.grossAmount ?? 0)}
										· Due: {p.dueDate || '—'}
										{#if p.paidAt} · Paid: {p.paidAt}{/if}
										{#if p.paymentMethod} · {p.paymentMethod}{/if}
										{#if p.transactionId} · Ref: {p.transactionId}{/if}
									</p>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									<p class="text-base font-bold text-amber-300">{fmt(p.amount)}</p>
									<span class="text-[10px] font-semibold px-2 py-0.5 rounded border {statusColor(p.status)}">{p.status}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<p class="text-xs text-slate-600 text-center pb-4">
		Read-only view · Contact FLI Golf admin for payment questions
	</p>
</div>