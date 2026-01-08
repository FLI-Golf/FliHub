<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { UserPlus, Save, X } from 'lucide-svelte';

	let { open = $bindable(false), vendors = [], departments = [] } = $props();

	let formData = $state({
		email: '',
		password: '',
		firstName: '',
		lastName: '',
		phone: '',
		organization: '',
		role: 'leader',
		status: 'active',
		vendorId: '',
		departmentId: ''
	});

	let isSubmitting = $state(false);
	let error = $state('');
	let showVendorField = $derived(formData.role === 'vendor');
	let showDepartmentField = $derived(formData.role === 'leader');

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

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			// First create the user account
			const userResponse = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: formData.email,
					password: formData.password,
					passwordConfirm: formData.password
				})
			});

			if (!userResponse.ok) {
				const data = await userResponse.json();
				throw new Error(data.message || 'Failed to create user account');
			}

			const userData = await userResponse.json();

			// Then create the user profile
			const profileResponse = await fetch('/api/user-profiles', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: userData.id,
					firstName: formData.firstName,
					lastName: formData.lastName,
					email: formData.email,
					phone: formData.phone,
					organization: formData.organization,
					role: formData.role,
					status: formData.status,
					vendorId: formData.vendorId || null,
					departmentId: formData.departmentId || null
				})
			});

			if (!profileResponse.ok) {
				const data = await profileResponse.json();
				throw new Error(data.message || 'Failed to create user profile');
			}

			// Close modal and reload page
			open = false;
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) {
			error = '';
			formData = {
				email: '',
				password: '',
				firstName: '',
				lastName: '',
				phone: '',
				organization: '',
				role: 'leader',
				status: 'active',
				vendorId: ''
			};
		}
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-2xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<UserPlus class="size-5" />
				Add Person
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Create a new user account and person profile
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-md bg-red-900/50 border border-red-700 text-red-200 text-sm">
					{error}
				</div>
			{/if}

			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wide">Account Information</h3>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Email *</label>
					<Input
						type="email"
						bind:value={formData.email}
						placeholder="email@example.com"
						required
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Password *</label>
					<Input
						type="password"
						bind:value={formData.password}
						placeholder="Minimum 8 characters"
						required
						minlength="8"
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>
			</div>

			<div class="space-y-4 pt-4 border-t border-slate-700">
				<h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wide">Profile Information</h3>
				
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">First Name *</label>
						<Input
							type="text"
							bind:value={formData.firstName}
							placeholder="First name"
							required
							class="bg-slate-800 border-slate-700 text-white"
						/>
					</div>
					
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Last Name *</label>
						<Input
							type="text"
							bind:value={formData.lastName}
							placeholder="Last name"
							required
							class="bg-slate-800 border-slate-700 text-white"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Phone</label>
					<Input
						type="tel"
						bind:value={formData.phone}
						placeholder="Phone number"
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Organization</label>
					<Input
						type="text"
						bind:value={formData.organization}
						placeholder="Organization name"
						class="bg-slate-800 border-slate-700 text-white"
					/>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Role *</label>
					<select
						bind:value={formData.role}
						required
						class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each roleOptions as option}
							<option value={option.value} class="bg-slate-800 text-white">{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-slate-200">Status *</label>
					<select
						bind:value={formData.status}
						required
						class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each statusOptions as option}
							<option value={option.value} class="bg-slate-800 text-white">{option.label}</option>
						{/each}
					</select>
				</div>
				
				{#if showVendorField}
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Assign Vendor</label>
						<select
							bind:value={formData.vendorId}
							class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="" class="bg-slate-800 text-white">-- Select Vendor --</option>
							{#each vendors as vendor}
								<option value={vendor.id} class="bg-slate-800 text-white">{vendor.name}</option>
							{/each}
						</select>
						<p class="text-xs text-slate-400">Required for vendor role users</p>
					</div>
				{/if}

				{#if showDepartmentField}
					<div class="space-y-2">
						<label class="text-sm font-medium text-slate-200">Assign Department</label>
						<select
							bind:value={formData.departmentId}
							class="w-full px-3 py-2 rounded-md border bg-slate-800 border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="" class="bg-slate-800 text-white">-- Select Department --</option>
							{#each departments as department}
								<option value={department.id} class="bg-slate-800 text-white">{department.name}</option>
							{/each}
						</select>
						<p class="text-xs text-slate-400">Required for leader role users</p>
					</div>
				{/if}
			</div>

			<div class="flex gap-3 pt-6 border-t border-slate-700">
				<Button
					type="submit"
					disabled={isSubmitting}
					class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
				>
					<Save class="size-4 mr-2" />
					{isSubmitting ? 'Creating...' : 'Create Person'}
				</Button>
				
				<Button
					type="button"
					variant="outline"
					onclick={() => open = false}
					disabled={isSubmitting}
					class="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					<X class="size-4 mr-2" />
					Cancel
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
