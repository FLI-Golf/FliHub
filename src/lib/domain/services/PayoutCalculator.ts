/**
 * Payout Calculator Service
 *
 * Handles tournament payout calculations with:
 * - Progressive prize pools (last tournament worth most)
 * - Top-heavy distribution (top 3 get majority)
 * - Gender equality (same payouts for men and women)
 * - Franchise-first distribution model
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonConfig {
	year: number;
	/** Total prize money allocated for the entire season */
	totalSeasonBudget: number;
	numberOfTournaments: number;
	/** Percentage of each tournament purse that goes to franchises (default 20) */
	franchiseCutPercentage: number;
	/** Number of paid placements per division (default 20) */
	numberOfPlacements: number;
}

export interface PayoutStructure {
	totalPurse: number;
	franchiseCut: number;
	proCut: number;
	placements: PlacementPayout[];
}

export interface PlacementPayout {
	placement: number;
	percentage: number;
	/** Amount paid to the pro (after franchise cut) */
	amount: number;
	/** Franchise cut on this placement's earnings */
	franchiseAmount: number;
	/** Total payout (pro + franchise) for this placement */
	totalAmount: number;
}

export interface TournamentPurse {
	tournamentNumber: number;
	totalPurse: number;
	mensPurse: number;
	womensPurse: number;
}

// ---------------------------------------------------------------------------
// Season purse distribution
// ---------------------------------------------------------------------------

/**
 * Distribute a season budget across tournaments using arithmetic progression.
 * Tournament #1 gets the smallest share; the final tournament gets the largest.
 */
export function calculateSeasonPurses(
	totalSeasonPurse: number,
	numberOfTournaments: number
): TournamentPurse[] {
	const step = 0.1;
	const baseMultiplier = 1.0 - (step * (numberOfTournaments - 1)) / 2;

	const multipliers: number[] = [];
	for (let i = 0; i < numberOfTournaments; i++) {
		multipliers.push(baseMultiplier + step * i);
	}

	const sum = multipliers.reduce((a, b) => a + b, 0);

	return multipliers.map((multiplier, index) => {
		const tournamentPurse = totalSeasonPurse * (multiplier / sum);
		return {
			tournamentNumber: index + 1,
			totalPurse: tournamentPurse,
			mensPurse: tournamentPurse / 2,
			womensPurse: tournamentPurse / 2
		};
	});
}

// ---------------------------------------------------------------------------
// Placement payout distribution
// ---------------------------------------------------------------------------

/**
 * Calculate per-placement payouts for a single division purse.
 * Top 3 receive 65% combined; the remaining 35% decays exponentially.
 * Each placement includes both the pro amount and the franchise cut.
 */
export function calculatePlacementPayouts(
	divisionPurse: number,
	numberOfPlacements: number = 20,
	franchiseCutPercentage: number = 20
): PlacementPayout[] {
	const percentages: number[] = [];

	percentages[0] = 30.0;
	percentages[1] = 20.0;
	percentages[2] = 15.0;

	const remainingPercentage = 35.0;
	const remainingPlaces = numberOfPlacements - 3;

	let decaySum = 0;
	for (let i = 0; i < remainingPlaces; i++) {
		decaySum += Math.pow(0.85, i);
	}

	for (let i = 0; i < remainingPlaces; i++) {
		percentages[i + 3] = (Math.pow(0.85, i) / decaySum) * remainingPercentage;
	}

	return percentages.map((percentage, index) => {
		const totalAmount = (divisionPurse * percentage) / 100;
		const franchiseAmount = totalAmount * (franchiseCutPercentage / 100);
		const proAmount = totalAmount - franchiseAmount;
		return {
			placement: index + 1,
			percentage,
			amount: proAmount,
			franchiseAmount,
			totalAmount
		};
	});
}

// ---------------------------------------------------------------------------
// Franchise cut helper
// ---------------------------------------------------------------------------

export function calculateFranchisePayout(
	totalPurse: number,
	franchiseCutPercentage: number = 20
): { franchiseCut: number; proCut: number } {
	const franchiseCut = totalPurse * (franchiseCutPercentage / 100);
	return { franchiseCut, proCut: totalPurse - franchiseCut };
}

// ---------------------------------------------------------------------------
// Full tournament payout structure
// ---------------------------------------------------------------------------

export function getTournamentPayoutStructure(
	tournamentPurse: number,
	franchiseCutPercentage: number = 20,
	numberOfPlacements: number = 20
): PayoutStructure {
	const { franchiseCut, proCut } = calculateFranchisePayout(
		tournamentPurse,
		franchiseCutPercentage
	);

	const divisionPurse = proCut / 2;
	const placements = calculatePlacementPayouts(divisionPurse, numberOfPlacements, franchiseCutPercentage);

	return {
		totalPurse: tournamentPurse,
		franchiseCut,
		proCut,
		placements
	};
}

// ---------------------------------------------------------------------------
// Season configurations
// ---------------------------------------------------------------------------

export function getSeasonPurses(config: SeasonConfig): TournamentPurse[] {
	return calculateSeasonPurses(config.totalSeasonBudget, config.numberOfTournaments);
}

/** Build a SeasonConfig from a seasons collection record. */
export function seasonConfigFromRecord(record: {
	year: number;
	totalBudget: number;
	numberOfTournaments: number;
	franchiseCutPercentage?: number;
	numberOfPlacements?: number;
}): SeasonConfig {
	return {
		year: record.year,
		totalSeasonBudget: record.totalBudget,
		numberOfTournaments: record.numberOfTournaments,
		franchiseCutPercentage: record.franchiseCutPercentage ?? 20,
		numberOfPlacements: record.numberOfPlacements ?? 12,
	};
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}


