import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
	'Executive/Management Staff',
	'Office Staff',
	'Consultants',
	'Commisions',
	'Marketing',
	'Public relations',
	'Legal',
	'Advertising',
	'Tech/App Development',
	'Course Build/Materials',
	'Course Build/Tools',
	'Course Build/Miscellaneous',
	'Office/San Diego',
	'Office/Scottsdale',
	'Production Studio',
	'Warehouse',
	'Utilities',
	'Internal Tech Budget',
	'Hardware',
	'Software',
	'Mobile Data',
	'Expenses/MPO (Male)',
	'Expenses/FPO (Female)',
	'Travel/Airefare',
	'Travel/Lodging',
	'Travel/Auto Rental',
	'Travel/Miscellaneous',
	'E-Commerce/Clothing',
	'E-Commerce/Accesories',
	'E-Commerce/Shoes',
	'E-Commerce/Bags',
	'Docunentary',
	'Office Upgrades',
	'Arizona/Warehouse',
	'League Insurance',
	'Payroll Processing Fees',
	'Employee Relocation',
	'Employee Insurance',
	'Reserves'
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
	amount: z.number().min(0, 'Amount must be 0 or greater'),
	category: ExpenseCategoryEnum,
	status: ExpenseStatusEnum,
	date: z.date(),
	receipt: z.array(z.string()).optional(), // File field for receipts (max 99 files)
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
