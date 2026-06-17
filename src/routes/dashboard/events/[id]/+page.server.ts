import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;
	const belongsToEvent = (record: any) => {
		const direct = record?.event;
		const expandedId = record?.expand?.event?.id;
		return direct === params.id
			|| (Array.isArray(direct) && direct.includes(params.id))
			|| expandedId === params.id;
	};

	const loadEventTalent = async () => {
		const withExpand = await adminFetch('event_talent', {
			filter: `event = '${params.id}'`,
			expand: 'event,talent,talentGroup',
			sort: 'created',
			perPage: 500
		}).catch(() => null);
		if (withExpand && withExpand.length > 0) return withExpand;

		const withTalentExpand = await adminFetch('event_talent', {
			filter: `event = '${params.id}'`,
			expand: 'event,talent',
			sort: 'created',
			perPage: 500
		}).catch(() => null);
		if (withTalentExpand && withTalentExpand.length > 0) return withTalentExpand;

		const filtered = await adminFetch('event_talent', {
			filter: `event = '${params.id}'`,
			sort: 'created',
			perPage: 500
		}).catch(() => null);
		if (filtered && filtered.length > 0) return filtered;

		const all = await adminFetch('event_talent', {
			expand: 'event,talent,talentGroup',
			sort: 'created',
			perPage: 500
		}).catch(() => []);
		return (all as any[]).filter((row: any) => belongsToEvent(row));
	};

	const loadEventPayments = async () => {
		const withExpand = await adminFetch('event_payments', {
			filter: `event = '${params.id}'`,
			expand: 'event,talent,talentGroup,eventTalent',
			sort: '-created',
			perPage: 500
		}).catch(() => null);
		if (withExpand && withExpand.length > 0) return withExpand;

		const withLegacyExpand = await adminFetch('event_payments', {
			filter: `event = '${params.id}'`,
			expand: 'event,talent,eventTalent',
			sort: '-created',
			perPage: 500
		}).catch(() => null);
		if (withLegacyExpand && withLegacyExpand.length > 0) return withLegacyExpand;

		const filtered = await adminFetch('event_payments', {
			filter: `event = '${params.id}'`,
			sort: '-created',
			perPage: 500
		}).catch(() => null);
		if (filtered && filtered.length > 0) return filtered;

		const all = await adminFetch('event_payments', {
			expand: 'event,talent,talentGroup,eventTalent',
			sort: '-created',
			perPage: 500
		}).catch(() => []);
		return (all as any[]).filter((row: any) => belongsToEvent(row));
	};

	try {
		const [event, eventTalent, eventPayments, eventTasks, allTalent] = await Promise.all([
			pb.collection('special_events').getOne(params.id, { expand: 'tournament,season' }),
			loadEventTalent(),
			loadEventPayments(),
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
