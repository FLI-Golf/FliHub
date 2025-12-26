import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		const firstName = data.get('firstName') as string;
		const lastName = data.get('lastName') as string;
		const role = data.get('role') as string;

		// Validation
		if (!email || !password || !confirmPassword || !firstName || !lastName || !role) {
			return fail(400, {
				error: 'All fields are required',
				email,
				firstName,
				lastName,
				role
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				email,
				firstName,
				lastName,
				role
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				email,
				firstName,
				lastName,
				role
			});
		}

		try {
			// Create user account
			const user = await locals.pb.collection('users').create({
				email,
				password,
				passwordConfirm: password,
				emailVisibility: true
			});

			// Create user profile
			await locals.pb.collection('user_profiles').create({
				userId: user.id,
				role,
				firstName,
				lastName,
				isActive: true
			});

			// Auto-login after registration
			await locals.pb.collection('users').authWithPassword(email, password);

			throw redirect(303, '/dashboard');
		} catch (error: any) {
			console.error('Registration error:', error);
			
			// Handle specific PocketBase errors
			if (error.data?.data) {
				const errors = error.data.data;
				if (errors.email) {
					return fail(400, {
						error: 'Email already exists',
						email,
						firstName,
						lastName,
						role
					});
				}
			}

			return fail(400, {
				error: 'Registration failed. Please try again.',
				email,
				firstName,
				lastName,
				role
			});
		}
	}
} satisfies Actions;
