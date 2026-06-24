import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const VALID_ROLES = [
	'leader',
	'admin',
	'sales',
	'vendor',
	'pro',
	'franchise_owner',
	'league_owner',
	'broadcaster',
	'manager'
];

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();

		if (!VALID_ROLES.includes(String(data.role))) {
			return json({ message: 'Invalid role' }, { status: 400 });
		}
		
		// Create user profile
		const profile = await locals.pb.collection('user_profiles').create({
			userId: data.userId,
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			phone: data.phone || '',
			organization: data.organization || '',
			role: data.role,
			availableRoles: Array.isArray(data.availableRoles) && data.availableRoles.length > 0
				? data.availableRoles
				: [data.role],
			status: data.status,
			vendorId: data.vendorId || null,
			departmentId: data.departmentId || null,
			talentReference: data.talentReference || null,
			broadcasterReference: data.broadcasterReference || null
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
