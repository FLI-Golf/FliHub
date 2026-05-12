import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { TournamentResultRepo } from '$lib/infra/pocketbase/repositories';
import { error, fail } from '@sveltejs/kit';
import {
	calculatePlacementPayouts,
	calculateFranchisePayout,
	seasonConfigFromRecord,
	formatCurrency
} from '$lib/domain/services/PayoutCalculator';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
		const resultRepo = new TournamentResultRepo(pb);

	try {
		const tournament = await pb.collection('tournaments').getOne(params.id);

		const [results, franchises, pros, franchisePayouts] = await Promise.all([
			resultRepo.findByTournament(params.id),
			pb.collection('franchises').getFullList({ sort: 'name' }),
			pb.collection('talent').getFullList({ sort: 'name', fields: 'id,name,gender,managerName,managerCutPercentage,managerEmail' }),
			pb.collection('franchise_payouts')
				.getFullList({ filter: `tournament = '${params.id}'`, expand: 'franchise' })
		]);

		// Load season record for config — fall back to tournament-level field if no relation set
		let seasonRecord: any = null;
		if (tournament.seasonRef) {
			seasonRecord = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
		}

		// Resolve settings: season record wins, then tournament field, then safe defaults
		const franchiseCutPercentage = seasonRecord
			? (seasonRecord.franchiseCutPercentage ?? 0)
			: (tournament.franchiseCutPercentage ?? 20);
		const numberOfPlacements = seasonRecord
			? (seasonRecord.numberOfPlacements ?? franchises.length)
			: franchises.length || 12;

		const { franchiseCut, proCut } = calculateFranchisePayout(
			tournament.prizePool,
			franchiseCutPercentage
		);
		const divisionPurse = proCut / 2;
		const payoutStructure = calculatePlacementPayouts(divisionPurse, numberOfPlacements, franchiseCutPercentage);

		// Build a quick-lookup map of pro id → pro record (with manager fields)
		const prosMap = Object.fromEntries(pros.map((p: any) => [p.id, p]));

		// Enrich each result with manager earnings calculated from the pro's cut %
		const enrichedResults = results.items.map((r: any) => {
			const pro = prosMap[r.pro];
			const managerCutPct = pro?.managerCutPercentage ?? 0;
			const managerEarnings = managerCutPct > 0
				? Math.round((r.proEarnings || 0) * (managerCutPct / 100) * 100) / 100
				: (r.managerEarnings ?? 0);
			const netProEarnings = (r.proEarnings || 0) - managerEarnings;
			return {
				...r,
				managerEarnings,
				managerCutPercentage: managerCutPct,
				netProEarnings,
				managerName:  pro?.managerName  ?? r.managerName  ?? null,
				managerEmail: pro?.managerEmail ?? r.managerEmail ?? null,
			};
		});

		return {
			tournament,
			seasonRecord,
			results: enrichedResults,
			franchises,
			pros,
			prosMap,
			franchisePayouts,
			payoutStructure,
			franchiseCut,
			proCut,
			divisionPurse,
			franchiseCutPercentage,
		};
	} catch (err) {
		console.error('Error loading tournament:', err);
		throw error(404, 'Tournament not found');
	}
};

export const actions: Actions = {
	addResult: async ({ request, locals, params }) => {
		const pb = locals.pb;
		const formData = await request.formData();

		const division = formData.get('division') as string;
		const placement = parseInt(formData.get('placement') as string);
		const proId = formData.get('pro') as string;

		try {
			// Get tournament and pro details
			const tournament = await pb.collection('tournaments').getOne(params.id);
			const pro = await pb.collection('talent').getOne(proId);

			// Get franchise if pro has one
			let franchiseId = formData.get('franchise') as string;
			if (!franchiseId && pro.franchise) {
				franchiseId = pro.franchise;
			}

			// Resolve season config for earnings calculation
			let seasonRec: any = null;
			if (tournament.seasonRef) {
				seasonRec = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
			}
			const franchiseCutPercentage = seasonRec
				? (seasonRec.franchiseCutPercentage ?? 0)
				: (tournament.franchiseCutPercentage ?? 20);
			const allFranchises = await pb.collection('franchises').getFullList({ fields: 'id' });
			const numberOfPlacements = seasonRec
				? (seasonRec.numberOfPlacements ?? allFranchises.length)
				: allFranchises.length || 12;
			const { proCut } = calculateFranchisePayout(tournament.prizePool, franchiseCutPercentage);
			const divisionPurse = proCut / 2;
			const payoutStructure = calculatePlacementPayouts(divisionPurse, numberOfPlacements, franchiseCutPercentage);
			const placementPayout = payoutStructure.find((p) => p.placement === placement);

			if (!placementPayout) {
				return fail(400, { error: 'Invalid placement' });
			}

			const proEarnings = placementPayout.amount;
			const franchiseEarnings = franchiseCutPercentage > 0
				? (proEarnings / (100 - franchiseCutPercentage)) * franchiseCutPercentage
				: 0;
			const totalEarnings = proEarnings + franchiseEarnings;

			// Manager cut — read from pro record
			const managerCutPct = pro.managerCutPercentage ?? 0;
			const managerEarnings = managerCutPct > 0
				? Math.round(proEarnings * (managerCutPct / 100) * 100) / 100
				: 0;
			const netProEarnings = proEarnings - managerEarnings;

			// Create result
			const result = await pb.collection('tournament_results').create({
				tournament: params.id,
				pro: proId,
				franchise: franchiseId || undefined,
				division,
				placement,
				earnings: totalEarnings,
				franchiseEarnings,
				proEarnings,
				managerEarnings,
				managerCutPercentage: managerCutPct,
				netProEarnings,
				score: formData.get('score') as string,
				rounds: formData.get('rounds') ? parseInt(formData.get('rounds') as string) : undefined,
				notes: formData.get('notes') as string
			});

			// Update or create franchise payout
			if (franchiseId) {
				const existingPayout = await pb
					.collection('franchise_payouts')
					.getFirstListItem(`franchise = '${franchiseId}' && tournament = '${params.id}'`)
					.catch(() => null);

				if (existingPayout) {
					// Update existing
					const newTotal = existingPayout.totalEarnings + franchiseEarnings;
					const newMens =
						division === 'mens'
							? existingPayout.mensEarnings + franchiseEarnings
							: existingPayout.mensEarnings;
					const newWomens =
						division === 'womens'
							? existingPayout.womensEarnings + franchiseEarnings
							: existingPayout.womensEarnings;

					await pb.collection('franchise_payouts').update(existingPayout.id, {
						totalEarnings: newTotal,
						mensEarnings: newMens,
						womensEarnings: newWomens,
						numberOfPros: existingPayout.numberOfPros + 1
					});
				} else {
					// Create new
					await pb.collection('franchise_payouts').create({
						franchise: franchiseId,
						tournament: params.id,
						totalEarnings: franchiseEarnings,
						mensEarnings: division === 'mens' ? franchiseEarnings : 0,
						womensEarnings: division === 'womens' ? franchiseEarnings : 0,
						numberOfPros: 1,
						status: 'pending'
					});
				}
			}

			return { success: true, result };
		} catch (error: any) {
			console.error('Error adding result:', error);
			return fail(400, { error: error.message });
		}
	},

	deleteResult: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			const result = await pb.collection('tournament_results').getOne(id);

			// Update franchise payout if exists
			if (result.franchise) {
				const franchisePayout = await pb
					.collection('franchise_payouts')
					.getFirstListItem(
						`franchise = '${result.franchise}' && tournament = '${result.tournament}'`
					)
					.catch(() => null);

				if (franchisePayout) {
					const newTotal = franchisePayout.totalEarnings - result.franchiseEarnings;
					const newMens =
						result.division === 'mens'
							? franchisePayout.mensEarnings - result.franchiseEarnings
							: franchisePayout.mensEarnings;
					const newWomens =
						result.division === 'womens'
							? franchisePayout.womensEarnings - result.franchiseEarnings
							: franchisePayout.womensEarnings;

					if (newTotal <= 0) {
						await pb.collection('franchise_payouts').delete(franchisePayout.id);
					} else {
						await pb.collection('franchise_payouts').update(franchisePayout.id, {
							totalEarnings: newTotal,
							mensEarnings: newMens,
							womensEarnings: newWomens,
							numberOfPros: franchisePayout.numberOfPros - 1
						});
					}
				}
			}

			await pb.collection('tournament_results').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting result:', error);
			return fail(400, { error: error.message });
		}
	}
};
