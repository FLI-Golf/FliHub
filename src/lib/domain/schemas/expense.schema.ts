import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
	// Staff & Personnel
	'staff',
	'executive_management',
	'office_staff',
	'consultants',
	'commissions',
	
	// Marketing & PR
	'marketing',
	'advertising',
	'public_relations',
	
	// Operations
	'legal',
	'tech_app_development',
	'office_overhead',
	'office_upgrades',
	'travel',
	
	// Event & Competition
	'venue',
	'course_buildout',
	'purse_prizes',
	'player_sponsorships',
	
	// General
	'equipment',
	'accommodation',
	'meals',
	'documentary',
	'other'
]);

export const ExpenseStatusEnum = z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid']);

export const PaymentMethodEnum = z.enum([
	'credit_card',
	'debit_card',
	'cash',
	'check',
	'wire_transfer',
	'other'
]);

export const ExpenseSchema = z.object({
	id: z.string().optional(),
	description: z.string().min(1, 'Description is required').max(500),
	amount: z.number().positive('Amount must be greater than 0'),
	category: ExpenseCategoryEnum,
	status: ExpenseStatusEnum,
	date: z.date(),
	receiptUrl: z.string().url().optional(),
	notes: z.string().optional(),
	projectId: z.string().optional(),
	submittedBy: z.string().optional(),
	approvedBy: z.string().optional(),
	vendor: z.string().optional(), // Relation to vendors collection
	paymentMethod: PaymentMethodEnum.optional(),
	paidDate: z.date().optional(),
	reimbursementTo: z.string().max(255).optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;
export type ExpenseStatus = z.infer<typeof ExpenseStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
