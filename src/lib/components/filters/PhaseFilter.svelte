<script lang="ts">
	import { Calendar } from 'lucide-svelte';

	interface Props {
		activePhase: string;
		onPhaseChange: (phase: string) => void;
	}

	let { activePhase = 'all', onPhaseChange }: Props = $props();

	const phases = [
		{ 
			value: 'all', 
			label: 'All Phases',
			dateRange: '2026 - 2027'
		},
		{ 
			value: 'phase1', 
			label: 'Phase 1',
			dateRange: 'Jan - Sep 2026'
		},
		{ 
			value: 'phase2', 
			label: 'Phase 2',
			dateRange: 'Oct 2026 - Mar 2027'
		},
		{ 
			value: 'phase3', 
			label: 'Phase 3',
			dateRange: 'Apr - Dec 2027'
		}
	];
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<Calendar class="size-4" />
		<span>Filter by Phase</span>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each phases as phase}
			<button
				onclick={() => onPhaseChange(phase.value)}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 {
					activePhase === phase.value
						? 'bg-primary text-primary-foreground shadow-md'
						: 'bg-muted hover:bg-muted/80 text-foreground'
				}"
			>
				<div class="flex flex-col items-start">
					<span>{phase.label}</span>
					<span class="text-xs opacity-70">{phase.dateRange}</span>
				</div>
			</button>
		{/each}
	</div>
</div>
