import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { pb } = await RequestContext.from(locals, url);
	const leagues = await pb.collection('league').getFullList({ sort: '-created', expand: 'owner' }).catch(() => []);
	return { leagues };
};
