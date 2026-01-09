import { z } from 'zod';

export const LeadSourceEnum = z.enum([
	'website',
	'referral',
	'event',
	'cold_outreach',
	'partner',
	'social_media',
	'other'
]);

export const LeadStatusEnum = z.enum([
	'new',
	'contacted',
	'qualified',
	'unqualified',
	'converted',
	'lost'
]);

export const FranchiseLeadSchema = z.object({
	id: z.string().optional(),
	firstName: z.string().min(1, 'First name is required').max(255),
	lastName: z.string().min(1, 'Last name is required').max(255),
	email: z.string().email('Valid email is required'),
	phone: z.string().optional(),
	company: z.string().optional(),
	location: z.string().optional(),
	territory: z.string().optional(),
	source: LeadSourceEnum,
	status: LeadStatusEnum,
	netWorth: z.number().min(0).optional(),
	liquidCapital: z.number().min(0).optional(),
	experienceLevel: z.enum(['none', 'some', 'extensive']).optional(),
	
	// Sponsor relationship
	isExistingSponsor: z.boolean().default(false),
	sponsorId: z.string().optional(), // Link to sponsors collection
	sponsorBridgeId: z.string().optional(), // Link to sponsor_franchise_bridge
	
	notes: z.string().optional(),
	assignedTo: z.string().optional(), // user_profile id of sales rep
	qualifiedDate: z.date().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FranchiseLeadInput = z.infer<typeof FranchiseLeadSchema>;
export type LeadSource = z.infer<typeof LeadSourceEnum>;
export type LeadStatus = z.infer<typeof LeadStatusEnum>;
