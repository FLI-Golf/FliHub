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

	// Live budget rollup — sum all expenses across this department's projects
	// including talent_payment expenses auto-created from pro payments
	const projectIds = department.projects.map((p: any) => p.id);

	let liveActual = 0;
	let livePaid = 0;
	let livePending = 0;
	let talentPaymentTotal = 0;
	const expensesByCategory: Record<string, number> = {};

	if (projectIds.length > 0) {
		const BATCH = 4;
		const batches: string[][] = [];
		for (let i = 0; i < projectIds.length; i += BATCH) {
			batches.push(projectIds.slice(i, i + BATCH));
		}
		const allExpenses = (await Promise.all(
			batches.map(ids =>
				pb.collection('expenses').getFullList({
					filter: ids.map((id: string) => `project = "${id}"`).join(' || '),
					fields: 'id,amount,status,category'
				}).catch(() => [])
			)
		)).flat();

		for (const e of allExpenses) {
			const amt = e.amount || 0;
			liveActual += amt;
			if (e.status === 'paid') livePaid += amt;
			if (e.status === 'submitted' || e.status === 'approved') livePending += amt;
			if (e.category === 'talent_payment') talentPaymentTotal += amt;
			expensesByCategory[e.category || 'other'] = (expensesByCategory[e.category || 'other'] || 0) + amt;
		}
	}

	// Also include department-level expenses not tied to a project
	const deptExpenses = await pb.collection('expenses').getFullList({
		filter: `department = "${params.id}" && project = ""`,
		fields: 'id,amount,status,category'
	}).catch(() => []);

	for (const e of deptExpenses) {
		const amt = e.amount || 0;
		liveActual += amt;
		if (e.status === 'paid') livePaid += amt;
		if (e.status === 'submitted' || e.status === 'approved') livePending += amt;
		expensesByCategory[e.category || 'other'] = (expensesByCategory[e.category || 'other'] || 0) + amt;
	}

	const allocatedBudget = department.metrics?.budget?.allocated ?? 0;
	const remaining = allocatedBudget - liveActual;
	const usedPct = allocatedBudget > 0 ? Math.min(100, (liveActual / allocatedBudget) * 100) : 0;

	return {
		department,
		budgetRollup: {
			allocated: allocatedBudget,
			actual: liveActual,
			paid: livePaid,
			pending: livePending,
			remaining,
			usedPct,
			talentPaymentTotal,
			expensesByCategory
		}
	};
};
