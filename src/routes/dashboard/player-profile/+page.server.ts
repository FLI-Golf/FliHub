import { redirect, fail } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';

const ONBOARDING_ROLES = ['pro', 'manager', 'broadcaster'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	if (!ONBOARDING_ROLES.includes(ctx.role) && ctx.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	let playerProfile = null;
	try {
		const records = await ctx.pb.collection('player_profiles').getFullList({
			filter: `userId = "${ctx.userId}"`
		});
		playerProfile = records[0] ?? null;
	} catch { /* collection may not exist yet */ }

	return {
		profile: ctx.profile,
		role: ctx.role,
		userId: ctx.userId,
		playerProfile
	};
};

export const actions: Actions = {
	saveDraft: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		return await upsertProfile(ctx, data, 'draft');
	},

	submit: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		const result = await upsertProfile(ctx, data, 'submitted');
		if (result && 'error' in result) return result;

		// Mark profile completed in onboarding status
		try {
			const existing = await ctx.pb.collection('onboarding_status').getFullList({
				filter: `userId = "${ctx.userId}"`
			});
			const payload = { profileCompleted: true, completedAt: new Date().toISOString() };
			if (existing.length > 0) {
				await ctx.pb.collection('onboarding_status').update(existing[0].id, payload);
			} else {
				await ctx.pb.collection('onboarding_status').create({
					userId: ctx.userId,
					welcomeSeen: true,
					documentsInitialed: false,
					contractSigned: false,
					...payload
				});
			}
		} catch { /* non-blocking */ }

		throw redirect(303, '/dashboard/onboarding');
	}
};

async function upsertProfile(ctx: any, data: FormData, status: 'draft' | 'submitted') {
	const bool = (key: string) => data.get(key) === 'true' || data.get(key) === 'on';

	const payload = {
		userId: ctx.userId,
		// Personal
		fullName: data.get('fullName') ?? '',
		dateOfBirth: data.get('dateOfBirth') ?? '',
		nationality: data.get('nationality') ?? '',
		countryOfResidence: data.get('countryOfResidence') ?? '',
		primaryLanguages: data.get('primaryLanguages') ?? '',
		phone: data.get('phone') ?? '',
		email: data.get('email') ?? '',
		mailingAddress: data.get('mailingAddress') ?? '',
		emergencyContactName: data.get('emergencyContactName') ?? '',
		emergencyContactRelationship: data.get('emergencyContactRelationship') ?? '',
		emergencyContactPhone: data.get('emergencyContactPhone') ?? '',
		emergencyContactEmail: data.get('emergencyContactEmail') ?? '',
		// Competitive
		worldRanking: Number(data.get('worldRanking')) || null,
		yearsCompeting: Number(data.get('yearsCompeting')) || null,
		majorTournamentWins: data.get('majorTournamentWins') ?? '',
		notableAchievements: data.get('notableAchievements') ?? '',
		otherLeagues: data.get('otherLeagues') ?? '',
		playingStyle: data.get('playingStyle') ?? '',
		strongestSkills: data.get('strongestSkills') ?? '',
		knownInjuries: data.get('knownInjuries') ?? '',
		// Branding
		broadcastNickname: data.get('broadcastNickname') ?? '',
		instagram: data.get('instagram') ?? '',
		twitter: data.get('twitter') ?? '',
		youtube: data.get('youtube') ?? '',
		otherSocialMedia: data.get('otherSocialMedia') ?? '',
		personalWebsite: data.get('personalWebsite') ?? '',
		mediaFeatures: data.get('mediaFeatures') ?? '',
		comfortableWithInterviews: bool('comfortableWithInterviews'),
		openToBehindScenes: bool('openToBehindScenes'),
		// Sponsorship
		currentSponsorships: data.get('currentSponsorships') ?? '',
		openToNewSponsors: bool('openToNewSponsors'),
		wantsLeagueSponsorHelp: bool('wantsLeagueSponsorHelp'),
		personalBrandingGoals: data.get('personalBrandingGoals') ?? '',
		// Management
		hasAgent: bool('hasAgent'),
		repName: data.get('repName') ?? '',
		repAgency: data.get('repAgency') ?? '',
		repPosition: data.get('repPosition') ?? '',
		repPhone: data.get('repPhone') ?? '',
		repEmail: data.get('repEmail') ?? '',
		// Integrity
		participatedInBetting: bool('participatedInBetting'),
		understandsIntegrityPolicy: bool('understandsIntegrityPolicy'),
		priorIntegrityViolations: bool('priorIntegrityViolations'),
		integrityViolationDetails: data.get('integrityViolationDetails') ?? '',
		// Additional
		excitementAboutLeague: data.get('excitementAboutLeague') ?? '',
		careerGoals: data.get('careerGoals') ?? '',
		additionalInfo: data.get('additionalInfo') ?? '',
		status,
		submittedAt: status === 'submitted' ? new Date().toISOString() : null
	};

	try {
		const existing = await ctx.pb.collection('player_profiles').getFullList({
			filter: `userId = "${ctx.userId}"`
		});

		if (existing.length > 0) {
			await ctx.pb.collection('player_profiles').update(existing[0].id, payload);
		} else {
			await ctx.pb.collection('player_profiles').create(payload);
		}

		return { success: true, status };
	} catch (err: any) {
		console.error('Player profile save error:', err);
		return fail(500, { error: err.message });
	}
}
