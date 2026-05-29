import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const [tournaments, seasons] = await Promise.all([
		pb.collection('tournaments').getFullList({ sort: '-created', fields: 'id,name,season' }).catch(() => []),
		pb.collection('seasons').getFullList({ sort: '-year', fields: 'id,name,year,status' }).catch(() => [])
	]);

	return { tournaments, seasons };
};
