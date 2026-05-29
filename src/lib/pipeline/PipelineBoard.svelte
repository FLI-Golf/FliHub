<script lang="ts">
	/**
	 * PipelineBoard — generic horizontal kanban board.
	 *
	 * Usage:
	 *   <PipelineBoard config={myConfig} items={myItems} onmove={handleMove} />
	 *
	 * The parent is responsible for persisting moves (call your API, then
	 * invalidateAll() or update local state).
	 */
	import PipelineStageColumn from './PipelineStageColumn.svelte';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from './types';

	interface Props {
		config: PipelineBoardConfig;
		items: PipelineCardItem[];
		/** Called when a card is moved to a new stage */
		onmove?: (e: PipelineMoveEvent) => void;
		/** Called when a card is clicked (if no href) */
		onselect?: (item: PipelineCardItem) => void;
		/** Show terminal/closed stages below the main board */
		showTerminal?: boolean;
	}

	let {
		config,
		items,
		onmove,
		onselect,
		showTerminal = true
	}: Props = $props();

	const colWidth = config.columnWidth ?? 'w-56';

	// Group items by stage key
	const byStage = $derived(
		[...config.stages, ...(config.terminalStages ?? [])].reduce<Record<string, PipelineCardItem[]>>(
			(acc, s) => {
				acc[s.key] = items.filter(i => i.status === s.key);
				return acc;
			},
			{}
		)
	);

	// All stages for the move dropdown (active only — don't move into terminal from board)
	const allActiveStages = $derived(config.stages);
</script>

<!-- Active pipeline board -->
<div class="flex gap-3 overflow-x-auto pb-3">
	{#each config.stages as stage (stage.key)}
		<PipelineStageColumn
			{stage}
			items={byStage[stage.key] ?? []}
			allStages={allActiveStages}
			columnWidth={colWidth}
			{onmove}
			{onselect}
		/>
	{/each}
</div>

<!-- Terminal / closed stages -->
{#if showTerminal && config.terminalStages && config.terminalStages.length > 0}
	<div class="mt-6">
		<h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Closed</h3>
		<div class="flex gap-3 overflow-x-auto pb-2">
			{#each config.terminalStages as stage (stage.key)}
				<PipelineStageColumn
					{stage}
					items={byStage[stage.key] ?? []}
					allStages={[...allActiveStages, ...config.terminalStages!]}
					columnWidth={colWidth}
					{onmove}
					{onselect}
				/>
			{/each}
		</div>
	</div>
{/if}
