import { z } from 'zod';

export const DigitalMarketingChannelEnum = z.enum([
	'Social Media',
	'Email Marketing',
	'Content Marketing',
	'SEO',
	'PPC',
	'Influencer Marketing',
	'Video Marketing',
	'Affiliate Marketing'
]);

export const DigitalMarketingStatusEnum = z.enum([
	'Planning',
	'Active',
	'Paused',
	'Completed',
	'Archived'
]);

export const DigitalMarketingStrategySchema = z.object({
	id: z.string().optional(),
	strategyName: z.string().min(1, 'Strategy name is required').max(255),
	description: z.string().optional(),
	channel: DigitalMarketingChannelEnum,
	targetAudience: z.string().max(500).optional(),
	objectives: z.string().optional(),
	kpis: z.string().optional(),
	budget: z.number().min(0).optional(),
	status: DigitalMarketingStatusEnum,
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type DigitalMarketingStrategyInput = z.infer<typeof DigitalMarketingStrategySchema>;
export type DigitalMarketingChannel = z.infer<typeof DigitalMarketingChannelEnum>;
export type DigitalMarketingStatus = z.infer<typeof DigitalMarketingStatusEnum>;
