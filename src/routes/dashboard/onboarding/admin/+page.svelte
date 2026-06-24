<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline';
	import { pipelineMove } from '$lib/pipeline';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Users, CheckCircle2, Clock, XCircle, FileText,
		UserCheck, AlertCircle, ChevronDown, ChevronUp, StickyNote
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Pipeline config ───────────────────────────────────────────────────────

	const BOARD_CONFIG: PipelineBoardConfig = {
		columnWidth: 'w-52',
		stages: [
			{
				key: 'invited',
				label: 'Invited',
				colorClass: 'bg-slate-700 text-slate-300 border-slate-600'
			},
			{
				key: 'documents_sent',
				label: 'Docs Sent',
				colorClass: 'bg-blue-900/50 text-blue-300 border-blue-700'
			},
			{
				key: 'documents_signed',
				label: 'Docs Signed',
				colorClass: 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
			},
			{
				key: 'profile_complete',
				label: 'Profile Done',
				colorClass: 'bg-purple-900/50 text-purple-300 border-purple-700'
			},
			{
				key: 'approved',
				label: 'Approved',
				colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
			}
		],
		terminalStages: [
			{
				key: 'rejected',
				label: 'Rejected',
				colorClass: 'bg-red-900/50 text-red-300 border-red-700',
				terminal: true
			}
		]
	};

	const ROLE_COLORS: Record<string, string> = {
		pro:         'bg-violet-900/50 text-violet-300 border-violet-700',
		broadcaster: 'bg-blue-900/50 text-blue-300 border-blue-700',
		commentator: 'bg-cyan-900/50 text-cyan-300 border-cyan-700',
		analyst:     'bg-orange-900/50 text-orange-300 border-orange-700',
		manager:     'bg-pink-900/50 text-pink-300 border-pink-700'
	};

	const ROLE_LABELS: Record<string, string> = {
		pro:         'Pro',
		broadcaster: 'Broadcaster',
		commentator: 'Commentator',
		analyst:     'Analyst',
		manager:     'Manager'
	};

	function normalizeRole(role: string): string {
		return role === 'player' ? 'pro' : role;
	}

	function normalizePlayerTerminology(text: string): string {
		return text
			.replace(/\bPlayers\b/g, 'Pros')
			.replace(/\bplayers\b/g, 'pros')
			.replace(/\bPlayer\b/g, 'Pro')
			.replace(/\bplayer\b/g, 'pro');
	}

	function formatRoleLabel(role: string): string {
		const normalizedRole = normalizeRole(role);
		const mapped = ROLE_LABELS[normalizedRole]
			?? normalizedRole.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
		return normalizePlayerTerminology(mapped);
	}

	// ── Map candidates → PipelineCardItem ─────────────────────────────────────

	const visibleCandidates = $derived.by(() => {
		return data.candidates;
	});

	const items = $derived<PipelineCardItem[]>(
		visibleCandidates.map((c: any) => {
			const normalizedRole = normalizeRole(c.role);
			const checks = [
				c.welcomeSeen,
				c.documentsInitialed,
				c.contractSigned,
				c.profileCompleted
			].filter(Boolean).length;

			return {
				id: c.id,
				status: c.pipelineStage,
				title: c.name,
				subtitle: c.email || undefined,
				badge: {
					label: formatRoleLabel(normalizedRole),
					colorClass: ROLE_COLORS[normalizedRole] ?? 'bg-slate-700 text-slate-300 border-slate-600'
				},
				tags: c.signatureCount > 0
					? [{ label: `${c.signatureCount} sig${c.signatureCount !== 1 ? 's' : ''}`, colorClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-700' }]
					: [],
				meta: checks > 0 ? `${checks}/4 steps done` : undefined,
				raw: c
			};
		})
	);

	const filteredStats = $derived.by(() => ({
		total: visibleCandidates.length,
		invited: visibleCandidates.filter((c: any) => c.pipelineStage === 'invited').length,
		documentsSent: visibleCandidates.filter((c: any) => c.pipelineStage === 'documents_sent').length,
		documentsSigned: visibleCandidates.filter((c: any) => c.pipelineStage === 'documents_signed').length,
		profileComplete: visibleCandidates.filter((c: any) => c.pipelineStage === 'profile_complete').length,
		approved: visibleCandidates.filter((c: any) => c.pipelineStage === 'approved').length,
		rejected: visibleCandidates.filter((c: any) => c.pipelineStage === 'rejected').length
	}));

	// ── Move handler ──────────────────────────────────────────────────────────

	let moveError = $state('');
	let moving = $state(false);

	async function handleMove(e: PipelineMoveEvent) {
		moving = true;
		moveError = '';
		const result = await pipelineMove(`/api/onboarding/${e.item.id}`, e.to);
		moving = false;
		if (!result.ok) {
			moveError = result.error?.message ?? 'Move failed';
		} else {
			await invalidateAll();
		}
	}

	// ── Detail panel ──────────────────────────────────────────────────────────

	let selectedId = $state<string | null>(null);
	let notesValue = $state('');
	let savingNotes = $state(false);
	let notesMsg = $state('');

	const selected = $derived(
		selectedId ? data.candidates.find((c: any) => c.id === selectedId) ?? null : null
	);

	function openDetail(item: PipelineCardItem) {
		selectedId = item.id;
		notesValue = item.raw?.adminNotes ?? '';
		notesMsg = '';
	}

	async function saveNotes() {
		if (!selectedId) return;
		savingNotes = true; notesMsg = '';
		const res = await fetch(`/api/onboarding/${selectedId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stage: selected?.pipelineStage, notes: notesValue })
		});
		savingNotes = false;
		if (res.ok) {
			notesMsg = 'Saved';
			await invalidateAll();
		} else {
			notesMsg = 'Failed to save';
		}
	}

	const s = $derived(data.stats);
</script>

<svelte:head><title>Onboarding Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Onboarding Pipeline</h1>
			<p class="text-muted-foreground mt-1">Track every talent member from invite to approval</p>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total</p>
			<p class="text-2xl font-bold text-slate-100">{filteredStats.total}</p>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Invited</p>
			<p class="text-2xl font-bold text-slate-300">{filteredStats.invited}</p>
		</Card>
		<Card class="p-4 bg-blue-950/40 border-blue-800/50">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Docs Sent</p>
			<p class="text-2xl font-bold text-blue-300">{filteredStats.documentsSent}</p>
		</Card>
		<Card class="p-4 bg-yellow-950/40 border-yellow-800/50">
			<p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">Docs Signed</p>
			<p class="text-2xl font-bold text-yellow-300">{filteredStats.documentsSigned}</p>
		</Card>
		<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Approved</p>
			<p class="text-2xl font-bold text-emerald-300">{filteredStats.approved}</p>
		</Card>
		<Card class="p-4 {filteredStats.rejected > 0 ? 'bg-red-950/40 border-red-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {filteredStats.rejected > 0 ? 'text-red-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Rejected</p>
			<p class="text-2xl font-bold {filteredStats.rejected > 0 ? 'text-red-300' : 'text-slate-400'}">{filteredStats.rejected}</p>
		</Card>
	</div>

	{#if moveError}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />
			{moveError}
		</div>
	{/if}

	<!-- Board + detail panel side-by-side -->
	<div class="flex gap-6 items-start">
		<!-- Board -->
		<div class="flex-1 min-w-0">
			<PipelineBoard
				config={BOARD_CONFIG}
				{items}
				onmove={handleMove}
				onselect={openDetail}
			/>
		</div>

		<!-- Detail panel -->
		{#if selected}
			<div class="w-72 shrink-0">
				<Card class="p-5 bg-slate-800/60 border-slate-700 space-y-4">
					<div class="flex items-start justify-between gap-2">
						<div>
							<p class="font-semibold text-slate-100">{selected.name}</p>
							<p class="text-xs text-slate-400 mt-0.5">{selected.email || '—'}</p>
						</div>
						<button
							onclick={() => { selectedId = null; }}
							class="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none"
						>×</button>
					</div>

					<!-- Checklist -->
					<div class="space-y-1.5">
						<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Progress</p>
						{#each [
							{ label: 'Welcome seen',       done: selected.welcomeSeen },
							{ label: 'Docs initialled',    done: selected.documentsInitialed },
							{ label: 'Contract signed',    done: selected.contractSigned },
							{ label: 'Profile completed',  done: selected.profileCompleted }
						] as step}
							<div class="flex items-center gap-2 text-sm">
								{#if step.done}
									<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
									<span class="text-slate-300">{step.label}</span>
								{:else}
									<Clock class="size-4 text-slate-600 shrink-0" />
									<span class="text-slate-500">{step.label}</span>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Signatures -->
					<div class="text-xs text-slate-400">
						<FileText class="size-3.5 inline mr-1" />
						{selected.signatureCount} document{selected.signatureCount !== 1 ? 's' : ''} signed
					</div>

					<!-- Admin notes -->
					<div>
						<label class="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
							<StickyNote class="size-3.5 inline mr-1" />Admin Notes
						</label>
						<textarea
							bind:value={notesValue}
							rows="3"
							class="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 text-sm
							       focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 resize-none"
							placeholder="Internal notes…"
						></textarea>
						<div class="flex items-center justify-between mt-1.5">
							{#if notesMsg}
								<span class="text-xs {notesMsg === 'Saved' ? 'text-emerald-400' : 'text-red-400'}">{notesMsg}</span>
							{:else}
								<span></span>
							{/if}
							<Button
								onclick={saveNotes}
								disabled={savingNotes}
								class="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
							>
								{savingNotes ? 'Saving…' : 'Save'}
							</Button>
						</div>
					</div>

					<!-- Quick stage buttons -->
					<div>
						<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Quick Move</p>
						<div class="flex flex-wrap gap-1.5">
							{#each BOARD_CONFIG.stages as stage}
								{#if stage.key !== selected.pipelineStage}
									<button
										onclick={() => handleMove({ item: { id: selected.id, status: selected.pipelineStage, title: selected.name }, from: selected.pipelineStage as any, to: stage.key as any })}
										class="text-[10px] px-2 py-1 rounded border font-medium transition-colors
										       {stage.colorClass} hover:opacity-80"
									>
										→ {stage.label}
									</button>
								{/if}
							{/each}
							{#each BOARD_CONFIG.terminalStages ?? [] as stage}
								{#if stage.key !== selected.pipelineStage}
									<button
										onclick={() => handleMove({ item: { id: selected.id, status: selected.pipelineStage, title: selected.name }, from: selected.pipelineStage as any, to: stage.key as any })}
										class="text-[10px] px-2 py-1 rounded border font-medium transition-colors
										       {stage.colorClass} hover:opacity-80"
									>
										→ {stage.label}
									</button>
								{/if}
							{/each}
						</div>
					</div>

					{#if selected.completedAt}
						<p class="text-xs text-emerald-400">
							<CheckCircle2 class="size-3.5 inline mr-1" />
							Approved {new Date(selected.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
						</p>
					{/if}
				</Card>
			</div>
		{/if}
	</div>
</div>
