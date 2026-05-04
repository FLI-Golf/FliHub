<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData, ActionData } from './$types';
	import { ArrowLeft, Pencil, Trash2, Plus, CheckCircle2, Clock, AlertCircle, DollarSign, Calendar, MapPin, Users, TrendingUp, X, Upload, FileText, Image, Loader2 } from 'lucide-svelte';
	import {
		PIPELINE_STAGES, SPONSOR_STATUS_LABELS, SPONSOR_STATUS_COLORS,
		SPONSOR_TIER_LABELS, SPONSOR_TIER_COLORS, SPONSOR_TIER_PRICING, isActivePayer,
		FRANCHISE_TRACK_STAGES, FRANCHISE_TRACK_LABELS, FRANCHISE_TRACK_COLORS
	} from '$lib/domain/schemas/sponsor.schema';
	import {
		PAYMENT_TYPE_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS
	} from '$lib/domain/schemas/sponsor-payment.schema';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const s = $derived(data.sponsor);
	const payments = $derived(data.payments ?? []);

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	// Payment totals
	const totalReceived  = $derived(payments.filter((p: any) => p.status === 'received').reduce((sum: number, p: any) => sum + (p.amount || 0), 0));
	const totalScheduled = $derived(payments.filter((p: any) => p.status === 'scheduled' || p.status === 'invoiced').reduce((sum: number, p: any) => sum + (p.amount || 0), 0));
	const totalOverdue   = $derived(payments.filter((p: any) => p.status === 'overdue').reduce((sum: number, p: any) => sum + (p.amount || 0), 0));
	const balance        = $derived((s?.annualCommitment || 0) - totalReceived);

	// File uploads
	let uploading = $state<'loiDocuments' | 'logo' | null>(null);
	let uploadErr = $state('');

	const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';

	function fileUrl(filename: string) {
		return `${PB_URL}/api/files/sponsors/${s?.id}/${filename}`;
	}

	async function handleUpload(field: 'loiDocuments' | 'logo', files: FileList | null) {
		if (!files?.length || !s?.id) return;
		uploading = field;
		uploadErr = '';
		try {
			const fd = new FormData();
			fd.append('field', field);
			for (const f of Array.from(files)) fd.append('files', f);
			const res = await fetch(`/api/sponsors/${s.id}/files`, { method: 'POST', body: fd });
			if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Upload failed'); }
			await invalidateAll();
		} catch (e: any) {
			uploadErr = e.message;
		} finally {
			uploading = null;
		}
	}

	async function handleDelete(field: 'loiDocuments' | 'logo', filename: string) {
		if (!s?.id) return;
		const res = await fetch(`/api/sponsors/${s.id}/files?field=${field}&filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
		if (res.ok) await invalidateAll();
	}

	function isImage(filename: string) {
		return /\.(jpg|jpeg|png|webp|svg)$/i.test(filename);
	}

	// Pipeline stage index for progress bar
	const stageIndex = $derived(PIPELINE_STAGES.indexOf(s?.status));

	// UI state
	let editing          = $state(false);
	let showPayModal     = $state(false);
	let showRepModal     = $state(false);
	let repSearch        = $state('');
	let repLoading       = $state(false);
	let repErr           = $state('');

	const filteredReps = $derived(
		(data.userProfiles ?? []).filter((u: any) => {
			const q = repSearch.toLowerCase();
			return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
		})
	);

	// Territory modal
	let showTerritoryModal = $state(false);
	let territorySearch    = $state('');
	let territoryLoading   = $state(false);
	let territoryErr       = $state('');
	let customTerritory    = $state('');

	const filteredTerritories = $derived(
		(data.territories ?? []).filter((t: any) => {
			const q = territorySearch.toLowerCase();
			return !q || `${t.name} ${t.code ?? ''} ${t.state ?? ''} ${t.city ?? ''}`.toLowerCase().includes(q);
		})
	);

	async function assignTerritory(value: string | null) {
		territoryLoading = true; territoryErr = '';
		try {
			const fd = new FormData();
			if (value) fd.append('territory', value);
			const res = await fetch('?/assignTerritory', { method: 'POST', body: fd });
			if (!res.ok) throw new Error('Failed to assign territory');
			await invalidateAll();
			showTerritoryModal = false;
			territorySearch = '';
			customTerritory = '';
		} catch (e: any) {
			territoryErr = e.message;
		} finally {
			territoryLoading = false;
		}
	}

	async function assignRep(userId: string | null) {
		repLoading = true; repErr = '';
		try {
			const fd = new FormData();
			if (userId) fd.append('userId', userId);
			const res = await fetch('?/assignRep', { method: 'POST', body: fd });
			if (!res.ok) throw new Error('Failed to assign rep');
			await invalidateAll();
			showRepModal = false;
			repSearch = '';
		} catch (e: any) {
			repErr = e.message;
		} finally {
			repLoading = false;
		}
	}
	let payErr        = $state('');
	let payLoading    = $state(false);
	let payForm = $state({ amount: '', paymentType: 'installment', status: 'scheduled', dueDate: '', receivedDate: '', year: '2026', invoiceNumber: '', notes: '' });

	async function submitPayment(e: SubmitEvent) {
		e.preventDefault();
		payLoading = true; payErr = '';
		try {
			const res = await fetch('/api/sponsor-payments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...payForm, sponsor: s.id, amount: Number(payForm.amount), year: payForm.year ? Number(payForm.year) : null })
			});
			if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
			showPayModal = false;
			payForm = { amount: '', paymentType: 'installment', status: 'scheduled', dueDate: '', receivedDate: '', year: '2026', invoiceNumber: '', notes: '' };
			await invalidateAll();
		} catch (err: any) { payErr = err.message ?? 'Failed'; }
		finally { payLoading = false; }
	}

	async function markReceived(paymentId: string, amount: number) {
		await fetch(`/api/sponsor-payments/${paymentId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'received', receivedDate: new Date().toISOString().slice(0, 10) })
		});
		await invalidateAll();
	}

	async function deletePayment(paymentId: string) {
		if (!confirm('Delete this payment record?')) return;
		await fetch(`/api/sponsor-payments/${paymentId}`, { method: 'DELETE' });
		await invalidateAll();
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
</script>

<svelte:head><title>{s?.companyName ?? 'Sponsor'} — FliHub</title></svelte:head>

<div class="space-y-6 max-w-5xl">

	<!-- Back + actions -->
	<div class="flex items-center justify-between">
		<Button href="/dashboard/sponsors" variant="ghost" class="gap-2 text-slate-400 hover:text-slate-100">
			<ArrowLeft class="size-4" /> Back to Pipeline
		</Button>
		<div class="flex gap-2">
			<Button onclick={() => (editing = !editing)} variant="outline" class="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700">
				{#if editing}<X class="size-4" />Cancel{:else}<Pencil class="size-4" />Edit{/if}
			</Button>
			<form method="POST" action="?/delete" use:enhance>
				<Button type="submit" variant="outline" class="gap-2 border-red-800 text-red-400 hover:bg-red-900/30"
					onclick={(e) => { if (!confirm('Delete this sponsor?')) e.preventDefault(); }}>
					<Trash2 class="size-4" /> Delete
				</Button>
			</form>
		</div>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">{form.error}</div>
	{/if}

	<!-- Two-column layout when editing -->
	<div class="{editing ? 'grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start' : 'space-y-6'}">

	{#if editing}
	<!-- Edit form — left column -->
	<div class="lg:sticky lg:top-6">
	<Card class="p-6 bg-slate-800/60 border-slate-700">
		<h2 class="text-base font-semibold text-slate-100 mb-5 flex items-center gap-2"><Pencil class="size-4 text-slate-400" /> Edit Sponsor</h2>
		<form method="POST" action="?/update" use:enhance class="space-y-4">
			<div class="grid grid-cols-1 gap-3">
				<div><label class={LABEL}>Company Name *</label><input name="companyName" required value={s?.companyName} class={INPUT} /></div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Type</label>
						<select name="type" class={INPUT}>
							{#each ['corporate','casino','resort','hospitality','entertainment','media','technology','financial','other'] as t}
								<option value={t} selected={s?.type === t}>{t.replace('_',' ')}</option>
							{/each}
						</select>
					</div>
					<div><label class={LABEL}>Tier</label>
						<select name="tier" class={INPUT}>
							{#each ['tier_1','tier_2','tier_3','tier_4'] as t}
								<option value={t} selected={s?.tier === t}>{SPONSOR_TIER_LABELS[t]}</option>
							{/each}
						</select>
					</div>
				</div>
				<div><label class={LABEL}>Pipeline Stage</label>
					<select name="status" class={INPUT}>
						{#each [...PIPELINE_STAGES, 'expired', 'converted_to_franchise', 'lost'] as st}
							<option value={st} selected={s?.status === st}>{SPONSOR_STATUS_LABELS[st]}</option>
						{/each}
					</select>
				</div>
				<div><label class={LABEL}>Contact Name</label><input name="primaryContactName" value={s?.primaryContactName || ''} class={INPUT} /></div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Email</label><input type="email" name="primaryContactEmail" value={s?.primaryContactEmail || ''} class={INPUT} /></div>
					<div><label class={LABEL}>Phone</label><input name="primaryContactPhone" value={s?.primaryContactPhone || ''} class={INPUT} /></div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Location</label><input name="location" value={s?.location || ''} class={INPUT} /></div>
					<div><label class={LABEL}>Territory</label><input name="territory" value={s?.territory || ''} class={INPUT} /></div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Annual Commitment ($)</label><input type="number" name="annualCommitment" value={s?.annualCommitment || ''} min="0" class={INPUT} /></div>
					<div><label class={LABEL}>Close Probability (%)</label><input type="number" name="dealProbability" value={s?.dealProbability || ''} min="0" max="100" class={INPUT} /></div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Contract Start</label><input type="date" name="contractStartDate" value={s?.contractStartDate?.slice(0,10) || ''} class={INPUT} /></div>
					<div><label class={LABEL}>Contract End</label><input type="date" name="contractEndDate" value={s?.contractEndDate?.slice(0,10) || ''} class={INPUT} /></div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div><label class={LABEL}>Last Contact</label><input type="date" name="lastContactDate" value={s?.lastContactDate?.slice(0,10) || ''} class={INPUT} /></div>
					<div><label class={LABEL}>Next Follow-Up</label><input type="date" name="nextFollowUpDate" value={s?.nextFollowUpDate?.slice(0,10) || ''} class={INPUT} /></div>
				</div>
				{#if data.userProfiles?.length}
				<div><label class={LABEL}>Assigned Rep</label>
					<select name="assignedTo" class={INPUT}>
						<option value="">— Unassigned —</option>
						{#each data.userProfiles as p}
							<option value={p.id} selected={s?.assignedTo === p.id}>{p.firstName} {p.lastName}</option>
						{/each}
					</select>
				</div>
				{/if}
				<div class="flex items-center gap-3 pt-1">
					<input type="hidden" name="franchiseInterest" value="false" />
					<input type="checkbox" id="fi" name="franchiseInterest" value="true" checked={s?.franchiseInterest} class="size-4 rounded border-slate-600 bg-slate-700 accent-emerald-500" />
					<label for="fi" class="text-sm text-slate-300">Franchise Interest</label>
				</div>
				{#if s?.franchiseInterest}
				<div class="grid grid-cols-2 gap-3 p-3 rounded-xl border border-violet-800/50 bg-violet-950/20">
					<div>
						<label class={LABEL}>Franchise Track Stage</label>
						<select name="franchiseTrackStatus" class={INPUT}>
							<option value="">— Not started —</option>
							{#each FRANCHISE_TRACK_STAGES as stage}
								<option value={stage} selected={s?.franchiseTrackStatus === stage}>{FRANCHISE_TRACK_LABELS[stage]}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL}>Stage Entry Date</label>
						<input type="date" name="franchiseTrackDate" value={s?.franchiseTrackDate?.slice(0,10) || ''} class={INPUT} />
					</div>
				</div>
				{/if}
				<div><label class={LABEL}>Notes</label><textarea name="notes" rows="4" class="{INPUT} resize-none">{s?.notes || ''}</textarea></div>
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => editing = false} class="border-slate-600 text-slate-300">Cancel</Button>
				<Button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
			</div>
		</form>
	</Card>
	</div>
	{/if}

	<!-- Right column (or full width when not editing) -->
	<div class="space-y-6">

	<!-- Header card -->
	<Card class="p-6 bg-slate-800/60 border-slate-700">
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-white mb-2">{s?.companyName}</h1>
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs px-2 py-0.5 rounded border font-medium {SPONSOR_TIER_COLORS[s?.tier] ?? ''}">
						{SPONSOR_TIER_LABELS[s?.tier] ?? s?.tier}
					</span>
					<span class="text-xs px-2 py-0.5 rounded border font-medium {SPONSOR_STATUS_COLORS[s?.status] ?? ''}">
						{SPONSOR_STATUS_LABELS[s?.status] ?? s?.status}
					</span>
					{#if s?.franchiseInterest}
						<span class="text-xs px-2 py-0.5 rounded border bg-violet-900/50 text-violet-300 border-violet-700 font-medium">Franchise Interest</span>
						{#if s?.franchiseTrackStatus}
							<span class="text-xs px-2 py-0.5 rounded border font-medium {FRANCHISE_TRACK_COLORS[s.franchiseTrackStatus]}">
								{FRANCHISE_TRACK_LABELS[s.franchiseTrackStatus]}
							</span>
						{/if}
					{/if}
					{#if s?.type}
						<span class="text-xs text-slate-400 capitalize">{s.type.replace('_', ' ')}</span>
					{/if}
				</div>
			</div>
			{#if s?.dealProbability != null && isActivePayer(s?.status) === false}
				<div class="text-center shrink-0">
					<div class="text-3xl font-black text-emerald-400">{s.dealProbability}%</div>
					<div class="text-xs text-slate-400">close probability</div>
				</div>
			{/if}
		</div>

		<!-- Pipeline progress -->
		{#if stageIndex >= 0}
		<div class="mt-5">
			<div class="flex items-center gap-0">
				{#each PIPELINE_STAGES as stage, i}
					{@const active = i === stageIndex}
					{@const done   = i < stageIndex}
					<div class="flex-1 flex flex-col items-center gap-1">
						<div class="w-full flex items-center">
							{#if i > 0}<div class="flex-1 h-0.5 {done || active ? 'bg-emerald-500' : 'bg-slate-700'}"></div>{/if}
							<div class="size-3 rounded-full shrink-0 {active ? 'bg-emerald-400 ring-2 ring-emerald-400/40' : done ? 'bg-emerald-600' : 'bg-slate-700'}"></div>
							{#if i < PIPELINE_STAGES.length - 1}<div class="flex-1 h-0.5 {done ? 'bg-emerald-500' : 'bg-slate-700'}"></div>{/if}
						</div>
						<span class="text-[9px] text-center {active ? 'text-emerald-400 font-semibold' : done ? 'text-slate-400' : 'text-slate-600'} leading-tight">
							{SPONSOR_STATUS_LABELS[stage]}
						</span>
					</div>
				{/each}
			</div>
		</div>
		{/if}
	</Card>

	<!-- Financial summary -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card class="p-4 text-center bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Annual Commitment</p>
			<p class="text-xl font-bold text-emerald-300">{fmt(s?.annualCommitment)}</p>
		</Card>
		<Card class="p-4 text-center bg-blue-950/40 border-blue-800/50">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Cash Received</p>
			<p class="text-xl font-bold text-blue-300">{fmt(totalReceived)}</p>
		</Card>
		<Card class="p-4 text-center {totalOverdue > 0 ? 'bg-red-950/40 border-red-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {totalOverdue > 0 ? 'text-red-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Overdue</p>
			<p class="text-xl font-bold {totalOverdue > 0 ? 'text-red-300' : 'text-slate-500'}">{fmt(totalOverdue)}</p>
		</Card>
		<Card class="p-4 text-center {balance > 0 ? 'bg-yellow-950/40 border-yellow-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {balance > 0 ? 'text-yellow-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Balance Due</p>
			<p class="text-xl font-bold {balance > 0 ? 'text-yellow-300' : 'text-slate-400'}">{fmt(balance)}</p>
		</Card>
	</div>

	<!-- Contact + Contract -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<Card class="p-5 bg-slate-800/50 border-slate-700 space-y-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
				<Users class="size-4 text-slate-400" /> Contact
			</h2>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between"><dt class="text-slate-400">Name</dt><dd class="text-slate-100 font-medium">{s?.primaryContactName || '—'}</dd></div>
				<div class="flex justify-between"><dt class="text-slate-400">Email</dt>
					<dd>{#if s?.primaryContactEmail}<a href="mailto:{s.primaryContactEmail}" class="text-emerald-400 hover:underline">{s.primaryContactEmail}</a>{:else}—{/if}</dd>
				</div>
				<div class="flex justify-between"><dt class="text-slate-400">Phone</dt><dd class="text-slate-100">{s?.primaryContactPhone || '—'}</dd></div>
				<div class="flex justify-between"><dt class="text-slate-400">Location</dt><dd class="text-slate-100">{s?.location || '—'}</dd></div>
				<div class="flex justify-between items-center">
					<dt class="text-slate-400">Assigned Rep</dt>
					<dd>
						<button onclick={() => { showRepModal = true; repSearch = ''; }}
							class="flex items-center gap-1.5 text-sm rounded-md px-2 py-0.5 -mr-2 transition-colors
								{s?.expand?.assignedTo ? 'text-slate-100 hover:bg-slate-700' : 'text-emerald-400 hover:bg-emerald-900/30'}">
							{#if s?.expand?.assignedTo}
								<Users class="size-3.5 text-slate-400" />
								{`${s.expand.assignedTo.firstName ?? ''} ${s.expand.assignedTo.lastName ?? ''}`.trim() || s.expand.assignedTo.email}
							{:else}
								<Plus class="size-3.5" />
								Add Sales Rep
							{/if}
						</button>
					</dd>
				</div>
			</dl>
		</Card>
		<Card class="p-5 bg-slate-800/50 border-slate-700 space-y-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
				<Calendar class="size-4 text-slate-400" /> Contract & Pipeline
			</h2>
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between"><dt class="text-slate-400">Contract Start</dt><dd class="text-slate-100">{fmtDate(s?.contractStartDate)}</dd></div>
				<div class="flex justify-between"><dt class="text-slate-400">Contract End</dt><dd class="text-slate-100">{fmtDate(s?.contractEndDate)}</dd></div>
				<div class="flex justify-between"><dt class="text-slate-400">Last Contact</dt><dd class="text-slate-100">{fmtDate(s?.lastContactDate)}</dd></div>
				<div class="flex justify-between"><dt class="text-slate-400">Next Follow-Up</dt>
					<dd class="{s?.nextFollowUpDate ? 'text-cyan-400 font-medium' : 'text-slate-100'}">{fmtDate(s?.nextFollowUpDate)}</dd>
				</div>
				<div class="flex justify-between items-center">
					<dt class="text-slate-400">Territory</dt>
					<dd>
						<button onclick={() => { showTerritoryModal = true; territorySearch = ''; customTerritory = s?.territory || ''; }}
							class="flex items-center gap-1.5 text-sm rounded-md px-2 py-0.5 -mr-2 transition-colors
								{s?.territory ? 'text-slate-100 hover:bg-slate-700' : 'text-emerald-400 hover:bg-emerald-900/30'}">
							{#if s?.territory}
								<MapPin class="size-3.5 text-slate-400" />
								{s.territory}
							{:else}
								<Plus class="size-3.5" />
								Add Territory
							{/if}
						</button>
					</dd>
				</div>
			</dl>
		</Card>
	</div>

	<!-- Payments -->
	<Card class="p-5 bg-slate-800/50 border-slate-700">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
				<DollarSign class="size-4 text-slate-400" /> Payment Schedule
			</h2>
			<Button onclick={() => showPayModal = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3">
				<Plus class="size-3.5" /> Log Payment
			</Button>
		</div>

		{#if payments.length === 0}
			<p class="text-sm text-slate-500 text-center py-6">No payments logged yet. Add the first payment to start tracking revenue.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700">
							<th class="pb-2 pr-3">Due</th>
							<th class="pb-2 pr-3">Type</th>
							<th class="pb-2 pr-3 text-right">Amount</th>
							<th class="pb-2 pr-3">Status</th>
							<th class="pb-2 pr-3">Received</th>
							<th class="pb-2">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-700/50">
						{#each payments as p}
							<tr class="hover:bg-slate-700/30 transition-colors">
								<td class="py-2 pr-3 text-slate-300">{fmtDate(p.dueDate)}</td>
								<td class="py-2 pr-3 text-slate-400 capitalize">{PAYMENT_TYPE_LABELS[p.paymentType as keyof typeof PAYMENT_TYPE_LABELS] ?? p.paymentType}</td>
								<td class="py-2 pr-3 text-right font-bold text-emerald-400">{fmt(p.amount)}</td>
								<td class="py-2 pr-3">
									<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {PAYMENT_STATUS_COLORS[p.status as keyof typeof PAYMENT_STATUS_COLORS] ?? ''}">
										{PAYMENT_STATUS_LABELS[p.status as keyof typeof PAYMENT_STATUS_LABELS] ?? p.status}
									</span>
								</td>
								<td class="py-2 pr-3 text-slate-400 text-xs">{p.receivedDate ? fmtDate(p.receivedDate) : '—'}</td>
								<td class="py-2">
									<div class="flex items-center gap-1">
										{#if p.status !== 'received' && p.status !== 'cancelled'}
											<button onclick={() => markReceived(p.id, p.amount)}
												class="text-[10px] px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700 hover:bg-emerald-800/60 transition-colors">
												Mark Received
											</button>
										{/if}
										<button onclick={() => deletePayment(p.id)}
											class="text-[10px] px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50 transition-colors">
											Delete
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="border-t border-slate-600">
						<tr>
							<td colspan="2" class="pt-3 text-xs text-slate-400 font-medium">Totals</td>
							<td class="pt-3 text-right font-bold text-emerald-400">{fmt(totalReceived + totalScheduled + totalOverdue)}</td>
							<td colspan="3" class="pt-3 text-xs text-slate-500">
								{fmt(totalReceived)} received · {fmt(totalScheduled)} scheduled · {fmt(totalOverdue)} overdue
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</Card>

	<!-- Notes -->
	{#if s?.notes}
	<Card class="p-5 bg-slate-800/50 border-slate-700">
		<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Notes</h2>
		<p class="text-slate-300 text-sm whitespace-pre-wrap">{s.notes}</p>
	</Card>
	{/if}

	<!-- Franchise connections -->
	{#if data.bridgeRecords?.length}
	<Card class="p-5 bg-violet-950/30 border-violet-800/40">
		<h2 class="text-sm font-semibold text-violet-300 uppercase tracking-wide mb-3 flex items-center gap-2">
			<TrendingUp class="size-4" /> Franchise Conversion
		</h2>
		<div class="space-y-2">
			{#each data.bridgeRecords as bridge}
				<div class="flex items-center justify-between p-3 bg-slate-800/60 rounded-lg border border-slate-700">
					<div>
						<p class="font-medium text-slate-100">{bridge.expand?.franchiseId?.name || 'Franchise Deal'}</p>
						{#if bridge.sponsorshipValueToDate}
							<p class="text-xs text-slate-400 mt-0.5">{fmt(bridge.sponsorshipValueToDate)} invested as sponsor</p>
						{/if}
					</div>
					<Button href="/dashboard/sponsors/bridge/{bridge.id}" variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700">View</Button>
				</div>
			{/each}
		</div>
	</Card>
	{/if}

	<!-- LOI Documents & Logo -->
	<Card class="p-6 space-y-6">
		<h2 class="text-base font-bold">Documents & Logo</h2>

		{#if uploadErr}
			<p class="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded px-3 py-2">{uploadErr}</p>
		{/if}

		<!-- LOI Documents -->
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold">Letter of Intent</p>
					<p class="text-xs text-muted-foreground">Upload signed LOI documents — PDF or image</p>
				</div>
				<label class="cursor-pointer">
					<input type="file" accept=".pdf,image/*" multiple class="hidden"
						onchange={(e) => handleUpload('loiDocuments', (e.target as HTMLInputElement).files)} />
					<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
						bg-blue-600 hover:bg-blue-700 text-white transition-colors">
						{#if uploading === 'loiDocuments'}
							<Loader2 class="size-3.5 animate-spin" /> Uploading…
						{:else}
							<Upload class="size-3.5" /> Upload LOI
						{/if}
					</span>
				</label>
			</div>

			{#if s?.loiDocuments?.length}
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{#each s.loiDocuments as filename}
						<div class="group relative rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
							{#if isImage(filename)}
								<img src={fileUrl(filename)} alt={filename}
									class="w-full h-28 object-cover" />
							{:else}
								<div class="w-full h-28 flex flex-col items-center justify-center gap-2 bg-slate-800">
									<FileText class="size-8 text-blue-400" />
									<p class="text-[10px] text-slate-400 px-2 text-center truncate w-full">{filename}</p>
								</div>
							{/if}
							<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
								<a href={fileUrl(filename)} target="_blank"
									class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium">
									View
								</a>
								<button onclick={() => handleDelete('loiDocuments', filename)}
									class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium">
									Remove
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center gap-3 p-4 rounded-lg border border-dashed border-slate-700 text-muted-foreground">
					<FileText class="size-5 shrink-0" />
					<p class="text-xs">No LOI documents uploaded yet.</p>
				</div>
			{/if}
		</div>

		<!-- Logo -->
		<div class="space-y-3 pt-4 border-t border-slate-700/60">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold">Sponsor Logo</p>
					<p class="text-xs text-muted-foreground">PNG, JPG, WebP, or SVG</p>
				</div>
				<label class="cursor-pointer">
					<input type="file" accept="image/*" class="hidden"
						onchange={(e) => handleUpload('logo', (e.target as HTMLInputElement).files)} />
					<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
						bg-violet-600 hover:bg-violet-700 text-white transition-colors">
						{#if uploading === 'logo'}
							<Loader2 class="size-3.5 animate-spin" /> Uploading…
						{:else}
							<Image class="size-3.5" /> Upload Logo
						{/if}
					</span>
				</label>
			</div>

			{#if s?.logo}
				<div class="group relative inline-block rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
					<img src={fileUrl(s.logo)} alt="{s.companyName} logo"
						class="h-24 w-auto object-contain p-3" />
					<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<button onclick={() => handleDelete('logo', s.logo)}
							class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium">
							Remove
						</button>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-3 p-4 rounded-lg border border-dashed border-slate-700 text-muted-foreground">
					<Image class="size-5 shrink-0" />
					<p class="text-xs">No logo uploaded yet.</p>
				</div>
			{/if}
		</div>
	</Card>

	</div> <!-- end right column -->
	</div> <!-- end two-column wrapper -->

</div>

<!-- Log Payment Modal -->
{#if showPayModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
		<div class="flex items-center justify-between p-5 border-b border-slate-700">
			<h2 class="text-base font-semibold text-slate-100">Log Payment — {s?.companyName}</h2>
			<button onclick={() => showPayModal = false} class="text-slate-400 hover:text-slate-100" aria-label="Close">
				<X class="size-5" />
			</button>
		</div>
		<form onsubmit={submitPayment} class="p-5 space-y-4">
			{#if payErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{payErr}</p>{/if}
			<div class="grid grid-cols-2 gap-3">
				<div><label class={LABEL}>Amount ($) *</label><input bind:value={payForm.amount} type="number" min="1" required class={INPUT} placeholder="500000" /></div>
				<div><label class={LABEL}>Year</label>
					<select bind:value={payForm.year} class={INPUT}>
						<option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div><label class={LABEL}>Payment Type</label>
					<select bind:value={payForm.paymentType} class={INPUT}>
						{#each Object.entries(PAYMENT_TYPE_LABELS) as [val, label]}
							<option value={val}>{label}</option>
						{/each}
					</select>
				</div>
				<div><label class={LABEL}>Status</label>
					<select bind:value={payForm.status} class={INPUT}>
						<option value="scheduled">Scheduled</option>
						<option value="invoiced">Invoiced</option>
						<option value="received">Received</option>
						<option value="overdue">Overdue</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div><label class={LABEL}>Due Date</label><input bind:value={payForm.dueDate} type="date" class={INPUT} /></div>
				<div><label class={LABEL}>Received Date</label><input bind:value={payForm.receivedDate} type="date" class={INPUT} /></div>
			</div>
			<div><label class={LABEL}>Invoice #</label><input bind:value={payForm.invoiceNumber} class={INPUT} placeholder="INV-001" /></div>
			<div><label class={LABEL}>Notes</label><textarea bind:value={payForm.notes} rows="2" class="{INPUT} resize-none" placeholder="Payment context…"></textarea></div>
			<div class="flex justify-end gap-3 pt-1">
				<Button type="button" variant="outline" onclick={() => showPayModal = false} class="border-slate-600 text-slate-300">Cancel</Button>
				<Button type="submit" disabled={payLoading} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
					<Plus class="size-4" />{payLoading ? 'Saving…' : 'Log Payment'}
				</Button>
			</div>
		</form>
	</div>
</div>
{/if}

<!-- Assign Territory Modal -->
{#if showTerritoryModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
	role="dialog" aria-modal="true" aria-label="Assign Territory">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">

		<!-- Header -->
		<div class="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Assign Territory</h2>
				<p class="text-xs text-slate-400 mt-0.5">{s?.companyName}</p>
			</div>
			<button onclick={() => { showTerritoryModal = false; territorySearch = ''; }}
				class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<X class="size-5" />
			</button>
		</div>

		<!-- Search -->
		<div class="p-4 border-b border-slate-800 shrink-0">
			<input bind:value={territorySearch} type="search" placeholder="Search territories…"
				class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm
					focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
		</div>

		<!-- Territory list -->
		<div class="overflow-y-auto flex-1 p-2">
			{#if territoryErr}
				<p class="text-sm text-red-400 px-3 py-2">{territoryErr}</p>
			{/if}

			<!-- Remove assignment -->
			{#if s?.territory}
				<button onclick={() => assignTerritory(null)} disabled={territoryLoading}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
						text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50">
					<div class="size-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
						<X class="size-3.5 text-slate-400" />
					</div>
					<span>Remove territory</span>
				</button>
				<div class="border-t border-slate-800 my-1"></div>
			{/if}

			{#if filteredTerritories.length === 0 && !territorySearch}
				<p class="text-sm text-slate-500 italic px-3 py-4 text-center">No territories found</p>
			{:else if filteredTerritories.length === 0}
				<!-- No match — offer to save the search string as a custom value -->
				<p class="text-sm text-slate-500 italic px-3 py-2 text-center">No match — use as custom territory?</p>
				<button onclick={() => assignTerritory(territorySearch)} disabled={territoryLoading}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-800 transition-colors disabled:opacity-50">
					<div class="size-8 rounded-full bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center shrink-0">
						<Plus class="size-3.5 text-emerald-400" />
					</div>
					<div>
						<p class="text-sm font-medium text-emerald-300">"{territorySearch}"</p>
						<p class="text-xs text-slate-500">Save as custom territory</p>
					</div>
				</button>
			{:else}
				{#each filteredTerritories as t (t.id)}
					{@const isAssigned = s?.territory === t.name}
					<button onclick={() => assignTerritory(t.name)} disabled={territoryLoading || isAssigned}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
							disabled:cursor-default
							{isAssigned ? 'bg-emerald-900/20 border border-emerald-700/40' : 'hover:bg-slate-800'}">
						<div class="size-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
							<MapPin class="size-3.5 {isAssigned ? 'text-emerald-400' : 'text-slate-400'}" />
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium {isAssigned ? 'text-emerald-300' : 'text-slate-100'} truncate">
								{t.name}{t.code ? ` · ${t.code}` : ''}
							</p>
							<p class="text-xs text-slate-500 truncate">
								{[t.city, t.state].filter(Boolean).join(', ') || '—'}
								{#if t.status && t.status !== 'available'}
									· <span class="text-amber-400">{t.status}</span>
								{/if}
							</p>
						</div>
						{#if isAssigned}
							<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="p-4 border-t border-slate-800 shrink-0">
			<Button type="button" variant="outline" onclick={() => { showTerritoryModal = false; territorySearch = ''; }}
				class="w-full border-slate-600 text-slate-300">
				Cancel
			</Button>
		</div>
	</div>
</div>
{/if}

<!-- Assign Sales Rep Modal -->
{#if showRepModal}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
	role="dialog" aria-modal="true" aria-label="Assign Sales Representative">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">

		<!-- Header -->
		<div class="flex items-center justify-between p-5 border-b border-slate-700 shrink-0">
			<div>
				<h2 class="text-base font-semibold text-slate-100">Assign Sales Representative</h2>
				<p class="text-xs text-slate-400 mt-0.5">{s?.companyName}</p>
			</div>
			<button onclick={() => { showRepModal = false; repSearch = ''; }}
				class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<X class="size-5" />
			</button>
		</div>

		<!-- Search -->
		<div class="p-4 border-b border-slate-800 shrink-0">
			<input bind:value={repSearch} type="search" placeholder="Search by name or email…"
				class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm
					focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
		</div>

		<!-- Rep list -->
		<div class="overflow-y-auto flex-1 p-2">
			{#if repErr}
				<p class="text-sm text-red-400 px-3 py-2">{repErr}</p>
			{/if}

			<!-- Unassign option (only shown when someone is currently assigned) -->
			{#if s?.assignedTo}
				<button onclick={() => assignRep(null)} disabled={repLoading}
					class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm
						text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors disabled:opacity-50">
					<div class="size-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
						<X class="size-3.5 text-slate-400" />
					</div>
					<span>Remove assignment</span>
				</button>
				<div class="border-t border-slate-800 my-1"></div>
			{/if}

			{#if filteredReps.length === 0}
				<p class="text-sm text-slate-500 italic px-3 py-4 text-center">No reps found</p>
			{:else}
				{#each filteredReps as rep (rep.id)}
					{@const isAssigned = s?.assignedTo === rep.id}
					<button onclick={() => assignRep(rep.id)} disabled={repLoading || isAssigned}
						class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
							disabled:cursor-default
							{isAssigned ? 'bg-emerald-900/20 border border-emerald-700/40' : 'hover:bg-slate-800'}">
						<!-- Avatar initials -->
						<div class="size-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-300">
							{(rep.firstName?.[0] ?? '').toUpperCase()}{(rep.lastName?.[0] ?? '').toUpperCase()}
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium {isAssigned ? 'text-emerald-300' : 'text-slate-100'} truncate">
								{rep.firstName} {rep.lastName}
							</p>
							<p class="text-xs text-slate-500 truncate">{rep.email}</p>
						</div>
						{#if isAssigned}
							<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="p-4 border-t border-slate-800 shrink-0">
			<Button type="button" variant="outline" onclick={() => { showRepModal = false; repSearch = ''; }}
				class="w-full border-slate-600 text-slate-300">
				Cancel
			</Button>
		</div>
	</div>
</div>
{/if}
