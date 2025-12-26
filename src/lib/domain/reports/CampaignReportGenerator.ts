import type { Campaign } from '../models/Campaign';
import type { Expense } from '../models/Expense';
import type { CampaignProvider } from '../providers/CampaignProvider';
import type { IExpenseRepository } from '../repositories/IExpenseRepository';

export interface CampaignReport {
	campaign: Campaign;
	expenses: Expense[];
	summary: {
		totalExpenses: number;
		expensesByCategory: Record<string, number>;
		expensesByStatus: Record<string, number>;
		variance: number;
		variancePercentage: number;
		budgetUtilization: number;
	};
	timeline: {
		startDate?: Date;
		endDate?: Date;
		daysElapsed: number;
		daysRemaining: number;
		percentComplete: number;
	};
	metadata: {
		generatedAt: Date;
		generatedBy?: string;
		reportType: 'campaign_summary' | 'campaign_detailed' | 'campaign_financial';
	};
}

/**
 * CampaignReportGenerator - Generates various campaign reports
 */
export class CampaignReportGenerator {
	constructor(
		private campaignProvider: CampaignProvider,
		private expenseRepo: IExpenseRepository
	) {}

	/**
	 * Generate comprehensive campaign report
	 */
	async generateCampaignReport(
		campaignId: string,
		options?: {
			includeExpenses?: boolean;
			generatedBy?: string;
		}
	): Promise<CampaignReport> {
		const metrics = await this.campaignProvider.getCampaignPerformanceMetrics(campaignId);
		const campaign = metrics.campaign;

		const expenses = options?.includeExpenses
			? await this.expenseRepo.getByProject(campaignId)
			: [];

		const expensesByCategory: Record<string, number> = {};
		const expensesByStatus: Record<string, number> = {};
		let totalExpenses = 0;

		expenses.forEach(expense => {
			if (expense.isApproved() || expense.isPaid()) {
				totalExpenses += expense.amount;
				expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
			}
			expensesByStatus[expense.status] = (expensesByStatus[expense.status] || 0) + expense.amount;
		});

		const now = new Date();
		const daysElapsed = campaign.startDate
			? Math.max(0, Math.ceil((now.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)))
			: 0;

		const totalDays = campaign.startDate && campaign.endDate
			? Math.ceil((campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0;

		const percentComplete = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

		return {
			campaign,
			expenses,
			summary: {
				totalExpenses,
				expensesByCategory,
				expensesByStatus,
				variance: campaign.getVariance(),
				variancePercentage: campaign.getVariancePercentage(),
				budgetUtilization: metrics.budgetUtilization
			},
			timeline: {
				startDate: campaign.startDate,
				endDate: campaign.endDate,
				daysElapsed,
				daysRemaining: metrics.daysRemaining,
				percentComplete
			},
			metadata: {
				generatedAt: new Date(),
				generatedBy: options?.generatedBy,
				reportType: 'campaign_detailed'
			}
		};
	}

	/**
	 * Generate financial summary report
	 */
	async generateFinancialReport(campaignId: string): Promise<{
		campaign: Campaign;
		financial: {
			forecastedExpenses: number;
			actualExpenses: number;
			variance: number;
			variancePercentage: number;
			remainingBudget: number;
			categoryBreakdown: Array<{
				category: string;
				forecasted: number;
				actual: number;
				variance: number;
			}>;
		};
		metadata: {
			generatedAt: Date;
			reportType: string;
		};
	}> {
		const metrics = await this.campaignProvider.getCampaignPerformanceMetrics(campaignId);
		const campaign = metrics.campaign;
		const expenses = await this.expenseRepo.getByProject(campaignId);

		const actualByCategory: Record<string, number> = {};
		expenses
			.filter(e => e.isApproved() || e.isPaid())
			.forEach(expense => {
				actualByCategory[expense.category] = (actualByCategory[expense.category] || 0) + expense.amount;
			});

		const categoryBreakdown = Object.keys(campaign.expenseCategories || {}).map(category => {
			const forecasted = campaign.getExpenseByCategory(category);
			const actual = actualByCategory[category] || 0;
			return {
				category,
				forecasted,
				actual,
				variance: actual - forecasted
			};
		});

		return {
			campaign,
			financial: {
				forecastedExpenses: campaign.forecastedExpenses || 0,
				actualExpenses: campaign.actualExpenses || 0,
				variance: campaign.getVariance(),
				variancePercentage: campaign.getVariancePercentage(),
				remainingBudget: campaign.getRemainingBudget(),
				categoryBreakdown
			},
			metadata: {
				generatedAt: new Date(),
				reportType: 'campaign_financial'
			}
		};
	}

	/**
	 * Generate manager summary report
	 */
	async generateManagerSummaryReport(managerId: string): Promise<{
		manager: {
			id: string;
			totalCampaigns: number;
			activeCampaigns: number;
		};
		campaigns: Campaign[];
		summary: {
			totalForecasted: number;
			totalActual: number;
			totalVariance: number;
			averageVariance: number;
			campaignsOverBudget: number;
		};
		topVariances: Array<{
			campaign: Campaign;
			variance: number;
			variancePercentage: number;
		}>;
		metadata: {
			generatedAt: Date;
			reportType: string;
		};
	}> {
		const summary = await this.campaignProvider.getCampaignSummary(managerId);
		const campaigns = await this.campaignProvider.getTopCampaignsByVariance(5, managerId);
		const allCampaigns = await this.campaignProvider.getCampaignsByStatus(managerId);

		const topVariances = campaigns.map(campaign => ({
			campaign,
			variance: campaign.getVariance(),
			variancePercentage: campaign.getVariancePercentage()
		}));

		return {
			manager: {
				id: managerId,
				totalCampaigns: summary.totalCampaigns,
				activeCampaigns: summary.activeCampaigns
			},
			campaigns: [
				...allCampaigns.in_progress,
				...allCampaigns.planned,
				...allCampaigns.draft
			],
			summary: {
				totalForecasted: summary.totalForecasted,
				totalActual: summary.totalActual,
				totalVariance: summary.totalVariance,
				averageVariance: summary.averageVariancePercentage,
				campaignsOverBudget: summary.campaignsOverBudget
			},
			topVariances,
			metadata: {
				generatedAt: new Date(),
				reportType: 'manager_summary'
			}
		};
	}

	/**
	 * Generate fiscal year report
	 */
	async generateFiscalYearReport(fiscalYear: string): Promise<{
		fiscalYear: string;
		campaigns: Campaign[];
		summary: {
			totalCampaigns: number;
			totalForecasted: number;
			totalActual: number;
			totalVariance: number;
			byType: Record<string, { count: number; forecasted: number; actual: number }>;
			byStatus: Record<string, number>;
		};
		metadata: {
			generatedAt: Date;
			reportType: string;
		};
	}> {
		const { campaigns, summary } = await this.campaignProvider.getCampaignsByFiscalYear(fiscalYear);

		const byType: Record<string, { count: number; forecasted: number; actual: number }> = {};
		const byStatus: Record<string, number> = {};

		campaigns.forEach(campaign => {
			// By type
			if (!byType[campaign.type]) {
				byType[campaign.type] = { count: 0, forecasted: 0, actual: 0 };
			}
			byType[campaign.type].count++;
			byType[campaign.type].forecasted += campaign.forecastedExpenses || 0;
			byType[campaign.type].actual += campaign.actualExpenses || 0;

			// By status
			byStatus[campaign.status] = (byStatus[campaign.status] || 0) + 1;
		});

		return {
			fiscalYear,
			campaigns,
			summary: {
				totalCampaigns: summary.totalCampaigns,
				totalForecasted: summary.totalForecasted,
				totalActual: summary.totalActual,
				totalVariance: summary.totalVariance,
				byType,
				byStatus
			},
			metadata: {
				generatedAt: new Date(),
				reportType: 'fiscal_year_summary'
			}
		};
	}

	/**
	 * Export report to JSON
	 */
	exportToJSON(report: any): string {
		return JSON.stringify(report, null, 2);
	}

	/**
	 * Export report to CSV (simplified)
	 */
	exportToCSV(campaigns: Campaign[]): string {
		const headers = [
			'Name',
			'Type',
			'Status',
			'Start Date',
			'End Date',
			'Forecasted',
			'Actual',
			'Variance',
			'Variance %'
		];

		const rows = campaigns.map(c => [
			c.name,
			c.type,
			c.status,
			c.startDate?.toISOString().split('T')[0] || '',
			c.endDate?.toISOString().split('T')[0] || '',
			c.forecastedExpenses || 0,
			c.actualExpenses || 0,
			c.getVariance(),
			c.getVariancePercentage().toFixed(2)
		]);

		return [headers, ...rows].map(row => row.join(',')).join('\n');
	}
}
