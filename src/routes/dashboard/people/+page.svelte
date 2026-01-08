<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import AddPersonModal from '$lib/components/people/add-person-modal.svelte';
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
		Plus,
		Maximize2,
		Minimize2,
		Save,
		X as XIcon,
		Edit
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
	let selectedPerson = $state<any>(null);
	let showAddModal = $state(false);
	let expandedPersons = $state<Set<string>>(new Set());
	let editingPersons = $state<Set<string>>(new Set());
	let editData = $state<Record<string, any>>({});
	
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
		return data.people.filter(m => m.role === role).length;
	}
	
	// Get counts for each status
	function getStatusCount(status: string): number {
		return data.people.filter(m => m.status === status).length;
	}
	
	// Filter people based on search query, role, and status
	const filteredPersons = $derived(
		data.people.filter(person => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
				const email = person.email?.toLowerCase() || '';
				const organization = person.organization?.toLowerCase() || '';
				const role = person.role.toLowerCase();
				
				const matchesSearch = fullName.includes(query) || 
					   email.includes(query) || 
					   organization.includes(query) ||
					   role.includes(query);
				
				if (!matchesSearch) return false;
			}
			
			// Role filter
			if (roleFilter !== 'all' && person.role !== roleFilter) {
				return false;
			}
			
			// Status filter
			if (statusFilter !== 'all' && person.status !== statusFilter) {
				return false;
			}
			
			return true;
		})
	);
	
	// Build role tabs
	let roleTabs = $derived([
		{ value: 'all', label: 'All Roles', count: data.people.length },
		{ value: 'admin', label: 'Admin', count: getRoleCount('admin'), icon: ShieldCheck },
		{ value: 'leader', label: 'Leader', count: getRoleCount('leader'), icon: Users },
		{ value: 'vendor', label: 'Vendor', count: getRoleCount('vendor'), icon: Store },
		{ value: 'pro', label: 'Pro', count: getRoleCount('pro'), icon: Award },
		{ value: 'franchise_owner', label: 'Franchise Owner', count: getRoleCount('franchise_owner'), icon: Home }
	]);
	
	// Build status tabs
	let statusTabs = $derived([
		{ value: 'all', label: 'All Status', count: data.people.length },
		{ value: 'active', label: 'Active', count: getStatusCount('active'), icon: CheckCircle2 },
		{ value: 'inactive', label: 'Inactive', count: getStatusCount('inactive'), icon: XCircle },
		{ value: 'pending', label: 'Pending', count: getStatusCount('pending'), icon: Clock }
	]);
	
	function openEditSheet(person: any) {
		selectedPerson = person;
		editForm = {
			firstName: person.firstName || '',
			lastName: person.lastName || '',
			email: person.email || '',
			phone: person.phone || '',
			organization: person.organization || '',
			role: person.role || '',
			status: person.status || '',
			vendorId: person.vendorId || '',
			departmentId: person.departmentId || ''
		};
		sheetOpen = true;
	}
	
	function handleOpenChange(newOpen: boolean) {
		sheetOpen = newOpen;
	}
	
	async function savePerson() {
		if (!selectedPerson) return;
		
		updating[selectedPerson.id] = true;
		
		try {
			// Update user profile with role and assignments
			const response = await fetch('/api/user-profiles/update-role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					profileId: selectedPerson.id,
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
				alert(error.error || 'Failed to update person');
			}
		} catch (error) {
			console.error('Error updating person:', error);
			alert('Failed to update person');
		} finally {
			updating[selectedPerson.id] = false;
		}
	}
	
	async function deletePerson() {
		if (!selectedPerson) return;
		
		const personName = `${selectedPerson.firstName} ${selectedPerson.lastName}`;
		if (!confirm(`Are you sure you want to delete ${personName}? This action cannot be undone.`)) {
			return;
		}
		
		updating[selectedPerson.id] = true;
		
		try {
			const response = await fetch(`/api/user-profiles/${selectedPerson.id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				sheetOpen = false;
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to delete person');
			}
		} catch (error) {
			console.error('Error deleting person:', error);
			alert('Failed to delete person');
		} finally {
			updating[selectedPerson.id] = false;
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
	
	function toggleExpand(personId: string, event: Event) {
		event.stopPropagation();
		if (expandedPersons.has(personId)) {
			expandedPersons.delete(personId);
			editingPersons.delete(personId);
		} else {
			expandedPersons.add(personId);
		}
		expandedPersons = new Set(expandedPersons);
		editingPersons = new Set(editingPersons);
	}
	
	function startEditing(person: any, event: Event) {
		event.stopPropagation();
		editingPersons.add(person.id);
		editData[person.id] = { ...person };
		editingPersons = new Set(editingPersons);
	}
	
	function cancelEditing(personId: string, event: Event) {
		event.stopPropagation();
		editingPersons.delete(personId);
		delete editData[personId];
		editingPersons = new Set(editingPersons);
	}
	
	async function saveInlineEdit(personId: string, event: Event) {
		event.stopPropagation();
		updating[personId] = true;
		
		try {
			const response = await fetch(`/api/user-profiles/${personId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editData[personId])
			});
			
			if (response.ok) {
				editingPersons.delete(personId);
				editingPersons = new Set(editingPersons);
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to update person');
			}
		} catch (error) {
			console.error('Error updating person:', error);
			alert('Failed to update person');
		} finally {
			updating[personId] = false;
		}
	}
</script>

<svelte:head>
	<title>{data.isAdmin ? 'Persons - Update Role' : 'Persons'} - FliHub</title>
</svelte:head>

<div class="max-w-7xl">
	<div class="flex flex-col gap-6 mb-6">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold">Persons - Update Role</h1>
				<p class="text-muted-foreground mt-1">
					{filteredPersons.length} of {data.people.length} {data.isAdmin ? 'users' : 'team members'}
				</p>
			</div>
			{#if data.isAdmin}
				<Button onclick={() => showAddModal = true} class="cursor-pointer">
					<Plus class="size-4 mr-2" />
					Add Person
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

	{#if filteredPersons.length === 0}
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
			{#each filteredPersons as person, index}
			<Card 
				class="p-6 transition-all duration-200 hover:shadow-xl {index % 2 === 0 ? '!bg-background' : '!bg-muted/50'}"
			>
				<div class="flex items-start justify-between mb-4">
					<button 
						type="button"
						onclick={() => openEditSheet(person)}
						class="text-left flex-1 cursor-pointer"
					>
						<h3 class="text-xl font-bold mb-1 hover:text-primary transition-colors">{person.firstName} {person.lastName}</h3>
						{#if person.organization}
							<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
								<Building2 class="size-4" />
								<span>{person.organization}</span>
							</div>
						{/if}
					</button>
					<div class="flex items-center gap-2">
						<div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wide">
							{person.status}
						</div>
						<button
							type="button"
							onclick={(e) => toggleExpand(person.id, e)}
							class="p-2 hover:bg-muted rounded-lg transition-colors"
							aria-label={expandedPersons.has(person.id) ? 'Collapse details' : 'Expand details'}
							title={expandedPersons.has(person.id) ? 'Collapse' : 'Expand'}
						>
							{#if expandedPersons.has(person.id)}
								<Minimize2 class="size-5" />
							{:else}
								<Maximize2 class="size-5" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-3 mb-4">
					{#if person.email}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Mail class="size-4" />
							<span class="truncate">{person.email}</span>
						</div>
					{/if}
					
					{#if person.phone}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Phone class="size-4" />
							<span>{person.phone}</span>
						</div>
					{/if}
					
					{#if person.created}
						<div class="flex items-center gap-2.5 text-sm text-muted-foreground">
							<Calendar class="size-4" />
							<span>Joined {formatDate(person.created)}</span>
						</div>
					{/if}
				</div>

				<div class="pt-4 border-t">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium flex items-center gap-2">
							<Shield class="size-4" />
							Role
						</label>
						<span class="px-2.5 py-1 rounded-full text-xs font-medium {getRoleColor(person.role)}">
							{roleOptions.find(r => r.value === person.role)?.label || person.role}
						</span>
					</div>
				</div>

				{#if expandedPersons.has(person.id)}
					<div class="mt-4 pt-4 border-t space-y-4 animate-in slide-in-from-top-2">
						<div class="flex items-center justify-between">
							<h4 class="font-semibold text-sm flex items-center gap-2">
								<User class="size-4" />
								Full Profile Details
							</h4>
							{#if !editingPersons.has(person.id)}
								<Button 
									size="sm" 
									variant="outline"
									onclick={(e) => startEditing(person, e)}
									class="cursor-pointer"
								>
									<Edit class="size-3 mr-1" />
									Edit
								</Button>
							{:else}
								<div class="flex gap-2">
									<Button 
										size="sm" 
										variant="outline"
										onclick={(e) => cancelEditing(person.id, e)}
										disabled={updating[person.id]}
										class="cursor-pointer"
									>
										<XIcon class="size-3 mr-1" />
										Cancel
									</Button>
									<Button 
										size="sm"
										onclick={(e) => saveInlineEdit(person.id, e)}
										disabled={updating[person.id]}
										class="cursor-pointer"
									>
										<Save class="size-3 mr-1" />
										{updating[person.id] ? 'Saving...' : 'Save'}
									</Button>
								</div>
							{/if}
						</div>
						
						{#if editingPersons.has(person.id)}
							<!-- Editable Form -->
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">First Name</label>
									<Input 
										bind:value={editData[person.id].firstName}
										class="h-8 text-sm"
									/>
								</div>
								
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">Last Name</label>
									<Input 
										bind:value={editData[person.id].lastName}
										class="h-8 text-sm"
									/>
								</div>
								
								<div class="col-span-2 space-y-1">
									<label class="text-xs text-muted-foreground">Email</label>
									<Input 
										type="email"
										bind:value={editData[person.id].email}
										class="h-8 text-sm"
									/>
								</div>
								
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">Phone</label>
									<Input 
										bind:value={editData[person.id].phone}
										class="h-8 text-sm"
									/>
								</div>
								
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">Organization</label>
									<Input 
										bind:value={editData[person.id].organization}
										class="h-8 text-sm"
									/>
								</div>
								
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">Role</label>
									<select 
										bind:value={editData[person.id].role}
										class="w-full h-8 text-sm rounded-md border border-input bg-background px-3"
									>
										{#each roleOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
								
								<div class="space-y-1">
									<label class="text-xs text-muted-foreground">Status</label>
									<select 
										bind:value={editData[person.id].status}
										class="w-full h-8 text-sm rounded-md border border-input bg-background px-3"
									>
										{#each statusOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
								
								{#if editData[person.id].role === 'vendor'}
									<div class="col-span-2 space-y-1">
										<label class="text-xs text-muted-foreground flex items-center gap-1">
											<Store class="size-3" />
											Vendor ID
										</label>
										<Input 
											bind:value={editData[person.id].vendorId}
											class="h-8 text-sm font-mono"
											placeholder="Select vendor..."
										/>
									</div>
								{/if}
								
								{#if editData[person.id].role === 'pro'}
									<div class="col-span-2 space-y-1">
										<label class="text-xs text-muted-foreground flex items-center gap-1">
											<Award class="size-3" />
											Pro Reference
										</label>
										<Input 
											bind:value={editData[person.id].proReference}
											class="h-8 text-sm font-mono"
											placeholder="Pro ID..."
										/>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Read-only View -->
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="text-xs text-muted-foreground">User ID</span>
									<p class="font-mono text-xs mt-1 truncate">{person.userId || 'N/A'}</p>
								</div>
								
								<div>
									<span class="text-xs text-muted-foreground">Profile ID</span>
									<p class="font-mono text-xs mt-1 truncate">{person.id}</p>
								</div>
								
								<div class="col-span-2">
									<span class="text-xs text-muted-foreground">Available Roles</span>
									<div class="flex flex-wrap gap-1 mt-1">
										{#if person.availableRoles && person.availableRoles.length > 0}
											{#each person.availableRoles as role}
												<span class="px-2 py-0.5 rounded text-xs {getRoleColor(role)}">
													{roleOptions.find(r => r.value === role)?.label || role}
												</span>
											{/each}
										{:else}
											<span class="text-xs text-muted-foreground">None</span>
										{/if}
									</div>
								</div>
								
								{#if person.vendorId}
									<div class="col-span-2">
										<span class="text-xs text-muted-foreground flex items-center gap-1">
											<Store class="size-3" />
											Vendor ID
										</span>
										<p class="font-mono text-xs mt-1">{person.vendorId}</p>
									</div>
								{/if}
								
								{#if person.proReference}
									<div class="col-span-2">
										<span class="text-xs text-muted-foreground flex items-center gap-1">
											<Award class="size-3" />
											Pro Reference
										</span>
										<p class="font-mono text-xs mt-1">{person.proReference}</p>
									</div>
								{/if}
								
								<div>
									<span class="text-xs text-muted-foreground">Created</span>
									<p class="text-xs mt-1">{person.created ? formatDate(person.created) : 'N/A'}</p>
								</div>
								
								<div>
									<span class="text-xs text-muted-foreground">Last Updated</span>
									<p class="text-xs mt-1">{person.updated ? formatDate(person.updated) : 'N/A'}</p>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</Card>
			{/each}
		</div>
	{/if}
</div>

<Sheet.Root open={sheetOpen} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<User class="size-5" />
				Edit Person
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Update person information and role
			</Sheet.Description>
		</Sheet.Header>
		
		{#if selectedPerson}
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
						<span>User ID: {selectedPerson.userId}</span>
					</div>
					
					{#if selectedPerson.created}
						<div class="flex items-center gap-2.5 text-sm text-slate-400">
							<Calendar class="size-4" />
							<span>Joined {formatDate(selectedPerson.created)}</span>
						</div>
					{/if}
				</div>
			</div>
			
			<Sheet.Footer class="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-700">
				<Button
					onclick={savePerson}
					disabled={updating[selectedPerson.id]}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white"
				>
					{updating[selectedPerson.id] ? 'Saving...' : 'Save Changes'}
				</Button>
				
				<Button
					variant="outline"
					onclick={deletePerson}
					disabled={updating[selectedPerson.id]}
					class="w-full bg-red-600 border-red-700 text-white hover:bg-red-700"
				>
					<Trash2 class="size-4 mr-2" />
					Delete Person
				</Button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<AddPersonModal bind:open={showAddModal} vendors={data.vendors || []} departments={data.departments || []} />
