import { RequestContext } from '$lib/infra/RequestContext';
import {
	buildCleanupHistory,
	buildInterestReviewCsv,
	buildInterestSummary
} from '$lib/server/interestReview';
import type { RequestHandler } from './$types';

const ADMIN_REVIEW_ROLES = new Set(['admin', 'leader']);

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	if (!ADMIN_REVIEW_ROLES.has(ctx.role)) {
		return new Response('Unauthorized', { status: 403 });
	}

	const { pb } = ctx;
	const [events, tournaments, eventInterests, tournamentInterests, cleanupHistoryRows, users, profiles] = await Promise.all([
		pb.collection('special_events').getFullList({
			sort: '-eventDate',
			fields: 'id,name,eventDate,location,status'
		}).catch(() => []),
		pb.collection('tournaments').getFullList({
			sort: '-startDate',
			fields: 'id,name,startDate,location,venue,status'
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
		pb.collection('users').getFullList({ fields: 'id,email,name' }).catch(() => []),
		pb.collection('user_profiles').getFullList({ fields: 'id,userId,role,firstName,lastName' }).catch(() => [])
	]);

	const userMap = Object.fromEntries((users as any[]).map((user: any) => [user.id, user]));
	const profileByUserId = Object.fromEntries((profiles as any[]).map((profile: any) => [profile.userId, profile]));
	const eventMap = Object.fromEntries((events as any[]).map((event: any) => [event.id, event]));
	const tournamentMap = Object.fromEntries((tournaments as any[]).map((tournament: any) => [tournament.id, tournament]));

	const eventInterestSummary = buildInterestSummary(eventInterests as any[], 'event', eventMap, userMap, profileByUserId);
	const tournamentInterestSummary = buildInterestSummary(tournamentInterests as any[], 'tournament', tournamentMap, userMap, profileByUserId);
	const cleanupHistory = buildCleanupHistory(cleanupHistoryRows as any[], userMap, profileByUserId);

	const csv = buildInterestReviewCsv({
		eventInterestSummary,
		tournamentInterestSummary,
		cleanupHistory
	});

	const stamp = new Date().toISOString().slice(0, 10);

	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="interest-review-${stamp}.csv"`
		}
	});
};