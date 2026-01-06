import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		
		// Validate required fields
		if (!data.email || !data.password) {
			return json(
				{ message: 'Email and password are required' },
				{ status: 400 }
			);
		}

		if (data.password.length < 8) {
			return json(
				{ message: 'Password must be at least 8 characters' },
				{ status: 400 }
			);
		}

		// Create user account
		const user = await locals.pb.collection('users').create({
			email: data.email,
			password: data.password,
			passwordConfirm: data.passwordConfirm || data.password,
			emailVisibility: true
		});

		return json({ id: user.id, email: user.email });
	} catch (error: any) {
		console.error('Error creating user:', error);
		
		// Handle specific errors
		if (error.data?.data?.email) {
			return json(
				{ message: 'Email already exists' },
				{ status: 400 }
			);
		}
		
		return json(
			{ message: error.message || 'Failed to create user account' },
			{ status: 400 }
		);
	}
};
