<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import type { ComponentType } from 'svelte';
	
	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		icon?: ComponentType;
		trend?: {
			value: number;
			label: string;
		};
		variant?: 'default' | 'success' | 'warning' | 'danger';
	}
	
	let { 
		title, 
		value, 
		subtitle, 
		icon: Icon, 
		trend,
		variant = 'default'
	}: Props = $props();
	
	const variantClasses = {
		default: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
		success: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
		warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100',
		danger: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100'
	};
	
	const trendColor = trend && trend.value > 0 ? 'text-green-600 dark:text-green-400' : 
	                   trend && trend.value < 0 ? 'text-red-600 dark:text-red-400' : 
	                   'text-slate-600 dark:text-slate-400';
</script>

<Card class="p-6 hover:shadow-lg transition-shadow">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="text-sm font-medium text-muted-foreground mb-1">{title}</p>
			<p class="text-3xl font-bold tracking-tight mb-2">{value}</p>
			{#if subtitle}
				<p class="text-sm text-muted-foreground">{subtitle}</p>
			{/if}
			{#if trend}
				<div class="flex items-center gap-1 mt-2">
					<span class="text-sm font-medium {trendColor}">
						{trend.value > 0 ? '+' : ''}{trend.value}%
					</span>
					<span class="text-xs text-muted-foreground">{trend.label}</span>
				</div>
			{/if}
		</div>
		{#if Icon}
			<div class="flex size-12 items-center justify-center rounded-xl {variantClasses[variant]}">
				<Icon class="size-6 stroke-[2]" />
			</div>
		{/if}
	</div>
</Card>
