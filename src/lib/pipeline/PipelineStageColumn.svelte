<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import type { PipelineStageConfig, PipelineCardItem, PipelineMoveEvent } from './types';

	interface Props {
		stage: PipelineStageConfig;
		items: PipelineCardItem[];
		/** All stage keys in order — used to build the move-to dropdown */
		allStages: PipelineStageConfig[];
		columnWidth?: string;
		/** Emitted when the user picks a new stage for a card */
		onmove?: (e: PipelineMoveEvent) => void;
		/** Emitted when the card itself is clicked (if no href) */
		onselect?: (item: PipelineCardItem) => void;
		/** Highlight this column as a success/completion drop target */
		isSuccess?: boolean;
	}

	let {
		stage,
		items,
		allStages,
		columnWidth = 'w-56',
		onmove,
		onselect,
		isSuccess = false,
	}: Props = $props();

	// ── Dropdown move ─────────────────────────────────────────────────────────

	let openMenuId = $state<string | null>(null);

	function toggleMenu(id: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		openMenuId = openMenuId === id ? null : id;
	}

	function move(item: PipelineCardItem, toKey: string, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		openMenuId = null;
		onmove?.({ item, from: item.status as any, to: toKey as any });
	}

	function handleCardClick(item: PipelineCardItem) {
		if (item.href) return;
		onselect?.(item);
	}

	function handleWindowClick() {
		openMenuId = null;
	}

	// ── Drag-and-drop ─────────────────────────────────────────────────────────

	let dragOverColumn = $state(false);

	function onDragStart(item: PipelineCardItem, e: DragEvent) {
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, fromStage: item.status }));
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverColumn = true;
	}

	function onDragLeave(e: DragEvent) {
		const related = e.relatedTarget as HTMLElement | null;
		const col = e.currentTarget as HTMLElement;
		if (!col.contains(related)) dragOverColumn = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOverColumn = false;
		if (!e.dataTransfer) return;

		let payload: { id: string; fromStage: string };
		try {
			payload = JSON.parse(e.dataTransfer.getData('text/plain'));
		} catch {
			return;
		}

		if (payload.fromStage === stage.key) return;

		// Emit a move event — the parent resolves the full item by id
		const syntheticItem: PipelineCardItem = {
			id: payload.id,
			status: payload.fromStage,
			title: ''
		};
		onmove?.({ item: syntheticItem, from: payload.fromStage as any, to: stage.key as any });
	}
</script>

<svelte:window onclick={handleWindowClick} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex-shrink-0 {columnWidth} rounded-xl transition-all
	       {dragOverColumn ? 'ring-2 ring-emerald-500/50 bg-emerald-950/20' : isSuccess ? 'ring-1 ring-emerald-700/30 bg-emerald-950/10' : ''}"
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	<!-- Column header -->
	<div class="flex items-center justify-between mb-2 px-1">
		<span class="text-xs font-semibold uppercase tracking-wide text-slate-400">{stage.label}</span>
		<span class="text-xs font-bold text-slate-300 bg-slate-700 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
			{items.length}
		</span>
	</div>

	<!-- Cards -->
	<div class="space-y-2 min-h-16">
		{#each items as item (item.id)}
			{@const isLink = !!item.href}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative"
				draggable={!!onmove}
				ondragstart={(e) => onDragStart(item, e)}
			>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<svelte:element
					this={isLink ? 'a' : 'div'}
					href={isLink ? item.href : undefined}
					onclick={isLink ? undefined : () => handleCardClick(item)}
					class="block p-3 rounded-xl border border-slate-700 bg-slate-800/70
					       hover:bg-slate-700/80 hover:border-slate-600 transition-all group
					       {onmove ? 'cursor-grab active:cursor-grabbing select-none' : ''}
					       {!isLink && onselect ? 'cursor-pointer' : ''}"
				>
					<div class="flex items-start justify-between gap-2 mb-1.5">
						<p class="text-sm font-semibold text-slate-100 leading-tight line-clamp-2 flex-1">
							{item.title}
						</p>
						{#if isLink}
							<ChevronRight class="size-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5 transition-colors" />
						{:else if onmove && allStages.length > 1}
							<button
								onclick={(e) => toggleMenu(item.id, e)}
								class="shrink-0 mt-0.5 text-slate-500 hover:text-slate-200 transition-colors"
								title="Move stage"
							>
								<svg class="size-3.5" viewBox="0 0 16 16" fill="currentColor">
									<circle cx="8" cy="3" r="1.5"/>
									<circle cx="8" cy="8" r="1.5"/>
									<circle cx="8" cy="13" r="1.5"/>
								</svg>
							</button>
						{/if}
					</div>

					{#if item.subtitle}
						<p class="text-xs text-slate-400 mb-1.5 line-clamp-1">{item.subtitle}</p>
					{/if}

					{#if item.badge || (item.tags && item.tags.length > 0)}
						<div class="flex flex-wrap gap-1 mb-1.5">
							{#if item.badge}
								<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {item.badge.colorClass}">
									{item.badge.label}
								</span>
							{/if}
							{#each item.tags ?? [] as tag}
								<span class="text-[10px] px-1.5 py-0.5 rounded border font-medium {tag.colorClass}">
									{tag.label}
								</span>
							{/each}
						</div>
					{/if}

					{#if item.meta}
						<p class="text-[10px] text-slate-500 mt-1">{item.meta}</p>
					{/if}
				</svelte:element>

				<!-- Stage move dropdown -->
				{#if openMenuId === item.id}
					<div class="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-36">
						<p class="text-[10px] text-slate-500 uppercase tracking-wide px-3 py-1">Move to</p>
						{#each allStages.filter(s => s.key !== item.status) as s}
							<button
								onclick={(e) => move(item, s.key, e)}
								class="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
							>
								{s.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if items.length === 0}
			<div class="rounded-xl border border-dashed
				{dragOverColumn
					? 'border-emerald-500/60 bg-emerald-950/30'
					: isSuccess
						? 'border-emerald-700/50 bg-emerald-950/20'
						: 'border-slate-700'}
				p-4 text-center transition-colors min-h-20 flex flex-col items-center justify-center gap-1">
				{#if isSuccess}
					<svg class="size-4 {dragOverColumn ? 'text-emerald-400' : 'text-emerald-700'} transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
				{/if}
				<p class="text-xs {dragOverColumn ? 'text-emerald-400' : isSuccess ? 'text-emerald-700' : 'text-slate-600'} transition-colors">Drop here</p>
			</div>
		{/if}
	</div>
</div>
