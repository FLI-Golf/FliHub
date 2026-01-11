import type PocketBase from 'pocketbase';
import { BaseRepo } from './BaseRepo';
import type { RecordModel } from 'pocketbase';

export interface SpecialEventRecord extends RecordModel {
	name: string;
	eventType: 'appearance' | 'clinic' | 'media' | 'promotional' | 'content_creation' | 'other';
	eventDate: string;
	location?: string;
	description?: string;
	status: 'scheduled' | 'completed' | 'cancelled';
	notes?: string;
}

export class SpecialEventRepo extends BaseRepo<SpecialEventRecord> {
	constructor(pb: PocketBase) {
		super(pb, 'special_events');
	}

	async findUpcoming() {
		const today = new Date().toISOString().split('T')[0];
		return await this.findAll({
			filter: `status = 'scheduled' && eventDate >= '${today}'`,
			sort: 'eventDate'
		});
	}

	async findByType(eventType: string) {
		return await this.findAll({
			filter: `eventType = '${eventType}'`,
			sort: '-eventDate'
		});
	}

	async findByDateRange(startDate: string, endDate: string) {
		return await this.findAll({
			filter: `eventDate >= '${startDate}' && eventDate <= '${endDate}'`,
			sort: 'eventDate'
		});
	}

	async findCompleted() {
		return await this.findAll({
			filter: `status = 'completed'`,
			sort: '-eventDate'
		});
	}
}
