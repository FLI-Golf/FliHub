<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Login - FliHub</title>
</svelte:head>

<div class="flex justify-center items-center min-h-screen bg-background">
	<div class="w-full max-w-md">
		<!-- Logo Header -->
		<div class="flex items-center justify-center gap-3 mb-8">
			<div class="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black border-2 border-black">
				<span class="text-2xl font-bold">F</span>
			</div>
			<div class="flex flex-col">
				<span class="text-xl font-bold tracking-tight">FliHub</span>
				<span class="text-xs text-muted-foreground uppercase tracking-wider">Business OS</span>
			</div>
		</div>

		<Card class="p-8 border-2">
			<h1 class="text-3xl font-bold mb-2 tracking-tight">Welcome Back</h1>
			<p class="text-muted-foreground mb-8">Sign in to access your dashboard</p>

			{#if form?.error}
				<div class="bg-destructive text-destructive-foreground p-4 rounded-lg mb-6 font-medium">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
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

				<div>
					<label for="password" class="block text-sm font-semibold mb-2">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						class="w-full px-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium"
						placeholder="••••••••"
					/>
				</div>

				<button 
					type="submit" 
					class="w-full px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 shadow-md hover:shadow-lg"
				>
					Login
				</button>
			</form>

			<div class="mt-6 text-center space-y-2">
				<p class="text-sm text-muted-foreground">
					Don't have an account? 
					<a href="/auth/register" class="text-foreground hover:underline font-semibold">Register</a>
				</p>
				<a href="/" class="block text-sm text-muted-foreground hover:text-foreground font-medium">
					← Back to home
				</a>
			</div>
		</Card>
	</div>
</div>
