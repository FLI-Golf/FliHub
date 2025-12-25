<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/auth/login');
	});
</script>

<svelte:head>
	<title>FliHub</title>
</svelte:head>

<main>
	<p>Redirecting...</p>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
	}
</style>
