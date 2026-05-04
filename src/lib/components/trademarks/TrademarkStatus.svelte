<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { ShieldCheck, Clock, FileText, AlertTriangle, ExternalLink } from 'lucide-svelte';
	import {
		TRADEMARK_CLASS_LABELS,
		TRADEMARK_STATUS_LABELS,
		TRADEMARK_STATUS_COLORS,
		MARK_TYPE_LABELS,
		LOGO_VARIANT_LABELS,
		TRADEMARK_PIPELINE
	} from '$lib/domain/schemas/trademark.schema';

	interface Props {
		/** All trademark_filings records for this entity */
		filings: any[];
		/** 'franchise' | 'league' — controls heading copy */
		entityType?: 'franchise' | 'league';
		/** Show only approved marks, or all pipeline stages */
		approvedOnly?: boolean;
	}

	let { filings = [], entityType = 'franchise', approvedOnly = false }: Props = $props();

	// Group filings by trademarkClass, optionally filtered to approved only
	const visible = $derived(
		approvedOnly ? filings.filter(f => f.status === 'approved') : filings
	);

	// Classes that have at least one filing
	const byClass = $derived(() => {
		const map = new Map<string, any[]>();
		for (const f of visible) {
			const cls = f.trademarkClass ?? 'other';
			if (!map.has(cls)) map.set(cls, []);
			map.get(cls)!.push(f);
		}
		// Sort by class label
		return [...map.entries()].sort((a, b) =>
			(TRADEMARK_CLASS_LABELS[a[0]] ?? a[0]).localeCompare(TRADEMARK_CLASS_LABELS[b[0]] ?? b[0])
		);
	});

	const approvedCount = $derived(filings.filter(f => f.status === 'approved').length);
	const pendingCount  = $derived(filings.filter(f => f.status !== 'approved' && f.status !== 'rejected' && f.status !== 'abandoned').length);

	function statusIcon(status: string) {
		if (status === 'approved')        return 'check';
		if (status === 'rejected' || status === 'abandoned') return 'x';
		if (status === 'opposition')      return 'warn';
		return 'clock';
	}

	function pipelineStep(status: string): number {
		const idx = TRADEMARK_PIPELINE.indexOf(status as any);
		return idx >= 0 ? idx : -1;
	}
</script>

{#if filings.length === 0}
	<!-- Nothing to show — silent when no filings exist yet -->
{:else}
<Card class="p-5 bg-slate-800/50 border-slate-700 space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<ShieldCheck class="size-4 text-emerald-400" />
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">
				Trademark Protection
			</h2>
		</div>
		<div class="flex items-center gap-3 text-xs">
			{#if approvedCount > 0}
				<span class="flex items-center gap-1 text-emerald-400 font-medium">
					<ShieldCheck class="size-3.5" />{approvedCount} registered
				</span>
			{/if}
			{#if pendingCount > 0}
				<span class="flex items-center gap-1 text-amber-400">
					<Clock class="size-3.5" />{pendingCount} pending
				</span>
			{/if}
			<a href="/dashboard/trademarks" class="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
				<ExternalLink class="size-3" /> View all
			</a>
		</div>
	</div>

	<!-- Per-class groups -->
	<div class="space-y-3">
		{#each byClass() as [cls, clsFilings]}
			<div class="rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden">
				<!-- Class header -->
				<div class="flex items-center justify-between px-3 py-2 border-b border-slate-700/60 bg-slate-800/40">
					<span class="text-xs font-semibold text-slate-300">
						{TRADEMARK_CLASS_LABELS[cls] ?? cls}
					</span>
					<span class="text-[10px] text-slate-500">
						{clsFilings.filter((f: any) => f.status === 'approved').length}/{clsFilings.length} approved
					</span>
				</div>

				<!-- Filings in this class -->
				<div class="divide-y divide-slate-700/40">
					{#each clsFilings as filing}
						{@const step = pipelineStep(filing.status)}
						{@const totalSteps = TRADEMARK_PIPELINE.length - 1}
						{@const pct = step >= 0 ? Math.round((step / totalSteps) * 100) : 0}
						{@const icon = statusIcon(filing.status)}

						<div class="px-3 py-2.5 flex items-center gap-3">
							<!-- Status icon -->
							<div class="shrink-0">
								{#if icon === 'check'}
									<ShieldCheck class="size-4 text-emerald-400" />
								{:else if icon === 'x'}
									<AlertTriangle class="size-4 text-red-400" />
								{:else if icon === 'warn'}
									<AlertTriangle class="size-4 text-orange-400" />
								{:else}
									<Clock class="size-4 text-amber-400" />
								{/if}
							</div>

							<!-- Mark info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-xs font-medium text-slate-200">
										{MARK_TYPE_LABELS[filing.markType] ?? filing.markType}
									</span>
									{#if filing.logoVariant && filing.logoVariant !== 'none'}
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
											{LOGO_VARIANT_LABELS[filing.logoVariant] ?? filing.logoVariant}
										</span>
									{/if}
									<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {TRADEMARK_STATUS_COLORS[filing.status] ?? ''}">
										{TRADEMARK_STATUS_LABELS[filing.status] ?? filing.status}
									</span>
								</div>

								<!-- Pipeline progress bar (only for active pipeline stages) -->
								{#if filing.status !== 'rejected' && filing.status !== 'abandoned' && filing.status !== 'approved'}
									<div class="mt-1.5 flex items-center gap-2">
										<div class="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
											<div class="h-full rounded-full bg-amber-500/70 transition-all" style="width: {pct}%"></div>
										</div>
										<span class="text-[10px] text-slate-500 shrink-0">{pct}%</span>
									</div>
								{/if}

								<!-- USPTO number if available -->
								{#if filing.usptoAppNumber || filing.usptoSerialNumber}
									<p class="text-[10px] text-slate-500 mt-0.5 font-mono">
										{filing.usptoAppNumber || filing.usptoSerialNumber}
									</p>
								{/if}
							</div>

							<!-- Approved date -->
							{#if filing.status === 'approved' && filing.approvedDate}
								<div class="shrink-0 text-right">
									<p class="text-[10px] text-slate-500">Registered</p>
									<p class="text-[10px] text-emerald-400 font-medium">
										{new Date(filing.approvedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
									</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Empty approved-only state -->
	{#if approvedOnly && approvedCount === 0 && filings.length > 0}
		<div class="flex items-center gap-2 text-xs text-slate-500 py-1">
			<FileText class="size-3.5" />
			{filings.length} filing{filings.length !== 1 ? 's' : ''} in progress — none registered yet
		</div>
	{/if}
</Card>
{/if}
