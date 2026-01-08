import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if current user is admin
	let isAdmin = false;
	try {
		const userProfile = await locals.pb.collection('user_profiles').getFirstListItem(
			`userId = "${locals.pb.authStore.model?.id}"`
		);
		isAdmin = userProfile.role === 'admin';
	} catch (error) {
		// User profile not found or error
	}

	// Fetch user profiles - all users if admin, only current user's role otherwise
	const filter = isAdmin ? '' : `userId = "${locals.pb.authStore.model?.id}"`;
	const people = await locals.pb.collection('user_profiles').getFullList({
		filter,
		sort: 'firstName,lastName',
		expand: 'vendorId,proReference'
	});

	// Fetch all vendors for the dropdown
	let vendors = [];
	let departments = [];
	if (isAdmin) {
		try {
			vendors = await locals.pb.collection('vendors').getFullList({
				sort: 'name',
				fields: 'id,name,active'
			});
		} catch (error) {
			console.error('Error fetching vendors:', error);
		}

		try {
			departments = await locals.pb.collection('departments').getFullList({
				sort: 'name',
				fields: 'id,name,status'
			});
		} catch (error) {
			console.error('Error fetching departments:', error);
		}
	}

	return {
		people,
		vendors,
		departments,
		isAdmin
	};
};
