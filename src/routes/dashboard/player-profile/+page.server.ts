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
	const existing = await ctx.pb.collection('player_profiles').getFullList({
		filter: `userId = "${ctx.userId}"`
	});
	const current = existing[0] ?? null;

	const currentStep = String(data.get('currentStep') ?? '');
	const STEP_BOOLEAN_FIELDS: Record<string, string[]> = {
		branding: ['comfortableWithInterviews', 'openToBehindScenes'],
		sponsorship: ['openToNewSponsors', 'wantsLeagueSponsorHelp'],
		management: ['hasAgent'],
		integrity: ['participatedInBetting', 'understandsIntegrityPolicy', 'priorIntegrityViolations']
	};

	const bool = (key: string) => {
		const values = data.getAll(key).map((v) => String(v).toLowerCase());
		if (values.length > 0) {
			return values.some((v) => v === 'true' || v === 'on' || v === '1');
		}

		if ((STEP_BOOLEAN_FIELDS[currentStep] ?? []).includes(key)) {
			return false;
		}

		return current?.[key] ?? false;
	};

	const text = (key: string) => (data.has(key) ? String(data.get(key) ?? '') : (current?.[key] ?? ''));
	const num = (key: string) => {
		if (!data.has(key)) return current?.[key] ?? null;
		const raw = String(data.get(key) ?? '').trim();
		if (raw === '') return null;
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	};

	const payload = {
		userId: ctx.userId,
		// Personal
		fullName: text('fullName'),
		dateOfBirth: text('dateOfBirth'),
		nationality: text('nationality'),
		countryOfResidence: text('countryOfResidence'),
		primaryLanguages: text('primaryLanguages'),
		phone: text('phone'),
		email: text('email'),
		mailingAddress: text('mailingAddress'),
		emergencyContactName: text('emergencyContactName'),
		emergencyContactRelationship: text('emergencyContactRelationship'),
		emergencyContactPhone: text('emergencyContactPhone'),
		emergencyContactEmail: text('emergencyContactEmail'),
		// Competitive
		worldRanking: num('worldRanking'),
		yearsCompeting: num('yearsCompeting'),
		majorTournamentWins: text('majorTournamentWins'),
		notableAchievements: text('notableAchievements'),
		otherLeagues: text('otherLeagues'),
		playingStyle: text('playingStyle'),
		strongestSkills: text('strongestSkills'),
		knownInjuries: text('knownInjuries'),
		// Branding
		broadcastNickname: text('broadcastNickname'),
		instagram: text('instagram'),
		twitter: text('twitter'),
		youtube: text('youtube'),
		otherSocialMedia: text('otherSocialMedia'),
		personalWebsite: text('personalWebsite'),
		mediaFeatures: text('mediaFeatures'),
		comfortableWithInterviews: bool('comfortableWithInterviews'),
		openToBehindScenes: bool('openToBehindScenes'),
		// Sponsorship
		currentSponsorships: text('currentSponsorships'),
		openToNewSponsors: bool('openToNewSponsors'),
		wantsLeagueSponsorHelp: bool('wantsLeagueSponsorHelp'),
		personalBrandingGoals: text('personalBrandingGoals'),
		// Management
		hasAgent: bool('hasAgent'),
		repName: text('repName'),
		repAgency: text('repAgency'),
		repPosition: text('repPosition'),
		repPhone: text('repPhone'),
		repEmail: text('repEmail'),
		// Integrity
		participatedInBetting: bool('participatedInBetting'),
		understandsIntegrityPolicy: bool('understandsIntegrityPolicy'),
		priorIntegrityViolations: bool('priorIntegrityViolations'),
		integrityViolationDetails: text('integrityViolationDetails'),
		// Additional
		excitementAboutLeague: text('excitementAboutLeague'),
		careerGoals: text('careerGoals'),
		additionalInfo: text('additionalInfo'),
		status,
		submittedAt:
			status === 'submitted'
				? new Date().toISOString()
				: (current?.submittedAt ?? null)
	};

	try {
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
