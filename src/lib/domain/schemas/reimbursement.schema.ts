import { z } from 'zod';

export const ClaimStatusEnum = z.enum([
	'draft',        // Being built, not yet submitted
	'submitted',    // Submitted for review
	'under_review', // Admin is reviewing
	'approved',     // Approved, awaiting payment
	'paid',         // Payment sent, reference number assigned
	'rejected'      // Rejected with notes
]);

export const ClaimPaymentMethodEnum = z.enum([
	'bank_transfer', 'check', 'cash', 'paypal', 'zelle', 'other'
]);

export const ItemCategoryEnum = z.enum([
	'travel', 'meals', 'equipment', 'software', 'marketing', 'legal', 'office', 'other'
]);

export const CLAIM_STATUS_LABELS: Record<string, string> = {
	draft:        'Draft',
	submitted:    'Submitted',
	under_review: 'Under Review',
	approved:     'Approved',
	paid:         'Paid',
	rejected:     'Rejected'
};

export const CLAIM_STATUS_COLORS: Record<string, string> = {
	draft:        'bg-slate-700/60 text-slate-300 border-slate-600',
	submitted:    'bg-blue-900/50 text-blue-300 border-blue-700',
	under_review: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
	approved:     'bg-emerald-900/50 text-emerald-300 border-emerald-700',
	paid:         'bg-green-900/50 text-green-300 border-green-700',
	rejected:     'bg-red-900/50 text-red-400 border-red-800'
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	bank_transfer: 'Bank Transfer',
	check:         'Check',
	cash:          'Cash',
	paypal:        'PayPal',
	zelle:         'Zelle',
	other:         'Other'
};

export const ITEM_CATEGORY_LABELS: Record<string, string> = {
	travel:    'Travel',
	meals:     'Meals',
	equipment: 'Equipment',
	software:  'Software',
	marketing: 'Marketing',
	legal:     'Legal',
	office:    'Office',
	other:     'Other'
};

export const REIMBURSEMENT_MAX_TOTAL_SETTING_KEY = 'reimbursement_claim_max_total';
export const DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL = 1500;

export const ReimbursementItemSchema = z.object({
	id:          z.string().optional(),
	claim:       z.string().optional(),
	description: z.string().min(1).max(500),
	amount:      z.number().min(0.01),
	date:        z.string().optional(),
	category:    ItemCategoryEnum.optional(),
	vendor:      z.string().max(255).optional(),
	receiptUrl:  z.string().max(500).optional(),
	notes:       z.string().max(1000).optional()
});

export const ReimbursementClaimSchema = z.object({
	id:              z.string().optional(),
	title:           z.string().min(1).max(255),
	claimant:        z.string().optional(),
	status:          ClaimStatusEnum.default('draft'),
	referenceNumber: z.string().max(100).optional(),
	totalAmount:     z.number().min(0).optional(),
	paidDate:        z.string().optional(),
	paidBy:          z.string().optional(),
	paymentMethod:   ClaimPaymentMethodEnum.optional(),
	notes:           z.string().max(2000).optional(),
	reviewNotes:     z.string().max(2000).optional()
});

export type ClaimStatus        = z.infer<typeof ClaimStatusEnum>;
export type ReimbursementClaim = z.infer<typeof ReimbursementClaimSchema>;
export type ReimbursementItem  = z.infer<typeof ReimbursementItemSchema>;

// Pipeline stages visible to claimants
export const CLAIMANT_PIPELINE: ClaimStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'paid'];
