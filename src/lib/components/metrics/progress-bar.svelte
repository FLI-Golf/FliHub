<script lang="ts">
	interface Props {
		value: number;
		max: number;
		label?: string;
		showPercentage?: boolean;
		variant?: 'default' | 'success' | 'warning' | 'danger';
		size?: 'sm' | 'md' | 'lg';
	}
	
	let { 
		value, 
		max, 
		label, 
		showPercentage = true,
		variant = 'default',
		size = 'md'
	}: Props = $props();
	
	const percentage = $derived(Math.min((value / max) * 100, 100));
	
	const variantClasses = {
		default: 'bg-primary',
		success: 'bg-green-500',
		warning: 'bg-yellow-500',
		danger: 'bg-red-500'
	};
	
	const sizeClasses = {
		sm: 'h-2',
		md: 'h-3',
		lg: 'h-4'
	};
	
	const autoVariant = $derived(
		variant === 'default' 
			? percentage >= 90 ? 'danger' 
			: percentage >= 75 ? 'warning' 
			: 'success'
			: variant
	);
</script>

<div class="w-full">
	{#if label || showPercentage}
		<div class="flex justify-between items-center mb-2">
			{#if label}
				<span class="text-sm font-medium text-muted-foreground">{label}</span>
			{/if}
			{#if showPercentage}
				<span class="text-sm font-semibold">{percentage.toFixed(0)}%</span>
			{/if}
		</div>
	{/if}
	<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden {sizeClasses[size]}">
		<div 
			class="h-full rounded-full transition-all duration-500 {variantClasses[autoVariant]}"
			style="width: {percentage}%"
		></div>
	</div>
</div>
