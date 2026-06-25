import { redirect, fail, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.pb.authStore.isValid) {
		// Check user role before redirecting
		const userId = locals.pb.authStore.model?.id;
		if (userId) {
			const profiles = await locals.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});
			const userProfile = profiles[0];

			// Roles with dedicated porthole — send to /portal/dashboard
			const PORTHOLE_ROLES = ['admin', 'leader', 'sales', 'pro', 'franchise_owner', 'league_owner', 'broadcaster', 'manager'];
			if (PORTHOLE_ROLES.includes(userProfile?.role)) {
				throw redirect(303, '/portal/dashboard');
			}

			if (userProfile?.role === 'vendor') {
				throw redirect(303, '/vendor/dashboard');
			}
		}
		
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (error) {
			console.error('Login error:', error);
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Check user role and redirect accordingly
		try {
			const userId = locals.pb.authStore.model?.id;

			// Get user profile to check role
			const profiles = await locals.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});
			const userProfile = profiles[0];

			if (userProfile) {
				// Vendor users get dedicated vendor portal
				if (userProfile.role === 'vendor') {
					throw redirect(303, '/vendor/dashboard');
				}

				// All other named roles go to their role porthole
				const PORTHOLE_ROLES = ['admin', 'leader', 'sales', 'pro', 'franchise_owner', 'league_owner', 'broadcaster', 'manager'];
				if (PORTHOLE_ROLES.includes(userProfile.role)) {
					throw redirect(303, '/portal/dashboard');
				}
			}
		} catch (error) {
			// Re-throw SvelteKit redirects — must not be swallowed
			if (isRedirect(error)) throw error;
			console.error('Error checking user profile:', error);
			// Continue to default dashboard if there's an error
		}

		throw redirect(303, '/dashboard');
	}
};
