import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('marketing', 'marketing_lead', 'admin', 'leader');

	const adminPb = await getAdminPocketBase();

	const goals = await adminPb.collection('marketing_goals').getFullList({
		sort: '-created',
		perPage: 100,
	}).catch(() => []);

	// Fetch task counts per goal
	const allTasks = await adminPb.collection('goal_tasks').getFullList({
		fields: 'goalId,status',
		perPage: 500,
	}).catch(() => []);

	const taskCountByGoal: Record<string, { total: number; completed: number }> = {};
	for (const t of allTasks as any[]) {
		if (!taskCountByGoal[t.goalId]) taskCountByGoal[t.goalId] = { total: 0, completed: 0 };
		taskCountByGoal[t.goalId].total++;
		if (t.status === 'completed') taskCountByGoal[t.goalId].completed++;
	}

	return { goals, taskCountByGoal };
};
