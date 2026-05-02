import { z } from 'zod';

// ─── Sponsor pipeline stages ─────────────────────────────────────────────────
// Standard sponsorship funnel. Order matters — left to right.
export const SponsorStatusEnum = z.enum([
	'prospect',
	'outreach',
	'negotiating',
	'contracted',
	'active',
	'renewed',
	'expired',
	'converted_to_franchise',
	'lost'
]);

export const PIPELINE_STAGES = [
	'prospect',
	'outreach',
	'negotiating',
	'contracted',
	'active',
	'renewed'
] as const;

export const CLOSED_STAGES = ['expired', 'converted_to_franchise', 'lost'] as const;

// ─── Franchise acquisition track ─────────────────────────────────────────────
// A sponsor can run this track in parallel with their sponsorship — they don't
// need to leave the sponsor pipeline to pursue franchise ownership.
export const FranchiseTrackStatusEnum = z.enum([
	'franchise_interest',   // Sponsor has flagged interest in owning a franchise
	'discovery_call',       // Initial franchise discovery conversation scheduled/done
	'loi_signed',           // Letter of Intent signed
	'due_diligence',        // Financial/legal review underway
	'contract',             // Franchise agreement being drafted/reviewed
	'closed'                // Franchise deal closed — now a franchise owner
]);

export const FRANCHISE_TRACK_STAGES = [
	'franchise_interest',
	'discovery_call',
	'loi_signed',
	'due_diligence',
	'contract',
	'closed'
] as const;

export const FRANCHISE_TRACK_LABELS: Record<string, string> = {
	franchise_interest: 'Franchise Interest',
	discovery_call:     'Discovery Call',
	loi_signed:         'LOI Signed',
	due_diligence:      'Due Diligence',
	contract:           'Contract',
	closed:             'Closed'
};

export const FRANCHISE_TRACK_COLORS: Record<string, string> = {
	franchise_interest: 'bg-violet-900/50 text-violet-300 border-violet-700',
	discovery_call:     'bg-blue-900/50 text-blue-300 border-blue-700',
	loi_signed:         'bg-cyan-900/50 text-cyan-300 border-cyan-700',
	due_diligence:      'bg-yellow-900/50 text-yellow-300 border-yellow-700',
	contract:           'bg-orange-900/50 text-orange-300 border-orange-700',
	closed:             'bg-emerald-900/50 text-emerald-300 border-emerald-700'
};

export const SponsorTierEnum = z.enum(['tier_1', 'tier_2', 'tier_3', 'tier_4']);

export const SponsorTypeEnum = z.enum([
	'casino', 'resort', 'hospitality', 'entertainment',
	'corporate', 'media', 'technology', 'financial', 'other'
]);

export const SPONSOR_TIER_PRICING = {
	tier_1: { 2026: 7_000_000, 2027: 5_000_000, 2028: 3_000_000 },
	tier_2: { 2026: 5_000_000, 2027: 7_000_000, 2028: 9_000_000 },
	tier_3: { 2026: 1_000_000, 2027: 1_000_000, 2028: 2_000_000 },
	tier_4: { 2026: 1_000_000, 2027: 1_500_000, 2028: 2_000_000 }
} as const;

export const SPONSOR_TIER_LABELS: Record<string, string> = {
	tier_1: 'Tier 1 — Premium',
	tier_2: 'Tier 2 — Elite',
	tier_3: 'Tier 3 — Standard',
	tier_4: 'Tier 4 — Growth'
};

export const SPONSOR_TIER_COLORS: Record<string, string> = {
	tier_1: 'bg-purple-900/50 text-purple-300 border-purple-700',
	tier_2: 'bg-blue-900/50 text-blue-300 border-blue-700',
	tier_3: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
	tier_4: 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
};

export const SPONSOR_STATUS_COLORS: Record<string, string> = {
	prospect:               'bg-slate-700/60 text-slate-300 border-slate-600',
	outreach:               'bg-cyan-900/50 text-cyan-300 border-cyan-700',
	negotiating:            'bg-yellow-900/50 text-yellow-300 border-yellow-700',
	contracted:             'bg-blue-900/50 text-blue-300 border-blue-700',
	active:                 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
	renewed:                'bg-green-900/50 text-green-300 border-green-700',
	expired:                'bg-slate-700/40 text-slate-500 border-slate-600',
	converted_to_franchise: 'bg-violet-900/50 text-violet-300 border-violet-700',
	lost:                   'bg-red-900/50 text-red-400 border-red-800'
};

export const SPONSOR_STATUS_LABELS: Record<string, string> = {
	prospect:               'Prospect',
	outreach:               'Outreach',
	negotiating:            'Negotiating',
	contracted:             'Contracted',
	active:                 'Active',
	renewed:                'Renewed',
	expired:                'Expired',
	converted_to_franchise: 'Converted → Franchise',
	lost:                   'Lost'
};

export const SponsorSchema = z.object({
	id: z.string().optional(),
	companyName: z.string().min(1, 'Company name is required').max(255),
	type: SponsorTypeEnum,
	tier: SponsorTierEnum,
	status: SponsorStatusEnum,
	primaryContactName:  z.string().optional(),
	primaryContactEmail: z.string().optional(),
	primaryContactPhone: z.string().optional(),
	location:  z.string().optional(),
	territory: z.string().optional(),
	contractStartDate: z.string().optional(),
	contractEndDate:   z.string().optional(),
	currentYear: z.number().int().min(2026).max(2028).optional(),
	annualCommitment: z.number().min(0).optional(),
	totalPaid: z.number().min(0).default(0),
	lastContactDate:  z.string().optional(),
	nextFollowUpDate: z.string().optional(),
	dealProbability:  z.number().min(0).max(100).optional(),
	franchiseInterest:       z.boolean().default(false),
	franchiseTrackStatus:    FranchiseTrackStatusEnum.optional(), // set when franchiseInterest = true
	franchiseTrackDate:      z.string().optional(),               // date entered current franchise track stage
	franchiseConversionDate: z.string().optional(),
	franchiseDealId:         z.string().optional(),
	assignedTo: z.string().optional(),
	notes: z.string().optional(),
	created: z.string().optional(),
	updated: z.string().optional()
});

export type SponsorInput          = z.infer<typeof SponsorSchema>;
export type SponsorTier           = z.infer<typeof SponsorTierEnum>;
export type SponsorStatus         = z.infer<typeof SponsorStatusEnum>;
export type SponsorType           = z.infer<typeof SponsorTypeEnum>;
export type FranchiseTrackStatus  = z.infer<typeof FranchiseTrackStatusEnum>;

export function getSponsorPricing(tier: SponsorTier, year: 2026 | 2027 | 2028): number {
	return SPONSOR_TIER_PRICING[tier][year];
}

export function getTotalCommitment(tier: SponsorTier): number {
	const p = SPONSOR_TIER_PRICING[tier];
	return p[2026] + p[2027] + p[2028];
}

export function isActivePayer(status: string): boolean {
	return status === 'active' || status === 'renewed' || status === 'contracted';
}
