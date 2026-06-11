import { z } from 'zod';

export const BankStatementSchema = z.object({
	id: z.string().optional(),
	user: z.string().min(1, 'User is required'),
	institution_name: z.string().min(1, 'Institution name is required').max(255),
	account_name: z.string().max(255).optional(),
	account_last4: z.string().regex(/^[0-9]{4}$/, 'Last 4 must be exactly 4 digits').optional(),
	statement_date: z.date(),
	statement_period_start: z.date().optional(),
	statement_period_end: z.date().optional(),
	statement_month: z.number().int().min(1).max(12).optional(),
	statement_year: z.number().int().min(2000).max(2100).optional(),
	pdf_file: z.array(z.string()).min(1).max(1),
	uploaded_by: z.string().optional(),
	uploaded_at: z.date().optional(),
	notes: z.string().max(2000).optional(),
	is_archived: z.boolean().default(false),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BankStatementInput = z.infer<typeof BankStatementSchema>;
