import { z } from 'zod';

export const QuarterEnum = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);

export const BudgetSchema = z.object({
	id: z.string().optional(),
	departmentArea: z.string().min(1, 'Department area is required').max(255),
	fiscalYear: z.number().min(2020).max(2100),
	quarter: QuarterEnum.optional(),
	allocatedAmount: z.number().min(0),
	spentAmount: z.number().min(0).optional(),
	remainingAmount: z.number().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BudgetInput = z.infer<typeof BudgetSchema>;
export type Quarter = z.infer<typeof QuarterEnum>;
