import { z } from 'zod';

export const DepartmentEnum = z.enum([
	'Publicist',
	'Sales',
	'Product Development',
	'Finance',
	'Marketing and PR',
	'Technical',
	'Production',
	'Consultant',
	'Operations',
	'Apparel'
]);

export const ManagerSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required').max(255),
	department: DepartmentEnum,
	email: z.string().email().optional().or(z.literal('')),
	phone: z.string().optional(),
	goals: z.string().optional(),
	departmentId: z.string().optional(), // Optional relation to departments collection
	created: z.date().optional(),
	updated: z.date().optional()
});

export type ManagerInput = z.infer<typeof ManagerSchema>;
export type Department = z.infer<typeof DepartmentEnum>;

// Note: department field is kept for backward compatibility
// departmentId can be used when linking to the departments collection
