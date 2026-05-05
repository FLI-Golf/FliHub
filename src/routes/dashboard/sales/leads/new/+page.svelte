<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ArrowLeft, ArrowRight, User, Mail, Phone, Building2, MapPin, DollarSign, Loader, Check, Handshake, Target, Search, X } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const territories  = $derived(data.territories  ?? []);
	const userProfiles = $derived(data.userProfiles ?? []);
	const sponsors     = $derived(data.sponsors     ?? []);
	const franchises   = $derived(data.franchises   ?? []);

	let step    = $state(1);
	const STEPS = 3;

	let saving = $state(false);
	let error  = $state('');

	// Form fields
	let sponsorId        = $state('');
	let company          = $state('');
	let firstName        = $state('');
	let lastName         = $state('');
	let email            = $state('');
	let phone            = $state('');
	let location         = $state('');
	let franchiseId      = $state('');
	let preferredName    = $state('');
	let territory        = $state('');
	let source           = $state('other');
	let assignedTo       = $state('');
	let netWorth         = $state('');
	let liquidCapital    = $state('');
	let experienceLevel  = $state('none');
	let status           = $state('new');
	let notes            = $state('');

	let sponsorSearch = $state('');
	let sponsorOpen   = $state(false);

	const filteredSponsors = $derived(
		sponsorSearch.trim()
			? sponsors.filter((s: any) => s.companyName.toLowerCase().includes(sponsorSearch.toLowerCase()))
			: sponsors
	);

	function selectSponsor(s: any) {
		sponsorId     = s.id;
		sponsorSearch = s.companyName;
		sponsorOpen   = false;
	}

	function clearSponsor() {
		sponsorId     = '';
		sponsorSearch = '';
		sponsorOpen   = false;
	}

	// Derived — declared after state vars
	const selectedSponsor   = $derived(sponsors.find((s: any) => s.id === sponsorId));
	const selectedFranchise = $derived(franchises.find((f: any) => f.id === franchiseId));

	// Auto-fill contact fields from sponsor
	$effect(() => {
		if (selectedSponsor) {
			company = selectedSponsor.companyName ?? '';
			// Split "Robert Chen" → first + last
			const parts = (selectedSponsor.primaryContactName ?? '').trim().split(/\s+/);
			firstName = parts[0] ?? '';
			lastName  = parts.slice(1).join(' ') ?? '';
			email     = selectedSponsor.primaryContactEmail  ?? '';
			phone     = selectedSponsor.primaryContactPhone  ?? '';
			location  = selectedSponsor.location             ?? '';
		}
	});

	// Seed assignedTo from session user
	$effect(() => {
		if (data.currentUserId && !assignedTo) assignedTo = data.currentUserId;
	});

	// Close sponsor dropdown on outside click
	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-sponsor-search]')) sponsorOpen = false;
	}
	$effect(() => {
		document.addEventListener('click', handleOutsideClick);
		return () => document.removeEventListener('click', handleOutsideClick);
	});

	const step1Valid = $derived(!!firstName.trim() && !!lastName.trim() && !!email.trim());

	function next() { if (step < STEPS) step++; }
	function back() { if (step > 1) step--; }

	async function submit() {
		error = '';
		saving = true;
		try {
			const res = await fetch('/api/franchise-leads', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName:  lastName.trim(),
					email:     email.trim(),
					phone, company, location,
					territory, source, status,
					netWorth:         netWorth      ? Number(netWorth)      : null,
					liquidCapital:    liquidCapital ? Number(liquidCapital) : null,
					experienceLevel,
					isExistingSponsor: !!sponsorId,
					sponsorId:        sponsorId   || null,
					franchiseId:      franchiseId  || null,
					preferredName:    preferredName || '',
					assignedTo:       assignedTo   || null,
					notes,
				}),
			});
			const json = await res.json();
			if (!res.ok) { error = json.message ?? 'Failed to create lead'; return; }
			goto(`/dashboard/sales/leads/${json.id}`);
		} catch (e: any) {
			error = e.message ?? 'Unexpected error';
		} finally {
			saving = false;
		}
	}

	const INPUT      = 'w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';
	const INPUT_ICON = 'w-full rounded-lg bg-slate-900 border border-slate-700 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500';
</script>

<div class="max-w-xl mx-auto px-4 py-8 space-y-6">

	<!-- Header -->
	<div class="flex items-center gap-3">
		<button onclick={() => step > 1 ? back() : goto('/dashboard/sales')}
			class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
			<ArrowLeft class="size-4" />
		</button>
		<div>
			<h1 class="text-xl font-bold text-white">New Franchise Lead</h1>
			<p class="text-sm text-slate-400">Step {step} of {STEPS}</p>
		</div>
	</div>

	<!-- Step indicator -->
	<div class="flex items-center">
		{#each [{n:1, label:'Who'}, {n:2, label:'Franchise'}, {n:3, label:'Qualify'}] as s}
			<div class="flex items-center {s.n < STEPS ? 'flex-1' : ''}">
				<div class="flex items-center gap-2 shrink-0">
					<div class="size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
						{step > s.n ? 'bg-emerald-600 text-white' : step === s.n ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-500'}">
						{#if step > s.n}<Check class="size-3.5" />{:else}{s.n}{/if}
					</div>
					<span class="text-xs font-medium {step === s.n ? 'text-white' : step > s.n ? 'text-emerald-400' : 'text-slate-500'}">{s.label}</span>
				</div>
				{#if s.n < STEPS}
					<div class="flex-1 h-px mx-3 {step > s.n ? 'bg-emerald-700' : 'bg-slate-700'}"></div>
				{/if}
			</div>
		{/each}
	</div>

	{#if error}
		<div class="rounded-lg bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 text-sm">{error}</div>
	{/if}

	<!-- Step 1: Who -->
	{#if step === 1}
		<div class="space-y-4">

			<!-- Sponsor (optional) — first so it auto-fills entity below -->
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-3">
				<div>
					<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
						<Handshake class="size-4 text-slate-500" /> Existing Sponsor
						<span class="text-xs font-normal text-slate-600 ml-1">— optional</span>
					</h2>
					<p class="text-xs text-slate-500 mt-1">If this lead is already a sponsor, select them and the contact fields fill automatically.</p>
				</div>

				<!-- Search input -->
				<div class="relative" data-sponsor-search>
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
					<input
						bind:value={sponsorSearch}
						onfocus={() => sponsorOpen = true}
						oninput={() => { sponsorOpen = true; if (!sponsorSearch) clearSponsor(); }}
						placeholder="Search sponsors…"
						class="{INPUT_ICON} pr-8"
						autocomplete="off" />
					{#if sponsorSearch}
						<button onclick={clearSponsor}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
							<X class="size-3.5" />
						</button>
					{/if}

					<!-- Dropdown -->
					{#if sponsorOpen && filteredSponsors.length > 0}
						<div class="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl overflow-hidden max-h-52 overflow-y-auto">
							{#each filteredSponsors as s}
								<button
									type="button"
									onclick={() => selectSponsor(s)}
									class="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 {s.id === sponsorId ? 'bg-slate-800 text-white' : 'text-slate-300'}">
									<span>{s.companyName}</span>
									{#if s.id === sponsorId}<Check class="size-3.5 text-emerald-400 shrink-0" />{/if}
								</button>
							{/each}
						</div>
					{:else if sponsorOpen && sponsorSearch && filteredSponsors.length === 0}
						<div class="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl px-3 py-3 text-xs text-slate-500">
							No sponsors match "{sponsorSearch}"
						</div>
					{/if}
				</div>

				{#if selectedSponsor}
					<p class="text-xs text-emerald-400 flex items-center gap-1.5">
						<Check class="size-3" /> Contact fields filled from <strong>{selectedSponsor.companyName}</strong>
					</p>
				{/if}
			</div>

			<!-- Contact info -->
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
					<User class="size-4 text-slate-500" /> Contact Information
				</h2>

				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="company">
						Entity / Company
						{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
					</label>
					<div class="relative">
						<Building2 class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
						<input id="company" bind:value={company} disabled={!!selectedSponsor}
							class="{INPUT_ICON} disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="e.g. MGM Resorts" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="firstName">
							First Name <span class="text-red-400">*</span>
							{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
						</label>
						<input id="firstName" bind:value={firstName} required
							disabled={!!selectedSponsor}
							class="{INPUT} disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Jane" />
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="lastName">
							Last Name <span class="text-red-400">*</span>
							{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
						</label>
						<input id="lastName" bind:value={lastName} required
							disabled={!!selectedSponsor}
							class="{INPUT} disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Smith" />
					</div>
				</div>

				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="email">
						Email <span class="text-red-400">*</span>
						{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
						<input id="email" type="email" bind:value={email} required
							disabled={!!selectedSponsor}
							class="{INPUT_ICON} disabled:opacity-50 disabled:cursor-not-allowed" placeholder="jane@example.com" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="phone">
							Phone
							{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
						</label>
						<div class="relative">
							<Phone class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
							<input id="phone" bind:value={phone}
								disabled={!!selectedSponsor}
								class="{INPUT_ICON} disabled:opacity-50 disabled:cursor-not-allowed" placeholder="+1 (555) 000-0000" />
						</div>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="location">
							Location
							{#if selectedSponsor}<span class="text-slate-600 ml-1">— auto-filled</span>{/if}
						</label>
						<div class="relative">
							<MapPin class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
							<input id="location" bind:value={location}
								disabled={!!selectedSponsor}
								class="{INPUT_ICON} disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Las Vegas, NV" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex justify-end">
			<button onclick={next} disabled={!step1Valid}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
				Next <ArrowRight class="size-4" />
			</button>
		</div>

	<!-- Step 2: Franchise -->
	{:else if step === 2}
		<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
			<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
				<Target class="size-4 text-slate-500" /> Franchise Interest
			</h2>

			<div class="space-y-1.5">
				<label class="text-xs text-slate-400" for="franchiseId">Which franchise slot?</label>
				<select id="franchiseId" bind:value={franchiseId} class={INPUT}>
					<option value="">— Not decided yet —</option>
					{#each franchises as f}
						<option value={f.id}>{f.name}{f.territory ? ` — ${f.territory}` : ''}</option>
					{/each}
				</select>
			</div>

			{#if franchiseId}
				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="preferredName">
						Preferred Name
						<span class="text-slate-600 font-normal ml-1">— optional rename for their area</span>
					</label>
					<input id="preferredName" bind:value={preferredName} class={INPUT} placeholder="e.g. Desert Eagles" />
				</div>
			{/if}

			<div class="space-y-1.5">
				<label class="text-xs text-slate-400" for="territory">Territory Interest</label>
				<select id="territory" bind:value={territory} class={INPUT}>
					<option value="">— None selected —</option>
					{#each territories as t}
						<option value={t.id}>{t.name}{t.state ? ` (${t.state})` : ''}</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="source">Source</label>
					<select id="source" bind:value={source} class={INPUT}>
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
					<label class="text-xs text-slate-400" for="assignedTo">Assigned To</label>
					<select id="assignedTo" bind:value={assignedTo} class={INPUT}>
						<option value="">— Unassigned —</option>
						{#each userProfiles as u}
							<option value={u.id}>{u.firstName} {u.lastName}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<div class="flex justify-between">
			<button onclick={back}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
				<ArrowLeft class="size-4" /> Back
			</button>
			<button onclick={next}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
				Next <ArrowRight class="size-4" />
			</button>
		</div>

	<!-- Step 3: Qualify -->
	{:else if step === 3}
		<div class="space-y-4">
			<div class="rounded-xl border border-slate-700 bg-slate-800/40 p-5 space-y-4">
				<h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
					<DollarSign class="size-4 text-slate-500" /> Qualification
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="netWorth">Net Worth</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
							<input id="netWorth" type="number" min="0" bind:value={netWorth}
								class="w-full rounded-lg bg-slate-900 border border-slate-700 pl-7 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
								placeholder="10,000,000" />
						</div>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="liquidCapital">Liquid Capital</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
							<input id="liquidCapital" type="number" min="0" bind:value={liquidCapital}
								class="w-full rounded-lg bg-slate-900 border border-slate-700 pl-7 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
								placeholder="2,000,000" />
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="experienceLevel">Business Experience</label>
						<select id="experienceLevel" bind:value={experienceLevel} class={INPUT}>
							<option value="none">None</option>
							<option value="some">Some</option>
							<option value="extensive">Extensive</option>
						</select>
					</div>
					<div class="space-y-1.5">
						<label class="text-xs text-slate-400" for="status">Lead Status</label>
						<select id="status" bind:value={status} class={INPUT}>
							<option value="new">New</option>
							<option value="contacted">Contacted</option>
							<option value="qualified">Qualified</option>
							<option value="unqualified">Unqualified</option>
							<option value="converted">Converted</option>
							<option value="lost">Lost</option>
						</select>
					</div>
				</div>

				<div class="space-y-1.5">
					<label class="text-xs text-slate-400" for="notes">Notes</label>
					<textarea id="notes" bind:value={notes} rows="4"
						class="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
						placeholder="Background, referral context, key talking points…"></textarea>
				</div>
			</div>

			<!-- Review summary -->
			<div class="rounded-xl border border-slate-700/60 bg-slate-800/20 p-4">
				<p class="text-sm font-medium text-slate-300 mb-3">Review</p>
				<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
					<div><p class="text-slate-600">Name</p><p class="text-slate-200">{firstName} {lastName}</p></div>
					<div><p class="text-slate-600">Entity</p><p class="text-slate-200">{company || '—'}</p></div>
					<div><p class="text-slate-600">Email</p><p class="text-slate-200">{email}</p></div>
					<div><p class="text-slate-600">Franchise</p><p class="text-slate-200">{selectedFranchise?.name ?? '—'}{preferredName ? ` → "${preferredName}"` : ''}</p></div>
					<div><p class="text-slate-600">Sponsor</p><p class="text-slate-200">{selectedSponsor?.companyName ?? '—'}</p></div>
					<div><p class="text-slate-600">Source</p><p class="text-slate-200 capitalize">{source.replace('_',' ')}</p></div>
				</div>
			</div>
		</div>

		<div class="flex justify-between">
			<button onclick={back}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
				<ArrowLeft class="size-4" /> Back
			</button>
			<button onclick={submit} disabled={saving}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
				{#if saving}<Loader class="size-4 animate-spin" />{:else}<Check class="size-4" />{/if}
				Create Lead
			</button>
		</div>
	{/if}

</div>
