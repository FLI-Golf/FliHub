<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);

	const b = $derived(data.bridge);
	const sponsor   = $derived(b.expand?.sponsorId);
	const franchise = $derived(b.expand?.franchiseId);

	const formatCurrency = (n: number | null | undefined) =>
		n != null
			? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
			: '—';

	const formatDate = (d: string | null | undefined) =>
		d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

	const levelColor = (level: string) => {
		switch (level) {
			case 'Title':     return 'bg-yellow-100 text-yellow-800';
			case 'Primary':   return 'bg-slate-100 text-slate-800';
			case 'Secondary': return 'bg-blue-100 text-blue-800';
			case 'Supporting':return 'bg-gray-100 text-gray-600';
			default:          return 'bg-gray-100 text-gray-600';
		}
	};

	const statusColor = (s: string) =>
		s === 'active'  ? 'bg-green-100 text-green-800' :
		s === 'pending' ? 'bg-yellow-100 text-yellow-800' :
		s === 'expired' ? 'bg-gray-100 text-gray-600' :
		'bg-red-100 text-red-800';

	const INPUT = 'w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

<div class="container mx-auto p-6 max-w-3xl space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-4">
			<Button
				href={sponsor ? `/dashboard/sponsors/${b.sponsorId}` : '/dashboard/sponsors'}
				variant="outline" size="sm"
				class="border-slate-600 text-slate-300 hover:bg-slate-700">
				← Back
			</Button>
			<div>
				<h1 class="text-2xl font-bold text-white">Sponsor ↔ Franchise Bridge</h1>
				<p class="text-slate-400 text-sm mt-0.5">
					{sponsor?.companyName ?? 'Unknown Sponsor'} &nbsp;×&nbsp; {franchise?.name ?? 'Unknown Franchise'}
				</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => (editing = !editing)} variant="outline"
				class="border-slate-600 text-slate-300 hover:bg-slate-700">
				{editing ? 'Cancel' : 'Edit'}
			</Button>
			<form method="POST" action="?/delete" use:enhance>
				<Button type="submit" variant="outline"
					class="border-red-700 text-red-400 hover:bg-red-900/30"
					onclick={(e) => { if (!confirm('Delete this bridge record?')) e.preventDefault(); }}>
					Delete
				</Button>
			</form>
		</div>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
			{form.error}
		</div>
	{/if}

	{#if editing}
		<form method="POST" action="?/update" use:enhance>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-semibold text-slate-100">Edit Bridge</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class={LABEL}>Sponsorship Level</label>
						<select name="sponsorshipLevel" class={INPUT}>
							{#each ['Title', 'Primary', 'Secondary', 'Supporting'] as lvl}
								<option value={lvl} selected={b.sponsorshipLevel === lvl}>{lvl}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Status</label>
						<select name="status" class={INPUT}>
							{#each ['active', 'pending', 'expired', 'cancelled'] as s}
								<option value={s} selected={b.status === s}>{s}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Annual Amount ($)</label>
						<input type="number" name="annualAmount" value={b.annualAmount || ''} min="0" class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Total Deal Value ($)</label>
						<input type="number" name="dealValue" value={b.dealValue || ''} min="0" class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Start Date</label>
						<input type="date" name="startDate" value={b.startDate?.slice(0, 10) || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>End Date</label>
						<input type="date" name="endDate" value={b.endDate?.slice(0, 10) || ''} class={INPUT} />
					</div>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<Button type="button" variant="outline" class="border-slate-600 text-slate-300"
						onclick={() => (editing = false)}>Cancel</Button>
					<Button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white">Save</Button>
				</div>
			</div>
		</form>
	{:else}
		<!-- Summary cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Level</div>
				<Badge class={levelColor(b.sponsorshipLevel)}>{b.sponsorshipLevel || '—'}</Badge>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Status</div>
				<Badge class={statusColor(b.status)}>{b.status || '—'}</Badge>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Annual Amount</div>
				<div class="text-xl font-bold text-yellow-300">{formatCurrency(b.annualAmount)}</div>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Deal Value</div>
				<div class="text-xl font-bold text-emerald-300">{formatCurrency(b.dealValue)}</div>
			</div>
		</div>

		<!-- Details -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Sponsor -->
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Sponsor</h2>
				{#if sponsor}
					<div class="font-bold text-slate-100 text-lg">{sponsor.companyName}</div>
					{#if sponsor.tier}
						<Badge class="mt-1">{sponsor.tier}</Badge>
					{/if}
					<div class="mt-3">
						<Button href="/dashboard/sponsors/{b.sponsorId}" variant="outline" size="sm"
							class="border-slate-600 text-slate-300 hover:bg-slate-700">
							View Sponsor →
						</Button>
					</div>
				{:else}
					<div class="text-slate-400">—</div>
				{/if}
			</div>

			<!-- Franchise -->
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Franchise</h2>
				{#if franchise}
					<div class="font-bold text-slate-100 text-lg">{franchise.name}</div>
					{#if franchise.territory}
						<div class="text-sm text-slate-400 mt-1">📍 {franchise.territory}</div>
					{/if}
					<div class="mt-3">
						<Button href="/dashboard/franchises/{franchise.slug || b.franchiseId}" variant="outline" size="sm"
							class="border-slate-600 text-slate-300 hover:bg-slate-700">
							View Franchise →
						</Button>
					</div>
				{:else}
					<div class="text-slate-400">—</div>
				{/if}
			</div>
		</div>

		<!-- Contract dates -->
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
			<h2 class="text-lg font-semibold text-slate-100 mb-4">Contract Period</h2>
			<div class="grid grid-cols-2 gap-6 text-sm">
				<div>
					<div class="text-slate-400 mb-1">Start Date</div>
					<div class="text-slate-100 font-medium">{formatDate(b.startDate)}</div>
				</div>
				<div>
					<div class="text-slate-400 mb-1">End Date</div>
					<div class="text-slate-100 font-medium">{formatDate(b.endDate)}</div>
				</div>
			</div>
		</div>
	{/if}

</div>
