import { json } from '@sveltejs/kit';
import { requireAdminNonProductionApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const guard = await requireAdminNonProductionApi(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	const results: Record<string, number> = {
		work_orders: 0, approvals: 0, expenses: 0,
		tasks_cleared: 0, projects_cleared: 0, departments_cleared: 0,
	};
	const errors: string[] = [];

	try {
		// 1. Delete all work_orders
		const workOrders = await pb.collection('work_orders').getFullList({ fields: 'id' }).catch(() => []);
		for (const wo of workOrders as any[]) {
			await pb.collection('work_orders').delete(wo.id).catch((e: any) => errors.push(`wo ${wo.id}: ${e.message}`));
			results.work_orders++;
		}

		// 2. Delete all approvals
		const approvals = await pb.collection('approvals').getFullList({ fields: 'id' }).catch(() => []);
		for (const a of approvals as any[]) {
			await pb.collection('approvals').delete(a.id).catch((e: any) => errors.push(`approval ${a.id}: ${e.message}`));
			results.approvals++;
		}

		// 3. Delete all expenses
		const expenses = await pb.collection('expenses').getFullList({ fields: 'id' }).catch(() => []);
		for (const e of expenses as any[]) {
			await pb.collection('expenses').delete(e.id).catch((err: any) => errors.push(`expense ${e.id}: ${err.message}`));
			results.expenses++;
		}

		// 4. Clear needs_review on all tasks
		const tasks = await pb.collection('tasks').getFullList({ fields: 'id,needs_review' }).catch(() => []);
		for (const t of tasks as any[]) {
			if (t.needs_review) {
				await pb.collection('tasks').update(t.id, { needs_review: false }).catch((e: any) => errors.push(`task ${t.id}: ${e.message}`));
				results.tasks_cleared++;
			}
		}

		// 5. Zero project_actual_expenses
		const projects = await pb.collection('projects').getFullList({ fields: 'id,project_actual_expenses' }).catch(() => []);
		for (const p of projects as any[]) {
			if ((p.project_actual_expenses ?? 0) > 0) {
				await pb.collection('projects').update(p.id, { project_actual_expenses: 0 }).catch((e: any) => errors.push(`project ${p.id}: ${e.message}`));
				results.projects_cleared++;
			}
		}

		// 6. Zero department_actual_expenses
		const depts = await pb.collection('departments').getFullList({ fields: 'id,department_actual_expenses' }).catch(() => []);
		for (const d of depts as any[]) {
			if ((d.department_actual_expenses ?? 0) > 0) {
				await pb.collection('departments').update(d.id, { department_actual_expenses: 0 }).catch((e: any) => errors.push(`dept ${d.id}: ${e.message}`));
				results.departments_cleared++;
			}
		}

		return json({ success: true, results, errors: errors.length ? errors : undefined });
	} catch (error: any) {
		return json({ error: 'Reset failed', details: error.message }, { status: 500 });
	}
};
