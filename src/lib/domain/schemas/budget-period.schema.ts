import { z } from 'zod';

export const BudgetPeriodTypeEnum = z.enum(['fiscal_year', 'quarter', 'month', 'custom']);

export const BudgetPeriodStatusEnum = z.enum(['planning', 'active', 'closed']);

export const BudgetPeriodSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required').max(100),
	type: BudgetPeriodTypeEnum,
	startDate: z.date(),
	endDate: z.date(),
	status: BudgetPeriodStatusEnum,
	totalBudget: z.number().nonnegative().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BudgetPeriodInput = z.infer<typeof BudgetPeriodSchema>;
export type BudgetPeriodType = z.infer<typeof BudgetPeriodTypeEnum>;
export type BudgetPeriodStatus = z.infer<typeof BudgetPeriodStatusEnum>;
