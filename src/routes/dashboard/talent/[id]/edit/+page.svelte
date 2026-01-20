<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Trash2 } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const talent = $derived(data.talent);

	const TALENT_TYPES = ['player', 'broadcaster', 'commentator', 'analyst'];
	const STATUSES = ['active', 'inactive', 'retired'];
	const GENDERS = ['male', 'female', 'other'];

	let showDeleteConfirm = $state(false);

	function handleDeleteClick() {
		console.log('handleDeleteClick called');
		showDeleteConfirm = true;
	}

	function handleCancelDelete() {
		console.log('handleCancelDelete called');
		showDeleteConfirm = false;
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-white">Edit Talent</h1>
			<p class="text-gray-400">Update {talent.name}'s profile</p>
		</div>
		<div class="flex gap-2">
			<button 
				type="button"
				onclick={handleDeleteClick}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
			>
				<Trash2 class="w-4 h-4" />
				Delete
			</button>
			<Button href="/dashboard/talent/{talent.id}" variant="outline">Cancel</Button>
		</div>
	</div>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-lg mx-4">
				<h3 class="text-xl font-semibold text-white mb-2">Delete Talent?</h3>
				<p class="text-gray-400 mb-4">
					Are you sure you want to delete <strong class="text-white">{talent.name}</strong>? 
					This action cannot be undone and will remove all associated data.
				</p>
				{#if form?.error}
					<div class="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
						<p class="text-red-400 text-sm">{form.error}</p>
					</div>
				{/if}
				<div class="flex justify-end gap-3">
					<button 
						type="button"
						onclick={handleCancelDelete}
						class="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-gray-600 bg-gray-700 hover:bg-gray-600 text-white transition-colors"
					>
						Cancel
					</button>
					<form method="POST" action="?/delete" use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}>
						<button 
							type="submit" 
							class="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
						>
							Delete Permanently
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
			<p class="text-red-400">{form.error}</p>
		</div>
	{/if}

	<form method="POST" action="?/update" enctype="multipart/form-data" use:enhance class="space-y-8">
		<!-- Basic Info -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Basic Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-300 mb-1">Name *</label>
					<input
						type="text"
						id="name"
						name="name"
						value={talent.name}
						required
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="nickname" class="block text-sm font-medium text-gray-300 mb-1">Nickname</label>
					<input
						type="text"
						id="nickname"
						name="nickname"
						value={talent.nickname || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="status" class="block text-sm font-medium text-gray-300 mb-1">Status *</label>
					<select
						id="status"
						name="status"
						required
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>
						{#each STATUSES as status}
							<option value={status} selected={talent.status === status}>{status}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="gender" class="block text-sm font-medium text-gray-300 mb-1">Gender</label>
					<select
						id="gender"
						name="gender"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>
						<option value="">Not specified</option>
						{#each GENDERS as gender}
							<option value={gender} selected={talent.gender === gender}>{gender}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="mt-4">
				<label class="block text-sm font-medium text-gray-300 mb-2">Talent Type *</label>
				<div class="flex flex-wrap gap-4">
					{#each TALENT_TYPES as type}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								name="talentType"
								value={type}
								checked={talent.talentType?.includes(type)}
								class="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-gray-300 capitalize">{type}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="mt-4">
				<label for="avatar" class="block text-sm font-medium text-gray-300 mb-1">Avatar</label>
				{#if data.avatarUrl}
					<div class="mb-2">
						<img 
							src={data.avatarUrl}
							alt="Current avatar" 
							class="w-20 h-20 rounded-full object-cover"
						/>
					</div>
				{/if}
				<input
					type="file"
					id="avatar"
					name="avatar"
					accept="image/*"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-600 file:text-white"
				/>
			</div>
		</div>

		<!-- Location & Demographics -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Location & Demographics</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="country" class="block text-sm font-medium text-gray-300 mb-1">Country</label>
					<input
						type="text"
						id="country"
						name="country"
						value={talent.country || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="residence" class="block text-sm font-medium text-gray-300 mb-1">Residence</label>
					<input
						type="text"
						id="residence"
						name="residence"
						value={talent.residence || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="dateOfBirth" class="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
					<input
						type="date"
						id="dateOfBirth"
						name="dateOfBirth"
						value={talent.dateOfBirth?.split('T')[0] || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="worldRanking" class="block text-sm font-medium text-gray-300 mb-1">World Ranking</label>
					<input
						type="number"
						id="worldRanking"
						name="worldRanking"
						value={talent.worldRanking || ''}
						min="1"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="height" class="block text-sm font-medium text-gray-300 mb-1">Height</label>
					<input
						type="text"
						id="height"
						name="height"
						value={talent.height || ''}
						placeholder="e.g., 6'2&quot;"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="weight" class="block text-sm font-medium text-gray-300 mb-1">Weight</label>
					<input
						type="text"
						id="weight"
						name="weight"
						value={talent.weight || ''}
						placeholder="e.g., 180 lbs"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
		</div>

		<!-- Career Info -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Career Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="yearTurnedPro" class="block text-sm font-medium text-gray-300 mb-1">Year Turned Pro</label>
					<input
						type="number"
						id="yearTurnedPro"
						name="yearTurnedPro"
						value={talent.yearTurnedPro || ''}
						min="1900"
						max="2100"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="sponsoredBy" class="block text-sm font-medium text-gray-300 mb-1">Sponsored By</label>
					<input
						type="text"
						id="sponsoredBy"
						name="sponsoredBy"
						value={talent.sponsoredBy || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="primarySponsor" class="block text-sm font-medium text-gray-300 mb-1">Primary Sponsor</label>
					<input
						type="text"
						id="primarySponsor"
						name="primarySponsor"
						value={talent.primarySponsor || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="favoriteDisc" class="block text-sm font-medium text-gray-300 mb-1">Favorite Disc</label>
					<input
						type="text"
						id="favoriteDisc"
						name="favoriteDisc"
						value={talent.favoriteDisc || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div class="md:col-span-2">
					<label for="signatureMove" class="block text-sm font-medium text-gray-300 mb-1">Signature Move</label>
					<input
						type="text"
						id="signatureMove"
						name="signatureMove"
						value={talent.signatureMove || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
			<div class="mt-4">
				<label for="careerHighlights" class="block text-sm font-medium text-gray-300 mb-1">Career Highlights</label>
				<textarea
					id="careerHighlights"
					name="careerHighlights"
					rows="4"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
				>{talent.careerHighlights || ''}</textarea>
			</div>
			<div class="mt-4">
				<label for="notableRecords" class="block text-sm font-medium text-gray-300 mb-1">Notable Records</label>
				<textarea
					id="notableRecords"
					name="notableRecords"
					rows="3"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
				>{talent.notableRecords || ''}</textarea>
			</div>
		</div>

		<!-- Bio -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Biography</h2>
			<div>
				<label for="bio" class="block text-sm font-medium text-gray-300 mb-1">Bio</label>
				<textarea
					id="bio"
					name="bio"
					rows="6"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
				>{talent.bio || ''}</textarea>
			</div>
		</div>

		<!-- Personal Info -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Personal Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="education" class="block text-sm font-medium text-gray-300 mb-1">Education</label>
					<input
						type="text"
						id="education"
						name="education"
						value={talent.education || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="otherSports" class="block text-sm font-medium text-gray-300 mb-1">Other Sports</label>
					<input
						type="text"
						id="otherSports"
						name="otherSports"
						value={talent.otherSports || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="hobbies" class="block text-sm font-medium text-gray-300 mb-1">Hobbies</label>
					<input
						type="text"
						id="hobbies"
						name="hobbies"
						value={talent.hobbies || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="favoriteDestination" class="block text-sm font-medium text-gray-300 mb-1">Favorite Destination</label>
					<input
						type="text"
						id="favoriteDestination"
						name="favoriteDestination"
						value={talent.favoriteDestination || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
			<div class="mt-4">
				<label for="personalMotivation" class="block text-sm font-medium text-gray-300 mb-1">Personal Motivation</label>
				<textarea
					id="personalMotivation"
					name="personalMotivation"
					rows="3"
					class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
				>{talent.personalMotivation || ''}</textarea>
			</div>
		</div>

		<!-- Social Media -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Social Media & Links</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="website" class="block text-sm font-medium text-gray-300 mb-1">Website</label>
					<input
						type="url"
						id="website"
						name="website"
						value={talent.website || ''}
						placeholder="https://"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="tiktok" class="block text-sm font-medium text-gray-300 mb-1">TikTok</label>
					<input
						type="text"
						id="tiktok"
						name="tiktok"
						value={talent.tiktok || ''}
						placeholder="@username"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="twitch" class="block text-sm font-medium text-gray-300 mb-1">Twitch</label>
					<input
						type="text"
						id="twitch"
						name="twitch"
						value={talent.twitch || ''}
						placeholder="username"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
		</div>

		<!-- Travel Info -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Travel Information</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="primaryAirport" class="block text-sm font-medium text-gray-300 mb-1">Primary Airport</label>
					<input
						type="text"
						id="primaryAirport"
						name="primaryAirport"
						value={talent.primaryAirport || ''}
						placeholder="e.g., LAX"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div>
					<label for="secondaryAirport" class="block text-sm font-medium text-gray-300 mb-1">Secondary Airport</label>
					<input
						type="text"
						id="secondaryAirport"
						name="secondaryAirport"
						value={talent.secondaryAirport || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
				<div class="md:col-span-2">
					<label for="frequentFlyerNumbers" class="block text-sm font-medium text-gray-300 mb-1">Frequent Flyer Numbers</label>
					<input
						type="text"
						id="frequentFlyerNumbers"
						name="frequentFlyerNumbers"
						value={talent.frequentFlyerNumbers || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
		</div>

		<!-- Health & Fitness -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Health & Fitness</h2>
			<div class="space-y-4">
				<div>
					<label for="injuryHistory" class="block text-sm font-medium text-gray-300 mb-1">Injury History</label>
					<textarea
						id="injuryHistory"
						name="injuryHistory"
						rows="3"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>{talent.injuryHistory || ''}</textarea>
				</div>
				<div>
					<label for="fitnessRegimen" class="block text-sm font-medium text-gray-300 mb-1">Fitness Regimen</label>
					<textarea
						id="fitnessRegimen"
						name="fitnessRegimen"
						rows="3"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>{talent.fitnessRegimen || ''}</textarea>
				</div>
				<div>
					<label for="dietaryPreferences" class="block text-sm font-medium text-gray-300 mb-1">Dietary Preferences</label>
					<input
						type="text"
						id="dietaryPreferences"
						name="dietaryPreferences"
						value={talent.dietaryPreferences || ''}
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					/>
				</div>
			</div>
		</div>

		<!-- Goals -->
		<div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
			<h2 class="text-xl font-semibold text-white mb-4">Goals & Mission</h2>
			<div class="space-y-4">
				<div>
					<label for="longTermGoals" class="block text-sm font-medium text-gray-300 mb-1">Long Term Goals</label>
					<textarea
						id="longTermGoals"
						name="longTermGoals"
						rows="3"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>{talent.longTermGoals || ''}</textarea>
				</div>
				<div>
					<label for="missionStatement" class="block text-sm font-medium text-gray-300 mb-1">Mission Statement</label>
					<textarea
						id="missionStatement"
						name="missionStatement"
						rows="3"
						class="w-full rounded-md border border-gray-600 px-3 py-2 bg-gray-700 text-white"
					>{talent.missionStatement || ''}</textarea>
				</div>
			</div>
		</div>

		<!-- Submit -->
		<div class="flex justify-end gap-4">
			<Button href="/dashboard/talent/{talent.id}" variant="outline">Cancel</Button>
			<Button type="submit">Save Changes</Button>
		</div>
	</form>
</div>
