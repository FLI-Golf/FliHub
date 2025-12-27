import type { ExpenseCategory, ExpenseStatus, PaymentMethod } from '../schemas';

/**
 * Expense entity - Represents an actual expense
 */
export class Expense {
	constructor(
		public id: string,
		public description: string,
		public amount: number,
		public category: ExpenseCategory,
		public status: ExpenseStatus,
		public date: Date,
		public projectId?: string,
		public submittedBy?: string,
		public approvedBy?: string,
		public receipt?: string[],
		public notes?: string,
		public vendor?: string,
		public paymentMethod?: PaymentMethod,
		public paidDate?: Date,
		public reimbursementTo?: string,
		public created?: Date,
		public updated?: Date
	) {}

	/**
	 * Check if expense is approved
	 */
	isApproved(): boolean {
		return this.status === 'approved';
	}

	/**
	 * Check if expense is paid
	 */
	isPaid(): boolean {
		return this.status === 'paid';
	}

	/**
	 * Check if expense is pending
	 */
	isPending(): boolean {
		return this.status === 'submitted';
	}

	/**
	 * Check if expense is rejected
	 */
	isRejected(): boolean {
		return this.status === 'rejected';
	}

	/**
	 * Check if expense needs reimbursement
	 */
	needsReimbursement(): boolean {
		return !!this.reimbursementTo && this.isApproved() && !this.isPaid();
	}

	/**
	 * Check if expense has receipt
	 */
	hasReceipt(): boolean {
		return !!this.receipt && this.receipt.length > 0;
	}

	/**
	 * Get days since submission
	 */
	getDaysSinceSubmission(): number {
		if (!this.created) return 0;
		const now = new Date();
		const diff = now.getTime() - this.created.getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	}

	/**
	 * Convert to plain object
	 */
	toJSON() {
		return {
			id: this.id,
			description: this.description,
			amount: this.amount,
			category: this.category,
			status: this.status,
			date: this.date,
			projectId: this.projectId,
			submittedBy: this.submittedBy,
			approvedBy: this.approvedBy,
			receipt: this.receipt,
			notes: this.notes,
			vendor: this.vendor,
			paymentMethod: this.paymentMethod,
			paidDate: this.paidDate,
			reimbursementTo: this.reimbursementTo,
			created: this.created,
			updated: this.updated
		};
	}

	/**
	 * Create Expense from plain object
	 */
	static fromJSON(data: any): Expense {
		return new Expense(
			data.id,
			data.description,
			data.amount,
			data.category,
			data.status,
			new Date(data.date),
			data.projectId,
			data.submittedBy,
			data.approvedBy,
			data.receipt,
			data.notes,
			data.vendor,
			data.paymentMethod,
			data.paidDate ? new Date(data.paidDate) : undefined,
			data.reimbursementTo,
			data.created ? new Date(data.created) : undefined,
			data.updated ? new Date(data.updated) : undefined
		);
	}
}
