import { z } from 'zod';

export const PartnerTypeEnum = z.enum(['Key Point', 'Supporting Point', 'Risk', 'Opportunity']);
export const PartnerCategoryEnum = z.enum([
	'Broadcasting & Audience Growth',
	'Viewer Engagement',
	'Revenue Opportunities',
	'Technology & Innovation',
	'Brand Building',
	'Operational Efficiency',
	'Risk Management'
]);
export const ImportanceLevelEnum = z.enum(['High', 'Medium', 'Low']);

export const BroadcastPartnerSchema = z.object({
	id: z.string().uuid().optional(),
	point: z.string().min(1, 'Point is required'),
	details: z.string().min(1, 'Details are required'),
	type: PartnerTypeEnum,
	category: PartnerCategoryEnum,
	importanceLevel: ImportanceLevelEnum,
	tags: z.string().optional(),
	additionalNotes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BroadcastPartnerInput = z.infer<typeof BroadcastPartnerSchema>;
export type PartnerType = z.infer<typeof PartnerTypeEnum>;
export type PartnerCategory = z.infer<typeof PartnerCategoryEnum>;
export type ImportanceLevel = z.infer<typeof ImportanceLevelEnum>;
