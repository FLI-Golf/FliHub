import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

const INTEREST_ROLES = new Set(['pro', 'vendor', 'broadcaster']);
const MANAGE_ROLES = new Set(['admin', 'leader']);

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;

	try {
		const [events, eventTalent, eventPayments, tournaments, seasons, talent, userInterests] = await Promise.all([
		pb.collection('special_events').getFullList({
			sort: '-eventDate',
			expand: 'tournament,season'
		}).catch(() => []),
		pb.collection('event_talent').getFullList({
			expand: 'talent,event'
		}).catch(() => []),
		pb.collection('event_payments').getFullList({
			expand: 'talent,event'
		}).catch(() => []),
		pb.collection('tournaments').getFullList({ sort: '-created', fields: 'id,name,season' }).catch(() => []),
		pb.collection('seasons').getFullList({ sort: '-year', fields: 'id,name,year,status' }).catch(() => []),
		pb.collection('talent').getFullList({ sort: 'name', fields: 'id,name,talentType,status,avatar' }).catch(() => []),
		// Load user interests for opportunity roles
		INTEREST_ROLES.has(role)
			? pb.collection('event_interests').getFullList({
					filter: `user = "${userId}"`,
					fields: 'id,user,event,createdAt'
				}).catch(() => [])
			: Promise.resolve([])
	]);

		// Stats
		const totalEvents = (events as any[]).length;
		const scheduled = (events as any[]).filter(e => e.status === 'scheduled').length;
		const completed = (events as any[]).filter(e => e.status === 'completed').length;
		const totalBudget = (events as any[]).reduce((s, e) => s + (e.budget || 0), 0);
		const totalPaid = (eventPayments as any[]).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
		const totalPending = (eventPayments as any[]).filter(p => ['pending', 'approval_required', 'approved'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0);
		const pendingApprovals = (eventPayments as any[]).filter(p => p.status === 'approval_required').length;

		// Bonus eligibility: talent who attended >= bonusThreshold events in a season
		const bonusEligible = (eventTalent as any[]).filter(et => et.bonusEligible && !et.bonusEarned).length;

		return {
			userProfile,
			role,
			canManage: MANAGE_ROLES.has(role),
			events,
			eventTalent,
			eventPayments,
			tournaments,
			seasons,
			talent,
			userInterests,
			stats: { totalEvents, scheduled, completed, totalBudget, totalPaid, totalPending, pendingApprovals, bonusEligible }
		};
	} catch (err: any) {
		console.error('events load error:', err?.message ?? err);
		return { events: [], eventTalent: [], eventPayments: [], tournaments: [], seasons: [], talent: [], userInterests: [], stats: null };
	}
};

export const actions: Actions = {
	showInterest: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		const { pb, userId, role } = ctx;

		if (!INTEREST_ROLES.has(role)) {
			return fail(403, { message: 'Only pros, vendors, and broadcasters can show interest in events' });
		}

		const formData = await request.formData();
		const eventId = formData.get('eventId') as string;

		if (!eventId) {
			return fail(400, { message: 'Event ID is required' });
		}

		try {
			// Check if interest already exists
			const existing = await pb
				.collection('event_interests')
				.getFullList({
					filter: `user = "${userId}" && event = "${eventId}"`
				})
				.catch(() => []);

			if (existing.length > 0) {
				// Remove interest (toggle off)
				await pb.collection('event_interests').delete(existing[0].id);
				return { success: true, interested: false };
			} else {
				// Add interest
				await pb.collection('event_interests').create({
					user: userId,
					event: eventId,
					createdAt: new Date().toISOString()
				});
				return { success: true, interested: true };
			}
		} catch (err: any) {
			console.error('showInterest error:', err?.message ?? err);
			return fail(500, { message: 'Failed to update interest' });
		}
	}
};
