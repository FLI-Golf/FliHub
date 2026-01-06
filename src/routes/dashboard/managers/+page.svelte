<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import AddManagerModal from '$lib/components/managers/add-manager-modal.svelte';
	import { 
		Mail, 
		Phone, 
		Building2, 
		User, 
		Calendar, 
		Shield, 
		Search,
		ShieldCheck,
		Users,
		Store,
		Award,
		Home,
		CheckCircle2,
		XCircle,
		Clock,
		Trash2,
		Plus
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	const roleOptions = [
		{ value: 'leader', label: 'Leader' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'vendor', label: 'Vendor' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'franchise_owner', label: 'Franchise Owner' }
	];
	
	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'pending', label: 'Pending' }
	];
	
	let searchQuery = $state('');
	let roleFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let updating = $state<Record<string, boolean>>({});
	let sheetOpen = $state(false);
	let selectedManager = $state<any>(null);
	let showAddModal = $state(false);
	
	// Form state
	let editForm = $state({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		organization: '',
		role: '',
		status: '',
		vendorId: '',
		departmentId: ''
	});
	
	let showVendorField = $derived(editForm.role === 'vendor');
	let showDepartmentField = $derived(editForm.role === 'leader');
	
	// Get counts for each role
	function getRoleCount(role: string): number {
		return data.managers.filter(m => m.role === role).length;
	}
	
	// Get counts for each status
	function getStatusCount(status: string): number {
		return data.managers.filter(m => m.status === status).length;
	}
	
	// Filter managers based on search query, role, and status
	const filteredManagers = $derived(
		data.managers.filter(manager => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const fullName = `${manager.firstName} ${manager.lastName}`.toLowerCase();
				const email = manager.email?.toLowerCase() || '';
				const organization = manager.organization?.toLowerCase() || '';
				const role = manager.role.toLowerCase();
				
				const matchesSearch = fullName.includes(query) || 
					   email.includes(query) || 
					   organization.includes(query) ||
					   role.includes(query);
				
				if (!matchesSearch) return false;
			}
			
			// Role filter
			if (roleFilter !== 'all' && manager.role !== roleFilter) {
				return false;
			}
			
			// Status filter
			if (statusFilter !== 'all' && manager.status !== statusFilter) {
				return false;
			}
			
			return true;
		})
	);
	
	// Build role tabs
	let roleTabs = $derived([
		{ value: 'all', label: 'All Roles', count: data.managers.length },
		{ value: 'admin', label: 'Admin', count: getRoleCount('admin'), icon: ShieldCheck },
		{ value: 'leader', label: 'Leader', count: getRoleCount('leader'), icon: Users },
		{ value: 'vendor', label: 'Vendor', count: getRoleCount('vendor'), icon: Store },
		{ value: 'pro', label: 'Pro', count: getRoleCount('pro'), icon: Award },
		{ value: 'franchise_owner', label: 'Franchise Owner', count: getRoleCount('franchise_owner'), icon: Home }
	]);
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All Status', count: data.managers.length },
		{ value: 'active', label: 'Active', count: getStatusCount('active'), icon: CheckCircle2 },
		{ value: 'inactive', label: 'Inactive', count: getStatusCount('inactive'), icon: XCircle },
		{ value: 'pending', label: 'Pending', count: getStatusCount('pending'), icon: Clock }
	]);
	
	function openEditSheet(manager: any) {
		selectedManager = manager;
		editForm = {
			firstName: manager.firstName || '',
			lastName: manager.lastName || '',
			email: manager.email || '',
			phone: manager.phone || '',
			organization: manager.organization || '',
			role: manager.role || '',
			status: manager.status || '',
			vendorId: manager.vendorId || '',
			departmentId: manager.departmentId || ''
		};
		sheetOpen = true;
	}
	
	function handleOpenChange(newOpen: boolean) {
		sheetOpen = newOpen;
	}
	
	async function saveManager() {
		if (!selectedManager) return;
		
		updating[selectedManager.id] = true;
		
		try {
			// Update user profile with role and assignments
			const response = await fetch('/api/user-profiles/update-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: selectedManager.id,
					role: editForm.role,
					vendorId: editForm.vendorId || null,
					departmentId: editForm.departmentId || null
				})
			});
			
			if (response.ok) {
				sheetOpen = false;
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to update manager');
			}
		} catch (error) {
			console.error('Error updating manager:', error);
			alert('Failed to update manager');
		} finally {
			updating[selectedManager.id] = false;
		}
	}
	
	async function deleteManager() {
		if (!selectedManager) return;
		
		const managerName = `${selectedManager.firstName} ${selectedManager.lastName}`;
		if (!confirm(`Are you sure you want to delete ${managerName}? This action cannot be undone.`)) {
			return;
		}
		
		updating[selectedManager.id] = true;
		
		try {
			const response = await fetch(`/api/user-profiles/${selectedManager.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				sheetOpen = false;
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to delete manager');
			}
		} catch (error) {
			console.error('Error deleting manager:', error);
			alert('Failed to delete manager');
		} finally {
			updating[selectedManager.id] = false;
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function getRoleColor(role: string) {
		switch (role) {
			case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
			case 'leader': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
			case 'vendor': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
			case 'pro': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
			case 'franchise_owner': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
			default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>{data.isAdmin ? 'Managers - Update Role' : 'Managers'} - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<div class="flex flex-col gap-6 mb-6">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold">Managers - Update Role</h1>
				<p class="text-muted-foreground mt-1">
					{filteredManagers.length} of {data.managers.length} {data.isAdmin ? 'users' : 'team members'}
				</p>
			</div>
			{#if data.isAdmin}
				<Button onclick={() => showAddModal = true} class="cursor-pointer">
					<Plus class="size-4 mr-2" />
					Add Manager
				</Button>
			{/if}
		</div>
		
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by name, email, department, or role..."
				bind:value={searchQuery}
				class="pl-10"
			/>
		</div>
		
		<!-- Role Filter Tabs -->
		<div>
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Role</h3>
			<VisualTabs
				tabs={roleTabs}
				activeTab={roleFilter}
				onTabChange={(v) => roleFilter = v}
				variant="button"
			/>
		</div>
		
		<!-- Status Filter Tabs -->
		<div>
			<h3 class="text-sm font-medium text-muted-foreground mb-3">Filter by Status</h3>
			<VisualTabs
				tabs={statusTabs}
				activeTab={statusFilter}
				onTabChange={(v) => statusFilter = v}
				variant="pill"
			/>
		</div>
	</div>

	{#if filteredManagers.length === 0}
		<Card class="p-12 text-center">
			<div class="flex flex-col items-center gap-4">
				<Search class="size-12 text-muted-foreground" />
				<div>
					<h3 class="text-lg font-semibold mb-1">No users found</h3>
					<p class="text-sm text-muted-foreground">
						Try adjusting your search query
					</p>
				</div>
			</div>
		</Card>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each filteredManagers as manager, index}
			<button 
				type="button"
				onclick={() => openEditSheet(manager)}
				class="text-left w-full cursor-pointer block"
			>
			<Card 
				class="p-6 transition-all duration-200 hover:shadow-xl hover:ring-2 hover:ring-primary {index % 2 === 0 ? '!bg-background hover:!bg-slate-500 dark:hover:!bg-slate-500' : '!bg-muted/50 hover:!bg-slate-600 dark:hover:!bg-slate-400'}"
			>
				<div class="flex items-start justify-between mb-4">
					<div class="flex-1">
						<h3 class="text-xl font-bold mb-1">{manager.firstName} {manager.lastName}</h3>
						{#if manager.organization}
							<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
								<Building2 class="size-4" />
								<span>{manager.organization}</span>
							</div>
						{/if}
					</div>
					<div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide">
						{manager.status}
					</div>
				</div>

				<div class="space-y-3 mb-4">
					{#if manager.email}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Mail class="size-4" />
							<span class="truncate">{manager.email}</span>
						</div>
					{/if}
					
					{#if manager.phone}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Phone class="size-4" />
							<span>{manager.phone}</span>
						</div>
					{/if}
					
					{#if manager.created}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Calendar class="size-4" />
							<span>Joined {formatDate(manager.created)}</span>
						</div>
					{/if}
				</div>

				<div class="pt-4 border-t">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium flex items-center gap-2">
							<Shield class="size-4" />
							Role
						</label>
						<span class="px-2.5 py-1 rounded-full text-xs font-medium {getRoleColor(manager.role)}">
							{roleOptions.find(r => r.value === manager.role)?.label || manager.role}
						</span>
					</div>
				</div>
			</Card>
			</button>
			{/each}
		</div>
	{/if}
</div>

<Sheet.Root open={sheetOpen} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<User class="size-5" />
				Edit Manager
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update manager information and role
			</Sheet.Description>
		</Sheet.Header>
		
		{#if selectedManager}
			<div class="space-y-6">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">First Name</label>
						<Input
							type="text"
							bind:value={editForm.firstName}
							placeholder="First name"
							disabled
							class="bg-slate-800 border-slate-700 text-white"
						/>
					</div>
					
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Last Name</label>
						<Input
							type="text"
							bind:value={editForm.lastName}
							placeholder="Last name"
							disabled
							class="bg-slate-800 border-slate-700 text-white"
						/>
					</div>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Email</label>
					<Input
						type="email"
						bind:value={editForm.email}
						placeholder="email@example.com"
						disabled
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Phone</label>
					<Input
						type="tel"
						bind:value={editForm.phone}
						placeholder="Phone number"
						disabled
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Organization</label>
					<Input
						type="text"
						bind:value={editForm.organization}
						placeholder="Organization"
						disabled
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200 flex items-center gap-2">
						<Shield class="size-4" />
						Role
					</label>
					<select
						bind:value={editForm.role}
						class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each roleOptions as option}
							<option value={option.value} class="bg-slate-800 text-white">{option.label}</option>
						{/each}
					</select>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Status</label>
					<select
						bind:value={editForm.status}
						class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled
					>
						{#each statusOptions as option}
							<option value={option.value} class="bg-slate-800 text-white">{option.label}</option>
						{/each}
					</select>
				</div>
				
				{#if showVendorField}
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Assigned Vendor</label>
						<select
							bind:value={editForm.vendorId}
							class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="" class="bg-slate-800 text-white">-- Select Vendor --</option>
							{#each data.vendors || [] as vendor}
								<option value={vendor.id} class="bg-slate-800 text-white">{vendor.name}</option>
							{/each}
						</select>
						<p class="text-xs text-slate-400">Link this user to a vendor account</p>
					</div>
				{/if}
				
				{#if showDepartmentField}
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Assigned Department</label>
						<select
							bind:value={editForm.departmentId}
							class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="" class="bg-slate-800 text-white">-- Select Department --</option>
							{#each data.departments || [] as department}
								<option value={department.id} class="bg-slate-800 text-white">{department.name}</option>
							{/each}
						</select>
						<p class="text-xs text-slate-400">Link this user to a department</p>
					</div>
				{/if}
				
				<div class="space-y-2 pt-4 border-t border-slate-700">
					<div class="flex items-center gap-2.5 text-sm text-slate-400">
						<User class="size-4" />
						<span>User ID: {selectedManager.userId}</span>
					</div>
					
					{#if selectedManager.created}
						<div class="flex items-center gap-2.5 text-sm text-slate-400">
							<Calendar class="size-4" />
							<span>Joined {formatDate(selectedManager.created)}</span>
						</div>
					{/if}
				</div>
			</div>
			
			<Sheet.Footer class="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-700">
				<Button
					onclick={saveManager}
					disabled={updating[selectedManager.id]}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white"
				>
					{updating[selectedManager.id] ? 'Saving...' : 'Save Changes'}
				</Button>
				
				<Button
					variant="outline"
					onclick={deleteManager}
					disabled={updating[selectedManager.id]}
					class="w-full bg-red-600 border-red-700 text-white hover:bg-red-700"
				>
					<Trash2 class="size-4 mr-2" />
					Delete Manager
				</Button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<AddManagerModal bind:open={showAddModal} vendors={data.vendors || []} departments={data.departments || []} />
