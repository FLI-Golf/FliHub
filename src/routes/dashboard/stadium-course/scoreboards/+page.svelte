<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline';
	import { pipelineMove } from '$lib/pipeline';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, X, AlertCircle, Monitor, DollarSign } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Pipeline config ───────────────────────────────────────────────────────

	const BOARD_CONFIG: PipelineBoardConfig = {
		columnWidth: 'w-48',
		stages: [
			{ key: 'concept',      label: 'Concept',      colorClass: 'bg-slate-700 text-slate-300 border-slate-600' },
			{ key: 'design',       label: 'Design',       colorClass: 'bg-blue-900/50 text-blue-300 border-blue-700' },
			{ key: 'vendor_quote', label: 'Vendor Quote', colorClass: 'bg-cyan-900/50 text-cyan-300 border-cyan-700' },
			{ key: 'approval',     label: 'Approval',     colorClass: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
			{ key: 'procurement',  label: 'Procurement',  colorClass: 'bg-orange-900/50 text-orange-300 border-orange-700' },
			{ key: 'fabrication',  label: 'Fabrication',  colorClass: 'bg-purple-900/50 text-purple-300 border-purple-700' },
			{ key: 'installation', label: 'Installation', colorClass: 'bg-pink-900/50 text-pink-300 border-pink-700' },
			{ key: 'testing',      label: 'Testing',      colorClass: 'bg-indigo-900/50 text-indigo-300 border-indigo-700' },
			{ key: 'live',         label: 'Live',         colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
			{ key: 'maintenance',  label: 'Maintenance',  colorClass: 'bg-teal-900/50 text-teal-300 border-teal-700' }
		],
		terminalStages: [
			{ key: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-900/50 text-red-300 border-red-700', terminal: true }
		]
	};

	const TYPE_COLORS: Record<string, string> = {
		led:     'bg-emerald-900/40 text-emerald-300 border-emerald-700',
		static:  'bg-slate-700 text-slate-300 border-slate-600',
		digital: 'bg-blue-900/40 text-blue-300 border-blue-700',
		hybrid:  'bg-purple-900/40 text-purple-300 border-purple-700'
	};

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);

	// ── Map scoreboards → PipelineCardItem ────────────────────────────────────

	const items = $derived<PipelineCardItem[]>(
		(data.scoreboards ?? []).map((sb: any) => ({
			id:       sb.id,
			status:   sb.stage,
			title:    sb.name,
			subtitle: sb.location || undefined,
			badge:    { label: sb.displayType.toUpperCase(), colorClass: TYPE_COLORS[sb.displayType] ?? TYPE_COLORS.static },
			tags:     sb.vendorName ? [{ label: sb.vendorName, colorClass: 'bg-slate-700 text-slate-400 border-slate-600' }] : [],
			meta:     sb.quotedCost ? fmt$(sb.quotedCost) : undefined,
			href:     `/dashboard/stadium-course/scoreboards/${sb.id}`,
			raw:      sb
		}))
	);

	// ── Move handler ──────────────────────────────────────────────────────────

	let moveError = $state('');

	async function handleMove(e: PipelineMoveEvent) {
		moveError = '';
		const result = await pipelineMove(`/api/scoreboards/${e.item.id}`, e.to);
		if (!result.ok) moveError = result.error?.message ?? 'Move failed';
		else await invalidateAll();
	}

	// ── New scoreboard form ───────────────────────────────────────────────────

	let showNew  = $state(false);
	let newBusy  = $state(false);
	let newErr   = $state('');
	let newForm  = $state({
		name: '', displayType: 'led', location: '',
		widthFt: '', heightFt: '', description: ''
	});

	async function submitNew(e: SubmitEvent) {
		e.preventDefault();
		if (!newForm.name.trim()) { newErr = 'Name is required'; return; }
		newBusy = true; newErr = '';
		try {
			const res = await fetch('/api/scoreboards', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...newForm,
					widthFt:  newForm.widthFt  ? Number(newForm.widthFt)  : null,
					heightFt: newForm.heightFt ? Number(newForm.heightFt) : null
				})
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed'); }
			showNew = false;
			newForm = { name: '', displayType: 'led', location: '', widthFt: '', heightFt: '', description: '' };
			await invalidateAll();
		} catch (err: any) {
			newErr = err.message ?? 'Failed';
		} finally {
			newBusy = false;
		}
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
	const s = $derived(data.stats);
</script>

<svelte:head><title>Scoreboard Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<Button href="/dashboard/stadium-course" variant="ghost"
				class="gap-2 text-slate-400 hover:text-slate-100 -ml-2 mb-2 text-sm">
				← Stadium Course
			</Button>
			<h1 class="text-3xl font-bold tracking-tight">Scoreboard Pipeline</h1>
			<p class="text-muted-foreground mt-1">
				Track every scoreboard from concept through fabrication, installation, and live operation.
			</p>
		</div>
		<Button onclick={() => showNew = true}
			class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
			<Plus class="size-4" /> New Scoreboard
		</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total</p>
			<p class="text-2xl font-bold text-slate-100">{s.total}</p>
		</Card>
		<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Live</p>
			<p class="text-2xl font-bold text-emerald-300">{s.live}</p>
		</Card>
		<Card class="p-4 {s.approval > 0 ? 'bg-yellow-950/40 border-yellow-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {s.approval > 0 ? 'text-yellow-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Awaiting Approval</p>
			<p class="text-2xl font-bold {s.approval > 0 ? 'text-yellow-300' : 'text-slate-400'}">{s.approval}</p>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Budget Committed</p>
			<p class="text-xl font-bold text-slate-100">{fmt$(s.totalBudget)}</p>
		</Card>
	</div>

	{#if s.approval > 0}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-yellow-950/40 border border-yellow-800/50 text-yellow-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />
			{s.approval} scoreboard{s.approval !== 1 ? 's' : ''} waiting for procurement approval
		</div>
	{/if}

	{#if moveError}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />{moveError}
		</div>
	{/if}

	<!-- Pipeline board -->
	<PipelineBoard config={BOARD_CONFIG} {items} onmove={handleMove} />

</div>

<!-- New scoreboard modal -->
{#if showNew}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
		role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="text-base font-semibold text-slate-100 flex items-center gap-2">
					<Monitor class="size-4 text-emerald-400" /> New Scoreboard
				</h2>
				<button onclick={() => showNew = false} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<form onsubmit={submitNew} class="p-5 space-y-4">
				{#if newErr}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{newErr}</p>
				{/if}

				<div>
					<label class={LABEL}>Name *</label>
					<input bind:value={newForm.name} class={INPUT}
						placeholder="e.g. Main Arena Scoreboard" required />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Display Type *</label>
						<select bind:value={newForm.displayType} class={INPUT}>
							<option value="led">LED</option>
							<option value="digital">Digital</option>
							<option value="hybrid">Hybrid</option>
							<option value="static">Static</option>
						</select>
					</div>
					<div>
						<label class={LABEL}>Location</label>
						<input bind:value={newForm.location} class={INPUT}
							placeholder="e.g. Hole 9 grandstand" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class={LABEL}>Width (ft)</label>
						<input bind:value={newForm.widthFt} type="number" min="1" class={INPUT} placeholder="12" />
					</div>
					<div>
						<label class={LABEL}>Height (ft)</label>
						<input bind:value={newForm.heightFt} type="number" min="1" class={INPUT} placeholder="8" />
					</div>
				</div>

				<div>
					<label class={LABEL}>Description</label>
					<textarea bind:value={newForm.description} rows="2"
						class="{INPUT} resize-none"
						placeholder="Specs, requirements, tournament use case…"></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showNew = false}
						class="border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={newBusy}
						class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
						<Plus class="size-4" />{newBusy ? 'Creating…' : 'Create'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
