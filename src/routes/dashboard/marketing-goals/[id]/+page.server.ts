import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	
	try {
		const goal = await pb.collection('marketing_goals').getOne(params.id);
		return { goal };
	} catch (err: any) {
		throw error(404, 'Marketing goal not found');
	}
};
