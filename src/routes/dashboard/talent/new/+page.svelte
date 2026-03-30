<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, UserPlus } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const TALENT_TYPES = ['player', 'broadcaster', 'commentator', 'analyst'];
	const STATUSES = ['active', 'inactive', 'retired'];
	const GENDERS = ['male', 'female', 'other'];

	const INPUT = 'w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';
	const LABEL = 'block text-sm font-medium text-gray-300 mb-1';
	const SECTION = 'bg-gray-800 rounded-lg border border-gray-700 p-6';
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="flex items-center gap-4 mb-6">
		<Button href="/dashboard/talent" variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5">
			<ArrowLeft class="size-4" /> Back
		</Button>
		<div>
			<h1 class="text-2xl font-bold text-white">Add Talent</h1>
			<p class="text-sm text-gray-400">Create a new talent profile</p>
		</div>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300 mb-6">
			{form.error}
		</div>
	{/if}

	<form method="POST" enctype="multipart/form-data" use:enhance class="space-y-6">

		<!-- Basic Info -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Basic Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="name" class={LABEL}>Full Name *</label>
					<input id="name" name="name" required placeholder="e.g. Jordan Smith" class={INPUT} />
				</div>
				<div>
					<label for="nickname" class={LABEL}>Nickname</label>
					<input id="nickname" name="nickname" placeholder="e.g. The Shark" class={INPUT} />
				</div>
				<div>
					<label for="status" class={LABEL}>Status *</label>
					<select id="status" name="status" required class={INPUT}>
						{#each STATUSES as s}
							<option value={s} selected={s === 'active'}>{s}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="gender" class={LABEL}>Gender</label>
					<select id="gender" name="gender" class={INPUT}>
						<option value="">— Not specified —</option>
						{#each GENDERS as g}
							<option value={g}>{g}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="mt-4">
				<label class={LABEL}>Talent Type *</label>
				<div class="flex flex-wrap gap-4 mt-1">
					{#each TALENT_TYPES as type}
						<label class="flex items-center gap-2 cursor-pointer">
							<input type="checkbox" name="talentType" value={type}
								class="rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500" />
							<span class="text-sm text-gray-300 capitalize">{type}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="mt-4">
				<label for="avatar" class={LABEL}>Avatar</label>
				<input type="file" id="avatar" name="avatar" accept="image/*"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-600 file:text-white file:text-sm" />
			</div>
		</div>

		<!-- Location & Demographics -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Location & Demographics</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="country" class={LABEL}>Country</label>
					<input id="country" name="country" placeholder="e.g. USA" class={INPUT} />
				</div>
				<div>
					<label for="residence" class={LABEL}>Residence</label>
					<input id="residence" name="residence" placeholder="City, State" class={INPUT} />
				</div>
				<div>
					<label for="dateOfBirth" class={LABEL}>Date of Birth</label>
					<input type="date" id="dateOfBirth" name="dateOfBirth" class={INPUT} />
				</div>
				<div>
					<label for="worldRanking" class={LABEL}>World Ranking</label>
					<input type="number" id="worldRanking" name="worldRanking" min="1" placeholder="e.g. 42" class={INPUT} />
				</div>
				<div>
					<label for="height" class={LABEL}>Height</label>
					<input id="height" name="height" placeholder="e.g. 6'2&quot;" class={INPUT} />
				</div>
				<div>
					<label for="weight" class={LABEL}>Weight</label>
					<input id="weight" name="weight" placeholder="e.g. 180 lbs" class={INPUT} />
				</div>
			</div>
		</div>

		<!-- Career Info -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Career Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="yearTurnedPro" class={LABEL}>Year Turned Pro</label>
					<input type="number" id="yearTurnedPro" name="yearTurnedPro" min="1900" max="2100" placeholder="e.g. 2018" class={INPUT} />
				</div>
				<div>
					<label for="sponsoredBy" class={LABEL}>Sponsored By</label>
					<input id="sponsoredBy" name="sponsoredBy" class={INPUT} />
				</div>
				<div>
					<label for="primarySponsor" class={LABEL}>Primary Sponsor</label>
					<input id="primarySponsor" name="primarySponsor" class={INPUT} />
				</div>
				<div>
					<label for="favoriteDisc" class={LABEL}>Favorite Disc</label>
					<input id="favoriteDisc" name="favoriteDisc" class={INPUT} />
				</div>
				<div class="md:col-span-2">
					<label for="signatureMove" class={LABEL}>Signature Move</label>
					<input id="signatureMove" name="signatureMove" class={INPUT} />
				</div>
			</div>
			<div class="mt-4">
				<label for="careerHighlights" class={LABEL}>Career Highlights</label>
				<textarea id="careerHighlights" name="careerHighlights" rows="4" class={INPUT}></textarea>
			</div>
			<div class="mt-4">
				<label for="notableRecords" class={LABEL}>Notable Records</label>
				<textarea id="notableRecords" name="notableRecords" rows="3" class={INPUT}></textarea>
			</div>
		</div>

		<!-- Bio -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Biography</h2>
			<label for="bio" class={LABEL}>Bio</label>
			<textarea id="bio" name="bio" rows="6" placeholder="Brief background about this talent..." class={INPUT}></textarea>
		</div>

		<!-- Personal Info -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Personal Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="education" class={LABEL}>Education</label>
					<input id="education" name="education" class={INPUT} />
				</div>
				<div>
					<label for="otherSports" class={LABEL}>Other Sports</label>
					<input id="otherSports" name="otherSports" class={INPUT} />
				</div>
				<div>
					<label for="hobbies" class={LABEL}>Hobbies</label>
					<input id="hobbies" name="hobbies" class={INPUT} />
				</div>
				<div>
					<label for="favoriteDestination" class={LABEL}>Favorite Destination</label>
					<input id="favoriteDestination" name="favoriteDestination" class={INPUT} />
				</div>
			</div>
			<div class="mt-4">
				<label for="personalMotivation" class={LABEL}>Personal Motivation</label>
				<textarea id="personalMotivation" name="personalMotivation" rows="3" class={INPUT}></textarea>
			</div>
		</div>

		<!-- Social Media -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Social Media & Links</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="website" class={LABEL}>Website</label>
					<input type="url" id="website" name="website" placeholder="https://" class={INPUT} />
				</div>
				<div>
					<label for="tiktok" class={LABEL}>TikTok</label>
					<input id="tiktok" name="tiktok" placeholder="@username" class={INPUT} />
				</div>
				<div>
					<label for="twitch" class={LABEL}>Twitch</label>
					<input id="twitch" name="twitch" placeholder="username" class={INPUT} />
				</div>
			</div>
		</div>

		<!-- Travel Info -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Travel Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="primaryAirport" class={LABEL}>Primary Airport</label>
					<input id="primaryAirport" name="primaryAirport" placeholder="e.g. LAX" class={INPUT} />
				</div>
				<div>
					<label for="secondaryAirport" class={LABEL}>Secondary Airport</label>
					<input id="secondaryAirport" name="secondaryAirport" class={INPUT} />
				</div>
				<div class="md:col-span-2">
					<label for="frequentFlyerNumbers" class={LABEL}>Frequent Flyer Numbers</label>
					<input id="frequentFlyerNumbers" name="frequentFlyerNumbers" class={INPUT} />
				</div>
			</div>
		</div>

		<!-- Health & Fitness -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Health & Fitness</h2>
			<div class="space-y-4">
				<div>
					<label for="injuryHistory" class={LABEL}>Injury History</label>
					<textarea id="injuryHistory" name="injuryHistory" rows="3" class={INPUT}></textarea>
				</div>
				<div>
					<label for="fitnessRegimen" class={LABEL}>Fitness Regimen</label>
					<textarea id="fitnessRegimen" name="fitnessRegimen" rows="3" class={INPUT}></textarea>
				</div>
				<div>
					<label for="dietaryPreferences" class={LABEL}>Dietary Preferences</label>
					<input id="dietaryPreferences" name="dietaryPreferences" class={INPUT} />
				</div>
			</div>
		</div>

		<!-- Goals -->
		<div class={SECTION}>
			<h2 class="text-xl font-semibold text-white mb-4">Goals & Mission</h2>
			<div class="space-y-4">
				<div>
					<label for="longTermGoals" class={LABEL}>Long Term Goals</label>
					<textarea id="longTermGoals" name="longTermGoals" rows="3" class={INPUT}></textarea>
				</div>
				<div>
					<label for="missionStatement" class={LABEL}>Mission Statement</label>
					<textarea id="missionStatement" name="missionStatement" rows="3" class={INPUT}></textarea>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3 pb-6">
			<Button href="/dashboard/talent" variant="outline" class="border-slate-600 text-slate-300 hover:bg-slate-700">
				Cancel
			</Button>
			<Button type="submit" class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<UserPlus class="size-4" /> Add Talent
			</Button>
		</div>

	</form>
</div>
