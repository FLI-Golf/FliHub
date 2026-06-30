import { RequestContext } from '$lib/infra/RequestContext';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	buildCleanupHistory,
	buildInterestSummary,
	detectDuplicateGroups
} from '$lib/server/interestReview';

const BOOKING_ROLES = ['player', 'other', 'celebrity_appearance', 'music_act'];
const ADMIN_REVIEW_ROLES = new Set(['admin', 'leader']);

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	if (!ADMIN_REVIEW_ROLES.has(ctx.role)) {
		throw redirect(303, '/dashboard');
	}
	const { pb } = ctx;
	const bookingFilter = BOOKING_ROLES.map((role) => `role = '${role}'`).join(' || ');

	const loadEventTalent = () => pb.collection('event_talent').getFullList({
		filter: bookingFilter,
		expand: 'talent,talentGroup,event',
		sort: '-created'
	}).catch(() => pb.collection('event_talent').getFullList({
		filter: bookingFilter,
		expand: 'talent,event',
		sort: '-created'
	}).catch(() => []));

	const loadEventPayments = () => pb.collection('event_payments').getFullList({
		expand: 'talent,talentGroup,event,eventTalent',
		sort: '-created'
	}).catch(() => pb.collection('event_payments').getFullList({
		expand: 'talent,event,eventTalent',
		sort: '-created'
	}).catch(() => []));

	try {
		const [events, eventTalent, eventPayments, talent, talentGroups, eventInterests, tournamentInterests, cleanupHistoryRows, users, profiles, tournaments] = await Promise.all([
			pb.collection('special_events').getFullList({
				sort: '-eventDate',
				expand: 'tournament,season'
			}).catch(() => []),
			loadEventTalent(),
			loadEventPayments(),
			pb.collection('talent').getFullList({
				sort: 'name',
				fields: 'id,name,talentType,status,avatar,managerCutPercentage,managerName,managerEmail'
			}).catch(() => []),
			pb.collection('talent_groups').getFullList({
				sort: 'name',
				expand: 'members'
			}).catch(() => []),
			pb.collection('event_interests').getFullList({
				sort: '-created',
				expand: 'user,event'
			}).catch(() => []),
			pb.collection('tournament_interests').getFullList({
				sort: '-created',
				expand: 'user,tournament'
			}).catch(() => []),
			pb.collection('interest_cleanup_history').getFullList({
				sort: '-created',
				expand: 'performedBy'
			}).catch(() => []),
			pb.collection('users').getFullList({
				fields: 'id,email,name'
			}).catch(() => []),
			pb.collection('user_profiles').getFullList({
				fields: 'id,userId,role,firstName,lastName'
			}).catch(() => []),
			pb.collection('tournaments').getFullList({
				sort: '-startDate',
				fields: 'id,name,startDate,endDate,location,venue,status,tournamentNumber,season'
			}).catch(() => [])
		]);

		const bookingIds = new Set((eventTalent as any[]).map((booking) => booking.id));
		const bookingPayments = (eventPayments as any[]).filter((payment) => bookingIds.has(payment.eventTalent));
		const totalFees = (eventTalent as any[]).reduce((sum, booking) => sum + (booking.confirmedRate ?? 0), 0);
		const paidFees = bookingPayments
			.filter((payment) => payment.status === 'paid')
			.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
		const pendingFees = bookingPayments
			.filter((payment) => ['pending', 'approval_required', 'approved'].includes(payment.status))
			.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

		const userMap = Object.fromEntries((users as any[]).map((user: any) => [user.id, user]));
		const profileByUserId = Object.fromEntries((profiles as any[]).map((profile: any) => [profile.userId, profile]));
		const eventMap = Object.fromEntries((events as any[]).map((event: any) => [event.id, event]));
		const tournamentMap = Object.fromEntries((tournaments as any[]).map((tournament: any) => [tournament.id, tournament]));

		const eventInterestSummary = buildInterestSummary(eventInterests as any[], 'event', eventMap, userMap, profileByUserId);
		const tournamentInterestSummary = buildInterestSummary(tournamentInterests as any[], 'tournament', tournamentMap, userMap, profileByUserId);
		const duplicateReport = {
			event: detectDuplicateGroups(eventInterests as any[], 'event'),
			tournament: detectDuplicateGroups(tournamentInterests as any[], 'tournament')
		};
		const cleanupHistory = buildCleanupHistory(cleanupHistoryRows as any[], userMap, profileByUserId);

		return {
			events,
			eventTalent,
			eventPayments: bookingPayments,
			talent,
			talentGroups,
			eventInterestSummary,
			tournamentInterestSummary,
			duplicateReport,
			cleanupHistory,
			stats: {
				totalBookings: (eventTalent as any[]).length,
				celebrityBookings: (eventTalent as any[]).filter((booking) => ['celebrity_appearance', 'player'].includes(booking.role)).length,
				musicBookings: (eventTalent as any[]).filter((booking) => ['music_act', 'other'].includes(booking.role)).length,
				totalFees,
				paidFees,
				pendingFees,
				invited: (eventTalent as any[]).filter((booking) => booking.status === 'invited').length,
				confirmed: (eventTalent as any[]).filter((booking) => booking.status === 'confirmed').length
			}
		};
	} catch (err: any) {
		console.error('event bookings load error:', err?.message ?? err);
		return {
			events: [],
			eventTalent: [],
			eventPayments: [],
			talent: [],
			talentGroups: [],
			eventInterestSummary: [],
			tournamentInterestSummary: [],
			duplicateReport: {
				event: { groupCount: 0, duplicateRowCount: 0, groups: [] },
				tournament: { groupCount: 0, duplicateRowCount: 0, groups: [] }
			},
			cleanupHistory: [],
			stats: null
		};
	}
};

export const actions: Actions = {
	mergeDuplicateInterests: async ({ locals, url, request }) => {
		const ctx = await RequestContext.from(locals, url);
		if (!ADMIN_REVIEW_ROLES.has(ctx.role)) {
			return fail(403, { cleanupResult: null, cleanupError: 'Unauthorized' });
		}

		const formData = await request.formData();
		const scope = String(formData.get('scope') ?? 'all');

		const mergeCollection = async (
			collectionName: 'event_interests' | 'tournament_interests',
			key: 'event' | 'tournament'
		) => {
			const rows = await ctx.pb.collection(collectionName).getFullList({ sort: '-created' }).catch(() => []);
			const report = detectDuplicateGroups(rows as any[], key);
			const deleteIds = report.groups.flatMap((group) => group.removeIds);

			await Promise.all(deleteIds.map((id) => ctx.pb.collection(collectionName).delete(id)));

			return {
				groupsMerged: report.groupCount,
				rowsDeleted: deleteIds.length
			};
		};

		try {
			const eventResult = scope === 'tournament'
				? { groupsMerged: 0, rowsDeleted: 0 }
				: await mergeCollection('event_interests', 'event');
			const tournamentResult = scope === 'event'
				? { groupsMerged: 0, rowsDeleted: 0 }
				: await mergeCollection('tournament_interests', 'tournament');

			const cleanupResult = {
				scope,
				event: eventResult,
				tournament: tournamentResult,
				totalGroupsMerged: eventResult.groupsMerged + tournamentResult.groupsMerged,
				totalRowsDeleted: eventResult.rowsDeleted + tournamentResult.rowsDeleted
			};

			await ctx.pb.collection('interest_cleanup_history').create({
				scope,
				eventGroupsMerged: eventResult.groupsMerged,
				eventRowsDeleted: eventResult.rowsDeleted,
				tournamentGroupsMerged: tournamentResult.groupsMerged,
				tournamentRowsDeleted: tournamentResult.rowsDeleted,
				totalGroupsMerged: cleanupResult.totalGroupsMerged,
				totalRowsDeleted: cleanupResult.totalRowsDeleted,
				performedBy: ctx.userId
			}).catch(() => null);

			return {
				cleanupError: null,
				cleanupResult
			};
		} catch (err: any) {
			console.error('mergeDuplicateInterests error:', err?.message ?? err);
			return fail(500, {
				cleanupResult: null,
				cleanupError: err?.message ?? 'Failed to merge duplicates'
			});
		}
	}
};
