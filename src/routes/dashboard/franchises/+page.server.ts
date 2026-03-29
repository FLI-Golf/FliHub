import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	if (!locals.pb) {
		throw error(500, 'PocketBase not initialized');
	}

	try {
		const franchises = await pb.collection('franchises').getFullList({
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
