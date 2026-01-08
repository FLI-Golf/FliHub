import { z } from 'zod';

export const MarketingGoalCategoryEnum = z.enum([
	'Brand Awareness',
	'Lead Generation',
	'Customer Acquisition',
	'Customer Retention',
	'Revenue Growth',
	'Market Share',
	'Engagement'
]);

export const MarketingGoalStatusEnum = z.enum([
	'Not Started',
	'In Progress',
	'On Track',
	'At Risk',
	'Achieved',
	'Missed'
]);

export const MarketingGoalPriorityEnum = z.enum(['High', 'Medium', 'Low']);

export const MarketingGoalSchema = z.object({
	id: z.string().optional(),
	goalName: z.string().min(1, 'Goal name is required').max(255),
	description: z.string().optional(),
	category: MarketingGoalCategoryEnum,
	targetMetric: z.string().max(255).optional(),
	targetValue: z.number().optional(),
	currentValue: z.number().optional(),
	deadline: z.date().optional(),
	status: MarketingGoalStatusEnum,
	priority: MarketingGoalPriorityEnum.optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type MarketingGoalInput = z.infer<typeof MarketingGoalSchema>;
export type MarketingGoalCategory = z.infer<typeof MarketingGoalCategoryEnum>;
export type MarketingGoalStatus = z.infer<typeof MarketingGoalStatusEnum>;
export type MarketingGoalPriority = z.infer<typeof MarketingGoalPriorityEnum>;
