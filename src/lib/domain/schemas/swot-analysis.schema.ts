import { z } from 'zod';

export const SwotTypeEnum = z.enum(['Strength', 'Weakness', 'Opportunity', 'Threat']);

export const SwotCategoryEnum = z.enum([
	'Market',
	'Product',
	'Operations',
	'Financial',
	'Technology',
	'Human Resources',
	'Brand',
	'Competition'
]);

export const SwotImpactEnum = z.enum(['High', 'Medium', 'Low']);

export const SwotStatusEnum = z.enum([
	'Identified',
	'Under Review',
	'Action Planned',
	'In Progress',
	'Addressed',
	'Monitoring'
]);

export const SwotAnalysisSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Title is required').max(255),
	type: SwotTypeEnum,
	description: z.string().optional(),
	category: SwotCategoryEnum.optional(),
	impact: SwotImpactEnum.optional(),
	actionItems: z.string().optional(),
	status: SwotStatusEnum,
	created: z.date().optional(),
	updated: z.date().optional()
});

export type SwotAnalysisInput = z.infer<typeof SwotAnalysisSchema>;
export type SwotType = z.infer<typeof SwotTypeEnum>;
export type SwotCategory = z.infer<typeof SwotCategoryEnum>;
export type SwotImpact = z.infer<typeof SwotImpactEnum>;
export type SwotStatus = z.infer<typeof SwotStatusEnum>;
