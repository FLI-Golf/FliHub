import type { PageServerLoad } from './$types';
import { pb } from '$lib/pocketbase';

export const load: PageServerLoad = async () => {
	const leagues = await pb.collection('league').getFullList({
		sort: '-created',
		expand: 'owner'
	});

	return {
		leagues
	};
};
