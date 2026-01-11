/**
 * Tournament Payout Service
 * 
 * Handles the complete payout workflow:
 * 1. Calculate tournament purse based on season structure
 * 2. Split between men's and women's divisions (equal)
 * 3. Calculate franchise cut (20% default)
 * 4. Distribute remaining to pros based on placement
 * 5. Track franchise payouts
 */

import type PocketBase from 'pocketbase';
import {
	calculatePlacementPayouts,
	calculateFranchisePayout,
	get2027SeasonPurses,
	type PlacementPayout
} from './PayoutCalculator';

export interface TournamentPayoutConfig {
	tournamentId: string;
	season: number;
	tournamentNumber: number;
	totalPurse: number;
	franchiseCutPercentage: number;
}

export interface DivisionResult {
	proId: string;
	franchiseId?: string;
	placement: number;
	division: 'mens' | 'womens';
}

export interface PayoutResult {
	resultId: string;
	proId: string;
	franchiseId?: string;
	division: 'mens' | 'womens';
	placement: number;
	totalEarnings: number;
	franchiseEarnings: number;
	proEarnings: number;
}

export interface FranchisePayoutSummary {
	franchiseId: string;
	tournamentId: string;
	totalEarnings: number;
	mensEarnings: number;
	womensEarnings: number;
	numberOfPros: number;
}

/**
 * Calculate payouts for a tournament based on results
 */
export function calculateTournamentPayouts(
	config: TournamentPayoutConfig,
	mensResults: DivisionResult[],
	womensResults: DivisionResult[]
): PayoutResult[] {
	const { totalPurse, franchiseCutPercentage } = config;

	// Calculate franchise and pro cuts
	const { franchiseCut, proCut } = calculateFranchisePayout(totalPurse, franchiseCutPercentage);

	// Split pro cut equally between divisions
	const divisionPurse = proCut / 2;

	// Get placement payouts
	const placementPayouts = calculatePlacementPayouts(divisionPurse);
	const payoutMap = new Map(placementPayouts.map((p) => [p.placement, p.amount]));

	const allPayouts: PayoutResult[] = [];

	// Calculate men's payouts
	for (const result of mensResults) {
		const proEarnings = payoutMap.get(result.placement) || 0;
		const franchiseEarnings = (proEarnings / (100 - franchiseCutPercentage)) * franchiseCutPercentage;
		const totalEarnings = proEarnings + franchiseEarnings;

		allPayouts.push({
			resultId: '', // Will be set when creating records
			proId: result.proId,
			franchiseId: result.franchiseId,
			division: 'mens',
			placement: result.placement,
			totalEarnings,
			franchiseEarnings,
			proEarnings
		});
	}

	// Calculate women's payouts
	for (const result of womensResults) {
		const proEarnings = payoutMap.get(result.placement) || 0;
		const franchiseEarnings = (proEarnings / (100 - franchiseCutPercentage)) * franchiseCutPercentage;
		const totalEarnings = proEarnings + franchiseEarnings;

		allPayouts.push({
			resultId: '',
			proId: result.proId,
			franchiseId: result.franchiseId,
			division: 'womens',
			placement: result.placement,
			totalEarnings,
			franchiseEarnings,
			proEarnings
		});
	}

	return allPayouts;
}

/**
 * Calculate franchise payout summaries
 */
export function calculateFranchisePayouts(
	tournamentId: string,
	payouts: PayoutResult[]
): FranchisePayoutSummary[] {
	const franchiseMap = new Map<string, FranchisePayoutSummary>();

	for (const payout of payouts) {
		if (!payout.franchiseId) continue;

		if (!franchiseMap.has(payout.franchiseId)) {
			franchiseMap.set(payout.franchiseId, {
				franchiseId: payout.franchiseId,
				tournamentId,
				totalEarnings: 0,
				mensEarnings: 0,
				womensEarnings: 0,
				numberOfPros: 0
			});
		}

		const summary = franchiseMap.get(payout.franchiseId)!;
		summary.totalEarnings += payout.franchiseEarnings;
		summary.numberOfPros++;

		if (payout.division === 'mens') {
			summary.mensEarnings += payout.franchiseEarnings;
		} else {
			summary.womensEarnings += payout.franchiseEarnings;
		}
	}

	return Array.from(franchiseMap.values());
}

/**
 * Apply payouts to database
 */
export async function applyTournamentPayouts(
	pb: PocketBase,
	tournamentId: string,
	payouts: PayoutResult[]
): Promise<void> {
	// Create tournament results
	for (const payout of payouts) {
		await pb.collection('tournament_results').create({
			tournament: tournamentId,
			pro: payout.proId,
			franchise: payout.franchiseId,
			division: payout.division,
			placement: payout.placement,
			earnings: payout.totalEarnings,
			franchiseEarnings: payout.franchiseEarnings,
			proEarnings: payout.proEarnings
		});
	}

	// Create franchise payouts
	const franchisePayouts = calculateFranchisePayouts(tournamentId, payouts);
	for (const franchisePayout of franchisePayouts) {
		await pb.collection('franchise_payouts').create({
			franchise: franchisePayout.franchiseId,
			tournament: tournamentId,
			totalEarnings: franchisePayout.totalEarnings,
			mensEarnings: franchisePayout.mensEarnings,
			womensEarnings: franchisePayout.womensEarnings,
			numberOfPros: franchisePayout.numberOfPros,
			status: 'pending'
		});
	}

	// Update tournament with payout details
	const tournament = await pb.collection('tournaments').getOne(tournamentId);
	const { franchiseCut, proCut } = calculateFranchisePayout(
		tournament.prizePool,
		tournament.franchiseCutPercentage || 20
	);

	await pb.collection('tournaments').update(tournamentId, {
		franchiseCutAmount: franchiseCut,
		proCutAmount: proCut,
		mensPurse: proCut / 2,
		womensPurse: proCut / 2
	});
}

/**
 * Get payout preview without saving
 */
export function getPayoutPreview(
	config: TournamentPayoutConfig,
	mensResults: DivisionResult[],
	womensResults: DivisionResult[]
): {
	payouts: PayoutResult[];
	franchisePayouts: FranchisePayoutSummary[];
	summary: {
		totalPurse: number;
		franchiseCut: number;
		proCut: number;
		mensPurse: number;
		womensPurse: number;
		totalPaid: number;
	};
} {
	const payouts = calculateTournamentPayouts(config, mensResults, womensResults);
	const franchisePayouts = calculateFranchisePayouts(config.tournamentId, payouts);

	const { franchiseCut, proCut } = calculateFranchisePayout(
		config.totalPurse,
		config.franchiseCutPercentage
	);

	const totalPaid = payouts.reduce((sum, p) => sum + p.totalEarnings, 0);

	return {
		payouts,
		franchisePayouts,
		summary: {
			totalPurse: config.totalPurse,
			franchiseCut,
			proCut,
			mensPurse: proCut / 2,
			womensPurse: proCut / 2,
			totalPaid
		}
	};
}
