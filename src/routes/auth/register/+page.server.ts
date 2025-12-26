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

		// Validation
		if (!email || !password || !confirmPassword || !firstName || !lastName) {
			return fail(400, {
				error: 'All fields are required',
				email,
				firstName,
				lastName
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				email,
				firstName,
				lastName
			});
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				email,
				firstName,
				lastName
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

			// Create user profile with default role 'leader'
			await locals.pb.collection('user_profiles').create({
				userId: user.id,
				role: 'leader',
				firstName,
				lastName,
				email,
				status: 'active'
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
						lastName
					});
				}
			}

			return fail(400, {
				error: 'Registration failed. Please try again.',
				email,
				firstName,
				lastName
			});
		}
	}
} satisfies Actions;
