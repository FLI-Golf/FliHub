/**
 * Special Event Entity
 */
export class SpecialEvent {
	id?: string;
	name: string;
	eventType: 'appearance' | 'clinic' | 'media' | 'promotional' | 'content_creation' | 'other';
	eventDate: Date;
	location?: string;
	description?: string;
	status: 'scheduled' | 'completed' | 'cancelled';
	notes?: string;
	created?: Date;
	updated?: Date;

	constructor(data: Partial<SpecialEvent>) {
		this.id = data.id;
		this.name = data.name || '';
		this.eventType = data.eventType || 'other';
		this.eventDate = data.eventDate || new Date();
		this.location = data.location;
		this.description = data.description;
		this.status = data.status || 'scheduled';
		this.notes = data.notes;
		this.created = data.created;
		this.updated = data.updated;
	}

	static fromJSON(data: any): SpecialEvent {
		return new SpecialEvent({
			...data,
			eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
			created: data.created ? new Date(data.created) : undefined,
			updated: data.updated ? new Date(data.updated) : undefined
		});
	}

	toJSON(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			eventType: this.eventType,
			eventDate: this.eventDate.toISOString().split('T')[0],
			location: this.location,
			description: this.description,
			status: this.status,
			notes: this.notes,
			created: this.created?.toISOString(),
			updated: this.updated?.toISOString()
		};
	}

	isCompleted(): boolean {
		return this.status === 'completed';
	}

	isUpcoming(): boolean {
		return this.status === 'scheduled' && this.eventDate > new Date();
	}

	isPast(): boolean {
		return this.eventDate < new Date();
	}
}
