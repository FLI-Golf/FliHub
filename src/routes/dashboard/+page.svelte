<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - FliHub</title>
</svelte:head>

<div class="dashboard">
	<h1>Dashboard</h1>
	<p>Welcome to FliHub, {data.user?.email}</p>

	<div class="cards">
		<div class="card">
			<h3>People</h3>
			<p>Manage contacts, sponsors, partners, and pros</p>
			<a href="/dashboard/people" class="btn">View People</a>
		</div>

		<div class="card">
			<h3>Projects</h3>
			<p>Track tournaments, events, and campaigns</p>
			<a href="/dashboard/projects" class="btn">View Projects</a>
		</div>

		<div class="card">
			<h3>Expenses</h3>
			<p>Manage expenses, invoices, and payouts</p>
			<a href="/dashboard/expenses" class="btn">View Expenses</a>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
	}

	.card p {
		margin: 0 0 1rem 0;
		color: #666;
	}

	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: #667eea;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.btn:hover {
		background: #5568d3;
	}
</style>
