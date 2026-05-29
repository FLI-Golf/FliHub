import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [events, eventTalent, eventPayments, tournaments, seasons, talent] = await Promise.all([
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
			pb.collection('talent').getFullList({ sort: 'name', fields: 'id,name,talentType,status,avatar' }).catch(() => [])
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
			events,
			eventTalent,
			eventPayments,
			tournaments,
			seasons,
			talent,
			stats: { totalEvents, scheduled, completed, totalBudget, totalPaid, totalPending, pendingApprovals, bonusEligible }
		};
	} catch (err: any) {
		console.error('events load error:', err?.message ?? err);
		return { events: [], eventTalent: [], eventPayments: [], tournaments: [], seasons: [], talent: [], stats: null };
	}
};
