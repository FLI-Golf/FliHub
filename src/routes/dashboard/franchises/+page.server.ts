import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.pb) {
		throw error(500, 'PocketBase not initialized');
	}

	try {
		const franchises = await locals.pb.collection('franchises').getFullList({
			expand: 'malePro,femalePro,franchiseeId',
			sort: 'priority'
		});

		return {
			franchises
		};
	} catch (err: any) {
		console.error('Error loading franchises:', err);
		throw error(500, 'Failed to load franchises');
	}
};
