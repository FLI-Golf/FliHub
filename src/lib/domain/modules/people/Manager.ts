export interface ManagerProps {
	id: string;
	firstName: string;
	lastName: string;
	email?: string;
	departmentId?: string;
}

export interface Department {
	id: string;
	name: string;
}

export class Manager {
	constructor(public readonly props: ManagerProps) {}
	get fullName() { return `${this.props.firstName} ${this.props.lastName}`; }
}
