import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		
		// Create user profile
		const profile = await locals.pb.collection('user_profiles').create({
			userId: data.userId,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone || '',
			organization: data.organization || '',
			role: data.role,
			status: data.status
		});

		return json(profile);
	} catch (error: any) {
		console.error('Error creating user profile:', error);
		return json(
			{ message: error.message || 'Failed to create user profile' },
			{ status: 400 }
		);
	}
};
