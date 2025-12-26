import { z } from 'zod';

// Brand Positioning
export const BrandPositioningSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	positioningId: z.string().optional(),
	keyDifferentiator: z.string().optional(),
	brandMessage: z.string().optional(),
	coreValues: z.string().optional(),
	targetAudience: z.string().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// Budget
export const BudgetSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	budgetId: z.string().optional(),
	departmentArea: z.string().optional(),
	allocatedBudget: z.number().nonnegative().optional(),
	spentBudget: z.number().nonnegative().optional(),
	remainingBudget: z.number().nonnegative().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
}).refine(
	(data) => {
		if (data.allocatedBudget !== undefined && data.spentBudget !== undefined) {
			return data.spentBudget <= data.allocatedBudget;
		}
		return true;
	},
	{
		message: 'Spent budget cannot exceed allocated budget',
		path: ['spentBudget']
	}
);

// Business Objectives
export const PriorityLevelEnum = z.enum(['High', 'Medium', 'Low']);
export const ObjectiveStatusEnum = z.enum(['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled']);

export const BusinessObjectiveSchema = z.object({
	id: z.string().uuid().optional(),
	objectiveName: z.string().min(1, 'Objective name is required'),
	objectId: z.string().optional(),
	priorityLevel: PriorityLevelEnum.optional(),
	status: ObjectiveStatusEnum,
	targetDate: z.date().optional(),
	responsiblePerson: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// Campaign
export const CampaignSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Campaign name is required'),
	campaignId: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
}).refine(
	(data) => {
		if (data.startDate && data.endDate) {
			return data.startDate <= data.endDate;
		}
		return true;
	},
	{
		message: 'Start date must be before or equal to end date',
		path: ['endDate']
	}
);

// Continuous Improvement
export const ImprovementStatusEnum = z.enum(['Identified', 'In Progress', 'Implemented', 'Monitoring']);

export const ContinuousImprovementSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	improvementId: z.string().optional(),
	areaOfImprovement: z.string().optional(),
	actionPlan: z.string().optional(),
	responsiblePerson: z.string().optional(),
	status: ImprovementStatusEnum.optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// Digital Marketing Strategy
export const ChannelEnum = z.enum([
	'Social Media',
	'Email',
	'SEO',
	'PPC',
	'Content Marketing',
	'Influencer Marketing',
	'Affiliate Marketing',
	'Display Advertising',
	'Video Marketing',
	'Other'
]);

export const DigitalMarketingStrategySchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	strategyId: z.string().optional(),
	channel: ChannelEnum.optional(),
	description: z.string().optional(),
	budgetAllocated: z.number().nonnegative().optional(),
	status: ObjectiveStatusEnum.optional(),
	responsiblePerson: z.string().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// Marketing Goals and Objectives
export const MarketingGoalSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	goalId: z.string().optional(),
	descriptionOfGoal: z.string().optional(),
	smartCriteria: z.string().optional(),
	status: ObjectiveStatusEnum.optional(),
	dueDate: z.date().optional(),
	responsiblePerson: z.string().optional(),
	marketingMix: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// SWOT Analysis
export const SWOTCategoryEnum = z.enum(['Strength', 'Weakness', 'Opportunity', 'Threat']);
export const ImpactLevelEnum = z.enum(['High', 'Medium', 'Low']);

export const SWOTAnalysisSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	swotId: z.string().optional(),
	category: SWOTCategoryEnum,
	description: z.string().optional(),
	impactLevel: ImpactLevelEnum.optional(),
	actionPlan: z.string().optional(),
	responsiblePerson: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

// KPI / Measurement
export const AnalysisFrequencyEnum = z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually']);

export const KPISchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().min(1, 'Name is required'),
	kpiId: z.string().optional(),
	kpiDescription: z.string().optional(),
	targetValue: z.string().optional(),
	currentValue: z.string().optional(),
	analysisFrequency: AnalysisFrequencyEnum.optional(),
	responsiblePerson: z.string().optional(),
	notes: z.string().optional(),
	created: z.date().optional(),
	updated: z.date().optional()
});

export type BrandPositioningInput = z.infer<typeof BrandPositioningSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type BusinessObjectiveInput = z.infer<typeof BusinessObjectiveSchema>;
export type CampaignInput = z.infer<typeof CampaignSchema>;
export type ContinuousImprovementInput = z.infer<typeof ContinuousImprovementSchema>;
export type DigitalMarketingStrategyInput = z.infer<typeof DigitalMarketingStrategySchema>;
export type MarketingGoalInput = z.infer<typeof MarketingGoalSchema>;
export type SWOTAnalysisInput = z.infer<typeof SWOTAnalysisSchema>;
export type KPIInput = z.infer<typeof KPISchema>;
