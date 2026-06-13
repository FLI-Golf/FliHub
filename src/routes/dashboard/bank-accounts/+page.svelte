<script lang="ts">
    import type { ActionData } from './$types';
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { ArrowDown, ArrowUp, ArrowUpDown, Landmark, Search, ShieldCheck, Wallet, X } from 'lucide-svelte';

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
			</table>
		</div>
	</Card>
</div>
