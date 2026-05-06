import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [projects, departments, tasks, expenses, sponsors, franchiseLeads, settings] = await Promise.all([
			pb.collection('projects').getFullList({ filter: "status='in_progress'", sort: 'name' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,description,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('tasks').getFullList({ sort: '-id', expand: 'projectId' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,projectId,taskId,description,created' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,name,status,tier,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,name,status,created' }).catch(() => []),
			pb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
		]);

		const deptMap = Object.fromEntries((departments as any[]).map(d => [d.id, d]));


		// Task rollup per project
		// projectId may be a relation ID string or an expanded object — normalise to the ID
		const tasksByProject: Record<string, any[]> = {};
		for (const t of tasks as any[]) {
			const pid = typeof t.projectId === 'object' ? t.projectId?.id : t.projectId;
			if (pid) {
				tasksByProject[pid] ??= [];
				tasksByProject[pid].push(t);
			}
		}

		// Expense rollup per project
		const expensesByProject: Record<string, any[]> = {};
		for (const e of expenses as any[]) {
			if (e.projectId) {
				expensesByProject[e.projectId] ??= [];
				expensesByProject[e.projectId].push(e);
			}
		}

		const enriched = (projects as any[]).map(p => {
			const dept = deptMap[p.department] ?? null;
			const ptasks = tasksByProject[p.id] ?? [];
			const pexpenses = expensesByProject[p.id] ?? [];

			const taskTotal      = ptasks.length;
			const taskDone       = ptasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
			const taskOpen       = ptasks.filter((t: any) => t.status !== 'completed' && t.status !== 'done' && t.status !== 'cancelled').length;

			// Task-level budget rollup
			const taskBudgetSum  = ptasks.reduce((s: number, t: any) => s + (t.task_budget ?? 0), 0);
			const taskActualSum  = ptasks.reduce((s: number, t: any) => s + (t.task_actual_cost ?? 0), 0);

			const projectBudget  = p.project_budget || 0;

			// Expense pipeline segments (by status)
			const paid       = pexpenses.filter((e: any) => e.status === 'paid')      .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
			const approved   = pexpenses.filter((e: any) => e.status === 'approved')  .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
			const submitted  = pexpenses.filter((e: any) => e.status === 'submitted') .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
			const draft      = pexpenses.filter((e: any) => e.status === 'draft')     .reduce((s: number, e: any) => s + (e.amount ?? 0), 0);

			// inTasks = task budgets minus what's already surfaced as expenses
			// This represents budget allocated to tasks but not yet submitted as an expense
			const totalExpensed = paid + approved + submitted + draft;
			const inTasks       = Math.max(0, taskBudgetSum - totalExpensed);

			// unallocated = project budget not covered by any task budget
			const unallocated   = Math.max(0, projectBudget - taskBudgetSum);

			const actualSpend    = paid + approved || taskActualSum || p.project_actual_expenses || 0;
			const spendPct       = projectBudget > 0 ? Math.min(100, (actualSpend / projectBudget) * 100) : 0;
			const allocatedPct   = projectBudget > 0 ? Math.min(100, (taskBudgetSum / projectBudget) * 100) : 0;

			const pct = (v: number) => projectBudget > 0 ? Math.min(100, (v / projectBudget) * 100) : 0;
			const pipelinePct = {
				paid:      pct(paid),
				approved:  pct(approved),
				submitted: pct(submitted),
				inTasks:   pct(inTasks)
			};

			// Department budget context
			const deptBudget = dept?.department_annual_budget ?? 0;
			const deptActual = dept?.department_actual_expenses ?? 0;
			const deptPct    = deptBudget > 0 ? Math.min(100, (projectBudget / deptBudget) * 100) : 0;

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
				budget: projectBudget,
				actualSpend,
				forecasted: p.project_forecasted_expenses ?? 0,
				spendPct,
				taskBudgetSum,
				taskActualSum,
				allocatedPct,
				pipeline:    { paid, approved, submitted, draft, inTasks, unallocated },
				pipelinePct,
				department: dept ? { id: dept.id, name: dept.name, budget: deptBudget, actual: deptActual, pct: deptPct } : null,
				tasks: {
					total: taskTotal, done: taskDone, open: taskOpen,
					items: ptasks.map((t: any) => ({
						// Full record for TaskDetailModal
						...t,
						// Convenience aliases used in the task row UI
						budget:     t.task_budget ?? 0,
						actualCost: t.task_actual_cost ?? 0
					}))
				},
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

		const raiseSetting = (settings as any[]).find(s => s.key === 'raise_target');
		const raiseTarget  = raiseSetting ? { id: raiseSetting.id, value: Number(raiseSetting.value) } : { id: null, value: 7_500_000 };

		return {
			userProfile,
			projects: enriched,
			sponsorSummary,
			franchiseSummary,
			raiseTarget,
		};
	} catch (err: any) {
		console.error('active-projects load error:', err?.message ?? err);
		return { projects: [], sponsorSummary: null, franchiseSummary: null };
	}
};
