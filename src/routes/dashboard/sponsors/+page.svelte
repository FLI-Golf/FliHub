<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, MapPin, Clock, ChevronRight } from 'lucide-svelte';
	import {
		PIPELINE_STAGES, CLOSED_STAGES,
		SPONSOR_STATUS_LABELS, SPONSOR_STATUS_COLORS,
		SPONSOR_TIER_LABELS, SPONSOR_TIER_COLORS,
		SPONSOR_TIER_PRICING
	} from '$lib/domain/schemas/sponsor.schema';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

	const m = $derived(data.metrics);
	const byStatus = $derived(data.byStatus ?? {});

	let showAdd = $state(false);
	let saving  = $state(false);
	let addErr  = $state('');
	let form = $state({
		companyName: '', type: 'corporate', tier: 'tier_3', status: 'prospect',
		primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '',
		location: '', annualCommitment: '', dealProbability: '50',
		nextFollowUpDate: '', franchiseInterest: false, notes: '', assignedTo: ''
	});

	async function submitAdd(e: SubmitEvent) {
		e.preventDefault();
		saving = true; addErr = '';
		try {
			const res = await fetch('/api/sponsors', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					annualCommitment: form.annualCommitment ? Number(form.annualCommitment) : 0,
					dealProbability: form.dealProbability ? Number(form.dealProbability) : null
				})
			});
			if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
			showAdd = false;
			window.location.reload();
		} catch (err: any) { addErr = err.message ?? 'Failed'; }
		finally { saving = false; }
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';

	const pipelineCols = $derived(PIPELINE_STAGES.map(s => ({
		status: s,
		label: SPONSOR_STATUS_LABELS[s],
		color: SPONSOR_STATUS_COLORS[s],
		sponsors: byStatus[s] ?? []
	})));
</script>

<svelte:head><title>Sponsors — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Sponsor Pipeline</h1>
			<p class="text-muted-foreground mt-1">Track every sponsor from first contact to signed contract</p>
		</div>
		<Button onclick={() => showAdd = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
			<Plus class="size-4" /> Add Sponsor
		</Button>
	</div>

	<!-- Revenue KPIs -->
	{#if m}
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5 bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Contracted Revenue</p>
			<p class="text-2xl font-bold text-emerald-300">{fmt(m.totalContractedValue)}</p>
			<p class="text-xs text-slate-400 mt-1">{m.activePayers} active payers</p>
		</Card>
		<Card class="p-5 bg-blue-950/40 border-blue-800/50">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Cash Received</p>
			<p class="text-2xl font-bold text-blue-300">{fmt(m.totalReceived)}</p>
			<p class="text-xs text-slate-400 mt-1">{fmt(m.totalScheduled)} scheduled</p>
		</Card>
		<Card class="p-5 bg-yellow-950/40 border-yellow-800/50">
			<p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">Pipeline Value</p>
			<p class="text-2xl font-bold text-yellow-300">{fmt(m.pipelineValue)}</p>
			<p class="text-xs text-slate-400 mt-1">{m.pipelineOpen} open deals</p>
		</Card>
		<Card class="p-5 {m.totalOverdue > 0 ? 'bg-red-950/40 border-red-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {m.totalOverdue > 0 ? 'text-red-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Overdue</p>
			<p class="text-2xl font-bold {m.totalOverdue > 0 ? 'text-red-300' : 'text-slate-400'}">{fmt(m.totalOverdue)}</p>
			<p class="text-xs text-slate-400 mt-1">{m.franchiseInterested} franchise interest</p>
		</Card>
	</div>
	{/if}

	<!-- Pipeline board -->
	<div>
		<h2 class="text-lg font-semibold mb-3 text-slate-200">Sales Pipeline</h2>
		<div class="flex gap-3 overflow-x-auto pb-3">
			{#each pipelineCols as col}
				<div class="flex-shrink-0 w-60">
					<div class="flex items-center justify-between mb-2 px-1">
						<span class="text-xs font-semibold uppercase tracking-wide text-slate-400">{col.label}</span>
						<span class="text-xs font-bold text-slate-300 bg-slate-700 rounded-full px-2 py-0.5">{col.sponsors.length}</span>
					</div>
					<div class="space-y-2 min-h-20">
						{#each col.sponsors as sponsor}
							<a href="/dashboard/sponsors/{sponsor.id}"
								class="block p-3 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700/80 hover:border-slate-600 transition-all group">
								<div class="flex items-start justify-between gap-2 mb-2">
									<p class="text-sm font-semibold text-slate-100 leading-tight line-clamp-2">{sponsor.companyName}</p>
									<ChevronRight class="size-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5 transition-colors" />
								</div>
								<div class="flex flex-wrap gap-1 mb-2">
									<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {SPONSOR_TIER_COLORS[sponsor.tier] ?? 'bg-slate-700 text-slate-300 border-slate-600'}">
										{SPONSOR_TIER_LABELS[sponsor.tier] ?? sponsor.tier}
									</span>
									{#if sponsor.franchiseInterest}
										<span class="text-[10px] px-1.5 py-0.5 rounded border bg-violet-900/50 text-violet-300 border-violet-700 font-medium">Franchise</span>
									{/if}
								</div>
								{#if sponsor.annualCommitment}
									<p class="text-xs font-bold text-emerald-400">{fmt(sponsor.annualCommitment)}/yr</p>
								{/if}
								{#if sponsor.location}
									<p class="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
										<MapPin class="size-2.5" />{sponsor.location}
									</p>
								{/if}
								{#if sponsor.nextFollowUpDate}
									<p class="text-[10px] text-cyan-400 flex items-center gap-1 mt-1">
										<Clock class="size-2.5" />Follow up {fmtDate(sponsor.nextFollowUpDate)}
									</p>
								{/if}
							</a>
						{:else}
							<div class="rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-600">No sponsors</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Closed -->
	{#if Object.values(CLOSED_STAGES).some(s => (byStatus[s] ?? []).length > 0)}
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Closed</h2>
		<div class="flex flex-wrap gap-2">
			{#each CLOSED_STAGES as stage}
				{#each (byStatus[stage] ?? []) as sponsor}
					<a href="/dashboard/sponsors/{sponsor.id}"
						class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors">
						<span class="text-xs font-medium text-slate-200">{sponsor.companyName}</span>
						<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {SPONSOR_STATUS_COLORS[stage]}">{SPONSOR_STATUS_LABELS[stage]}</span>
					</a>
				{/each}
			{/each}
		</div>
	</Card>
	{/if}

	<!-- Tier pricing reference -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Tier Pricing Reference</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700">
						<th class="pb-2 pr-4">Tier</th>
						<th class="pb-2 pr-4 text-right">2026</th>
						<th class="pb-2 pr-4 text-right">2027</th>
						<th class="pb-2 pr-4 text-right">2028</th>
						<th class="pb-2 pr-4 text-right">3-Year Total</th>
						<th class="pb-2 text-center">Count</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/50">
					{#each Object.entries(SPONSOR_TIER_PRICING) as [tier, pricing]}
						{@const total = pricing[2026] + pricing[2027] + pricing[2028]}
						<tr class="hover:bg-slate-700/30 transition-colors">
							<td class="py-2 pr-4">
								<span class="text-xs px-2 py-0.5 rounded border font-medium {SPONSOR_TIER_COLORS[tier]}">{SPONSOR_TIER_LABELS[tier]}</span>
							</td>
							<td class="py-2 pr-4 text-right text-slate-300">{fmt(pricing[2026])}</td>
							<td class="py-2 pr-4 text-right text-slate-300">{fmt(pricing[2027])}</td>
							<td class="py-2 pr-4 text-right text-slate-300">{fmt(pricing[2028])}</td>
							<td class="py-2 pr-4 text-right font-bold text-emerald-400">{fmt(total)}</td>
							<td class="py-2 text-center">
								<span class="text-xs font-bold text-slate-200 bg-slate-700 rounded-full px-2 py-0.5">{m?.byTier?.[tier as keyof typeof m.byTier] ?? 0}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

</div>

<!-- Add Sponsor Modal -->
{#if showAdd}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		<div class="flex items-center justify-between p-6 border-b border-slate-700">
			<h2 class="text-lg font-semibold text-slate-100">Add Sponsor</h2>
			<button onclick={() => showAdd = false} class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>
		<form onsubmit={submitAdd} class="p-6 space-y-4">
			{#if addErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{addErr}</p>{/if}
			<div>
				<label class={LABEL}>Company Name *</label>
				<input bind:value={form.companyName} required class={INPUT} placeholder="Acme Corp" />
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class={LABEL}>Type</label>
					<select bind:value={form.type} class={INPUT}>
						{#each ['corporate','casino','resort','hospitality','entertainment','media','technology','financial','other'] as t}
							<option value={t}>{t.replace('_',' ')}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class={LABEL}>Tier</label>
					<select bind:value={form.tier} class={INPUT}>
						<option value="tier_1">Tier 1 — Premium ($7M)</option>
						<option value="tier_2">Tier 2 — Elite ($5M)</option>
						<option value="tier_3">Tier 3 — Standard ($1M)</option>
						<option value="tier_4">Tier 4 — Growth ($1M)</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class={LABEL}>Pipeline Stage</label>
					<select bind:value={form.status} class={INPUT}>
						{#each PIPELINE_STAGES as s}
							<option value={s}>{SPONSOR_STATUS_LABELS[s]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class={LABEL}>Annual Commitment ($)</label>
					<input bind:value={form.annualCommitment} type="number" min="0" class={INPUT} placeholder="0" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class={LABEL}>Contact Name</label>
					<input bind:value={form.primaryContactName} class={INPUT} placeholder="Jane Smith" />
				</div>
				<div>
					<label class={LABEL}>Contact Email</label>
					<input bind:value={form.primaryContactEmail} type="email" class={INPUT} placeholder="jane@acme.com" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class={LABEL}>Phone</label>
					<input bind:value={form.primaryContactPhone} class={INPUT} placeholder="+1 555 000 0000" />
				</div>
				<div>
					<label class={LABEL}>Location</label>
					<input bind:value={form.location} class={INPUT} placeholder="Las Vegas, NV" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class={LABEL}>Next Follow-Up</label>
					<input bind:value={form.nextFollowUpDate} type="date" class={INPUT} />
				</div>
				<div>
					<label class={LABEL}>Close Probability (%)</label>
					<input bind:value={form.dealProbability} type="number" min="0" max="100" class={INPUT} placeholder="50" />
				</div>
			</div>
			{#if data.userProfiles?.length}
			<div>
				<label class={LABEL}>Assigned Sales Rep</label>
				<select bind:value={form.assignedTo} class={INPUT}>
					<option value="">— Unassigned —</option>
					{#each data.userProfiles as p}
						<option value={p.id}>{p.firstName} {p.lastName}</option>
					{/each}
				</select>
			</div>
			{/if}
			<label class="flex items-center gap-3 cursor-pointer">
				<input type="checkbox" bind:checked={form.franchiseInterest} class="size-4 rounded border-slate-600 bg-slate-800 accent-emerald-500" />
				<span class="text-sm text-slate-300">Franchise interest</span>
			</label>
			<div>
				<label class={LABEL}>Notes</label>
				<textarea bind:value={form.notes} rows="3" class="{INPUT} resize-none" placeholder="Context, intro source, key decision makers…"></textarea>
			</div>
			<div class="flex justify-end gap-3 pt-2">
				<Button type="button" variant="outline" onclick={() => showAdd = false} class="border-slate-600 text-slate-300">Cancel</Button>
				<Button type="submit" disabled={saving} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
					<Plus class="size-4" />{saving ? 'Saving…' : 'Add Sponsor'}
				</Button>
			</div>
		</form>
	</div>
</div>
{/if}
