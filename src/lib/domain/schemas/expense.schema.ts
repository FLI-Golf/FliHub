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

// High-level expense categories for league reporting
export const ExpenseHighLevelCategory = {
	'Executive/Management Staff': 'Staff & Personnel',
	'Office Staff': 'Staff & Personnel',
	'Consultants': 'Professional Services',
	'Commisions': 'Sales & Marketing',
	'Marketing': 'Sales & Marketing',
	'Public relations': 'Sales & Marketing',
	'Legal': 'Professional Services',
	'Advertising': 'Sales & Marketing',
	'Tech/App Development': 'Technology',
	'Course Build/Materials': 'Operations',
	'Course Build/Tools': 'Operations',
	'Course Build/Miscellaneous': 'Operations',
	'Office/San Diego': 'Facilities',
	'Office/Scottsdale': 'Facilities',
	'Production Studio': 'Facilities',
	'Warehouse': 'Facilities',
	'Utilities': 'Facilities',
	'Internal Tech Budget': 'Technology',
	'Hardware': 'Technology',
	'Software': 'Technology',
	'Mobile Data': 'Technology',
	'Expenses/MPO (Male)': 'Events & Competition',
	'Expenses/FPO (Female)': 'Events & Competition',
	'Travel/Airefare': 'Travel',
	'Travel/Lodging': 'Travel',
	'Travel/Auto Rental': 'Travel',
	'Travel/Miscellaneous': 'Travel',
	'E-Commerce/Clothing': 'Merchandise',
	'E-Commerce/Accesories': 'Merchandise',
	'E-Commerce/Shoes': 'Merchandise',
	'E-Commerce/Bags': 'Merchandise',
	'Docunentary': 'Media & Production',
	'Office Upgrades': 'Facilities',
	'Arizona/Warehouse': 'Facilities',
	'League Insurance': 'Insurance & Risk',
	'Payroll Processing Fees': 'Staff & Personnel',
	'Employee Relocation': 'Staff & Personnel',
	'Employee Insurance': 'Insurance & Risk',
	'Reserves': 'Reserves'
} as const;

export type HighLevelExpenseCategory = typeof ExpenseHighLevelCategory[keyof typeof ExpenseHighLevelCategory];

// Helper to get high-level category from expense category
export function getHighLevelCategory(category: ExpenseCategory): string {
	return ExpenseHighLevelCategory[category] || 'Other';
}

// Helper to calculate total expenses by high-level category
export function categorizeExpenses(expenses: ExpenseInput[]): Record<string, number> {
	const categorized: Record<string, number> = {};
	
	expenses.forEach(expense => {
		if (expense.status === 'paid' || expense.status === 'approved') {
			const highLevelCat = getHighLevelCategory(expense.category);
			categorized[highLevelCat] = (categorized[highLevelCat] || 0) + expense.amount;
		}
	});
	
	return categorized;
}

// Helper to calculate total expenses
export function calculateTotalExpenses(expenses: ExpenseInput[]): number {
	return expenses
		.filter(e => e.status === 'paid' || e.status === 'approved')
		.reduce((sum, e) => sum + e.amount, 0);
}
