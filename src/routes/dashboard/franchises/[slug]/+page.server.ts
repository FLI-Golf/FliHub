import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	if (!locals.pb) {
		throw error(500, 'PocketBase not initialized');
	}

	try {
		const franchises = await pb.collection('franchises').getFullList({
			filter: `slug = "${params.slug}"`,
			expand: 'malePro,femalePro,additionalPros,franchiseeId'
		});

		if (franchises.length === 0) {
			throw error(404, 'Franchise not found');
		}

		const franchise = franchises[0];

		// Trademark filings for this franchise (soft-fail if collection missing)
		let trademarkFilings: any[] = [];
		try {
			trademarkFilings = await pb.collection('trademark_filings').getFullList({
				filter: `franchiseId = "${franchise.id}"`,
				sort:   'trademarkClass,markType'
			});
		} catch { /* collection not yet created */ }

		return {
			franchise,
			trademarkFilings
		};
	} catch (err: any) {
		console.error('Error loading franchise:', err);
		if (err.status === 404) {
			throw err;
		}
		throw error(500, 'Failed to load franchise');
	}
};
