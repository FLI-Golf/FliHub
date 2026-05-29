import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;
	try {
	
		const [departments, userProfiles, projects, expenses, reimbClaims, goalTasks, campaigns] = await Promise.all([
			pb.collection('departments').getFullList({ sort: 'name', expand: 'headOfDepartment' }).catch(() => []),
			pb.collection('user_profiles').getFullList({ sort: 'firstName,lastName' }).catch(() => []),
			pb.collection('projects').getFullList({ fields: 'id,department,project_budget,status,campaignId' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,taskId,sourceType,sourceId' }).catch(() => []),
			pb.collection('reimbursement_claims').getFullList({ fields: 'id,totalAmount,status,department' }).catch(() => []),
			// Goal tasks that have an expense created — needed to attribute spend to a department
			pb.collection('goal_tasks').getFullList({ fields: 'id,goalId,estimatedCost,actualCost,status,expenseId' }).catch(() => []),
			pb.collection('campaigns').getFullList({ fields: 'id,goalId' }).catch(() => []),
		]);

		// Tasks to resolve expense → project → department
		const tasks = await pb.collection('tasks').getFullList({ fields: 'id,projectId' }).catch(() => []);
		const taskToProject: Record<string, string> = {};
		for (const t of tasks as any[]) taskToProject[t.id] = t.projectId;

		const projectToDept: Record<string, string> = {};
		const allocatedByDept: Record<string, number> = {};
		const projectCountByDept: Record<string, number> = {};
		const activeProjectsByDept: Record<string, number> = {};

		// Build campaign → project map (for goal_task → goal → campaign → project → dept chain)
		const campaignToProject: Record<string, string> = {};
		for (const p of projects as any[]) {
			if (!p.department) continue;
			projectToDept[p.id] = p.department;
			allocatedByDept[p.department] = (allocatedByDept[p.department] ?? 0) + (p.project_budget ?? 0);
			projectCountByDept[p.department] = (projectCountByDept[p.department] ?? 0) + 1;
			if (p.status === 'in_progress') activeProjectsByDept[p.department] = (activeProjectsByDept[p.department] ?? 0) + 1;
			if (p.campaignId) campaignToProject[p.campaignId] = p.id;
		}

		// goal → campaign map (a campaign has a goalId field pointing to the goal)
		const goalToCampaign: Record<string, string> = {};
		for (const c of campaigns as any[]) {
			if (c.goalId) goalToCampaign[c.goalId] = c.id;
		}

		// goal_task → department resolution:
		// goal_task.goalId → goalToCampaign → campaignToProject → projectToDept
		const goalTaskToDept: Record<string, string> = {};
		for (const gt of goalTasks as any[]) {
			if (!gt.goalId) continue;
			const campaignId = goalToCampaign[gt.goalId];
			if (!campaignId) continue;
			const projectId = campaignToProject[campaignId];
			if (!projectId) continue;
			const deptId = projectToDept[projectId];
			if (deptId) goalTaskToDept[gt.id] = deptId;
		}

		// Expense totals per department — covers both project-task expenses and goal-task expenses
		const expensesByDept: Record<string, { total: number; paid: number; pending: number }> = {};

		function addExpenseToDept(deptId: string, e: any) {
			if (!expensesByDept[deptId]) expensesByDept[deptId] = { total: 0, paid: 0, pending: 0 };
			expensesByDept[deptId].total += e.amount ?? 0;
			if (e.status === 'paid') expensesByDept[deptId].paid += e.amount ?? 0;
			if (e.status === 'submitted' || e.status === 'approved') expensesByDept[deptId].pending += e.amount ?? 0;
		}

		for (const e of expenses as any[]) {
			if (e.sourceType === 'goal_task' && e.sourceId) {
				// Route via goal_task → goal → campaign → project → dept
				const deptId = goalTaskToDept[e.sourceId];
				if (deptId) addExpenseToDept(deptId, e);
			} else if (e.taskId) {
				// Standard route: expense → task → project → dept
				const projectId = taskToProject[e.taskId];
				const deptId = projectId ? projectToDept[projectId] : null;
				if (deptId) addExpenseToDept(deptId, e);
			}
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
