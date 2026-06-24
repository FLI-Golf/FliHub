<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import Card from '$lib/components/ui/card.svelte';
	import {
		Images,
		FileDown,
		ArrowRight,
		AlertCircle,
		Calendar,
		Building2,
		FolderOpen,
		Globe,
		ListChecks,
		DollarSign,
		CheckCircle2,
		Package,
		RefreshCw
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const cards = $derived(data.cards ?? []);
	const totals = $derived(data.totals ?? {
		totalItems: 0,
		brief: 0,
		shoot: 0,
		edit: 0,
		approval: 0,
		published: 0,
		paid: 0,
		totalBudget: 0,
		totalActual: 0,
		pendingApprovals: 0
	});

	let generatingReport = $state(false);
	let actionMessage = $state('');
	let actionTone = $state<'success' | 'error'>('success');

	const inProgressCount = $derived(totals.shoot + totals.edit + totals.approval);

	function fmt(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount || 0);
	}

	function fmtDate(value: string | null | undefined) {
		if (!value) return 'No date';
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return 'No date';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function typeLabel(value: string) {
		if (!value) return 'Other';
		return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
	}

	function stageLabel(stage: string) {
		if (stage === 'brief') return 'Brief';
		if (stage === 'shoot') return 'Shoot';
		if (stage === 'edit') return 'Edit';
		if (stage === 'approval') return 'Approval';
		if (stage === 'published') return 'Published';
		if (stage === 'paid') return 'Paid';
		if (stage === 'cancelled') return 'Cancelled';
		return stage || 'Unknown';
	}

	function stageClass(stage: string) {
		if (stage === 'paid') return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
		if (stage === 'published') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
		if (stage === 'approval') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
		if (stage === 'edit') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
		if (stage === 'shoot') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
		if (stage === 'brief') return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
		if (stage === 'cancelled') return 'bg-red-500/15 text-red-300 border-red-500/30';
		return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
	}

	function statusPill(stage: string) {
		if (stage === 'paid') return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
		if (stage === 'published') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
		if (stage === 'approval') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
		if (stage === 'edit') return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
		if (stage === 'shoot') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
		if (stage === 'brief') return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
		if (stage === 'cancelled') return 'bg-red-500/15 text-red-300 border-red-500/30';
		return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
	}

	function progressBarColor(progress: number) {
		if (progress >= 100) return 'bg-emerald-500';
		if (progress >= 70) return 'bg-blue-500';
		if (progress >= 40) return 'bg-amber-500';
		return 'bg-slate-500';
	}

	async function downloadReport() {
		actionMessage = '';
		generatingReport = true;

		try {
			const res = await fetch('/api/content/report', { method: 'GET' });
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(text || `Failed (${res.status})`);
			}

			const blob = await res.blob();
			const fileName = `content-daily-report-${new Date().toISOString().slice(0, 10)}.pdf`;
			const objectUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

			actionTone = 'success';
			actionMessage = 'Content PDF report downloaded.';
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to generate PDF report.';
		} finally {
			generatingReport = false;
		}
	}
</script>

<svelte:head><title>Manage Media Content — FliHub</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-white">Manage Media Content</h1>
			<p class="text-gray-400 text-sm mt-1">Card-based review of all media content items with report export.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button href="/dashboard/content" variant="outline" class="gap-2 border-slate-600 text-slate-200">
				<Images class="w-4 h-4" /> Open Pipeline
			</Button>
			<Button onclick={downloadReport} disabled={generatingReport} class="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
				<FileDown class="w-4 h-4" /> {generatingReport ? 'Generating...' : 'Print Report'}
			</Button>
		</div>
	</div>

	{#if actionMessage}
		<div class={`flex items-center gap-2 p-3 rounded-lg border text-sm ${actionTone === 'success'
			? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300'
			: 'bg-red-950/30 border-red-700/50 text-red-300'}`}>
			<AlertCircle class="w-4 h-4 shrink-0" />
			{actionMessage}
		</div>
	{/if}

	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
		<Card class="p-4 border-l-4 border-l-orange-500 bg-orange-950/30 col-span-2 sm:col-span-1">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-orange-300/80 font-medium">Total Content</p>
				<div class="size-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
					<Images class="size-3.5 text-orange-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.totalItems}</p>
			<p class="text-[11px] text-orange-300/70 mt-0.5">{totals.published} published</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/30 col-span-2 sm:col-span-1">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-blue-300/80 font-medium">In Progress</p>
				<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<RefreshCw class="size-3.5 text-blue-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{inProgressCount}</p>
			<p class="text-[11px] text-blue-300/70 mt-0.5">{totals.paid} paid</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/30 col-span-2 sm:col-span-1">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-amber-300/80 font-medium">Pending Approval</p>
				<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
					<AlertCircle class="size-3.5 text-amber-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.pendingApprovals}</p>
			<p class="text-[11px] text-amber-300/70 mt-0.5">{totals.approval} in approval stage</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30 col-span-2 sm:col-span-1">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-emerald-300/80 font-medium">Budget / Actual</p>
				<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
					<DollarSign class="size-3.5 text-emerald-300" />
				</div>
			</div>
			<p class="text-lg font-black text-white">{fmt(totals.totalActual)}</p>
			<p class="text-[11px] text-emerald-300/70 mt-0.5">Budget {fmt(totals.totalBudget)}</p>
		</Card>
	</div>

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		{#if cards.length === 0}
			<Card class="col-span-full p-12 text-center border-dashed border-slate-700 bg-slate-900/50">
				<Images class="size-10 mx-auto text-slate-500 mb-3" />
				<p class="text-slate-300 font-medium">No content items yet.</p>
				<p class="text-xs text-slate-500 mt-1">Create items from the Content Pipeline page.</p>
			</Card>
		{:else}
			{#each cards as card}
				<Card class="p-5 border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.85))] hover:border-slate-500 hover:bg-slate-900 transition-colors">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2 mb-2 flex-wrap">
								<span class={`text-[11px] px-2 py-0.5 rounded border ${statusPill(card.stage)}`}>{stageLabel(card.stage)}</span>
								<span class="text-[11px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">{typeLabel(card.contentType)}</span>
							</div>
							<p class="text-lg font-bold text-slate-100 leading-tight truncate">{card.title}</p>
							<p class="text-xs text-slate-400 mt-1 line-clamp-2">{card.notes || 'No notes provided.'}</p>
						</div>
						<div class="flex flex-col gap-2 shrink-0 min-w-[140px]">
							<Button href="/dashboard/content" variant="outline" size="sm" class="gap-1.5">
								View <ArrowRight class="size-3.5" />
							</Button>
							{#if card.publishedUrl}
								<a href={card.publishedUrl} target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-700/60 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/30 transition-colors">
									<Globe class="size-3.5" /> Published
								</a>
							{/if}
						</div>
					</div>

					<div class="mt-4 space-y-2">
						<div class="flex items-center justify-between text-xs">
							<span>Progress</span>
							<span>{card.progressPct}%</span>
						</div>
						<div class="h-2 rounded-full bg-slate-800 overflow-hidden">
							<div class="h-full {progressBarColor(card.progressPct)}" style={`width: ${card.progressPct}%`}></div>
						</div>
						<div class="text-[11px] text-slate-500">
							{card.counts.taskDone} / {card.counts.tasks} tasks complete
						</div>
					</div>

					<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Tasks</p>
							<p class="text-slate-100 font-semibold">{card.counts.taskOpen} open</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Approval</p>
							<p class="text-amber-300 font-semibold">{card.requiresApproval && card.approvalStatus === 'pending' ? 'Pending' : 'Clear'}</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Budget</p>
							<p class="text-blue-300 font-semibold">{fmt(card.spend.budget)}</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Actual</p>
							<p class="text-emerald-300 font-semibold">{fmt(card.spend.actual)}</p>
						</div>
					</div>

					<div class="mt-4 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
						<span class="inline-flex items-center gap-1.5"><Calendar class="size-3.5" /> {fmtDate(card.nextDueTask?.dueDate ?? card.dueDate)}</span>
						<span class="inline-flex items-center gap-1.5"><Building2 class="size-3.5" /> {card.departmentName}</span>
						{#if card.projectName}
							<span class="inline-flex items-center gap-1.5"><FolderOpen class="size-3.5" /> {card.projectName}</span>
						{/if}
						<span class="inline-flex items-center gap-1.5"><ListChecks class="size-3.5" /> Open tasks: {card.counts.taskOpen}</span>
						{#if card.requiresApproval && card.approvalStatus === 'pending'}
							<span class="inline-flex items-center gap-1.5 text-amber-300"><AlertCircle class="size-3.5" /> Awaiting approval</span>
						{/if}
					</div>

					<div class="mt-3 flex justify-end">
						<Button href="/dashboard/content" variant="ghost" class="text-xs text-slate-300 hover:text-white px-2">
							Open Pipeline <ArrowRight class="size-3 ml-1" />
						</Button>
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</div>
