import type { Expense } from '../models/Expense';
import type { ExpenseStatus, ExpenseCategory } from '../schemas';

/**
 * Expense Repository Interface
 */
export interface IExpenseRepository {
	/**
	 * Get expense by ID
	 */
	getById(id: string): Promise<Expense | null>;

	/**
	 * Get all expenses
	 */
	getAll(): Promise<Expense[]>;

	/**
	 * Get expenses by project/campaign
	 */
	getByProject(projectId: string): Promise<Expense[]>;

	/**
	 * Get expenses by status
	 */
	getByStatus(status: ExpenseStatus): Promise<Expense[]>;

	/**
	 * Get expenses by category
	 */
	getByCategory(category: ExpenseCategory): Promise<Expense[]>;

	/**
	 * Get expenses by submitter
	 */
	getBySubmitter(userId: string): Promise<Expense[]>;

	/**
	 * Get expenses needing approval
	 */
	getNeedingApproval(): Promise<Expense[]>;

	/**
	 * Get expenses needing reimbursement
	 */
	getNeedingReimbursement(): Promise<Expense[]>;

	/**
	 * Get expenses by date range
	 */
	getByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;

	/**
	 * Create new expense
	 */
	create(expense: Omit<Expense, 'id' | 'created' | 'updated'>): Promise<Expense>;

	/**
	 * Update expense
	 */
	update(id: string, expense: Partial<Expense>): Promise<Expense>;

	/**
	 * Delete expense
	 */
	delete(id: string): Promise<void>;

	/**
	 * Approve expense
	 */
	approve(id: string, approvedBy: string): Promise<Expense>;

	/**
	 * Reject expense
	 */
	reject(id: string, approvedBy: string): Promise<Expense>;

	/**
	 * Mark expense as paid
	 */
	markAsPaid(id: string, paidDate: Date): Promise<Expense>;

	/**
	 * Get total expenses by project
	 */
	getTotalByProject(projectId: string): Promise<number>;

	/**
	 * Get total expenses by category for a project
	 */
	getTotalByProjectAndCategory(projectId: string, category: ExpenseCategory): Promise<number>;
}
