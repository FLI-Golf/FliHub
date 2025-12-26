<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { UserCircle } from 'lucide-svelte';
	import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '$lib/domain/schemas';

	export let form: ActionData;

	const roles = [
		{ value: 'leader', label: ROLE_LABELS.leader, description: ROLE_DESCRIPTIONS.leader },
		{ value: 'admin', label: ROLE_LABELS.admin, description: ROLE_DESCRIPTIONS.admin },
		{ value: 'vendor', label: ROLE_LABELS.vendor, description: ROLE_DESCRIPTIONS.vendor },
		{ value: 'pro', label: ROLE_LABELS.pro, description: ROLE_DESCRIPTIONS.pro },
		{ value: 'franchise_owner', label: ROLE_LABELS.franchise_owner, description: ROLE_DESCRIPTIONS.franchise_owner }
	];

	let selectedRole = form?.role || 'admin';
</script>

<svelte:head>
	<title>Register - FliHub</title>
</svelte:head>

<div class="flex justify-center items-center min-h-screen bg-white py-12">
	<div class="w-full max-w-2xl px-6">
		<!-- Logo Header -->
		<div class="flex items-center justify-center gap-3 mb-8">
			<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
				<span class="text-2xl font-bold">F</span>
			</div>
			<div class="flex flex-col">
				<span class="text-xl font-bold tracking-tight">FliHub</span>
				<span class="text-xs text-muted-foreground uppercase tracking-wider">Business OS</span>
			</div>
		</div>

		<Card class="p-8 border-2">
			<h1 class="text-3xl font-bold mb-2 tracking-tight">Create Account</h1>
			<p class="text-muted-foreground mb-8">Join FliHub to manage your business operations</p>

			{#if form?.error}
				<div class="bg-black text-white p-4 rounded-lg mb-6 font-medium">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				<!-- Name Fields -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="firstName" class="block text-sm font-semibold mb-2">First Name</label>
						<input
							type="text"
							id="firstName"
							name="firstName"
							required
							value={form?.firstName || ''}
							class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
							placeholder="John"
						/>
					</div>
					<div>
						<label for="lastName" class="block text-sm font-semibold mb-2">Last Name</label>
						<input
							type="text"
							id="lastName"
							name="lastName"
							required
							value={form?.lastName || ''}
							class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
							placeholder="Doe"
						/>
					</div>
				</div>

				<!-- Email -->
				<div>
					<label for="email" class="block text-sm font-semibold mb-2">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						value={form?.email || ''}
						class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
						placeholder="your@email.com"
					/>
				</div>

				<!-- Password Fields -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="password" class="block text-sm font-semibold mb-2">Password</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="8"
							class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
							placeholder="••••••••"
						/>
						<p class="text-xs text-muted-foreground mt-1">At least 8 characters</p>
					</div>
					<div>
						<label for="confirmPassword" class="block text-sm font-semibold mb-2">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							minlength="8"
							class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
							placeholder="••••••••"
						/>
					</div>
				</div>

				<!-- Role Selection -->
				<div>
					<label class="block text-sm font-semibold mb-3">Select Your Role</label>
					<div class="space-y-3">
						{#each roles as role}
							<label class="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors {selectedRole === role.value ? 'border-black bg-accent' : 'border-input'}">
								<input
									type="radio"
									name="role"
									value={role.value}
									bind:group={selectedRole}
									required
									class="mt-1"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<UserCircle class="size-4 stroke-[2]" />
										<span class="font-semibold">{role.label}</span>
									</div>
									<p class="text-sm text-muted-foreground">{role.description}</p>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<Button type="submit" class="w-full py-6 text-base font-semibold">Create Account</Button>
			</form>

			<div class="mt-6 text-center space-y-2">
				<p class="text-sm text-muted-foreground">
					Already have an account? 
					<a href="/auth/login" class="text-foreground hover:underline font-semibold">Login</a>
				</p>
				<a href="/" class="block text-sm text-muted-foreground hover:text-foreground font-medium">
					← Back to home
				</a>
			</div>
		</Card>
	</div>
</div>
