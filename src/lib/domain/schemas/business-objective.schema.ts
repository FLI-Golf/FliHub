import { z } from 'zod';

export const BusinessObjectiveCategoryEnum = z.enum([
	'Revenue Growth',
	'Market Expansion',
	'Operational Efficiency',
	'Customer Satisfaction',
	'Brand Awareness',
	'Innovation',
	'Sustainability'
]);

export const BusinessObjectiveStatusEnum = z.enum([
	'Not Started',
	'In Progress',
	'On Track',
	'At Risk',
	'Completed',
	'Cancelled'
]);

export const BusinessObjectiveSchema = z.object({
	id: z.string().optional(),
	objective: z.string().min(1, 'Objective is required').max(500),
	description: z.string().optional(),
	category: BusinessObjectiveCategoryEnum,
	targetDate: z.date().optional(),
	status: BusinessObjectiveStatusEnum,
	progress: z.number().min(0).max(100).optional(),
	keyResults: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BusinessObjectiveInput = z.infer<typeof BusinessObjectiveSchema>;
export type BusinessObjectiveCategory = z.infer<typeof BusinessObjectiveCategoryEnum>;
export type BusinessObjectiveStatus = z.infer<typeof BusinessObjectiveStatusEnum>;
