import { z } from 'zod';

export const OpportunityStageEnum = z.enum([
	'discovery',
	'qualification',
	'proposal',
	'negotiation',
	'due_diligence',
	'contract',
	'closed_won',
	'closed_lost'
]);

export const FranchiseOpportunitySchema = z.object({
	id: z.string().optional(),
	leadId: z.string().min(1, 'Lead ID is required'),
	opportunityName: z.string().min(1, 'Opportunity name is required').max(255),
	stage: OpportunityStageEnum,
	dealValue: z.number().min(0).default(10000000), // $10M default
	probability: z.number().min(0).max(100).optional(), // % chance of closing
	expectedCloseDate: z.date().optional(),
	territory: z.string().optional(),
	proposalSentDate: z.date().optional(),
	lastContactDate: z.date().optional(),
	nextFollowUpDate: z.date().optional(),
	notes: z.string().optional(),
	assignedTo: z.string().optional(), // user_profile id of sales rep
	projectId: z.string().optional(), // Link to sales project
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FranchiseOpportunityInput = z.infer<typeof FranchiseOpportunitySchema>;
export type OpportunityStage = z.infer<typeof OpportunityStageEnum>;
