import type { ProjectType, ProjectStatus, ApprovalStatus, ExpenseCategories } from '../schemas';

/**
 * Campaign entity - Represents a project/campaign with expense forecasting
 */
export class Campaign {
	constructor(
		public id: string,
		public name: string,
		public type: ProjectType,
		public status: ProjectStatus,
		public managerId: string,
		public startDate?: Date,
		public endDate?: Date,
		public description?: string,
		public forecastedExpenses?: number,
		public actualExpenses?: number,
		public expenseCategories?: ExpenseCategories,
		public approvalStatus?: ApprovalStatus,
		public approvedBy?: string,
		public fiscalYear?: string,
		public budget?: number,
		public notes?: string,
		public created?: Date,
		public updated?: Date
	) {}

	/**
	 * Calculate variance between forecasted and actual expenses
	 */
	getVariance(): number {
		if (!this.forecastedExpenses || !this.actualExpenses) return 0;
		return this.actualExpenses - this.forecastedExpenses;
	}

	/**
	 * Calculate variance percentage
	 */
	getVariancePercentage(): number {
		if (!this.forecastedExpenses || this.forecastedExpenses === 0) return 0;
		return (this.getVariance() / this.forecastedExpenses) * 100;
	}

	/**
	 * Check if campaign is over budget
	 */
	isOverBudget(): boolean {
		return this.getVariance() > 0;
	}

	/**
	 * Check if campaign is within budget threshold (e.g., 10%)
	 */
	isWithinBudgetThreshold(thresholdPercent: number = 10): boolean {
		const variance = Math.abs(this.getVariancePercentage());
		return variance <= thresholdPercent;
	}

	/**
	 * Get remaining budget
	 */
	getRemainingBudget(): number {
		if (!this.forecastedExpenses || !this.actualExpenses) return 0;
		return this.forecastedExpenses - this.actualExpenses;
	}

	/**
	 * Check if campaign is active
	 */
	isActive(): boolean {
		return this.status === 'in_progress';
	}

	/**
	 * Check if campaign is completed
	 */
	isCompleted(): boolean {
		return this.status === 'completed';
	}

	/**
	 * Check if campaign needs approval
	 */
	needsApproval(): boolean {
		return this.approvalStatus === 'pending' || this.approvalStatus === 'revision_requested';
	}

	/**
	 * Check if campaign is approved
	 */
	isApproved(): boolean {
		return this.approvalStatus === 'approved';
	}

	/**
	 * Get expense by category
	 */
	getExpenseByCategory(category: string): number {
		return this.expenseCategories?.[category] || 0;
	}

	/**
	 * Calculate total forecasted expenses from categories
	 */
	getTotalForecastedFromCategories(): number {
		if (!this.expenseCategories) return 0;
		return Object.values(this.expenseCategories).reduce((sum, amount) => sum + amount, 0);
	}

	/**
	 * Convert to plain object for API/database
	 */
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			status: this.status,
			managerId: this.managerId,
			startDate: this.startDate,
			endDate: this.endDate,
			description: this.description,
			forecastedExpenses: this.forecastedExpenses,
			actualExpenses: this.actualExpenses,
			expenseCategories: this.expenseCategories,
			approvalStatus: this.approvalStatus,
			approvedBy: this.approvedBy,
			fiscalYear: this.fiscalYear,
			budget: this.budget,
			notes: this.notes,
			created: this.created,
			updated: this.updated
		};
	}

	/**
	 * Create Campaign from plain object
	 */
	static fromJSON(data: any): Campaign {
		return new Campaign(
			data.id,
			data.name,
			data.type,
			data.status,
			data.managerId,
			data.startDate ? new Date(data.startDate) : undefined,
			data.endDate ? new Date(data.endDate) : undefined,
			data.description,
			data.forecastedExpenses,
			data.actualExpenses,
			data.expenseCategories,
			data.approvalStatus,
			data.approvedBy,
			data.fiscalYear,
			data.budget,
			data.notes,
			data.created ? new Date(data.created) : undefined,
			data.updated ? new Date(data.updated) : undefined
		);
	}
}
