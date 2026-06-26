import { redirect, fail } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';

const ONBOARDING_ROLES = ['pro', 'manager', 'broadcaster'];

function escapeFilterValue(value: string): string {
	return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

type ProfileTarget = {
	targetUserId: string | null;
	selectedProId: string | null;
	representedPros: Array<{ id: string; label: string }>;
	canEdit: boolean;
};

async function writePlayerProfileSubmitAudit(ctx: RequestContext, target: ProfileTarget): Promise<void> {
	if (!target.targetUserId) return;

	try {
		await ctx.pb.collection('player_profile_audit_log').create({
			action: 'submit',
			actorUserId: ctx.userId,
			targetUserId: target.targetUserId,
			proId: target.selectedProId,
			performedAt: new Date().toISOString(),
			notes: ctx.role === 'manager'
				? 'Player profile submitted by manager on behalf of represented pro.'
				: 'Player profile submitted by account owner.'
		});
	} catch {
		// Audit logging must never block profile submission.
	}
}

async function resolveProfileTarget(ctx: RequestContext, proIdParam: string | null): Promise<ProfileTarget> {
	if (ctx.role !== 'manager') {
		return {
			targetUserId: ctx.userId,
			selectedProId: null,
			representedPros: [],
			canEdit: true,
		};
	}

	const managerProfile = await ctx.pb.collection('user_profiles')
		.getFirstListItem(`userId = "${escapeFilterValue(ctx.userId)}"`, { fields: 'id' })
		.catch(() => null);

	if (!managerProfile?.id) {
		return {
			targetUserId: null,
			selectedProId: null,
			representedPros: [],
			canEdit: false,
		};
	}

	const accessRecords = await ctx.pb.collection('pro_access').getFullList({
		filter: `userProfile = "${escapeFilterValue(managerProfile.id)}" && accessType = "manager" && isActive = true`,
		expand: 'pro',
		fields: 'id,pro,expand.pro.id,expand.pro.name,expand.pro.email',
	}).catch(() => []);

	const representedPros = (accessRecords as any[]).map((record: any) => {
		const pro = record.expand?.pro;
		const label = String(pro?.name || pro?.email || record.pro || 'Unnamed Pro');
		return { id: String(record.pro), label };
	});

	if (representedPros.length === 0) {
		return {
			targetUserId: null,
			selectedProId: null,
			representedPros: [],
			canEdit: false,
		};
	}

	const allowedIds = new Set(representedPros.map((pro) => pro.id));
	const selectedProId = proIdParam && allowedIds.has(proIdParam) ? proIdParam : representedPros[0].id;

	const targetProfile = await ctx.pb.collection('user_profiles')
		.getFirstListItem(`talentReference = "${escapeFilterValue(selectedProId)}"`, { fields: 'id,userId' })
		.catch(() => null);

	return {
		targetUserId: String(targetProfile?.userId || ''),
		selectedProId,
		representedPros,
		canEdit: !!targetProfile?.userId,
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	if (!ONBOARDING_ROLES.includes(ctx.role)) {
		throw redirect(303, '/portal');
	}

	const target = await resolveProfileTarget(ctx, url.searchParams.get('pro'));

	let playerProfile = null;
	try {
		if (target.targetUserId) {
			const records = await ctx.pb.collection('player_profiles').getFullList({
				filter: `userId = "${escapeFilterValue(target.targetUserId)}"`
			});
			playerProfile = records[0] ?? null;
		}
	} catch { /* collection may not exist yet */ }

	return {
		profile: ctx.profile,
		role: ctx.role,
		userId: ctx.userId,
		playerProfile,
		targetUserId: target.targetUserId,
		selectedProId: target.selectedProId,
		representedPros: target.representedPros,
		canEdit: target.canEdit,
	};
};

export const actions: Actions = {
	saveDraft: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		return await upsertProfile(ctx, data, 'draft', url.searchParams.get('pro'));
	},

	submit: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		const target = await resolveProfileTarget(ctx, url.searchParams.get('pro'));
		const result = await upsertProfile(ctx, data, 'submitted', url.searchParams.get('pro'));
		if (result && 'error' in result) return result;

		await writePlayerProfileSubmitAudit(ctx, target);

		// Mark profile completed in onboarding status
		try {
			const existing = await ctx.pb.collection('onboarding_status').getFullList({
				filter: `userId = "${escapeFilterValue(target.targetUserId || ctx.userId)}"`
			});
			const payload = { profileCompleted: true, completedAt: new Date().toISOString() };
			if (existing.length > 0) {
				await ctx.pb.collection('onboarding_status').update(existing[0].id, payload);
			} else {
				await ctx.pb.collection('onboarding_status').create({
					userId: target.targetUserId || ctx.userId,
					welcomeSeen: true,
					documentsInitialed: false,
					contractSigned: false,
					...payload
				});
			}
		} catch { /* non-blocking */ }

		throw redirect(303, '/portal/profile');
	}
};

async function upsertProfile(ctx: RequestContext, data: FormData, status: 'draft' | 'submitted', proIdParam: string | null) {
	const target = await resolveProfileTarget(ctx, proIdParam);
	if (!target.canEdit || !target.targetUserId) {
		return fail(403, { error: 'You can only manage profiles for represented pros.' });
	}

	let existing: any[] = [];
	try {
		existing = await ctx.pb.collection('player_profiles').getFullList({
			filter: `userId = "${escapeFilterValue(target.targetUserId)}"`
		});
	} catch (err: any) {
		console.error('Player profile lookup error:', err);
		const message = err?.message ?? 'Player profile collection unavailable';
		return fail(err?.status ?? 500, { error: message });
	}
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
	const optionalText = (key: string) => {
		const value = text(key).trim();
		return value === '' ? null : value;
	};
	const num = (key: string) => {
		if (!data.has(key)) return current?.[key] ?? null;
		const raw = String(data.get(key) ?? '').trim();
		if (raw === '') return null;
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	};

	const payload = {
		userId: target.targetUserId,
		// Personal
		fullName: optionalText('fullName'),
		dateOfBirth: optionalText('dateOfBirth'),
		nationality: optionalText('nationality'),
		countryOfResidence: optionalText('countryOfResidence'),
		primaryLanguages: optionalText('primaryLanguages'),
		phone: optionalText('phone'),
		email: optionalText('email'),
		mailingAddress: optionalText('mailingAddress'),
		emergencyContactName: optionalText('emergencyContactName'),
		emergencyContactRelationship: optionalText('emergencyContactRelationship'),
		emergencyContactPhone: optionalText('emergencyContactPhone'),
		emergencyContactEmail: optionalText('emergencyContactEmail'),
		// Competitive
		worldRanking: num('worldRanking'),
		yearsCompeting: num('yearsCompeting'),
		majorTournamentWins: optionalText('majorTournamentWins'),
		notableAchievements: optionalText('notableAchievements'),
		otherLeagues: optionalText('otherLeagues'),
		playingStyle: optionalText('playingStyle'),
		strongestSkills: optionalText('strongestSkills'),
		knownInjuries: optionalText('knownInjuries'),
		// Branding
		broadcastNickname: optionalText('broadcastNickname'),
		instagram: optionalText('instagram'),
		twitter: optionalText('twitter'),
		youtube: optionalText('youtube'),
		otherSocialMedia: optionalText('otherSocialMedia'),
		personalWebsite: optionalText('personalWebsite'),
		mediaFeatures: optionalText('mediaFeatures'),
		comfortableWithInterviews: bool('comfortableWithInterviews'),
		openToBehindScenes: bool('openToBehindScenes'),
		// Sponsorship
		currentSponsorships: optionalText('currentSponsorships'),
		openToNewSponsors: bool('openToNewSponsors'),
		wantsLeagueSponsorHelp: bool('wantsLeagueSponsorHelp'),
		personalBrandingGoals: optionalText('personalBrandingGoals'),
		// Management
		hasAgent: bool('hasAgent'),
		repName: optionalText('repName'),
		repAgency: optionalText('repAgency'),
		repPosition: optionalText('repPosition'),
		repPhone: optionalText('repPhone'),
		repEmail: optionalText('repEmail'),
		// Integrity
		participatedInBetting: bool('participatedInBetting'),
		understandsIntegrityPolicy: bool('understandsIntegrityPolicy'),
		priorIntegrityViolations: bool('priorIntegrityViolations'),
		integrityViolationDetails: optionalText('integrityViolationDetails'),
		// Additional
		excitementAboutLeague: optionalText('excitementAboutLeague'),
		careerGoals: optionalText('careerGoals'),
		additionalInfo: optionalText('additionalInfo'),
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
		const message = err?.response?.message ?? err?.message ?? 'Failed to save player profile';
		return fail(err?.status ?? 500, { error: message });
	}
}
