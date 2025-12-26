import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.pb.authStore.isValid) {
		throw redirect(303, '/auth/login');
	}

	// Fetch user profile to get role and other details
	let userProfile = null;
	try {
		const profiles = await locals.pb.collection('user_profiles').getFullList({
			filter: `userId = "${locals.pb.authStore.model?.id}"`
		});
		userProfile = profiles[0] || null;
	} catch (error) {
		console.error('Failed to fetch user profile:', error);
	}

	return {
		user: locals.pb.authStore.model,
		userProfile
	};
};
