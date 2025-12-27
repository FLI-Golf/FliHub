<script lang="ts">
	interface Props {
		status: string;
		variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
	}
	
	let { status, variant }: Props = $props();
	
	const statusVariants: Record<string, string> = {
		// Task statuses
		todo: 'default',
		in_progress: 'info',
		blocked: 'warning',
		completed: 'success',
		cancelled: 'danger',
		
		// Project statuses
		draft: 'default',
		planned: 'info',
		
		// Expense statuses
		submitted: 'info',
		approved: 'success',
		rejected: 'danger',
		paid: 'success',
		
		// Approval statuses
		pending: 'warning',
		revision_requested: 'warning'
	};
	
	const autoVariant = $derived(variant || statusVariants[status] || 'default');
	
	const variantClasses = {
		default: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600',
		success: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-300 dark:border-green-600',
		warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-600',
		danger: 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-300 dark:border-red-600',
		info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-600'
	};
	
	const formattedStatus = $derived(
		status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
	);
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {variantClasses[autoVariant]}">
	{formattedStatus}
</span>
