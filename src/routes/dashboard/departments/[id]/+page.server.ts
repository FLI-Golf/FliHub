import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { DepartmentRepo } from '$lib/infra/pocketbase/repositories/DepartmentRepo';
import { DepartmentController } from '$lib/domain/controllers/DepartmentController';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb = ctx.pb;
	const controller = new DepartmentController(new DepartmentRepo(pb));
	const result = await controller.getDetail(params.id);

	if (result.isFailure) throw error(404, result.error);

	const department = result.value;
	const projectIds: string[] = department.projects.map((p: any) => p.id);

	// ── Expense pipeline ──────────────────────────────────────────────────────
	// expenses have no projectId field — resolve via taskId → task.projectId
	let paid = 0, approved = 0, submitted = 0, draft = 0;
	const expensesByCategory: Record<string, number> = {};

	if (projectIds.length > 0) {
		// 1. Fetch all tasks for these projects
		const tasks = await pb.collection('tasks').getFullList({
			filter: projectIds.map(id => `projectId = "${id}"`).join(' || '),
			fields: 'id,projectId,task_budget,task_actual_cost'
		}).catch(() => []) as any[];

		const taskIds = tasks.map((t: any) => t.id);

		// 2. Fetch all expenses by taskId
		let allExpenses: any[] = [];
		if (taskIds.length > 0) {
			const BATCH = 6;
			const batches: string[][] = [];
			for (let i = 0; i < taskIds.length; i += BATCH) batches.push(taskIds.slice(i, i + BATCH));
			allExpenses = (await Promise.all(
				batches.map(ids =>
					pb.collection('expenses').getFullList({
						filter: ids.map(id => `taskId = "${id}"`).join(' || '),
						fields: 'id,amount,status,category,taskId'
					}).catch(() => [])
				)
			)).flat();
		}

		for (const e of allExpenses) {
			const amt = e.amount || 0;
			if (e.status === 'paid')      paid      += amt;
			else if (e.status === 'approved')  approved  += amt;
			else if (e.status === 'submitted') submitted += amt;
			else                               draft     += amt;
			expensesByCategory[e.category || 'other'] = (expensesByCategory[e.category || 'other'] || 0) + amt;
		}

		// 3. inTasks = sum of task budgets minus all expenses already logged
		// (budget allocated to tasks but not yet submitted as an expense)
		const taskBudgetTotal = tasks.reduce((s: number, t: any) => s + (t.task_budget || 0), 0);
		const totalExpensed = paid + approved + submitted + draft;
		var inTasks = Math.max(0, taskBudgetTotal - totalExpensed);
	} else {
		var inTasks = 0;
	}

	const allocatedBudget = department.metrics?.budget?.allocated ?? 0;
	const totalExpensed2 = paid + approved + submitted + draft;
	const unallocated = Math.max(0, allocatedBudget - totalExpensed2 - inTasks);
	const pct = (v: number) => allocatedBudget > 0 ? Math.min(100, (v / allocatedBudget) * 100) : 0;

	// Fetch tasks for all projects in this department
	let tasksByProject: Record<string, any[]> = {};
	if (projectIds.length > 0) {
		const allTasks = await pb.collection('tasks').getFullList({
			filter: projectIds.map(id => `projectId = "${id}"`).join(' || '),
			fields: 'id,title,status,priority,task_budget,task_actual_cost,projectId,needs_review,dueDate',
			sort: 'title'
		}).catch(() => []) as any[];

		for (const t of allTasks) {
			const pid = typeof t.projectId === 'object' ? t.projectId?.id : t.projectId;
			if (pid) {
				tasksByProject[pid] ??= [];
				tasksByProject[pid].push(t);
			}
		}
	}

	const userProfiles = await pb
		.collection('user_profiles')
		.getFullList({ sort: 'firstName,lastName' })
		.catch(() => []);

	return {
		department,
		userProfiles,
		tasksByProject,
		budgetRollup: {
			allocated:  allocatedBudget,
			paid,
			approved,
			submitted,
			draft,
			inTasks,
			unallocated,
			actual:     totalExpensed2,
			remaining:  Math.max(0, allocatedBudget - totalExpensed2),
			usedPct:    pct(totalExpensed2),
			pipelinePct: {
				paid:        pct(paid),
				approved:    pct(approved),
				submitted:   pct(submitted),
				inTasks:     pct(inTasks),
				unallocated: pct(unallocated),
			},
			expensesByCategory,
		}
	};
};
