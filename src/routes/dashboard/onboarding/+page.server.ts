import { redirect, fail } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';

const ONBOARDING_ROLES = ['pro', 'manager', 'broadcaster'];

export const load: PageServerLoad = async ({ locals, url }) => {
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
	try {
		const sigs = await ctx.pb.collection('document_signatures').getFullList({
			filter: `userId = "${ctx.userId}"`
		});
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

	return {
		profile: ctx.profile,
		role: ctx.role,
		userId: ctx.userId,
		onboardingStatus,
		signatures,
		playerProfile
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
			const documentsInitialed =
				signedTypes.has('player_information_packet') &&
				signedTypes.has('player_opportunity_packet') &&
				signedTypes.has('integrity_substance_policy') &&
				signedTypes.has('legal_documents');

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
