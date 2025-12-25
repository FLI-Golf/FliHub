<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	
	export let data: LayoutData;

	const isActive = (path: string) => $page.url.pathname === path;
</script>

<div class="flex min-h-screen">
	<nav class="w-64 bg-slate-900 text-white flex flex-col fixed h-screen">
		<div class="p-6 border-b border-slate-800">
			<h2 class="text-2xl font-bold">FliHub</h2>
		</div>
		
		<ul class="flex-1 py-4">
			<li>
				<a 
					href="/dashboard" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Dashboard
				</a>
			</li>
			<li>
				<a 
					href="/dashboard/managers" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/managers') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Managers
				</a>
			</li>
			<li>
				<a 
					href="/dashboard/tasks" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/tasks') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Tasks
				</a>
			</li>
			<li>
				<a 
					href="/dashboard/people" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/people') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					People
				</a>
			</li>
			<li>
				<a 
					href="/dashboard/projects" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/projects') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Projects
				</a>
			</li>
			<li>
				<a 
					href="/dashboard/expenses" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/expenses') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Expenses
				</a>
			</li>
			<li class="mt-4 pt-4 border-t border-slate-800">
				<a 
					href="/dashboard/import" 
					class="block px-6 py-3 hover:bg-slate-800 transition-colors {isActive('/dashboard/import') ? 'bg-slate-800 border-l-4 border-blue-500' : ''}"
				>
					Import Data
				</a>
			</li>
		</ul>

		<div class="p-6 border-t border-slate-800">
			<p class="text-sm opacity-80 mb-2">{data.user?.email}</p>
			<form method="POST" action="/auth/logout">
				<button 
					type="submit" 
					class="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
				>
					Logout
				</button>
			</form>
		</div>
	</nav>

	<main class="flex-1 ml-64 p-8 bg-slate-50">
		<slot />
	</main>
</div>
