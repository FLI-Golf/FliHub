<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		ArrowLeft, User, Mail, Phone, Building2, MapPin,
		DollarSign, Pencil, Save, X, Trash2, Loader, Calendar
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const territories  = $derived(data.territories  ?? []);
	const userProfiles = $derived(data.userProfiles ?? []);
	const sponsors     = $derived(data.sponsors     ?? []);

	let editing = $state($page.url.searchParams.get('edit') === '1');
	let saving  = $state(false);
	let deleting= $state(false);
	let error   = $state('');

	// Editable fields — initialised from lead
	let firstName        = $state(data.lead.firstName        ?? '');
	let lastName         = $state(data.lead.lastName         ?? '');
	let email            = $state(data.lead.email            ?? '');
	let phone            = $state(data.lead.phone            ?? '');
	let company          = $state(data.lead.company          ?? '');
	let location         = $state(data.lead.location         ?? '');
	let territory        = $state(data.lead.territory        ?? '');
	let source           = $state(data.lead.source           ?? 'other');
	let status           = $state(data.lead.status           ?? 'new');
	let netWorth         = $state(data.lead.netWorth         ?? '');
	let liquidCapital    = $state(data.lead.liquidCapital    ?? '');
	let experienceLevel  = $state(data.lead.experienceLevel  ?? 'none');
	let isExistingSponsor= $state(data.lead.isExistingSponsor ?? false);
	let sponsorId        = $state(data.lead.sponsorId        ?? '');
	let assignedTo       = $state(data.lead.assignedTo       ?? '');
	let notes            = $state(data.lead.notes            ?? '');

	const STATUS_COLORS: Record<string,string> = {
		new:         'bg-blue-900/40 text-blue-300 border-blue-700/40',
		contacted:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
		qualified:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
		unqualified: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
		converted:   'bg-violet-900/40 text-violet-300 border-violet-700/40',
		lost:        'bg-red-900/40 text-red-300 border-red-700/40',
	};

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);
	}
	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
	}

	function cancelEdit() {
		// Reset to server values
		firstName        = data.lead.firstName        ?? '';
		lastName         = data.lead.lastName         ?? '';
		email            = data.lead.email            ?? '';
		phone            = data.lead.phone            ?? '';
		company          = data.lead.company          ?? '';
		location         = data.lead.location         ?? '';
		territory        = data.lead.territory        ?? '';
		source           = data.lead.source           ?? 'other';
		status           = data.lead.status           ?? 'new';
		netWorth         = data.lead.netWorth         ?? '';
		liquidCapital    = data.lead.liquidCapital    ?? '';
		experienceLevel  = data.lead.experienceLevel  ?? 'none';
		isExistingSponsor= data.lead.isExistingSponsor ?? false;
		sponsorId        = data.lead.sponsorId        ?? '';
		assignedTo       = data.lead.assignedTo       ?? '';
		notes            = data.lead.notes            ?? '';
		editing = false;
		error   = '';
	}

	async function save() {
		error = '';
		saving = true;
		try {
			const res = await fetch(`/api/franchise-leads/${data.lead.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName, lastName, email, phone, company, location,
					territory, source, status,
					netWorth:      netWorth      ? Number(netWorth)      : null,
					liquidCapital: liquidCapital ? Number(liquidCapital) : null,
					experienceLevel,
					isExistingSponsor,
					sponsorId:  isExistingSponsor ? sponsorId : null,
					assignedTo: assignedTo || null,
					notes,
				}),
			});
			const json = await res.json();
			if (!res.ok) { error = json.message ?? 'Save failed'; return; }
			await invalidateAll();
			editing = false;
		} catch (e: any) {
			error = e.message ?? 'Unexpected error';
		} finally {
			saving = false;
		}
	}

	async function deleteLead() {
		if (!confirm(`Delete lead for ${data.lead.firstName} ${data.lead.lastName}? This cannot be undone.`)) return;
		deleting = true;
		try {
			const res = await fetch(`/api/franchise-leads/${data.lead.id}`, { method: 'DELETE' });
			if (!res.ok) { error = 'Delete failed'; return; }
			goto('/dashboard/sales');
		} catch (e: any) {
			error = e.message;
		} finally {
			deleting = false;
		}
	}

	const assignedUser = $derived(userProfiles.find((u: any) => u.id === data.lead.assignedTo));
	const linkedTerritory = $derived(territories.find((t: any) => t.id === data.lead.territory));
	const linkedSponsor   = $derived(sponsors.find((s: any) => s.id === data.lead.sponsorId));
</script>

<div class="max-w-2xl mx-auto px-4 py-8 space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/dashboard/sales" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
				<ArrowLeft class="size-4" />
			</a>
			<div>
				<h1 class="text-xl font-bold text-white">{data.lead.firstName} {data.lead.lastName}</h1>
				<p class="text-sm {data.lead.company ? 'text-white font-medium' : 'text-slate-500 italic'}">{data.lead.company || 'No entity name set'}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if !editing}
				<span class="px-2.5 py-1 rounded-full text-xs font-medium border {STATUS_COLORS[data.lead.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}">
					{data.lead.status.replace('_',' ')}
				</span>
				<button onclick={() => editing = true}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm transition-colors">
					<Pencil class="size-3.5" /> Edit
				</button>
				<button onclick={deleteLead} disabled={deleting}
					class="p-1.5 rounded-lg hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40">
					{#if deleting}<Loader class="size-4 animate-spin" />{:else}<Trash2 class="size-4" />{/if}
				</button>
			{:else}
				<button onclick={cancelEdit}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
					<X class="size-3.5" /> Cancel
				</button>
				<button onclick={save} disabled={saving}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm transition-colors">
					{#if saving}<Loader class="size-3.5 animate-spin" />{:else}<Save class="size-3.5" />{/if}
					Save
				</button>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="rounded-lg bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>
	{/if}

	{#if !editing}
		<!-- View mode -->
		<div class="rounded-xl border border-slate-700 bg-slate-800/40 divide-y divide-slate-700/60">
			<!-- Entity name — always shown prominently -->
			<div class="p-5">
				<p class="text-xs text-slate-500 mb-1">Entity / Company</p>
				<p class="text-base font-semibold {data.lead.company ? 'text-white' : 'text-slate-500 italic'} flex items-center gap-2">
					<Building2 class="size-4 text-slate-500 shrink-0" />
					{data.lead.company || 'Not set'}
				</p>
			</div>
			<div class="p-5 grid grid-cols-2 gap-4">
				<div>
					<p class="text-xs text-slate-500 mb-1">Email</p>
					<a href="mailto:{data.lead.email}" class="text-sm text-blue-400 hover:underline flex items-center gap-1.5">
						<Mail class="size-3.5" />{data.lead.email}
					</a>
				</div>
				{#if data.lead.phone}
				<div>
					<p class="text-xs text-slate-500 mb-1">Phone</p>
					<p class="text-sm text-white flex items-center gap-1.5"><Phone class="size-3.5 text-slate-500" />{data.lead.phone}</p>
				</div>
				{/if}
				{#if data.lead.location}
				<div>
					<p class="text-xs text-slate-500 mb-1">Location</p>
					<p class="text-sm text-white flex items-center gap-1.5"><MapPin class="size-3.5 text-slate-500" />{data.lead.location}</p>
				</div>
				{/if}

				{#if linkedTerritory}
				<div>
					<p class="text-xs text-slate-500 mb-1">Territory Interest</p>
					<p class="text-sm text-white">{linkedTerritory.name}</p>
				</div>
				{/if}
				<div>
					<p class="text-xs text-slate-500 mb-1">Source</p>
					<p class="text-sm text-white capitalize">{data.lead.source?.replace('_',' ')}</p>
				</div>
				<div>
					<p class="text-xs text-slate-500 mb-1">Experience</p>
					<p class="text-sm text-white capitalize">{data.lead.experienceLevel ?? '—'}</p>
				</div>
				{#if assignedUser}
				<div>
					<p class="text-xs text-slate-500 mb-1">Assigned To</p>
					<p class="text-sm text-white flex items-center gap-1.5"><User class="size-3.5 text-slate-500" />{assignedUser.firstName} {assignedUser.lastName}</p>
				</div>
				{/if}
				<div>
					<p class="text-xs text-slate-500 mb-1">Created</p>
					<p class="text-sm text-white flex items-center gap-1.5"><Calendar class="size-3.5 text-slate-500" />{fmtDate(data.lead.created)}</p>
				</div>
			</div>

			{#if data.lead.netWorth || data.lead.liquidCapital}
			<div class="p-5 grid grid-cols-2 gap-4">
				<div>
					<p class="text-xs text-slate-500 mb-1">Net Worth</p>
					<p class="text-sm text-white flex items-center gap-1.5"><DollarSign class="size-3.5 text-slate-500" />{data.lead.netWorth ? fmt(data.lead.netWorth) : '—'}</p>
				</div>
				<div>
					<p class="text-xs text-slate-500 mb-1">Liquid Capital</p>
					<p class="text-sm text-white flex items-center gap-1.5"><DollarSign class="size-3.5 text-slate-500" />{data.lead.liquidCapital ? fmt(data.lead.liquidCapital) : '—'}</p>
				</div>
			</div>
			{/if}

			{#if data.lead.isExistingSponsor && linkedSponsor}
			<div class="p-5">
				<p class="text-xs text-slate-500 mb-1">Linked Sponsor</p>
				<a href="/dashboard/sponsors/{linkedSponsor.id}" class="text-sm text-blue-400 hover:underline">{linkedSponsor.companyName}</a>
			</div>
			{/if}

			{#if data.lead.notes}
			<div class="p-5">
				<p class="text-xs text-slate-500 mb-2">Notes</p>
				<p class="text-sm text-slate-300 whitespace-pre-wrap">{data.lead.notes}</p>
			</div>
			{/if}
		</div>

	{:else}
		<!-- Edit mode — same fields as /new -->
		<div class="space-y-5">

			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2"><User class="size-4 text-slate-500" /> Contact Information</h2>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-firstName">First Name</label>
						<input id="e-firstName" bind:value={firstName} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-lastName">Last Name</label>
						<input id="e-lastName" bind:value={lastName} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
					</div>
				</div>
				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="e-email">Email</label>
					<input id="e-email" type="email" bind:value={email} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-phone">Phone</label>
						<input id="e-phone" bind:value={phone} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-company">Entity / Company</label>
						<input id="e-company" bind:value={company} placeholder="e.g. MGM Resorts" class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500" />
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-location">Location</label>
						<input id="e-location" bind:value={location} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-territory">Territory Interest</label>
						<select id="e-territory" bind:value={territory} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
							<option value="">— None —</option>
							{#each territories as t}
								<option value={t.id}>{t.name}{t.state ? ` (${t.state})` : ''}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300">Lead Details</h2>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-source">Source</label>
						<select id="e-source" bind:value={source} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
							<option value="website">Website</option>
							<option value="referral">Referral</option>
							<option value="event">Event</option>
							<option value="cold_outreach">Cold Outreach</option>
							<option value="partner">Partner</option>
							<option value="social_media">Social Media</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-status">Status</label>
						<select id="e-status" bind:value={status} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
							<option value="new">New</option>
							<option value="contacted">Contacted</option>
							<option value="qualified">Qualified</option>
							<option value="unqualified">Unqualified</option>
							<option value="converted">Converted</option>
							<option value="lost">Lost</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-exp">Experience Level</label>
						<select id="e-exp" bind:value={experienceLevel} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
							<option value="none">None</option>
							<option value="some">Some</option>
							<option value="extensive">Extensive</option>
						</select>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-assigned">Assigned To</label>
						<select id="e-assigned" bind:value={assignedTo} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
							<option value="">— Unassigned —</option>
							{#each userProfiles as u}
								<option value={u.id}>{u.firstName} {u.lastName}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2"><DollarSign class="size-4 text-slate-500" /> Financials</h2>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-nw">Net Worth</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
							<input id="e-nw" type="number" min="0" bind:value={netWorth} class="w-full rounded-lg bg-slate-900 border border-slate-700 pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
						</div>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="e-lc">Liquid Capital</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
							<input id="e-lc" type="number" min="0" bind:value={liquidCapital} class="w-full rounded-lg bg-slate-900 border border-slate-700 pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
						</div>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300">Sponsor Relationship</h2>
				<label class="flex items-center gap-3 cursor-pointer">
					<input type="checkbox" bind:checked={isExistingSponsor} class="size-4 rounded border-slate-600 bg-slate-900 text-blue-500" />
					<span class="text-sm text-slate-300">This lead is an existing sponsor</span>
				</label>
				{#if isExistingSponsor}
					<select bind:value={sponsorId} class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
						<option value="">— Select sponsor —</option>
						{#each sponsors as s}
							<option value={s.id}>{s.companyName}</option>
						{/each}
					</select>
				{/if}
			</div>

			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-2">
				<label class="text-xs text-slate-400" for="e-notes">Notes</label>
				<textarea id="e-notes" bind:value={notes} rows="4"
					class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"></textarea>
			</div>

		</div>
	{/if}

</div>
