import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

function escapeFilterValue(value: string): string {
	return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent(); // ensure layout auth ran
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { profile: null, roleExtra: {}, proTalent: null, proTalentMeta: { linked: false, matchedByEmail: false } };

	const profile = await ctx.pb.collection('user_profiles')
		.getFirstListItem(`userId = "${ctx.userId}"`, {
			expand: 'departmentId,vendorId,talentReference,broadcasterReference',
		})
		.catch(() => null);

	// Role-specific relational labels
	const roleExtra: Record<string, string | null> = {};

	if (profile?.expand?.departmentId) {
		roleExtra.departmentName = profile.expand.departmentId.name ?? null;
	}
	if (profile?.expand?.vendorId) {
		roleExtra.vendorName = (profile.expand.vendorId as any).name ?? null;
	}

	let proTalent: any = null;
	let matchedByEmail = false;

	if (ctx.role === 'pro' && profile) {
		const linkedTalentId = profile.talentReference || profile.expand?.talentReference?.id || null;

		if (linkedTalentId) {
			proTalent = await ctx.pb.collection('talent').getOne(linkedTalentId).catch(() => null);
		}

		// Fallback: try matching by email for pre-seeded pros not yet linked.
		if (!proTalent && profile.email) {
			const emailFilter = escapeFilterValue(String(profile.email));
			proTalent = await ctx.pb.collection('talent')
				.getFirstListItem(`email = "${emailFilter}"`)
				.catch(() => null);
			matchedByEmail = !!proTalent;
		}
	}

	return {
		profile,
		roleExtra,
		proTalent,
		proTalentMeta: {
			linked: !!(profile?.talentReference || profile?.expand?.talentReference?.id),
			matchedByEmail,
		},
	};
};

export const actions: Actions = {
	update: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		if (!ctx?.userId) return fail(401, { error: 'Unauthorized' });

		const form = await request.formData();

		const profile = await ctx.pb.collection('user_profiles')
			.getFirstListItem(`userId = "${ctx.userId}"`)
			.catch(() => null);

		if (!profile) return fail(404, { error: 'Profile not found' });

		const patch: Record<string, unknown> = {};
		let talentUpdated = false;

		const str = (key: string) => {
			const v = form.get(key);
			return v !== null ? String(v).trim() : undefined;
		};

		// Common fields
		const firstName = str('firstName');
		const lastName  = str('lastName');
		const phone     = str('phone');
		const bio       = str('bio');
		const organization = str('organization');

		if (firstName !== undefined) patch.firstName    = firstName;
		if (lastName  !== undefined) patch.lastName     = lastName;
		if (phone     !== undefined) patch.phone        = phone;
		if (bio       !== undefined) patch.bio          = bio;
		if (organization !== undefined) patch.organization = organization;

		// Role-specific writable fields
		const role = ctx.role;
		if (role === 'broadcaster') {
			const ref = str('broadcasterReference');
			if (ref !== undefined) patch.broadcasterReference = ref || null;
		}
		if (role === 'pro') {
			const ref = str('talentReference');
			if (ref !== undefined) patch.talentReference = ref || null;
		}

		if (role === 'pro') {
			const linkedTalentId = str('talentId') || String(profile.talentReference || '');
			const talentPatch: Record<string, unknown> = {};

			const talentTextFields = [
				'name',
				'nickname',
				'country',
				'residence',
				'height',
				'weight',
				'sponsoredBy',
				'primarySponsor',
				'favoriteDisc',
				'signatureMove',
				'careerHighlights',
				'notableRecords',
				'education',
				'otherSports',
				'hobbies',
				'favoriteDestination',
				'personalMotivation',
				'website',
				'tiktok',
				'twitch',
				'primaryAirport',
				'secondaryAirport',
				'frequentFlyerNumbers',
				'injuryHistory',
				'fitnessRegimen',
				'dietaryPreferences',
				'longTermGoals',
				'missionStatement',
				'managerName',
				'managerEmail',
				'bio',
			];

			for (const key of talentTextFields) {
				const value = str(key);
				if (value !== undefined) talentPatch[key] = value;
			}

			const worldRanking = str('worldRanking');
			if (worldRanking !== undefined) talentPatch.worldRanking = worldRanking ? Number(worldRanking) : null;

			const yearTurnedPro = str('yearTurnedPro');
			if (yearTurnedPro !== undefined) talentPatch.yearTurnedPro = yearTurnedPro ? Number(yearTurnedPro) : null;

			const managerCutPercentage = str('managerCutPercentage');
			if (managerCutPercentage !== undefined) talentPatch.managerCutPercentage = managerCutPercentage ? Number(managerCutPercentage) : 0;

			const dateOfBirth = str('dateOfBirth');
			if (dateOfBirth !== undefined) talentPatch.dateOfBirth = dateOfBirth || null;

			const status = str('talentStatus');
			if (status !== undefined) talentPatch.status = status || 'active';

			if (linkedTalentId && Object.keys(talentPatch).length > 0) {
				try {
					await ctx.pb.collection('talent').update(linkedTalentId, talentPatch);
					talentUpdated = true;
					if (!profile.talentReference) {
						patch.talentReference = linkedTalentId;
					}
				} catch (err: any) {
					return fail(500, { error: err?.message ?? 'Failed to update pro profile data' });
				}
			}
		}

		if (Object.keys(patch).length === 0 && !talentUpdated) {
			return fail(400, { error: 'Nothing to update' });
		}

		try {
			if (Object.keys(patch).length > 0) {
				await ctx.pb.collection('user_profiles').update(profile.id, patch);
			}
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Save failed' });
		}
	},
};
