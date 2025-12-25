import { Entity } from '../../base/Entity';

export enum ExpenseCategory {
	TRAVEL = 'travel',
	ACCOMMODATION = 'accommodation',
	MEALS = 'meals',
	EQUIPMENT = 'equipment',
	MARKETING = 'marketing',
	VENUE = 'venue',
	STAFF = 'staff',
	OTHER = 'other'
}

export enum ExpenseStatus {
	DRAFT = 'draft',
	SUBMITTED = 'submitted',
	APPROVED = 'approved',
	REJECTED = 'rejected',
	PAID = 'paid'
}

export interface ExpenseProps {
	description: string;
	amount: number;
	category: ExpenseCategory;
	status: ExpenseStatus;
	date: Date;
	projectId?: string;
	submittedBy?: string;
	approvedBy?: string;
	receiptUrl?: string;
	notes?: string;
}

export class Expense extends Entity<ExpenseProps> {
	private constructor(props: ExpenseProps, id: string, createdAt?: Date, updatedAt?: Date) {
		super(props, id, createdAt, updatedAt);
	}

	public static create(props: ExpenseProps, id?: string): Expense {
		return new Expense(props, id || crypto.randomUUID());
	}

	public static fromRecord(record: any): Expense {
		return new Expense(
			{
				description: record.description,
				amount: record.amount,
				category: record.category,
				status: record.status,
				date: new Date(record.date),
				projectId: record.projectId,
				submittedBy: record.submittedBy,
				approvedBy: record.approvedBy,
				receiptUrl: record.receiptUrl,
				notes: record.notes
			},
			record.id,
			new Date(record.created),
			new Date(record.updated)
		);
	}

	public get description(): string {
		return this.props.description;
	}

	public get amount(): number {
		return this.props.amount;
	}

	public get category(): ExpenseCategory {
		return this.props.category;
	}

	public get status(): ExpenseStatus {
		return this.props.status;
	}

	public get date(): Date {
		return this.props.date;
	}

	public get projectId(): string | undefined {
		return this.props.projectId;
	}

	public get submittedBy(): string | undefined {
		return this.props.submittedBy;
	}

	public get approvedBy(): string | undefined {
		return this.props.approvedBy;
	}

	public get receiptUrl(): string | undefined {
		return this.props.receiptUrl;
	}

	public setCategory(category: ExpenseCategory): void {
		this.props.category = category;
		this.touch();
	}

	public attachReceipt(url: string): void {
		this.props.receiptUrl = url;
		this.touch();
	}

	public submit(submittedBy: string): void {
		if (this.props.status !== ExpenseStatus.DRAFT) {
			throw new Error('Only draft expenses can be submitted');
		}
		this.props.status = ExpenseStatus.SUBMITTED;
		this.props.submittedBy = submittedBy;
		this.touch();
	}

	public approve(approvedBy: string): void {
		if (this.props.status !== ExpenseStatus.SUBMITTED) {
			throw new Error('Only submitted expenses can be approved');
		}
		this.props.status = ExpenseStatus.APPROVED;
		this.props.approvedBy = approvedBy;
		this.touch();
	}

	public reject(): void {
		if (this.props.status !== ExpenseStatus.SUBMITTED) {
			throw new Error('Only submitted expenses can be rejected');
		}
		this.props.status = ExpenseStatus.REJECTED;
		this.touch();
	}

	public markPaid(): void {
		if (this.props.status !== ExpenseStatus.APPROVED) {
			throw new Error('Only approved expenses can be marked as paid');
		}
		this.props.status = ExpenseStatus.PAID;
		this.touch();
	}

	public validate(): string[] {
		const errors: string[] = [];

		if (!this.props.description || this.props.description.trim().length === 0) {
			errors.push('Description is required');
		}

		if (this.props.amount <= 0) {
			errors.push('Amount must be greater than zero');
		}

		if (!this.props.date) {
			errors.push('Date is required');
		}

		return errors;
	}

	public toRecord(): Record<string, any> {
		return {
			id: this._id,
			description: this.props.description,
			amount: this.props.amount,
			category: this.props.category,
			status: this.props.status,
			date: this.props.date.toISOString(),
			projectId: this.props.projectId,
			submittedBy: this.props.submittedBy,
			approvedBy: this.props.approvedBy,
			receiptUrl: this.props.receiptUrl,
			notes: this.props.notes,
			created: this._createdAt.toISOString(),
			updated: this._updatedAt.toISOString()
		};
	}
}
