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
		LayoutGrid,
		Table
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let selectedVendor = $state<any>(null);
	let viewMode = $state<'grid' | 'table'>('table');
	
	function handleRowClick(vendor: any) {
		selectedVendor = vendor;
		showEditModal = true;
	}
	
	let vendors = $derived(data.vendors || []);
	let stats = $derived(data.stats);
	
	// Console log for debugging - wrapped in $effect to avoid state_referenced_locally error
	$effect(() => {
		console.log('Vendors page data:', {
			vendorsCount: vendors.length,
			stats,
			firstVendor: vendors[0],
			error: data.error
		});
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
</script>

<svelte:head>
	<title>Vendors - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<!-- Error Message for Vendor Users without Assignment -->
	{#if data.error && data.isVendorUser}
		<Card class="p-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
			<div class="flex items-start gap-3">
				<XCircle class="size-5 text-orange-600 dark:text-orange-400 mt-0.5" />
				<div>
					<h3 class="font-semibold text-orange-900 dark:text-orange-100 mb-1">No Vendor Assigned</h3>
					<p class="text-sm text-orange-800 dark:text-orange-200">{data.error}</p>
				</div>
			</div>
		</Card>
	{/if}

	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold mb-2">
				{data.isVendorUser ? 'My Vendor' : 'Vendors'}
			</h1>
			<p class="text-muted-foreground">
				{data.isVendorUser ? 'View your vendor information' : 'Manage suppliers and service providers'}
			</p>
		</div>
		{#if !data.isVendorUser}
			<Button class="gap-2" onclick={() => showAddModal = true}>
				<Plus class="size-4" />
				Add Vendor
			</Button>
		{/if}
	</div>

	<!-- Add Vendor Modal -->
	<AddVendorModal bind:open={showAddModal} />
	
	<!-- Edit Vendor Modal -->
	{#if selectedVendor}
		<EditVendorModal bind:open={showEditModal} vendor={selectedVendor} />
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

	<!-- Filters and View Toggle -->
	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-4">
			<div class="relative flex-1 max-w-md">
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
				class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				{#each vendorTypes as type}
					<option value={type.value}>{type.label}</option>
				{/each}
			</select>
			
			<!-- View Mode Toggle -->
			<div class="flex gap-2">
				<Button 
					variant={viewMode === 'table' ? 'default' : 'outline'} 
					size="icon"
					onclick={() => viewMode = 'table'}
				>
					<Table class="size-4" />
				</Button>
				<Button 
					variant={viewMode === 'grid' ? 'default' : 'outline'} 
					size="icon"
					onclick={() => viewMode = 'grid'}
				>
					<LayoutGrid class="size-4" />
				</Button>
			</div>
		</div>
		
		<!-- Status Filter Tabs -->
		<div>
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="button"
			/>
		</div>
	</div>

	<!-- Vendors Display -->
	{#if filteredVendors.length === 0}
		<Card class="p-12 text-center">
			<div class="flex flex-col items-center gap-4">
				<Search class="size-12 text-muted-foreground" />
				<div>
					<h3 class="text-lg font-semibold mb-1">
						{vendors.length === 0 ? 'No vendors yet' : 'No vendors found'}
					</h3>
					<p class="text-sm text-muted-foreground">
						{vendors.length === 0 
							? 'Add your first vendor to get started' 
							: 'Try adjusting your search or filters'}
					</p>
				</div>
			</div>
		</Card>
	{:else if viewMode === 'grid'}
		<!-- Grid View -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredVendors as vendor}
				<Card class="p-6 hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-1">{vendor.name || 'Unnamed Vendor'}</h3>
							<div class="flex items-center gap-2 mb-2">
								{#if vendor.type}
									<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
										{vendorTypes.find(t => t.value === vendor.type)?.label || vendor.type}
									</span>
								{/if}
							</div>
							{#if vendor.about}
								<p class="text-sm text-muted-foreground line-clamp-2">{vendor.about}</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#if vendor.active}
								<CheckCircle2 class="size-5 text-green-500" />
							{:else}
								<XCircle class="size-5 text-red-500" />
							{/if}
						</div>
					</div>

					<div class="space-y-3 mb-4">
						{#if vendor.contact_email}
							<a 
								href="mailto:{vendor.contact_email}" 
								class="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
							>
								<Mail class="size-4 group-hover:text-primary transition-colors" />
								<span class="truncate">{vendor.contact_email}</span>
							</a>
						{/if}
						
						{#if vendor.contact_phone}
							<a 
								href="tel:{vendor.contact_phone}" 
								class="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
							>
								<Phone class="size-4 group-hover:text-primary transition-colors" />
								<span>{vendor.contact_phone}</span>
							</a>
						{/if}
						
						{#if vendor.website}
							<a 
								href={vendor.website}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
							>
								<Globe class="size-4 group-hover:text-primary transition-colors" />
								<span class="truncate">Website</span>
							</a>
						{/if}
					</div>

					{#if vendor.open_invoices_total && vendor.open_invoices_total > 0}
						<div class="pt-4 border-t">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Open Invoices</span>
								<span class="text-sm font-semibold text-orange-600 dark:text-orange-400">
									{formatCurrency(vendor.open_invoices_total)}
								</span>
							</div>
						</div>
					{/if}

					{#if vendor.created}
						<div class="pt-3 text-xs text-muted-foreground">
							Added {formatDate(vendor.created)}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{:else}
		<!-- Table View -->
		<Card class="overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-slate-50 dark:bg-slate-900 border-b">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Vendor Name
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Contact
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Type
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Status
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Open Invoices
							</th>
							<th class="px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
								Website
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200 dark:divide-slate-800">
						{#each filteredVendors as vendor, i}
							<tr 
								class="hover:bg-green-800 dark:hover:bg-green-800/50 transition-colors cursor-pointer {i % 2 === 1 ? 'bg-blue-800 dark:bg-blue-800/30' : ''}"
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
									{#if vendor.address}
										<div class="text-muted-foreground text-xs mt-1">
											{vendor.address}
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if vendor.type}
										<span class="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
											{vendorTypes.find(t => t.value === vendor.type)?.label || vendor.type}
										</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									{#if vendor.active}
										<div class="flex items-center gap-2 text-green-600 dark:text-green-400">
											<CheckCircle2 class="size-4" />
											<span class="text-sm font-medium">Active</span>
										</div>
									{:else}
										<div class="flex items-center gap-2 text-red-600 dark:text-red-400">
											<XCircle class="size-4" />
											<span class="text-sm font-medium">Inactive</span>
										</div>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm font-medium">
									{#if vendor.open_invoices_total && vendor.open_invoices_total > 0}
										<span class="text-orange-600 dark:text-orange-400">
											{formatCurrency(vendor.open_invoices_total)}
										</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm">
									{#if vendor.website}
										<a 
											href={vendor.website} 
											target="_blank" 
											rel="noopener noreferrer"
											onclick={(e) => e.stopPropagation()}
											class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
										>
											<Globe class="size-3" />
											Visit
										</a>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>
