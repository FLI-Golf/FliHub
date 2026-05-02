import { z } from 'zod';

export const SponsorPaymentTypeEnum = z.enum([
	'initial_deposit',   // First payment to lock in the deal
	'installment',       // Scheduled installment payment
	'annual_fee',        // Full annual fee payment
	'renewal',           // Renewal payment for next contract year
	'bonus',             // Performance or milestone bonus
	'other'
]);

export const SponsorPaymentStatusEnum = z.enum([
	'scheduled',   // Payment is expected on a future date
	'invoiced',    // Invoice sent, awaiting payment
	'received',    // Money in the bank
	'overdue',     // Past due date, not yet received
	'cancelled',   // Payment cancelled / waived
	'refunded'     // Payment was returned
]);

export const SponsorPaymentSchema = z.object({
	id: z.string().optional(),
	sponsor: z.string().min(1, 'Sponsor is required'),          // relation → sponsors
	amount: z.number().min(0, 'Amount must be positive'),
	paymentType: SponsorPaymentTypeEnum,
	status: SponsorPaymentStatusEnum.default('scheduled'),
	dueDate: z.string().optional(),        // ISO date string — when payment is expected
	receivedDate: z.string().optional(),   // ISO date string — when money actually arrived
	year: z.number().int().min(2026).max(2030).optional(),  // contract year this applies to
	invoiceNumber: z.string().optional(),
	notes: z.string().optional(),
	recordedBy: z.string().optional(),     // relation → user_profiles
	created: z.string().optional(),
	updated: z.string().optional()
});

export type SponsorPaymentInput = z.infer<typeof SponsorPaymentSchema>;
export type SponsorPaymentType = z.infer<typeof SponsorPaymentTypeEnum>;
export type SponsorPaymentStatus = z.infer<typeof SponsorPaymentStatusEnum>;

export const PAYMENT_TYPE_LABELS: Record<SponsorPaymentType, string> = {
	initial_deposit: 'Initial Deposit',
	installment:     'Installment',
	annual_fee:      'Annual Fee',
	renewal:         'Renewal',
	bonus:           'Bonus',
	other:           'Other'
};

export const PAYMENT_STATUS_LABELS: Record<SponsorPaymentStatus, string> = {
	scheduled: 'Scheduled',
	invoiced:  'Invoiced',
	received:  'Received',
	overdue:   'Overdue',
	cancelled: 'Cancelled',
	refunded:  'Refunded'
};

export const PAYMENT_STATUS_COLORS: Record<SponsorPaymentStatus, string> = {
	scheduled: 'bg-slate-700/60 text-slate-300 border-slate-600',
	invoiced:  'bg-blue-900/50 text-blue-300 border-blue-700',
	received:  'bg-emerald-900/50 text-emerald-300 border-emerald-700',
	overdue:   'bg-red-900/50 text-red-300 border-red-700',
	cancelled: 'bg-slate-700/40 text-slate-500 border-slate-600',
	refunded:  'bg-yellow-900/50 text-yellow-300 border-yellow-700'
};
