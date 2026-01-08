import type { PageServerLoad } from './$types';
import { pb } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const league = await pb.collection('league').getFirstListItem(`slug="${params.slug}"`, {
			expand: 'owner'
		});

		return {
			league
		};
	} catch (err) {
		throw error(404, 'League not found');
	}
};
