import { z } from 'zod';

export const ContinuousImprovementCategoryEnum = z.enum([
	'Process Improvement',
	'Quality Enhancement',
	'Cost Reduction',
	'Time Efficiency',
	'Customer Experience',
	'Technology Upgrade',
	'Training & Development'
]);

export const ContinuousImprovementStatusEnum = z.enum([
	'Proposed',
	'Under Review',
	'Approved',
	'In Progress',
	'Implemented',
	'Rejected'
]);

export const ContinuousImprovementPriorityEnum = z.enum(['High', 'Medium', 'Low']);

export const ContinuousImprovementSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().optional(),
	category: ContinuousImprovementCategoryEnum,
	currentState: z.string().optional(),
	proposedSolution: z.string().optional(),
	expectedBenefit: z.string().optional(),
	status: ContinuousImprovementStatusEnum,
	implementationDate: z.date().optional(),
	priority: ContinuousImprovementPriorityEnum.optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type ContinuousImprovementInput = z.infer<typeof ContinuousImprovementSchema>;
export type ContinuousImprovementCategory = z.infer<typeof ContinuousImprovementCategoryEnum>;
export type ContinuousImprovementStatus = z.infer<typeof ContinuousImprovementStatusEnum>;
export type ContinuousImprovementPriority = z.infer<typeof ContinuousImprovementPriorityEnum>;
