import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;

	try {
		const goal = await pb.collection('marketing_goals').getOne(params.id);
		return { goal };
	} catch (err: any) {
		throw error(404, 'Marketing goal not found');
	}
};
