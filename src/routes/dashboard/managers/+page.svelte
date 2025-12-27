<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
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
		Clock
	} from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	const roleOptions = [
		{ value: 'leader', label: 'Leader' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'vendor', label: 'Vendor' },
		{ value: 'pro', label: 'Pro' },
		{ value: 'franchise_owner', label: 'Franchise Owner' }
	];
	
	let searchQuery = $state('');
	let roleFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let updating = $state<Record<string, boolean>>({});
	
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
	
	async function updateRole(managerId: string, newRole: string, currentRole: string) {
		if (newRole === currentRole) return;
		
		updating[managerId] = true;
		
		try {
			const response = await fetch('/api/user-profiles/update-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ profileId: managerId, role: newRole })
			});
			
			if (response.ok) {
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to update role');
			}
		} catch (error) {
			console.error('Error updating role:', error);
			alert('Failed to update role');
		} finally {
			updating[managerId] = false;
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
				<Button>Add User</Button>
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
			<Card class="p-6 hover:shadow-lg transition-shadow {index % 2 === 0 ? '!bg-background' : '!bg-muted/50'}">
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
						<a 
							href="mailto:{manager.email}" 
							class="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
						>
							<Mail class="size-4 group-hover:text-primary transition-colors" />
							<span class="truncate">{manager.email}</span>
						</a>
					{/if}
					
					{#if manager.phone}
						<a 
							href="tel:{manager.phone}" 
							class="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
						>
							<Phone class="size-4 group-hover:text-primary transition-colors" />
							<span>{manager.phone}</span>
						</a>
					{/if}
					
					<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
						<User class="size-4" />
						<span>User ID: {manager.userId.slice(0, 8)}...</span>
					</div>
					
					{#if manager.created}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Calendar class="size-4" />
							<span>Joined {formatDate(manager.created)}</span>
						</div>
					{/if}
				</div>

				<div class="pt-4 border-t space-y-3">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium flex items-center gap-2">
							<Shield class="size-4" />
							Role
						</label>
						<span class="px-2.5 py-1 rounded-full text-xs font-medium {getRoleColor(manager.role)}">
							{roleOptions.find(r => r.value === manager.role)?.label || manager.role}
						</span>
					</div>
					
					<select
						value={manager.role}
						onchange={(e) => updateRole(manager.id, e.currentTarget.value, manager.role)}
						disabled={updating[manager.id]}
						class="w-full px-3 py-2 rounded-md border border-input bg-background dark:bg-gray-900 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#each roleOptions as option}
							<option value={option.value} class="bg-background dark:bg-gray-900 text-foreground dark:text-white">{option.label}</option>
						{/each}
					</select>
					
					{#if updating[manager.id]}
						<p class="text-xs text-muted-foreground">Updating...</p>
					{/if}
				</div>
			</Card>
			{/each}
		</div>
	{/if}
</div>
