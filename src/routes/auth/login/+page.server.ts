import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.pb.authStore.isValid) {
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

		// Check if user is a leader and has a department
		try {
			const userId = locals.pb.authStore.model?.id;

			// Get user profile to check role
			const profiles = await locals.pb.collection('user_profiles').getFullList({
				filter: `userId = "${userId}"`
			});
			const userProfile = profiles[0];

			// If user is a leader, check for their department
			if (userProfile?.role === 'leader' && userProfile?.id) {
				const departments = await locals.pb.collection('departments_collection').getFullList({
					filter: `headOfDepartment = "${userProfile.id}"`
				});

				if (departments.length > 0) {
					const department = departments[0];
					// Redirect to department-specific dashboard
					throw redirect(303, `/dashboard/department/${department.id}`);
				}
			}
		} catch (error) {
			console.error('Error checking department:', error);
			// Continue to default dashboard if there's an error
		}

		throw redirect(303, '/dashboard');
	}
};
