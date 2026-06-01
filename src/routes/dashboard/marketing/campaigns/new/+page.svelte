<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChevronRight, ChevronLeft, UserCircle, CheckCircle2, Megaphone, Users, FileText, Rocket } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// ── Step state ────────────────────────────────────────────────────────────
	let step = $state(1);
	const TOTAL_STEPS = 4;

	// ── Step 1: Campaign basics ───────────────────────────────────────────────
	let name        = $state('');
	let type        = $state('Player Spotlight');
	let status      = $state('Planning');
	let startDate   = $state('');
	let endDate     = $state('');
	let goalId      = $state('');

	const CAMPAIGN_TYPES = ['Player Spotlight', 'Tournament Activation', 'Fantasy & Betting', 'Sponsor Integration', 'Brand Awareness', 'Lead Generation', 'Event', 'Marketing', 'Product Launch'];
	const CAMPAIGN_STATUSES = ['Planning', 'Active', 'Paused', 'Completed', 'Cancelled'];

	// ── Step 2: Select ambassadors ────────────────────────────────────────────
	let selectedAmbassadors = $state<string[]>([]); // talentIds

	function toggleAmbassador(talentId: string) {
		if (selectedAmbassadors.includes(talentId)) {
			selectedAmbassadors = selectedAmbassadors.filter(id => id !== talentId);
		} else {
			selectedAmbassadors = [...selectedAmbassadors, talentId];
		}
	}

	// ── Step 3: Budget & deliverables ─────────────────────────────────────────
	let totalBudget     = $state('');
	let targetAudience  = $state('');
	// Per-ambassador deliverables
	let deliverables = $state<Record<string, { posts: string; reels: string; budget: string; notes: string }>>({});

	function initDeliverables() {
		const next: typeof deliverables = {};
		for (const id of selectedAmbassadors) {
			next[id] = deliverables[id] ?? { posts: '2', reels: '1', budget: '', notes: '' };
		}
		deliverables = next;
	}

	// ── Step 4: Goals & brief ─────────────────────────────────────────────────
	let goals   = $state('');
	let metrics = $state('');

	// ── Submission ────────────────────────────────────────────────────────────
	let submitting = $state(false);
	let error      = $state('');

	const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
	const fmtK = (n: number) => n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

	function next() {
		if (step === 2) initDeliverables();
		step = Math.min(step + 1, TOTAL_STEPS);
	}
	function back() { step = Math.max(step - 1, 1); }

	const step1Valid = $derived(name.trim().length > 0 && type && startDate && endDate);
	const step2Valid = $derived(selectedAmbassadors.length > 0);
	const step3Valid = $derived(Number(totalBudget) > 0 && targetAudience.trim().length > 0);
	const step4Valid = $derived(goals.trim().length > 0);

	async function submit() {
		submitting = true;
		error = '';
		try {
			// Build goals text with per-ambassador deliverables
			const deliverablesSummary = selectedAmbassadors.map(id => {
				const amb = data.ambassadors.find((a: any) => a.talentId === id);
				const d = deliverables[id];
				const talentName = amb?.talent?.name ?? id;
				return `${talentName}:\n- ${d?.posts ?? 2} posts, ${d?.reels ?? 1} reels${d?.budget ? `, $${d.budget} budget` : ''}${d?.notes ? `\n- ${d.notes}` : ''}`;
			}).join('\n\n');

			const fullGoals = goals + (deliverablesSummary ? `\n\nAMBASSADOR DELIVERABLES\n${deliverablesSummary}` : '');

			const res = await fetch('/api/campaigns', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name, type, status, startDate, endDate,
					budget: Number(totalBudget),
					actualSpend: 0,
					targetAudience,
					goals: fullGoals,
					metrics,
					goalId: goalId || undefined,
					ambassadorIds: selectedAmbassadors,
				}),
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? `Error ${res.status}`);
			}

			const body = await res.json();
			await goto(`/dashboard/campaigns`);
		} catch (e: any) {
			error = e.message;
		} finally {
			submitting = false;
		}
	}

	const STEP_LABELS = ['Basics', 'Ambassadors', 'Budget', 'Brief'];
</script>

<svelte:head><title>New Campaign — FliHub</title></svelte:head>

<div class="max-w-2xl mx-auto space-y-6">

	<!-- Header -->
	<div>
		<a href="/dashboard/campaigns" class="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Campaigns</a>
		<h1 class="text-2xl font-bold text-slate-100 mt-1">New Campaign</h1>
	</div>

	<!-- Step indicator -->
	<div class="flex items-center gap-2">
		{#each STEP_LABELS as label, i}
			{@const n = i + 1}
			{@const active = step === n}
			{@const done = step > n}
			<div class="flex items-center gap-2 {i < STEP_LABELS.length - 1 ? 'flex-1' : ''}">
				<div class="flex items-center gap-1.5 shrink-0">
					<div class="size-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
						{done ? 'bg-emerald-600 text-white' : active ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}">
						{#if done}<CheckCircle2 class="size-3.5" />{:else}{n}{/if}
					</div>
					<span class="text-xs {active ? 'text-slate-200 font-medium' : done ? 'text-emerald-400' : 'text-slate-500'}">{label}</span>
				</div>
				{#if i < STEP_LABELS.length - 1}
					<div class="flex-1 h-px {done ? 'bg-emerald-700' : 'bg-slate-700'} mx-1"></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if error}
		<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{error}</p>
	{/if}

	<!-- ── Step 1: Basics ──────────────────────────────────────────────────── -->
	{#if step === 1}
	<div class="rounded-xl border border-slate-700 bg-slate-900/60 p-6 space-y-4">
		<div class="flex items-center gap-2 mb-2">
			<Megaphone class="size-4 text-orange-400" />
			<h2 class="font-semibold text-slate-100">Campaign Basics</h2>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Campaign Name *</label>
			<input bind:value={name} class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50" placeholder="e.g. Nationwide Feature — Summer 2026" />
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Type *</label>
				<select bind:value={type} class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50">
					{#each CAMPAIGN_TYPES as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
				<select bind:value={status} class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50">
					{#each CAMPAIGN_STATUSES as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Start Date *</label>
				<input bind:value={startDate} type="date" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">End Date *</label>
				<input bind:value={endDate} type="date" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Link to Marketing Goal (optional)</label>
			<select bind:value={goalId} class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50">
				<option value="">— None —</option>
				{#each data.marketingGoals as g (g.id)}
					<option value={g.id}>{g.goalName}</option>
				{/each}
			</select>
		</div>
	</div>
	{/if}

	<!-- ── Step 2: Ambassadors ─────────────────────────────────────────────── -->
	{#if step === 2}
	<div class="rounded-xl border border-slate-700 bg-slate-900/60 p-6 space-y-4">
		<div class="flex items-center justify-between mb-2">
			<div class="flex items-center gap-2">
				<Users class="size-4 text-orange-400" />
				<h2 class="font-semibold text-slate-100">Select Ambassadors</h2>
			</div>
			<span class="text-xs text-slate-400">{selectedAmbassadors.length} selected</span>
		</div>

		<div class="space-y-2">
			{#each data.ambassadors as amb (amb.id)}
				{@const selected = selectedAmbassadors.includes(amb.talentId)}
				<button
					onclick={() => toggleAmbassador(amb.talentId)}
					class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
						{selected ? 'border-orange-500/60 bg-orange-950/20' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}"
				>
					<div class="size-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
						{#if selected}
							<CheckCircle2 class="size-4 text-orange-400" />
						{:else}
							<UserCircle class="size-4 text-slate-500" />
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-slate-200 text-sm">{amb.talent?.name ?? amb.talentId}</p>
						<p class="text-xs text-slate-500">
							{amb.talent?.gender === 'female' ? 'FPO' : 'MPO'}
							· {fmtK(amb.followerCount ?? 0)} followers
							· {amb.engagementRate?.toFixed(1) ?? '—'}% engagement
							{#if amb.instagramHandle} · {amb.instagramHandle}{/if}
						</p>
					</div>
					<div class="text-right shrink-0">
						<p class="text-xs text-slate-400">${amb.contractedRate ?? 0}/post</p>
						<p class="text-[10px] text-slate-600">{amb.preferredContent ?? 'mixed'}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>
	{/if}

	<!-- ── Step 3: Budget & deliverables ──────────────────────────────────────  -->
	{#if step === 3}
	<div class="rounded-xl border border-slate-700 bg-slate-900/60 p-6 space-y-5">
		<div class="flex items-center gap-2 mb-2">
			<FileText class="size-4 text-orange-400" />
			<h2 class="font-semibold text-slate-100">Budget & Deliverables</h2>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Budget ($) *</label>
				<input bind:value={totalBudget} type="number" min="0" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50" placeholder="0" />
			</div>
			<div class="flex items-end pb-0.5">
				{#if selectedAmbassadors.length > 0 && Number(totalBudget) > 0}
					<p class="text-xs text-slate-400">≈ {fmt(Number(totalBudget) / selectedAmbassadors.length)} per ambassador</p>
				{/if}
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Target Audience *</label>
			<textarea bind:value={targetAudience} rows="2" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" placeholder="e.g. Disc golf fans 18-45, sports bettors, national sports media consumers"></textarea>
		</div>

		<!-- Per-ambassador deliverables -->
		<div class="space-y-3">
			<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Deliverables per Ambassador</p>
			{#each selectedAmbassadors as talentId (talentId)}
				{@const amb = data.ambassadors.find((a: any) => a.talentId === talentId)}
				{@const d = deliverables[talentId] ?? { posts: '2', reels: '1', budget: '', notes: '' }}
				<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
					<p class="text-sm font-medium text-slate-200">{amb?.talent?.name ?? talentId}</p>
					<div class="grid grid-cols-3 gap-2">
						<div>
							<label class="block text-[10px] text-slate-500 mb-0.5">Posts</label>
							<input
								value={d.posts}
								oninput={(e) => { deliverables[talentId] = { ...d, posts: (e.target as HTMLInputElement).value }; }}
								type="number" min="0"
								class="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
							/>
						</div>
						<div>
							<label class="block text-[10px] text-slate-500 mb-0.5">Reels</label>
							<input
								value={d.reels}
								oninput={(e) => { deliverables[talentId] = { ...d, reels: (e.target as HTMLInputElement).value }; }}
								type="number" min="0"
								class="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
							/>
						</div>
						<div>
							<label class="block text-[10px] text-slate-500 mb-0.5">Budget ($)</label>
							<input
								value={d.budget}
								oninput={(e) => { deliverables[talentId] = { ...d, budget: (e.target as HTMLInputElement).value }; }}
								type="number" min="0"
								class="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
							/>
						</div>
					</div>
					<input
						value={d.notes}
						oninput={(e) => { deliverables[talentId] = { ...d, notes: (e.target as HTMLInputElement).value }; }}
						class="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50"
						placeholder="Notes (angle, content style, approval required…)"
					/>
				</div>
			{/each}
		</div>
	</div>
	{/if}

	<!-- ── Step 4: Brief ──────────────────────────────────────────────────────  -->
	{#if step === 4}
	<div class="rounded-xl border border-slate-700 bg-slate-900/60 p-6 space-y-4">
		<div class="flex items-center gap-2 mb-2">
			<Rocket class="size-4 text-orange-400" />
			<h2 class="font-semibold text-slate-100">Campaign Brief</h2>
		</div>

		<!-- Summary -->
		<div class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 space-y-2 text-sm">
			<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Summary</p>
			<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<span class="text-slate-500">Name</span><span class="text-slate-200 font-medium">{name}</span>
				<span class="text-slate-500">Type</span><span class="text-slate-200">{type}</span>
				<span class="text-slate-500">Status</span><span class="text-slate-200">{status}</span>
				<span class="text-slate-500">Dates</span><span class="text-slate-200">{startDate} → {endDate}</span>
				<span class="text-slate-500">Budget</span><span class="text-slate-200">{totalBudget ? fmt(Number(totalBudget)) : '—'}</span>
				<span class="text-slate-500">Ambassadors</span>
				<span class="text-slate-200">
					{selectedAmbassadors.map(id => data.ambassadors.find((a: any) => a.talentId === id)?.talent?.name ?? id).join(', ')}
				</span>
			</div>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Campaign Goals & Brief *</label>
			<textarea bind:value={goals} rows="8" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none font-mono" placeholder="Describe the campaign objectives, content angles, release schedule, and any approval requirements…"></textarea>
		</div>

		<div>
			<label class="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Success Metrics (optional)</label>
			<textarea bind:value={metrics} rows="3" class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" placeholder="e.g. 500K impressions, 2K link clicks, 10% engagement rate…"></textarea>
		</div>
	</div>
	{/if}

	<!-- Navigation -->
	<div class="flex justify-between items-center">
		<Button variant="outline" onclick={back} disabled={step === 1} class="border-slate-600 text-slate-300 gap-1">
			<ChevronLeft class="size-4" /> Back
		</Button>

		{#if step < TOTAL_STEPS}
			<Button
				onclick={next}
				disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid}
				class="bg-orange-600 hover:bg-orange-700 text-white gap-1 disabled:opacity-50"
			>
				Next <ChevronRight class="size-4" />
			</Button>
		{:else}
			<Button
				onclick={submit}
				disabled={submitting || !step4Valid}
				class="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 disabled:opacity-50"
			>
				<Rocket class="size-4" />
				{submitting ? 'Launching…' : 'Launch Campaign'}
			</Button>
		{/if}
	</div>
</div>
