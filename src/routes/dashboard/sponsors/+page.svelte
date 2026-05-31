<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, MapPin, Clock, ChevronRight, FileText, CheckCircle2 } from 'lucide-svelte';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline/types';
	import { invalidateAll } from '$app/navigation';
	import {
		PIPELINE_STAGES, CLOSED_STAGES,
		SPONSOR_STATUS_LABELS, SPONSOR_STATUS_COLORS,
		SPONSOR_TIER_LABELS, SPONSOR_TIER_COLORS,
		SPONSOR_TIER_PRICING,
		FRANCHISE_TRACK_STAGES, FRANCHISE_TRACK_LABELS, FRANCHISE_TRACK_COLORS
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

	// ── PipelineBoard config ──────────────────────────────────────────────────

	const boardConfig = $derived<PipelineBoardConfig>({
		columnWidth: 'w-60',
		stages: PIPELINE_STAGES.map(s => ({
			key: s,
			label: SPONSOR_STATUS_LABELS[s] ?? s,
			colorClass: SPONSOR_STATUS_COLORS[s] ?? ''
		})),
		terminalStages: CLOSED_STAGES.map(s => ({
			key: s,
			label: SPONSOR_STATUS_LABELS[s as keyof typeof SPONSOR_STATUS_LABELS] ?? s,
			colorClass: SPONSOR_STATUS_COLORS[s as keyof typeof SPONSOR_STATUS_COLORS] ?? ''
		}))
	});

	const boardItems = $derived<PipelineCardItem[]>(
		(data.sponsors ?? []).map((s: any) => {
			const rep = s.expand?.assignedTo;
			const repLabel = rep ? ([rep.firstName, rep.lastName].filter(Boolean).join(' ') || rep.email) : null;
			return {
				id: s.id,
				title: s.companyName,
				subtitle: s.primaryContactName || s.location || undefined,
				status: s.status,
				href: `/dashboard/sponsors/${s.id}`,
				badge: {
					label: SPONSOR_TIER_LABELS[s.tier as keyof typeof SPONSOR_TIER_LABELS] ?? s.tier,
					colorClass: SPONSOR_TIER_COLORS[s.tier as keyof typeof SPONSOR_TIER_COLORS] ?? 'bg-slate-700 text-slate-300 border-slate-600'
				},
				tags: repLabel ? [{ label: `👤 ${repLabel}`, colorClass: 'bg-slate-700/60 text-slate-400 border-slate-600/50' }] : [],
				meta: s.annualCommitment ? `${fmt(s.annualCommitment)}/yr` : undefined
			};
		})
	);

	let moving = $state(false);

	// ── Contracted confirmation modal ─────────────────────────────────────────
	let pendingMove = $state<PipelineMoveEvent | null>(null);
	let contractConfirming = $state(false);
	let contractErr = $state('');
	let poAmount = $state('');
	let poYear = $state(String(new Date().getFullYear()));
	let poDescription = $state('');

	const pendingSponsor = $derived(
		pendingMove ? (data.sponsors ?? []).find((s: any) => s.id === pendingMove!.item.id) ?? null : null
	);

	function cancelContractMove() {
		pendingMove = null;
		contractErr = '';
		poAmount = '';
		poYear = String(new Date().getFullYear());
		poDescription = '';
	}

	async function confirmContractMove() {
		if (!pendingMove) return;
		contractConfirming = true;
		contractErr = '';
		try {
			// 1. Move sponsor to contracted
			const moveRes = await fetch(`/api/sponsors/${pendingMove.item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: pendingMove.to })
			});
			if (!moveRes.ok) throw new Error('Failed to update stage');

			// 2. Kick off collections — create a draft PO
			const amount = poAmount ? Number(poAmount) : (pendingSponsor?.annualCommitment ?? 0);
			if (amount > 0) {
				const poRes = await fetch(`/api/sponsors/${pendingMove.item.id}/purchase-order`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						amount,
						year: Number(poYear),
						description: poDescription || undefined
					})
				});
				if (!poRes.ok) {
					const body = await poRes.json().catch(() => ({}));
					throw new Error(body.message ?? 'Failed to create Purchase Order');
				}
			}

			cancelContractMove();
			await invalidateAll();
		} catch (err: any) {
			contractErr = err.message ?? 'Something went wrong';
		} finally {
			contractConfirming = false;
		}
	}

	async function handleMove(e: PipelineMoveEvent) {
		if (moving) return;

		// Intercept moves into "contracted" for confirmation + PO creation
		if (e.to === 'contracted') {
			const sponsor = (data.sponsors ?? []).find((s: any) => s.id === e.item.id) as any;
			poAmount = sponsor?.annualCommitment ? String(sponsor.annualCommitment) : '';
			poYear = String(new Date().getFullYear());
			poDescription = '';
			pendingMove = e;
			return;
		}

		moving = true;
		try {
			const res = await fetch(`/api/sponsors/${e.item.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: e.to })
			});
			if (!res.ok) throw new Error('Failed to update stage');
			await invalidateAll();
		} catch (err) {
			console.error('Stage move failed:', err);
		} finally {
			moving = false;
		}
	}

	// Franchise track — sponsors with franchiseInterest=true, grouped by franchiseTrackStatus
	const franchiseTrackSponsors = $derived(
		(data.sponsors ?? []).filter((s: any) => s.franchiseInterest)
	);
	const franchiseTrackCols = $derived(
		FRANCHISE_TRACK_STAGES.map(stage => ({
			stage,
			label: FRANCHISE_TRACK_LABELS[stage],
			color: FRANCHISE_TRACK_COLORS[stage],
			sponsors: franchiseTrackSponsors.filter(
				(s: any) => (s.franchiseTrackStatus ?? 'franchise_interest') === stage
			)
		}))
	);
</script>

<svelte:head><title>Sponsors — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Sponsor Pipeline</h1>
			<p class="text-muted-foreground mt-1">Manage every sponsor from first contact through to active partnership and renewal</p>
		</div>
		<Button onclick={() => showAdd = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
			<Plus class="size-4" /> Add Sponsor
		</Button>
	</div>

	<!-- Process guide -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<div class="space-y-4">
			<div class="flex items-start gap-3">
				<div class="p-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 shrink-0 mt-0.5">
					<svg class="size-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-slate-200 mb-1">Optimal Sponsor Process</h3>
					<p class="text-xs text-slate-400 leading-relaxed">
						Each sponsor moves through a 6-stage pipeline. Drag cards between columns or use the ⋮ menu to advance a stage.
						Sponsors pursuing franchise ownership run a parallel <span class="text-violet-300 font-medium">Franchise Acquisition Track</span> below — they stay in their sponsorship tier while the franchise deal progresses independently.
					</p>
				</div>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
				{#each [
					{ stage: 'Prospect', color: 'border-slate-600 text-slate-300', desc: 'Identified target. Research tier fit, decision-maker, and gaming/sports alignment. Add to pipeline with estimated annual commitment.' },
					{ stage: 'Outreach', color: 'border-blue-700/60 text-blue-300', desc: 'First contact made. Send sponsor deck, schedule intro call. Log follow-up date so nothing falls through.' },
					{ stage: 'Negotiating', color: 'border-yellow-700/60 text-yellow-300', desc: 'Deck delivered, interest confirmed. Negotiate tier, activation rights, and payment schedule. Loop in Legal for contract drafting.' },
					{ stage: 'Contracted', color: 'border-orange-700/60 text-orange-300', desc: 'Agreement signed. Create sponsor payment schedule in Payments & Income. Assign QuickBooks invoice numbers to each installment.' },
					{ stage: 'Active', color: 'border-emerald-700/60 text-emerald-300', desc: 'Payments flowing. Deliver activation commitments — signage, broadcast mentions, event presence. Track payments received in the Income pipeline.' },
					{ stage: 'Renewed', color: 'border-violet-700/60 text-violet-300', desc: 'Contract renewed for next season. Update annual commitment and reset payment schedule. Flag franchise interest if applicable.' },
				] as s}
					<div class="p-2.5 rounded-lg border {s.color} bg-slate-900/50">
						<p class="text-[11px] font-semibold {s.color.split(' ')[1]} mb-1">{s.stage}</p>
						<p class="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
					</div>
				{/each}
			</div>

			<p class="text-[10px] text-slate-500 border-t border-slate-700 pt-3">
				<span class="text-slate-400 font-medium">Payment tracking:</span> Once a sponsor reaches <span class="font-mono text-orange-300">contracted</span>, go to
				<a href="/dashboard/payments" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Payments &amp; Income</a>
				to create the payment schedule. Each installment gets a QuickBooks invoice number — Ina uses this as the memo reference for reconciliation.
				Sponsor payments received are tracked in the <a href="/dashboard/income" class="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Income Pipeline</a>.
			</p>
		</div>
	</Card>

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
		<div class="flex items-center gap-3 mb-3">
			<h2 class="text-lg font-semibold text-slate-200">Sales Pipeline</h2>
			{#if moving}
				<span class="text-xs text-slate-400 animate-pulse">Saving…</span>
			{/if}
			<span class="text-xs text-slate-500">Drag cards between columns or use the ⋮ menu to move stages</span>
		</div>
		<PipelineBoard
			config={boardConfig}
			items={boardItems}
			onmove={handleMove}
		/>
	</div>

	<!-- Franchise Acquisition Track -->
	<div>
		<div class="flex items-center gap-3 mb-3">
			<h2 class="text-lg font-semibold text-slate-200">Franchise Acquisition Track</h2>
			<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-700">
				{franchiseTrackSponsors.length} sponsor{franchiseTrackSponsors.length !== 1 ? 's' : ''}
			</span>
			<p class="text-xs text-slate-500">Sponsors pursuing franchise ownership — runs in parallel with their sponsorship tier</p>
		</div>

		{#if franchiseTrackSponsors.length === 0}
			<Card class="p-6 bg-slate-800/30 border-slate-700 border-dashed">
				<p class="text-sm text-slate-500 text-center">No sponsors on the franchise track yet. Enable <span class="font-mono text-slate-400">Franchise Interest</span> on a sponsor record to add them here.</p>
			</Card>
		{:else}
			{@const franchiseBoardConfig = {
				columnWidth: 'w-60',
				stages: FRANCHISE_TRACK_STAGES.map(s => ({
					key: s,
					label: FRANCHISE_TRACK_LABELS[s] ?? s,
					colorClass: FRANCHISE_TRACK_COLORS[s] ?? ''
				})),
				terminalStages: []
			}}
			{@const franchiseBoardItems = franchiseTrackSponsors.map((s: any) => ({
				id: s.id,
				title: s.companyName,
				subtitle: s.location || undefined,
				status: s.franchiseTrackStatus ?? 'franchise_interest',
				href: `/dashboard/sponsors/${s.id}`,
				badge: {
					label: SPONSOR_TIER_LABELS[s.tier as keyof typeof SPONSOR_TIER_LABELS] ?? s.tier,
					colorClass: SPONSOR_TIER_COLORS[s.tier as keyof typeof SPONSOR_TIER_COLORS] ?? 'bg-slate-700 text-slate-300 border-slate-600'
				},
				meta: s.annualCommitment ? `${fmt(s.annualCommitment)}/yr` : undefined
			}))}
			<PipelineBoard
				config={franchiseBoardConfig}
				items={franchiseBoardItems}
				showTerminal={false}
			/>
		{/if}
	</div>

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

<!-- Contracted Confirmation Modal -->
{#if pendingMove}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-orange-700/60 rounded-2xl shadow-2xl w-full max-w-lg">
		<!-- Header -->
		<div class="flex items-center gap-3 p-6 border-b border-slate-700">
			<div class="p-2 rounded-lg bg-orange-900/50 border border-orange-700/50 shrink-0">
				<FileText class="size-5 text-orange-400" />
			</div>
			<div>
				<h2 class="text-lg font-semibold text-slate-100">Mark as Contracted</h2>
				<p class="text-xs text-slate-400 mt-0.5">
					{pendingSponsor?.companyName ?? 'This sponsor'} will move to <span class="text-orange-300 font-mono">contracted</span> and a draft Purchase Order will be created.
				</p>
			</div>
			<button onclick={cancelContractMove} class="ml-auto text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>

		<div class="p-6 space-y-5">
			{#if contractErr}
				<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{contractErr}</p>
			{/if}

			<!-- Pre-flight checklist -->
			<div class="space-y-2">
				<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Before proceeding, confirm:</p>
				{#each [
					'Signed contract or LOI is on file',
					'Annual commitment amount is agreed',
					'Payment schedule has been discussed',
					'Sponsor contact details are up to date'
				] as item}
					<div class="flex items-start gap-2.5 text-sm text-slate-300">
						<CheckCircle2 class="size-4 text-orange-400 shrink-0 mt-0.5" />
						<span>{item}</span>
					</div>
				{/each}
			</div>

			<!-- PO details -->
			<div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
				<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
					<FileText class="size-3.5" /> Draft Purchase Order
				</p>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Amount ($) *</label>
						<input
							bind:value={poAmount}
							type="number"
							min="1"
							required
							class={INPUT}
							placeholder={pendingSponsor?.annualCommitment ? String(pendingSponsor.annualCommitment) : '0'}
						/>
					</div>
					<div>
						<label class={LABEL}>Year</label>
						<input bind:value={poYear} type="number" min="2024" max="2030" class={INPUT} />
					</div>
				</div>
				<div>
					<label class={LABEL}>Description (optional)</label>
					<input
						bind:value={poDescription}
						class={INPUT}
						placeholder="Sponsorship agreement — {pendingSponsor?.companyName ?? ''} ({poYear})"
					/>
				</div>
				<p class="text-[10px] text-slate-500">A draft PO will be created. You can review and send it from the sponsor's detail page.</p>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3 px-6 pb-6">
			<Button type="button" variant="outline" onclick={cancelContractMove} class="border-slate-600 text-slate-300" disabled={contractConfirming}>
				Cancel
			</Button>
			<Button
				type="button"
				onclick={confirmContractMove}
				disabled={contractConfirming || !poAmount || Number(poAmount) <= 0}
				class="gap-2 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
			>
				<FileText class="size-4" />
				{contractConfirming ? 'Processing…' : 'Confirm & Start Collections'}
			</Button>
		</div>
	</div>
</div>
{/if}

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
