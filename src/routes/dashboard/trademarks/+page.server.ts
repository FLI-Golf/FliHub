import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		// League — soft-fail if collection missing
		let league: any = null;
		try {
			const leagues = await pb.collection('league').getFullList({
				fields: 'id,collectionId,name,tagline,primaryColor,secondaryColor,logoMens,logoWomens,logoMonochrome,logoWordmark,logoHorizontal,logoVertical'
			});
			league = leagues[0] ?? null;
		} catch { /* league collection not available */ }

		const franchises = await pb.collection('franchises').getFullList({
			sort: 'priority'
		});

		// trademark_filings — degrade gracefully if collection not yet created
		let allFilings: any[] = [];
		let collectionMissing = false;
		try {
			allFilings = await pb.collection('trademark_filings').getFullList({
				sort: 'markType,logoVariant'
			});
		} catch (e: any) {
			const msg: string = e?.response?.message ?? e?.message ?? '';
			if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes("doesn't exist") || e?.status === 404) {
				collectionMissing = true;
			} else {
				throw e;
			}
		}

		// Billing groups + expenses (soft-fail if not yet migrated)
		let billingGroups: any[] = [];
		let expenses: any[] = [];
		try {
			[billingGroups, expenses] = await Promise.all([
				pb.collection('trademark_billing_groups').getFullList({ sort: '-created' }),
				pb.collection('trademark_expenses').getFullList({ sort: '-created' })
			]);
		} catch { /* collections not yet created */ }

		// Split: league filings vs franchise filings
		const leagueFilings    = league ? allFilings.filter((f: any) => f.franchiseId === league.id) : [];
		const franchiseFilings = league ? allFilings.filter((f: any) => f.franchiseId !== league.id) : allFilings;

		return {
			franchises,
			filings:       franchiseFilings,
			league,
			leagueFilings,
			billingGroups,
			expenses,
			collectionMissing,
			isAdmin:    ctx.role === 'admin',
			isAttorney: ctx.role === 'admin' || (ctx.profile as any)?.role === 'attorney'
		};
	} catch (err: any) {
		console.error('Error loading trademarks:', err);
		throw error(500, 'Failed to load trademark data');
	}
};
