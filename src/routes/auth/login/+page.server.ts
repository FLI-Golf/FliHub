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

			// Redirect based on role
			if (userProfile?.role === 'sales') {
				throw redirect(303, '/dashboard/sales');
			}

			if (userProfile?.role === 'vendor') {
				throw redirect(303, '/vendor/dashboard');
			}

			if (userProfile?.role === 'leader') {
				throw redirect(303, '/dashboard');
			}

			if (['manager', 'pro', 'broadcaster'].includes(userProfile?.role)) {
				throw redirect(303, '/dashboard');
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
				// Sales users - redirect to franchise sales dashboard
				if (userProfile.role === 'sales') {
					throw redirect(303, '/dashboard/sales');
				}

				// Vendor users - redirect to vendor portal
				if (userProfile.role === 'vendor') {
					throw redirect(303, '/vendor/dashboard');
				}

				// Leader users - redirect to their department
				if (userProfile.role === 'leader') {
					throw redirect(303, '/dashboard');
				}

				// Manager, pro, broadcaster — send to dashboard
				if (['manager', 'pro', 'broadcaster'].includes(userProfile.role)) {
					throw redirect(303, '/dashboard');
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
