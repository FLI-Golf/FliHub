import { RequestContext } from '$lib/infra/RequestContext';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { TournamentRepo } from '$lib/infra/pocketbase/repositories';
import { fail } from '@sveltejs/kit';
import {
	calculateSeasonPurses,
	seasonConfigFromRecord,
} from '$lib/domain/services/PayoutCalculator';

const TOURNAMENT_VIEW_ROLES = new Set(['admin', 'leader', 'vendor', 'broadcaster']);
const TOURNAMENT_MANAGE_ROLES = new Set(['admin', 'leader']);
const TOURNAMENT_INTEREST_ROLES = new Set(['vendor', 'broadcaster']);

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	
	if (!TOURNAMENT_VIEW_ROLES.has(ctx.role)) {
		throw redirect(303, '/dashboard');
	}
	
	const { pb, role, userId } = ctx;
	const tournamentRepo = new TournamentRepo(pb);

	const seasonId = url.searchParams.get('season');
	const status   = url.searchParams.get('status');
	const sortParam = url.searchParams.get('sort') ?? '';

	const sortMap: Record<string, string> = {
		'number':  'tournamentNumber',
		'-number': '-tournamentNumber',
		'date':    'startDate',
		'-date':   '-startDate',
		'name':    'name',
		'-name':   '-name',
	};

	const sort = sortMap[sortParam] ?? 'startDate';

	try {
		// Load all season records
		const seasonRecords = await pb.collection('seasons').getFullList({ sort: '-year' });

		// Resolve active season record
		let activeSeasonRecord: any = null;
		if (seasonId) {
			activeSeasonRecord = seasonRecords.find((s: any) => s.id === seasonId) ?? null;
		}
		if (!activeSeasonRecord && seasonRecords.length > 0) {
			// Default to most recent (active first, then by year)
			activeSeasonRecord =
				seasonRecords.find((s: any) => s.status === 'active') ?? seasonRecords[0];
		}

		// Build filter
		const filters: string[] = [];
		if (seasonId) filters.push(`seasonRef = '${seasonId}'`);
		if (status)   filters.push(`status = '${status}'`);

		// Load tournaments
		const tournaments = await tournamentRepo.findAll({
			filter: filters.join(' && '),
			sort,
			expand: 'seasonRef',
			perPage: 100,
		});

		// Build purse schedule for the active season
		let seasonPurseSchedule: Array<{ tournamentNumber: number; totalPurse: number; mensPurse: number; womensPurse: number }> = [];
		let seasonBudget = 0;
		let seasonFranchiseCut = 0;
		let seasonProCut = 0;

		if (activeSeasonRecord) {
			const cfg = seasonConfigFromRecord(activeSeasonRecord);
			seasonBudget = cfg.totalSeasonBudget;
			seasonPurseSchedule = calculateSeasonPurses(cfg.totalSeasonBudget, cfg.numberOfTournaments);
			seasonFranchiseCut = seasonBudget * (cfg.franchiseCutPercentage / 100);
			seasonProCut = seasonBudget - seasonFranchiseCut;
		}

		const userInterests = TOURNAMENT_INTEREST_ROLES.has(role)
			? await pb.collection('tournament_interests').getFullList({
				filter: `user = "${userId}"`,
				fields: 'id,user,tournament,created'
			}).catch(() => [])
			: [];

		return {
			role,
			canManage: TOURNAMENT_MANAGE_ROLES.has(role),
			canShowInterest: TOURNAMENT_INTEREST_ROLES.has(role),
			userInterests,
			tournaments: tournaments.items,
			seasonRecords,
			activeSeasonRecord,
			currentSeasonId: seasonId ?? activeSeasonRecord?.id ?? null,
			currentStatus: status,
			currentSort: sortParam,
			seasonBudget,
			seasonFranchiseCut,
			seasonProCut,
			seasonPurseSchedule,
		};
	} catch (err) {
		console.error('Error loading tournaments:', err);
		return {
			role: ctx.role,
			canManage: TOURNAMENT_MANAGE_ROLES.has(ctx.role),
			canShowInterest: TOURNAMENT_INTEREST_ROLES.has(ctx.role),
			userInterests: [],
			tournaments: [],
			seasonRecords: [],
			activeSeasonRecord: null,
			currentSeasonId: null,
			currentStatus: null,
			currentSort: null,
			seasonBudget: 0,
			seasonFranchiseCut: 0,
			seasonProCut: 0,
			seasonPurseSchedule: [],
		};
	}
};

export const actions: Actions = {
	showInterest: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const { pb, role, userId } = ctx;

		if (!TOURNAMENT_INTEREST_ROLES.has(role)) {
			return fail(403, { error: 'Only vendors and broadcasters can show interest in tournaments' });
		}

		const fd = await request.formData();
		const tournamentId = String(fd.get('tournamentId') ?? '');

		if (!tournamentId) {
			return fail(400, { error: 'Tournament is required' });
		}

		try {
			const existing = await pb.collection('tournament_interests').getFullList({
				filter: `user = "${userId}" && tournament = "${tournamentId}"`,
				fields: 'id'
			}).catch(() => []);

			if (existing[0]?.id) {
				await pb.collection('tournament_interests').delete(existing[0].id);
				return { success: true, interested: false };
			}

			await pb.collection('tournament_interests').create({
				user: userId,
				tournament: tournamentId,
			});

			return { success: true, interested: true };
		} catch (err: any) {
			return fail(400, { error: err.message });
		}
	},

	// ── Season CRUD ───────────────────────────────────────────────────────────
	createSeason: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		try {
			const record = await pb.collection('seasons').create({
				name:                   fd.get('name') as string,
				year:                   parseInt(fd.get('year') as string),
				totalBudget:            parseFloat(fd.get('totalBudget') as string),
				numberOfTournaments:    parseInt(fd.get('numberOfTournaments') as string),
				franchiseCutPercentage: parseFloat(fd.get('franchiseCutPercentage') as string) || 0,
				numberOfPlacements:     parseInt(fd.get('numberOfPlacements') as string) || 12,
				status:                 (fd.get('status') as string) || 'upcoming',
				notes:                  fd.get('notes') as string,
			});
			return { success: true, record };
		} catch (err: any) {
			return fail(400, { error: err.message });
		}
	},

	updateSeason: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const id = fd.get('id') as string;
		try {
			const record = await pb.collection('seasons').update(id, {
				name:                   fd.get('name') as string,
				year:                   parseInt(fd.get('year') as string),
				totalBudget:            parseFloat(fd.get('totalBudget') as string),
				numberOfTournaments:    parseInt(fd.get('numberOfTournaments') as string),
				franchiseCutPercentage: parseFloat(fd.get('franchiseCutPercentage') as string) || 0,
				numberOfPlacements:     parseInt(fd.get('numberOfPlacements') as string) || 12,
				status:                 fd.get('status') as string,
				notes:                  fd.get('notes') as string,
			});
			return { success: true, record };
		} catch (err: any) {
			return fail(400, { error: err.message });
		}
	},

	deleteSeason: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const id = fd.get('id') as string;
		try {
			await pb.collection('seasons').delete(id);
			return { success: true };
		} catch (err: any) {
			return fail(400, { error: err.message });
		}
	},

	// ── Tournament CRUD ───────────────────────────────────────────────────────
	create: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const seasonRefVal = formData.get('seasonRef') as string;
		const data = {
			name:             formData.get('name') as string,
			season:           parseInt(formData.get('season') as string),
			seasonRef:        seasonRefVal || undefined,
			tournamentNumber: formData.get('tournamentNumber') ? parseInt(formData.get('tournamentNumber') as string) : undefined,
			startDate:        formData.get('startDate') as string,
			endDate:          formData.get('endDate') as string,
			location:         formData.get('location') as string,
			venue:            formData.get('venue') as string,
			prizePool:        parseFloat(formData.get('prizePool') as string),
			status:           (formData.get('status') as string) || 'scheduled',
			description:      formData.get('description') as string,
			notes:            formData.get('notes') as string,
		};
		try {
			const tournament = await pb.collection('tournaments').create(data);
			return { success: true, tournament };
		} catch (error: any) {
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const seasonRefVal = formData.get('seasonRef') as string;
		const data = {
			name:             formData.get('name') as string,
			season:           parseInt(formData.get('season') as string),
			seasonRef:        seasonRefVal || undefined,
			tournamentNumber: formData.get('tournamentNumber') ? parseInt(formData.get('tournamentNumber') as string) : undefined,
			startDate:        formData.get('startDate') as string,
			endDate:          formData.get('endDate') as string,
			location:         formData.get('location') as string,
			venue:            formData.get('venue') as string,
			prizePool:        parseFloat(formData.get('prizePool') as string),
			status:           formData.get('status') as string,
			description:      formData.get('description') as string,
			notes:            formData.get('notes') as string,
		};
		try {
			const tournament = await pb.collection('tournaments').update(id, data);
			return { success: true, tournament };
		} catch (error: any) {
			return fail(400, { error: error.message });
		}
	},

	bulkUpdateLocation: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const seasonId = fd.get('seasonId') as string;
		const location = fd.get('location') as string;
		const venue    = fd.get('venue') as string;
		try {
			const tournaments = await pb.collection('tournaments').getFullList({
				filter: `seasonRef = '${seasonId}'`,
			});
			await Promise.all(
				tournaments.map((t: any) =>
					pb.collection('tournaments').update(t.id, { location, venue })
				)
			);
			return { success: true, updated: tournaments.length };
		} catch (err: any) {
			return fail(400, { error: err.message });
		}
	},

	delete: async ({ request, locals }) => {
		const pb = locals.pb;
		const formData = await request.formData();
		const id = formData.get('id') as string;

		try {
			await pb.collection('tournaments').delete(id);
			return { success: true };
		} catch (error: any) {
			console.error('Error deleting tournament:', error);
			return fail(400, { error: error.message });
		}
	}
};
