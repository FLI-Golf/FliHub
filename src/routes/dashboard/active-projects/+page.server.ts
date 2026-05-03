import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [projects, departments, tasks, expenses, sponsors, franchiseLeads] = await Promise.all([
			pb.collection('projects').getFullList({ filter: "status='in_progress'", sort: 'name' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,description,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('tasks').getFullList({ fields: 'id,name,status,projectId,task_actual_cost,task_budget,dueDate,assignedTo' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,project,description,created' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,name,status,tier,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,name,status,created' }).catch(() => []),
		]);

		const deptMap = Object.fromEntries((departments as any[]).map(d => [d.id, d]));

		// Task rollup per project
		const tasksByProject: Record<string, any[]> = {};
		for (const t of tasks as any[]) {
			if (t.projectId) {
				tasksByProject[t.projectId] ??= [];
				tasksByProject[t.projectId].push(t);
			}
		}

		// Expense rollup per project
		const expensesByProject: Record<string, any[]> = {};
		for (const e of expenses as any[]) {
			if (e.project) {
				expensesByProject[e.project] ??= [];
				expensesByProject[e.project].push(e);
			}
		}

		const enriched = (projects as any[]).map(p => {
			const dept = deptMap[p.department] ?? null;
			const ptasks = tasksByProject[p.id] ?? [];
			const pexpenses = expensesByProject[p.id] ?? [];

			const taskTotal = ptasks.length;
			const taskDone  = ptasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
			const taskOpen  = ptasks.filter((t: any) => t.status !== 'completed' && t.status !== 'done' && t.status !== 'cancelled').length;

			const actualSpend = ptasks.reduce((s: number, t: any) => s + (t.task_actual_cost ?? 0), 0)
				|| p.project_actual_expenses || 0;
			const budget = p.project_budget || 0;
			const spendPct = budget > 0 ? Math.min(100, (actualSpend / budget) * 100) : 0;

			const recentExpenses = pexpenses
				.sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())
				.slice(0, 3);

			return {
				id: p.id,
				name: p.name,
				description: p.description ?? '',
				type: p.type ?? '',
				startDate: p.startDate ?? null,
				endDate: p.endDate ?? null,
				fiscalYear: p.fiscalYear ?? '2026',
				budget,
				actualSpend,
				forecasted: p.project_forecasted_expenses ?? 0,
				spendPct,
				department: dept ? { id: dept.id, name: dept.name } : null,
				tasks: { total: taskTotal, done: taskDone, open: taskOpen },
				recentExpenses,
			};
		});

		// Sponsor pipeline summary
		const sponsorSummary = {
			total: (sponsors as any[]).length,
			committed: (sponsors as any[]).filter((s: any) => ['committed', 'signed', 'paid'].includes(s.status)).length,
			totalCommitted: (sponsors as any[]).reduce((s: number, sp: any) => s + (sp.committed_amount ?? 0), 0),
			totalPaid: (sponsors as any[]).reduce((s: number, sp: any) => s + (sp.paid_amount ?? 0), 0),
			inPipeline: (sponsors as any[]).filter((s: any) => ['prospect', 'contacted', 'proposal', 'negotiating'].includes(s.status)).length,
		};

		// Franchise leads summary
		const franchiseSummary = {
			total: (franchiseLeads as any[]).length,
			recent: (franchiseLeads as any[])
				.sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())
				.slice(0, 3)
				.map((l: any) => ({ id: l.id, name: l.name, status: l.status })),
		};

		return {
			userProfile,
			projects: enriched,
			sponsorSummary,
			franchiseSummary,
		};
	} catch (err: any) {
		console.error('active-projects load error:', err?.message ?? err);
		return { projects: [], sponsorSummary: null, franchiseSummary: null };
	}
};
