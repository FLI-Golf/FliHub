import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [franchises, filings] = await Promise.all([
			pb.collection('franchises').getFullList({
				sort: 'priority',
				fields: 'id,name,slug,primaryColor,secondaryColor,logoMini,logoFull,collectionId'
			}),
			pb.collection('trademark_filings').getFullList({
				sort: 'markType,logoVariant'
			})
		]);

		return {
			franchises,
			filings,
			isAdmin: ctx.role === 'admin',
			isAttorney: ctx.role === 'admin' || (ctx.profile as any)?.role === 'attorney'
		};
	} catch (err: any) {
		console.error('Error loading trademarks:', err);
		throw error(500, 'Failed to load trademark data');
	}
};
