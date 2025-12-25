<script lang="ts">
	let title = 'People';
</script>

<svelte:head>
	<title>{title} - FliHub</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<h1>{title}</h1>
		<button class="btn-primary">Add Person</button>
	</div>

	<div class="content-card">
		<p>People management coming soon...</p>
		<p>This will manage contacts, sponsors, partners, pros, and players.</p>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
		font-size: 2rem;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #5568d3;
	}

	.content-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.content-card p {
		margin: 0 0 1rem 0;
		color: #666;
	}

	.content-card p:last-child {
		margin-bottom: 0;
	}
</style>
