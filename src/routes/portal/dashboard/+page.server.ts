import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { TournamentRepo } from '$lib/infra/pocketbase/repositories/TournamentRepo';

/** Load lightweight KPI counts that every porthole can display. */
export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { portalRole } = await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { stats: {}, tournaments: [] };

	try {
		const adminPb = await getAdminPocketBase();

		// ── Shared counts (cheap, filter-light) ──────────────────────────
		const [projectsRes, tasksRes, expensesRes] = await Promise.allSettled([
			adminPb.collection('projects').getList(1, 1, {
				filter: 'status = "in_progress"', fields: 'id',
			}),
			adminPb.collection('tasks').getList(1, 1, {
				filter: 'status != "completed" && status != "cancelled"', fields: 'id',
			}),
			adminPb.collection('expenses').getList(1, 1, {
				filter: 'status = "submitted"', fields: 'id',
			}),
		]);

		const activeProjects = projectsRes.status === 'fulfilled' ? projectsRes.value.totalItems : 0;
		const openTasks      = tasksRes.status === 'fulfilled'    ? tasksRes.value.totalItems    : 0;
		const expenses       = expensesRes.status === 'fulfilled' ? expensesRes.value.totalItems : 0;

		// ── Role-specific extras ──────────────────────────────────────────
		const extra: Record<string, number> = {};

		if (['admin', 'league_owner'].includes(portalRole)) {
			const [sponsorsRes, franchisesRes] = await Promise.allSettled([
				adminPb.collection('sponsors').getList(1, 1, {
					filter: 'status = "contracted" || status = "active"', fields: 'id',
				}),
				adminPb.collection('franchises').getList(1, 1, { fields: 'id' }),
			]);
			extra.sponsors   = sponsorsRes.status   === 'fulfilled' ? sponsorsRes.value.totalItems   : 0;
			extra.franchises = franchisesRes.status === 'fulfilled' ? franchisesRes.value.totalItems : 0;
		}

		if (portalRole === 'sales') {
			const leadsRes = await adminPb.collection('franchise_interest').getList(1, 1, {
				filter: 'status != "closed"', fields: 'id',
			}).catch(() => ({ totalItems: 0 }));
			extra.leads = leadsRes.totalItems;
		}

		if (portalRole === 'vendor') {
			const profile    = ctx.profile as any;
			const vendorId   = profile?.vendorId ?? null;
			const [bidsRes, openProjRes] = await Promise.allSettled([
				vendorId
					? adminPb.collection('bids').getList(1, 1, { filter: `vendorId = "${vendorId}"`, fields: 'id' })
					: Promise.resolve({ totalItems: 0 }),
				adminPb.collection('projects').getList(1, 1, {
					filter: 'status = "in_progress" && openForBids = true', fields: 'id',
				}),
			]);
			extra.totalBids    = bidsRes.status === 'fulfilled'   ? (bidsRes.value as any).totalItems   : 0;
			extra.openProjects = openProjRes.status === 'fulfilled' ? openProjRes.value.totalItems : 0;
		}

		// ── Tournaments (pro, broadcaster, manager) ───────────────────────
		let tournaments: any[] = [];
		if (['pro', 'broadcaster', 'manager'].includes(portalRole)) {
			const repo = new TournamentRepo(adminPb);
			const today = new Date().toISOString().split('T')[0];

			const result = await repo.findAll({
				filter: `(status = 'scheduled' || status = 'in_progress') && startDate >= '${today}'`,
				sort: 'startDate',
				expand: 'seasonRef',
				perPage: 50,
			}).catch(() => ({ items: [] }));

			tournaments = result.items;
			extra.tournaments = tournaments.length;
		}

		return {
			stats: { activeProjects, openTasks, expenses, ...extra },
			tournaments,
		};
	} catch {
		return { stats: {}, tournaments: [] };
	}
};
