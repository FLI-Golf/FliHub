import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [event, tournaments, seasons] = await Promise.all([
			pb.collection('special_events').getOne(params.id, { expand: 'tournament,season' }),
			pb.collection('tournaments').getFullList({ sort: '-created', fields: 'id,name,season' }).catch(() => []),
			pb.collection('seasons').getFullList({ sort: '-year', fields: 'id,name,year,status' }).catch(() => [])
		]);
		return { event, tournaments, seasons };
	} catch {
		throw error(404, 'Event not found');
	}
};
