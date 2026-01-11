<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		variant?: 'default' | 'secondary' | 'destructive' | 'outline';
		children?: Snippet;
	}

	let { class: className, variant = 'default', children }: Props = $props();
	
	const variants = {
		default: 'bg-primary text-primary-foreground',
		secondary: 'bg-secondary text-secondary-foreground',
		destructive: 'bg-destructive text-destructive-foreground',
		outline: 'border border-input bg-background'
	};
</script>

<span class={cn(
	'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
	variants[variant],
	className
)}>
	{@render children?.()}
</span>
