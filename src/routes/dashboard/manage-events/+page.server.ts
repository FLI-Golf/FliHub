import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import { findOperationsDepartment, warningLevelForUtilizationPct } from '$lib/server/event-funding';
import type { PageServerLoad } from './$types';

const VIEW_ROLES = ['admin', 'leader', 'marketing', 'marketing_lead'] as const;

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function parseDateMs(value: unknown): number {
	if (typeof value !== 'string' || value.trim() === '') return Number.POSITIVE_INFINITY;
	const ms = new Date(value).getTime();
	return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function statusProgress(status: string): number {
	if (status === 'completed') return 100;
	if (status === 'in_progress') return 60;
	if (status === 'scheduled') return 20;
	if (status === 'draft') return 5;
	return 0;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole(...VIEW_ROLES);
	const canManageActions = ['admin', 'leader'].includes(ctx.role);

	try {
		const [events, eventTalent, eventPayments, eventTasks, eventBundles, operationsDepartment] = await Promise.all([
			adminFetch('special_events', {
				sort: '-eventDate',
				expand: 'tournament,season'
			}).catch(() => []),
			adminFetch('event_talent', {
				fields: 'id,event,status,bonusEligible,bonusEarned,confirmedRate'
			}).catch(() => []),
			adminFetch('event_payments', {
				fields: 'id,event,status,amount,isBonus,paymentType,approvalRoute'
			}).catch(() => []),
			adminFetch('event_tasks', {
				fields: 'id,event,status,dueDate,estimatedCost,actualCost,requiresApproval'
			}).catch(() => []),
			adminFetch('event_payment_bundles', {
				sort: '-created',
				fields: 'id,bundleNumber,name,status,paymentIds,itemCount,totalAmount,maxItemCount,maxAmountThreshold,snapshotJson,snapshotChecksum,postedAt,paidAt,notes,created,updated'
			}).catch(() => []),
			findOperationsDepartment(ctx.pb).catch(() => null)
		]);

		const talentByEvent = new Map<string, any[]>();
		for (const row of eventTalent as any[]) {
			if (!row?.event) continue;
			if (!talentByEvent.has(row.event)) talentByEvent.set(row.event, []);
			talentByEvent.get(row.event)!.push(row);
		}

		const paymentsByEvent = new Map<string, any[]>();
		for (const row of eventPayments as any[]) {
			if (!row?.event) continue;
			if (!paymentsByEvent.has(row.event)) paymentsByEvent.set(row.event, []);
			paymentsByEvent.get(row.event)!.push(row);
		}

		const tasksByEvent = new Map<string, any[]>();
		for (const row of eventTasks as any[]) {
			if (!row?.event) continue;
			if (!tasksByEvent.has(row.event)) tasksByEvent.set(row.event, []);
			tasksByEvent.get(row.event)!.push(row);
		}

		const cards = (events as any[]).map((event: any) => {
			const talent = talentByEvent.get(event.id) ?? [];
			const payments = paymentsByEvent.get(event.id) ?? [];
			const tasks = tasksByEvent.get(event.id) ?? [];

			const taskDone = tasks.filter((t) => t.status === 'completed').length;
			const taskOpen = tasks.filter((t) => !['completed', 'cancelled'].includes(t.status)).length;
			const taskProgress = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : statusProgress(event.status ?? 'draft');

			const totalPaid = payments
				.filter((p) => p.status === 'paid')
				.reduce((sum, p) => sum + toNumber(p.amount), 0);
			const totalPending = payments
				.filter((p) => ['pending', 'approval_required', 'approved'].includes(p.status))
				.reduce((sum, p) => sum + toNumber(p.amount), 0);
			const pendingApprovals = payments.filter((p) => p.status === 'approval_required').length;

			const estimatedTaskCost = tasks.reduce((sum, t) => sum + toNumber(t.estimatedCost), 0);
			const actualTaskCost = tasks.reduce((sum, t) => sum + toNumber(t.actualCost), 0);
			const nextDueTask = tasks
				.filter((t) => t.dueDate && !['completed', 'cancelled'].includes(t.status))
				.sort((a, b) => parseDateMs(a.dueDate) - parseDateMs(b.dueDate))[0] ?? null;

			return {
				id: event.id,
				name: event.name ?? 'Untitled Event',
				eventType: event.eventType ?? 'other',
				status: event.status ?? 'draft',
				eventDate: event.eventDate ?? null,
				location: event.location ?? '',
				description: event.description ?? '',
				budget: toNumber(event.budget),
				defaultRate: toNumber(event.defaultRate),
				tournamentName: event?.expand?.tournament?.name ?? null,
				seasonName: event?.expand?.season?.name ?? null,
				counts: {
					talent: talent.length,
					confirmedTalent: talent.filter((t) => ['confirmed', 'completed'].includes(t.status)).length,
					tasks: tasks.length,
					taskOpen,
					taskDone,
					payments: payments.length,
					pendingApprovals,
					bonusEligible: talent.filter((t) => !!t.bonusEligible && !t.bonusEarned).length,
					bonusPayments: payments.filter((p) => !!p.isBonus).length
				},
				spend: {
					paid: totalPaid,
					pending: totalPending,
					estimatedTaskCost,
					actualTaskCost
				},
				nextDueTask,
				progressPct: Math.max(0, Math.min(100, taskProgress))
			};
		});

		const totals = {
			totalEvents: cards.length,
			scheduled: cards.filter((c) => c.status === 'scheduled').length,
			inProgress: cards.filter((c) => c.status === 'in_progress').length,
			completed: cards.filter((c) => c.status === 'completed').length,
			totalBudget: cards.reduce((sum, c) => sum + c.budget, 0),
			totalPaid: cards.reduce((sum, c) => sum + c.spend.paid, 0),
			totalPending: cards.reduce((sum, c) => sum + c.spend.pending, 0),
			pendingApprovals: cards.reduce((sum, c) => sum + c.counts.pendingApprovals, 0)
		};

		const bundledPaymentIds = new Set<string>();
		for (const bundle of eventBundles as any[]) {
			for (const id of Array.isArray(bundle?.paymentIds) ? bundle.paymentIds : []) {
				bundledPaymentIds.add(String(id));
			}
		}

		const directUnbundledPaymentIds = (eventPayments as any[])
			.filter((payment: any) => String(payment?.status ?? '') === 'pending')
			.filter((payment: any) => String(payment?.approvalRoute ?? '') === 'direct')
			.filter((payment: any) => !bundledPaymentIds.has(String(payment.id)))
			.map((payment: any) => String(payment.id));

		const bundleSummary = {
			total: (eventBundles as any[]).length,
			draft: (eventBundles as any[]).filter((b: any) => b.status === 'draft').length,
			posted: (eventBundles as any[]).filter((b: any) => b.status === 'posted').length,
			paid: (eventBundles as any[]).filter((b: any) => b.status === 'paid').length,
			directUnbundledCount: directUnbundledPaymentIds.length,
			directUnbundledPaymentIds,
			bundles: eventBundles
		};

		const annualBudget = toNumber(operationsDepartment?.department_annual_budget);
		const actualExpenses = toNumber(operationsDepartment?.department_actual_expenses);
		const availableBalance = annualBudget - actualExpenses;
		const utilizationPct = annualBudget > 0 ? Math.max(0, Math.min(100, Math.round((actualExpenses / annualBudget) * 100))) : 0;
		const departmentBudget = {
			id: operationsDepartment?.id ?? null,
			name: operationsDepartment?.name ?? 'Operations',
			annualBudget,
			actualExpenses,
			availableBalance,
			utilizationPct,
			warningLevel: warningLevelForUtilizationPct(utilizationPct)
		};

		return {
			userProfile: ctx.profile,
			canManageActions,
			cards,
			totals,
			bundleSummary,
			departmentBudget
		};
	} catch (err: any) {
		console.error('manage-events load error:', err?.message ?? err);
		return {
			canManageActions,
			cards: [],
			totals: {
				totalEvents: 0,
				scheduled: 0,
				inProgress: 0,
				completed: 0,
				totalBudget: 0,
				totalPaid: 0,
				totalPending: 0,
				pendingApprovals: 0
			},
			bundleSummary: {
				total: 0,
				draft: 0,
				posted: 0,
				paid: 0,
				directUnbundledCount: 0,
				directUnbundledPaymentIds: [],
				bundles: []
			},
			departmentBudget: {
				id: null,
				name: 'Operations',
				annualBudget: 0,
				actualExpenses: 0,
				availableBalance: 0,
				utilizationPct: 0,
				warningLevel: 'normal'
			}
		};
	}
};