import { RequestContext } from '$lib/infra/RequestContext';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		// If this is a new improvement, return empty data
		if (params.id === 'new') {
			return {
				improvement: null,
				isNew: true
			};
		}

		// Otherwise, fetch the improvement
		const improvement = await pb.collection('continuous_improvements').getOne(params.id);
		return {
			improvement,
			isNew: false
		};
	} catch (err: any) {
		console.error('Failed to load improvement:', err);
		throw error(404, 'Improvement not found');
	}
};
