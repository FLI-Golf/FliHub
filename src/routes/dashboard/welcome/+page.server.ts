import { isRedirect, redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';

const ONBOARDING_ROLES = ['pro', 'manager', 'broadcaster'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	try {
		const ctx = await RequestContext.from(locals, url);

		// Only pro, manager, broadcaster (and admin previewing) see this page
		if (!ONBOARDING_ROLES.includes(ctx.role as any) && ctx.role !== 'admin') {
			throw redirect(303, '/dashboard');
		}

		// Check if user has already completed onboarding
		let onboardingStatus = null;
		try {
			const records = await ctx.pb.collection('onboarding_status').getFullList({
				filter: `userId = "${ctx.userId}"`
			});
			onboardingStatus = records[0] ?? null;
		} catch {
			// Collection may not exist yet — treat as not completed
		}

		return {
			profile: ctx.profile,
			role: ctx.role,
			onboardingStatus
		};
	} catch (err: any) {
		if (isRedirect(err)) throw err;
		console.error('[welcome] load failed:', err?.message ?? err);
		return {
			profile: null,
			role: 'admin',
			onboardingStatus: null
		};
	}
};

export const actions: Actions = {
	markComplete: async ({ locals, url }) => {
		const ctx = await RequestContext.from(locals, url);

		try {
			const existing = await ctx.pb.collection('onboarding_status').getFullList({
				filter: `userId = "${ctx.userId}"`
			});

			if (existing.length > 0) {
				await ctx.pb.collection('onboarding_status').update(existing[0].id, {
					welcomeSeen: true,
					updatedAt: new Date().toISOString()
				});
			} else {
				await ctx.pb.collection('onboarding_status').create({
					userId: ctx.userId,
					welcomeSeen: true,
					documentsInitialed: false,
					contractSigned: false,
					profileCompleted: false
				});
			}
		} catch {
			// Silently continue — non-blocking
		}

		throw redirect(303, '/dashboard/onboarding');
	}
};
