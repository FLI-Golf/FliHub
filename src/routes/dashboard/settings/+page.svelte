<script lang="ts">
	import type { PageData } from './$types';
	import { Settings, User, Bell, Palette, Shield, ChevronRight } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const email = data.user?.email ?? '';
	const displayName = email.split('@')[0] ?? 'User';
	const initials = displayName.slice(0, 2).toUpperCase();
	const role = data.userProfile?.role ?? 'user';
</script>

<svelte:head>
	<title>Settings — FLI Golf</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-8 py-6 px-4">

	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="p-2 rounded-lg bg-slate-800 border border-slate-700">
			<Settings class="size-5 text-slate-300" />
		</div>
		<div>
			<h1 class="text-2xl font-bold text-white">Settings</h1>
			<p class="text-sm text-slate-400">Manage your account and preferences</p>
		</div>
	</div>

	<!-- Account -->
	<section class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
		<div class="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-800/50">
			<User class="size-4 text-slate-400" />
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Account</h2>
		</div>
		<div class="p-5 space-y-5">
			<!-- Avatar + identity -->
			<div class="flex items-center gap-4">
				<div class="size-14 rounded-full bg-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
					{initials}
				</div>
				<div>
					<p class="text-white font-semibold">{displayName}</p>
					<p class="text-sm text-slate-400">{email}</p>
					<span class="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-700 text-slate-300">{role}</span>
				</div>
			</div>

			<!-- Fields (read-only for now) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label class="block text-xs text-slate-400 mb-1">Display name</label>
					<input
						type="text"
						value={displayName}
						disabled
						class="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-60 cursor-not-allowed"
					/>
				</div>
				<div>
					<label class="block text-xs text-slate-400 mb-1">Email</label>
					<input
						type="email"
						value={email}
						disabled
						class="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-60 cursor-not-allowed"
					/>
				</div>
			</div>

			<a
				href="/dashboard/player-profile"
				class="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors"
			>
				Edit full player profile <ChevronRight class="size-3.5" />
			</a>
		</div>
	</section>

	<!-- Notifications -->
	<section class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
		<div class="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-800/50">
			<Bell class="size-4 text-slate-400" />
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Notifications</h2>
		</div>
		<div class="divide-y divide-slate-800">
			{#each [
				{ label: 'Approval requests', description: 'Notify when a task needs your approval' },
				{ label: 'Goal updates', description: 'Notify when a marketing goal is updated' },
				{ label: 'Expense submissions', description: 'Notify when an expense is submitted for review' },
			] as pref}
				<div class="flex items-center justify-between px-5 py-4">
					<div>
						<p class="text-sm text-white">{pref.label}</p>
						<p class="text-xs text-slate-500">{pref.description}</p>
					</div>
					<label class="relative inline-flex items-center cursor-not-allowed opacity-50" title="Coming soon">
						<input type="checkbox" class="sr-only peer" disabled />
						<div class="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-orange-500 transition-colors"></div>
						<div class="absolute left-0.5 top-0.5 size-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
					</label>
				</div>
			{/each}
		</div>
		<p class="px-5 py-3 text-xs text-slate-600 border-t border-slate-800">Notification preferences coming soon.</p>
	</section>

	<!-- Appearance -->
	<section class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
		<div class="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-800/50">
			<Palette class="size-4 text-slate-400" />
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Appearance</h2>
		</div>
		<div class="p-5">
			<p class="text-sm text-slate-400">Theme customisation coming soon.</p>
		</div>
	</section>

	<!-- Security -->
	<section class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
		<div class="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-800/50">
			<Shield class="size-4 text-slate-400" />
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Security</h2>
		</div>
		<div class="p-5 space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-white">Password</p>
					<p class="text-xs text-slate-500">Change your account password</p>
				</div>
				<button
					disabled
					class="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 disabled:opacity-50 cursor-not-allowed"
				>
					Change password
				</button>
			</div>
		</div>
		<p class="px-5 py-3 text-xs text-slate-600 border-t border-slate-800">Security settings coming soon.</p>
	</section>

</div>
