import type { Expense } from '../models/Expense';
import type { IExpenseRepository } from '../repositories/IExpenseRepository';
import type { ICampaignRepository } from '../repositories/ICampaignRepository';
import type { ExpenseStatus } from '../schemas';

/**
 * ExpenseManager - Business logic for expense management
 */
export class ExpenseManager {
	constructor(
		private expenseRepo: IExpenseRepository,
		private campaignRepo: ICampaignRepository
	) {}

	/**
	 * Submit new expense
	 */
	async submitExpense(data: Omit<Expense, 'id' | 'created' | 'updated'>): Promise<Expense> {
		// Validate amount
		if (data.amount <= 0) {
			throw new Error('Expense amount must be greater than 0');
		}

		// Validate project exists if provided
		if (data.projectId) {
			const campaign = await this.campaignRepo.getById(data.projectId);
			if (!campaign) {
				throw new Error('Campaign not found');
			}

			// Check if campaign is active
			if (!campaign.isActive() && campaign.status !== 'planned') {
				throw new Error('Cannot add expenses to inactive campaigns');
			}
		}

		// Set initial status
		const expenseData = {
			...data,
			status: 'submitted' as ExpenseStatus
		};

		return await this.expenseRepo.create(expenseData);
	}

	/**
	 * Update expense
	 */
	async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
		const existing = await this.expenseRepo.getById(id);
		if (!existing) {
			throw new Error('Expense not found');
		}

		// Don't allow updates to approved/paid expenses
		if (existing.isApproved() || existing.isPaid()) {
			throw new Error('Cannot update approved or paid expenses');
		}

		return await this.expenseRepo.update(id, data);
	}

	/**
	 * Approve expense
	 */
	async approveExpense(id: string, approvedBy: string): Promise<Expense> {
		const expense = await this.expenseRepo.getById(id);
		if (!expense) {
			throw new Error('Expense not found');
		}

		if (!expense.isPending()) {
			throw new Error('Only submitted expenses can be approved');
		}

		// Check if expense has receipt for amounts over threshold
		const RECEIPT_REQUIRED_THRESHOLD = 100;
		if (expense.amount > RECEIPT_REQUIRED_THRESHOLD && !expense.hasReceipt()) {
			throw new Error(`Receipt required for expenses over $${RECEIPT_REQUIRED_THRESHOLD}`);
		}

		const approved = await this.expenseRepo.approve(id, approvedBy);

		// Update campaign actual expenses
		if (approved.projectId) {
			const totalExpenses = await this.expenseRepo.getTotalByProject(approved.projectId);
			await this.campaignRepo.updateActualExpenses(approved.projectId, totalExpenses);
		}

		return approved;
	}

	/**
	 * Reject expense
	 */
	async rejectExpense(id: string, approvedBy: string, reason?: string): Promise<Expense> {
		const expense = await this.expenseRepo.getById(id);
		if (!expense) {
			throw new Error('Expense not found');
		}

		if (!expense.isPending()) {
			throw new Error('Only submitted expenses can be rejected');
		}

		const rejected = await this.expenseRepo.reject(id, approvedBy);

		if (reason) {
			await this.expenseRepo.update(id, {
				notes: `${rejected.notes || ''}\n\nRejection reason: ${reason}`
			});
		}

		return rejected;
	}

	/**
	 * Mark expense as paid
	 */
	async markAsPaid(id: string, paidDate?: Date): Promise<Expense> {
		const expense = await this.expenseRepo.getById(id);
		if (!expense) {
			throw new Error('Expense not found');
		}

		if (!expense.isApproved()) {
			throw new Error('Only approved expenses can be marked as paid');
		}

		return await this.expenseRepo.markAsPaid(id, paidDate || new Date());
	}

	/**
	 * Get expenses needing approval
	 */
	async getExpensesNeedingApproval(): Promise<Expense[]> {
		return await this.expenseRepo.getNeedingApproval();
	}

	/**
	 * Get expenses needing reimbursement
	 */
	async getExpensesNeedingReimbursement(): Promise<Expense[]> {
		return await this.expenseRepo.getNeedingReimbursement();
	}

	/**
	 * Get expenses by campaign
	 */
	async getExpensesByCampaign(campaignId: string): Promise<Expense[]> {
		return await this.expenseRepo.getByProject(campaignId);
	}

	/**
	 * Get expense summary for campaign
	 */
	async getCampaignExpenseSummary(campaignId: string): Promise<{
		total: number;
		byCategory: Record<string, number>;
		byStatus: Record<ExpenseStatus, number>;
		count: number;
	}> {
		const expenses = await this.expenseRepo.getByProject(campaignId);

		const byCategory: Record<string, number> = {};
		const byStatus: Record<ExpenseStatus, number> = {
			draft: 0,
			submitted: 0,
			approved: 0,
			rejected: 0,
			paid: 0
		};

		let total = 0;

		expenses.forEach(expense => {
			// Only count approved/paid expenses in total
			if (expense.isApproved() || expense.isPaid()) {
				total += expense.amount;
				byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
			}
			byStatus[expense.status] = (byStatus[expense.status] || 0) + expense.amount;
		});

		return {
			total,
			byCategory,
			byStatus,
			count: expenses.length
		};
	}

	/**
	 * Delete expense
	 */
	async deleteExpense(id: string): Promise<void> {
		const expense = await this.expenseRepo.getById(id);
		if (!expense) {
			throw new Error('Expense not found');
		}

		if (expense.isApproved() || expense.isPaid()) {
			throw new Error('Cannot delete approved or paid expenses');
		}

		await this.expenseRepo.delete(id);
	}

	/**
	 * Bulk approve expenses
	 */
	async bulkApproveExpenses(expenseIds: string[], approvedBy: string): Promise<Expense[]> {
		const approved: Expense[] = [];

		for (const id of expenseIds) {
			try {
				const expense = await this.approveExpense(id, approvedBy);
				approved.push(expense);
			} catch (error) {
				console.error(`Failed to approve expense ${id}:`, error);
			}
		}

		return approved;
	}
}
