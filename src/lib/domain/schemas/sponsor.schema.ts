import { z } from 'zod';

export const SponsorTierEnum = z.enum(['tier_1', 'tier_2', 'tier_3', 'tier_4']);

export const SponsorStatusEnum = z.enum([
	'prospect',
	'negotiating',
	'active',
	'renewed',
	'expired',
	'converted_to_franchise',
	'inactive'
]);

export const SponsorTypeEnum = z.enum([
	'casino',
	'resort',
	'hospitality',
	'entertainment',
	'corporate',
	'other'
]);

// Tier pricing structure by year
export const SPONSOR_TIER_PRICING = {
	tier_1: {
		2025: 7000000,
		2026: 5000000,
		2027: 3000000
	},
	tier_2: {
		2025: 5000000,
		2026: 7000000,
		2027: 9000000
	},
	tier_3: {
		2025: 1000000,
		2026: 1000000,
		2027: 2000000
	},
	tier_4: {
		2025: 1000000,
		2026: 1500000,
		2027: 2000000
	}
} as const;

export const SPONSOR_TIER_LABELS: Record<z.infer<typeof SponsorTierEnum>, string> = {
	tier_1: 'Tier 1 - Premium',
	tier_2: 'Tier 2 - Elite',
	tier_3: 'Tier 3 - Standard',
	tier_4: 'Tier 4 - Growth'
};

export const SPONSOR_TIER_DESCRIPTIONS: Record<z.infer<typeof SponsorTierEnum>, string> = {
	tier_1: 'Premium sponsorship with maximum visibility and exclusive benefits',
	tier_2: 'Elite sponsorship with growing investment and expanding benefits',
	tier_3: 'Standard sponsorship with consistent annual commitment',
	tier_4: 'Growth sponsorship with increasing investment over time'
};

export const SponsorSchema = z.object({
	id: z.string().optional(),
	companyName: z.string().min(1, 'Company name is required').max(255),
	type: SponsorTypeEnum,
	tier: SponsorTierEnum,
	status: SponsorStatusEnum,
	
	// Contact information
	primaryContactName: z.string().optional(),
	primaryContactEmail: z.string().email().optional(),
	primaryContactPhone: z.string().optional(),
	
	// Location
	location: z.string().optional(),
	territory: z.string().optional(),
	
	// Contract details
	contractStartDate: z.date().optional(),
	contractEndDate: z.date().optional(),
	currentYear: z.number().int().min(2025).max(2027).optional(),
	
	// Financial
	annualCommitment: z.number().min(0).optional(),
	totalPaid: z.number().min(0).default(0),
	
	// Franchise conversion tracking
	franchiseInterest: z.boolean().default(false),
	franchiseConversionDate: z.date().optional(),
	franchiseDealId: z.string().optional(), // Link to franchise_deals
	
	// Relationship management
	assignedTo: z.string().optional(), // user_profile id
	notes: z.string().optional(),
	
	created: z.date().optional(),
	updated: z.date().optional()
});

export type SponsorInput = z.infer<typeof SponsorSchema>;
export type SponsorTier = z.infer<typeof SponsorTierEnum>;
export type SponsorStatus = z.infer<typeof SponsorStatusEnum>;
export type SponsorType = z.infer<typeof SponsorTypeEnum>;

// Helper function to get pricing for a tier and year
export function getSponsorPricing(tier: SponsorTier, year: 2025 | 2026 | 2027): number {
	return SPONSOR_TIER_PRICING[tier][year];
}

// Helper function to calculate total 3-year commitment
export function getTotalCommitment(tier: SponsorTier): number {
	return (
		SPONSOR_TIER_PRICING[tier][2025] +
		SPONSOR_TIER_PRICING[tier][2026] +
		SPONSOR_TIER_PRICING[tier][2027]
	);
}
