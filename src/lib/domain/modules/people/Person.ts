import { Entity } from '../../base/Entity';

export enum PersonType {
	CONTACT = 'contact',
	SPONSOR = 'sponsor',
	PARTNER = 'partner',
	PRO = 'pro',
	PLAYER = 'player',
	STAFF = 'staff'
}

export enum PersonStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	PENDING = 'pending'
}

export interface PersonProps {
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	type: PersonType;
	status: PersonStatus;
	organization?: string;
	notes?: string;
}

export class Person extends Entity<PersonProps> {
	private constructor(props: PersonProps, id: string, createdAt?: Date, updatedAt?: Date) {
		super(props, id, createdAt, updatedAt);
	}

	public static create(props: PersonProps, id?: string): Person {
		return new Person(props, id || crypto.randomUUID());
	}

	public static fromRecord(record: any): Person {
		return new Person(
			{
				firstName: record.firstName,
				lastName: record.lastName,
				email: record.email,
				phone: record.phone,
				type: record.type,
				status: record.status,
				organization: record.organization,
				notes: record.notes
			},
			record.id,
			new Date(record.created),
			new Date(record.updated)
		);
	}

	public get firstName(): string {
		return this.props.firstName;
	}

	public get lastName(): string {
		return this.props.lastName;
	}

	public get fullName(): string {
		return `${this.props.firstName} ${this.props.lastName}`;
	}

	public get email(): string | undefined {
		return this.props.email;
	}

	public get phone(): string | undefined {
		return this.props.phone;
	}

	public get type(): PersonType {
		return this.props.type;
	}

	public get status(): PersonStatus {
		return this.props.status;
	}

	public get organization(): string | undefined {
		return this.props.organization;
	}

	public get notes(): string | undefined {
		return this.props.notes;
	}

	public updateContact(email?: string, phone?: string): void {
		if (email) this.props.email = email;
		if (phone) this.props.phone = phone;
		this.touch();
	}

	public updateStatus(status: PersonStatus): void {
		this.props.status = status;
		this.touch();
	}

	public addNotes(notes: string): void {
		this.props.notes = notes;
		this.touch();
	}

	public validate(): string[] {
		const errors: string[] = [];

		if (!this.props.firstName || this.props.firstName.trim().length === 0) {
			errors.push('First name is required');
		}

		if (!this.props.lastName || this.props.lastName.trim().length === 0) {
			errors.push('Last name is required');
		}

		if (this.props.email && !this.isValidEmail(this.props.email)) {
			errors.push('Invalid email format');
		}

		return errors;
	}

	public toRecord(): Record<string, any> {
		return {
			id: this._id,
			firstName: this.props.firstName,
			lastName: this.props.lastName,
			email: this.props.email,
			phone: this.props.phone,
			type: this.props.type,
			status: this.props.status,
			organization: this.props.organization,
			notes: this.props.notes,
			created: this._createdAt.toISOString(),
			updated: this._updatedAt.toISOString()
		};
	}

	private isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}
}
