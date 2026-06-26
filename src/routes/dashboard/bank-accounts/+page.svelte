<script lang="ts">
    import type { ActionData } from './$types';
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { ArrowDown, ArrowUp, ArrowUpDown, BarChart2, Landmark, Search, ShieldCheck, Table2, Wallet, X } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	type BankAccount = {
		id: string;
		code: string;
		name: string;
		groupType: 'operating' | 'reserve_treasury' | 'restricted' | string;
		accountType: string;
		purpose?: string;
		allocation?: number | string;
		isRestricted?: boolean;
		isInterestBearing?: boolean;
		status?: string;
	};

	type SortKey = 'code' | 'name' | 'groupType' | 'accountType' | 'purpose' | 'allocation' | 'status';
	type SortDir = 'asc' | 'desc';

	let searchTerm = $state('');
	let selectedGroup = $state('all');
	let selectedType = $state('all');
	let selectedFlag = $state('all');
	let minAllocation = $state('');
	let maxAllocation = $state('');
	let sortBy = $state<SortKey>('code');
	let sortDir = $state<SortDir>('asc');
	let overrideOpenId = $state<string | null>(null);
	let viewMode = $state<'chart' | 'table'>('table');
	let seedTargetTotal = $state('7500000');
	let seedAnchorCode = $state('1040');
	let seedResetOpen = $state(false);

	function fmt(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(amount || 0);
	}

	function groupLabel(value: string) {
		if (value === 'reserve_treasury') return 'Reserve & Treasury';
		if (value === 'restricted') return 'Restricted';
		return 'Operating';
	}

	function typeLabel(value: string) {
		if (!value) return 'N/A';
		return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function statusLabel(value?: string) {
		return (value || 'active').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function groupTone(value: string) {
		if (value === 'reserve_treasury') {
			return {
				bar: 'from-blue-900 via-blue-700 to-blue-500',
				chip: 'border-blue-800/50 bg-blue-950/40 text-blue-200',
				dot: 'bg-blue-500'
			};
		}
		if (value === 'restricted') {
			return {
				bar: 'from-green-900 via-green-700 to-green-400',
				chip: 'border-green-800/50 bg-green-950/40 text-green-200',
				dot: 'bg-green-500'
			};
		}
		return {
			bar: 'from-green-800 via-emerald-600 to-teal-400',
			chip: 'border-emerald-800/50 bg-emerald-950/40 text-emerald-200',
			dot: 'bg-emerald-400'
		};
	}

	function allocationValue(v: unknown): number {
		if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
		const n = Number(v || 0);
		return Number.isFinite(n) ? n : 0;
	}

	function clearFilters() {
		searchTerm = '';
		selectedGroup = 'all';
		selectedType = 'all';
		selectedFlag = 'all';
		minAllocation = '';
		maxAllocation = '';
		sortBy = 'code';
		sortDir = 'asc';
	}

	function toggleSort(key: SortKey) {
		if (sortBy === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
			return;
		}
		sortBy = key;
		sortDir = 'asc';
	}

	function recommendedAnchorAllocation() {
		return Math.max(0, 7500000 - (data.totalAllocation - allocationValue(accounts.find((account) => account.code === seedAnchorCode)?.allocation ?? 0)));
	}

	function sortIcon(key: SortKey) {
		if (sortBy !== key) return ArrowUpDown;
		return sortDir === 'asc' ? ArrowUp : ArrowDown;
	}

	const accounts = $derived((data.accounts as BankAccount[]) ?? []);
	const accountTypes = $derived(Array.from(new Set(accounts.map((a) => a.accountType).filter(Boolean))).sort((a, b) => a.localeCompare(b)));

	const minAllocationNum = $derived(minAllocation === '' ? null : Number(minAllocation));
	const maxAllocationNum = $derived(maxAllocation === '' ? null : Number(maxAllocation));

	const filteredAccounts = $derived(accounts.filter((account) => {
		const haystack = [
			account.code,
			account.name,
			groupLabel(account.groupType),
			typeLabel(account.accountType),
			account.purpose || '',
			statusLabel(account.status),
		].join(' ').toLowerCase();

		if (searchTerm.trim() && !haystack.includes(searchTerm.trim().toLowerCase())) return false;
		if (selectedGroup !== 'all' && account.groupType !== selectedGroup) return false;
		if (selectedType !== 'all' && account.accountType !== selectedType) return false;

		if (selectedFlag === 'restricted' && !account.isRestricted) return false;
		if (selectedFlag === 'interest' && !account.isInterestBearing) return false;
		if (selectedFlag === 'unflagged' && (account.isRestricted || account.isInterestBearing)) return false;

		const allocation = allocationValue(account.allocation);
		if (minAllocationNum !== null && Number.isFinite(minAllocationNum) && allocation < minAllocationNum) return false;
		if (maxAllocationNum !== null && Number.isFinite(maxAllocationNum) && allocation > maxAllocationNum) return false;

		return true;
	}));

	const sortedAccounts = $derived([...filteredAccounts].sort((a, b) => {
		let left: string | number;
		let right: string | number;

		switch (sortBy) {
			case 'allocation':
				left = allocationValue(a.allocation);
				right = allocationValue(b.allocation);
				break;
			case 'groupType':
				left = groupLabel(a.groupType).toLowerCase();
				right = groupLabel(b.groupType).toLowerCase();
				break;
			case 'accountType':
				left = typeLabel(a.accountType).toLowerCase();
				right = typeLabel(b.accountType).toLowerCase();
				break;
			case 'purpose':
				left = (a.purpose || '').toLowerCase();
				right = (b.purpose || '').toLowerCase();
				break;
			case 'status':
				left = statusLabel(a.status).toLowerCase();
				right = statusLabel(b.status).toLowerCase();
				break;
			case 'name':
				left = (a.name || '').toLowerCase();
				right = (b.name || '').toLowerCase();
				break;
			case 'code':
			default:
				left = String(a.code || '');
				right = String(b.code || '');
				break;
		}

		const compare = typeof left === 'number' && typeof right === 'number'
			? left - right
			: String(left).localeCompare(String(right), undefined, { numeric: true });

		return sortDir === 'asc' ? compare : compare * -1;
	}));

	const filteredTotalAllocation = $derived(sortedAccounts.reduce((sum, account) => sum + allocationValue(account.allocation), 0));
	const chartAccounts = $derived([...sortedAccounts].sort((a, b) => allocationValue(b.allocation) - allocationValue(a.allocation)));
	const maxChartAllocation = $derived(chartAccounts.length ? Math.max(...chartAccounts.map((account) => allocationValue(account.allocation))) : 0);
	const groupSummaries = $derived([
		{ key: 'operating', label: 'Operating', accounts: filteredAccounts.filter((account) => account.groupType === 'operating') },
		{ key: 'reserve_treasury', label: 'Reserve & Treasury', accounts: filteredAccounts.filter((account) => account.groupType === 'reserve_treasury') },
		{ key: 'restricted', label: 'Restricted', accounts: filteredAccounts.filter((account) => account.groupType === 'restricted') },
	].map((group) => ({
		...group,
		total: group.accounts.reduce((sum, account) => sum + allocationValue(account.allocation), 0),
		count: group.accounts.length,
		tone: groupTone(group.key),
	})));
	const hasActiveFilters = $derived(Boolean(
		searchTerm.trim() ||
		selectedGroup !== 'all' ||
		selectedType !== 'all' ||
		selectedFlag !== 'all' ||
		minAllocation !== '' ||
		maxAllocation !== '' ||
		sortBy !== 'code' ||
		sortDir !== 'asc'
	));
</script>

<svelte:head>
	<title>Manage Bank Accounts - FliHub</title>
</svelte:head>

<div class="space-y-6 p-4 sm:p-6">
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<p class="text-xs uppercase tracking-wide text-slate-400 mb-1">Overview</p>
			<h1 class="text-2xl font-bold text-white flex items-center gap-2">
				<Landmark class="size-6 text-amber-400" />
				Manage Bank Accounts
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				QuickBooks payment account targets and treasury allocation structure.
			</p>
		</div>
		<Card class="px-4 py-3 border-amber-700/40 bg-amber-950/20">
			<p class="text-[10px] uppercase tracking-wide text-amber-300">Total Allocation</p>
			<p class="text-lg font-semibold text-amber-100">{fmt(data.totalAllocation)}</p>
		</Card>
		<Card class="px-4 py-3 border-slate-700/60 bg-slate-900/60 min-w-[320px]">
			<div class="flex items-center justify-between gap-2 mb-2">
				<p class="text-[10px] uppercase tracking-wide text-slate-400">Seed Reset</p>
				<button
					type="button"
					onclick={() => (seedResetOpen = !seedResetOpen)}
					class="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/60"
				>
					{seedResetOpen ? 'Collapse' : 'Open'}
					<svelte:component this={seedResetOpen ? ArrowUp : ArrowDown} class="size-3" />
				</button>
			</div>
			{#if seedResetOpen}
			<form method="POST" action="?/resetToSeedTarget" class="space-y-2">
				<div class="grid grid-cols-2 gap-2">
					<label class="space-y-1">
						<span class="text-[10px] uppercase tracking-wide text-slate-500">Target Total</span>
						<input
							type="number"
							name="targetTotal"
							min="0"
							step="1"
							bind:value={seedTargetTotal}
							class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
						/>
					</label>
					<label class="space-y-1">
						<span class="text-[10px] uppercase tracking-wide text-slate-500">Anchor Code</span>
						<input
							type="text"
							name="anchorCode"
							bind:value={seedAnchorCode}
							class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
						/>
					</label>
				</div>
				<div>
					<label class="space-y-1">
						<span class="text-[10px] uppercase tracking-wide text-slate-500">Reason</span>
						<input
							type="text"
							name="reason"
							placeholder="Seed funding reset after fees"
							required
							class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
						/>
					</label>
				</div>
				<div>
					<label class="space-y-1">
						<span class="text-[10px] uppercase tracking-wide text-slate-500">Type RESET to confirm</span>
						<input
							type="text"
							name="confirmText"
							placeholder="RESET"
							required
							class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
						/>
					</label>
				</div>
				<p class="text-[10px] text-slate-500">
					Resets the anchor account so active allocations add up to the target total.
				</p>
				<button type="submit" class="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500">
					Reset to Seed Target
				</button>
			</form>
			{:else}
			<p class="text-xs text-slate-500">
				Reset the anchor account so active allocations match your funded target.
			</p>
			{/if}
		</Card>
	</div>

	<Card class="border-slate-700/70 bg-slate-900/40 p-4 space-y-4">
		{#if form?.error}
			<div class="rounded-md border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
				{form.error}
			</div>
		{/if}
		{#if form?.success}
			<div class="rounded-md border border-emerald-700/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
				{form.message || 'Allocation override saved.'}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Search</span>
				<div class="relative">
					<Search class="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Code, account, purpose..."
						class="w-full rounded-md border border-slate-700 bg-slate-950/50 pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500"
					/>
				</div>
			</label>

			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Group</span>
				<select bind:value={selectedGroup} class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500">
					<option value="all">All Groups</option>
					<option value="operating">Operating</option>
					<option value="reserve_treasury">Reserve & Treasury</option>
					<option value="restricted">Restricted</option>
				</select>
			</label>

			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Type</span>
				<select bind:value={selectedType} class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500">
					<option value="all">All Types</option>
					{#each accountTypes as accountType}
						<option value={accountType}>{typeLabel(accountType)}</option>
					{/each}
				</select>
			</label>

			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Flags</span>
				<select bind:value={selectedFlag} class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500">
					<option value="all">All</option>
					<option value="restricted">Restricted Only</option>
					<option value="interest">Interest Bearing Only</option>
					<option value="unflagged">No Flags</option>
				</select>
			</label>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Min Allocation</span>
				<input type="number" min="0" bind:value={minAllocation} placeholder="0" class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500" />
			</label>
			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Max Allocation</span>
				<input type="number" min="0" bind:value={maxAllocation} placeholder="1000000" class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500" />
			</label>

			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Sort By</span>
				<select bind:value={sortBy} class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500">
					<option value="code">Code</option>
					<option value="name">Account</option>
					<option value="groupType">Group</option>
					<option value="accountType">Type</option>
					<option value="purpose">Purpose</option>
					<option value="allocation">Allocation</option>
					<option value="status">Status</option>
				</select>
			</label>

			<label class="space-y-1">
				<span class="text-[11px] uppercase tracking-wide text-slate-400">Direction</span>
				<select bind:value={sortDir} class="w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500">
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
			</label>

			<div class="xl:col-span-2 flex flex-wrap gap-2">
				<button
					type="button"
					onclick={clearFilters}
					class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-800/60"
					disabled={!hasActiveFilters}
				>
					<X class="size-4" /> Clear
				</button>
				<div class="rounded-md border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-sm">
					<span class="text-emerald-300/90">Filtered Total:</span>
					<span class="ml-1 font-semibold text-emerald-100">{fmt(filteredTotalAllocation)}</span>
				</div>
				<div class="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
					{sortedAccounts.length} / {accounts.length} accounts
				</div>
			</div>
		</div>
	</Card>

	<div class="flex items-center justify-between gap-3 flex-wrap">
		<div>
			<p class="text-[10px] uppercase tracking-[0.26em] text-slate-500">View</p>
			<p class="text-sm text-slate-400 mt-1">Switch between the visual allocation chart and the full account table.</p>
		</div>
		<div class="inline-flex rounded-xl border border-slate-700 bg-slate-900/60 p-1">
			<button
				type="button"
				onclick={() => (viewMode = 'chart')}
				class={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${viewMode === 'chart' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
			>
				<BarChart2 class="size-4" /> Chart
			</button>
			<button
				type="button"
				onclick={() => (viewMode = 'table')}
				class={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}
			>
				<Table2 class="size-4" /> Table
			</button>
		</div>
	</div>

	{#if viewMode === 'chart'}
	<Card class="border-slate-700/70 bg-slate-900/40 p-4 lg:p-5 space-y-5 overflow-hidden">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-1">Allocation Chart</p>
				<h2 class="text-lg font-semibold text-white">Bank Account Balances at a Glance</h2>
				<p class="text-sm text-slate-400 mt-1">Visual breakdown of the currently filtered account allocations.</p>
			</div>
			<div class="rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 min-w-[220px]">
				<p class="text-[10px] uppercase tracking-wide text-slate-500">Largest Visible Account</p>
				{#if chartAccounts[0]}
					<p class="mt-1 text-sm font-medium text-white">{chartAccounts[0].code} · {chartAccounts[0].name}</p>
					<p class="text-xl font-semibold text-amber-200 mt-1">{fmt(allocationValue(chartAccounts[0].allocation))}</p>
				{:else}
					<p class="mt-1 text-sm text-slate-400">No accounts in the current filter.</p>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			{#each groupSummaries as group}
				<div class={`rounded-xl border px-4 py-3 ${group.tone.chip}`}>
					<div class="flex items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<span class={`size-2.5 rounded-full ${group.tone.dot}`}></span>
							<p class="text-sm font-medium">{group.label}</p>
						</div>
						<p class="text-xs uppercase tracking-wide opacity-80">{group.count} account{group.count === 1 ? '' : 's'}</p>
					</div>
					<p class="mt-3 text-2xl font-semibold text-white">{fmt(group.total)}</p>
				</div>
			{/each}
		</div>

		{#if chartAccounts.length > 0}
			<div class="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] p-4 lg:p-5">
				<div class="flex items-center justify-between gap-3 mb-4">
					<p class="text-xs uppercase tracking-[0.24em] text-slate-400">Allocation Distribution</p>
					<p class="text-xs text-slate-500">Scaled to {fmt(maxChartAllocation)}</p>
				</div>
				<div class="space-y-3">
					{#each chartAccounts as account}
						{@const tone = groupTone(account.groupType)}
						{@const allocation = allocationValue(account.allocation)}
						{@const widthPercent = maxChartAllocation > 0 ? Math.max((allocation / maxChartAllocation) * 100, allocation > 0 ? 4 : 0) : 0}
						<div class="grid grid-cols-[minmax(0,220px)_minmax(0,1fr)_110px] gap-3 items-center">
							<div class="min-w-0">
								<div class="flex items-center gap-2 min-w-0">
									<span class={`size-2.5 rounded-full shrink-0 ${tone.dot}`}></span>
									<p class="truncate text-sm font-medium text-slate-100">{account.code} · {account.name}</p>
								</div>
								<p class="mt-1 text-xs text-slate-500 truncate">{groupLabel(account.groupType)} · {typeLabel(account.accountType)}</p>
							</div>
							<div class="relative h-10 rounded-xl border border-slate-800/90 bg-slate-950/70 overflow-hidden">
								<div class="absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r {tone.bar} shadow-[0_0_30px_rgba(245,158,11,0.18)]" style={`width:${widthPercent}%`}></div>
							<div class="absolute inset-0 flex items-center px-3">
								{#if allocation > 0}
									<span class="text-[11px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{((allocation / (filteredTotalAllocation || 1)) * 100).toFixed(1)}% of visible total</span>
								{:else}
									<span class="text-[11px] text-slate-500">No allocation</span>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-semibold text-white">{fmt(allocation)}</p>
								<p class="text-[11px] text-slate-500">{statusLabel(account.status)}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
				Adjust the filters to display account allocations in the chart.
			</div>
		{/if}
	</Card>
	{/if}

	{#if viewMode === 'table'}
	<Card class="overflow-hidden border-slate-700/70 bg-slate-900/40">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[1040px] text-sm">
				<thead class="bg-slate-800/70 text-slate-300">
					<tr>
						<th class="text-left px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('code')}>
								Code
								<svelte:component this={sortIcon('code')} class="size-3.5" />
							</button>
						</th>
						<th class="text-left px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('name')}>
								Account
								<svelte:component this={sortIcon('name')} class="size-3.5" />
							</button>
						</th>
						<th class="text-left px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('groupType')}>
								Group
								<svelte:component this={sortIcon('groupType')} class="size-3.5" />
							</button>
						</th>
						<th class="text-left px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('accountType')}>
								Type
								<svelte:component this={sortIcon('accountType')} class="size-3.5" />
							</button>
						</th>
						<th class="text-left px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('purpose')}>
								Purpose
								<svelte:component this={sortIcon('purpose')} class="size-3.5" />
							</button>
						</th>
						<th class="text-right px-4 py-3 font-semibold">
							<button type="button" class="inline-flex items-center gap-1 hover:text-white" onclick={() => toggleSort('allocation')}>
								Allocation
								<svelte:component this={sortIcon('allocation')} class="size-3.5" />
							</button>
						</th>
						<th class="text-left px-4 py-3 font-semibold">Flags</th>
						<th class="text-left px-4 py-3 font-semibold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if sortedAccounts.length === 0}
						<tr>
							<td colspan="8" class="px-4 py-8 text-center text-slate-400">No bank accounts match these filters.</td>
						</tr>
					{:else}
						{#each sortedAccounts as account}
							<tr class="border-t border-slate-800/80 text-slate-200 transition-colors duration-150 hover:bg-slate-800/45">
								<td class="px-4 py-3 font-mono text-xs text-slate-300">{account.code}</td>
								<td class="px-4 py-3 font-medium">{account.name}</td>
								<td class="px-4 py-3">{groupLabel(account.groupType)}</td>
								<td class="px-4 py-3">{typeLabel(account.accountType)}</td>
								<td class="px-4 py-3 text-slate-400">{account.purpose || '—'}</td>
								<td class="px-4 py-3 text-right font-semibold">{fmt(Number(account.allocation || 0))}</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1.5">
										{#if account.isRestricted}
											<span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] border border-rose-600/50 bg-rose-950/30 text-rose-300">
												<ShieldCheck class="size-3" /> Restricted
											</span>
										{/if}
										{#if account.isInterestBearing}
											<span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] border border-emerald-600/50 bg-emerald-950/30 text-emerald-300">
												<Wallet class="size-3" /> Interest Bearing
											</span>
										{/if}
										{#if !account.isRestricted && !account.isInterestBearing}
											<span class="text-xs text-slate-500">—</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 align-top">
									{#if overrideOpenId !== account.id}
										<button
											type="button"
											onclick={() => (overrideOpenId = account.id)}
											class="inline-flex items-center rounded-md border border-amber-700/50 bg-amber-950/20 px-2.5 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/40"
										>
											Override
										</button>
									{:else}
										<form method="POST" action="?/overrideAllocation" class="space-y-2 w-64 rounded-md border border-amber-700/40 bg-amber-950/20 p-2.5">
											<input type="hidden" name="accountId" value={account.id} />
											<div>
												<label for={`override-amount-${account.id}`} class="block text-[10px] uppercase tracking-wide text-amber-300 mb-1">New Amount</label>
												<input
													id={`override-amount-${account.id}`}
													type="number"
													name="newAllocation"
													min="0"
													step="1"
													value={allocationValue(account.allocation)}
													required
													class="w-full rounded-md border border-amber-700/40 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100"
												/>
											</div>

											<div>
												<label for={`override-reason-${account.id}`} class="block text-[10px] uppercase tracking-wide text-amber-300 mb-1">Reason</label>
												<input
													id={`override-reason-${account.id}`}
													type="text"
													name="reason"
													placeholder="Why this manual override is needed"
													required
													class="w-full rounded-md border border-amber-700/40 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100"
												/>
											</div>

											<div>
												<label for={`override-confirm-${account.id}`} class="block text-[10px] uppercase tracking-wide text-amber-300 mb-1">Type OVERRIDE to confirm</label>
												<input
													id={`override-confirm-${account.id}`}
													type="text"
													name="confirmText"
													placeholder="OVERRIDE"
													required
													class="w-full rounded-md border border-amber-700/40 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100"
												/>
											</div>

											<div class="flex items-center gap-2 pt-1">
												<button type="submit" class="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-500">Save</button>
												<button type="button" onclick={() => (overrideOpenId = null)} class="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800">Cancel</button>
											</div>
										</form>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
				<tfoot>
					<tr class="border-t-2 border-amber-700/50 bg-amber-950/20 text-amber-100">
						<td class="px-4 py-3 font-semibold" colspan="5">Table Total</td>
						<td class="px-4 py-3 text-right font-bold">{fmt(filteredTotalAllocation)}</td>
						<td class="px-4 py-3 text-xs text-amber-300/80">—</td>
						<td class="px-4 py-3 text-xs text-amber-300/80">—</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</Card>
	{/if}
</div>
