<script lang="ts">
	import type { LayoutData } from './$types';
	
	export let data: LayoutData;
</script>

<div class="layout">
	<nav class="sidebar">
		<div class="logo">
			<h2>FliHub</h2>
		</div>
		
		<ul class="nav-menu">
			<li><a href="/dashboard">Dashboard</a></li>
			<li><a href="/dashboard/people">People</a></li>
			<li><a href="/dashboard/projects">Projects</a></li>
			<li><a href="/dashboard/expenses">Expenses</a></li>
		</ul>

		<div class="user-section">
			<p class="user-email">{data.user?.email}</p>
			<form method="POST" action="/auth/logout">
				<button type="submit" class="btn-logout">Logout</button>
			</form>
		</div>
	</nav>

	<main class="content">
		<slot />
	</main>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 250px;
		background: #2c3e50;
		color: white;
		display: flex;
		flex-direction: column;
		position: fixed;
		height: 100vh;
	}

	.logo {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.nav-menu {
		flex: 1;
		list-style: none;
		padding: 1rem 0;
		margin: 0;
	}

	.nav-menu li {
		margin: 0;
	}

	.nav-menu a {
		display: block;
		padding: 0.75rem 1.5rem;
		color: white;
		text-decoration: none;
		transition: background 0.2s;
	}

	.nav-menu a:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.user-section {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.user-email {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.btn-logout {
		width: 100%;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-logout:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.content {
		flex: 1;
		margin-left: 250px;
		padding: 2rem;
		background: #f5f5f5;
	}
</style>
