<script lang="ts">
	import type { ActionData } from './$types';
	import { ArrowRight, ArrowLeft, Building2, User, CheckCircle2, Package, Briefcase, Globe, Phone, MapPin, FileText } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();

	// ── Multi-step state ──────────────────────────────────────────────────────
	let step = $state(1);
	const TOTAL_STEPS = 3;

	// ── Form fields ───────────────────────────────────────────────────────────
	let firstName   = $state((form as any)?.firstName   ?? '');
	let lastName    = $state((form as any)?.lastName    ?? '');
	let email       = $state((form as any)?.email       ?? '');
	let password    = $state('');
	let confirmPwd  = $state('');

	let companyName = $state((form as any)?.companyName ?? '');
	let category    = $state((form as any)?.category    ?? '');
	let website     = $state((form as any)?.website     ?? '');
	let phone       = $state((form as any)?.phone       ?? '');
	let about       = $state((form as any)?.about       ?? '');
	let location    = $state((form as any)?.location    ?? '');

	let loading     = $state(false);
	let step1Err    = $state('');
	let step2Err    = $state('');

	// If server returned an error, show on step 1 or 2 depending on which field
	const serverErr = $derived((form as any)?.error ?? '');

	const CATEGORIES = [
		'Audio / Visual',
		'Broadcasting & Production',
		'Catering & Hospitality',
		'Construction & Fabrication',
		'Design & Creative',
		'Event Staffing',
		'IT & Technology',
		'Legal & Compliance',
		'Logistics & Transportation',
		'Marketing & Advertising',
		'Photography & Videography',
		'Print & Signage',
		'Security',
		'Software & Development',
		'Venue & Facilities',
		'Other',
	];

	// ── Step validation ───────────────────────────────────────────────────────
	function validateStep1(): boolean {
		step1Err = '';
		if (!firstName.trim() || !lastName.trim()) { step1Err = 'First and last name are required.'; return false; }
		if (!email.trim() || !email.includes('@'))  { step1Err = 'A valid email is required.'; return false; }
		if (password.length < 8)                    { step1Err = 'Password must be at least 8 characters.'; return false; }
		if (password !== confirmPwd)                { step1Err = 'Passwords do not match.'; return false; }
		return true;
	}

	function validateStep2(): boolean {
		step2Err = '';
		if (!companyName.trim()) { step2Err = 'Company name is required.'; return false; }
		if (!category)           { step2Err = 'Please select a service category.'; return false; }
		return true;
	}

	function nextStep() {
		if (step === 1 && !validateStep1()) return;
		if (step === 2 && !validateStep2()) return;
		step = Math.min(step + 1, TOTAL_STEPS);
	}

	function prevStep() {
		step = Math.max(step - 1, 1);
	}

	const INPUT = 'w-full px-4 py-3 border-2 border-slate-700 bg-slate-800 text-white rounded-xl focus:outline-none focus:border-orange-500 placeholder:text-slate-500 text-sm transition-colors';
	const LABEL = 'block text-sm font-semibold text-slate-300 mb-1.5';
</script>

<svelte:head>
	<title>Register as Vendor — FliHub</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-lg">

		<!-- Logo -->
		<div class="flex items-center justify-center gap-3 mb-8">
			<div class="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
				<span class="text-2xl font-black text-white">F</span>
			</div>
			<div>
				<span class="text-xl font-bold text-white tracking-tight">FliHub</span>
				<p class="text-xs text-slate-500 uppercase tracking-wider">Vendor Portal</p>
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				{#each Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1) as s}
					<div class="flex items-center {s < TOTAL_STEPS ? 'flex-1' : ''}">
						<div class="flex items-center justify-center size-8 rounded-full border-2 text-xs font-bold transition-all
							{s < step  ? 'bg-orange-500 border-orange-500 text-white' :
							 s === step ? 'border-orange-500 text-orange-400 bg-orange-500/10' :
							              'border-slate-700 text-slate-600'}">
							{#if s < step}
								<CheckCircle2 class="size-4" />
							{:else}
								{s}
							{/if}
						</div>
						{#if s < TOTAL_STEPS}
							<div class="flex-1 h-0.5 mx-2 rounded-full transition-all {s < step ? 'bg-orange-500' : 'bg-slate-700'}"></div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="flex justify-between text-[10px] text-slate-500 uppercase tracking-wide">
				<span>Your Account</span>
				<span>Company Info</span>
				<span>Review</span>
			</div>
		</div>

		<!-- Card -->
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

			<!-- Step header -->
			<div class="px-8 pt-8 pb-6 border-b border-slate-800">
				{#if step === 1}
					<div class="flex items-center gap-3 mb-1">
						<div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
							<User class="size-4 text-blue-400" />
						</div>
						<h1 class="text-xl font-bold text-white">Create Your Account</h1>
					</div>
					<p class="text-sm text-slate-400">Your personal login credentials for the vendor portal.</p>
				{:else if step === 2}
					<div class="flex items-center gap-3 mb-1">
						<div class="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
							<Building2 class="size-4 text-orange-400" />
						</div>
						<h1 class="text-xl font-bold text-white">Company Information</h1>
					</div>
					<p class="text-sm text-slate-400">Tell us about your business so we can match you to relevant projects.</p>
				{:else}
					<div class="flex items-center gap-3 mb-1">
						<div class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
							<CheckCircle2 class="size-4 text-emerald-400" />
						</div>
						<h1 class="text-xl font-bold text-white">Review & Submit</h1>
					</div>
					<p class="text-sm text-slate-400">Confirm your details before creating your vendor account.</p>
				{/if}
			</div>

			<div class="px-8 py-6">

				<!-- ── STEP 1 — Account ─────────────────────────────────────── -->
				{#if step === 1}
					<div class="space-y-4">
						{#if step1Err || serverErr}
							<div class="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
								{step1Err || serverErr}
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class={LABEL}>First Name <span class="text-red-400">*</span></label>
								<input bind:value={firstName} type="text" placeholder="Jane" class={INPUT} />
							</div>
							<div>
								<label class={LABEL}>Last Name <span class="text-red-400">*</span></label>
								<input bind:value={lastName} type="text" placeholder="Smith" class={INPUT} />
							</div>
						</div>

						<div>
							<label class={LABEL}>Email Address <span class="text-red-400">*</span></label>
							<input bind:value={email} type="email" placeholder="jane@yourcompany.com" class={INPUT} />
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class={LABEL}>Password <span class="text-red-400">*</span></label>
								<input bind:value={password} type="password" placeholder="••••••••" class={INPUT} />
								<p class="text-[10px] text-slate-500 mt-1">At least 8 characters</p>
							</div>
							<div>
								<label class={LABEL}>Confirm Password <span class="text-red-400">*</span></label>
								<input bind:value={confirmPwd} type="password" placeholder="••••••••" class={INPUT} />
							</div>
						</div>
					</div>

				<!-- ── STEP 2 — Company ─────────────────────────────────────── -->
				{:else if step === 2}
					<div class="space-y-4">
						{#if step2Err}
							<div class="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
								{step2Err}
							</div>
						{/if}

						<div>
							<label class={LABEL}>Company / Business Name <span class="text-red-400">*</span></label>
							<input bind:value={companyName} type="text" placeholder="Acme Productions LLC" class={INPUT} />
						</div>

						<div>
							<label class={LABEL}>Service Category <span class="text-red-400">*</span></label>
							<select bind:value={category} class="{INPUT} cursor-pointer">
								<option value="">Select your primary service…</option>
								{#each CATEGORIES as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
							<p class="text-[10px] text-slate-500 mt-1">Used to match you to relevant open projects.</p>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class={LABEL}>Phone</label>
								<input bind:value={phone} type="tel" placeholder="+1 (555) 000-0000" class={INPUT} />
							</div>
							<div>
								<label class={LABEL}>Location</label>
								<input bind:value={location} type="text" placeholder="Las Vegas, NV" class={INPUT} />
							</div>
						</div>

						<div>
							<label class={LABEL}>Website</label>
							<input bind:value={website} type="url" placeholder="https://yourcompany.com" class={INPUT} />
						</div>

						<div>
							<label class={LABEL}>About Your Business</label>
							<textarea bind:value={about} rows="3" placeholder="Brief description of your services, experience, and what makes you a great fit for FLI Golf projects…"
								class="{INPUT} resize-none"></textarea>
						</div>
					</div>

				<!-- ── STEP 3 — Review ──────────────────────────────────────── -->
				{:else}
					<div class="space-y-4">
						{#if serverErr}
							<div class="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
								{serverErr}
							</div>
						{/if}

						<!-- Account summary -->
						<div class="rounded-xl border border-slate-700 bg-slate-800/50 divide-y divide-slate-700">
							<div class="flex items-center gap-3 px-4 py-3">
								<User class="size-4 text-blue-400 shrink-0" />
								<span class="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Account</span>
								<div class="text-sm text-white">{firstName} {lastName} <span class="text-slate-400">·</span> <span class="text-slate-300">{email}</span></div>
							</div>
							<div class="flex items-center gap-3 px-4 py-3">
								<Building2 class="size-4 text-orange-400 shrink-0" />
								<span class="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Company</span>
								<div class="text-sm text-white">{companyName}</div>
							</div>
							<div class="flex items-center gap-3 px-4 py-3">
								<Package class="size-4 text-orange-400 shrink-0" />
								<span class="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Category</span>
								<div class="text-sm text-white">{category}</div>
							</div>
							{#if location}
							<div class="flex items-center gap-3 px-4 py-3">
								<MapPin class="size-4 text-slate-400 shrink-0" />
								<span class="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Location</span>
								<div class="text-sm text-slate-300">{location}</div>
							</div>
							{/if}
							{#if website}
							<div class="flex items-center gap-3 px-4 py-3">
								<Globe class="size-4 text-slate-400 shrink-0" />
								<span class="text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Website</span>
								<div class="text-sm text-slate-300">{website}</div>
							</div>
							{/if}
						</div>

						<!-- Role badge -->
						<div class="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
							<Briefcase class="size-5 text-orange-400 shrink-0" />
							<div>
								<p class="text-sm font-semibold text-white">You'll be registered as a <span class="text-orange-400">Vendor</span></p>
								<p class="text-xs text-slate-400 mt-0.5">Browse open FLI Golf projects, submit bids, and manage your proposals from your vendor dashboard.</p>
							</div>
						</div>

						<p class="text-[10px] text-slate-500 text-center">
							By registering you agree to FLI Golf's vendor terms. Your account will be reviewed by the operations team before bids are activated.
						</p>
					</div>
				{/if}

			</div>

			<!-- Navigation footer -->
			<div class="px-8 pb-8 flex items-center gap-3">
				{#if step > 1}
					<button
						type="button"
						onclick={prevStep}
						class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
					>
						<ArrowLeft class="size-4" /> Back
					</button>
				{/if}

				{#if step < TOTAL_STEPS}
					<button
						type="button"
						onclick={nextStep}
						class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors"
					>
						Continue <ArrowRight class="size-4" />
					</button>
				{:else}
					<!-- Final submit — real form POST -->
					<form method="POST" class="flex-1" onsubmit={() => loading = true}>
						<input type="hidden" name="firstName"   value={firstName} />
						<input type="hidden" name="lastName"    value={lastName} />
						<input type="hidden" name="email"       value={email} />
						<input type="hidden" name="password"    value={password} />
						<input type="hidden" name="confirmPassword" value={confirmPwd} />
						<input type="hidden" name="companyName" value={companyName} />
						<input type="hidden" name="category"    value={category} />
						<input type="hidden" name="website"     value={website} />
						<input type="hidden" name="phone"       value={phone} />
						<input type="hidden" name="about"       value={about} />
						<input type="hidden" name="location"    value={location} />
						<button
							type="submit"
							disabled={loading}
							class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
						>
							{#if loading}
								<svg class="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
								Creating account…
							{:else}
								<CheckCircle2 class="size-4" /> Create Vendor Account
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>

		<p class="text-center text-sm text-slate-500 mt-6">
			Already have an account? <a href="/auth/login" class="text-orange-400 hover:underline font-medium">Log in</a>
			· <a href="/" class="text-slate-500 hover:text-slate-300">Back to home</a>
		</p>
	</div>
</div>
