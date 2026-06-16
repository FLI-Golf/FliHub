<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { ChevronRight, ChevronLeft, Save, Send, CheckCircle, User, Trophy, Megaphone, Star, Users, Shield, MessageSquare } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const p = data.playerProfile ?? {};

	// ── Multi-step form state ────────────────────────────────────────────
	let currentStep = $state(0);

	const steps = [
		{ id: 'personal', label: 'Personal Info', icon: User },
		{ id: 'competitive', label: 'Competitive Background', icon: Trophy },
		{ id: 'branding', label: 'Branding & Media', icon: Megaphone },
		{ id: 'sponsorship', label: 'Sponsorship', icon: Star },
		{ id: 'management', label: 'Management', icon: Users },
		{ id: 'integrity', label: 'Betting & Integrity', icon: Shield },
		{ id: 'additional', label: 'Additional Info', icon: MessageSquare }
	];

	function next() { if (currentStep < steps.length - 1) currentStep++; }
	function prev() { if (currentStep > 0) currentStep--; }

	const isSubmitted = data.playerProfile?.status === 'submitted' || data.playerProfile?.status === 'approved';
</script>

<svelte:head>
	<title>Player Profile — FLI Golf League</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">

	<!-- Header -->
	<div class="mb-6">
		<a href="/dashboard/onboarding" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
			<ChevronLeft class="w-4 h-4" /> Back to Onboarding
		</a>
		<h1 class="text-2xl font-black tracking-tight">FLI Golf Player Profile</h1>
		<p class="text-muted-foreground mt-1">
			This information is used for broadcast, media, league records, and sponsorship matching.
		</p>
		{#if isSubmitted}
			<div class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
				<CheckCircle class="w-4 h-4" /> Profile submitted — under review
			</div>
		{/if}
	</div>

	{#if form?.error}
		<div class="mb-4 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-700 dark:text-rose-300 font-medium">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 font-medium">
			{form.status === 'submitted' ? 'Profile submitted successfully!' : 'Draft saved.'}
		</div>
	{/if}

	<!-- Step indicator -->
	<div class="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
		{#each steps as step, i}
			{@const Icon = step.icon}
			<button
				type="button"
				onclick={() => (currentStep = i)}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0
					{i === currentStep
						? 'bg-black text-white dark:bg-white dark:text-black'
						: i < currentStep
						? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			>
				{#if i < currentStep}
					<CheckCircle class="w-3.5 h-3.5" />
				{:else}
					<Icon class="w-3.5 h-3.5" />
				{/if}
				{step.label}
			</button>
			{#if i < steps.length - 1}
				<ChevronRight class="w-3 h-3 text-muted-foreground shrink-0" />
			{/if}
		{/each}
	</div>

	<form method="POST" use:enhance class="space-y-6">
		<input type="hidden" name="currentStep" value={steps[currentStep].id} />

		<!-- ── Step 0: Personal Information ─────────────────────────────── -->
		{#if currentStep === 0}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">1. Personal Information</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="fullName">Full Name</label>
						<input id="fullName" name="fullName" type="text" autocomplete="name" value={p.fullName ?? ''} class="field" placeholder="Jane Doe" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="dateOfBirth">Date of Birth</label>
						<input id="dateOfBirth" name="dateOfBirth" type="date" autocomplete="bday" value={p.dateOfBirth ?? ''} class="field" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="nationality">Nationality</label>
						<input id="nationality" name="nationality" type="text" value={p.nationality ?? ''} class="field" placeholder="e.g. American" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="countryOfResidence">Country of Residence</label>
						<input id="countryOfResidence" name="countryOfResidence" type="text" value={p.countryOfResidence ?? ''} class="field" placeholder="e.g. United States" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="primaryLanguages">Primary Language(s)</label>
						<input id="primaryLanguages" name="primaryLanguages" type="text" value={p.primaryLanguages ?? ''} class="field" placeholder="e.g. English, Spanish" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="phone">Phone Number</label>
						<input id="phone" name="phone" type="tel" autocomplete="tel" value={p.phone ?? ''} class="field" placeholder="+1 555 000 0000" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="email">Email Address</label>
						<input id="email" name="email" type="email" autocomplete="email" value={p.email ?? ''} class="field" placeholder="you@example.com" />
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="mailingAddress">Mailing Address</label>
						<textarea id="mailingAddress" name="mailingAddress" rows="2" autocomplete="street-address" class="field resize-none" placeholder="Street, City, State, ZIP, Country">{p.mailingAddress ?? ''}</textarea>
					</div>
				</div>

				<div class="border-t pt-4">
					<h3 class="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wide">Emergency Contact</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-semibold mb-1.5" for="emergencyContactName">Name</label>
							<input id="emergencyContactName" name="emergencyContactName" type="text" autocomplete="section-emergency name" value={p.emergencyContactName ?? ''} class="field" />
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1.5" for="emergencyContactRelationship">Relationship</label>
							<input id="emergencyContactRelationship" name="emergencyContactRelationship" type="text" value={p.emergencyContactRelationship ?? ''} class="field" placeholder="e.g. Spouse, Parent" />
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1.5" for="emergencyContactPhone">Phone</label>
							<input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" autocomplete="section-emergency tel" value={p.emergencyContactPhone ?? ''} class="field" />
						</div>
						<div>
							<label class="block text-sm font-semibold mb-1.5" for="emergencyContactEmail">Email</label>
							<input id="emergencyContactEmail" name="emergencyContactEmail" type="email" autocomplete="section-emergency email" value={p.emergencyContactEmail ?? ''} class="field" />
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 1: Competitive Background ───────────────────────────── -->
		{#if currentStep === 1}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">2. Competitive Background</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="worldRanking">Current World Ranking</label>
						<input id="worldRanking" name="worldRanking" type="number" min="1" value={p.worldRanking ?? ''} class="field" placeholder="e.g. 12" />
						<p class="text-xs text-muted-foreground mt-1">Must be in the top 24 to qualify</p>
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="yearsCompeting">Years Competing Professionally</label>
						<input id="yearsCompeting" name="yearsCompeting" type="number" min="0" value={p.yearsCompeting ?? ''} class="field" />
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="majorTournamentWins">Previous Major Tournament Wins (Top 5)</label>
						<textarea id="majorTournamentWins" name="majorTournamentWins" rows="3" class="field resize-none" placeholder="List your top 5 major wins...">{p.majorTournamentWins ?? ''}</textarea>
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="notableAchievements">Notable Achievements</label>
						<textarea id="notableAchievements" name="notableAchievements" rows="3" class="field resize-none" placeholder="Player of the Year awards, tour championships, records...">{p.notableAchievements ?? ''}</textarea>
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="otherLeagues">Other Disc Golf Leagues/Tours Currently Competing In</label>
						<input id="otherLeagues" name="otherLeagues" type="text" value={p.otherLeagues ?? ''} class="field" placeholder="e.g. PDGA, DGPT" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="playingStyle">Preferred Playing Style</label>
						<input id="playingStyle" name="playingStyle" type="text" value={p.playingStyle ?? ''} class="field" placeholder="e.g. Aggressive, Strategic, Technical" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="strongestSkills">Strongest Disc Golf Skills</label>
						<input id="strongestSkills" name="strongestSkills" type="text" value={p.strongestSkills ?? ''} class="field" placeholder="e.g. Putting, Driving distance, Shot shaping" />
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="knownInjuries">Known Injuries or Physical Limitations</label>
						<textarea id="knownInjuries" name="knownInjuries" rows="2" class="field resize-none" placeholder="List any current or recurring injuries...">{p.knownInjuries ?? ''}</textarea>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 2: Branding & Media ──────────────────────────────────── -->
		{#if currentStep === 2}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">3. Branding & Media Presence</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="broadcastNickname">Preferred Name/Nickname for Broadcast & Marketing</label>
						<input id="broadcastNickname" name="broadcastNickname" type="text" value={p.broadcastNickname ?? ''} class="field" placeholder="e.g. 'The Hawk'" />
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="instagram">Instagram Handle</label>
						<input id="instagram" name="instagram" type="text" value={p.instagram ?? ''} class="field" placeholder="@username" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="twitter">Twitter/X Handle</label>
						<input id="twitter" name="twitter" type="text" value={p.twitter ?? ''} class="field" placeholder="@username" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="youtube">YouTube Channel</label>
						<input id="youtube" name="youtube" type="text" value={p.youtube ?? ''} class="field" placeholder="Channel name or URL" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="otherSocialMedia">Other Social Media</label>
						<input id="otherSocialMedia" name="otherSocialMedia" type="text" value={p.otherSocialMedia ?? ''} class="field" placeholder="TikTok, Twitch, etc." />
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="personalWebsite">Personal Website or Media Links</label>
						<input id="personalWebsite" name="personalWebsite" type="url" autocomplete="url" value={p.personalWebsite ?? ''} class="field" placeholder="https://yoursite.com" />
					</div>

					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="mediaFeatures">Featured in Disc Golf Media, Documentaries, or Interviews?</label>
						<textarea id="mediaFeatures" name="mediaFeatures" rows="3" class="field resize-none" placeholder="List any notable media appearances...">{p.mediaFeatures ?? ''}</textarea>
					</div>

					<div class="sm:col-span-2 space-y-3">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="comfortableWithInterviews" type="checkbox" name="comfortableWithInterviews" value="true" checked={p.comfortableWithInterviews ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I am comfortable participating in interviews & media appearances</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="openToBehindScenes" type="checkbox" name="openToBehindScenes" value="true" checked={p.openToBehindScenes ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I am open to behind-the-scenes content or mic'd up segments</span>
						</label>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 3: Sponsorship ───────────────────────────────────────── -->
		{#if currentStep === 3}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">4. Sponsorship & Endorsement Details</h2>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="currentSponsorships">Current Sponsorships</label>
						<textarea id="currentSponsorships" name="currentSponsorships" rows="3" class="field resize-none" placeholder="List disc, apparel, accessory, and other brand sponsors...">{p.currentSponsorships ?? ''}</textarea>
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="personalBrandingGoals">Personal Branding Goals</label>
						<textarea id="personalBrandingGoals" name="personalBrandingGoals" rows="3" class="field resize-none" placeholder="e.g. Signature disc, apparel line, personal brand growth...">{p.personalBrandingGoals ?? ''}</textarea>
					</div>

					<div class="space-y-3">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="openToNewSponsors" type="checkbox" name="openToNewSponsors" value="true" checked={p.openToNewSponsors ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I am open to new sponsorship & endorsement deals</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="wantsLeagueSponsorHelp" type="checkbox" name="wantsLeagueSponsorHelp" value="true" checked={p.wantsLeagueSponsorHelp ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I would like assistance from FLI Golf in securing sponsorships</span>
						</label>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 4: Management / Representation ───────────────────────── -->
		{#if currentStep === 4}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">5. Management / Representation Contact</h2>

				<label class="flex items-center gap-3 cursor-pointer group mb-2">
					<input id="hasAgent" type="checkbox" name="hasAgent" value="true" checked={p.hasAgent ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
					<span class="text-sm font-semibold group-hover:text-foreground transition-colors">I have an agent or manager</span>
				</label>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="repName">Representative Name</label>
						<input id="repName" name="repName" type="text" autocomplete="section-rep name" value={p.repName ?? ''} class="field" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="repAgency">Agency or Management Firm</label>
						<input id="repAgency" name="repAgency" type="text" autocomplete="organization" value={p.repAgency ?? ''} class="field" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="repPosition">Position</label>
						<input id="repPosition" name="repPosition" type="text" value={p.repPosition ?? ''} class="field" placeholder="e.g. Agent, PR Manager, Business Manager" />
					</div>
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="repPhone">Phone</label>
						<input id="repPhone" name="repPhone" type="tel" autocomplete="section-rep tel" value={p.repPhone ?? ''} class="field" />
					</div>
					<div class="sm:col-span-2">
						<label class="block text-sm font-semibold mb-1.5" for="repEmail">Email</label>
						<input id="repEmail" name="repEmail" type="email" autocomplete="section-rep email" value={p.repEmail ?? ''} class="field" />
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 5: Betting & Integrity ──────────────────────────────── -->
		{#if currentStep === 5}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">6. Betting & Competitive Integrity</h2>

				<div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
					All responses are confidential and used solely for league compliance purposes. Honest disclosure is required under the FLI Golf Integrity Policy.
				</div>

				<div class="space-y-4">
					<div class="space-y-3">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="participatedInBetting" type="checkbox" name="participatedInBetting" value="true" checked={p.participatedInBetting ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I have participated in sports betting</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="understandsIntegrityPolicy" type="checkbox" name="understandsIntegrityPolicy" value="true" checked={p.understandsIntegrityPolicy ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I understand the FLI Golf Integrity & Substance Policy regarding gambling</span>
						</label>
						<label class="flex items-center gap-3 cursor-pointer group">
							<input id="priorIntegrityViolations" type="checkbox" name="priorIntegrityViolations" value="true" checked={p.priorIntegrityViolations ?? false} class="w-4 h-4 rounded border-2 border-input accent-black" />
							<span class="text-sm font-medium group-hover:text-foreground transition-colors">I have been suspended or disciplined for integrity violations in any sport</span>
						</label>
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="integrityViolationDetails">If yes to prior violations, please explain</label>
						<textarea id="integrityViolationDetails" name="integrityViolationDetails" rows="3" class="field resize-none" placeholder="Provide details of any prior integrity violations...">{p.integrityViolationDetails ?? ''}</textarea>
					</div>
				</div>
			</div>
		{/if}

		<!-- ── Step 6: Additional Information ───────────────────────────── -->
		{#if currentStep === 6}
			<div class="space-y-5">
				<h2 class="text-lg font-bold border-b pb-2">7. Additional Information</h2>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-semibold mb-1.5" for="excitementAboutLeague">What excites you most about competing in FLI Golf?</label>
						<textarea id="excitementAboutLeague" name="excitementAboutLeague" rows="4" class="field resize-none" placeholder="Tell us what draws you to the FLI Golf League...">{p.excitementAboutLeague ?? ''}</textarea>
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="careerGoals">What are your career goals in professional disc golf?</label>
						<textarea id="careerGoals" name="careerGoals" rows="4" class="field resize-none" placeholder="Short-term and long-term goals...">{p.careerGoals ?? ''}</textarea>
					</div>

					<div>
						<label class="block text-sm font-semibold mb-1.5" for="additionalInfo">Anything else you want the league to know about you?</label>
						<textarea id="additionalInfo" name="additionalInfo" rows="4" class="field resize-none" placeholder="Any other relevant information...">{p.additionalInfo ?? ''}</textarea>
					</div>
				</div>

				<!-- Final submission notice -->
				<div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
					<strong>Ready to submit?</strong> Use "Save Draft" to save your progress, or "Submit Profile" to send your completed profile to the FLI Golf League team.
				</div>
			</div>
		{/if}

		<!-- ── Navigation ────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between pt-4 border-t">
			<button
				type="button"
				onclick={prev}
				disabled={currentStep === 0}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<ChevronLeft class="w-4 h-4" /> Previous
			</button>

			<div class="flex items-center gap-2">
				<!-- Save draft (always available) -->
				<button
					formaction="?/saveDraft"
					type="submit"
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-border font-semibold text-sm hover:bg-muted transition-colors"
				>
					<Save class="w-4 h-4" /> Save Draft
				</button>

				{#if currentStep < steps.length - 1}
					<button
						type="button"
						onclick={next}
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:opacity-90 transition-opacity"
					>
						Next <ChevronRight class="w-4 h-4" />
					</button>
				{:else}
					<button
						formaction="?/submit"
						type="submit"
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
					>
						<Send class="w-4 h-4" /> Submit Profile
					</button>
				{/if}
			</div>
		</div>

	</form>
</div>

<style>
	:global(.field) {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 2px solid hsl(var(--input));
		border-radius: 0.5rem;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.875rem;
		font-weight: 500;
		transition: border-color 0.15s, box-shadow 0.15s;
		outline: none;
	}
	:global(.field:focus) {
		border-color: hsl(var(--foreground));
		box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.1);
	}
	:global(.field::placeholder) {
		color: hsl(var(--muted-foreground));
		font-weight: 400;
	}
</style>
