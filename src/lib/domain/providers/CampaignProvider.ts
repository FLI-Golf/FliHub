import type { Campaign } from '../models/Campaign';
import type { ICampaignRepository } from '../repositories/ICampaignRepository';
import type { IExpenseRepository } from '../repositories/IExpenseRepository';

/**
 * Campaign data aggregation and analytics
 */
export interface CampaignSummary {
	totalCampaigns: number;
	activeCampaigns: number;
	completedCampaigns: number;
	totalForecasted: number;
	totalActual: number;
	totalVariance: number;
	averageVariancePercentage: number;
	campaignsOverBudget: number;
	campaignsUnderBudget: number;
}

export interface CampaignsByStatus {
	draft: Campaign[];
	planned: Campaign[];
	in_progress: Campaign[];
	completed: Campaign[];
	cancelled: Campaign[];
}

/**
 * CampaignProvider - Provides aggregated campaign data
 */
export class CampaignProvider {
	constructor(
		private campaignRepo: ICampaignRepository,
		private expenseRepo: IExpenseRepository
	) {}

	/**
	 * Get campaign summary statistics
	 */
	async getCampaignSummary(managerId?: string): Promise<CampaignSummary> {
		const campaigns = managerId
			? await this.campaignRepo.getByManager(managerId)
			: await this.campaignRepo.getAll();

		const activeCampaigns = campaigns.filter(c => c.isActive()).length;
		const completedCampaigns = campaigns.filter(c => c.isCompleted()).length;

		const totalForecasted = campaigns.reduce((sum, c) => sum + (c.forecastedExpenses || 0), 0);
		const totalActual = campaigns.reduce((sum, c) => sum + (c.actualExpenses || 0), 0);
		const totalVariance = totalActual - totalForecasted;

		const campaignsWithBudget = campaigns.filter(c => c.forecastedExpenses && c.forecastedExpenses > 0);
		const averageVariancePercentage = campaignsWithBudget.length > 0
			? campaignsWithBudget.reduce((sum, c) => sum + c.getVariancePercentage(), 0) / campaignsWithBudget.length
			: 0;

		const campaignsOverBudget = campaigns.filter(c => c.isOverBudget()).length;
		const campaignsUnderBudget = campaigns.filter(c => !c.isOverBudget() && c.actualExpenses && c.actualExpenses > 0).length;

		return {
			totalCampaigns: campaigns.length,
			activeCampaigns,
			completedCampaigns,
			totalForecasted,
			totalActual,
			totalVariance,
			averageVariancePercentage,
			campaignsOverBudget,
			campaignsUnderBudget
		};
	}

	/**
	 * Get campaigns grouped by status
	 */
	async getCampaignsByStatus(managerId?: string): Promise<CampaignsByStatus> {
		const campaigns = managerId
			? await this.campaignRepo.getByManager(managerId)
			: await this.campaignRepo.getAll();

		return {
			draft: campaigns.filter(c => c.status === 'draft'),
			planned: campaigns.filter(c => c.status === 'planned'),
			in_progress: campaigns.filter(c => c.status === 'in_progress'),
			completed: campaigns.filter(c => c.status === 'completed'),
			cancelled: campaigns.filter(c => c.status === 'cancelled')
		};
	}

	/**
	 * Get campaigns by fiscal year with summary
	 */
	async getCampaignsByFiscalYear(fiscalYear: string): Promise<{
		campaigns: Campaign[];
		summary: CampaignSummary;
	}> {
		const campaigns = await this.campaignRepo.getByFiscalYear(fiscalYear);

		const totalForecasted = campaigns.reduce((sum, c) => sum + (c.forecastedExpenses || 0), 0);
		const totalActual = campaigns.reduce((sum, c) => sum + (c.actualExpenses || 0), 0);

		return {
			campaigns,
			summary: {
				totalCampaigns: campaigns.length,
				activeCampaigns: campaigns.filter(c => c.isActive()).length,
				completedCampaigns: campaigns.filter(c => c.isCompleted()).length,
				totalForecasted,
				totalActual,
				totalVariance: totalActual - totalForecasted,
				averageVariancePercentage: campaigns.length > 0
					? campaigns.reduce((sum, c) => sum + c.getVariancePercentage(), 0) / campaigns.length
					: 0,
				campaignsOverBudget: campaigns.filter(c => c.isOverBudget()).length,
				campaignsUnderBudget: campaigns.filter(c => !c.isOverBudget()).length
			}
		};
	}

	/**
	 * Get top campaigns by variance
	 */
	async getTopCampaignsByVariance(limit: number = 10, managerId?: string): Promise<Campaign[]> {
		const campaigns = managerId
			? await this.campaignRepo.getByManager(managerId)
			: await this.campaignRepo.getAll();

		return campaigns
			.filter(c => c.forecastedExpenses && c.actualExpenses)
			.sort((a, b) => Math.abs(b.getVariance()) - Math.abs(a.getVariance()))
			.slice(0, limit);
	}

	/**
	 * Get campaigns needing attention (over budget or pending approval)
	 */
	async getCampaignsNeedingAttention(managerId?: string): Promise<{
		overBudget: Campaign[];
		needingApproval: Campaign[];
		significantVariance: Campaign[];
	}> {
		const campaigns = managerId
			? await this.campaignRepo.getByManager(managerId)
			: await this.campaignRepo.getAll();

		const overBudget = campaigns.filter(c => c.isOverBudget());
		const needingApproval = campaigns.filter(c => c.needsApproval());
		const significantVariance = campaigns.filter(c => 
			!c.isWithinBudgetThreshold(10) && c.actualExpenses && c.actualExpenses > 0
		);

		return {
			overBudget,
			needingApproval,
			significantVariance
		};
	}

	/**
	 * Get expense breakdown across all campaigns
	 */
	async getExpenseBreakdownByCategory(managerId?: string): Promise<Record<string, number>> {
		const campaigns = managerId
			? await this.campaignRepo.getByManager(managerId)
			: await this.campaignRepo.getAll();

		const breakdown: Record<string, number> = {};

		for (const campaign of campaigns) {
			if (campaign.expenseCategories) {
				Object.entries(campaign.expenseCategories).forEach(([category, amount]) => {
					breakdown[category] = (breakdown[category] || 0) + amount;
				});
			}
		}

		return breakdown;
	}

	/**
	 * Get campaign performance metrics
	 */
	async getCampaignPerformanceMetrics(campaignId: string): Promise<{
		campaign: Campaign;
		budgetUtilization: number;
		daysRemaining: number;
		burnRate: number;
		projectedTotal: number;
		onTrack: boolean;
	}> {
		const campaign = await this.campaignRepo.getById(campaignId);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		const budgetUtilization = campaign.forecastedExpenses && campaign.forecastedExpenses > 0
			? (campaign.actualExpenses || 0) / campaign.forecastedExpenses * 100
			: 0;

		const daysRemaining = campaign.endDate
			? Math.max(0, Math.ceil((campaign.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
			: 0;

		const daysSinceStart = campaign.startDate
			? Math.ceil((new Date().getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0;

		const burnRate = daysSinceStart > 0 ? (campaign.actualExpenses || 0) / daysSinceStart : 0;
		const projectedTotal = burnRate * (daysSinceStart + daysRemaining);

		const onTrack = campaign.forecastedExpenses
			? projectedTotal <= campaign.forecastedExpenses * 1.1 // Within 10% threshold
			: true;

		return {
			campaign,
			budgetUtilization,
			daysRemaining,
			burnRate,
			projectedTotal,
			onTrack
		};
	}
}
