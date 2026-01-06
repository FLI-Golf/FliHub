import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.pb.authStore.isValid) {
		throw redirect(303, '/auth/login');
	}

	// Fetch user profile to get role and other details
	let userProfile = null;
	let userDepartment = null;
	try {
		const profiles = await locals.pb.collection('user_profiles').getFullList({
			filter: `userId = "${locals.pb.authStore.model?.id}"`
		});
		userProfile = profiles[0] || null;

		// If user is a leader, check for their department
		if (userProfile?.role === 'leader' && userProfile?.id) {
			const departments = await locals.pb.collection('departments_collection').getFullList({
				filter: `headOfDepartment = "${userProfile.id}"`
			});
			userDepartment = departments[0] || null;
		}
	} catch (error) {
		console.error('Failed to fetch user profile:', error);
	}

	return {
		user: locals.pb.authStore.model,
		userProfile,
		userDepartment
	};
};
