import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.pb) {
		throw error(500, 'PocketBase not initialized');
	}

	try {
		const franchises = await locals.pb.collection('franchises').getFullList({
			filter: `slug = "${params.slug}"`,
			expand: 'malePro,femalePro,additionalPros,franchiseeId'
		});

		if (franchises.length === 0) {
			throw error(404, 'Franchise not found');
		}

		return {
			franchise: franchises[0]
		};
	} catch (err: any) {
		console.error('Error loading franchise:', err);
		if (err.status === 404) {
			throw err;
		}
		throw error(500, 'Failed to load franchise');
	}
};
