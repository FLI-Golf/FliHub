<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import AddVendorModal from '$lib/components/vendors/add-vendor-modal.svelte';
	import EditVendorModal from '$lib/components/vendors/edit-vendor-modal.svelte';
	import { 
		Store, 
		Plus, 
		Search,
		Mail,
		Phone,
		Globe,
		DollarSign,
		CheckCircle2,
		XCircle,
		AlertTriangle
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let selectedVendor = $state<any>(null);
	
	function handleRowClick(vendor: any) {
		selectedVendor = vendor;
		showEditModal = true;
	}
	
	let vendors = $derived(data.vendors || []);
	let stats = $derived(data.stats || {
		total: 0,
		active: 0,
		inactive: 0,
		withOpenInvoices: 0,
		totalOpenInvoices: 0
	});
	
	let searchQuery = $state('');
	let statusFilter = $state<string>('all');
	let typeFilter = $state<string>('all');
	
	const vendorTypes = [
		{ value: 'all', label: 'All Types' },
		{ value: 'venue', label: 'Venue' },
		{ value: 'product_supplier', label: 'Product Supplier' },
		{ value: 'beverage', label: 'Beverage' },
		{ value: 'technology', label: 'Technology' },
		{ value: 'gaming', label: 'Gaming' },
		{ value: 'service_provider', label: 'Service Provider' }
	];
	
	// Filter vendors based on search, status, and type
	let filteredVendors = $derived(vendors.filter(vendor => {
		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const name = vendor.name?.toLowerCase() || '';
			const email = vendor.contact_email?.toLowerCase() || '';
			const phone = vendor.contact_phone?.toLowerCase() || '';
			
			const matchesSearch = name.includes(query) || 
				   email.includes(query) || 
				   phone.includes(query);
			
			if (!matchesSearch) return false;
		}
		
		// Status filter
		if (statusFilter === 'active' && !vendor.active) return false;
		if (statusFilter === 'inactive' && vendor.active) return false;
		
		// Type filter
		if (typeFilter !== 'all' && vendor.type !== typeFilter) return false;
		
		return true;
	}));
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All Vendors', count: vendors.length },
		{ value: 'active', label: 'Active', count: stats.active, icon: CheckCircle2 },
		{ value: 'inactive', label: 'Inactive', count: stats.inactive, icon: XCircle }
	]);

	let filteredOutstanding = $derived(filteredVendors.reduce((sum, v) => sum + (v.open_invoices_total || 0), 0));
	let filteredWithInvoices = $derived(filteredVendors.filter((v) => (v.open_invoices_total || 0) > 0).length);
	let filteredInactive = $derived(filteredVendors.filter((v) => !v.active).length);
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function stripHtml(html: string): string {
		if (!html) return '';
		// Use regex to strip HTML tags for SSR compatibility
		return html.replace(/<[^>]*>/g, '').trim();
	}

	function clearFilters() {
		searchQuery = '';
		statusFilter = 'all';
		typeFilter = 'all';
	}

	function statusToneClass(vendor: any): string {
		if (vendor.active) return 'border-l-emerald-500';
		return 'border-l-rose-500';
	}

	function typeLabel(type: string): string {
		return vendorTypes.find((t) => t.value === type)?.label || type;
	}

	function nextAction(vendor: any): string {
		if (!vendor.active) return 'Review status and reactivate if still engaged';
		if ((vendor.open_invoices_total || 0) > 0) return 'Clear outstanding invoices and confirm payment timeline';
		if (!vendor.contact_email && !vendor.contact_phone) return 'Add primary contact details';
		if (!vendor.website) return 'Add website and profile links for procurement';
		return 'Monitor delivery quality and maintain contact cadence';
	}
</script>

<svelte:head>
	<title>Vendors - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Error Message for Vendor Users without Assignment -->
	{#if data.error && data.isVendorUser}
		<Card class="p-6 border-amber-700/60 bg-amber-950/30">
			<div class="flex items-start gap-3">
				<XCircle class="size-5 text-amber-400 mt-0.5" />
				<div>
					<h3 class="font-semibold text-amber-100 mb-1">No Vendor Assigned</h3>
					<p class="text-sm text-amber-200/90">{data.error}</p>
				</div>
			</div>
		</Card>
	{/if}

	<Card class="p-6 bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-emerald-950/30 border-slate-700">
		<div class="flex flex-wrap justify-between items-center gap-4">
			<div>
				<h1 class="text-3xl font-bold mb-2 text-slate-100">{data.isVendorUser ? 'My Vendor' : 'Vendors'}</h1>
				<p class="text-slate-300">
					{data.isVendorUser ? 'View your vendor information' : 'Manage suppliers and service providers'}
				</p>
				<p class="text-xs text-slate-400 mt-1">Use filters and tabs below to quickly find vendor records requiring action.</p>
			</div>
			{#if !data.isVendorUser}
				<Button class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onclick={() => showAddModal = true}>
					<Plus class="size-4" />
					Add Vendor
				</Button>
			{/if}
		</div>
	</Card>

	<!-- Add Vendor Modal -->
	<AddVendorModal bind:open={showAddModal} />
	
	<!-- Edit Vendor Modal -->
	{#if selectedVendor}
		<EditVendorModal bind:open={showEditModal} vendor={selectedVendor} />
	{/if}

	{#if filteredInactive > 0 || filteredWithInvoices > 0}
		<div class="flex gap-4 flex-wrap">
			{#if filteredInactive > 0}
				<Card class="p-4 border-rose-700 bg-rose-950/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-rose-400" />
						<div>
							<p class="font-semibold text-rose-200">{filteredInactive} inactive {filteredInactive === 1 ? 'vendor' : 'vendors'}</p>
							<p class="text-sm text-rose-300/90">Review status and reactivation needs</p>
						</div>
					</div>
				</Card>
			{/if}
			{#if filteredWithInvoices > 0}
				<Card class="p-4 border-amber-700 bg-amber-950/20">
					<div class="flex items-center gap-3">
						<AlertTriangle class="size-5 text-amber-400" />
						<div>
							<p class="font-semibold text-amber-200">{filteredWithInvoices} {filteredWithInvoices === 1 ? 'vendor has' : 'vendors have'} open invoices</p>
							<p class="text-sm text-amber-300/90">Outstanding total: {formatCurrency(filteredOutstanding)}</p>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	{/if}

	<!-- Statistics -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Overview</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<MetricCard
				title="Total Vendors"
				value={stats.total}
				subtitle="{stats.active} active"
				icon={Store}
			/>
			
			<MetricCard
				title="Active Vendors"
				value={stats.active}
				subtitle="Currently working with"
				icon={CheckCircle2}
				variant="success"
			/>
			
			<MetricCard
				title="Open Invoices"
				value={stats.withOpenInvoices}
				subtitle="Vendors with pending payments"
				icon={DollarSign}
				variant="warning"
			/>
			
			<MetricCard
				title="Total Outstanding"
				value={formatCurrency(stats.totalOpenInvoices)}
				subtitle="Across all vendors"
				icon={DollarSign}
			/>
		</div>
	</div>

	<Card class="p-5 border-slate-700 bg-slate-900/40">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-300">Action Center</h2>
				<p class="text-xs text-slate-400 mt-1">Track vendor health, invoice risk, and contact readiness.</p>
			</div>
			<div class="flex flex-wrap gap-2 text-xs">
				<span class="px-2.5 py-1 rounded-full border border-amber-700/50 bg-amber-900/30 text-amber-300">
					{filteredWithInvoices} with open invoices
				</span>
				<span class="px-2.5 py-1 rounded-full border border-rose-700/50 bg-rose-900/30 text-rose-300">
					{filteredInactive} inactive
				</span>
				<span class="px-2.5 py-1 rounded-full border border-blue-700/50 bg-blue-900/30 text-blue-300">
					{filteredVendors.length} visible
				</span>
			</div>
		</div>
	</Card>

	<!-- Search and Filters -->
	<div class="rounded-xl border border-slate-700 bg-slate-900/30 p-4">
		<div class="flex flex-wrap gap-3 items-center justify-between">
			<div class="relative max-w-md w-full">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name, email, or phone..."
					bind:value={searchQuery}
					class="pl-10 text-white placeholder:text-slate-400"
				/>
			</div>

			<!-- Type Filter -->
			<select
				bind:value={typeFilter}
				class="flex h-10 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
			>
				{#each vendorTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>

			{#if searchQuery || statusFilter !== 'all' || typeFilter !== 'all'}
				<Button variant="outline" class="border-slate-600 text-slate-300" onclick={clearFilters}>Clear Filters</Button>
			{/if}
		</div>

		<!-- Status Filter Tabs -->
		<div class="mt-4">
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="button"
			/>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-3">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Status</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/30"><span class="size-2 rounded-full bg-emerald-400"></span>Active</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-rose-700/50 text-rose-300 bg-rose-900/30"><span class="size-2 rounded-full bg-rose-400"></span>Inactive</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Invoice Risk</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 bg-slate-800/70"><span class="size-2 rounded-full bg-slate-400"></span>No Open Invoices</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-amber-700/50 text-amber-300 bg-amber-900/30"><span class="size-2 rounded-full bg-amber-400"></span>Outstanding Balance</span>
			</div>
		</div>
	</div>

	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold">All Vendors</h2>
		<div class="text-sm text-muted-foreground">
			Showing {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'} •
			Outstanding: <span class="font-semibold text-slate-200">{formatCurrency(filteredOutstanding)}</span>
		</div>
	</div>

	<!-- Vendors Table -->
	<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-900 border-b border-slate-700">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Vendor Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Financial
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Contact
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Activity
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-200 uppercase tracking-wider">
								Next Action
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#if filteredVendors.length === 0}
							<tr>
								<td colspan="7" class="px-6 py-8 text-center text-foreground">
									{#if vendors.length === 0}
										No vendors found. Add your first vendor to get started.
									{:else}
										No vendors match the selected filters.
									{/if}
								</td>
							</tr>
						{:else}
						{#each filteredVendors as vendor, i}
							<tr 
								class="border-l-4 {statusToneClass(vendor)} hover:bg-slate-800/60 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-slate-900/40' : ''}"
								onclick={() => handleRowClick(vendor)}
							>
								<td class="px-6 py-4">
									<div class="font-medium">{vendor.name || 'Unnamed Vendor'}</div>
									{#if vendor.about}
										<div class="text-sm text-muted-foreground truncate max-w-xs">
											{stripHtml(vendor.about)}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if vendor.type}
										<span class="px-2 py-1 rounded-full border border-blue-700/50 bg-blue-900/30 text-blue-300 text-xs font-medium">
											{typeLabel(vendor.type)}
										</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									{#if vendor.active}
										<div class="flex items-center gap-2 text-emerald-400">
											<CheckCircle2 class="size-4" />
											<span class="text-sm font-medium">Active</span>
										</div>
									{:else}
										<div class="flex items-center gap-2 text-rose-400">
											<XCircle class="size-4" />
											<span class="text-sm font-medium">Inactive</span>
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if vendor.open_invoices_total && vendor.open_invoices_total > 0}
										<div class="font-semibold text-amber-300">{formatCurrency(vendor.open_invoices_total)}</div>
										<div class="text-[11px] text-amber-400">Outstanding balance</div>
									{:else}
										<div class="font-semibold text-emerald-300">{formatCurrency(0)}</div>
										<div class="text-[11px] text-emerald-400">No open invoices</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if vendor.contact_name}
										<div class="font-medium mb-1">{vendor.contact_name}</div>
									{/if}
									{#if vendor.contact_email}
										<a 
											href="mailto:{vendor.contact_email}" 
											onclick={(e) => e.stopPropagation()}
											class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-xs font-medium transition-colors mb-1"
										>
											<Mail class="size-3" />
											{vendor.contact_email}
										</a>
									{/if}
									{#if vendor.contact_phone}
										<a 
											href="tel:{vendor.contact_phone}" 
											onclick={(e) => e.stopPropagation()}
											class="text-muted-foreground hover:text-foreground block"
										>
											{vendor.contact_phone}
										</a>
									{/if}
									{#if vendor.website}
										<a 
											href={vendor.website} 
											target="_blank" 
											rel="noopener noreferrer"
											onclick={(e) => e.stopPropagation()}
											class="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
										>
											<Globe class="size-3" />
											Website
										</a>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{#if vendor.created}
										<div>Added {formatDate(vendor.created)}</div>
									{/if}
									{#if vendor.updated && vendor.updated !== vendor.created}
										<div class="text-xs text-slate-500 mt-0.5">Updated {formatDate(vendor.updated)}</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-slate-300 max-w-xs">
									{nextAction(vendor)}
								</td>
							</tr>
						{/each}
						{/if}
					</tbody>
				</table>
			</div>
	</Card>
</div>
