import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const franchises = await pb.collection('franchises').getFullList({
			sort: 'priority',
			fields: 'id,name,slug,primaryColor,secondaryColor,logoMini,logoFull,collectionId'
		});

		// trademark_filings collection may not exist yet — degrade gracefully
		let filings: any[] = [];
		let collectionMissing = false;
		try {
			filings = await pb.collection('trademark_filings').getFullList({
				sort: 'franchiseId,markType,logoVariant'
			});
		} catch (e: any) {
			const msg = e?.response?.message ?? e?.message ?? '';
			if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes("doesn't exist") || e?.status === 404) {
				collectionMissing = true;
			} else {
				throw e;
			}
		}

		return {
			franchises,
			filings,
			collectionMissing,
			isAdmin: ctx.role === 'admin',
			isAttorney: ctx.role === 'admin' || (ctx.profile as any)?.role === 'attorney'
		};
	} catch (err: any) {
		console.error('Error loading trademarks:', err);
		throw error(500, 'Failed to load trademark data');
	}
};
