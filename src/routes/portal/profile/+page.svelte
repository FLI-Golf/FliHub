<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { User, Save, Building2, Briefcase, Film, Trophy, Star, Tv, Users } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const profile   = $derived((data as any).profile);
	const roleExtra = $derived((data as any).roleExtra ?? {});
	const config    = $derived((data as any).portalConfig);
	const role      = $derived((data as any).portalRole ?? 'admin');

	let saving = $state(false);

	// Role-specific section metadata
	const ROLE_SECTIONS: Record<string, { icon: any; label: string; fields: { key: string; label: string; placeholder: string; readonly?: boolean }[] }> = {
		leader: {
			icon: Briefcase,
			label: 'Department',
			fields: [
				{ key: 'departmentName', label: 'Assigned Department', placeholder: 'Not assigned', readonly: true },
			],
		},
		vendor: {
			icon: Building2,
			label: 'Vendor Account',
			fields: [
				{ key: 'vendorName', label: 'Vendor Name', placeholder: 'Not linked', readonly: true },
			],
		},
		pro: {
			icon: Trophy,
			label: 'Player Details',
			fields: [
				{ key: 'proReference', label: 'Talent Record ID', placeholder: 'Linked by admin', readonly: false },
			],
		},
		broadcaster: {
			icon: Tv,
			label: 'Broadcaster Details',
			fields: [
				{ key: 'broadcasterReference', label: 'Broadcaster Reference', placeholder: 'e.g. network / station ID', readonly: false },
			],
		},
		franchise_owner: {
			icon: Star,
			label: 'Franchise Details',
			fields: [
				{ key: 'organization', label: 'Franchise / Organization', placeholder: 'Your franchise name', readonly: false },
			],
		},
		league_owner: {
			icon: Trophy,
			label: 'League Details',
			fields: [
				{ key: 'organization', label: 'Organization', placeholder: 'League organization name', readonly: false },
			],
		},
		manager: {
			icon: Users,
			label: 'Manager Details',
			fields: [
				{ key: 'organization', label: 'Agency / Organization', placeholder: 'Management agency', readonly: false },
			],
		},
		sales: {
			icon: Star,
			label: 'Sales Details',
			fields: [
				{ key: 'organization', label: 'Region / Territory', placeholder: 'Your region', readonly: false },
			],
		},
	};

	const roleSection = $derived(ROLE_SECTIONS[role] ?? null);
	const SectionIcon = $derived(roleSection?.icon ?? User);

	function fieldValue(key: string): string {
		if (roleExtra[key] !== undefined) return roleExtra[key] ?? '';
		return profile?.[key] ?? '';
	}

	const accentText   = $derived(config?.accentTw?.split(' ')[0] ?? 'text-violet-400');
	const accentBorder = $derived(config?.accentTw?.split(' ')[1] ?? 'border-violet-500');
</script>

<svelte:head><title>My Profile — {config?.label} Portal · FliHub</title></svelte:head>

<div class="space-y-6 max-w-2xl">

	<!-- Header -->
	<div class="flex items-center gap-3">
		<div class="size-10 rounded-xl bg-gradient-to-br {config?.logoGradient} flex items-center justify-center shadow">
			<User class="size-5 text-white" />
		</div>
		<div>
			<h1 class="text-xl font-bold text-white">My Profile</h1>
			<p class="text-xs {accentText} font-semibold uppercase tracking-widest">{config?.label} · {config?.tagline}</p>
		</div>
	</div>

	{#if form?.success}
		<div class="rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-sm px-4 py-3">
			Profile saved successfully.
		</div>
	{/if}
	{#if form?.error}
		<div class="rounded-lg bg-red-950/40 border border-red-700/50 text-red-300 text-sm px-4 py-3">
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => { await update(); saving = false; };
		}}
		class="space-y-6"
	>
		<!-- Common profile fields -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
			<h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
				<User class="size-4 {accentText}" />
				Basic Information
			</h2>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-xs font-medium text-slate-400 mb-1.5" for="firstName">First Name</label>
					<input
						id="firstName" name="firstName" type="text"
						value={profile?.firstName ?? ''}
						class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
							focus:outline-none focus:ring-1 focus:ring-offset-0 focus:border-slate-500
							placeholder:text-slate-600"
						placeholder="First name"
						required
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-slate-400 mb-1.5" for="lastName">Last Name</label>
					<input
						id="lastName" name="lastName" type="text"
						value={profile?.lastName ?? ''}
						class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
							focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600"
						placeholder="Last name"
						required
					/>
				</div>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1.5" for="email">Email</label>
				<input
					id="email" type="email"
					value={profile?.email ?? ''}
					class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
					placeholder="Email address"
					disabled
				/>
				<p class="text-[11px] text-slate-600 mt-1">Email is managed by your account — contact an admin to change it.</p>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1.5" for="phone">Phone</label>
				<input
					id="phone" name="phone" type="tel"
					value={profile?.phone ?? ''}
					class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
						focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600"
					placeholder="+1 (555) 000-0000"
				/>
			</div>

			<div>
				<label class="block text-xs font-medium text-slate-400 mb-1.5" for="bio">Bio</label>
				<textarea
					id="bio" name="bio" rows="3"
					class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
						focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600 resize-none"
					placeholder="A short bio about yourself…"
				>{profile?.bio ?? ''}</textarea>
			</div>
		</div>

		<!-- Role-specific section -->
		{#if roleSection}
			<div class="bg-slate-900 border {accentBorder}/30 rounded-xl p-6 space-y-4">
				<h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
					<SectionIcon class="size-4 {accentText}" />
					{roleSection.label}
				</h2>
				{#each roleSection.fields as field}
					<div>
						<label class="block text-xs font-medium text-slate-400 mb-1.5" for={field.key}>
							{field.label}
						</label>
						{#if field.readonly}
							<input
								id={field.key} type="text"
								value={fieldValue(field.key)}
								class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
								placeholder={field.placeholder}
								disabled
							/>
							<p class="text-[11px] text-slate-600 mt-1">Managed by an admin.</p>
						{:else}
							<input
								id={field.key} name={field.key} type="text"
								value={fieldValue(field.key)}
								class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
									focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600"
								placeholder={field.placeholder}
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Role badge (read-only info) -->
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center justify-between">
			<div>
				<p class="text-xs text-slate-500 mb-1">Your role</p>
				<span class="inline-flex items-center text-xs font-bold uppercase tracking-widest px-2 py-1 rounded
					border {accentBorder} {accentText} bg-slate-800/60">
					{config?.label}
				</span>
			</div>
			<p class="text-[11px] text-slate-600 text-right max-w-40">Role changes must be made by an admin.</p>
		</div>

		<!-- Save button -->
		<div class="flex justify-end">
			<button
				type="submit"
				disabled={saving}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
					bg-gradient-to-r {config?.logoGradient} hover:opacity-90 transition-opacity shadow-lg
					disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<Save class="size-4" />
				{saving ? 'Saving…' : 'Save Profile'}
			</button>
		</div>
	</form>

</div>
