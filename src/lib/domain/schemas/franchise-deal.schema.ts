import { z } from 'zod';

export const DealStatusEnum = z.enum([
	'pending_signature',
	'signed',
	'payment_pending',
	'payment_in_progress',
	'payment_completed',
	'onboarding',
	'active',
	'cancelled',
	'defaulted'
]);

export const PaymentMilestoneSchema = z.object({
	milestoneNumber: z.number().min(1),
	description: z.string().optional(),
	amountDue: z.number().min(0),
	dueDate: z.date().optional(),
	amountPaid: z.number().min(0).default(0),
	paidDate: z.date().optional(),
	status: z.enum(['pending', 'partial', 'paid', 'overdue']).default('pending'),
	notes: z.string().optional()
});

export const FranchiseDealSchema = z.object({
	id: z.string().optional(),
	opportunityId: z.string().min(1, 'Opportunity ID is required'),
	dealNumber: z.string().optional(), // Auto-generated deal number
	franchiseOwnerName: z.string().min(1, 'Franchise owner name is required').max(255),
	territory: z.string().min(1, 'Territory is required'),
	
	// Financial Structure
	totalFranchiseValue: z.number().min(0).default(10000000), // Total worth of franchise
	sponsorshipDiscount: z.number().min(0).default(0), // Discount from prior sponsorship
	negotiatedValue: z.number().min(0).optional(), // Final negotiated value (if different)
	netFranchiseValue: z.number().min(0).default(10000000), // After discounts
	
	// Payment Tracking
	initialPayment: z.number().min(0).default(0), // Down payment
	totalPaidToDate: z.number().min(0).default(0), // Running total
	outstandingBalance: z.number().min(0).default(10000000), // Remaining
	paymentMilestones: z.array(PaymentMilestoneSchema).optional(), // Staged payments
	
	// Legacy fields (deprecated but kept for migration)
	dealValue: z.number().min(0).optional(), // OLD: replaced by totalFranchiseValue
	paymentReceived: z.number().min(0).optional(), // OLD: replaced by totalPaidToDate
	paymentDueDate: z.date().optional(), // OLD: now in milestones
	
	// Contract & Status
	contractSignedDate: z.date().optional(),
	status: DealStatusEnum,
	
	// Relationships
	franchiseOwnerProfileId: z.string().optional(), // Link to user_profile when created
	sponsorBridgeId: z.string().optional(), // Link to sponsor conversion if applicable
	
	// Sales & Commission
	closedBy: z.string().optional(), // user_profile id of sales rep who closed
	commissionPaid: z.boolean().default(false),
	commissionAmount: z.number().min(0).optional(),
	
	// Notes
	notes: z.string().optional(),
	
	created: z.date().optional(),
	updated: z.date().optional()
});

export type FranchiseDealInput = z.infer<typeof FranchiseDealSchema>;
export type DealStatus = z.infer<typeof DealStatusEnum>;
export type PaymentMilestone = z.infer<typeof PaymentMilestoneSchema>;

// Helper function to calculate outstanding balance
export function calculateOutstandingBalance(
	netValue: number,
	totalPaid: number
): number {
	return Math.max(0, netValue - totalPaid);
}

// Helper function to calculate payment progress percentage
export function calculatePaymentProgress(
	netValue: number,
	totalPaid: number
): number {
	if (netValue === 0) return 0;
	return Math.min(100, (totalPaid / netValue) * 100);
}

// Helper to create default payment milestones (5 stages)
export function createDefaultMilestones(totalValue: number): PaymentMilestone[] {
	const milestoneAmount = totalValue / 5;
	return [
		{
			milestoneNumber: 1,
			description: 'Initial Payment (20%)',
			amountDue: milestoneAmount,
			amountPaid: 0,
			status: 'pending' as const
		},
		{
			milestoneNumber: 2,
			description: 'Second Payment (20%)',
			amountDue: milestoneAmount,
			amountPaid: 0,
			status: 'pending' as const
		},
		{
			milestoneNumber: 3,
			description: 'Third Payment (20%)',
			amountDue: milestoneAmount,
			amountPaid: 0,
			status: 'pending' as const
		},
		{
			milestoneNumber: 4,
			description: 'Fourth Payment (20%)',
			amountDue: milestoneAmount,
			amountPaid: 0,
			status: 'pending' as const
		},
		{
			milestoneNumber: 5,
			description: 'Final Payment (20%)',
			amountDue: milestoneAmount,
			amountPaid: 0,
			status: 'pending' as const
		}
	];
}
