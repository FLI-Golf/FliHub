import { z } from 'zod';

export const ProjectTypeEnum = z.enum(['tournament', 'activation', 'event', 'campaign']);
export const ProjectStatusEnum = z.enum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']);
export const ApprovalStatusEnum = z.enum(['pending', 'approved', 'rejected', 'revision_requested']);

export const ExpenseCategoriesSchema = z.record(z.string(), z.number().nonnegative());

export const ProjectSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Project name is required').max(255),
	description: z.string().optional(),
	type: ProjectTypeEnum,
	status: ProjectStatusEnum,
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	budget: z.number().min(0).optional(),
	notes: z.string().optional(),
	forecastedExpenses: z.number().min(0).optional(),
	actualExpenses: z.number().min(0).optional(),
	expenseCategories: z.any().optional(), // JSON field
	approvalStatus: ApprovalStatusEnum.optional(),
	fiscalYear: z.string().max(10).optional(),
	approvedBy: z.string().optional(),
	department: z.string().optional(),
	vendors: z.array(z.string()).optional(),
	created: z.date().optional(),
	updated: z.date().optional()
}).refine(
	(data) => {
		if (data.startDate && data.endDate) {
			return data.startDate <= data.endDate;
		}
		return true;
	},
	{
		message: 'Start date must be before or equal to end date',
		path: ['endDate']
	}
);

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type ProjectType = z.infer<typeof ProjectTypeEnum>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;
export type ExpenseCategories = z.infer<typeof ExpenseCategoriesSchema>;
