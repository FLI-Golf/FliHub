import { z } from 'zod';

export const DepartmentSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Department name is required').max(255),
	code: z.string().min(1).max(10).optional(),
	description: z.string().optional(),
	annualBudget: z.number().min(0).optional(),
	isActive: z.boolean().optional(),
	headOfDepartment: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type DepartmentInput = z.infer<typeof DepartmentSchema>;
