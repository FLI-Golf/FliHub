import type PocketBase from 'pocketbase';
import { BaseRepo } from './BaseRepo';
import type { RecordModel } from 'pocketbase';

export interface ProPaymentRecord extends RecordModel {
	pro: string;
	paymentType: 'tournament' | 'special_event' | 'bonus' | 'other';
	tournament?: string;
	specialEvent?: string;
	amount: number;
	paymentDate?: string;
	dueDate?: string;
	status: 'pending' | 'processing' | 'paid' | 'cancelled';
	paymentMethod?: 'bank_transfer' | 'check' | 'paypal' | 'venmo' | 'zelle' | 'other';
	transactionId?: string;
	description?: string;
	notes?: string;
}

export class ProPaymentRepo extends BaseRepo<ProPaymentRecord> {
	constructor(pb: PocketBase) {
		super(pb, 'pro_payments');
	}

	async findByPro(proId: string) {
		return await this.findAll({
			filter: `pro = '${proId}'`,
			expand: 'tournament,specialEvent'
		});
	}

	async findPending() {
		return await this.findAll({
			filter: `status = 'pending'`,
			sort: 'dueDate',
			expand: 'pro,tournament,specialEvent'
		});
	}

	async findOverdue() {
		const today = new Date().toISOString().split('T')[0];
		return await this.findAll({
			filter: `status = 'pending' && dueDate < '${today}'`,
			sort: 'dueDate',
			expand: 'pro,tournament,specialEvent'
		});
	}

	async findByStatus(status: string) {
		return await this.findAll({
			filter: `status = '${status}'`,
			expand: 'pro,tournament,specialEvent'
		});
	}

	async findByTournament(tournamentId: string) {
		return await this.findAll({
			filter: `tournament = '${tournamentId}'`,
			sort: 'pro',
			expand: 'pro'
		});
	}

	async findBySpecialEvent(eventId: string) {
		return await this.findAll({
			filter: `specialEvent = '${eventId}'`,
			sort: 'pro',
			expand: 'pro'
		});
	}

	async getTotalPaid(proId: string): Promise<number> {
		const results = await this.findAll({
			filter: `pro = '${proId}' && status = 'paid'`,
			perPage: 500
		});
		return results.items.reduce((sum, payment) => sum + payment.amount, 0);
	}

	async getTotalPending(proId: string): Promise<number> {
		const results = await this.findAll({
			filter: `pro = '${proId}' && status = 'pending'`,
			perPage: 500
		});
		return results.items.reduce((sum, payment) => sum + payment.amount, 0);
	}
}
