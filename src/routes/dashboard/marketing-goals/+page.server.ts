import { RequestContext } from '$lib/infra/RequestContext';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const actions: Actions = {
	updateProgress: async ({ locals, url, request }) => {
		const { pb } = await RequestContext.from(locals, url);
		const data = await request.formData();

		const id           = data.get('id') as string;
		const currentValue = parseFloat(data.get('currentValue') as string);
		const status       = data.get('status') as string;

		if (!id) return fail(400, { error: 'Missing goal id.' });

		try {
			const updated = await pb.collection('marketing_goals').update(id, {
				currentValue: isNaN(currentValue) ? 0 : currentValue,
				...(status ? { status } : {}),
			});
			return { success: true, updated };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Update failed.' });
		}
	}
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');
	const { pb } = ctx;

	const marketingGoals = await pb.collection('marketing_goals')
		.getFullList({ sort: 'goalName' })
		.catch(() => []);

	// Attach task counts per goal (non-fatal)
	const allTasks = await pb.collection('goal_tasks')
		.getFullList({ fields: 'goalId,status' })
		.catch(() => []);

	const taskCountByGoal: Record<string, { total: number; completed: number; needsApproval: number }> = {};
	for (const t of allTasks as any[]) {
		if (!taskCountByGoal[t.goalId]) taskCountByGoal[t.goalId] = { total: 0, completed: 0, needsApproval: 0 };
		taskCountByGoal[t.goalId].total++;
		if (t.status === 'completed') taskCountByGoal[t.goalId].completed++;
		if (t.status === 'needs_approval') taskCountByGoal[t.goalId].needsApproval++;
	}

	const goalsWithTasks = (marketingGoals as any[]).map(g => ({
		...g,
		taskCount: taskCountByGoal[g.id] ?? { total: 0, completed: 0, needsApproval: 0 }
	}));

	const stats = {
		total: marketingGoals.length,
		byStatus: {
			notStarted: marketingGoals.filter((g: any) => g.status === 'Not Started').length,
			inProgress: marketingGoals.filter((g: any) => g.status === 'In Progress').length,
			completed:  marketingGoals.filter((g: any) => g.status === 'Completed').length,
			onHold:     marketingGoals.filter((g: any) => g.status === 'On Hold').length
		},
		byCategory: {} as Record<string, number>,
		byPriority: {
			high:   marketingGoals.filter((g: any) => g.priority === 'High').length,
			medium: marketingGoals.filter((g: any) => g.priority === 'Medium').length,
			low:    marketingGoals.filter((g: any) => g.priority === 'Low').length
		}
	};
	for (const g of marketingGoals as any[]) {
		if (g.category) stats.byCategory[g.category] = (stats.byCategory[g.category] ?? 0) + 1;
	}

	return { marketingGoals: goalsWithTasks, stats };
};
