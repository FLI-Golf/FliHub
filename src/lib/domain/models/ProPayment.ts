/**
 * Pro Payment Entity
 */
export class ProPayment {
	id?: string;
	pro: string; // Pro ID
	paymentType: 'tournament' | 'special_event' | 'bonus' | 'other';
	tournament?: string; // Tournament ID
	specialEvent?: string; // Special Event ID
	amount: number;
	paymentDate?: Date;
	dueDate?: Date;
	status: 'pending' | 'processing' | 'paid' | 'cancelled';
	paymentMethod?: 'bank_transfer' | 'check' | 'paypal' | 'venmo' | 'zelle' | 'other';
	transactionId?: string;
	description?: string;
	notes?: string;
	created?: Date;
	updated?: Date;

	constructor(data: Partial<ProPayment>) {
		this.id = data.id;
		this.pro = data.pro || '';
		this.paymentType = data.paymentType || 'other';
		this.tournament = data.tournament;
		this.specialEvent = data.specialEvent;
		this.amount = data.amount || 0;
		this.paymentDate = data.paymentDate;
		this.dueDate = data.dueDate;
		this.status = data.status || 'pending';
		this.paymentMethod = data.paymentMethod;
		this.transactionId = data.transactionId;
		this.description = data.description;
		this.notes = data.notes;
		this.created = data.created;
		this.updated = data.updated;
	}

	static fromJSON(data: any): ProPayment {
		return new ProPayment({
			...data,
			paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
			dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
			created: data.created ? new Date(data.created) : undefined,
			updated: data.updated ? new Date(data.updated) : undefined
		});
	}

	toJSON(): Record<string, any> {
		return {
			id: this.id,
			pro: this.pro,
			paymentType: this.paymentType,
			tournament: this.tournament,
			specialEvent: this.specialEvent,
			amount: this.amount,
			paymentDate: this.paymentDate?.toISOString().split('T')[0],
			dueDate: this.dueDate?.toISOString().split('T')[0],
			status: this.status,
			paymentMethod: this.paymentMethod,
			transactionId: this.transactionId,
			description: this.description,
			notes: this.notes,
			created: this.created?.toISOString(),
			updated: this.updated?.toISOString()
		};
	}

	isPaid(): boolean {
		return this.status === 'paid';
	}

	isPending(): boolean {
		return this.status === 'pending';
	}

	isOverdue(): boolean {
		if (!this.dueDate || this.isPaid()) return false;
		return this.dueDate < new Date();
	}

	getDaysUntilDue(): number | null {
		if (!this.dueDate || this.isPaid()) return null;
		const diff = this.dueDate.getTime() - new Date().getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}
}
