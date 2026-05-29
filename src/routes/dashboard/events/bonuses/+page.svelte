<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Star, Check } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	// Map bonus payments by talent id
	const bonusPaymentByTalent = $derived(
		(data.bonusPayments ?? []).reduce((acc: Record<string, any[]>, p: any) => {
			const tid = p.talent;
			if (!acc[tid]) acc[tid] = [];
			acc[tid].push(p);
			return acc;
		}, {})
	);

	let markingPaid = $state<string | null>(null);

	async function markPaid(paymentId: string, eventId: string) {
		markingPaid = paymentId;
		try {
			const res = await fetch(`/api/events/${eventId}/payments/${paymentId}/mark-paid`, { method: 'POST' });
			if (res.ok) await invalidateAll();
		} finally {
			markingPaid = null;
		}
	}

	const eligible = $derived((data.byTalent ?? []).filter((t: any) => !t.bonusEarned));
	const earned = $derived((data.byTalent ?? []).filter((t: any) => t.bonusEarned));
</script>

<svelte:head><title>Attendance Bonuses — FliHub</title></svelte:head>

<div class="space-y-6 max-w-4xl mx-auto">
	<div class="flex items-center gap-4">
		<Button href="/dashboard/events" variant="outline">← Events</Button>
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-2">
				<Star class="w-6 h-6 text-yellow-400" />
				Attendance Bonuses
			</h1>
			<p class="text-sm text-gray-400 mt-0.5">Talent who have qualified for season attendance bonuses</p>
		</div>
	</div>

	<!-- Summary -->
	<div class="grid grid-cols-3 gap-3">
		<div class="p-4 bg-yellow-900/40 rounded-lg border border-yellow-800 text-center">
			<div class="text-2xl font-bold text-yellow-400">{eligible.length}</div>
			<div class="text-xs text-gray-400 mt-1">Eligible — Not Yet Paid</div>
		</div>
		<div class="p-4 bg-green-900/40 rounded-lg border border-green-800 text-center">
			<div class="text-2xl font-bold text-green-400">{earned.length}</div>
			<div class="text-xs text-gray-400 mt-1">Bonus Earned & Paid</div>
		</div>
		<div class="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
			<div class="text-2xl font-bold text-white">{data.bonusPayments?.length ?? 0}</div>
			<div class="text-xs text-gray-400 mt-1">Bonus Payments</div>
		</div>
	</div>

	<!-- Eligible — not yet paid -->
	{#if eligible.length > 0}
	<div class="space-y-2">
		<h2 class="text-base font-semibold text-yellow-400 flex items-center gap-2">
			<Star class="w-4 h-4" />Eligible for Bonus
		</h2>
		{#each eligible as entry (entry.talent?.id)}
		{@const payments = bonusPaymentByTalent[entry.talent?.id] ?? []}
		<div class="bg-gray-800 rounded-lg border border-yellow-800/50 p-4">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-yellow-900/60 flex items-center justify-center text-yellow-400 font-bold text-lg border border-yellow-700">
						{entry.talent?.name?.charAt(0) ?? '?'}
					</div>
					<div>
						<div class="font-semibold text-white">{entry.talent?.name ?? '—'}</div>
						<div class="text-xs text-gray-400 capitalize">{Array.isArray(entry.talent?.talentType) ? entry.talent.talentType.join(', ') : entry.talent?.talentType}</div>
					</div>
				</div>
				<Badge class="bg-yellow-900 text-yellow-300">Bonus Eligible</Badge>
			</div>

			<!-- Events attended -->
			<div class="mt-3 space-y-1">
				{#each entry.events as et}
				<div class="flex items-center gap-2 text-xs text-gray-400">
					<Check class="w-3 h-3 text-green-400 shrink-0" />
					<span>{et.expand?.event?.name ?? et.event}</span>
					<Badge class={{ confirmed: 'bg-blue-900 text-blue-300', completed: 'bg-green-900 text-green-300' }[et.status] ?? 'bg-gray-700 text-gray-300'}>{et.status}</Badge>
				</div>
				{/each}
			</div>

			<!-- Bonus payments -->
			{#if payments.length > 0}
			<div class="mt-3 pt-3 border-t border-gray-700 space-y-2">
				{#each payments as p}
				<div class="flex items-center justify-between">
					<div class="text-sm">
						<span class="font-semibold text-white">{fmt$(p.amount)}</span>
						<span class="text-gray-400 ml-2">bonus payment</span>
						<Badge class="ml-2 {({ approval_required: 'bg-orange-900 text-orange-300', approved: 'bg-blue-900 text-blue-300', paid: 'bg-green-900 text-green-300' }[p.status] ?? 'bg-gray-700 text-gray-300')}">{p.status}</Badge>
					</div>
					{#if p.status === 'approved'}
					<button
						onclick={() => markPaid(p.id, p.event)}
						disabled={markingPaid === p.id}
						class="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50">
						{markingPaid === p.id ? 'Saving...' : 'Mark Paid'}
					</button>
					{/if}
				</div>
				{/each}
			</div>
			{:else}
			<div class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
				No bonus payment generated yet — run "Generate Payments" on the event to create it.
			</div>
			{/if}
		</div>
		{/each}
	</div>
	{/if}

	<!-- Already earned -->
	{#if earned.length > 0}
	<div class="space-y-2">
		<h2 class="text-base font-semibold text-green-400 flex items-center gap-2">
			<Check class="w-4 h-4" />Bonus Earned & Paid
		</h2>
		{#each earned as entry (entry.talent?.id)}
		<div class="bg-gray-800 rounded-lg border border-green-800/40 p-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-lg border border-green-700">
					{entry.talent?.name?.charAt(0) ?? '?'}
				</div>
				<div>
					<div class="font-semibold text-white">{entry.talent?.name ?? '—'}</div>
					<div class="text-xs text-gray-400">{entry.events.length} events attended</div>
				</div>
			</div>
			<Badge class="bg-green-900 text-green-300">✓ Paid</Badge>
		</div>
		{/each}
	</div>
	{/if}

	{#if eligible.length === 0 && earned.length === 0}
	<div class="text-center py-16 text-gray-500">
		<Star class="w-12 h-12 mx-auto mb-3 opacity-30" />
		<p>No talent has qualified for attendance bonuses yet.</p>
		<p class="text-sm mt-1">Bonuses are triggered when a talent member attends all events in a broadcast series.</p>
	</div>
	{/if}
</div>
