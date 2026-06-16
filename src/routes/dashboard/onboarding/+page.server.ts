import { redirect, fail } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';

const ONBOARDING_ROLES = ['pro', 'manager', 'broadcaster'];

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	const debugOnboarding = url.searchParams.get('debugOnboarding') === '1';

	setHeaders({
		'cache-control': 'no-store, max-age=0'
	});

	const ctx = await RequestContext.from(locals, url);

	if (!ONBOARDING_ROLES.includes(ctx.role) && ctx.role !== 'admin') {
		throw redirect(303, '/dashboard');
	}

	// Load onboarding status
	let onboardingStatus = null;
	try {
		const records = await ctx.pb.collection('onboarding_status').getFullList({
			filter: `userId = "${ctx.userId}"`
		});
		onboardingStatus = records[0] ?? null;
	} catch { /* collection may not exist yet */ }

	// Load existing signatures
	let signatures: Record<string, any> = {};
	let signatureList: any[] = [];
	try {
		const sigs = await ctx.pb.collection('document_signatures').getFullList({
			filter: `userId = "${ctx.userId}"`
		});
		signatureList = sigs;
		for (const sig of sigs) {
			signatures[sig.documentType] = sig;
		}
	} catch { /* collection may not exist yet */ }

	// Load player profile if exists
	let playerProfile = null;
	try {
		const profiles = await ctx.pb.collection('player_profiles').getFullList({
			filter: `userId = "${ctx.userId}"`
		});
		playerProfile = profiles[0] ?? null;
	} catch { /* collection may not exist yet */ }

	const documentsInitialedByType =
		!!signatures['player_information_packet'] &&
		!!signatures['player_opportunity_packet'] &&
		!!signatures['integrity_substance_policy'] &&
		!!signatures['legal_documents'];

	// Fallback for legacy/malformed records where documentType may be blank.
	const nonContractSignatureCount = signatureList.filter((sig) => sig.documentType !== 'player_contract').length;
	const documentsInitialed = documentsInitialedByType || nonContractSignatureCount >= 4;

	const contractSigned = !!signatures['player_contract'];
	const profileCompleted =
		playerProfile?.status === 'submitted' || playerProfile?.status === 'approved';

	// Keep onboarding_status aligned with the true completion state so users don't get stuck.
	try {
		if (onboardingStatus) {
			const needsUpdate =
				(onboardingStatus.documentsInitialed ?? false) !== documentsInitialed ||
				(onboardingStatus.contractSigned ?? false) !== contractSigned ||
				(onboardingStatus.profileCompleted ?? false) !== profileCompleted;

			if (needsUpdate) {
				await ctx.pb.collection('onboarding_status').update(onboardingStatus.id, {
					documentsInitialed,
					contractSigned,
					profileCompleted
				});
				onboardingStatus = {
					...onboardingStatus,
					documentsInitialed,
					contractSigned,
					profileCompleted
				};
			}
		} else if (documentsInitialed || contractSigned || profileCompleted) {
			const created = await ctx.pb.collection('onboarding_status').create({
				userId: ctx.userId,
				welcomeSeen: true,
				documentsInitialed,
				contractSigned,
				profileCompleted
			});
			onboardingStatus = created;
		}
	} catch {
		// Non-blocking. UI still uses computed progress below.
	}

	return {
		profile: ctx.profile,
		role: ctx.role,
		userId: ctx.userId,
		onboardingStatus,
		signatures,
		playerProfile,
		progress: {
			documentsInitialed,
			contractSigned,
			profileCompleted
		},
		debugOnboarding,
		debugData: debugOnboarding
			? {
				userId: ctx.userId,
				signatureCount: signatureList.length,
				signatureTypes: signatureList.map((sig) => sig.documentType || '(blank)'),
				documentsInitialedByType,
				nonContractSignatureCount,
				documentsInitialed,
				contractSigned,
				profileStatus: playerProfile?.status ?? null,
				profileCompleted,
				onboardingStatus: onboardingStatus
			}
			: null
	};
};

export const actions: Actions = {
	signDocument: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();

		const documentType = data.get('documentType') as string;
		const initials = data.get('initials') as string;
		const signatureDataUrl = data.get('signatureDataUrl') as string;
		const agreed = data.get('agreed') === 'true';

		if (!documentType || !initials || !agreed) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			// Provision collections if needed
			await ctx.pb.collection('document_signatures').create({
				userId: ctx.userId,
				documentType,
				initials: initials.toUpperCase(),
				signatureDataUrl: signatureDataUrl || '',
				agreed,
				signedAt: new Date().toISOString()
			});

			// Update onboarding status
			const DOC_TYPES = [
				'player_information_packet',
				'player_opportunity_packet',
				'integrity_substance_policy',
				'player_contract',
				'legal_documents'
			];

			// Check how many docs are now signed
			const allSigs = await ctx.pb.collection('document_signatures').getFullList({
				filter: `userId = "${ctx.userId}"`
			});
			const signedTypes = new Set(allSigs.map((s: any) => s.documentType));
			const contractSigned = signedTypes.has('player_contract');
			const documentsInitialedByType =
				signedTypes.has('player_information_packet') &&
				signedTypes.has('player_opportunity_packet') &&
				signedTypes.has('integrity_substance_policy') &&
				signedTypes.has('legal_documents');
			const nonContractSignatureCount = allSigs.filter((s: any) => s.documentType !== 'player_contract').length;
			const documentsInitialed = documentsInitialedByType || nonContractSignatureCount >= 4;

			const existing = await ctx.pb.collection('onboarding_status').getFullList({
				filter: `userId = "${ctx.userId}"`
			});

			if (existing.length > 0) {
				await ctx.pb.collection('onboarding_status').update(existing[0].id, {
					documentsInitialed,
					contractSigned
				});
			} else {
				await ctx.pb.collection('onboarding_status').create({
					userId: ctx.userId,
					welcomeSeen: true,
					documentsInitialed,
					contractSigned,
					profileCompleted: false
				});
			}

			return { success: true, documentType };
		} catch (err: any) {
			console.error('Sign document error:', err);
			return fail(500, { error: err.message });
		}
	}
};
