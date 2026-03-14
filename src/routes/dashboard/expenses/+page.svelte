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
		<Button class="gap-2">
			<Plus class="size-4" />
			Add Expense
		</Button>
	</div>

	<!-- Pending Approvals Alert -->
	{#if pendingApprovals.length > 0}
		<Card class="p-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<AlertCircle class="size-5 text-blue-600 dark:text-blue-400" />
					<div>
						<p class="font-semibold text-blue-900 dark:text-blue-100">
							{pendingApprovals.length} {pendingApprovals.length === 1 ? 'expense' : 'expenses'} pending approval
						</p>
						<p class="text-sm text-blue-700 dark:text-blue-300">
							Total amount: {formatCurrency(pendingApprovals.reduce((sum, e) => sum + (e.amount || 0), 0))}
						</p>
					</div>
				</div>
				<Button variant="outline" size="sm">Review</Button>
			</div>
		</Card>
	{/if}

	<!-- Statistics -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				title="Total Expenses"
				value={stats.total}
				subtitle="All transactions"
				icon={Receipt}
			/>
			
			<MetricCard
				title="Total Amount"
				value={formatCurrency(stats.amounts.total)}
				subtitle="Across all expenses"
				icon={DollarSign}
			/>
			
			<MetricCard
				title="Paid Out"
				value={formatCurrency(stats.amounts.paid)}
				subtitle="{stats.byStatus.paid} transactions"
				icon={CheckCircle2}
				variant="success"
			/>
			
			<MetricCard
				title="Pending"
				value={formatCurrency(stats.amounts.submitted)}
				subtitle="{stats.byStatus.submitted} awaiting approval"
				icon={Clock}
				variant="warning"
			/>
		</div>
	</div>

	<!-- Status Breakdown -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Expense Status</h2>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<FileText class="size-4 text-slate-500" />
					<p class="text-sm text-muted-foreground">Draft</p>
				</div>
				<p class="text-2xl font-bold mb-1">{stats.byStatus.draft}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.draft)}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<Clock class="size-4 text-blue-500" />
					<p class="text-sm text-muted-foreground">Submitted</p>
				</div>
				<p class="text-2xl font-bold mb-1">{stats.byStatus.submitted}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.submitted)}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle2 class="size-4 text-green-500" />
					<p class="text-sm text-muted-foreground">Approved</p>
				</div>
				<p class="text-2xl font-bold mb-1">{stats.byStatus.approved}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.approved)}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<DollarSign class="size-4 text-green-600" />
					<p class="text-sm text-muted-foreground">Paid</p>
				</div>
				<p class="text-2xl font-bold mb-1">{stats.byStatus.paid}</p>
				<p class="text-xs text-muted-foreground">{formatCurrency(stats.amounts.paid)}</p>
			</Card>
			<Card class="p-4">
				<div class="flex items-center gap-2 mb-2">
					<AlertCircle class="size-4 text-red-500" />
					<p class="text-sm text-muted-foreground">Rejected</p>
				</div>
				<p class="text-2xl font-bold mb-1">{stats.byStatus.rejected}</p>
			</Card>
		</div>
	</div>

	<!-- Top Categories -->
	{#if topCategories.length > 0}
		<div>
			<h2 class="text-xl font-semibold mb-4">Top Expense Categories</h2>
			<Card class="p-6">
				<div class="space-y-4">
					{#each topCategories as [category, data]}
						<div>
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm font-medium">{formatCategory(category)}</span>
								<div class="text-right">
									<p class="text-sm font-semibold">{formatCurrency(data.amount)}</p>
									<p class="text-xs text-muted-foreground">{data.count} {data.count === 1 ? 'expense' : 'expenses'}</p>
								</div>
							</div>
							<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
								<div 
									class="bg-primary h-2 rounded-full transition-all duration-500"
									style="width: {(data.amount / stats.amounts.total * 100).toFixed(1)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
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
		
		<!-- Status Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="button"
			/>
		</div>

		<!-- Category Filter Tabs -->
		<div class="mb-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Category</h3>
			<VisualTabs
				tabs={categoryTabs}
				activeTab={categoryFilter}
				onTabChange={(v) => categoryFilter = v}
				variant="folder"
			/>
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

{#if selectedExpense}
	<EditExpenseModal
		bind:open={showEditModal}
		expense={selectedExpense}
		onUpdated={handleExpenseUpdated}
	/>
{/if}
