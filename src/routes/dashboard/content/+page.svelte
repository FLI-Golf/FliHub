<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PipelineBoard } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline';
	import { pipelineMove } from '$lib/pipeline';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import AddTaskModal from '$lib/components/tasks/add-task-modal.svelte';
	import {
		Plus, AlertCircle, X, FileText, Camera, Scissors,
		CheckCircle2, Globe, DollarSign, Ban, Clock,
		Building2, FolderOpen, ListChecks, FlaskConical, Trash2, RotateCcw
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Pipeline config ───────────────────────────────────────────────────────

	const BOARD_CONFIG: PipelineBoardConfig = {
		columnWidth: 'w-52',
		stages: [
			{ key: 'brief',     label: 'Brief',     colorClass: 'bg-slate-700 text-slate-300 border-slate-600' },
			{ key: 'shoot',     label: 'Shoot',     colorClass: 'bg-blue-900/50 text-blue-300 border-blue-700' },
			{ key: 'edit',      label: 'Edit',      colorClass: 'bg-purple-900/50 text-purple-300 border-purple-700' },
			{ key: 'approval',  label: 'Approval',  colorClass: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
			{ key: 'published', label: 'Published', colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
			{ key: 'paid',      label: 'Paid',      colorClass: 'bg-teal-900/50 text-teal-300 border-teal-700' }
		],
		terminalStages: [
			{ key: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-900/50 text-red-300 border-red-700', terminal: true }
		]
	};

	const TYPE_COLORS: Record<string, string> = {
		youtube:      'bg-red-900/40 text-red-300 border-red-700',
		instagram:    'bg-pink-900/40 text-pink-300 border-pink-700',
		tiktok:       'bg-cyan-900/40 text-cyan-300 border-cyan-700',
		podcast:      'bg-orange-900/40 text-orange-300 border-orange-700',
		documentary:  'bg-violet-900/40 text-violet-300 border-violet-700',
		promo:        'bg-yellow-900/40 text-yellow-300 border-yellow-700',
		interview:    'bg-blue-900/40 text-blue-300 border-blue-700',
		highlight:    'bg-emerald-900/40 text-emerald-300 border-emerald-700',
		other:        'bg-slate-700 text-slate-400 border-slate-600'
	};

	const TYPE_LABELS: Record<string, string> = {
		youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok',
		podcast: 'Podcast', documentary: 'Documentary', promo: 'Promo',
		interview: 'Interview', highlight: 'Highlight', other: 'Other'
	};

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
	const SEED_MARKER = '[SEED:CONTENT_PIPELINE]';

	function isSeededContent(item: any): boolean {
		const title = String(item?.title ?? '');
		const notes = String(item?.notes ?? '');
		return title.includes(SEED_MARKER) || notes.includes(SEED_MARKER);
	}

	let seedBusy = $state(false);
	let seedMsg = $state('');
	let seedMsgKind = $state<'success' | 'error' | 'info'>('info');

	const seededCount = $derived((data.items ?? []).filter((item: any) => isSeededContent(item)).length);
	const visibleItems = $derived(data.items ?? []);

	async function runSeed() {
		if (!confirm('Seed test content items? This will add sample data.')) return;
		seedBusy = true;
		seedMsg = '';
		try {
			const res = await fetch('/api/content/seed', { method: 'POST' });
			const body = await res.json().catch(() => ({}));
			seedMsg = body?.message ?? (res.ok ? 'Seeded content test data.' : 'Seed failed');
			seedMsgKind = res.ok ? 'success' : 'error';
			if (res.ok) {
				await invalidateAll();
			}
		} catch {
			seedMsg = 'Seed failed';
			seedMsgKind = 'error';
		} finally {
			seedBusy = false;
		}
	}

	async function clearSeededContent() {
		if (!seededCount) return;
		if (!confirm(`Delete ${seededCount} seeded content item(s) and linked tasks?`)) return;

		seedBusy = true;
		seedMsg = '';
		try {
			const res = await fetch('/api/content/seed', { method: 'DELETE' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? 'Failed to clear seeded content');

			selectedId = null;
			seedMsg = body?.message ?? 'Seeded content cleared';
			seedMsgKind = 'success';
			await invalidateAll();
		} catch (err: any) {
			seedMsg = err?.message ?? 'Failed to clear seeded content';
			seedMsgKind = 'error';
		} finally {
			seedBusy = false;
		}
	}

	async function resetSeededContent() {
		if (!confirm('Clear all seeded content and re-seed? This cannot be undone.')) return;
		seedBusy = true;
		seedMsg = '';
		try {
			const res = await fetch('/api/content/seed', { method: 'PATCH' });
			const body = await res.json().catch(() => ({}));
			seedMsg = body?.message ?? (res.ok ? 'Reset complete.' : 'Reset failed');
			seedMsgKind = res.ok ? 'success' : 'error';
			if (res.ok) {
				selectedId = null;
				await invalidateAll();
			}
		} catch {
			seedMsg = 'Reset failed';
			seedMsgKind = 'error';
		} finally {
			seedBusy = false;
		}
	}

	// ── Map items → PipelineCardItem ──────────────────────────────────────────

	const items = $derived<PipelineCardItem[]>(
		visibleItems.map((item: any) => {
			const tags: { label: string; colorClass: string }[] = [];
			if (item.requiresApproval && item.approvalStatus === 'pending') {
				tags.push({ label: 'Needs Approval', colorClass: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' });
			}
			if (item.approvalStatus === 'approved') {
				tags.push({ label: 'Approved', colorClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-700' });
			}
			if (item.approvalStatus === 'rejected') {
				tags.push({ label: 'Rejected', colorClass: 'bg-red-900/40 text-red-400 border-red-700' });
			}
			const metaParts: string[] = [];
			if (item.expand?.department?.name) metaParts.push(item.expand.department.name);
			if (item.budget) metaParts.push(fmt$(item.budget));
			if (item.dueDate) metaParts.push(fmtDate(item.dueDate));

			return {
				id: item.id,
				status: item.stage,
				title: item.title,
				subtitle: item.description?.slice(0, 60) || undefined,
				badge: {
					label: TYPE_LABELS[item.contentType] ?? item.contentType,
					colorClass: TYPE_COLORS[item.contentType] ?? TYPE_COLORS.other
				},
				tags,
				meta: metaParts.join(' · ') || undefined,
				raw: item
			};
		})
	);

	// ── Move handler ──────────────────────────────────────────────────────────

	let moveError = $state('');

	async function handleMove(e: PipelineMoveEvent) {
		moveError = '';
		// If moving to approval stage and requiresApproval, set approvalStatus = pending
		const extra: Record<string, any> = {};
		if (e.to === 'approval') extra.approvalStatus = 'pending';
		if (e.to === 'paid') extra.paymentStatus = 'paid';

		const result = await pipelineMove(`/api/content/${e.item.id}`, e.to, extra);
		if (!result.ok) {
			moveError = result.error?.message ?? 'Move failed';
		} else {
			await invalidateAll();
		}
	}

	// ── Detail panel ──────────────────────────────────────────────────────────

	let selectedId = $state<string | null>(null);
	let detailBusy = $state(false);
	let detailErr  = $state('');
	let showTaskModal = $state(false);

	const selected = $derived(
		selectedId ? visibleItems.find((i: any) => i.id === selectedId) ?? null : null
	);
	const selectedTasks = $derived(
		selectedId
			? (data.tasks ?? []).filter((task: any) =>
				task.contentProductionId === selectedId || task.expand?.contentProductionId?.id === selectedId
			)
			: []
	);

	function openDetail(item: PipelineCardItem) {
		selectedId = item.id;
		detailErr = '';
	}

	async function approveItem() {
		if (!selectedId) return;
		detailBusy = true; detailErr = '';
		const res = await fetch(`/api/content/${selectedId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ approvalStatus: 'approved', stage: 'published' })
		});
		detailBusy = false;
		if (res.ok) { await invalidateAll(); }
		else { const d = await res.json().catch(() => ({})); detailErr = d.message ?? 'Failed'; }
	}

	async function rejectItem() {
		if (!selectedId) return;
		detailBusy = true; detailErr = '';
		const res = await fetch(`/api/content/${selectedId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ approvalStatus: 'rejected', stage: 'edit' })
		});
		detailBusy = false;
		if (res.ok) { await invalidateAll(); }
		else { const d = await res.json().catch(() => ({})); detailErr = d.message ?? 'Failed'; }
	}

	async function deleteItem() {
		if (!selectedId || !confirm('Delete this content item?')) return;
		detailBusy = true;
		await fetch(`/api/content/${selectedId}`, { method: 'DELETE' });
		detailBusy = false;
		selectedId = null;
		await invalidateAll();
	}

	// ── New item form ─────────────────────────────────────────────────────────

	let showNew  = $state(false);
	let newBusy  = $state(false);
	let newErr   = $state('');
	let newForm  = $state({
		title: '', contentType: 'youtube', description: '',
		department: data.defaultDepartmentId || '', project: '', dueDate: '', budget: '', requiresApproval: false, notes: ''
	});
	const availableProjects = $derived(
		(data.projects ?? []).filter((project: any) =>
			!newForm.department || !project.department || project.department === newForm.department
		)
	);

	$effect(() => {
		if (newForm.project && !availableProjects.some((project: any) => project.id === newForm.project)) {
			newForm.project = '';
		}
	});

	async function submitNew(e: SubmitEvent) {
		e.preventDefault();
		if (!newForm.title.trim()) { newErr = 'Title is required'; return; }
		if (!newForm.department) { newErr = 'Department is required'; return; }
		newBusy = true; newErr = '';
		try {
			const res = await fetch('/api/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...newForm,
					budget: newForm.budget ? Number(newForm.budget) : null
				})
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? 'Failed'); }
			showNew = false;
			newForm = {
				title: '',
				contentType: 'youtube',
				description: '',
				department: data.defaultDepartmentId || '',
				project: '',
				dueDate: '',
				budget: '',
				requiresApproval: false,
				notes: ''
			};
			await invalidateAll();
		} catch (err: any) {
			newErr = err.message ?? 'Failed';
		} finally {
			newBusy = false;
		}
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
	const TASK_STATUS_CLASS: Record<string, string> = {
		todo: 'bg-slate-700 text-slate-200',
		in_progress: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
		blocked: 'bg-red-900/60 text-red-300 border border-red-700/50',
		completed: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
		cancelled: 'bg-slate-800 text-slate-500'
	};
	const TASK_STATUS_LABEL: Record<string, string> = {
		todo: 'To Do',
		in_progress: 'In Progress',
		blocked: 'Blocked',
		completed: 'Completed',
		cancelled: 'Cancelled'
	};

	const s = $derived.by(() => ({
		total:      visibleItems.length,
		brief:      visibleItems.filter((i: any) => i.stage === 'brief').length,
		shoot:      visibleItems.filter((i: any) => i.stage === 'shoot').length,
		edit:       visibleItems.filter((i: any) => i.stage === 'edit').length,
		approval:   visibleItems.filter((i: any) => i.stage === 'approval').length,
		published:  visibleItems.filter((i: any) => i.stage === 'published').length,
		paid:       visibleItems.filter((i: any) => i.stage === 'paid').length,
		cancelled:  visibleItems.filter((i: any) => i.stage === 'cancelled').length,
		pendingApproval: visibleItems.filter((i: any) => i.requiresApproval && i.approvalStatus === 'pending').length
	}));
</script>

<svelte:head><title>Content Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Content Pipeline</h1>
			<p class="text-muted-foreground mt-1">Track every piece of content from brief to payment</p>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<Button onclick={() => showNew = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-4" /> New Content
			</Button>
		</div>
	</div>

	{#if seedMsg}
		<div class="flex items-center gap-2 p-3 rounded-lg border text-sm {seedMsgKind === 'success' ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300' : seedMsgKind === 'error' ? 'bg-red-950/30 border-red-700/50 text-red-300' : 'bg-slate-900 border-slate-700 text-slate-300'}">
			<AlertCircle class="size-4 shrink-0" />
			{seedMsg}
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-3 p-4 bg-slate-900 border border-dashed border-slate-600 rounded-lg">
		<div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
			<FlaskConical class="size-4" />TEST DATA
		</div>
		<button onclick={runSeed} disabled={seedBusy}
			class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-700 disabled:opacity-50">
			<Plus class="size-3" />{seedBusy ? 'Working...' : 'Seed Test Content'}
		</button>
		<button onclick={clearSeededContent} disabled={seedBusy || seededCount === 0}
			class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700 disabled:opacity-50">
			<Trash2 class="size-3" />{seedBusy ? 'Working...' : 'Clear Seed Data'}
		</button>
		<button onclick={resetSeededContent} disabled={seedBusy}
			class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-yellow-900/60 hover:bg-yellow-800 text-yellow-300 border border-yellow-700 disabled:opacity-50">
			<RotateCcw class="size-3" />{seedBusy ? 'Working...' : 'Reset (Clear + Re-seed)'}
		</button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total</p>
			<p class="text-2xl font-bold text-slate-100">{s.total}</p>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Brief</p>
			<p class="text-2xl font-bold text-slate-300">{s.brief}</p>
		</Card>
		<Card class="p-4 bg-blue-950/40 border-blue-800/50">
			<p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Shoot</p>
			<p class="text-2xl font-bold text-blue-300">{s.shoot}</p>
		</Card>
		<Card class="p-4 bg-purple-950/40 border-purple-800/50">
			<p class="text-xs text-purple-400 uppercase tracking-wide mb-1">Edit</p>
			<p class="text-2xl font-bold text-purple-300">{s.edit}</p>
		</Card>
		<Card class="p-4 {s.pendingApproval > 0 ? 'bg-yellow-950/40 border-yellow-800/50' : 'bg-slate-800/40 border-slate-700'}">
			<p class="text-xs {s.pendingApproval > 0 ? 'text-yellow-400' : 'text-slate-400'} uppercase tracking-wide mb-1">Approval</p>
			<p class="text-2xl font-bold {s.pendingApproval > 0 ? 'text-yellow-300' : 'text-slate-300'}">{s.approval}</p>
		</Card>
		<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
			<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Published</p>
			<p class="text-2xl font-bold text-emerald-300">{s.published}</p>
		</Card>
		<Card class="p-4 bg-teal-950/40 border-teal-800/50">
			<p class="text-xs text-teal-400 uppercase tracking-wide mb-1">Paid</p>
			<p class="text-2xl font-bold text-teal-300">{s.paid}</p>
		</Card>
	</div>

	{#if s.pendingApproval > 0}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-yellow-950/40 border border-yellow-800/50 text-yellow-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />
			{s.pendingApproval} item{s.pendingApproval !== 1 ? 's' : ''} waiting for approval
		</div>
	{/if}

	{#if moveError}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />{moveError}
		</div>
	{/if}

	<!-- Board + detail panel -->
	<div class="flex gap-6 items-start">
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
						<div class="flex-1 min-w-0">
							<p class="font-semibold text-slate-100 leading-snug">{selected.title}</p>
							<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium mt-1 inline-block
							            {TYPE_COLORS[selected.contentType] ?? TYPE_COLORS.other}">
								{TYPE_LABELS[selected.contentType] ?? selected.contentType}
							</span>
						</div>
						<button onclick={() => { selectedId = null; }}
							class="text-slate-500 hover:text-slate-200 transition-colors text-lg leading-none shrink-0">×</button>
					</div>

					{#if selected.description}
						<p class="text-xs text-slate-400 leading-relaxed">{selected.description}</p>
					{/if}

					<!-- Meta -->
					<div class="space-y-1.5 text-xs text-slate-400">
						{#if selected.expand?.department}
							<div class="flex items-center gap-1.5">
								<Building2 class="size-3.5 shrink-0" />
								Department: <span class="text-slate-200">{selected.expand.department.name}</span>
							</div>
						{/if}
						{#if selected.expand?.project}
							<div class="flex items-center gap-1.5">
								<FolderOpen class="size-3.5 shrink-0" />
								Project: <span class="text-slate-200">{selected.expand.project.name}</span>
							</div>
						{/if}
						{#if selected.budget}
							<div class="flex items-center gap-1.5">
								<DollarSign class="size-3.5 shrink-0" />
								Budget: <span class="text-slate-200">{fmt$(selected.budget)}</span>
							</div>
						{/if}
						{#if selected.actualCost}
							<div class="flex items-center gap-1.5">
								<DollarSign class="size-3.5 shrink-0" />
								Actual: <span class="text-slate-200">{fmt$(selected.actualCost)}</span>
							</div>
						{/if}
						{#if selected.dueDate}
							<div class="flex items-center gap-1.5">
								<Clock class="size-3.5 shrink-0" />
								Due: <span class="text-slate-200">{fmtDate(selected.dueDate)}</span>
							</div>
						{/if}
						{#if selected.publishedUrl}
							<div class="flex items-center gap-1.5">
								<Globe class="size-3.5 shrink-0" />
								<a href={selected.publishedUrl} target="_blank" rel="noopener"
									class="text-emerald-400 hover:underline truncate">{selected.publishedUrl}</a>
							</div>
						{/if}
					</div>

					<!-- Approval status -->
					{#if selected.requiresApproval}
						<div class="rounded-lg border p-3 space-y-2
						            {selected.approvalStatus === 'approved' ? 'bg-emerald-950/30 border-emerald-700/50'
						              : selected.approvalStatus === 'rejected' ? 'bg-red-950/30 border-red-700/50'
						              : 'bg-yellow-950/30 border-yellow-700/50'}">
							<p class="text-xs font-semibold
							          {selected.approvalStatus === 'approved' ? 'text-emerald-400'
							            : selected.approvalStatus === 'rejected' ? 'text-red-400'
							            : 'text-yellow-400'}">
								{selected.approvalStatus === 'approved' ? '✅ Approved'
								  : selected.approvalStatus === 'rejected' ? '❌ Rejected'
								  : '⏳ Awaiting Approval'}
							</p>
							{#if selected.stage === 'approval' && selected.approvalStatus === 'pending'}
								<div class="flex gap-2">
									<button onclick={approveItem} disabled={detailBusy}
										class="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50 transition-colors">
										Approve
									</button>
									<button onclick={rejectItem} disabled={detailBusy}
										class="flex-1 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium disabled:opacity-50 transition-colors">
										Reject
									</button>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Linked tasks -->
					<div class="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-3">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
								<ListChecks class="size-3.5" />
								Tasks
							</div>
							<button
								type="button"
								onclick={() => showTaskModal = true}
								class="text-[10px] px-2 py-1 rounded border border-emerald-700/60 text-emerald-300 hover:bg-emerald-950/40 transition-colors">
								Add Task
							</button>
						</div>
						{#if selectedTasks.length}
							<div class="space-y-2">
								{#each selectedTasks as task}
									<div class="rounded-md border border-slate-700/70 bg-slate-950/40 p-2">
										<div class="flex items-start justify-between gap-2">
											<p class="text-xs font-medium text-slate-200 leading-snug">{task.title}</p>
											<span class="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap {TASK_STATUS_CLASS[task.status] ?? TASK_STATUS_CLASS.todo}">
												{TASK_STATUS_LABEL[task.status] ?? task.status}
											</span>
										</div>
										{#if task.dueDate}
											<p class="text-[10px] text-slate-500 mt-1">Due {fmtDate(task.dueDate)}</p>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-xs text-slate-500">No tasks linked yet.</p>
						{/if}
					</div>

					{#if detailErr}
						<p class="text-xs text-red-400">{detailErr}</p>
					{/if}

					<!-- Quick stage moves -->
					<div>
						<p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Move to Stage</p>
						<div class="flex flex-wrap gap-1.5">
							{#each BOARD_CONFIG.stages as stage}
								{#if stage.key !== selected.stage}
									<button
										onclick={() => handleMove({ item: { id: selected.id, status: selected.stage, title: selected.title }, from: selected.stage as any, to: stage.key as any })}
										class="text-[10px] px-2 py-1 rounded border font-medium transition-colors hover:opacity-80 {stage.colorClass}">
										→ {stage.label}
									</button>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Delete -->
					<button onclick={deleteItem} disabled={detailBusy}
						class="w-full py-1.5 rounded-lg border border-red-800/50 text-red-400 text-xs hover:bg-red-900/20 transition-colors disabled:opacity-50">
						Delete
					</button>
				</Card>
			</div>
		{/if}
	</div>

</div>

<!-- New content modal -->
{#if showNew}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
		role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="text-base font-semibold text-slate-100">New Content Item</h2>
				<button onclick={() => showNew = false} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<form onsubmit={submitNew} class="p-5 space-y-4">
				{#if newErr}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{newErr}</p>
				{/if}

				<div>
					<label for="content-title" class={LABEL}>Title *</label>
					<input id="content-title" bind:value={newForm.title} class={INPUT} placeholder="Episode 12 — Paul McBeth Interview" required />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="content-type" class={LABEL}>Content Type *</label>
						<select id="content-type" bind:value={newForm.contentType} class={INPUT}>
							{#each Object.entries(TYPE_LABELS) as [val, label]}
								<option value={val}>{label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="content-due-date" class={LABEL}>Due Date</label>
						<input id="content-due-date" bind:value={newForm.dueDate} type="date" class={INPUT} />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="content-department" class={LABEL}>Department *</label>
						<select id="content-department" bind:value={newForm.department} class={INPUT} required>
							<option value="">Select department</option>
							{#each data.departments ?? [] as department}
								<option value={department.id}>{department.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="content-project" class={LABEL}>Related Project</label>
						<select id="content-project" bind:value={newForm.project} class={INPUT}>
							<option value="">None</option>
							{#each availableProjects as project}
								<option value={project.id}>{project.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label for="content-description" class={LABEL}>Description</label>
					<textarea id="content-description" bind:value={newForm.description} rows="2"
						class="{INPUT} resize-none" placeholder="Brief overview of the content…"></textarea>
				</div>

				<div>
					<label for="content-budget" class={LABEL}>Budget ($)</label>
					<input id="content-budget" bind:value={newForm.budget} type="number" min="0" class={INPUT} placeholder="500" />
				</div>

				<div>
					<label for="content-notes" class={LABEL}>Notes</label>
					<textarea id="content-notes" bind:value={newForm.notes} rows="2"
						class="{INPUT} resize-none" placeholder="Internal notes…"></textarea>
				</div>

				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={newForm.requiresApproval}
						class="rounded border-slate-600 bg-slate-800 text-emerald-500" />
					<span class="text-sm text-slate-300">Requires approval before publishing</span>
				</label>

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

{#if selected}
	<AddTaskModal
		bind:open={showTaskModal}
		contentProductionId={selected.id}
		contextLabel={selected.title}
	/>
{/if}
