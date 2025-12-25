import { Entity } from '../../base/Entity';

export enum Department {
	PUBLICIST = 'Publicist',
	SALES = 'Sales',
	PRODUCT_DEVELOPMENT = 'Product Development',
	FINANCE = 'Finance',
	MARKETING_PR = 'Marketing and PR',
	TECHNICAL = 'Technical',
	PRODUCTION = 'Production',
	CONSULTANT = 'Consultant',
	OPERATIONS = 'Operations',
	APPAREL = 'Apparel'
}

export interface ManagerProps {
	name: string;
	department: Department;
	email?: string;
	phone?: string;
	goals?: string;
}

export class Manager extends Entity<ManagerProps> {
	private constructor(props: ManagerProps, id: string, createdAt?: Date, updatedAt?: Date) {
		super(props, id, createdAt, updatedAt);
	}

	public static create(props: ManagerProps, id?: string): Manager {
		return new Manager(props, id || crypto.randomUUID());
	}

	public static fromRecord(record: any): Manager {
		return new Manager(
			{
				name: record.name,
				department: record.department,
				email: record.email,
				phone: record.phone,
				goals: record.goals
			},
			record.id,
			new Date(record.created),
			new Date(record.updated)
		);
	}

	public get name(): string {
		return this.props.name;
	}

	public get department(): Department {
		return this.props.department;
	}

	public get email(): string | undefined {
		return this.props.email;
	}

	public get phone(): string | undefined {
		return this.props.phone;
	}

	public get goals(): string | undefined {
		return this.props.goals;
	}

	public updateGoals(goals: string): void {
		this.props.goals = goals;
		this.touch();
	}

	public updateContact(email?: string, phone?: string): void {
		if (email) this.props.email = email;
		if (phone) this.props.phone = phone;
		this.touch();
	}

	public validate(): string[] {
		const errors: string[] = [];

		if (!this.props.name || this.props.name.trim().length === 0) {
			errors.push('Manager name is required');
		}

		if (!this.props.department) {
			errors.push('Department is required');
		}

		if (this.props.email && !this.isValidEmail(this.props.email)) {
			errors.push('Invalid email format');
		}

		return errors;
	}

	public toRecord(): Record<string, any> {
		return {
			id: this._id,
			name: this.props.name,
			department: this.props.department,
			email: this.props.email,
			phone: this.props.phone,
			goals: this.props.goals,
			created: this._createdAt.toISOString(),
			updated: this._updatedAt.toISOString()
		};
	}

	private isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}
}
