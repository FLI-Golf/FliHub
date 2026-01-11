/**
 * Tournament Result Entity
 */
export class TournamentResult {
	id?: string;
	tournament: string; // Tournament ID
	pro: string; // Pro ID
	placement: number;
	earnings: number;
	score?: string;
	rounds?: number;
	notes?: string;
	created?: Date;
	updated?: Date;

	constructor(data: Partial<TournamentResult>) {
		this.id = data.id;
		this.tournament = data.tournament || '';
		this.pro = data.pro || '';
		this.placement = data.placement || 1;
		this.earnings = data.earnings || 0;
		this.score = data.score;
		this.rounds = data.rounds;
		this.notes = data.notes;
		this.created = data.created;
		this.updated = data.updated;
	}

	static fromJSON(data: any): TournamentResult {
		return new TournamentResult({
			...data,
			created: data.created ? new Date(data.created) : undefined,
			updated: data.updated ? new Date(data.updated) : undefined
		});
	}

	toJSON(): Record<string, any> {
		return {
			id: this.id,
			tournament: this.tournament,
			pro: this.pro,
			placement: this.placement,
			earnings: this.earnings,
			score: this.score,
			rounds: this.rounds,
			notes: this.notes,
			created: this.created?.toISOString(),
			updated: this.updated?.toISOString()
		};
	}

	isWinner(): boolean {
		return this.placement === 1;
	}

	isPodium(): boolean {
		return this.placement <= 3;
	}

	isTopTen(): boolean {
		return this.placement <= 10;
	}
}
