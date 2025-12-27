<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import { 
		Store, 
		Plus, 
		Search,
		Mail,
		Phone,
		Globe,
		DollarSign,
		CheckCircle2,
		XCircle
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let vendors = $derived(data.vendors || []);
	let stats = $derived(data.stats);
	
	let searchQuery = $state('');
	let statusFilter = $state<string>('all');
	
	// Filter vendors based on search and status
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
</script>

<svelte:head>
	<title>Vendors - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold mb-2">Vendors</h1>
			<p class="text-muted-foreground">Manage suppliers and service providers</p>
		</div>
		<Button class="gap-2">
			<Plus class="size-4" />
			Add Vendor
		</Button>
	</div>

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

	<!-- Filters -->
	<div class="flex flex-col gap-4">
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by name, email, or phone..."
				bind:value={searchQuery}
				class="pl-10"
			/>
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

	<!-- Vendors Grid -->
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
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredVendors as vendor}
				<Card class="p-6 hover:shadow-lg transition-shadow">
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h3 class="text-xl font-bold mb-1">{vendor.name || 'Unnamed Vendor'}</h3>
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
	{/if}
</div>
