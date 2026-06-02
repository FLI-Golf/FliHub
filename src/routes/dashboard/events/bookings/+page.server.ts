import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

const BOOKING_ROLES = ['celebrity_appearance', 'music_act'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [events, eventTalent, eventPayments, talent] = await Promise.all([
			pb.collection('special_events').getFullList({
				sort: '-eventDate',
				expand: 'tournament,season'
			}).catch(() => []),
			pb.collection('event_talent').getFullList({
				filter: BOOKING_ROLES.map((role) => `role = '${role}'`).join(' || '),
				expand: 'talent,event',
				sort: '-created'
			}).catch(() => []),
			pb.collection('event_payments').getFullList({
				expand: 'talent,event,eventTalent',
				sort: '-created'
			}).catch(() => []),
			pb.collection('talent').getFullList({
				sort: 'name',
				fields: 'id,name,talentType,status,avatar,managerCutPercentage,managerName,managerEmail'
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

		return {
			events,
			eventTalent,
			eventPayments: bookingPayments,
			talent,
			stats: {
				totalBookings: (eventTalent as any[]).length,
				celebrityBookings: (eventTalent as any[]).filter((booking) => booking.role === 'celebrity_appearance').length,
				musicBookings: (eventTalent as any[]).filter((booking) => booking.role === 'music_act').length,
				totalFees,
				paidFees,
				pendingFees,
				invited: (eventTalent as any[]).filter((booking) => booking.status === 'invited').length,
				confirmed: (eventTalent as any[]).filter((booking) => booking.status === 'confirmed').length
			}
		};
	} catch (err: any) {
		console.error('event bookings load error:', err?.message ?? err);
		return { events: [], eventTalent: [], eventPayments: [], talent: [], stats: null };
	}
};
