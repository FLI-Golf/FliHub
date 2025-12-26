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

<div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
	<Card class="w-full max-w-md p-8">
		<h1 class="text-3xl font-bold mb-2">FliHub Login</h1>
		<p class="text-slate-600 mb-6">Business OS for FLI Golf</p>

		{#if form?.error}
			<div class="bg-red-50 text-red-600 p-3 rounded-md mb-4">
				{form.error}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium mb-2">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					value={form?.email || ''}
					class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium mb-2">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<Button type="submit" class="w-full">Login</Button>
		</form>
	</Card>
</div>
