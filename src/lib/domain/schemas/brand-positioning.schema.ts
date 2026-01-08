import { z } from 'zod';

export const BrandPositioningCategoryEnum = z.enum([
	'Mission',
	'Vision',
	'Values',
	'Target Audience',
	'Unique Value Proposition',
	'Brand Personality',
	'Competitive Advantage'
]);

export const BrandPositioningPriorityEnum = z.enum(['High', 'Medium', 'Low']);

export const BrandPositioningStatusEnum = z.enum(['Draft', 'Active', 'Under Review', 'Archived']);

export const BrandPositioningSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, 'Title is required').max(255),
	description: z.string().optional(),
	category: BrandPositioningCategoryEnum,
	priority: BrandPositioningPriorityEnum.optional(),
	status: BrandPositioningStatusEnum,
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BrandPositioningInput = z.infer<typeof BrandPositioningSchema>;
export type BrandPositioningCategory = z.infer<typeof BrandPositioningCategoryEnum>;
export type BrandPositioningPriority = z.infer<typeof BrandPositioningPriorityEnum>;
export type BrandPositioningStatus = z.infer<typeof BrandPositioningStatusEnum>;
