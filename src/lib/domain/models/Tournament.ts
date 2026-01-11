/**
 * Tournament Entity
 */
export class Tournament {
	id?: string;
	name: string;
	season: number;
	tournamentNumber?: number;
	startDate: Date;
	endDate: Date;
	location?: string;
	venue?: string;
	prizePool: number;
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
	description?: string;
	notes?: string;
	created?: Date;
	updated?: Date;

	constructor(data: Partial<Tournament>) {
		this.id = data.id;
		this.name = data.name || '';
		this.season = data.season || new Date().getFullYear();
		this.tournamentNumber = data.tournamentNumber;
		this.startDate = data.startDate || new Date();
		this.endDate = data.endDate || new Date();
		this.location = data.location;
		this.venue = data.venue;
		this.prizePool = data.prizePool || 0;
		this.status = data.status || 'scheduled';
		this.description = data.description;
		this.notes = data.notes;
		this.created = data.created;
		this.updated = data.updated;
	}

	static fromJSON(data: any): Tournament {
		return new Tournament({
			...data,
			startDate: data.startDate ? new Date(data.startDate) : undefined,
			endDate: data.endDate ? new Date(data.endDate) : undefined,
			created: data.created ? new Date(data.created) : undefined,
			updated: data.updated ? new Date(data.updated) : undefined
		});
	}

	toJSON(): Record<string, any> {
		return {
			id: this.id,
			name: this.name,
			season: this.season,
			tournamentNumber: this.tournamentNumber,
			startDate: this.startDate.toISOString().split('T')[0],
			endDate: this.endDate.toISOString().split('T')[0],
			location: this.location,
			venue: this.venue,
			prizePool: this.prizePool,
			status: this.status,
			description: this.description,
			notes: this.notes,
			created: this.created?.toISOString(),
			updated: this.updated?.toISOString()
		};
	}

	isActive(): boolean {
		return this.status === 'in_progress';
	}

	isCompleted(): boolean {
		return this.status === 'completed';
	}

	isUpcoming(): boolean {
		return this.status === 'scheduled' && this.startDate > new Date();
	}

	getDuration(): number {
		return Math.ceil(
			(this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
	}
}
