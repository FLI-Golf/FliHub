import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;

	const franchiseId = url.searchParams.get('franchise');
	const season = url.searchParams.get('season');

	try {
		let filter = '';
		if (franchiseId) {
			filter = `franchise = '${franchiseId}'`;
		}

		const [payouts, franchises, tournaments] = await Promise.all([
			pb.collection('franchise_payouts').getFullList({
				filter,
				expand: 'franchise,tournament'
			}),
			pb.collection('franchises').getFullList({ sort: 'name' }),
			pb.collection('tournaments').getFullList({ sort: '-season,-tournamentNumber' })
		]);

		// Calculate totals by franchise
		const franchiseTotals = new Map<string, { total: number; pending: number; paid: number }>();

		for (const payout of payouts) {
			const fid = payout.franchise;
			if (!franchiseTotals.has(fid)) {
				franchiseTotals.set(fid, { total: 0, pending: 0, paid: 0 });
			}
			const totals = franchiseTotals.get(fid)!;
			totals.total += payout.totalEarnings;
			if (payout.status === 'pending') {
				totals.pending += payout.totalEarnings;
			} else if (payout.status === 'paid') {
				totals.paid += payout.totalEarnings;
			}
		}

		return {
			payouts,
			franchises,
			tournaments,
			franchiseTotals: Object.fromEntries(franchiseTotals),
			currentFranchiseId: franchiseId,
			currentSeason: season
		};
	} catch (error) {
		console.error('Error loading franchise payouts:', error);
		return {
			payouts: [],
			franchises: [],
			tournaments: [],
			franchiseTotals: {},
			currentFranchiseId: null,
			currentSeason: null
		};
	}
};

export const actions: Actions = {
	markPaid: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('franchise_payouts').update(id, {
				status: 'paid',
				paymentDate: new Date().toISOString().split('T')[0]
			});
			return { success: true };
		} catch (error: any) {
			console.error('Error marking payout as paid:', error);
			return fail(400, { error: error.message });
		}
	},

	markPending: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('franchise_payouts').update(id, {
				status: 'pending',
				paymentDate: null
			});
			return { success: true };
		} catch (error: any) {
			console.error('Error marking payout as pending:', error);
			return fail(400, { error: error.message });
		}
	}
};
