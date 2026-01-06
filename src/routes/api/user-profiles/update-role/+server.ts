import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.pb.authStore.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin
	const userProfile = await locals.pb.collection('user_profiles').getFirstListItem(
		`userId = "${locals.pb.authStore.model?.id}"`
	);

	if (userProfile.role !== 'admin') {
		return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
	}

	try {
		const { profileId, role, vendorId, departmentId } = await request.json();

		if (!profileId || !role) {
			return json({ error: 'Missing profileId or role' }, { status: 400 });
		}

		// Validate role
		const validRoles = ['leader', 'admin', 'vendor', 'pro', 'franchise_owner'];
		if (!validRoles.includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}

		// Prepare update data
		const updateData: any = { role };
		
		// Add vendorId if provided (or explicitly set to null)
		if (vendorId !== undefined) {
			updateData.vendorId = vendorId || null;
		}

		// Add departmentId if provided (or explicitly set to null)
		if (departmentId !== undefined) {
			updateData.departmentId = departmentId || null;
		}

		// Update the user profile
		const updated = await locals.pb.collection('user_profiles').update(profileId, updateData);

		return json({ success: true, profile: updated });
	} catch (error: any) {
		console.error('Error updating role:', error);
		return json({ error: error.message || 'Failed to update role' }, { status: 500 });
	}
};
