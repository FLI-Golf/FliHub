import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

const MARKETING_ROLES = new Set(['marketing', 'marketing_lead']);
const MARKETING_DEPT_NAMES = new Set(['Marketing', 'Marketing, Working Capital & Reserve']);

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');
	const { pb, profile: userProfile } = ctx;

	try {
		const [projects, departments, tasks, expenses, sponsors, franchiseLeads, settings, pendingApprovals, reimbClaims, submittedBids, bidWorkOrders] = await Promise.all([
			pb.collection('projects').getFullList({ filter: "status='in_progress'", sort: 'name' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,description,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('tasks').getFullList({ sort: '-id', expand: 'projectId' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,projectId,taskId,description,created' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,name,status,tier,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,name,status,created' }).catch(() => []),
			pb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
			pb.collection('approvals').getFullList({ filter: "status='pending' && entityType='expense'", fields: 'id,entityId,amount' }).catch(() => []),
			pb.collection('reimbursement_claims').getFullList({ fields: 'id,totalAmount,status,department,claimant,title,is_historical,referenceNumber', expand: 'claimant' }).catch(() => []),
			adminFetch('bids', { fields: 'id,projectId,status,amount,created', sort: '-created' }).catch(() => []),
			// Bid-sourced work orders — these carry projectId directly and must be
			// rolled into the expense pipeline since bid expenses have no projectId field.
			adminFetch('work_orders', { filter: "source='bid'", fields: 'id,projectId,amount,status,qb_transaction_id', sort: '-created' }).catch(() => []),
		]);

		// Build per-project bid pipeline: count + amount by status
		// Statuses: submitted → under_review → shortlisted → awarded → closed
		const bidsByProject: Record<string, {
			submitted: number; submittedAmt: number;
			under_review: number; under_reviewAmt: number;
			shortlisted: number; shortlistedAmt: number;
			awarded: number; awardedAmt: number;
			closed: number; closedAmt: number;
			total: number; totalAmt: number;
		}> = {};

		for (const b of submittedBids as any[]) {
			const pid = typeof b.projectId === 'object' ? b.projectId?.id : b.projectId;
			if (!pid) continue;
			bidsByProject[pid] ??= {
				submitted: 0, submittedAmt: 0,
				under_review: 0, under_reviewAmt: 0,
				shortlisted: 0, shortlistedAmt: 0,
				awarded: 0, awardedAmt: 0,
				closed: 0, closedAmt: 0,
				total: 0, totalAmt: 0,
			};
			const s   = b.status as string;
			const amt = b.amount ?? 0;
			const key = s as keyof typeof bidsByProject[string];
			if (`${s}Amt` in bidsByProject[pid]) {
				(bidsByProject[pid] as any)[s]         += 1;
				(bidsByProject[pid] as any)[`${s}Amt`] += amt;
			}
			bidsByProject[pid].total    += 1;
			bidsByProject[pid].totalAmt += amt;
		}

		const deptMap = Object.fromEntries((departments as any[]).map(d => [d.id, d]));

		// Reimbursement pipeline rollup — all claims roll up to the Tax-Exempt dept project.
		// We key by department ID but also accept claims with no department set (legacy/seed data)
		// by falling back to any department named 'Tax-Exempt Reimbursements'.
		const reimbDeptId = (departments as any[]).find(d => d.name === 'Tax-Exempt Reimbursements')?.id ?? null;

		const reimbRollup = { draft: 0, submitted: 0, under_review: 0, approved: 0, paid: 0, rejected: 0, total: 0, claimCount: 0, pendingCount: 0, recentClaims: [] as any[] };
		for (const c of reimbClaims as any[]) {
			// Include claim if it has the right dept, or if it has no dept (treat as belonging here)
			const belongsHere = !c.department || c.department === reimbDeptId;
			if (!belongsHere) continue;
			const amt = c.totalAmount ?? 0;
			const s   = c.status ?? 'draft';
			(reimbRollup as any)[s] = ((reimbRollup as any)[s] ?? 0) + amt;
			reimbRollup.total      += amt;
			reimbRollup.claimCount += 1;
			if (s === 'submitted' || s === 'under_review' || s === 'approved') reimbRollup.pendingCount += 1;
			if (s !== 'paid' && s !== 'rejected') reimbRollup.recentClaims.push(c);
		}
		// Most recent 8 active (non-paid, non-rejected) claims for the card list
		reimbRollup.recentClaims = reimbRollup.recentClaims
			.sort((a: any, b: any) => b.id.localeCompare(a.id))
			.slice(0, 8);

		// Build a dept-keyed map so the enriched project lookup still works
		const reimbByDept: Record<string, typeof reimbRollup> = {};
		if (reimbDeptId) reimbByDept[reimbDeptId] = reimbRollup;

		// Map taskId → draft expense count
		const draftByTask: Record<string, number> = {};
		for (const e of expenses as any[]) {
			if (e.status === 'draft' && e.taskId) {
				draftByTask[e.taskId] = (draftByTask[e.taskId] ?? 0) + 1;
			}
		}

		// Map task id → projectId for fallback resolution
		const taskProjectMap: Record<string, string> = {};
		for (const t of tasks as any[]) {
			const pid = typeof t.projectId === 'object' ? t.projectId?.id : t.projectId;
			if (t.id && pid) taskProjectMap[t.id] = pid;
		}

		// Map expense id → projectId (fall back to taskId lookup for older expenses)
		const expenseProjectMap: Record<string, string> = {};
		for (const e of expenses as any[]) {
			if (!e.id) continue;
			const pid = e.projectId || (e.taskId ? taskProjectMap[e.taskId] : null);
			if (pid) expenseProjectMap[e.id] = pid;
		}
		// Count pending approvals per project
		const pendingByProject: Record<string, number> = {};
		for (const a of pendingApprovals as any[]) {
			const pid = expenseProjectMap[a.entityId];
			if (pid) pendingByProject[pid] = (pendingByProject[pid] ?? 0) + 1;
		}


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

		// Expense rollup per project — resolve projectId via taskId fallback
		// (expenses collection has no projectId field; link is task → project)
		const expensesByProject: Record<string, any[]> = {};
		for (const e of expenses as any[]) {
			const pid = e.projectId || (e.taskId ? taskProjectMap[e.taskId] : null);
			if (pid) {
				expensesByProject[pid] ??= [];
				expensesByProject[pid].push(e);
			}
		}

		// Merge bid work orders into the expense pipeline per project.
		// WO status → expense status mapping:
		//   open/approved → 'approved', paid → 'paid', anything else → 'submitted'
		for (const wo of bidWorkOrders as any[]) {
			const pid = wo.projectId;
			if (!pid || !wo.amount) continue;
			const woStatus = wo.status === 'paid' ? 'paid'
				: (wo.status === 'open' || wo.status === 'approved') ? 'approved'
				: 'submitted';
			expensesByProject[pid] ??= [];
			expensesByProject[pid].push({ id: wo.id, amount: wo.amount, status: woStatus, _fromBidWO: true });
		}

		const enriched = (projects as any[]).map(p => {
			const dept = deptMap[p.department] ?? null;
			const isReimbDept = dept?.name === 'Tax-Exempt Reimbursements';
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
						budget:        t.task_budget ?? 0,
						actualCost:    t.task_actual_cost ?? 0,
						draftExpenses: draftByTask[t.id] ?? 0,
					}))
				},
				recentExpenses,
				pendingApprovals:  pendingByProject[p.id] ?? 0,
				draftExpenses:     pexpenses.filter((e: any) => e.status === 'draft').length,
				isReimbProject:    isReimbDept,
				reimbPipeline:     isReimbDept ? reimbRollup : null,
				bidPipeline:       bidsByProject[p.id] ?? null,
				submittedBids:     bidsByProject[p.id]?.submitted ?? 0,
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

		// Marketing roles only see projects in their departments
		const isMarketingRole = MARKETING_ROLES.has(ctx.role);
		const visibleProjects = isMarketingRole
			? enriched.filter((p: any) => MARKETING_DEPT_NAMES.has(p.department?.name))
			: enriched;

		return {
			userProfile,
			projects: visibleProjects,
			sponsorSummary,
			franchiseSummary,
			raiseTarget,
		};
	} catch (err: any) {
		console.error('active-projects load error:', err?.message ?? err);
		return { projects: [], sponsorSummary: null, franchiseSummary: null };
	}
};
