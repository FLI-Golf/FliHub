import { Entity } from '../../base/Entity';

export enum ProjectType {
	TOURNAMENT = 'tournament',
	ACTIVATION = 'activation',
	EVENT = 'event',
	CAMPAIGN = 'campaign'
}

export enum ProjectStatus {
	DRAFT = 'draft',
	PLANNED = 'planned',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled'
}

export enum ApprovalStatus {
	PENDING = 'pending',
	APPROVED = 'approved',
	REJECTED = 'rejected',
	REVISION_REQUESTED = 'revision_requested'
}

export interface ProjectProps {
	name: string;
	description?: string;
	type: ProjectType;
	status: ProjectStatus;
	startDate?: Date;
	endDate?: Date;
	budget?: number;
	ownerId?: string;
	notes?: string;
	forecastedExpenses?: number;
	actualExpenses?: number;
	expenseCategories?: any;
	approvalStatus?: ApprovalStatus;
	fiscalYear?: string;
	approvedBy?: string;
	department?: string;
	vendors?: string[];
}

export class Project extends Entity<ProjectProps> {
	private constructor(props: ProjectProps, id: string, createdAt?: Date, updatedAt?: Date) {
		super(props, id, createdAt, updatedAt);
	}

	public static create(props: ProjectProps, id?: string): Project {
		return new Project(props, id || crypto.randomUUID());
	}

	public static fromRecord(record: any): Project {
		return new Project(
			{
				name: record.name,
				description: record.description,
				type: record.type,
				status: record.status,
				startDate: record.startDate ? new Date(record.startDate) : undefined,
				endDate: record.endDate ? new Date(record.endDate) : undefined,
				budget: record.budget,
				ownerId: record.ownerId,
				notes: record.notes,
				forecastedExpenses: record.forecastedExpenses,
				actualExpenses: record.actualExpenses,
				expenseCategories: record.expenseCategories,
				approvalStatus: record.approvalStatus,
				fiscalYear: record.fiscalYear,
				approvedBy: record.approvedBy,
				department: record.department,
				vendors: record.vendors
			},
			record.id,
			new Date(record.created),
			new Date(record.updated)
		);
	}

	public get name(): string {
		return this.props.name;
	}

	public get description(): string | undefined {
		return this.props.description;
	}

	public get type(): ProjectType {
		return this.props.type;
	}

	public get status(): ProjectStatus {
		return this.props.status;
	}

	public get startDate(): Date | undefined {
		return this.props.startDate;
	}

	public get endDate(): Date | undefined {
		return this.props.endDate;
	}

	public get budget(): number | undefined {
		return this.props.budget;
	}

	public get ownerId(): string | undefined {
		return this.props.ownerId;
	}

	public get forecastedExpenses(): number | undefined {
		return this.props.forecastedExpenses;
	}

	public get actualExpenses(): number | undefined {
		return this.props.actualExpenses;
	}

	public get expenseCategories(): any | undefined {
		return this.props.expenseCategories;
	}

	public get approvalStatus(): ApprovalStatus | undefined {
		return this.props.approvalStatus;
	}

	public get fiscalYear(): string | undefined {
		return this.props.fiscalYear;
	}

	public get approvedBy(): string | undefined {
		return this.props.approvedBy;
	}

	public get department(): string | undefined {
		return this.props.department;
	}

	public get vendors(): string[] | undefined {
		return this.props.vendors;
	}

	public updateStatus(status: ProjectStatus): void {
		this.props.status = status;
		this.touch();
	}

	public updateDates(startDate?: Date, endDate?: Date): void {
		if (startDate) this.props.startDate = startDate;
		if (endDate) this.props.endDate = endDate;
		this.touch();
	}

	public updateBudget(budget: number): void {
		this.props.budget = budget;
		this.touch();
	}

	public assignOwner(ownerId: string): void {
		this.props.ownerId = ownerId;
		this.touch();
	}

	public canStart(): boolean {
		return this.props.status === ProjectStatus.PLANNED;
	}

	public canComplete(): boolean {
		return this.props.status === ProjectStatus.IN_PROGRESS;
	}

	public start(): void {
		if (!this.canStart()) {
			throw new Error('Project must be in planned status to start');
		}
		this.props.status = ProjectStatus.IN_PROGRESS;
		this.touch();
	}

	public complete(): void {
		if (!this.canComplete()) {
			throw new Error('Project must be in progress to complete');
		}
		this.props.status = ProjectStatus.COMPLETED;
		this.touch();
	}

	public validate(): string[] {
		const errors: string[] = [];

		if (!this.props.name || this.props.name.trim().length === 0) {
			errors.push('Project name is required');
		}

		if (this.props.startDate && this.props.endDate && this.props.startDate > this.props.endDate) {
			errors.push('Start date must be before end date');
		}

		if (this.props.budget !== undefined && this.props.budget < 0) {
			errors.push('Budget cannot be negative');
		}

		return errors;
	}

	public toRecord(): Record<string, any> {
		return {
			id: this._id,
			name: this.props.name,
			description: this.props.description,
			type: this.props.type,
			status: this.props.status,
			startDate: this.props.startDate?.toISOString(),
			endDate: this.props.endDate?.toISOString(),
			budget: this.props.budget,
			ownerId: this.props.ownerId,
			notes: this.props.notes,
			forecastedExpenses: this.props.forecastedExpenses,
			actualExpenses: this.props.actualExpenses,
			expenseCategories: this.props.expenseCategories,
			approvalStatus: this.props.approvalStatus,
			fiscalYear: this.props.fiscalYear,
			approvedBy: this.props.approvedBy,
			department: this.props.department,
			vendors: this.props.vendors,
			created: this._createdAt.toISOString(),
			updated: this._updatedAt.toISOString()
		};
	}
}
