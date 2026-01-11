import type PocketBase from 'pocketbase';
import { BaseRepo } from './BaseRepo';
import type { RecordModel } from 'pocketbase';

export interface TournamentResultRecord extends RecordModel {
	tournament: string;
	pro: string;
	placement: number;
	earnings: number;
	score?: string;
	rounds?: number;
	notes?: string;
}

export class TournamentResultRepo extends BaseRepo<TournamentResultRecord> {
	constructor(pb: PocketBase) {
		super(pb, 'tournament_results');
	}

	async findByTournament(tournamentId: string) {
		return await this.findAll({
			filter: `tournament = '${tournamentId}'`,
			sort: 'placement',
			expand: 'pro'
		});
	}

	async findByPro(proId: string) {
		return await this.findAll({
			filter: `pro = '${proId}'`,
			sort: 'placement',
			expand: 'tournament'
		});
	}

	async findTopFinishers(tournamentId: string, limit: number = 10) {
		return await this.findAll({
			filter: `tournament = '${tournamentId}' && placement <= ${limit}`,
			sort: 'placement',
			expand: 'pro',
			perPage: limit
		});
	}

	async getTotalEarnings(proId: string): Promise<number> {
		const results = await this.findAll({
			filter: `pro = '${proId}'`,
			perPage: 500
		});
		return results.items.reduce((sum, result) => sum + result.earnings, 0);
	}
}
