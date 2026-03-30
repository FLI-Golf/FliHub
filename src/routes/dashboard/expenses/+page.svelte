<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import StatusBadge from '$lib/components/metrics/status-badge.svelte';
	import { 
		Receipt, 
		DollarSign, 
		TrendingUp, 
		AlertCircle,
		CheckCircle2,
		Clock,
		Plus,
		FileText,
		Users,
		Briefcase,
		Building2,
		Plane,
		Utensils,
		ShoppingBag,
		Wrench,
		Home,
		Laptop,
		Award,
		Video,
		MoreHorizontal
	} from 'lucide-svelte';
	import EditExpenseModal from '$lib/components/expenses/edit-expense-modal.svelte';
	import ExpensePieChart from '$lib/components/charts/ExpensePieChart.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let expenses = $state(data.expenses || []);
	let stats = $derived(data.stats);
	let topCategories = $derived(data.topCategories || []);
	let pendingApprovals = $derived(data.pendingApprovals || []);
	
	let statusFilter = $state<string>('all');
	let categoryFilter = $state<string>('all');
	let showEditModal = $state(false);
	let selectedExpense = $state<any>(null);

	function handleRowClick(expense: any) {
		selectedExpense = expense;
		showEditModal = true;
	}

	function handleAddExpense() {
		selectedExpense = null;
		showEditModal = true;
	}

	function handleExpenseUpdated(updated: any) {
		// Update the expense in the local list
		const idx = expenses.findIndex((e: any) => e.id === updated.id);
		if (idx !== -1) expenses[idx] = { ...expenses[idx], ...updated };
	}
	
	// Filter expenses based on selected tabs
	let filteredExpenses = $derived(expenses.filter(expense => {
		const statusMatch = statusFilter === 'all' || expense.status === statusFilter;
		const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
		return statusMatch && categoryMatch;
	}));
	
	// Get unique categories from expenses
	let uniqueCategories = $derived(Array.from(new Set(expenses.map(e => e.category))).sort());
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function formatCategory(category: string): string {
		return category.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	}
	
	function getExpenseCountByStatus(status: string): number {
		return expenses.filter(e => e.status === status).length;
	}
	
	function getExpenseCountByCategory(category: string): number {
		return expenses.filter(e => e.category === category).length;
	}
	
	// Calculate filtered totals
	let filteredTotal = $derived(filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0));
	let filteredCount = $derived(filteredExpenses.length);
	
	// Map categories to icons
	function getCategoryIcon(category: string) {
		const iconMap: Record<string, any> = {
			staff: Users,
			executive_management: Briefcase,
			office_staff: Building2,
			consultants: Users,
			commissions: DollarSign,
			marketing: TrendingUp,
			advertising: TrendingUp,
			public_relations: Users,
			legal: Briefcase,
			tech_app_development: Laptop,
			office_overhead: Building2,
			office_upgrades: Home,
			travel: Plane,
			venue: Building2,
			course_buildout: Wrench,
			purse_prizes: Award,
			player_sponsorships: Award,
			equipment: ShoppingBag,
			accommodation: Home,
			meals: Utensils,
			documentary: Video,
			other: MoreHorizontal
		};
		return iconMap[category] || MoreHorizontal;
	}
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All', count: expenses.length },
		{ value: 'draft', label: 'Draft', count: getExpenseCountByStatus('draft'), icon: FileText },
		{ value: 'submitted', label: 'Submitted', count: getExpenseCountByStatus('submitted'), icon: Clock },
		{ value: 'approved', label: 'Approved', count: getExpenseCountByStatus('approved'), icon: CheckCircle2 },
		{ value: 'paid', label: 'Paid', count: getExpenseCountByStatus('paid'), icon: DollarSign },
		{ value: 'rejected', label: 'Rejected', count: getExpenseCountByStatus('rejected'), icon: AlertCircle }
	]);
	
	// Build category tabs
	let categoryTabs = $derived([
		{ value: 'all', label: 'All Categories', count: expenses.length },
		...uniqueCategories.map(cat => ({
			value: cat,
			label: formatCategory(cat),
			count: getExpenseCountByCategory(cat),
			icon: getCategoryIcon(cat)
		}))
	]);
</script>

<svelte:head>
	<title>Expenses - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold mb-2">Expenses</h1>
			<p class="text-muted-foreground">Track and manage financial transactions</p>
		</div>
		<Button class="gap-2" onclick={handleAddExpense}>
			<Plus class="size-4" />
			Add Expense
		</Button>
	</div>

	<!-- Pending Approvals Alert -->
	{#if pendingApprovals.length > 0}
		<div class="flex items-center justify-between rounded-xl border border-yellow-600/40 bg-slate-900 px-4 py-3">
			<div class="flex items-center gap-3">
				<div class="flex size-8 items-center justify-center rounded-lg bg-yellow-500/10 shrink-0">
					<AlertCircle class="size-4 text-yellow-400" />
				</div>
				<div>
					<p class="text-sm font-semibold text-slate-100">
						{pendingApprovals.length} {pendingApprovals.length === 1 ? 'expense' : 'expenses'} pending approval
					</p>
					<p class="text-xs text-slate-400">
						Total amount: <span class="font-semibold text-yellow-400">{formatCurrency(pendingApprovals.reduce((sum, e) => sum + (e.amount || 0), 0))}</span>
					</p>
				</div>
			</div>
			<Button variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700">Review</Button>
		</div>
	{/if}

	<!-- Overview + Status combined compact row -->
	<Card class="p-4">
		<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 divide-y sm:divide-y-0 sm:divide-x divide-border">
			<!-- KPI: Total -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Receipt class="size-3.5 shrink-0" />
					<span class="text-xs">Total</span>
				</div>
				<p class="text-xl font-bold">{stats.total}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.total)}</p>
			</div>
			<!-- KPI: Paid Out -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
					<CheckCircle2 class="size-3.5 shrink-0" />
					<span class="text-xs">Paid Out</span>
				</div>
				<p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.amounts.paid)}</p>
				<p class="text-xs text-muted-foreground">{stats.byStatus.paid} transactions</p>
			</div>
			<!-- KPI: Pending -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
					<Clock class="size-3.5 shrink-0" />
					<span class="text-xs">Pending</span>
				</div>
				<p class="text-xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.amounts.submitted)}</p>
				<p class="text-xs text-muted-foreground">{stats.byStatus.submitted} awaiting</p>
			</div>
			<!-- Divider label -->
			<div class="px-3 py-2 hidden lg:flex items-center justify-center">
				<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
			</div>
			<!-- Status: Draft -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<FileText class="size-3.5 shrink-0" />
					<span class="text-xs">Draft</span>
				</div>
				<p class="text-xl font-bold">{stats.byStatus.draft}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.draft)}</p>
			</div>
			<!-- Status: Submitted -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-blue-500">
					<Clock class="size-3.5 shrink-0" />
					<span class="text-xs">Submitted</span>
				</div>
				<p class="text-xl font-bold">{stats.byStatus.submitted}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.submitted)}</p>
			</div>
			<!-- Status: Approved -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-green-500">
					<CheckCircle2 class="size-3.5 shrink-0" />
					<span class="text-xs">Approved</span>
				</div>
				<p class="text-xl font-bold">{stats.byStatus.approved}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.approved)}</p>
			</div>
			<!-- Status: Paid -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-emerald-600">
					<DollarSign class="size-3.5 shrink-0" />
					<span class="text-xs">Paid</span>
				</div>
				<p class="text-xl font-bold">{stats.byStatus.paid}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.paid)}</p>
			</div>
			<!-- Status: Rejected -->
			<div class="px-3 py-2 flex flex-col gap-0.5">
				<div class="flex items-center gap-1.5 text-red-500">
					<AlertCircle class="size-3.5 shrink-0" />
					<span class="text-xs">Rejected</span>
				</div>
				<p class="text-xl font-bold">{stats.byStatus.rejected}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.rejected ?? 0)}</p>
			</div>
		</div>
	</Card>

	<!-- Top Categories Pie Chart -->
	{#if topCategories.length > 0}
		{@const pieSlices = topCategories.map(([category, d]) => ({ category, amount: d.amount, count: d.count }))}
		<Card class="p-5 bg-slate-900 border-slate-700">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Top Expense Categories</h2>
				<span class="text-xs text-slate-500">{topCategories.reduce((s, [, d]) => s + d.count, 0)} expenses</span>
			</div>
			<ExpensePieChart slices={pieSlices} total={stats.amounts.total} />
		</Card>
	{/if}

	<!-- Expenses Table with Tabs -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">All Expenses</h2>
			{#if statusFilter !== 'all' || categoryFilter !== 'all'}
				<div class="text-sm text-muted-foreground">
					Showing {filteredCount} {filteredCount === 1 ? 'expense' : 'expenses'} • 
					Total: <span class="font-semibold">{formatCurrency(filteredTotal)}</span>
				</div>
			{/if}
		</div>
		
		<!-- Filters row -->
		<div class="flex flex-wrap items-end gap-4 mb-4">
			<div class="flex-1 min-w-0">
				<h3 class="text-xs font-medium text-muted-foreground mb-2">Status</h3>
				<VisualTabs
					tabs={statusTabs}
					activeTab={statusFilter}
					onTabChange={(v) => statusFilter = v}
					variant="button"
				/>
			</div>
			<div class="shrink-0">
				<h3 class="text-xs font-medium text-muted-foreground mb-2">Category</h3>
				<select
					value={categoryFilter}
					onchange={(e) => categoryFilter = e.currentTarget.value}
					class="rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="all">All Categories ({expenses.length})</option>
					{#each uniqueCategories as cat}
						<option value={cat}>{formatCategory(cat)} ({getExpenseCountByCategory(cat)})</option>
					{/each}
				</select>
			</div>
		</div>

		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 dark:bg-slate-900 border-b">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Description
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Category
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Amount
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Date
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Vendor
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#if filteredExpenses.length === 0}
							<tr>
								<td colspan="6" class="px-6 py-8 text-center text-foreground">
									{#if expenses.length === 0}
										No expenses found. Add your first expense to get started.
									{:else}
										No expenses match the selected filters.
									{/if}
								</td>
							</tr>
						{:else}
							{#each filteredExpenses.slice(0, 50) as expense, i}
								<tr class="hover:bg-green-800 dark:hover:bg-green-800/50 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-blue-800 dark:bg-blue-800/30' : ''}" onclick={() => handleRowClick(expense)}>
									<td class="px-6 py-4">
										<div class="font-medium">{expense.description}</div>
										{#if expense.notes}
											<div class="text-sm text-muted-foreground truncate max-w-xs">
												{expense.notes}
											</div>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm">
										{formatCategory(expense.category)}
									</td>
									<td class="px-6 py-4 text-sm font-semibold">
										{formatCurrency(expense.amount)}
									</td>
									<td class="px-6 py-4">
										<StatusBadge status={expense.status} />
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{formatDate(expense.date)}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{expense.vendor || '-'}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			{#if filteredExpenses.length > 50}
				<div class="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
					<p class="text-sm text-muted-foreground text-center">
						Showing 50 of {filteredExpenses.length} expenses
					</p>
				</div>
			{/if}
		</Card>
	</div>
</div>

<EditExpenseModal
	bind:open={showEditModal}
	expense={selectedExpense}
	vendors={data.vendors ?? []}
	projects={data.projects ?? []}
	onUpdated={handleExpenseUpdated}
/>
