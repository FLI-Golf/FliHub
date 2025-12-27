<script lang="ts">
	interface Tab {
		value: string;
		label: string;
		count?: number;
		icon?: any;
	}
	
	interface Props {
		tabs: Tab[];
		activeTab: string;
		onTabChange: (value: string) => void;
		variant?: 'folder' | 'button' | 'pill';
	}
	
	let { tabs, activeTab, onTabChange, variant = 'folder' }: Props = $props();
	
	const variantClasses = {
		folder: {
			container: 'flex gap-1 border-b border-border',
			tab: 'px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all relative',
			active: 'bg-background text-foreground border-t-2 border-x border-primary -mb-px',
			inactive: 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
		},
		button: {
			container: 'flex flex-wrap gap-2',
			tab: 'px-4 py-2 rounded-lg font-medium text-sm transition-all border-2',
			active: 'bg-primary text-primary-foreground border-primary shadow-sm',
			inactive: 'bg-background text-foreground border-border hover:bg-muted hover:border-primary/50'
		},
		pill: {
			container: 'flex flex-wrap gap-2',
			tab: 'px-4 py-2 rounded-full font-medium text-sm transition-all',
			active: 'bg-primary text-primary-foreground shadow-sm',
			inactive: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
		}
	};
	
	const classes = $derived(variantClasses[variant]);
</script>

<div class={classes.container}>
	{#each tabs as tab}
		<button
			type="button"
			class="{classes.tab} {activeTab === tab.value ? classes.active : classes.inactive}"
			onclick={() => onTabChange(tab.value)}
		>
			<div class="flex items-center gap-2">
				{#if tab.icon}
					<svelte:component this={tab.icon} class="size-4" />
				{/if}
				<span>{tab.label}</span>
				{#if tab.count !== undefined}
					<span class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold {activeTab === tab.value ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'}">
						{tab.count}
					</span>
				{/if}
			</div>
		</button>
	{/each}
</div>
