<script lang="ts">
	import type { PageData } from './$types';
	import { Target, CheckCircle2, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const goals = $derived((data as any).goals ?? []);
	const taskCountByGoal = $derived((data as any).taskCountByGoal ?? {});
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-orange-400');
	const accentBorder = $derived(config?.accentTw?.split(' ')[1] ?? 'border-orange-500');

	function progressPct(total: number, completed: number): number {
		return total === 0 ? 0 : Math.round((completed / total) * 100);
	}

	function statusStyle(status: string) {
		const styles: Record<string, string> = {
			active:      'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
			completed:   'bg-blue-950/50 text-blue-300 border-blue-700/50',
			on_hold:     'bg-amber-950/50 text-amber-300 border-amber-700/50',
			archived:    'bg-slate-700/50 text-slate-300 border-slate-600/50',
		};
		return styles[status] ?? 'bg-slate-800/50 text-slate-300 border-slate-700/50';
	}
</script>

<svelte:head><title>Marketing Goals — Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Target class="size-6 {accentText}" /> Marketing Goals
	</h1>

	{#if goals.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<Target class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No marketing goals yet.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each goals as goal}
				{@const counts = taskCountByGoal[goal.id] ?? { total: 0, completed: 0 }}
				{@const pct = progressPct(counts.total, counts.completed)}
				<a href={`/portal/marketing/goals/${goal.id}`} class="block">
					<div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
						<div class="flex items-start justify-between gap-3 mb-3">
							<div class="min-w-0">
								<h3 class="font-semibold text-white truncate">{goal.goalName ?? 'Untitled'}</h3>
								<p class="text-xs text-slate-400 mt-1">{goal.category ?? 'General'}</p>
							</div>
							<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border shrink-0 {statusStyle(goal.status)}">
								{goal.status ?? 'unknown'}
							</span>
						</div>

						{#if counts.total > 0}
							<div class="space-y-2">
								<div class="flex items-center justify-between text-xs text-slate-400">
									<span>{counts.completed}/{counts.total} tasks</span>
									<span class="text-orange-400 font-semibold">{pct}%</span>
								</div>
								<div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
									<div class="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all" style="width: {pct}%"></div>
								</div>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
