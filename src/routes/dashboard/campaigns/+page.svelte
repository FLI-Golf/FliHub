<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Megaphone, DollarSign, BarChart3, Target,
		ArrowRight, Calendar, TrendingUp, CheckCircle2, Plus,
		Clock, AlertCircle, ChevronDown, Images, Star, Link, GripVertical
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let campaignsState = $state<any[]>([...(data.campaigns ?? [])]);
	const campaigns   = $derived(campaignsState);
	const stats       = $derived.by(() => {
		const totalBudget = campaignsState.reduce((sum, c) => sum + Number(c?.budget ?? 0), 0);
		const totalSpend = campaignsState.reduce((sum, c) => sum + Number(c?.actualSpend ?? 0), 0);
		const byStatus: Record<string, number> = {};
		const byType: Record<string, number> = {};
		for (const c of campaignsState) {
			if (c?.status) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
			if (c?.type) byType[c.type] = (byType[c.type] ?? 0) + 1;
		}
		return {
			total: campaignsState.length,
			totalBudget,
			totalSpend,
			byStatus,
			byType
		};
	});
	const goals       = $derived(data.marketingGoals ?? []);

	let expandedDesc  = $state<Record<string, boolean>>({});
	let draggingCampaignId = $state('');
	let dragSavingId = $state('');
	let dragError = $state('');

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}
	function pct(a: number, b: number) {
		return b === 0 ? 0 : Math.min(100, (a / b) * 100);
	}
	function fmtDate(d: string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; bar: string; icon: any }> = {
		'Active':       { label: 'Active',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', bar: 'bg-emerald-500', icon: TrendingUp },
		'Planning':     { label: 'Planning',   color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',       bar: 'bg-blue-500',    icon: Clock },
		'Completed':    { label: 'Completed',  color: 'text-slate-400',   bg: 'bg-slate-500/15 border-slate-500/30',     bar: 'bg-slate-500',   icon: CheckCircle2 },
		'Paused':       { label: 'Paused',     color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',     bar: 'bg-amber-500',   icon: AlertCircle },
	};
	const KANBAN_STATUSES = ['Planning', 'Active', 'Paused', 'Completed'];

	const TYPE_COLORS: Record<string, string> = {
		'Marketing':      'bg-violet-500/15 text-violet-300 border-violet-500/30',
		'Brand Awareness':'bg-blue-500/15 text-blue-300 border-blue-500/30',
		'Event':          'bg-amber-500/15 text-amber-300 border-amber-500/30',
		'Product Launch': 'bg-pink-500/15 text-pink-300 border-pink-500/30',
	};

	const BORDER_COLORS: Record<string, string> = {
		'Active':    'border-l-emerald-500',
		'Planning':  'border-l-blue-500',
		'Completed': 'border-l-slate-500',
		'Paused':    'border-l-amber-500',
	};

	function getStatus(s: string) {
		return STATUS_CONFIG[s] ?? { label: s, color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30', bar: 'bg-slate-500', icon: Megaphone };
	}

	const kanbanColumns = $derived(
		KANBAN_STATUSES.map((status) => ({
			status,
			count: campaigns.filter((c: any) => c.status === status).length,
			items: campaigns.filter((c: any) => c.status === status)
		}))
	);

	const activeGoals = $derived(goals.filter((g: any) => g.status !== 'Completed').slice(0, 4));

	async function updateCampaignStatus(campaignId: string, status: string) {
		dragSavingId = campaignId;
		dragError = '';
		try {
			const res = await fetch(`/api/campaigns/${campaignId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload?.message ?? 'Failed to update campaign status');
			}
		} catch (err: any) {
			dragError = err?.message ?? 'Failed to update campaign status';
		} finally {
			dragSavingId = '';
		}
	}

	function onCardDragStart(event: DragEvent, campaignId: string) {
		draggingCampaignId = campaignId;
		event.dataTransfer?.setData('text/campaign-id', campaignId);
		event.dataTransfer?.setData('text/plain', campaignId);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function onCardDragEnd() {
		draggingCampaignId = '';
	}

	async function onColumnDrop(event: DragEvent, targetStatus: string) {
		event.preventDefault();
		const campaignId = event.dataTransfer?.getData('text/campaign-id') || event.dataTransfer?.getData('text/plain') || draggingCampaignId;
		if (!campaignId) return;
		const campaign = campaignsState.find((c: any) => c.id === campaignId);
		if (!campaign || campaign.status === targetStatus) return;

		const previousStatus = campaign.status;
		campaignsState = campaignsState.map((c: any) => c.id === campaignId ? { ...c, status: targetStatus } : c);
		await updateCampaignStatus(campaignId, targetStatus);
		if (dragError) {
			campaignsState = campaignsState.map((c: any) => c.id === campaignId ? { ...c, status: previousStatus } : c);
		}
		draggingCampaignId = '';
	}

	function onColumnDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}
</script>

<svelte:head><title>Campaigns — FliHub</title></svelte:head>

<div class="flex flex-col gap-8">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Campaigns</h1>
			<p class="text-sm text-muted-foreground mt-1">Marketing campaigns, promotions, and brand activations.</p>
		</div>
		<Button href="/dashboard/marketing/campaigns/new" variant="outline" size="sm" class="gap-1.5 shrink-0">
			<Plus class="size-3.5" /> New Campaign
		</Button>
	</div>

	<!-- KPI strip -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="p-4 border-l-4 border-l-violet-500 bg-violet-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-violet-300/70 font-medium">Total Campaigns</p>
				<div class="size-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
					<Megaphone class="size-3.5 text-violet-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{stats.total}</p>
			<p class="text-xs text-violet-300/60 mt-0.5">{stats.byStatus['Active'] ?? 0} active</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-blue-300/70 font-medium">Total Budget</p>
				<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<DollarSign class="size-3.5 text-blue-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{fmt(stats.totalBudget)}</p>
			<p class="text-xs text-blue-300/60 mt-0.5">{fmt(stats.totalSpend)} spent</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-emerald-300/70 font-medium">Spend Rate</p>
				<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
					<BarChart3 class="size-3.5 text-emerald-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{pct(stats.totalSpend, stats.totalBudget).toFixed(0)}%</p>
			<p class="text-xs text-emerald-300/60 mt-0.5">{fmt(stats.totalBudget - stats.totalSpend)} remaining</p>
		</Card>
		<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-amber-300/70 font-medium">Active Goals</p>
				<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
					<Target class="size-3.5 text-amber-400" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{activeGoals.length}</p>
			<p class="text-xs text-amber-300/60 mt-0.5">of {goals.length} total</p>
		</Card>
	</div>

	<!-- Main content: campaigns + goals sidebar -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Campaigns board -->
		<div class="lg:col-span-2 flex flex-col gap-4">
			{#if dragError}
				<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{dragError}</div>
			{/if}

			<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
				{#each kanbanColumns as column}
					{@const s = getStatus(column.status)}
					<div
						class="rounded-xl border border-slate-700 bg-slate-900/70 min-h-[200px]"
						ondragover={onColumnDragOver}
						ondrop={(event) => onColumnDrop(event, column.status)}
					>
						<div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
							<div class="flex items-center gap-2">
								<s.icon class="size-4 {s.color}" />
								<p class="text-sm font-semibold text-white">{column.status}</p>
							</div>
							<span class="text-xs text-slate-400">{column.count}</span>
						</div>
						<div class="p-3 space-y-3">
							{#if column.items.length === 0}
								<div class="rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
									Drop campaigns here
								</div>
							{/if}

							{#each column.items as campaign (campaign.id)}
								{@const typeColor = TYPE_COLORS[campaign.type] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/30'}
								<div
									draggable="true"
									ondragstart={(event) => onCardDragStart(event, campaign.id)}
									ondragend={onCardDragEnd}
									class="{draggingCampaignId === campaign.id ? 'opacity-50' : ''}"
								>
									<Card class="p-0 border border-slate-700/70 bg-slate-900 overflow-hidden">
									<div class="p-4 space-y-3">
										<div class="flex items-start gap-2">
											<div class="pt-0.5 text-slate-500" title="Drag to move">
												<GripVertical class="size-4" />
											</div>
											<div class="flex-1 space-y-3 min-w-0">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0">
												<p class="text-sm font-bold leading-tight line-clamp-1">{campaign.name}</p>
												<div class="flex items-center gap-1.5 mt-1 flex-wrap">
													{#if campaign.type}
														<span class="text-[10px] font-medium px-1.5 py-0.5 rounded border {typeColor}">{campaign.type}</span>
													{/if}
													{#if dragSavingId === campaign.id}
														<span class="text-[10px] text-slate-400">saving...</span>
													{/if}
												</div>
											</div>
											<div class="text-right shrink-0">
												<p class="text-sm font-bold tabular-nums">{fmt(campaign.actualSpend)}</p>
												<p class="text-xs text-muted-foreground">/ {fmt(campaign.budget)}</p>
											</div>
										</div>

										{#if campaign.linkedGoal}
											<a
												href="/dashboard/marketing-goals/{campaign.linkedGoal.id}"
												class="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded border bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-colors"
												onclick={(event) => event.stopPropagation()}
											>
												<Link class="size-3 shrink-0" />
												Goal: {campaign.linkedGoal.goalName}
											</a>
										{/if}

										{#if campaign.description}
											<button
												onclick={() => expandedDesc[campaign.id] = !expandedDesc[campaign.id]}
												class="w-full text-left group/desc"
											>
												<p class="text-xs text-muted-foreground leading-relaxed {expandedDesc[campaign.id] ? '' : 'line-clamp-2'}">
													{@html campaign.description}
												</p>
												<span class="inline-flex items-center gap-0.5 text-[10px] text-slate-500 group-hover/desc:text-slate-300 transition-colors mt-0.5">
													<ChevronDown class="size-3 transition-transform duration-200 {expandedDesc[campaign.id] ? 'rotate-180' : ''}" />
													{expandedDesc[campaign.id] ? 'less' : 'more'}
												</span>
											</button>
										{/if}

										<div class="h-1.5 rounded-full overflow-hidden bg-slate-700">
											<div class="h-full rounded-full transition-all {s.bar}" style="width:{campaign.budgetPct.toFixed(1)}%"></div>
										</div>
										<div class="flex items-center justify-between text-[11px] text-muted-foreground">
											<span class="inline-flex items-center gap-1"><Calendar class="size-3.5" />{fmtDate(campaign.startDate)} — {fmtDate(campaign.endDate)}</span>
											{#if campaign.assets.length > 0}
												<span class="inline-flex items-center gap-1"><Images class="size-3.5" />{campaign.assets.length}</span>
											{/if}
										</div>
											</div>
										</div>
									</div>
									</Card>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right sidebar: goals + type breakdown -->
		<div class="flex flex-col gap-4">

			<!-- Marketing Goals -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h2 class="text-sm font-bold">Marketing Goals</h2>
					<Button href="/dashboard/marketing-goals" variant="ghost" size="sm" class="gap-1 text-xs h-7">
						View all <ArrowRight class="size-3" />
					</Button>
				</div>
				<Card class="p-4 space-y-3">
					{#each activeGoals as goal (goal.id)}
						{@const goalPct = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0}
						<div class="space-y-1">
							<div class="flex items-start justify-between gap-2">
								<p class="text-xs font-medium leading-tight line-clamp-1">{goal.goalName}</p>
								<span class="text-[10px] text-muted-foreground shrink-0 tabular-nums">{goal.currentValue} / {goal.targetValue}</span>
							</div>
							<div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
								<div class="h-full rounded-full bg-violet-500 transition-all" style="width:{goalPct.toFixed(0)}%"></div>
							</div>
							<p class="text-[10px] text-muted-foreground">{goalPct.toFixed(0)}% · {goal.targetMetric}</p>
						</div>
					{/each}
					{#if activeGoals.length === 0}
						<p class="text-xs text-muted-foreground text-center py-2">No active goals</p>
					{/if}
				</Card>
			</div>

			<!-- Campaign types breakdown -->
			<div>
				<h2 class="text-sm font-bold mb-3">By Type</h2>
				<Card class="p-4 space-y-2.5">
					{#each Object.entries(stats.byType) as [type, count]}
						{@const typeColor = TYPE_COLORS[type] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/30'}
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-medium px-2 py-0.5 rounded border {typeColor}">{type}</span>
							<span class="text-sm font-bold tabular-nums">{count}</span>
						</div>
					{/each}
				</Card>
			</div>

			<!-- Budget by status -->
			<div>
				<h2 class="text-sm font-bold mb-3">Budget by Status</h2>
				<Card class="p-4 space-y-3">
					{#each campaigns as c}
						{@const s = getStatus(c.status)}
						<div class="flex items-center justify-between text-xs gap-2">
							<span class="text-muted-foreground truncate">{c.name}</span>
							<span class="font-medium tabular-nums shrink-0 {s.color}">{fmt(c.budget)}</span>
						</div>
					{/each}
				</Card>
			</div>

		</div>
	</div>

</div>
