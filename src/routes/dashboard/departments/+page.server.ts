import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;
	try {
	
		const [departments, userProfiles, projects, expenses, reimbClaims] = await Promise.all([
			pb.collection('departments').getFullList({ sort: 'name', expand: 'headOfDepartment' }).catch(() => []),
			pb.collection('user_profiles').getFullList({ sort: 'firstName,lastName' }).catch(() => []),
			pb.collection('projects').getFullList({ fields: 'id,department,project_budget,status' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,taskId' }).catch(() => []),
			pb.collection('reimbursement_claims').getFullList({ fields: 'id,totalAmount,status,department' }).catch(() => []),
		]);

		// Tasks to resolve expense → project → department
		const tasks = await pb.collection('tasks').getFullList({ fields: 'id,projectId' }).catch(() => []);
		const taskToProject: Record<string, string> = {};
		for (const t of tasks as any[]) taskToProject[t.id] = t.projectId;

		const projectToDept: Record<string, string> = {};
		const allocatedByDept: Record<string, number> = {};
		const projectCountByDept: Record<string, number> = {};
		const activeProjectsByDept: Record<string, number> = {};

		for (const p of projects as any[]) {
			if (!p.department) continue;
			projectToDept[p.id] = p.department;
			allocatedByDept[p.department] = (allocatedByDept[p.department] ?? 0) + (p.project_budget ?? 0);
			projectCountByDept[p.department] = (projectCountByDept[p.department] ?? 0) + 1;
			if (p.status === 'in_progress') activeProjectsByDept[p.department] = (activeProjectsByDept[p.department] ?? 0) + 1;
		}

		// Expense totals per department
		const expensesByDept: Record<string, { total: number; paid: number; pending: number }> = {};
		for (const e of expenses as any[]) {
			const projectId = taskToProject[e.taskId];
			const deptId = projectId ? projectToDept[projectId] : null;
			if (!deptId) continue;
			if (!expensesByDept[deptId]) expensesByDept[deptId] = { total: 0, paid: 0, pending: 0 };
			expensesByDept[deptId].total += e.amount ?? 0;
			if (e.status === 'paid') expensesByDept[deptId].paid += e.amount ?? 0;
			if (e.status === 'submitted' || e.status === 'approved') expensesByDept[deptId].pending += e.amount ?? 0;
		}

		// Reimbursement paid totals per department
		const reimbByDept: Record<string, number> = {};
		for (const c of reimbClaims as any[]) {
			if (!c.department || c.status !== 'paid') continue;
			reimbByDept[c.department] = (reimbByDept[c.department] ?? 0) + (c.totalAmount ?? 0);
		}

		return { departments, userProfiles, allocatedByDept, projectCountByDept, activeProjectsByDept, expensesByDept, reimbByDept };
	} catch (err: any) {
		console.error('departments load error:', err?.message ?? err);
		return {};
	}
};
