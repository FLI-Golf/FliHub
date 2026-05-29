import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [event, eventTalent, eventPayments, eventTasks, allTalent] = await Promise.all([
			pb.collection('special_events').getOne(params.id, { expand: 'tournament,season' }),
			pb.collection('event_talent').getFullList({
				filter: `event = '${params.id}'`,
				expand: 'talent',
				sort: 'created'
			}).catch(() => []),
			pb.collection('event_payments').getFullList({
				filter: `event = '${params.id}'`,
				expand: 'talent,eventTalent',
				sort: '-created'
			}).catch(() => []),
			pb.collection('event_tasks').getFullList({
				filter: `event = '${params.id}'`,
				expand: 'assignedTo',
				sort: 'created'
			}).catch(() => []),
			pb.collection('talent').getFullList({ sort: 'name', fields: 'id,name,talentType,status,avatar,managerCutPercentage,managerName,managerEmail' }).catch(() => [])
		]);

		// Payment summary
		const totalPaid = (eventPayments as any[]).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
		const totalPending = (eventPayments as any[]).filter(p => ['pending', 'approval_required', 'approved'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0);

		// Task summary
		const tasksDone = (eventTasks as any[]).filter(t => t.status === 'completed').length;
		const tasksTotal = (eventTasks as any[]).length;
		const taskBudget = (eventTasks as any[]).reduce((s, t) => s + (t.estimatedCost || 0), 0);
		const taskActual = (eventTasks as any[]).reduce((s, t) => s + (t.actualCost || 0), 0);

		return {
			event,
			eventTalent,
			eventPayments,
			eventTasks,
			allTalent,
			summary: { totalPaid, totalPending, tasksDone, tasksTotal, taskBudget, taskActual }
		};
	} catch (err: any) {
		throw error(404, 'Event not found');
	}
};
