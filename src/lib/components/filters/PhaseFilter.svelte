<script lang="ts">
	import { Calendar } from 'lucide-svelte';

	interface Props {
		activePhase: string;
		onPhaseChange: (phase: string) => void;
	}

	let { activePhase = 'all', onPhaseChange }: Props = $props();

	const phases = [
		{
			value: 'phase1',
			label: 'Phase 1',
			sublabel: 'Pre-Tournaments',
			dateRange: 'Funded Jun 15, 2025'
		},
		{
			value: 'phase2',
			label: 'Phase 2',
			sublabel: 'Tournaments Live',
			dateRange: '2026 onward'
		},
		{
			value: 'all',
			label: 'Combined',
			sublabel: 'Both phases',
			dateRange: '2026 onward'
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
					<span class="font-semibold">{phase.label}{#if phase.sublabel} — {phase.sublabel}{/if}</span>
					<span class="text-xs opacity-70">{phase.dateRange}</span>
				</div>
				{#if activePhase === phase.value}
					<div class="absolute inset-x-0 -bottom-px h-0.5 bg-card"></div>
				{/if}
			</button>
		{/each}
	</div>
</div>
