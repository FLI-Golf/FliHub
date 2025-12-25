import { Entity } from '../../base/Entity';

export enum TaskStatus {
	IN_PROGRESS = 'In Progress',
	SCHEDULED = 'Scheduled',
	COMPLETED = 'Completed',
	CANCELLED = 'Cancelled'
}

export enum TaskTrack {
	PHASE_1 = 'Phase 1',
	PHASE_2 = 'Phase 2',
	OVERALL = 'Overall',
	OTHER = 'Other'
}

export enum StrategicGoal {
	COMPANY_GROWTH = 'Company Growth',
	BRAND_AWARENESS = 'Brand Awareness',
	REVENUE = 'Revenue',
	INCREASE_REVENUE = 'Increase Revenue',
	MANAGERIAL_TASKS = 'Managerial Tasks',
	APP = 'App',
	LEGAL_TASKS = 'Legal Tasks'
}

export enum Quarter {
	Q1 = 'Q1',
	Q2 = 'Q2',
	Q3 = 'Q3',
	Q4 = 'Q4'
}

export interface TaskProps {
	task: string;
	subTasksChecklist?: string;
	managers?: string;
	track?: TaskTrack;
	strategicGoal?: StrategicGoal;
	departments?: string;
	quarters?: Quarter;
	startDate?: Date;
	endDate?: Date;
	budget?: number;
	income?: number;
	status: TaskStatus;
}

export class Task extends Entity<TaskProps> {
	private constructor(props: TaskProps, id: string, createdAt?: Date, updatedAt?: Date) {
		super(props, id, createdAt, updatedAt);
	}

	public static create(props: TaskProps, id?: string): Task {
		return new Task(props, id || crypto.randomUUID());
	}

	public static fromRecord(record: any): Task {
		return new Task(
			{
				task: record.task,
				subTasksChecklist: record.subTasksChecklist,
				managers: record.managers,
				track: record.track,
				strategicGoal: record.strategicGoal,
				departments: record.departments,
				quarters: record.quarters,
				startDate: record.startDate ? new Date(record.startDate) : undefined,
				endDate: record.endDate ? new Date(record.endDate) : undefined,
				budget: record.budget,
				income: record.income,
				status: record.status
			},
			record.id,
			new Date(record.created),
			new Date(record.updated)
		);
	}

	public get task(): string {
		return this.props.task;
	}

	public get subTasksChecklist(): string | undefined {
		return this.props.subTasksChecklist;
	}

	public get managers(): string | undefined {
		return this.props.managers;
	}

	public get track(): TaskTrack | undefined {
		return this.props.track;
	}

	public get strategicGoal(): StrategicGoal | undefined {
		return this.props.strategicGoal;
	}

	public get departments(): string | undefined {
		return this.props.departments;
	}

	public get quarters(): Quarter | undefined {
		return this.props.quarters;
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

	public get income(): number | undefined {
		return this.props.income;
	}

	public get status(): TaskStatus {
		return this.props.status;
	}

	public updateStatus(status: TaskStatus): void {
		this.props.status = status;
		this.touch();
	}

	public updateChecklist(checklist: string): void {
		this.props.subTasksChecklist = checklist;
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

	public updateIncome(income: number): void {
		this.props.income = income;
		this.touch();
	}

	public assignManagers(managers: string): void {
		this.props.managers = managers;
		this.touch();
	}

	public complete(): void {
		this.props.status = TaskStatus.COMPLETED;
		this.touch();
	}

	public cancel(): void {
		this.props.status = TaskStatus.CANCELLED;
		this.touch();
	}

	public validate(): string[] {
		const errors: string[] = [];

		if (!this.props.task || this.props.task.trim().length === 0) {
			errors.push('Task name is required');
		}

		if (this.props.startDate && this.props.endDate && this.props.startDate > this.props.endDate) {
			errors.push('Start date must be before end date');
		}

		if (this.props.budget !== undefined && this.props.budget < 0) {
			errors.push('Budget cannot be negative');
		}

		if (this.props.income !== undefined && this.props.income < 0) {
			errors.push('Income cannot be negative');
		}

		return errors;
	}

	public toRecord(): Record<string, any> {
		return {
			id: this._id,
			task: this.props.task,
			subTasksChecklist: this.props.subTasksChecklist,
			managers: this.props.managers,
			track: this.props.track,
			strategicGoal: this.props.strategicGoal,
			departments: this.props.departments,
			quarters: this.props.quarters,
			startDate: this.props.startDate?.toISOString(),
			endDate: this.props.endDate?.toISOString(),
			budget: this.props.budget,
			income: this.props.income,
			status: this.props.status,
			created: this._createdAt.toISOString(),
			updated: this._updatedAt.toISOString()
		};
	}
}
