import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const goal = await pb.collection('marketing_goals').getOne(params.id).catch(() => null);
	if (!goal) throw error(404, 'Marketing goal not found');

	// Load tasks with their linked approvals, expenses, work orders
	const tasks = await pb.collection('goal_tasks').getFullList({
		filter: `goalId = "${params.id}"`,
		sort:   'priority'
	}).catch(() => []);

	// Enrich tasks with linked record summaries (non-fatal)
	const enriched = await Promise.all(
		tasks.map(async (task: any) => {
			const [approval, expense, workOrder] = await Promise.all([
				task.approvalId
					? pb.collection('approvals').getOne(task.approvalId, { fields: 'id,status,requestedDate,reviewedDate,comments' }).catch(() => null)
					: null,
				task.expenseId
					? pb.collection('expenses').getOne(task.expenseId, { fields: 'id,title,amount,status' }).catch(() => null)
					: null,
				task.workOrderId
					? pb.collection('work_orders').getOne(task.workOrderId, { fields: 'id,title,status,workOrderNumber' }).catch(() => null)
					: null
			]);
			return { ...task, approval, expense, workOrder };
		})
	);

	// Stats
	const taskStats = {
		total:          enriched.length,
		todo:           enriched.filter((t: any) => t.status === 'todo').length,
		inProgress:     enriched.filter((t: any) => t.status === 'in_progress').length,
		needsApproval:  enriched.filter((t: any) => t.status === 'needs_approval').length,
		approved:       enriched.filter((t: any) => t.status === 'approved').length,
		expenseCreated: enriched.filter((t: any) => t.status === 'expense_created').length,
		workOrder:      enriched.filter((t: any) => t.status === 'work_order').length,
		completed:      enriched.filter((t: any) => t.status === 'completed').length,
		totalEstimated: enriched.reduce((s: number, t: any) => s + (t.estimatedCost ?? 0), 0),
		totalActual:    enriched.reduce((s: number, t: any) => s + (t.actualCost ?? 0), 0)
	};

	// User profiles for assignee dropdown
	const userProfiles = await pb.collection('user_profiles').getFullList({
		sort: 'firstName,lastName',
		fields: 'id,firstName,lastName,email'
	}).catch(() => []);

	return { goal, tasks: enriched, taskStats, userProfiles };
};
