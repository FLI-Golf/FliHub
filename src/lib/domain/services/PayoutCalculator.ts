/**
 * Payout Calculator Service
 * 
 * Handles tournament payout calculations with:
 * - Progressive prize pools (last tournament worth most)
 * - Top-heavy distribution (top 3 get majority)
 * - Gender equality (same payouts for men and women)
 * - Franchise-first distribution model
 */

export interface PayoutStructure {
	totalPurse: number;
	franchiseCut: number; // Percentage to franchises
	proCut: number; // Percentage to pros
	placements: PlacementPayout[];
}

export interface PlacementPayout {
	placement: number;
	percentage: number;
	amount: number;
}

export interface TournamentPurse {
	tournamentNumber: number;
	totalPurse: number;
	mensPurse: number;
	womensPurse: number;
}

/**
 * Calculate progressive tournament purses for a season
 * Last tournament is worth the most, scaling progressively
 */
export function calculateSeasonPurses(
	totalSeasonPurse: number,
	numberOfTournaments: number
): TournamentPurse[] {
	// Progressive multipliers - last tournament worth most
	// Using arithmetic progression where last is ~1.5x first
	const multipliers: number[] = [];
	const step = 0.1; // Each tournament increases by 10%
	const baseMultiplier = 1.0 - (step * (numberOfTournaments - 1)) / 2;

	for (let i = 0; i < numberOfTournaments; i++) {
		multipliers.push(baseMultiplier + step * i);
	}

	// Normalize multipliers to sum to totalSeasonPurse
	const sum = multipliers.reduce((a, b) => a + b, 0);
	const normalizedMultipliers = multipliers.map((m) => m / sum);

	return normalizedMultipliers.map((multiplier, index) => {
		const tournamentPurse = totalSeasonPurse * multiplier;
		// Split equally between men and women
		return {
			tournamentNumber: index + 1,
			totalPurse: tournamentPurse,
			mensPurse: tournamentPurse / 2,
			womensPurse: tournamentPurse / 2
		};
	});
}

/**
 * Calculate placement payouts with top-heavy distribution
 * Top 3 get majority of purse, then spreads to remaining placements
 */
export function calculatePlacementPayouts(
	divisionPurse: number,
	numberOfPlacements: number = 20
): PlacementPayout[] {
	// Top-heavy percentage distribution
	// 1st: 30%, 2nd: 20%, 3rd: 15%, then decreasing
	const percentages: number[] = [];

	// Top 3 get 65% total
	percentages[0] = 30.0; // 1st place
	percentages[1] = 20.0; // 2nd place
	percentages[2] = 15.0; // 3rd place

	// Remaining 35% distributed across places 4-20
	// Using exponential decay for remaining places
	const remainingPercentage = 35.0;
	const remainingPlaces = numberOfPlacements - 3;

	// Calculate decay factor
	let decaySum = 0;
	for (let i = 0; i < remainingPlaces; i++) {
		decaySum += Math.pow(0.85, i); // 15% decay per place
	}

	// Distribute remaining percentage
	for (let i = 0; i < remainingPlaces; i++) {
		const decayFactor = Math.pow(0.85, i);
		percentages[i + 3] = (decayFactor / decaySum) * remainingPercentage;
	}

	// Convert to amounts
	return percentages.map((percentage, index) => ({
		placement: index + 1,
		percentage: percentage,
		amount: (divisionPurse * percentage) / 100
	}));
}

/**
 * Calculate franchise payout based on pro performance
 * Franchises get a cut before distribution to pros
 */
export function calculateFranchisePayout(
	totalPurse: number,
	franchiseCutPercentage: number = 20
): { franchiseCut: number; proCut: number } {
	const franchiseCut = totalPurse * (franchiseCutPercentage / 100);
	const proCut = totalPurse - franchiseCut;

	return {
		franchiseCut,
		proCut
	};
}

/**
 * Get complete payout structure for a tournament
 */
export function getTournamentPayoutStructure(
	tournamentPurse: number,
	franchiseCutPercentage: number = 20,
	numberOfPlacements: number = 20
): PayoutStructure {
	const { franchiseCut, proCut } = calculateFranchisePayout(
		tournamentPurse,
		franchiseCutPercentage
	);

	// Split pro cut equally between men and women
	const divisionPurse = proCut / 2;

	const placements = calculatePlacementPayouts(divisionPurse, numberOfPlacements);

	return {
		totalPurse: tournamentPurse,
		franchiseCut,
		proCut,
		placements
	};
}

/**
 * 2027 Season Configuration
 * $4M total purse across 6 tournaments
 */
export const SEASON_2027_CONFIG = {
	year: 2027,
	totalPurse: 4_000_000,
	numberOfTournaments: 6,
	franchiseCutPercentage: 20,
	numberOfPlacements: 20
};

/**
 * Get 2027 season tournament purses
 */
export function get2027SeasonPurses(): TournamentPurse[] {
	return calculateSeasonPurses(
		SEASON_2027_CONFIG.totalPurse,
		SEASON_2027_CONFIG.numberOfTournaments
	);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Example usage and validation
 */
export function validatePayoutStructure(): void {
	const purses = get2027SeasonPurses();

	console.log('2027 Season Payout Structure');
	console.log('============================\n');

	let totalValidation = 0;

	purses.forEach((purse) => {
		console.log(`Tournament ${purse.tournamentNumber}:`);
		console.log(`  Total: ${formatCurrency(purse.totalPurse)}`);
		console.log(`  Men's Division: ${formatCurrency(purse.mensPurse)}`);
		console.log(`  Women's Division: ${formatCurrency(purse.womensPurse)}`);

		const structure = getTournamentPayoutStructure(purse.totalPurse);
		console.log(`  Franchise Cut (20%): ${formatCurrency(structure.franchiseCut)}`);
		console.log(`  Pro Cut (80%): ${formatCurrency(structure.proCut)}`);
		console.log(`  Top 3 Combined: ${formatCurrency(structure.placements.slice(0, 3).reduce((sum, p) => sum + p.amount, 0) * 2)}`);
		console.log('');

		totalValidation += purse.totalPurse;
	});

	console.log(`Total Season Purse: ${formatCurrency(totalValidation)}`);
	console.log(
		`Validation: ${totalValidation === SEASON_2027_CONFIG.totalPurse ? '✅ PASS' : '❌ FAIL'}`
	);
}
