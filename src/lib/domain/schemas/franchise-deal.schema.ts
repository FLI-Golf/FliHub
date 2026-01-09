import { z } from 'zod';

export const DealStatusEnum = z.enum([
	'pending_signature',
	'signed',
	'payment_pending',
	'payment_received',
	'onboarding',
	'active',
	'cancelled'
]);

export const FranchiseDealSchema = z.object({
	id: z.string().optional(),
	opportunityId: z.string().min(1, 'Opportunity ID is required'),
	dealNumber: z.string().optional(), // Auto-generated deal number
	franchiseOwnerName: z.string().min(1, 'Franchise owner name is required').max(255),
	territory: z.string().min(1, 'Territory is required'),
	dealValue: z.number().min(0).default(10000000), // $10M
	paymentReceived: z.number().min(0).default(0),
	paymentDueDate: z.date().optional(),
	contractSignedDate: z.date().optional(),
	status: DealStatusEnum,
	franchiseOwnerProfileId: z.string().optional(), // Link to user_profile when created
	notes: z.string().optional(),
	closedBy: z.string().optional(), // user_profile id of sales rep who closed
	commissionPaid: z.boolean().default(false),
	commissionAmount: z.number().min(0).optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FranchiseDealInput = z.infer<typeof FranchiseDealSchema>;
export type DealStatus = z.infer<typeof DealStatusEnum>;
