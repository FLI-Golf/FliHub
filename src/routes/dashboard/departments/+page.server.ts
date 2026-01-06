import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	try {
		// Fetch all departments with expanded head of department
		const departments = await pb.collection('departments_collection').getFullList({
			sort: 'name',
			expand: 'headOfDepartment'
		});

		// Fetch all user profiles with leader role for the dropdown
		const userProfiles = await pb.collection('user_profiles').getFullList({
			filter: 'role = "leader"',
			sort: 'firstName,lastName'
		});

		return {
			departments,
			userProfiles
		};
	} catch (error) {
		console.error('Error loading departments:', error);
		return {
			departments: [],
			userProfiles: []
		};
	}
};
