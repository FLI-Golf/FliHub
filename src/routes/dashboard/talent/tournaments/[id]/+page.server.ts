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
import {
	upsertTournamentWorkOrder,
	writeAuditLog,
} from '$lib/domain/services/PaymentWorkOrderService';

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
				notes: formData.get('notes') as string,
			});

			// Auto-create payment records (draft status)
			const paymentBase = {
				pro:             proId,
				tournament:      params.id,
				tournamentResult: result.id,
				season:          tournament.seasonRef || undefined,
				paymentType:     'tournament_winnings',
				grossAmount:     proEarnings,
				netProAmount:    netProEarnings,
				managerAmount:   managerEarnings,
				managerCutPercentage: managerCutPct,
				managerName:     pro.managerName  || undefined,
				managerEmail:    pro.managerEmail || undefined,
				status:          'pending',
				dueDate:         (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })(),
				description:     `${tournament.name} — ${division === 'mens' ? "Men's" : "Women's"} ${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'} place`,
			};

			// Pro payment record
			const proPaymentRecord = await pb.collection('pro_payments').create({
				...paymentBase,
				recipient: 'pro',
				amount:    netProEarnings,
			});

			// Manager payment record (only if manager cut applies)
			let managerPaymentRecord: any = null;
			if (managerCutPct > 0 && managerEarnings > 0) {
				managerPaymentRecord = await pb.collection('pro_payments').create({
					...paymentBase,
					recipient: 'manager',
					amount:    managerEarnings,
				});
			}

			// Upsert one work order per tournament covering all pro_payment records
			const paymentIds = [proPaymentRecord.id, managerPaymentRecord?.id].filter(Boolean) as string[];
			const workOrderId = await upsertTournamentWorkOrder(
				pb,
				params.id,
				tournament.name,
				proEarnings, // gross amount this result contributes
				paymentIds,
			);

			// Audit log — initial 'created' → 'pending' entry for each payment
			await writeAuditLog(pb, {
				paymentId:  proPaymentRecord.id,
				workOrderId,
				fromStatus: 'created',
				toStatus:   'pending',
				changedBy:  'system',
				amount:     netProEarnings,
				recipient:  'pro',
				notes:      paymentBase.description,
			});
			if (managerPaymentRecord) {
				await writeAuditLog(pb, {
					paymentId:  managerPaymentRecord.id,
					workOrderId,
					fromStatus: 'created',
					toStatus:   'pending',
					changedBy:  'system',
					amount:     managerEarnings,
					recipient:  'manager',
					notes:      paymentBase.description,
				});
			}

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

			// Remove auto-generated payment records for this result
			const payments = await pb.collection('pro_payments').getFullList({
				filter: `tournamentResult = '${id}'`, fields: 'id,amount,recipient,status',
			}).catch(() => []);

			// Remove these payment IDs from the tournament work order
			if (payments.length > 0) {
				const deletedIds = payments.map((p: any) => p.id);
				const wo = await pb.collection('work_orders')
					.getFirstListItem(`projectId = '${result.tournament}' && source = 'pro_payment'`)
					.catch(() => null);
				if (wo) {
					const remaining = (wo.proPayment as string[] ?? []).filter(id => !deletedIds.includes(id));
					const removedAmount = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
					await pb.collection('work_orders').update(wo.id, {
						proPayment: remaining,
						amount: Math.max(0, (wo.amount ?? 0) - removedAmount),
					});
				}
			}

			await Promise.all(payments.map((p: any) => pb.collection('pro_payments').delete(p.id)));

			await pb.collection('tournament_results').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting result:', error);
			return fail(400, { error: error.message });
		}
	}
};
