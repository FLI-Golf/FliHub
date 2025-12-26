import type { Campaign } from '../models/Campaign';
import type { ICampaignRepository } from '../repositories/ICampaignRepository';
import type { IExpenseRepository } from '../repositories/IExpenseRepository';
import type { ProjectStatus, ApprovalStatus } from '../schemas';

/**
 * CampaignManager - Business logic for campaign management
 * Handles campaign lifecycle, approvals, and expense tracking
 */
export class CampaignManager {
	constructor(
		private campaignRepo: ICampaignRepository,
		private expenseRepo: IExpenseRepository
	) {}

	/**
	 * Create a new campaign
	 */
	async createCampaign(data: Omit<Campaign, 'id' | 'created' | 'updated'>): Promise<Campaign> {
		// Validate dates
		if (data.startDate && data.endDate && data.startDate > data.endDate) {
			throw new Error('Start date must be before end date');
		}

		// Set initial status
		const campaignData = {
			...data,
			status: data.status || ('draft' as ProjectStatus),
			approvalStatus: 'pending' as ApprovalStatus,
			actualExpenses: 0
		};

		return await this.campaignRepo.create(campaignData);
	}

	/**
	 * Update campaign
	 */
	async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
		const existing = await this.campaignRepo.getById(id);
		if (!existing) {
			throw new Error('Campaign not found');
		}

		return await this.campaignRepo.update(id, data);
	}

	/**
	 * Submit campaign for approval
	 */
	async submitForApproval(id: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		if (!campaign.forecastedExpenses || campaign.forecastedExpenses <= 0) {
			throw new Error('Campaign must have forecasted expenses before submission');
		}

		return await this.campaignRepo.update(id, {
			status: 'planned',
			approvalStatus: 'pending'
		});
	}

	/**
	 * Approve campaign
	 */
	async approveCampaign(id: string, approvedBy: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		if (campaign.approvalStatus === 'approved') {
			throw new Error('Campaign is already approved');
		}

		return await this.campaignRepo.approve(id, approvedBy);
	}

	/**
	 * Reject campaign
	 */
	async rejectCampaign(id: string, approvedBy: string, reason?: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		const updated = await this.campaignRepo.reject(id, approvedBy);
		
		if (reason) {
			await this.campaignRepo.update(id, {
				notes: `${updated.notes || ''}\n\nRejection reason: ${reason}`
			});
		}

		return updated;
	}

	/**
	 * Start campaign (move to in_progress)
	 */
	async startCampaign(id: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		if (!campaign.isApproved()) {
			throw new Error('Campaign must be approved before starting');
		}

		return await this.campaignRepo.update(id, {
			status: 'in_progress'
		});
	}

	/**
	 * Complete campaign
	 */
	async completeCampaign(id: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		// Update actual expenses from all expenses
		const totalExpenses = await this.expenseRepo.getTotalByProject(id);
		
		return await this.campaignRepo.update(id, {
			status: 'completed',
			actualExpenses: totalExpenses
		});
	}

	/**
	 * Cancel campaign
	 */
	async cancelCampaign(id: string, reason?: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		const updated = await this.campaignRepo.update(id, {
			status: 'cancelled'
		});

		if (reason) {
			await this.campaignRepo.update(id, {
				notes: `${updated.notes || ''}\n\nCancellation reason: ${reason}`
			});
		}

		return updated;
	}

	/**
	 * Sync actual expenses from expense records
	 */
	async syncActualExpenses(id: string): Promise<Campaign> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		const expenses = await this.expenseRepo.getByProject(id);
		const approvedExpenses = expenses.filter(e => e.isApproved() || e.isPaid());
		const totalActual = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

		// Update category breakdown
		const categoryBreakdown: Record<string, number> = {};
		approvedExpenses.forEach(expense => {
			categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
		});

		return await this.campaignRepo.update(id, {
			actualExpenses: totalActual
		});
	}

	/**
	 * Get campaigns needing approval
	 */
	async getCampaignsNeedingApproval(): Promise<Campaign[]> {
		return await this.campaignRepo.getNeedingApproval();
	}

	/**
	 * Get campaigns by manager
	 */
	async getCampaignsByManager(managerId: string): Promise<Campaign[]> {
		return await this.campaignRepo.getByManager(managerId);
	}

	/**
	 * Get active campaigns
	 */
	async getActiveCampaigns(): Promise<Campaign[]> {
		return await this.campaignRepo.getActive();
	}

	/**
	 * Get campaign with variance analysis
	 */
	async getCampaignWithAnalysis(id: string): Promise<{
		campaign: Campaign;
		variance: number;
		variancePercentage: number;
		isOverBudget: boolean;
		remainingBudget: number;
	}> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		// Sync latest expenses
		await this.syncActualExpenses(id);
		const updated = await this.campaignRepo.getById(id);
		if (!updated) {
			throw new Error('Campaign not found after sync');
		}

		return {
			campaign: updated,
			variance: updated.getVariance(),
			variancePercentage: updated.getVariancePercentage(),
			isOverBudget: updated.isOverBudget(),
			remainingBudget: updated.getRemainingBudget()
		};
	}

	/**
	 * Get campaigns over budget
	 */
	async getCampaignsOverBudget(): Promise<Campaign[]> {
		const campaigns = await this.campaignRepo.getActive();
		return campaigns.filter(c => c.isOverBudget());
	}

	/**
	 * Delete campaign
	 */
	async deleteCampaign(id: string): Promise<void> {
		const campaign = await this.campaignRepo.getById(id);
		if (!campaign) {
			throw new Error('Campaign not found');
		}

		if (campaign.status !== 'draft' && campaign.status !== 'cancelled') {
			throw new Error('Only draft or cancelled campaigns can be deleted');
		}

		await this.campaignRepo.delete(id);
	}
}
