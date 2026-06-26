import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch, getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { getEarningsQueryStrategy } from '$lib/domain/earnings/EarningsQueryStrategy';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const debugEnabled = url.searchParams.get('debug') === '1';
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) {
		return {
			earnings: [],
			totals: { paidYtd: 0, accruedYtd: 0, unpaidBalance: 0, paidCount: 0, unpaidCount: 0 },
			debug: debugEnabled ? { reason: 'no_user' } : undefined,
		};
	}

	const adminPb = await getAdminPocketBase();
	const role = String(ctx.role ?? '');
	const profile = (ctx.profile as any) ?? {};
	const userEmail = String(locals.pb?.authStore?.model?.email ?? '');

	const strategy = getEarningsQueryStrategy(role);
	const resolution = await strategy.resolve({ role, profile, userEmail, adminPb });

	if (resolution.filters.length === 0) {
		return {
			earnings: [],
			totals: { paidYtd: 0, accruedYtd: 0, unpaidBalance: 0, paidCount: 0, unpaidCount: 0 },
			viewerType: resolution.viewerType,
			debug: debugEnabled
				? {
					filters: [],
					role,
					...resolution.diagnostics,
				}
				: undefined,
		};
	}

	const filter = resolution.filters.join(' && ');

	const normalizeStatus = (status: unknown) => String(status ?? '').trim().toLowerCase();
	const isPaidStatus = (status: unknown) => {
		const normalized = normalizeStatus(status);
		return normalized === 'paid' || normalized === 'completed' || normalized === 'settled';
	};
	const isAccruedStatus = (status: unknown) => {
		const normalized = normalizeStatus(status);
		return normalized !== 'void' && normalized !== 'cancelled' && normalized !== 'canceled';
	};

	let earnings: any[] = [];
	try {
		earnings = await adminPb.collection('pro_payments').getFullList({
			filter,
			sort: '-paymentDate,-dueDate,-created',
			expand: 'workOrder,tournament,pro',
			fields: 'id,pro,recipient,amount,status,paymentDate,dueDate,paidAt,created,description,managerName,managerEmail,expand.workOrder.description,expand.workOrder.tournament,expand.tournament.name,expand.pro.name',
		});
	} catch {
		// Fallback when SDK filtering is not reliable in this runtime.
		earnings = await adminFetch('pro_payments', {
			filter,
			sort: '-paymentDate',
			fields: 'id,pro,recipient,amount,status,paymentDate,dueDate,paidAt,created,description,managerName,managerEmail,expand.workOrder.description,expand.workOrder.tournament,expand.tournament.name,expand.pro.name',
			expand: 'workOrder,tournament,pro',
			perPage: 500,
		}).catch(() => [] as any[]);
	}

	// Enforce strict viewer scoping regardless of transport/filter quirks.
	if (resolution.viewerType === 'pro') {
		const expectedProId = String((resolution.diagnostics as any)?.resolvedTalentId ?? '');
		earnings = earnings.filter((e: any) => {
			if (String(e?.recipient ?? '').toLowerCase() !== 'pro') return false;
			if (!expectedProId) return true;
			return String(e?.pro ?? '') === expectedProId;
		});
	}
	if (resolution.viewerType === 'manager') {
		const expectedManagerEmail = String((resolution.diagnostics as any)?.managerEmail ?? '').toLowerCase();
		earnings = earnings.filter((e: any) => {
			if (String(e?.recipient ?? '').toLowerCase() !== 'manager') return false;
			if (!expectedManagerEmail) return true;
			return String(e?.managerEmail ?? '').toLowerCase() === expectedManagerEmail;
		});
	}

	const paidYtd = earnings
		.filter((e: any) => isPaidStatus(e.status))
		.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);

	const accruedYtd = earnings
		.filter((e: any) => isAccruedStatus(e.status))
		.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);

	const unpaidBalance = earnings
		.filter((e: any) => isAccruedStatus(e.status) && !isPaidStatus(e.status))
		.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0);

	const paidCount = earnings.filter((e: any) => isPaidStatus(e.status)).length;
	const unpaidCount = earnings.filter((e: any) => isAccruedStatus(e.status) && !isPaidStatus(e.status)).length;

	return {
		earnings,
		totals: { paidYtd, accruedYtd, unpaidBalance, paidCount, unpaidCount },
		viewerType: resolution.viewerType,
		debug: debugEnabled
			? {
				role,
				filters: resolution.filters,
				recordCount: earnings.length,
				...resolution.diagnostics,
			}
			: undefined,
	};
};
