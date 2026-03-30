<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);

	const formatCurrency = (n: number | null | undefined) =>
		n != null
			? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
			: '—';

	const formatDate = (d: string | null | undefined) =>
		d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

	const tierColor = (tier: string) => {
		switch (tier) {
			case 'title':    return 'bg-yellow-100 text-yellow-800';
			case 'platinum': return 'bg-slate-100 text-slate-800';
			case 'gold':     return 'bg-amber-100 text-amber-800';
			case 'silver':   return 'bg-gray-100 text-gray-700';
			case 'bronze':   return 'bg-orange-100 text-orange-800';
			default:         return 'bg-gray-100 text-gray-600';
		}
	};

	const statusColor = (status: string) => {
		switch (status) {
			case 'active':    return 'bg-green-100 text-green-800';
			case 'prospect':  return 'bg-blue-100 text-blue-800';
			case 'inactive':  return 'bg-gray-100 text-gray-600';
			case 'cancelled': return 'bg-red-100 text-red-800';
			default:          return 'bg-gray-100 text-gray-600';
		}
	};

	const s = $derived(data.sponsor);
	const totalPayments = $derived(
		data.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
	);
	const balance = $derived((s.annualCommitment || 0) - totalPayments);

	const INPUT = 'w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

<div class="container mx-auto p-6 max-w-5xl space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-4">
			<Button href="/dashboard/sponsors" variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700">
				← Back
			</Button>
			<div>
				<h1 class="text-3xl font-bold text-white">{s.companyName}</h1>
				<div class="flex items-center gap-2 mt-1">
					{#if s.tier}
						<Badge class={tierColor(s.tier)}>{s.tier}</Badge>
					{/if}
					{#if s.status}
						<Badge class={statusColor(s.status)}>{s.status}</Badge>
					{/if}
					{#if s.type}
						<span class="text-sm text-slate-400">{s.type}</span>
					{/if}
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => (editing = !editing)} variant="outline" class="border-slate-600 text-slate-300 hover:bg-slate-700">
				{editing ? 'Cancel' : 'Edit'}
			</Button>
			<form method="POST" action="?/delete" use:enhance>
				<Button type="submit" variant="outline" class="border-red-700 text-red-400 hover:bg-red-900/30"
					onclick={(e) => { if (!confirm('Delete this sponsor?')) e.preventDefault(); }}>
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
		<!-- Edit Form -->
		<form method="POST" action="?/update" use:enhance class="space-y-6">
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-lg font-semibold text-slate-100 mb-4">Edit Sponsor</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class={LABEL}>Company Name *</label>
						<input name="companyName" required value={s.companyName} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Type</label>
						<select name="type" class={INPUT}>
							{#each ['corporate', 'local', 'media', 'equipment', 'apparel', 'technology', 'food_beverage', 'financial', 'healthcare', 'other'] as t}
								<option value={t} selected={s.type === t}>{t.replace('_', ' ')}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Tier</label>
						<select name="tier" class={INPUT}>
							{#each ['title', 'platinum', 'gold', 'silver', 'bronze', 'community'] as t}
								<option value={t} selected={s.tier === t}>{t}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Status</label>
						<select name="status" class={INPUT}>
							{#each ['prospect', 'active', 'inactive', 'cancelled'] as t}
								<option value={t} selected={s.status === t}>{t}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Primary Contact Name</label>
						<input name="primaryContactName" value={s.primaryContactName || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Primary Contact Email</label>
						<input type="email" name="primaryContactEmail" value={s.primaryContactEmail || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Location</label>
						<input name="location" value={s.location || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Territory</label>
						<input name="territory" value={s.territory || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Contract Start</label>
						<input type="date" name="contractStartDate" value={s.contractStartDate?.slice(0, 10) || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Contract End</label>
						<input type="date" name="contractEndDate" value={s.contractEndDate?.slice(0, 10) || ''} class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Annual Commitment ($)</label>
						<input type="number" name="annualCommitment" value={s.annualCommitment || ''} min="0" class={INPUT} />
					</div>
					<div>
						<label class={LABEL}>Total Paid ($)</label>
						<input type="number" name="totalPaid" value={s.totalPaid || ''} min="0" class={INPUT} />
					</div>
					<div class="md:col-span-2 flex items-center gap-3">
						<input type="hidden" name="franchiseInterest" value="false" />
						<input type="checkbox" id="franchiseInterest" name="franchiseInterest" value="true"
							checked={s.franchiseInterest}
							class="rounded border-slate-600 bg-slate-700 text-emerald-500" />
						<label for="franchiseInterest" class="text-sm text-slate-300">Franchise Interest</label>
					</div>
					<div class="md:col-span-2">
						<label class={LABEL}>Notes</label>
						<textarea name="notes" rows="4" class={INPUT}>{s.notes || ''}</textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-4">
					<Button type="button" variant="outline" class="border-slate-600 text-slate-300" onclick={() => (editing = false)}>Cancel</Button>
					<Button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
				</div>
			</div>
		</form>
	{:else}
		<!-- View Mode -->

		<!-- Financial Summary -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Annual Commitment</div>
				<div class="text-2xl font-bold text-yellow-300">{formatCurrency(s.annualCommitment)}</div>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Paid</div>
				<div class="text-2xl font-bold text-emerald-300">{formatCurrency(totalPayments || s.totalPaid)}</div>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Balance Due</div>
				<div class="text-2xl font-bold {balance > 0 ? 'text-red-300' : 'text-slate-300'}">{formatCurrency(balance)}</div>
			</div>
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Franchise Interest</div>
				<div class="text-2xl font-bold {s.franchiseInterest ? 'text-emerald-300' : 'text-slate-500'}">
					{s.franchiseInterest ? 'Yes' : 'No'}
				</div>
			</div>
		</div>

		<!-- Details -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-semibold text-slate-100">Contact & Location</h2>
				<dl class="space-y-3 text-sm">
					<div class="flex justify-between">
						<dt class="text-slate-400">Primary Contact</dt>
						<dd class="text-slate-100 font-medium">{s.primaryContactName || '—'}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Email</dt>
						<dd class="text-slate-100">
							{#if s.primaryContactEmail}
								<a href="mailto:{s.primaryContactEmail}" class="text-emerald-400 hover:underline">{s.primaryContactEmail}</a>
							{:else}—{/if}
						</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Location</dt>
						<dd class="text-slate-100">{s.location || '—'}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Territory</dt>
						<dd class="text-slate-100">{s.territory || '—'}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Assigned To</dt>
						<dd class="text-slate-100">{s.expand?.assignedTo?.name || s.expand?.assignedTo?.email || '—'}</dd>
					</div>
				</dl>
			</div>

			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-semibold text-slate-100">Contract</h2>
				<dl class="space-y-3 text-sm">
					<div class="flex justify-between">
						<dt class="text-slate-400">Start Date</dt>
						<dd class="text-slate-100">{formatDate(s.contractStartDate)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">End Date</dt>
						<dd class="text-slate-100">{formatDate(s.contractEndDate)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Type</dt>
						<dd class="text-slate-100 capitalize">{s.type?.replace('_', ' ') || '—'}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Industry</dt>
						<dd class="text-slate-100">{s.industry || '—'}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-slate-400">Created</dt>
						<dd class="text-slate-100">{formatDate(s.created)}</dd>
					</div>
				</dl>
			</div>
		</div>

		<!-- Notes -->
		{#if s.notes}
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-lg font-semibold text-slate-100 mb-3">Notes</h2>
				<p class="text-slate-300 text-sm whitespace-pre-wrap">{s.notes}</p>
			</div>
		{/if}

		<!-- Franchise Connections -->
		{#if data.bridgeRecords.length > 0}
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-lg font-semibold text-slate-100 mb-4">Franchise Connections</h2>
				<div class="space-y-2">
					{#each data.bridgeRecords as bridge}
						<div class="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
							<div>
								<div class="font-medium text-slate-100">{bridge.expand?.franchiseId?.name || 'Unknown Franchise'}</div>
								{#if bridge.dealValue}
									<div class="text-sm text-slate-400">Deal value: {formatCurrency(bridge.dealValue)}</div>
								{/if}
							</div>
							<div class="flex items-center gap-3">
								{#if bridge.status}
									<Badge class={bridge.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
										{bridge.status}
									</Badge>
								{/if}
								<Button href="/dashboard/sponsors/bridge/{bridge.id}" variant="outline" size="sm"
									class="border-slate-600 text-slate-300 hover:bg-slate-700">View</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Payment History -->
		{#if data.payments.length > 0}
			<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
				<h2 class="text-lg font-semibold text-slate-100 mb-4">Payment History</h2>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700">
								<th class="pb-2 pr-4">Date</th>
								<th class="pb-2 pr-4">Amount</th>
								<th class="pb-2 pr-4">Type</th>
								<th class="pb-2">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-700/50">
							{#each data.payments as payment}
								<tr class="hover:bg-slate-700/30">
									<td class="py-2 pr-4 text-slate-300">{formatDate(payment.paymentDate)}</td>
									<td class="py-2 pr-4 font-bold text-emerald-300">{formatCurrency(payment.amount)}</td>
									<td class="py-2 pr-4 text-slate-300 capitalize">{payment.paymentType || '—'}</td>
									<td class="py-2">
										<Badge class={payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
											{payment.status || 'pending'}
										</Badge>
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot class="border-t border-slate-600">
							<tr>
								<td class="pt-3 text-slate-400 font-medium">Total</td>
								<td class="pt-3 font-bold text-emerald-300">{formatCurrency(totalPayments)}</td>
								<td colspan="2"></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		{/if}
	{/if}

</div>
