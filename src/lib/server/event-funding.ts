type WarningLevel = 'normal' | 'watch' | 'warning' | 'critical';

type EventFundingMode = 'approval' | 'pay';

export type EventFundingCheck = {
	ok: boolean;
	mode: EventFundingMode;
	warningLevel: WarningLevel;
	reasons: string[];

	departmentId: string | null;
	departmentName: string;
	departmentAnnualBudget: number;
	departmentActualExpenses: number;
	departmentOpenCommitments: number;
	departmentAvailableBalance: number;
	departmentProjectedUtilizationPct: number;

	eventId: string;
	eventName: string;
	eventBudget: number;
	eventCommittedAmount: number;
	eventAvailableBalance: number;
	eventProjectedUtilizationPct: number;

	paymentAmount: number;
};

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function pct(used: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((used / total) * 10000) / 100;
}

function warningFromRatio(ratio: number): WarningLevel {
	if (ratio >= 1) return 'critical';
	if (ratio >= 0.9) return 'warning';
	if (ratio >= 0.75) return 'watch';
	return 'normal';
}

export function warningLevelForUtilizationPct(utilizationPct: number): WarningLevel {
	return warningFromRatio(Math.max(0, utilizationPct) / 100);
}

export async function findOperationsDepartment(pb: any): Promise<any | null> {
	const departments = await pb.collection('departments').getFullList({
		fields: 'id,name,status,department_annual_budget,department_actual_expenses',
		sort: 'name'
	}).catch(() => []);

	if (!Array.isArray(departments) || departments.length === 0) return null;

	const byName = departments.find((d: any) => String(d?.name ?? '').trim().toLowerCase() === 'operations');
	if (byName) return byName;

	const contains = departments.find((d: any) => String(d?.name ?? '').toLowerCase().includes('operations'));
	if (contains) return contains;

	return null;
}

export async function checkEventFundingCapacity(
	pb: any,
	params: { eventId: string; paymentAmount: number; excludePaymentId?: string | null; mode: EventFundingMode }
): Promise<EventFundingCheck> {
	const { eventId, paymentAmount, excludePaymentId = null, mode } = params;
	const reasons: string[] = [];

	const [event, operationsDepartment, allEventPayments] = await Promise.all([
		pb.collection('special_events').getOne(eventId, { fields: 'id,name,budget' }).catch(() => null),
		findOperationsDepartment(pb),
		pb.collection('event_payments').getFullList({
			fields: 'id,event,status,amount',
			filter: `status != 'cancelled'`
		}).catch(() => [])
	]);

	const eventName = event?.name ?? 'Event';
	const eventBudget = toNumber(event?.budget);
	const currentAmount = toNumber(paymentAmount);

	const eventPayments = (allEventPayments as any[]).filter((p: any) => p.event === eventId);
	const eventCommittedExcludingCurrent = eventPayments
		.filter((p: any) => p.id !== excludePaymentId)
		.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0);
	const eventProjectedCommitted = eventCommittedExcludingCurrent + currentAmount;
	const eventAvailableBalance = eventBudget > 0 ? eventBudget - eventProjectedCommitted : 0;
	const eventUtilPct = pct(eventProjectedCommitted, eventBudget);

	if (!event) {
		reasons.push('Event record not found for funding check.');
	}

	if (eventBudget > 0 && eventProjectedCommitted > eventBudget + 0.00001) {
		reasons.push(`Event budget exceeded by ${Math.abs(eventAvailableBalance).toFixed(2)}.`);
	}

	const departmentId = operationsDepartment?.id ?? null;
	const departmentName = operationsDepartment?.name ?? 'Operations';
	const annualBudget = toNumber(operationsDepartment?.department_annual_budget);
	const actualExpenses = toNumber(operationsDepartment?.department_actual_expenses);

	const openCommitmentsExcludingCurrent = (allEventPayments as any[])
		.filter((p: any) => ['pending', 'approval_required', 'approved'].includes(String(p.status ?? '')))
		.filter((p: any) => p.id !== excludePaymentId)
		.reduce((sum: number, p: any) => sum + toNumber(p.amount), 0);

	const projectedOpenCommitments = openCommitmentsExcludingCurrent + currentAmount;
	const projectedUsedForApproval = actualExpenses + projectedOpenCommitments;
	const availableForPay = annualBudget - actualExpenses;
	const availableForApproval = annualBudget - projectedUsedForApproval;

	if (!departmentId) {
		reasons.push('Operations department is not configured.');
	}

	if (annualBudget <= 0) {
		reasons.push('Operations department annual budget is not set.');
	}

	if (annualBudget > 0) {
		if (mode === 'approval' && availableForApproval < -0.00001) {
			reasons.push(`Operations available balance is insufficient for approval by ${Math.abs(availableForApproval).toFixed(2)}.`);
		}
		if (mode === 'pay' && availableForPay < currentAmount - 0.00001) {
			reasons.push(`Operations available balance is insufficient for payout by ${(currentAmount - availableForPay).toFixed(2)}.`);
		}
	}

	const utilizationRatio = annualBudget > 0
		? (mode === 'approval'
			? projectedUsedForApproval / annualBudget
			: (actualExpenses + currentAmount) / annualBudget)
		: 1;

	const warningLevel = warningFromRatio(utilizationRatio);

	return {
		ok: reasons.length === 0,
		mode,
		warningLevel,
		reasons,

		departmentId,
		departmentName,
		departmentAnnualBudget: annualBudget,
		departmentActualExpenses: actualExpenses,
		departmentOpenCommitments: projectedOpenCommitments,
		departmentAvailableBalance: mode === 'approval' ? availableForApproval : availableForPay,
		departmentProjectedUtilizationPct: pct(mode === 'approval' ? projectedUsedForApproval : (actualExpenses + currentAmount), annualBudget),

		eventId,
		eventName,
		eventBudget,
		eventCommittedAmount: eventProjectedCommitted,
		eventAvailableBalance,
		eventProjectedUtilizationPct: eventUtilPct,

		paymentAmount: currentAmount,
	};
}
