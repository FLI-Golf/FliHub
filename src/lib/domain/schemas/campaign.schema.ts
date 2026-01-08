import { z } from 'zod';

export const CampaignTypeEnum = z.enum([
	'Marketing',
	'Sales',
	'Product Launch',
	'Brand Awareness',
	'Lead Generation',
	'Customer Retention',
	'Event'
]);

export const CampaignStatusEnum = z.enum(['Planning', 'Active', 'Paused', 'Completed', 'Cancelled']);

export const CampaignSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, 'Name is required').max(255),
	description: z.string().optional(),
	type: CampaignTypeEnum,
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	budget: z.number().min(0).optional(),
	actualSpend: z.number().min(0).optional(),
	status: CampaignStatusEnum,
	targetAudience: z.string().max(500).optional(),
	goals: z.string().optional(),
	metrics: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type CampaignInput = z.infer<typeof CampaignSchema>;
export type CampaignType = z.infer<typeof CampaignTypeEnum>;
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;
