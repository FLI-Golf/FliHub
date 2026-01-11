import type PocketBase from 'pocketbase';
import { BaseRepo } from './BaseRepo';
import type { RecordModel } from 'pocketbase';

export interface TournamentRecord extends RecordModel {
	name: string;
	season: number;
	tournamentNumber?: number;
	startDate: string;
	endDate: string;
	location?: string;
	venue?: string;
	prizePool: number;
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
	description?: string;
	notes?: string;
}

export class TournamentRepo extends BaseRepo<TournamentRecord> {
	constructor(pb: PocketBase) {
		super(pb, 'tournaments');
	}

	async findBySeason(season: number) {
		return await this.findAll({
			filter: `season = ${season}`,
			sort: 'tournamentNumber,startDate'
		});
	}

	async findUpcoming() {
		const today = new Date().toISOString().split('T')[0];
		return await this.findAll({
			filter: `status = 'scheduled' && startDate >= '${today}'`,
			sort: 'startDate'
		});
	}

	async findActive() {
		return await this.findAll({
			filter: `status = 'in_progress'`,
			sort: 'startDate'
		});
	}

	async findCompleted(season?: number) {
		const filter = season
			? `status = 'completed' && season = ${season}`
			: `status = 'completed'`;
		return await this.findAll({
			filter,
			sort: '-startDate'
		});
	}
}
