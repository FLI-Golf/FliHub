<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		ArrowLeft, CheckCircle2, Circle, Trophy, Upload,
		Plus, Trash2, AlertCircle, ChevronDown, ChevronUp, Medal
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = data.tournament;
	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	// ── Checklist ─────────────────────────────────────────────────────────────

	type CheckItem = { id: string; label: string; checked: boolean; recordId: string | null };

	let checklist = $state<{ pre: CheckItem[]; during: CheckItem[]; post: CheckItem[] }>({
		pre:    data.checklist.pre,
		during: data.checklist.during,
		post:   data.checklist.post
	});

	let checklistBusy = $state<Record<string, boolean>>({});

	async function toggleItem(phase: 'pre' | 'during' | 'post', itemId: string, checked: boolean) {
		checklistBusy[itemId] = true;
		try {
			const res = await fetch(`/api/tournaments/${t.id}/checklist`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId, checked })
			});
			if (res.ok) {
				checklist[phase] = checklist[phase].map(item =>
					item.id === itemId ? { ...item, checked } : item
				);
			}
		} finally {
			checklistBusy[itemId] = false;
		}
	}

	const phaseProgress = $derived({
		pre:    { done: checklist.pre.filter(i => i.checked).length,    total: checklist.pre.length },
		during: { done: checklist.during.filter(i => i.checked).length, total: checklist.during.length },
		post:   { done: checklist.post.filter(i => i.checked).length,   total: checklist.post.length }
	});

	let expandedPhase = $state<'pre' | 'during' | 'post' | null>('pre');

	// ── Leaderboard ───────────────────────────────────────────────────────────

	const leaderboard = $derived(
		[...(data.results ?? [])].sort((a: any, b: any) => a.placement - b.placement)
	);

	const PLACEMENT_COLORS: Record<number, string> = {
		1: 'text-yellow-300 bg-yellow-900/30 border-yellow-700/50',
		2: 'text-slate-300 bg-slate-700/50 border-slate-600',
		3: 'text-orange-300 bg-orange-900/30 border-orange-700/50'
	};

	// ── Bulk result import ────────────────────────────────────────────────────

	let showBulkImport = $state(false);
	let bulkRows = $state<{ proId: string; placement: string; score: string; rounds: string }[]>([
		{ proId: '', placement: '', score: '', rounds: '' }
	]);
	let bulkBusy    = $state(false);
	let bulkResult  = $state<{ created: number; skipped: number; errors: any[] } | null>(null);
	let bulkErr     = $state('');

	function addBulkRow() {
		bulkRows = [...bulkRows, { proId: '', placement: '', score: '', rounds: '' }];
	}

	function removeBulkRow(i: number) {
		bulkRows = bulkRows.filter((_, idx) => idx !== i);
	}

	async function submitBulk(e: SubmitEvent) {
		e.preventDefault();
		const valid = bulkRows.filter(r => r.proId && r.placement);
		if (!valid.length) { bulkErr = 'Add at least one row with a player and placement.'; return; }
		bulkBusy = true; bulkErr = ''; bulkResult = null;
		try {
			const res = await fetch(`/api/tournaments/${t.id}/bulk-results`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ results: valid.map(r => ({
					proId:     r.proId,
					placement: Number(r.placement),
					score:     r.score || null,
					rounds:    r.rounds ? Number(r.rounds) : null
				})) })
			});
			const d = await res.json();
			if (!res.ok) throw new Error(d.message ?? 'Import failed');
			bulkResult = d;
			if (d.created > 0) await invalidateAll();
		} catch (err: any) {
			bulkErr = err.message ?? 'Import failed';
		} finally {
			bulkBusy = false;
		}
	}

	// ── CSV paste import ──────────────────────────────────────────────────────

	let csvText    = $state('');
	let csvParsed  = $state<{ proId: string; placement: string; score: string; rounds: string }[]>([]);
	let csvErr     = $state('');

	// Talent lookup by name (case-insensitive)
	const talentByName = $derived(
		Object.fromEntries((data.talent ?? []).map((t: any) => [t.name.toLowerCase(), t]))
	);

	function parseCSV() {
		csvErr = '';
		csvParsed = [];
		const lines = csvText.trim().split('\n').filter(l => l.trim());
		const rows: typeof csvParsed = [];
		for (const line of lines) {
			const [name, placement, score, rounds] = line.split(',').map(s => s.trim());
			if (!name || !placement) { csvErr = `Bad row: "${line}"`; return; }
			const talent = talentByName[name.toLowerCase()];
			if (!talent) { csvErr = `Player not found: "${name}"`; return; }
			rows.push({ proId: talent.id, placement, score: score ?? '', rounds: rounds ?? '' });
		}
		csvParsed = rows;
		bulkRows = rows;
		showBulkImport = true;
		csvText = '';
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
</script>

<svelte:head><title>{t?.name ?? 'Tournament'} — Ops — FliHub</title></svelte:head>

<div class="space-y-6 max-w-4xl">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<Button href="/dashboard/talent/tournaments/{t.id}" variant="ghost"
				class="gap-2 text-slate-400 hover:text-slate-100 -ml-2 mb-2">
				<ArrowLeft class="size-4" /> Back to Tournament
			</Button>
			<h1 class="text-2xl font-bold tracking-tight">{t.name}</h1>
			<p class="text-muted-foreground text-sm mt-0.5">
				Operations — {fmtDate(t.startDate)}{t.endDate && t.endDate !== t.startDate ? ` – ${fmtDate(t.endDate)}` : ''}
				{#if t.location} · {t.location}{/if}
			</p>
		</div>
		<div class="flex gap-2 shrink-0">
			<Button onclick={() => showBulkImport = !showBulkImport}
				class="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
				<Upload class="size-4" /> Bulk Import Results
			</Button>
		</div>
	</div>

	<!-- Phase progress summary -->
	<div class="grid grid-cols-3 gap-3">
		{#each [
			{ key: 'pre',    label: 'Pre-Event',   color: 'blue' },
			{ key: 'during', label: 'During Event', color: 'yellow' },
			{ key: 'post',   label: 'Post-Event',  color: 'emerald' }
		] as phase}
			{@const p = phaseProgress[phase.key as 'pre' | 'during' | 'post']}
			{@const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0}
			<button
				onclick={() => expandedPhase = expandedPhase === phase.key ? null : phase.key as any}
				class="text-left p-4 rounded-xl border transition-all
				       {expandedPhase === phase.key
				         ? `bg-${phase.color}-950/40 border-${phase.color}-700/60`
				         : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}"
			>
				<p class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{phase.label}</p>
				<p class="text-2xl font-bold text-slate-100 mb-2">{p.done}<span class="text-sm text-slate-500 font-normal">/{p.total}</span></p>
				<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
					<div class="h-full rounded-full transition-all duration-300
					            {pct === 100 ? 'bg-emerald-500' : `bg-${phase.color}-500`}"
					     style="width: {pct}%"></div>
				</div>
			</button>
		{/each}
	</div>

	<!-- Checklist panels -->
	{#each [
		{ key: 'pre',    label: 'Pre-Event Checklist',   colorClass: 'text-blue-400',    borderClass: 'border-blue-800/50' },
		{ key: 'during', label: 'During-Event Checklist', colorClass: 'text-yellow-400',  borderClass: 'border-yellow-800/50' },
		{ key: 'post',   label: 'Post-Event Checklist',  colorClass: 'text-emerald-400', borderClass: 'border-emerald-800/50' }
	] as phase}
		{#if expandedPhase === phase.key}
			<Card class="p-5 bg-slate-800/40 {phase.borderClass} border">
				<h2 class="text-sm font-semibold {phase.colorClass} uppercase tracking-wide mb-4">{phase.label}</h2>
				<div class="space-y-2">
					{#each checklist[phase.key as 'pre' | 'during' | 'post'] as item (item.id)}
						<label class="flex items-center gap-3 cursor-pointer group rounded-lg px-2 py-1.5 hover:bg-slate-700/40 transition-colors">
							<input
								type="checkbox"
								checked={item.checked}
								disabled={checklistBusy[item.id]}
								onchange={(e) => toggleItem(phase.key as any, item.id, (e.target as HTMLInputElement).checked)}
								class="sr-only"
							/>
							{#if checklistBusy[item.id]}
								<div class="size-5 rounded border border-slate-500 animate-pulse bg-slate-600 shrink-0"></div>
							{:else if item.checked}
								<CheckCircle2 class="size-5 text-emerald-400 shrink-0" />
							{:else}
								<Circle class="size-5 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
							{/if}
							<span class="text-sm {item.checked ? 'text-slate-400 line-through' : 'text-slate-200'} transition-colors">
								{item.label}
							</span>
						</label>
					{/each}
				</div>
			</Card>
		{/if}
	{/each}

	<!-- Leaderboard -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<h2 class="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
			<Trophy class="size-4 text-yellow-400" /> Leaderboard
		</h2>

		{#if leaderboard.length === 0}
			<p class="text-sm text-slate-500 text-center py-8">No results entered yet.</p>
		{:else}
			<div class="space-y-1.5">
				{#each leaderboard as result (result.id)}
					{@const proName = result.expand?.pro?.name ?? result.pro}
					{@const gender  = result.expand?.pro?.gender ?? 'male'}
					{@const isTop3  = result.placement <= 3}
					<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg border
					            {PLACEMENT_COLORS[result.placement] ?? 'bg-slate-800/60 border-slate-700 text-slate-300'}">
						<!-- Placement -->
						<div class="w-8 text-center shrink-0">
							{#if result.placement === 1}
								<Medal class="size-5 text-yellow-400 mx-auto" />
							{:else if result.placement === 2}
								<Medal class="size-5 text-slate-400 mx-auto" />
							{:else if result.placement === 3}
								<Medal class="size-5 text-orange-400 mx-auto" />
							{:else}
								<span class="text-sm font-bold">{result.placement}</span>
							{/if}
						</div>

						<!-- Name + gender -->
						<div class="flex-1 min-w-0">
							<p class="text-sm font-semibold truncate">{proName}</p>
							{#if result.notes}
								<p class="text-xs text-slate-500 truncate">{result.notes}</p>
							{/if}
						</div>

						<!-- Score -->
						{#if result.score != null}
							<span class="text-sm font-mono font-bold shrink-0
							            {String(result.score).startsWith('-') ? 'text-emerald-400' : 'text-slate-300'}">
								{result.score}
							</span>
						{/if}

						<!-- Rounds -->
						{#if result.rounds}
							<span class="text-xs text-slate-500 shrink-0">{result.rounds}R</span>
						{/if}

						<!-- Gender badge -->
						<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0
						            {gender === 'female' ? 'bg-pink-900/40 text-pink-300 border-pink-700' : 'bg-blue-900/40 text-blue-300 border-blue-700'}">
							{gender === 'female' ? 'W' : 'M'}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Bulk import panel -->
	{#if showBulkImport}
		<Card class="p-5 bg-slate-800/40 border-blue-800/50 border">
			<h2 class="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
				<Upload class="size-4 text-blue-400" /> Bulk Result Import
			</h2>
			<p class="text-xs text-slate-500 mb-4">
				Add multiple results at once. Rows where the player already has a result are skipped.
			</p>

			<!-- CSV paste shortcut -->
			<div class="mb-4">
				<label class="block text-xs font-medium text-slate-400 mb-1">
					Paste CSV (Name, Placement, Score, Rounds — one per line)
				</label>
				<div class="flex gap-2">
					<textarea
						bind:value={csvText}
						rows="3"
						placeholder="Paul McBeth, 1, -22, 4&#10;Kona Panis, 2, -18, 4"
						class="{INPUT} resize-none flex-1 font-mono text-xs"
					></textarea>
					<Button onclick={parseCSV} variant="outline"
						class="border-slate-600 text-slate-300 self-end">
						Parse
					</Button>
				</div>
				{#if csvErr}
					<p class="text-xs text-red-400 mt-1">{csvErr}</p>
				{/if}
			</div>

			<div class="border-t border-slate-700 pt-4">
				<p class="text-xs font-medium text-slate-400 mb-3">Or enter rows manually:</p>
			</div>

			<form onsubmit={submitBulk} class="space-y-3">
				<!-- Column headers -->
				<div class="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 px-1">
					<span class="text-[10px] text-slate-500 uppercase tracking-wide">Player</span>
					<span class="text-[10px] text-slate-500 uppercase tracking-wide">Place</span>
					<span class="text-[10px] text-slate-500 uppercase tracking-wide">Score</span>
					<span class="text-[10px] text-slate-500 uppercase tracking-wide">Rounds</span>
					<span></span>
				</div>

				{#each bulkRows as row, i}
					<div class="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 items-center">
						<select bind:value={row.proId} class="{INPUT} py-1.5">
							<option value="">— Player —</option>
							{#each data.talent ?? [] as p (p.id)}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
						<input bind:value={row.placement} type="number" min="1" placeholder="#"
							class="{INPUT} py-1.5" />
						<input bind:value={row.score} placeholder="e.g. -15"
							class="{INPUT} py-1.5 font-mono" />
						<input bind:value={row.rounds} type="number" min="1" placeholder="4"
							class="{INPUT} py-1.5" />
						<button type="button" onclick={() => removeBulkRow(i)}
							class="text-slate-600 hover:text-red-400 transition-colors">
							<Trash2 class="size-4" />
						</button>
					</div>
				{/each}

				<button type="button" onclick={addBulkRow}
					class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
					<Plus class="size-3.5" /> Add row
				</button>

				{#if bulkErr}
					<p class="text-sm text-red-400 flex items-center gap-1.5">
						<AlertCircle class="size-4 shrink-0" />{bulkErr}
					</p>
				{/if}

				{#if bulkResult}
					<div class="rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
						✅ {bulkResult.created} imported
						{#if bulkResult.skipped > 0}, {bulkResult.skipped} skipped (already exist){/if}
						{#if bulkResult.errors.length > 0}, {bulkResult.errors.length} errors{/if}
					</div>
				{/if}

				<div class="flex justify-end gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => { showBulkImport = false; bulkResult = null; }}
						class="border-slate-600 text-slate-300">
						Close
					</Button>
					<Button type="submit" disabled={bulkBusy}
						class="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
						<Upload class="size-4" />
						{bulkBusy ? 'Importing…' : 'Import Results'}
					</Button>
				</div>
			</form>
		</Card>
	{/if}

</div>
