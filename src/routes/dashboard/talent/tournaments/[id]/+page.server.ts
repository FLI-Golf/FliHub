import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad, Actions } from './$types';
import { TournamentResultRepo } from '$lib/infra/pocketbase/repositories';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	calculatePlacementPayouts,
	calculateFranchisePayout,
	formatCurrency
} from '$lib/domain/services/PayoutCalculator';
import {
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
		const payoutByPlacement = new Map<number, number>(
			payoutStructure.map((entry) => [Number(entry.placement), Number(entry.amount) || 0])
		);
		const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

		// Build a quick-lookup map of pro id → pro record (with manager fields)
		const prosMap = Object.fromEntries(pros.map((p: any) => [p.id, p]));
		const franchiseById = new Map<string, any>(franchises.map((f: any) => [String(f.id), f]));
		const rosterFranchiseByTalentId = new Map<string, string>();
		for (const franchise of franchises) {
			const franchiseId = String(franchise.id);
			const rosterIds = [
				franchise.malePro,
				franchise.femalePro,
				...(Array.isArray(franchise.additionalPros) ? franchise.additionalPros : []),
			].filter(Boolean).map((id: any) => String(id));
			for (const talentId of rosterIds) {
				if (!rosterFranchiseByTalentId.has(talentId)) rosterFranchiseByTalentId.set(talentId, franchiseId);
			}
		}

		// Enrich each result with derived payout values when seed created standings-only rows.
		// If stored payout values already exist, preserve them.
		const enrichedResults = results.items.map((r: any) => {
			const pro = prosMap[r.pro];
			const storedFranchiseId = Array.isArray(r.franchise) ? String(r.franchise[0] ?? '') : String(r.franchise ?? '');
			const rosterFranchiseId = rosterFranchiseByTalentId.get(String(r.pro)) ?? '';
			const effectiveFranchiseId = rosterFranchiseId || storedFranchiseId || '';
			const effectiveFranchise = effectiveFranchiseId ? franchiseById.get(effectiveFranchiseId) : null;
			const placement = Number(r.placement) || 0;
			const storedProEarnings = Number(r.proEarnings || 0);
			const fallbackProEarnings = payoutByPlacement.get(placement) || 0;
			const proEarnings = storedProEarnings > 0 ? storedProEarnings : fallbackProEarnings;

			const storedFranchiseEarnings = Number(r.franchiseEarnings || 0);
			const franchiseEarnings = storedFranchiseEarnings > 0
				? storedFranchiseEarnings
				: (franchiseCutPercentage > 0
					? round2((proEarnings / (100 - franchiseCutPercentage)) * franchiseCutPercentage)
					: 0);

			const managerCutPct = pro?.managerCutPercentage ?? 0;
			const storedManagerEarnings = Number(r.managerEarnings || 0);
			const managerEarnings = storedManagerEarnings > 0
				? storedManagerEarnings
				: (managerCutPct > 0 ? round2(proEarnings * (managerCutPct / 100)) : 0);
			const netProEarnings = round2(proEarnings - managerEarnings);
			const storedTotalEarnings = Number(r.earnings || 0);
			const totalEarnings = storedTotalEarnings > 0
				? storedTotalEarnings
				: round2(proEarnings + franchiseEarnings);

			// Division: use stored value if present, otherwise derive from pro gender
			const division = r.division || (pro?.gender === 'female' ? 'womens' : 'mens');
			return {
				...r,
				franchise: effectiveFranchiseId || r.franchise,
				expand: {
					...(r.expand ?? {}),
					franchise: effectiveFranchise ?? r.expand?.franchise,
				},
				division,
				earnings: totalEarnings,
				proEarnings,
				franchiseEarnings,
				managerEarnings,
				managerCutPercentage: managerCutPct,
				netProEarnings,
				managerName:  pro?.managerName  ?? r.managerName  ?? null,
				managerEmail: pro?.managerEmail ?? r.managerEmail ?? null,
			};
		});

		const workOrders = await pb.collection('work_orders').getFullList({
			filter: `projectId = '${params.id}' && source = 'expense'`,
			sort: '-created',
			expand: 'qb_entered_by',
		}).catch(() => [] as any[]);

		// Load pro_payments for this tournament
		const proPayments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${params.id}'`,
			sort: 'recipient',
			expand: 'pro',
		}).catch(() => [] as any[]);

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
			workOrders,
			proPayments,
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
				paymentType:     'tournament',
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

			// Audit log — initial 'created' → 'pending' entry for each payment
			await writeAuditLog(pb, {
				paymentId:  proPaymentRecord.id,
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

	reorderFranchises: async ({ request, locals, params }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const raw = fd.get('order') as string;
		if (!raw) return fail(400, { error: 'Missing order' });

		let franchiseIds: string[];
		try { franchiseIds = JSON.parse(raw); } catch { return fail(400, { error: 'Invalid order JSON' }); }

		// Load tournament + season for payout calculation
		const tournament = await pb.collection('tournaments').getOne(params.id);
		let seasonRecord: any = null;
		if (tournament.seasonRef) {
			seasonRecord = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
		}
		const franchiseCutPct = seasonRecord?.franchiseCutPercentage ?? tournament.franchiseCutPercentage ?? 0;
		const numberOfPlacements = seasonRecord?.numberOfPlacements ?? 12;
		const { proCut } = calculateFranchisePayout(tournament.prizePool, franchiseCutPct);
		const divisionPurse = proCut / 2;
		const payoutStructure = calculatePlacementPayouts(divisionPurse, numberOfPlacements, franchiseCutPct);

		// Build placement → payout amount lookup
		const payoutByPlacement: Record<number, number> = {};
		for (const p of payoutStructure) payoutByPlacement[p.placement] = p.amount;

		// Load all results + pro records for manager cut
		const [all, pros] = await Promise.all([
			pb.collection('tournament_results').getFullList({ filter: `tournament = '${params.id}'` }),
			pb.collection('talent').getFullList({ fields: 'id,managerCutPercentage' }),
		]);
		const mgrPctById: Record<string, number> = Object.fromEntries(pros.map((p: any) => [p.id, p.managerCutPercentage ?? 0]));

		const updates: Promise<any>[] = [];
		franchiseIds.forEach((fid, idx) => {
			const placement = idx + 1;
			const proEarnings = payoutByPlacement[placement] ?? 0;
			for (const r of all) {
				if (r.franchise === fid) {
					const mgrPct = mgrPctById[r.pro] ?? r.managerCutPercentage ?? 0;
					const managerEarnings = mgrPct > 0 ? Math.round(proEarnings * (mgrPct / 100) * 100) / 100 : 0;
					const franchiseEarnings = proEarnings * (franchiseCutPct / 100);
					updates.push(pb.collection('tournament_results').update(r.id, {
						franchiseRank:    placement,
						placement,
						proEarnings,
						franchiseEarnings,
						managerEarnings,
						netProEarnings:   proEarnings - managerEarnings,
					}));
				}
			}
		});
		await Promise.all(updates);
		return { success: true };
	},

	setPlacement: async ({ request, locals, params }) => {
		const pb  = locals.pb;
		const fd  = await request.formData();
		const resultId   = fd.get('resultId') as string;
		const newPlacement = parseInt(fd.get('placement') as string);

		if (!resultId || isNaN(newPlacement) || newPlacement < 1)
			return fail(400, { error: 'Invalid placement' });

		// Load all results for this tournament to shift others
		const all = await pb.collection('tournament_results').getFullList({
			filter: `tournament = '${params.id}'`,
			sort: 'placement',
		});

		const moving = all.find((r: any) => r.id === resultId);
		if (!moving) return fail(404, { error: 'Result not found' });

		const oldPlacement = moving.placement;
		if (oldPlacement === newPlacement) return { success: true };

		// Shift results between old and new position to fill the gap
		const updates: Promise<any>[] = [];
		for (const r of all) {
			if (r.id === resultId) {
				updates.push(pb.collection('tournament_results').update(r.id, { placement: newPlacement }));
			} else if (oldPlacement < newPlacement && r.placement > oldPlacement && r.placement <= newPlacement) {
				updates.push(pb.collection('tournament_results').update(r.id, { placement: r.placement - 1 }));
			} else if (oldPlacement > newPlacement && r.placement >= newPlacement && r.placement < oldPlacement) {
				updates.push(pb.collection('tournament_results').update(r.id, { placement: r.placement + 1 }));
			}
		}
		await Promise.all(updates);
		return { success: true };
	},

	swapPlacements: async ({ request, locals }) => {
		const pb  = locals.pb;
		const fd  = await request.formData();
		const srcId        = fd.get('srcId') as string;
		const tgtId        = fd.get('tgtId') as string;
		const srcPlacement = parseInt(fd.get('srcPlacement') as string);
		const tgtPlacement = parseInt(fd.get('tgtPlacement') as string);

		if (!srcId || !tgtId || isNaN(srcPlacement) || isNaN(tgtPlacement))
			return fail(400, { error: 'Invalid swap parameters' });

		await Promise.all([
			pb.collection('tournament_results').update(srcId, { placement: tgtPlacement }),
			pb.collection('tournament_results').update(tgtId, { placement: srcPlacement }),
		]);

		return { success: true };
	},

	// Bulk apply manager cuts from the overlay modal
	applyManagerCuts: async ({ request, locals, params }) => {
		const pb  = locals.pb;
		const fd  = await request.formData();
		const raw = fd.get('cuts') as string;
		if (!raw) return fail(400, { error: 'Missing cuts data' });

		let cuts: Array<{ resultId: string; cutPct: number; managerName: string; managerEmail: string }>;
		try { cuts = JSON.parse(raw); } catch { return fail(400, { error: 'Invalid cuts JSON' }); }

		const tournament = await pb.collection('tournaments').getOne(params.id);

		for (const cut of cuts) {
			const result = await pb.collection('tournament_results').getOne(cut.resultId).catch(() => null);
			if (!result) continue;

			const gross   = result.proEarnings ?? 0;
			const mgrAmt  = cut.cutPct > 0 ? Math.round(gross * cut.cutPct) / 100 : 0;
			const proNet  = gross - mgrAmt;

			// Update talent record
			await pb.collection('talent').update(result.pro, {
				managerCutPercentage: cut.cutPct,
				managerName:          cut.managerName,
				managerEmail:         cut.managerEmail,
			}).catch(() => null);

			// Update result record
			await pb.collection('tournament_results').update(cut.resultId, {
				managerCutPercentage: cut.cutPct,
				managerEarnings:      mgrAmt,
				netProEarnings:       proNet,
			});

			// Update pro payment
			const proPayment = await pb.collection('pro_payments')
				.getFirstListItem(`tournamentResult = '${cut.resultId}' && recipient = 'pro'`)
				.catch(() => null);
			if (proPayment) {
				await pb.collection('pro_payments').update(proPayment.id, {
					amount:               proNet,
					netProAmount:         proNet,
					managerCutPercentage: cut.cutPct,
				});
			}

			// Manager payment: create / update / delete
			const mgrPayment = await pb.collection('pro_payments')
				.getFirstListItem(`tournamentResult = '${cut.resultId}' && recipient = 'manager'`)
				.catch(() => null);

			if (cut.cutPct > 0 && mgrAmt > 0) {
				const pro = await pb.collection('talent').getOne(result.pro).catch(() => null);
				if (mgrPayment) {
					await pb.collection('pro_payments').update(mgrPayment.id, {
						amount:               mgrAmt,
						managerAmount:        mgrAmt,
						managerCutPercentage: cut.cutPct,
						managerName:          cut.managerName,
						managerEmail:         cut.managerEmail,
					});
				} else {
					await pb.collection('pro_payments').create({
						tournament:           params.id,
						pro:                  result.pro,
						tournamentResult:     cut.resultId,
						paymentType:          'tournament',
						recipient:            'manager',
						amount:               mgrAmt,
						managerAmount:        mgrAmt,
						grossAmount:          gross,
						managerCutPercentage: cut.cutPct,
						managerName:          cut.managerName,
						managerEmail:         cut.managerEmail,
						status:               'pending',
						description:          `Manager cut (${cut.cutPct}%) — ${pro?.name ?? result.pro} — ${tournament.name}`,
					});
				}
			} else if (mgrPayment) {
				await pb.collection('pro_payments').delete(mgrPayment.id).catch(() => null);
			}
		}

		return { success: true, applied: cuts.length };
	},

	// Generate one work order per pending tournament payment (pro + manager) and per pending franchise payout.
	generateWorkOrders: async ({ locals, params }) => {
		const pb = await getAdminPocketBase();
		const tournament = await pb.collection('tournaments').getOne(params.id);
		const [resultsForValidation, talentsForValidation, franchisesForValidation] = await Promise.all([
			pb.collection('tournament_results').getFullList({ filter: `tournament = '${params.id}'` }).catch(() => [] as any[]),
			pb.collection('talent').getFullList({ fields: 'id,name' }).catch(() => [] as any[]),
			pb.collection('franchises').getFullList({ fields: 'id,name,malePro,femalePro,additionalPros' }).catch(() => [] as any[]),
		]);

		// Build franchise lookups — hoisted so they're reusable in both validation and franchise WO generation.
		const franchiseIdSet = new Set(franchisesForValidation.map((f: any) => String(f.id)));
		const franchiseNameById = new Map<string, string>(franchisesForValidation.map((f: any) => [String(f.id), String(f.name ?? f.id)]));
		const rosterFranchiseByTalentId = new Map<string, string>();
		for (const franchise of franchisesForValidation) {
			const fid = String(franchise.id);
			const rosterIds = [
				franchise.malePro,
				franchise.femalePro,
				...(Array.isArray(franchise.additionalPros) ? franchise.additionalPros : []),
			].filter(Boolean).map((id: any) => String(id));
			for (const talentId of rosterIds) {
				if (!rosterFranchiseByTalentId.has(talentId)) rosterFranchiseByTalentId.set(talentId, fid);
			}
		}

		if (resultsForValidation.length > 0) {
			const talentMap = new Map<string, any>(talentsForValidation.map((t: any) => [String(t.id), t]));
			const unresolvedFranchisePros = new Set<string>();
			const invalidFranchisePros = new Set<string>();

			for (const result of resultsForValidation) {
				const proTalent = talentMap.get(String(result.pro)) || {};
				const resultFranchise = Array.isArray(result.franchise) ? result.franchise[0] : result.franchise;
				const rosterFranchise = rosterFranchiseByTalentId.get(String(result.pro));
				const effectiveFranchise = String(rosterFranchise || '');
				const proName = String(proTalent.name || result.pro || 'Unknown');

				if (!effectiveFranchise) {
					unresolvedFranchisePros.add(proName);
					continue;
				}
				if (!franchiseIdSet.has(effectiveFranchise)) {
					invalidFranchisePros.add(proName);
					continue;
				}
				if (String(resultFranchise || '') !== effectiveFranchise) {
					await pb.collection('tournament_results').update(result.id, { franchise: effectiveFranchise }).catch(() => null);
				}
			}

			if (unresolvedFranchisePros.size > 0) {
				return fail(400, {
					error: `Cannot generate work orders. Missing franchise assignment for: ${Array.from(unresolvedFranchisePros).join(', ')}`,
				});
			}
			if (invalidFranchisePros.size > 0) {
				return fail(400, {
					error: `Cannot generate work orders. Invalid franchise assignment for: ${Array.from(invalidFranchisePros).join(', ')}`,
				});
			}
		}

		let payments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${params.id}'`,
			expand: 'pro',
		}).catch(() => [] as any[]);

		// Initial standings seed may not create payment records. Bootstrap them from
		// result placements so work orders can still be generated on demand.
		if (payments.length === 0) {
			const [results, talents, franchises] = await Promise.all([
				pb.collection('tournament_results').getFullList({ filter: `tournament = '${params.id}'` }).catch(() => [] as any[]),
				pb.collection('talent').getFullList({ fields: 'id,name,franchise,managerName,managerEmail,managerCutPercentage' }).catch(() => [] as any[]),
				pb.collection('franchises').getFullList({ fields: 'id,malePro,femalePro,additionalPros' }).catch(() => [] as any[]),
			]);

			if (results.length > 0) {

				let seasonRecord: any = null;
				if (tournament.seasonRef) {
					seasonRecord = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
				}
				const franchiseCutPercentage = seasonRecord
					? (seasonRecord.franchiseCutPercentage ?? 0)
					: (tournament.franchiseCutPercentage ?? 20);
				const numberOfPlacements = seasonRecord
					? (seasonRecord.numberOfPlacements ?? franchises.length)
					: (franchises.length || 12);
				const { proCut } = calculateFranchisePayout(tournament.prizePool, franchiseCutPercentage);
				const divisionPurse = proCut / 2;
				const payoutStructure = calculatePlacementPayouts(divisionPurse, numberOfPlacements, franchiseCutPercentage);
				const payoutByPlacement = new Map<number, number>(payoutStructure.map((p) => [Number(p.placement), Number(p.amount) || 0]));
				const talentMap = new Map<string, any>(talents.map((t: any) => [String(t.id), t]));
				const existing = new Map<string, any>();
				for (const p of payments) {
					existing.set(`${p.tournamentResult}:${p.recipient}`, p);
				}
				const round2 = (v: number) => Math.round((Number(v) || 0) * 100) / 100;

				for (const result of results) {
					const proTalent = talentMap.get(String(result.pro)) || {};

					const placement = Number(result.placement) || 0;
					const proEarnings = Number(result.proEarnings || 0) > 0
						? Number(result.proEarnings || 0)
						: Number(payoutByPlacement.get(placement) || 0);
					const managerCutPercentage = Number(proTalent.managerCutPercentage ?? result.managerCutPercentage ?? 0);
					const managerEarnings = Number(result.managerEarnings || 0) > 0
						? Number(result.managerEarnings || 0)
						: (managerCutPercentage > 0 ? round2(proEarnings * (managerCutPercentage / 100)) : 0);
					const netProEarnings = Number(result.netProEarnings || 0) > 0
						? Number(result.netProEarnings || 0)
						: round2(proEarnings - managerEarnings);
					const description = `${tournament.name} — ${result.division === 'womens' ? "Women's" : "Men's"} ${placement}${placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'} place`;
					const dueDate = (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })();

					const proKey = `${result.id}:pro`;
					const proPayload = {
						tournament: params.id,
						pro: result.pro,
						tournamentResult: result.id,
						paymentType: 'tournament',
						recipient: 'pro',
						amount: netProEarnings,
						grossAmount: proEarnings,
						netProAmount: netProEarnings,
						managerAmount: managerEarnings,
						managerCutPercentage,
						managerName: proTalent.managerName || undefined,
						managerEmail: proTalent.managerEmail || undefined,
						status: 'pending',
						dueDate,
						description,
					};
					if (existing.has(proKey)) {
						await pb.collection('pro_payments').update(existing.get(proKey).id, proPayload).catch(() => null);
					} else {
						const created = await pb.collection('pro_payments').create(proPayload).catch(() => null);
						if (created) existing.set(proKey, created);
					}

					const mgrKey = `${result.id}:manager`;
					if (managerEarnings > 0) {
						const mgrPayload = {
							tournament: params.id,
							pro: result.pro,
							tournamentResult: result.id,
							paymentType: 'tournament',
							recipient: 'manager',
							amount: managerEarnings,
							managerAmount: managerEarnings,
							grossAmount: proEarnings,
							managerCutPercentage,
							managerName: proTalent.managerName || undefined,
							managerEmail: proTalent.managerEmail || undefined,
							status: 'pending',
							dueDate,
							description: `Manager cut (${managerCutPercentage}%) — ${proTalent.name ?? result.pro} — ${tournament.name}`,
						};
						if (existing.has(mgrKey)) {
							await pb.collection('pro_payments').update(existing.get(mgrKey).id, mgrPayload).catch(() => null);
						} else {
							const created = await pb.collection('pro_payments').create(mgrPayload).catch(() => null);
							if (created) existing.set(mgrKey, created);
						}
					}
				}
			}

			payments = await pb.collection('pro_payments').getFullList({
				filter: `tournament = '${params.id}'`,
				expand: 'pro',
			}).catch(() => [] as any[]);
		}

		if (payments.length === 0) return fail(400, { error: 'No payments to generate work orders for' });

		const existing = await pb.collection('work_orders').getFullList({
			filter: `projectId = '${params.id}' && source = 'expense'`,
			fields: 'id,notes',
		}).catch(() => [] as any[]);
		const existingMarkers = new Set(
			existing.flatMap((wo: any) => {
				const notes = String(wo.notes ?? '');
				const match = notes.match(/\[PP:([a-zA-Z0-9]+)\]/g) || [];
				return match.map(m => m.replace(/^\[PP:|\]$/g, '').trim());
			})
		);

		const allWOs = await pb.collection('work_orders').getFullList({
			fields: 'work_order_number',
			sort: '-created'
		}).catch(() => [] as any[]);

		const startSeq = allWOs.length + 1;
		const createPayloads = payments
			.filter((payment: any) => !existingMarkers.has(payment.id))
			.map((payment: any, index: number) => {
				const proName = payment.expand?.pro?.name ?? payment.pro ?? 'Unknown';
				const recipient = payment.recipient || 'n/a';
				const method = payment.paymentMethod || 'n/a';
				const reference = payment.transactionId || 'n/a';
				const amount = Number(payment.amount ?? 0);
				const woNumber = `WO-TOUR-${params.id.slice(-6).toUpperCase()}-${String(startSeq + index).padStart(4, '0')}`;

				return {
					work_order_number: woNumber,
					source: 'expense' as const,
					status: 'open' as const,
					projectId: params.id,
					projectName: tournament.name,
					projectCode: 'TOUR',
					proPayment: [payment.id],
					amount,
					description: `${tournament.name} payout - ${proName} (${recipient})`,
					notes: `[PP:${payment.id}] ${proName} | ${recipient} | ${method} | ref ${reference} | $${amount.toFixed(2)}`,
					approvedDate: new Date().toISOString().split('T')[0],
					approvedBy: locals.pb.authStore.record?.id ?? undefined,
				};
			});

		const createResults = await Promise.allSettled(
			createPayloads.map(payload => pb.collection('work_orders').create(payload).catch((e: any) => {
				console.error('❌ tournament payout work_order create failed:', e.message, JSON.stringify(e.data ?? {}));
				throw e;
			}))
		);

		const createdCount = createResults.filter(result => result.status === 'fulfilled').length;
		const failedCount = createResults.length - createdCount;

		if (failedCount > 0) {
			console.warn(`[tournament payout] ${failedCount} work order(s) failed during generation for tournament ${params.id}`);
		}

		// ── Franchise payout work orders ─────────────────────────────────────────
		let franchiseCutPct = 0;
		if (tournament.seasonRef) {
			const sr = await pb.collection('seasons').getOne(tournament.seasonRef).catch(() => null);
			franchiseCutPct = Number(sr?.franchiseCutPercentage ?? tournament.franchiseCutPercentage ?? 0);
		} else {
			franchiseCutPct = Number(tournament.franchiseCutPercentage ?? 0);
		}

		if (franchiseCutPct > 0) {
			// Bootstrap franchise_payouts from results if none exist yet.
			const existingFranchisePayouts = await pb.collection('franchise_payouts').getFullList({
				filter: `tournament = '${params.id}'`,
				fields: 'id,franchise,totalEarnings,mensEarnings,womensEarnings,numberOfPros,status',
			}).catch(() => [] as any[]);

			if (existingFranchisePayouts.length === 0 && resultsForValidation.length > 0) {
				const franchiseAccum = new Map<string, { mens: number; womens: number; count: number }>();
				for (const result of resultsForValidation) {
					const franchiseId = rosterFranchiseByTalentId.get(String(result.pro));
					if (!franchiseId) continue;
					const proEarnings = Number(result.proEarnings || 0);
					const franchiseEarnings = proEarnings > 0
						? Math.round((proEarnings / (100 - franchiseCutPct)) * franchiseCutPct * 100) / 100
						: 0;
					if (!franchiseAccum.has(franchiseId)) franchiseAccum.set(franchiseId, { mens: 0, womens: 0, count: 0 });
					const acc = franchiseAccum.get(franchiseId)!;
					if (result.division === 'womens') acc.womens = Math.round((acc.womens + franchiseEarnings) * 100) / 100;
					else acc.mens = Math.round((acc.mens + franchiseEarnings) * 100) / 100;
					acc.count += 1;
				}
				await Promise.allSettled(
					Array.from(franchiseAccum.entries()).map(([franchiseId, acc]) =>
						pb.collection('franchise_payouts').create({
							franchise: franchiseId,
							tournament: params.id,
							totalEarnings: Math.round((acc.mens + acc.womens) * 100) / 100,
							mensEarnings: acc.mens,
							womensEarnings: acc.womens,
							numberOfPros: acc.count,
							status: 'pending',
						}).catch(() => null)
					)
				);
			}

			// Load pending franchise_payouts and create one WO each (skipping already-marked ones).
			const pendingFranchisePayouts = await pb.collection('franchise_payouts').getFullList({
				filter: `tournament = '${params.id}' && status = 'pending'`,
				fields: 'id,franchise,totalEarnings,status',
			}).catch(() => [] as any[]);

			if (pendingFranchisePayouts.length > 0) {
				const allExistingWOs = await pb.collection('work_orders').getFullList({
					filter: `projectId = '${params.id}' && source = 'expense'`,
					fields: 'id,notes',
				}).catch(() => [] as any[]);
				const existingFPMarkers = new Set(
					allExistingWOs.flatMap((wo: any) => {
						const notes = String(wo.notes ?? '');
						const match = notes.match(/\[FP:([a-zA-Z0-9]+)\]/g) || [];
						return match.map((m: string) => m.replace(/^\[FP:|\]$/g, '').trim());
					})
				);
				const allWOsNow = await pb.collection('work_orders').getFullList({
					fields: 'work_order_number',
					sort: '-created',
				}).catch(() => [] as any[]);
				let franchiseSeq = allWOsNow.length + 1;

				await Promise.allSettled(
					pendingFranchisePayouts
						.filter((fp: any) => !existingFPMarkers.has(fp.id))
						.map((fp: any) => {
							const franchiseName = franchiseNameById.get(String(fp.franchise)) ?? String(fp.franchise);
							const amount = Number(fp.totalEarnings ?? 0);
							const woNumber = `WO-FRAN-${params.id.slice(-6).toUpperCase()}-${String(franchiseSeq++).padStart(4, '0')}`;
							return pb.collection('work_orders').create({
								work_order_number: woNumber,
								source: 'expense' as const,
								status: 'open' as const,
								projectId: params.id,
								projectName: tournament.name,
								projectCode: 'FRAN',
								franchise_payouts: fp.id,
								amount,
								description: `${tournament.name} franchise share - ${franchiseName}`,
								notes: `[FP:${fp.id}] ${franchiseName} | franchise | $${amount.toFixed(2)}`,
								approvedDate: new Date().toISOString().split('T')[0],
								approvedBy: locals.pb.authStore.record?.id ?? undefined,
							}).catch((e: any) => {
								console.error('❌ franchise WO create failed:', e.message, JSON.stringify(e.data ?? {}));
							});
						})
				);
			}
		}

		throw redirect(303, '/dashboard/work-orders');
	},

	generateWorkOrder: async ({ locals, params }) => {
		const pb = locals.pb;
		const tournament = await pb.collection('tournaments').getOne(params.id);

		// Get all pro_payments for this tournament
		const payments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${params.id}'`,
		}).catch(() => [] as any[]);

		if (payments.length === 0) return fail(400, { error: 'No payments to generate work order for' });

		// Total = sum of all pro payments (pros + managers)
		const totalAmount = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
		const paymentIds  = payments.map((p: any) => p.id);
		const transactionManifest = payments.map((p: any, index: number) => {
			const proName = p.expand?.pro?.name ?? p.pro ?? 'Unknown';
			const method = p.paymentMethod || 'n/a';
			const reference = p.transactionId || 'n/a';
			const recipient = p.recipient || 'n/a';
			const amount = Number(p.amount ?? 0).toFixed(2);
			return `${index + 1}. ${proName} | ${recipient} | ${method} | ref ${reference} | $${amount}`;
		}).join(' ; ');

		const dateStr   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const woNumber  = `WO-TOUR-${params.id.slice(-6).toUpperCase()}-${dateStr}`;

		// Keep manual generation as a fallback, but generate one WO per payment.
		const existingMarkers = new Set(
			await pb.collection('work_orders').getFullList({
				filter: `projectId = '${params.id}' && source = 'expense'`,
				fields: 'notes',
			}).then((rows: any[]) => rows.flatMap((wo: any) => {
				const match = String(wo.notes ?? '').match(/\[PP:([a-zA-Z0-9]+)\]/g) || [];
				return match.map(m => m.replace(/^\[PP:|\]$/g, '').trim());
			})).catch(() => [])
		);

		const allWOs = await pb.collection('work_orders').getFullList({ fields: 'work_order_number', sort: '-created' }).catch(() => [] as any[]);
		let seq = allWOs.length + 1;
		let createdCount = 0;
		for (const payment of payments) {
			if (existingMarkers.has(payment.id)) continue;
			const proName = payment.expand?.pro?.name ?? payment.pro ?? 'Unknown';
			const recipient = payment.recipient || 'n/a';
			const method = payment.paymentMethod || 'n/a';
			const reference = payment.transactionId || 'n/a';
			const amount = Number(payment.amount ?? 0);
			const woNumber = `WO-TOUR-${params.id.slice(-6).toUpperCase()}-${String(seq).padStart(4, '0')}`;
			seq += 1;
			await pb.collection('work_orders').create({
				work_order_number: woNumber,
				source: 'expense',
				status: 'open',
				projectId: params.id,
				projectName: tournament.name,
				projectCode: 'TOUR',
				proPayment: [payment.id],
				amount,
				description: `${tournament.name} payout - ${proName} (${recipient})`,
				notes: `[PP:${payment.id}] ${proName} | ${recipient} | ${method} | ref ${reference} | $${amount.toFixed(2)}`,
				approvedDate: new Date().toISOString().split('T')[0],
			});
			createdCount += 1;
		}

		throw redirect(303, '/dashboard/work-orders');
	},

	markQbEntered: async ({ request, locals, params }) => {
		const pb  = locals.pb;
		const fd  = await request.formData();
		const woId       = fd.get('woId') as string;
		const qbAccount  = fd.get('qbAccount') as string || 'Player Payouts';
		const qbNotes    = fd.get('qbNotes') as string || '';

		if (!woId) return fail(400, { error: 'Missing work order ID' });

		await pb.collection('work_orders').update(woId, {
			status:          'paid',
			paidDate:        new Date().toISOString().slice(0, 10),
			qb_account:      qbAccount,
			qb_notes:        qbNotes,
			qb_entered_date: new Date().toISOString().slice(0, 10),
			qb_entered_by:   locals.pb.authStore.record?.id ?? undefined,
		});

		// Mark all pro_payments as paid
		const payments = await pb.collection('pro_payments').getFullList({
			filter: `tournament = '${params.id}' && status = 'pending'`,
		}).catch(() => [] as any[]);

		await Promise.all(payments.map((p: any) =>
			pb.collection('pro_payments').update(p.id, {
				status: 'paid',
				paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
				paidBy: locals.pb.authStore.record?.id ?? 'admin',
			})
		));

		return { success: true, paid: payments.length };
	},

	clearTestData: async ({ locals, params }) => {
		const pb = locals.pb;
		const tournamentId = params.id;

		const [results, payments, wos] = await Promise.all([
			pb.collection('tournament_results').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
			pb.collection('pro_payments').getFullList({ filter: `tournament = '${tournamentId}'` }).catch(() => [] as any[]),
			pb.collection('work_orders').getFullList({ filter: `projectId = '${tournamentId}' && source = 'expense'` }).catch(() => [] as any[]),
		]);

		await Promise.all([
			...results.map((r: any) => pb.collection('tournament_results').delete(r.id).catch(() => null)),
			...payments.map((p: any) => pb.collection('pro_payments').delete(p.id).catch(() => null)),
			...wos.map((w: any) => pb.collection('work_orders').delete(w.id).catch(() => null)),
		]);
		await pb.collection('tournaments').update(tournamentId, { status: 'scheduled' }).catch(() => null);

		return { success: true, cleared: results.length };
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
