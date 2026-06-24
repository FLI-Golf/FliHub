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

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const currentUserId = pb.authStore.model?.id;
		const currentUserProfile = await pb.collection('user_profiles').getFirstListItem(
			`userId = "${currentUserId}"`
		).catch(() => null);

		const isAdmin = currentUserProfile?.role === 'admin';
		if (!isAdmin && currentUserProfile?.id !== params.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const data = await request.json();
		const updateData: Record<string, unknown> = {};

		if (data.firstName !== undefined) updateData.firstName = data.firstName || '';
		if (data.lastName !== undefined) updateData.lastName = data.lastName || '';
		if (data.avatar !== undefined) updateData.avatar = data.avatar || '';
		if (data.bio !== undefined) updateData.bio = data.bio || '';
		if (data.email !== undefined) updateData.email = data.email || '';
		if (data.phone !== undefined) updateData.phone = data.phone || '';
		if (data.vendorId !== undefined) updateData.vendorId = data.vendorId || null;
		if (data.status !== undefined) updateData.status = data.status || 'active';
		if (data.organization !== undefined) updateData.organization = data.organization || '';
		if (data.broadcasterReference !== undefined) updateData.broadcasterReference = data.broadcasterReference || null;
		if (data.talentReference !== undefined) updateData.talentReference = data.talentReference || null;
			if (data.proReference !== undefined) updateData.proReference = data.proReference || null;
		if (data.departmentId !== undefined) updateData.departmentId = data.departmentId || null;

		if (data.role !== undefined) {
			if (!VALID_ROLES.includes(String(data.role))) {
				return json({ error: 'Invalid role' }, { status: 400 });
			}
			updateData.role = data.role;
			if (data.availableRoles === undefined) {
				updateData.availableRoles = [data.role];
			}
		}

		if (data.availableRoles !== undefined) {
			updateData.availableRoles = Array.isArray(data.availableRoles)
				? data.availableRoles
				: [data.availableRoles];
		}

		if (Object.keys(updateData).length === 0) {
			return json({ error: 'No valid fields to update' }, { status: 400 });
		}

		const updated = await pb.collection('user_profiles').update(params.id, updateData);
		return json(updated, { status: 200 });
	} catch (error: any) {
		console.error('Error updating user profile:', error);
		return json(
			{
				error: 'Failed to update user profile',
				details: error?.message || String(error)
			},
			{ status: 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('user_profiles').delete(params.id);
		return json({ success: true }, { status: 200 });
	} catch (error: any) {
		console.error('Error deleting user profile:', error);
		return json(
			{ 
				error: 'Failed to delete manager',
				details: error?.message || String(error)
			},
			{ status: 500 }
		);
	}
};
