/**
 * PortholeProvider — server-side data provider for each role's porthole.
 *
 * Each concrete provider knows which PocketBase collections to query and
 * what data shape the porthole dashboard expects.
 *
 * Usage (in a +page.server.ts):
 *   const provider = PortholeProviderFactory.for(role, pb, userId, profile);
 *   const stats    = await provider.getStats();
 *   const items    = await provider.getPrimaryItems();
 */

// ── Abstract base ─────────────────────────────────────────────────────────────

export abstract class PortholeProvider {
	constructor(
		protected readonly pb:      any,
		protected readonly userId:  string,
		protected readonly profile: any,
	) {}

	/** KPI counts shown in the dashboard stat strip. */
	abstract getStats(): Promise<Record<string, number>>;

	/**
	 * The primary list of items shown on the dashboard card
	 * (tournaments for pro, leads for sales, projects for leader, etc.)
	 */
	abstract getPrimaryItems(): Promise<any[]>;

	// Shared helpers available to all providers
	protected async safeCount(collection: string, filter?: string): Promise<number> {
		try {
			const res = await this.pb.collection(collection).getList(1, 1, {
				filter: filter ?? '',
				fields: 'id',
			});
			return res.totalItems ?? 0;
		} catch {
			return 0;
		}
	}

	protected async safeList(collection: string, opts: Record<string, unknown> = {}): Promise<any[]> {
		try {
			return await this.pb.collection(collection).getFullList(opts);
		} catch {
			return [];
		}
	}
}

// ── Concrete providers ────────────────────────────────────────────────────────

export class ProPortholeProvider extends PortholeProvider {
	async getStats() {
		const today = new Date().toISOString().split('T')[0];
		const [tournaments, payments] = await Promise.allSettled([
			this.safeCount('tournaments', `(status = 'scheduled' || status = 'in_progress') && startDate >= '${today}'`),
			this.safeCount('pro_payments', `recipient = "${this.profile?.id ?? ''}" && status = 'paid'`),
		]);
		return {
			tournaments: tournaments.status === 'fulfilled' ? tournaments.value : 0,
			earnings:    payments.status    === 'fulfilled' ? payments.value    : 0,
		};
	}

	async getPrimaryItems() {
		const today = new Date().toISOString().split('T')[0];
		return this.safeList('tournaments', {
			filter:  `(status = 'scheduled' || status = 'in_progress') && startDate >= '${today}'`,
			sort:    'startDate',
			expand:  'seasonRef',
			perPage: 10,
		});
	}
}

export class LeaderPortholeProvider extends PortholeProvider {
	async getStats() {
		const deptId = this.profile?.departmentId ?? null;
		const deptFilter = deptId ? `department = "${deptId}"` : '';

		const [projects, tasks, expenses] = await Promise.allSettled([
			this.safeCount('projects',  deptFilter ? `status = "in_progress" && ${deptFilter}` : 'status = "in_progress"'),
			this.safeCount('tasks',     'status != "completed" && status != "cancelled"'),
			this.safeCount('expenses',  'status = "submitted"'),
		]);
		return {
			activeProjects: projects.status === 'fulfilled' ? projects.value : 0,
			openTasks:      tasks.status    === 'fulfilled' ? tasks.value    : 0,
			expenses:       expenses.status === 'fulfilled' ? expenses.value : 0,
		};
	}

	async getPrimaryItems() {
		const deptId = this.profile?.departmentId ?? null;
		const filter = deptId
			? `status = "in_progress" && department = "${deptId}"`
			: 'status = "in_progress"';
		return this.safeList('projects', {
			filter,
			sort:   'name',
			expand: 'department',
		});
	}
}

export class SalesPortholeProvider extends PortholeProvider {
	async getStats() {
		const [leads, opps, deals] = await Promise.allSettled([
			this.safeCount('franchise_leads',         'status != "closed_lost"'),
			this.safeCount('franchise_opportunities', 'stage != "closed_lost" && stage != "closed_won"'),
			this.safeCount('franchise_deals',         'status = "signed" || status = "active"'),
		]);
		return {
			leads:       leads.status === 'fulfilled' ? leads.value : 0,
			closedDeals: deals.status === 'fulfilled' ? deals.value : 0,
			pipeline:    opps.status  === 'fulfilled' ? opps.value  : 0,
		};
	}

	async getPrimaryItems() {
		return this.safeList('franchise_leads', {
			filter: 'status != "closed_lost"',
			sort:   '-created',
			expand: 'assignedTo',
		});
	}
}

export class FranchiseOwnerPortholeProvider extends PortholeProvider {
	async getStats() {
		const [franchises, territories, deals] = await Promise.allSettled([
			this.safeCount('franchises',           ''),
			this.safeCount('franchise_territories', ''),
			this.safeCount('franchise_deals',       'status = "active"'),
		]);
		return {
			franchises:  franchises.status  === 'fulfilled' ? franchises.value  : 0,
			territories: territories.status === 'fulfilled' ? territories.value : 0,
			deals:       deals.status       === 'fulfilled' ? deals.value       : 0,
		};
	}

	async getPrimaryItems() {
		return this.safeList('franchises', { sort: 'name' });
	}
}

export class BroadcasterPortholeProvider extends PortholeProvider {
	async getStats() {
		const today = new Date().toISOString().split('T')[0];
		const [tournaments, events] = await Promise.allSettled([
			this.safeCount('tournaments', `(status = 'scheduled' || status = 'in_progress') && startDate >= '${today}'`),
			this.safeCount('events',      'status != "cancelled"'),
		]);
		return {
			tournaments: tournaments.status === 'fulfilled' ? tournaments.value : 0,
			events:      events.status      === 'fulfilled' ? events.value      : 0,
		};
	}

	async getPrimaryItems() {
		const today = new Date().toISOString().split('T')[0];
		return this.safeList('tournaments', {
			filter: `(status = 'scheduled' || status = 'in_progress') && startDate >= '${today}'`,
			sort:   'startDate',
			expand: 'seasonRef',
		});
	}
}

export class ManagerPortholeProvider extends PortholeProvider {
	async getStats() {
		const [payments, tournaments] = await Promise.allSettled([
			this.safeCount('pro_payments', 'status = "pending"'),
			this.safeCount('tournaments',  'status = "scheduled" || status = "in_progress"'),
		]);
		return {
			payments:    payments.status    === 'fulfilled' ? payments.value    : 0,
			tournaments: tournaments.status === 'fulfilled' ? tournaments.value : 0,
		};
	}

	async getPrimaryItems() {
		return this.safeList('pro_payments', {
			sort:    '-created',
			expand:  'recipient,workOrder',
		});
	}
}

export class AdminPortholeProvider extends PortholeProvider {
	async getStats() {
		const [projects, sponsors, franchises, tasks] = await Promise.allSettled([
			this.safeCount('projects',   'status = "in_progress"'),
			this.safeCount('sponsors',   'status = "contracted" || status = "active"'),
			this.safeCount('franchises', ''),
			this.safeCount('tasks',      'status != "completed" && status != "cancelled"'),
		]);
		return {
			activeProjects: projects.status   === 'fulfilled' ? projects.value   : 0,
			sponsors:       sponsors.status   === 'fulfilled' ? sponsors.value   : 0,
			franchises:     franchises.status === 'fulfilled' ? franchises.value : 0,
			openTasks:      tasks.status      === 'fulfilled' ? tasks.value      : 0,
		};
	}

	async getPrimaryItems() {
		return this.safeList('projects', {
			filter: 'status = "in_progress"',
			sort:   'name',
			expand: 'department',
		});
	}
}

// ── Factory ───────────────────────────────────────────────────────────────────

type ProviderCtor = new (pb: any, userId: string, profile: any) => PortholeProvider;

const PROVIDER_MAP: Record<string, ProviderCtor> = {
	admin:           AdminPortholeProvider,
	leader:          LeaderPortholeProvider,
	sales:           SalesPortholeProvider,
	pro:             ProPortholeProvider,
	franchise_owner: FranchiseOwnerPortholeProvider,
	league_owner:    AdminPortholeProvider,   // league owner uses same provider as admin
	broadcaster:     BroadcasterPortholeProvider,
	manager:         ManagerPortholeProvider,
	vendor:          ProPortholeProvider,     // vendor uses basic stats (bid data added separately)
};

export class PortholeProviderFactory {
	static for(role: string, pb: any, userId: string, profile: any): PortholeProvider {
		const Ctor = PROVIDER_MAP[role] ?? AdminPortholeProvider;
		return new Ctor(pb, userId, profile);
	}
}
