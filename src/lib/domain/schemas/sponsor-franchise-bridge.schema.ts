import { z } from 'zod';

export const BridgeStatusEnum = z.enum([
	'sponsor_active',
	'interest_expressed',
	'evaluation',
	'negotiation',
	'franchise_deal_pending',
	'converted',
	'declined'
]);

export const SponsorFranchiseBridgeSchema = z.object({
	id: z.string().optional(),
	sponsorId: z.string().min(1, 'Sponsor ID is required'),
	
	// Conversion tracking
	status: BridgeStatusEnum,
	interestExpressedDate: z.date().optional(),
	evaluationStartDate: z.date().optional(),
	
	// Financial bridge
	sponsorshipValueToDate: z.number().min(0).optional(), // Total paid as sponsor
	franchiseDiscount: z.number().min(0).optional(), // Discount offered based on sponsorship
	totalFranchiseValue: z.number().min(0).default(10000000), // Base franchise value
	netFranchiseValue: z.number().min(0).optional(), // After discount
	
	// Legacy field (deprecated)
	franchiseFeeDiscount: z.number().min(0).optional(), // OLD: use franchiseDiscount
	netFranchiseFee: z.number().min(0).optional(), // OLD: use netFranchiseValue
	
	// Franchise details
	franchiseLeadId: z.string().optional(), // Link to franchise_leads
	franchiseOpportunityId: z.string().optional(), // Link to franchise_opportunities
	franchiseDealId: z.string().optional(), // Link to franchise_deals when converted
	
	// Territory
	proposedTerritory: z.string().optional(),
	
	// Timeline
	targetConversionDate: z.date().optional(),
	actualConversionDate: z.date().optional(),
	
	// Relationship management
	assignedSalesRep: z.string().optional(), // user_profile id
	notes: z.string().optional(),
	
	created: z.date().optional(),
	updated: z.date().optional()
});

export type SponsorFranchiseBridgeInput = z.infer<typeof SponsorFranchiseBridgeSchema>;
export type BridgeStatus = z.infer<typeof BridgeStatusEnum>;

export const BRIDGE_STATUS_LABELS: Record<BridgeStatus, string> = {
	sponsor_active: 'Active Sponsor',
	interest_expressed: 'Interest Expressed',
	evaluation: 'Under Evaluation',
	negotiation: 'In Negotiation',
	franchise_deal_pending: 'Deal Pending',
	converted: 'Converted to Franchise',
	declined: 'Declined'
};

// Helper to calculate franchise discount based on sponsorship value
export function calculateFranchiseDiscount(sponsorshipValue: number, baseValue: number = 10000000): number {
	// Discount structure: 10% discount for every $1M in sponsorship (up to 30% max)
	const discountPercentage = Math.min((sponsorshipValue / 1000000) * 10, 30);
	return Math.round((baseValue * discountPercentage) / 100);
}

// Helper to calculate net franchise value after discount
export function calculateNetFranchiseValue(sponsorshipValue: number, baseValue: number = 10000000): number {
	const discount = calculateFranchiseDiscount(sponsorshipValue, baseValue);
	return baseValue - discount;
}

// Legacy function names (deprecated - use new names above)
export const calculateNetFranchiseFee = calculateNetFranchiseValue;
