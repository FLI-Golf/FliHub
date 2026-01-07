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
	<div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
		<Calendar class="size-4" />
		<span>Filter by Phase</span>
	</div>
	<div class="flex flex-wrap gap-1 border-b border-border">
		{#each phases as phase}
			<button
				onclick={() => onPhaseChange(phase.value)}
				class="relative px-6 py-3 text-sm font-medium transition-all duration-200 {
					activePhase === phase.value
						? 'bg-card text-foreground border-t-2 border-x border-primary rounded-t-lg -mb-px z-10'
						: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-t-lg'
				}"
				style={activePhase === phase.value ? 'border-bottom: 2px solid hsl(var(--card))' : ''}
			>
				<div class="flex flex-col items-start gap-0.5">
					<span class="font-semibold">{phase.label}</span>
					<span class="text-xs opacity-70">{phase.dateRange}</span>
				</div>
				{#if activePhase === phase.value}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
		{/each}
	</div>
</div>
