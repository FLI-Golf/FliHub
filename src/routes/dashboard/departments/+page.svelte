<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Building2, Users, DollarSign, Plus, FolderKanban, Receipt, TrendingUp } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import AddDepartmentModal from '$lib/components/departments/add-department-modal.svelte';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);

	// Per-department slider state: deptId → current dragging value
	let sliderValues = $state<Record<string, number>>({});
	let savingBudget = $state<Record<string, boolean>>({});
	let budgetErrors = $state<Record<string, string>>({});

	function getSliderValue(dept: any): number {
		return sliderValues[dept.id] ?? dept.department_annual_budget ?? 0;
	}

	async function saveBudget(deptId: string, value: number) {
		savingBudget = { ...savingBudget, [deptId]: true };
		budgetErrors = { ...budgetErrors, [deptId]: '' };
		try {
			const response = await fetch(`/api/departments/${deptId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ department_annual_budget: value })
			});
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.message || 'Budget save failed');
			}
			await invalidateAll();
		} catch (err) {
			const { [deptId]: _discard, ...nextSliderValues } = sliderValues;
			sliderValues = nextSliderValues;
			budgetErrors = {
				...budgetErrors,
				[deptId]: err instanceof Error ? err.message : 'Budget save failed'
			};
		} finally {
			savingBudget = { ...savingBudget, [deptId]: false };
		}
	}

	// Max slider value — highest budget across all depts, min $5M, scaled to 1.5×
	const sliderMax = $derived.by(() => {
		const budgets = (data.departments ?? []).map((d: any) => d.department_annual_budget ?? 0);
		const allocated = Object.values(data.allocatedByDept ?? {}) as number[];
		return Math.max(5_000_000, ...budgets, ...allocated) * 1.5;
	});

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Departments - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-bold mb-2 tracking-tight">Departments</h1>
			<p class="text-muted-foreground text-base">
				Manage organizational departments and budgets
			</p>
		</div>
		<Button onclick={() => showAddModal = true} class="gap-2">
			<Plus class="size-4" />
			Add Department
		</Button>
	</div>

	<!-- Departments Grid -->
	{#if (data.departments ?? []).length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.departments ?? [] as department}
				{@const allocated   = data.allocatedByDept?.[department.id] ?? 0}
				{@const total       = department.department_annual_budget ?? 0}
				{@const allocPct    = total > 0 ? Math.min(100, (allocated / total) * 100) : 0}
				{@const projCount   = data.projectCountByDept?.[department.id] ?? 0}
				{@const active      = data.activeProjectsByDept?.[department.id] ?? 0}
				{@const exp         = data.expensesByDept?.[department.id]}
				{@const expTotal    = exp?.total ?? 0}
				{@const expPaid     = exp?.paid ?? 0}
				{@const expPending  = exp?.pending ?? 0}
				{@const reimbPaid   = data.reimbByDept?.[department.id] ?? 0}
				{@const combinedTotal = expTotal + reimbPaid}
				{@const paidPct     = combinedTotal > 0 ? Math.min(100, (expPaid / combinedTotal) * 100) : 0}
				{@const pendingPct  = combinedTotal > 0 ? Math.min(100 - paidPct, (expPending / combinedTotal) * 100) : 0}
				{@const reimbPct    = combinedTotal > 0 ? Math.min(100 - paidPct - pendingPct, (reimbPaid / combinedTotal) * 100) : 0}
				<a href="/dashboard/departments/{department.id}" class="group">
					<Card class="p-5 h-full flex flex-col gap-4 hover:bg-slate-800/80 transition-colors duration-200 cursor-pointer border-slate-700/60">

						<!-- Header row -->
						<div class="flex items-start gap-3">
							<div class="p-2.5 rounded-lg bg-blue-900/30 group-hover:bg-blue-900/50 transition-colors shrink-0">
								<Building2 class="size-5 text-blue-400" />
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-semibold truncate text-slate-100 leading-tight">{department.name}</h3>
								{#if department.code}
									<p class="text-[10px] text-slate-500 mt-0.5 font-mono">{department.code}</p>
								{/if}
							</div>
							{#if department.status === 'inactive'}
								<span class="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Inactive</span>
							{/if}
						</div>

						<!-- Head + project stats -->
						<div class="flex items-center justify-between text-xs text-slate-500">
							<div class="flex items-center gap-1.5 min-w-0">
								<Users class="size-3.5 shrink-0" />
								{#if department.expand?.headOfDepartment}
									<span class="truncate">{department.expand.headOfDepartment.firstName} {department.expand.headOfDepartment.lastName}</span>
								{:else}
									<span class="italic text-slate-600">No head assigned</span>
								{/if}
							</div>
							<div class="flex items-center gap-1.5 shrink-0">
								<FolderKanban class="size-3.5" />
								<span>{projCount} project{projCount !== 1 ? 's' : ''}</span>
								{#if active > 0}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40">{active} active</span>
								{/if}
							</div>
						</div>

						<!-- Budget slider -->
						<div class="space-y-1.5">
							<div class="flex items-baseline justify-between">
								<span class="text-[10px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
									<DollarSign class="size-3" />Budget
									{#if savingBudget[department.id]}
										<span class="text-[9px] text-emerald-400 animate-pulse">saving…</span>
									{/if}
								</span>
								<span class="text-sm font-bold text-slate-100 tabular-nums">
									{formatCurrency(getSliderValue(department))}
								</span>
							</div>
							<input
								type="range"
								min="0"
								max={sliderMax}
								step="25000"
								value={getSliderValue(department)}
								onclick={(e) => e.stopPropagation()}
								oninput={(e) => {
									e.stopPropagation();
									sliderValues = { ...sliderValues, [department.id]: Number((e.target as HTMLInputElement).value) };
								}}
								onchange={(e) => {
									e.stopPropagation();
									saveBudget(department.id, Number((e.target as HTMLInputElement).value));
								}}
								class="w-full h-1.5 rounded-full appearance-none cursor-pointer
									bg-slate-700
									[&::-webkit-slider-thumb]:appearance-none
									[&::-webkit-slider-thumb]:size-3.5
									[&::-webkit-slider-thumb]:rounded-full
									[&::-webkit-slider-thumb]:bg-blue-500
									[&::-webkit-slider-thumb]:border-2
									[&::-webkit-slider-thumb]:border-slate-900
									[&::-webkit-slider-thumb]:cursor-grab
									[&::-webkit-slider-thumb]:active:cursor-grabbing
									[&::-webkit-slider-thumb]:shadow-md
									[&::-moz-range-thumb]:size-3.5
									[&::-moz-range-thumb]:rounded-full
									[&::-moz-range-thumb]:bg-blue-500
									[&::-moz-range-thumb]:border-2
									[&::-moz-range-thumb]:border-slate-900
									[&::-moz-range-thumb]:cursor-grab"
							/>
							{#if total > 0 && allocated > 0}
								<div class="flex justify-between text-[10px] text-slate-500">
									<span>{formatCurrency(allocated)} allocated</span>
									<span>{allocPct.toFixed(0)}%</span>
								</div>
							{:else}
								<p class="text-[10px] text-slate-600 italic">Drag to set budget</p>
							{/if}
							{#if budgetErrors[department.id]}
								<p class="text-[10px] text-red-400">{budgetErrors[department.id]}</p>
							{/if}
						</div>

						<!-- Spend bar: project expenses + reimbursements -->
						{#if combinedTotal > 0}
							<div class="space-y-1.5 pt-1 border-t border-slate-700/50">
								<div class="flex items-baseline justify-between">
									<span class="text-[10px] text-slate-500 uppercase tracking-wide flex items-center gap-1"><Receipt class="size-3" />Spend</span>
									<span class="text-sm font-bold text-slate-100">{formatCurrency(combinedTotal)}</span>
								</div>
								<div class="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden flex">
									<div class="h-full bg-emerald-500 transition-all duration-500" style="width:{paidPct}%"></div>
									<div class="h-full bg-yellow-400/70 transition-all duration-500" style="width:{pendingPct}%"></div>
									<div class="h-full bg-orange-400/70 transition-all duration-500" style="width:{reimbPct}%"></div>
								</div>
								<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
									{#if expPaid > 0}
										<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-emerald-500 inline-block"></span>{formatCurrency(expPaid)} expenses paid</span>
									{/if}
									{#if expPending > 0}
										<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-yellow-400/70 inline-block"></span>{formatCurrency(expPending)} pending</span>
									{/if}
									{#if reimbPaid > 0}
										<span class="flex items-center gap-1"><span class="size-1.5 rounded-full bg-orange-400/70 inline-block"></span>{formatCurrency(reimbPaid)} reimbursed</span>
									{/if}
								</div>
							</div>
						{/if}

					</Card>
				</a>
			{/each}
		</div>
	{:else}
		<Card class="p-12">
			<div class="text-center">
				<Building2 class="size-12 mx-auto text-muted-foreground mb-4" />
				<h3 class="text-lg font-semibold mb-2">No departments found</h3>
				<p class="text-muted-foreground mb-4">
					Get started by creating your first department
				</p>
				<Button onclick={() => showAddModal = true} class="gap-2">
					<Plus class="size-4" />
					Add Department
				</Button>
			</div>
		</Card>
	{/if}
</div>

<!-- Add Department Modal -->
<AddDepartmentModal bind:open={showAddModal} allUserProfiles={data.userProfiles} />
