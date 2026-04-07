import { z } from 'zod';

export const FundingModelSchema = z.object({
	id: z.string().optional(),
	season: z.number().int().min(2024).max(2100),
	label: z.string().min(1).max(255),

	// Tournament expense stack
	tournament_ops_per_event: z.number().min(0).default(0),
	tournament_count: z.number().int().min(0).default(0),
	player_purse: z.number().min(0).default(0),
	player_sponsorship_program: z.number().min(0).default(0),

	// League overhead
	overhead_marketing: z.number().min(0).default(0),
	overhead_staff_payroll: z.number().min(0).default(0),
	overhead_tech_platform: z.number().min(0).default(0),
	overhead_legal_admin: z.number().min(0).default(0),

	// Pre-season revenue streams
	rev_naming_rights: z.number().min(0).default(0),
	rev_league_partners: z.number().min(0).default(0),
	rev_on_course_activation: z.number().min(0).default(0),
	rev_fan_interaction: z.number().min(0).default(0),
	rev_ticket_presales: z.number().min(0).default(0),
	rev_merchandise: z.number().min(0).default(0),
	rev_subscriptions_fantasy: z.number().min(0).default(0),
	rev_licensing_advances: z.number().min(0).default(0),

	// Capital structure
	capital_raise_1: z.number().min(0).default(0),
	capital_raise_2_equity: z.number().min(0).default(0),
	capital_raise_2_debt: z.number().min(0).default(0),

	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FundingModelInput = z.infer<typeof FundingModelSchema>;

// Derived calculations — all computed from raw fields
export function computeFundingModel(m: FundingModelInput) {
	const tournamentOpsTotal = m.tournament_ops_per_event * m.tournament_count;
	const leagueOverhead =
		m.overhead_marketing +
		m.overhead_staff_payroll +
		m.overhead_tech_platform +
		m.overhead_legal_admin;
	const totalCashRequired =
		tournamentOpsTotal + m.player_purse + m.player_sponsorship_program + leagueOverhead;

	const sponsorshipRevenue =
		m.rev_naming_rights +
		m.rev_league_partners +
		m.rev_on_course_activation +
		m.rev_fan_interaction;
	const totalPreSeasonRevenue =
		sponsorshipRevenue +
		m.rev_ticket_presales +
		m.rev_merchandise +
		m.rev_subscriptions_fantasy +
		m.rev_licensing_advances;

	const fundingGap = totalCashRequired - totalPreSeasonRevenue;
	const totalCapitalRaised =
		m.capital_raise_1 + m.capital_raise_2_equity + m.capital_raise_2_debt;
	const capitalCoverage = totalCapitalRaised - fundingGap;

	return {
		tournamentOpsTotal,
		leagueOverhead,
		totalCashRequired,
		sponsorshipRevenue,
		totalPreSeasonRevenue,
		fundingGap,
		totalCapitalRaised,
		capitalCoverage,
		preSeason_pct: totalCashRequired > 0 ? (totalPreSeasonRevenue / totalCashRequired) * 100 : 0
	};
}
