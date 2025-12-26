import type { Campaign } from '../models/Campaign';
import type { ProjectStatus, ApprovalStatus } from '../schemas';

/**
 * Campaign Repository Interface
 * Defines contract for campaign data access
 */
export interface ICampaignRepository {
	/**
	 * Get campaign by ID
	 */
	getById(id: string): Promise<Campaign | null>;

	/**
	 * Get all campaigns
	 */
	getAll(): Promise<Campaign[]>;

	/**
	 * Get campaigns by manager
	 */
	getByManager(managerId: string): Promise<Campaign[]>;

	/**
	 * Get campaigns by status
	 */
	getByStatus(status: ProjectStatus): Promise<Campaign[]>;

	/**
	 * Get campaigns by approval status
	 */
	getByApprovalStatus(approvalStatus: ApprovalStatus): Promise<Campaign[]>;

	/**
	 * Get campaigns by fiscal year
	 */
	getByFiscalYear(fiscalYear: string): Promise<Campaign[]>;

	/**
	 * Get active campaigns
	 */
	getActive(): Promise<Campaign[]>;

	/**
	 * Get campaigns needing approval
	 */
	getNeedingApproval(): Promise<Campaign[]>;

	/**
	 * Create new campaign
	 */
	create(campaign: Omit<Campaign, 'id' | 'created' | 'updated'>): Promise<Campaign>;

	/**
	 * Update campaign
	 */
	update(id: string, campaign: Partial<Campaign>): Promise<Campaign>;

	/**
	 * Delete campaign
	 */
	delete(id: string): Promise<void>;

	/**
	 * Update actual expenses
	 */
	updateActualExpenses(id: string, amount: number): Promise<Campaign>;

	/**
	 * Approve campaign
	 */
	approve(id: string, approvedBy: string): Promise<Campaign>;

	/**
	 * Reject campaign
	 */
	reject(id: string, approvedBy: string): Promise<Campaign>;
}
