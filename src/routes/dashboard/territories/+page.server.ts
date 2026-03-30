import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb = ctx.pb;

	const territories = await pb
		.collection('franchise_territories')
		.getFullList({ sort: 'name', expand: 'dealId' })
		.catch(() => []);

	return { territories };
};
