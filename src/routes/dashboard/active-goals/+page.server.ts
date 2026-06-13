import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

const MARKETING_ROLES = new Set(['marketing', 'marketing_lead']);

function normalizeStatus(value: unknown): string {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ');
}

function isInProgressGoalStatus(value: unknown): boolean {
	return normalizeStatus(value) === 'in progress';
}

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function taskPriority(status: string | undefined): number {
	if (status === 'in_progress') return 0;
	if (status === 'blocked') return 1;
	if (status === 'needs_approval') return 1;
	if (status === 'todo') return 2;
	if (status === 'work_order') return 3;
	if (status === 'expense_created') return 4;
	if (status === 'approved') return 5;
	if (status === 'done') return 6;
	if (status === 'completed') return 6;
	return 7;
}

function dateValue(dateStr: string | null | undefined): number {
	if (!dateStr) return Number.POSITIVE_INFINITY;
	const ms = new Date(dateStr).getTime();
	return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');
	const { pb } = ctx;

	try {
		const [goals, allTasks, expenses, pendingExpenseApprovals] = await Promise.all([
			adminFetch('marketing_goals', { sort: '-created' }).catch(() => []),
			adminFetch('goal_tasks', {
				fields: 'id,goalId,title,status,priority,dueDate,estimatedCost,actualCost,expenseId,workOrderId,approvalId,assignedTo',
				sort: '-created'
			}).catch(() => []),
			adminFetch('expenses', {
				fields: 'id,amount,status,created,approvedDate,work_order_number'
			}).catch(() => []),
			adminFetch('approvals', {
				filter: "status='pending' && entityType='expense'",
				fields: 'entityId'
			}).catch(() => []),
		]);

		const expensesById = new Map((expenses as any[]).map((e: any) => [e.id, e]));
		const pendingExpenseIds = new Set((pendingExpenseApprovals as any[]).map((a: any) => a.entityId));

		const tasksByGoal: Record<string, any[]> = {};
		for (const task of allTasks as any[]) {
			if (!task.goalId) continue;
			tasksByGoal[task.goalId] ??= [];
			tasksByGoal[task.goalId].push(task);
		}

		const goalCards = (goals as any[])
			.map((goal: any) => {
				const goalTasks = [...(tasksByGoal[goal.id] ?? [])].sort((a: any, b: any) => {
					const statusCmp = taskPriority(a.status) - taskPriority(b.status);
					if (statusCmp !== 0) return statusCmp;
					const dateCmp = dateValue(a.dueDate) - dateValue(b.dueDate);
					if (dateCmp !== 0) return dateCmp;
					return (a.title ?? '').localeCompare(b.title ?? '');
				});

				const counts = {
					total: goalTasks.length,
					open: goalTasks.filter((t: any) => !['completed', 'done', 'cancelled'].includes(t.status)).length,
					completed: goalTasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length,
					inProgress: goalTasks.filter((t: any) => t.status === 'in_progress').length,
					needsApproval: goalTasks.filter((t: any) => t.status === 'needs_approval').length,
				};

				let submittedSpend = 0;
				let approvedSpend = 0;
				let paidSpend = 0;
				let pendingApprovals = 0;
				let withWorkOrder = 0;

				for (const task of goalTasks) {
					if (task.workOrderId) withWorkOrder += 1;
					if (!task.expenseId) continue;
					const expense = expensesById.get(task.expenseId);
					if (!expense) continue;
					const amount = toNumber(expense.amount);
					if (expense.status === 'submitted') submittedSpend += amount;
					if (expense.status === 'approved') approvedSpend += amount;
					if (expense.status === 'paid') paidSpend += amount;
					if (pendingExpenseIds.has(expense.id)) pendingApprovals += 1;
				}

				const estimatedTotal = goalTasks.reduce((sum: number, t: any) => sum + toNumber(t.estimatedCost), 0);
				const actualTotal = goalTasks.reduce((sum: number, t: any) => sum + toNumber(t.actualCost), 0);
				const nextDueTask = goalTasks
					.filter((t: any) => t.dueDate && !['completed', 'done', 'cancelled'].includes(t.status))
					.sort((a: any, b: any) => dateValue(a.dueDate) - dateValue(b.dueDate))[0] ?? null;

				const targetValue = toNumber(goal.targetValue);
				const currentValue = toNumber(goal.currentValue);
				const progressPct = targetValue > 0
					? Math.min(100, Math.round((currentValue / targetValue) * 100))
					: 0;

				return {
					id: goal.id,
					goalName: goal.goalName ?? goal.name ?? 'Untitled Goal',
					description: goal.description ?? goal.descriptionOfGoal ?? '',
					status: goal.status ?? 'Not Started',
					priority: goal.priority ?? 'Medium',
					category: goal.category ?? 'General',
					deadline: goal.deadline ?? goal.dueDate ?? null,
					targetMetric: goal.targetMetric ?? '',
					currentValue,
					targetValue,
					progressPct,
					counts,
					estimatedTotal,
					actualTotal,
					spend: {
						submitted: submittedSpend,
						approved: approvedSpend,
						paid: paidSpend,
					},
					pendingApprovals,
					withWorkOrder,
					nextDueTask,
					tasks: goalTasks,
				};
			})
			.filter((goal: any) => isInProgressGoalStatus(goal.status))
			.sort((a: any, b: any) => {
				if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
				if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;
				return dateValue(a.deadline) - dateValue(b.deadline);
			});

		const totals = {
			rawGoals: (goals as any[]).length,
			activeGoals: goalCards.length,
			openTasks: goalCards.reduce((sum: number, g: any) => sum + g.counts.open, 0),
			needsApproval: goalCards.reduce((sum: number, g: any) => sum + g.counts.needsApproval, 0),
			pendingApprovals: goalCards.reduce((sum: number, g: any) => sum + g.pendingApprovals, 0),
			submittedSpend: goalCards.reduce((sum: number, g: any) => sum + g.spend.submitted, 0),
			approvedSpend: goalCards.reduce((sum: number, g: any) => sum + g.spend.approved, 0),
			paidSpend: goalCards.reduce((sum: number, g: any) => sum + g.spend.paid, 0),
		};

		const marketingView = MARKETING_ROLES.has(ctx.role);

		return {
			userProfile: ctx.profile,
			goals: goalCards,
			totals,
			marketingView,
		};
	} catch (err: any) {
		console.error('active-goals load error:', err?.message ?? err);
		return {
			goals: [],
			totals: {
				rawGoals: 0,
				activeGoals: 0,
				openTasks: 0,
				needsApproval: 0,
				pendingApprovals: 0,
				submittedSpend: 0,
				approvedSpend: 0,
				paidSpend: 0,
			},
			marketingView: true,
		};
	}
};
