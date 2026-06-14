import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { writeAuditLog, writeAuditLogBatch } from '$lib/domain/services/PaymentWorkOrderService';
import { adminFetch, getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

const relFirst = (v: any): string => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''));
const toNumber = (v: any): number => {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
};
const toTs = (v: any): number => {
	if (!v) return 0;
	const t = new Date(String(v)).getTime();
	return Number.isFinite(t) ? t : 0;
};

const PAYMENT_SORT_FIELDS = new Set(['created', 'dueDate', 'paymentDate', 'amount', 'status', 'recipient', 'proName']);
const SORT_DIRS = new Set(['asc', 'desc']);

const STATUS_ORDER: Record<string, number> = {
	overdue: 0,
	pending: 1,
	paid: 2,
};

const sanitizeSortBy = (value: string | null): string =>
	PAYMENT_SORT_FIELDS.has(value ?? '') ? (value as string) : 'created';

const sanitizeSortDir = (value: string | null): 'asc' | 'desc' =>
	SORT_DIRS.has(value ?? '') ? (value as 'asc' | 'desc') : 'desc';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = await getAdminPocketBase();

	const filterStatus = url.searchParams.get('status') ?? '';
	const filterRecipient = url.searchParams.get('recipient') ?? '';
	const filterSeason = url.searchParams.get('season') ?? '';
	const filterQuery = (url.searchParams.get('q') ?? '').trim();
	const minAmountRaw = (url.searchParams.get('minAmount') ?? '').trim();
	const maxAmountRaw = (url.searchParams.get('maxAmount') ?? '').trim();
	const fromDate = (url.searchParams.get('fromDate') ?? '').trim();
	const toDate = (url.searchParams.get('toDate') ?? '').trim();
	const sortBy = sanitizeSortBy(url.searchParams.get('sortBy'));
	const sortDir = sanitizeSortDir(url.searchParams.get('sortDir'));

	const minAmount = minAmountRaw ? Number(minAmountRaw) : null;
	const maxAmount = maxAmountRaw ? Number(maxAmountRaw) : null;
	const hasMinAmount = minAmount !== null && Number.isFinite(minAmount);
	const hasMaxAmount = maxAmount !== null && Number.isFinite(maxAmount);
	const fromDateTs = fromDate ? toTs(fromDate) : 0;
	const toDateTs = toDate ? toTs(toDate) : 0;

	const filters: string[] = [];
	if (filterStatus) filters.push(`status = '${filterStatus}'`);
	if (filterRecipient) filters.push(`recipient = '${filterRecipient}'`);

	try {
		const filterStr = filters.join(' && ') || undefined;
		const sdkSort = `${sortDir === 'desc' ? '-' : ''}${sortBy === 'proName' ? 'created' : sortBy}`;

		const safeGetPayments = async () => {
			const raw = await adminFetch('pro_payments', {
				perPage: 2000,
				fields: 'id,pro,tournament,tournamentResult,paymentType,recipient,amount,grossAmount,netProAmount,managerAmount,status,paymentDate,dueDate,paymentMethod,transactionId,description,notes,created,updated',
				sort: sdkSort,
				...(filterStr ? { filter: filterStr } : {}),
			}).catch(() => null as any[] | null);

			if (Array.isArray(raw)) {
				if (raw.length > 0) {
					console.log('[payments][raw-fallback]', { count: raw.length });
				}
				return raw;
			}

			try {
				return await pb.collection('pro_payments').getFullList({
					filter: filterStr,
					sort: sdkSort,
				});
			} catch (sdkErr) {
				console.error('[payments][sdk-error]', {
					sdkErr: (sdkErr as any)?.message ?? sdkErr,
				});
				return [] as any[];
			}
		};

		const [payments, pros, seasons, tournaments, workOrders, auditLogs] = await Promise.all([
			safeGetPayments(),
			pb.collection('talent').getFullList({
				sort: 'name',
				fields: 'id,name,managerName,managerEmail,managerCutPercentage',
			}).catch(() => [] as any[]),
			pb.collection('seasons').getFullList({ sort: '-year' }).catch(() => [] as any[]),
			pb.collection('tournaments').getFullList({
				fields: 'id,season',
			}).catch(() => [] as any[]),
			// Load all pro_payment work orders so we can link them
			pb.collection('work_orders').getFullList({
				filter: `source = 'pro_payment'`,
				fields: 'id,work_order_number,status,amount,projectId,projectName,proPayment',
				sort: '-created',
			}).catch(() => [] as any[]),
			// Load audit log for all payments in the current filter
			pb.collection('payment_audit_log').getFullList({
				sort: 'changedAt',
				fields: 'id,payment,workOrder,fromStatus,toStatus,changedBy,changedAt,amount,recipient,notes',
			}).catch(() => [] as any[]),
		]);

		console.log('[payments][load-counts]', {
			payments: payments.length,
			pros: pros.length,
			seasons: seasons.length,
			tournaments: tournaments.length,
			workOrders: workOrders.length,
			auditLogs: auditLogs.length,
			filterStatus,
			filterRecipient,
			filterSeason,
			filterQuery,
			sortBy,
			sortDir,
		});

		const prosMap = Object.fromEntries(pros.map((p: any) => [p.id, p]));
		const tournamentSeasonMap = Object.fromEntries(tournaments.map((t: any) => [t.id, relFirst(t.season)]));

		// Map: paymentId → work order
		const paymentToWO: Record<string, any> = {};
		for (const wo of workOrders) {
			const ids: string[] = Array.isArray(wo.proPayment) ? wo.proPayment : [];
			for (const pid of ids) paymentToWO[pid] = wo;
		}

		// Map: paymentId → audit entries (sorted oldest first)
		const paymentAudit: Record<string, any[]> = {};
		for (const entry of auditLogs) {
			const paymentId = relFirst(entry.payment);
			if (!paymentId) continue;
			if (!paymentAudit[paymentId]) paymentAudit[paymentId] = [];
			paymentAudit[paymentId].push(entry);
		}

		// Enrich each payment with its WO and audit trail.
		const enrichedPayments = payments.map((p: any) => {
			const proId = relFirst(p.pro);
			const pro = prosMap[proId] ?? p.expand?.pro ?? { id: proId, name: 'Unknown' };
			const tournamentId = relFirst(p.tournament);
			const seasonId = tournamentId ? (tournamentSeasonMap[tournamentId] ?? '') : '';

			return {
				...p,
				pro: proId,
				_pro: pro,
				_seasonId: seasonId,
				_workOrder: paymentToWO[p.id] ?? null,
				_auditLog: paymentAudit[p.id] ?? [],
			};
		});

		const queryNeedle = filterQuery.toLowerCase();
		const matchesQuery = (p: any) => {
			if (!queryNeedle) return true;
			const haystack = [
				p._pro?.name,
				p.description,
				p.notes,
				p.transactionId,
				p.paymentMethod,
				p.recipient,
				p.status,
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return haystack.includes(queryNeedle);
		};

		const matchesAmount = (p: any) => {
			const amt = toNumber(p.amount);
			if (hasMinAmount && amt < (minAmount as number)) return false;
			if (hasMaxAmount && amt > (maxAmount as number)) return false;
			return true;
		};

		const matchesDateRange = (p: any) => {
			const dateTs = toTs(p.paymentDate || p.dueDate || p.created);
			if (fromDateTs && dateTs && dateTs < fromDateTs) return false;
			if (toDateTs && dateTs && dateTs > (toDateTs + 86399999)) return false;
			return true;
		};

		const matchesSeason = (p: any) => {
			if (!filterSeason) return true;
			return p._seasonId === filterSeason;
		};

		const filteredPayments = enrichedPayments.filter((p: any) =>
			matchesSeason(p) && matchesQuery(p) && matchesAmount(p) && matchesDateRange(p)
		);

		const comparePayment = (a: any, b: any) => {
			let av: any;
			let bv: any;

			switch (sortBy) {
				case 'amount':
					av = toNumber(a.amount);
					bv = toNumber(b.amount);
					break;
				case 'dueDate':
					av = toTs(a.dueDate);
					bv = toTs(b.dueDate);
					break;
				case 'paymentDate':
					av = toTs(a.paymentDate);
					bv = toTs(b.paymentDate);
					break;
				case 'status':
					av = STATUS_ORDER[a.status] ?? 999;
					bv = STATUS_ORDER[b.status] ?? 999;
					break;
				case 'recipient':
					av = String(a.recipient ?? '');
					bv = String(b.recipient ?? '');
					break;
				case 'proName':
					av = String(a._pro?.name ?? '');
					bv = String(b._pro?.name ?? '');
					break;
				case 'created':
				default:
					av = toTs(a.created);
					bv = toTs(b.created);
					break;
			}

			let cmp = 0;
			if (typeof av === 'string' || typeof bv === 'string') {
				cmp = String(av).localeCompare(String(bv));
			} else {
				cmp = Number(av) - Number(bv);
			}

			if (cmp === 0) {
				cmp = toTs(a.created) - toTs(b.created);
				if (cmp === 0) cmp = String(a.id).localeCompare(String(b.id));
			}

			return sortDir === 'asc' ? cmp : -cmp;
		};

		filteredPayments.sort(comparePayment);

		type PaymentGroup = {
			pro: any;
			proPayments: any[];
			managerPayments: any[];
			totalGross: number;
			totalNet: number;
			totalManager: number;
			pendingPro: number;
			pendingManager: number;
		};

		const groups: Record<string, PaymentGroup> = {};
		for (const p of filteredPayments) {
			const proId = p.pro;
			if (!groups[proId]) {
				groups[proId] = {
					pro: p._pro ?? { id: proId, name: 'Unknown' },
					proPayments: [],
					managerPayments: [],
					totalGross: 0, totalNet: 0, totalManager: 0,
					pendingPro: 0, pendingManager: 0,
				};
			}
			const g = groups[proId];
			if (p.recipient === 'manager') {
				g.managerPayments.push(p);
				g.totalManager += p.amount ?? 0;
				if (p.status === 'pending') g.pendingManager += p.amount ?? 0;
			} else {
				g.proPayments.push(p);
				g.totalNet   += p.amount ?? 0;
				g.totalGross += p.grossAmount ?? p.amount ?? 0;
				if (p.status === 'pending') g.pendingPro += p.amount ?? 0;
			}
		}

		const allGroups = Object.values(groups).sort((a, b) =>
			String(a.pro?.name ?? '').localeCompare(String(b.pro?.name ?? ''))
		);
		const summary = {
			totalGross:     allGroups.reduce((s, g) => s + g.totalGross, 0),
			totalNet:       allGroups.reduce((s, g) => s + g.totalNet, 0),
			totalManager:   allGroups.reduce((s, g) => s + g.totalManager, 0),
			pendingPro:     allGroups.reduce((s, g) => s + g.pendingPro, 0),
			pendingManager: allGroups.reduce((s, g) => s + g.pendingManager, 0),
			totalPayments:  filteredPayments.length,
		};

		console.log('[payments][summary]', summary);

		return {
			payments: filteredPayments,
			groups: allGroups,
			summary,
			seasons,
			workOrders,
			filterStatus,
			filterRecipient,
			filterSeason,
			filterQuery,
			minAmount: hasMinAmount ? String(minAmount) : '',
			maxAmount: hasMaxAmount ? String(maxAmount) : '',
			fromDate,
			toDate,
			sortBy,
			sortDir,
		};
	} catch (err: any) {
		console.error('payments load error:', err?.message ?? err, err?.stack ?? '');
		return {
			payments: [], groups: [], seasons: [], workOrders: [],
			summary: { totalGross: 0, totalNet: 0, totalManager: 0, pendingPro: 0, pendingManager: 0, totalPayments: 0 },
			filterStatus, filterRecipient, filterSeason,
			filterQuery, minAmount: minAmountRaw, maxAmount: maxAmountRaw, fromDate, toDate, sortBy, sortDir,
		};
	}
};

export const actions: Actions = {
	markPaid: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const ids = (fd.get('ids') as string ?? fd.get('id') as string ?? '').split(',').filter(Boolean);
		const paidBy = fd.get('paidBy') as string || 'admin';
		const paidAt = new Date().toISOString().split('T')[0];
		try {
			// Fetch current state for audit log before updating
			const current = await Promise.all(
				ids.map(id => pb.collection('pro_payments').getOne(id, { fields: 'id,status,amount,recipient,workOrder' }).catch(() => null))
			);

			await Promise.all(ids.map(id => pb.collection('pro_payments').update(id, {
				status: 'paid',
				paidAt,
				paidBy,
			})));

			// Audit log entries
			await writeAuditLogBatch(pb, current.filter(Boolean).map((p: any) => ({
				paymentId:  p.id,
				fromStatus: p.status,
				toStatus:   'paid',
				changedBy:  paidBy,
				amount:     p.amount,
				recipient:  p.recipient,
				notes:      `Marked paid on ${paidAt}`,
			})));

			return { success: true };
		} catch (e: any) { return fail(400, { error: e.message }); }
	},

	markPending: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const id = fd.get('id') as string;
		try {
			const current = await pb.collection('pro_payments').getOne(id, { fields: 'id,status,amount,recipient' }).catch(() => null);
			await pb.collection('pro_payments').update(id, { status: 'pending', paidAt: '' });

			if (current) {
				await writeAuditLog(pb, {
					paymentId:  id,
					fromStatus: current.status,
					toStatus:   'pending',
					changedBy:  'admin',
					amount:     current.amount,
					recipient:  current.recipient,
					notes:      'Reverted to pending',
				});
			}
			return { success: true };
		} catch (e: any) { return fail(400, { error: e.message }); }
	},

	updatePayment: async ({ request, locals }) => {
		const pb = locals.pb;
		const fd = await request.formData();
		const id = fd.get('id') as string;
		const newStatus = fd.get('status') as string;
		try {
			const current = await pb.collection('pro_payments').getOne(id, { fields: 'id,status,amount,recipient' }).catch(() => null);

			await pb.collection('pro_payments').update(id, {
				amount:        parseFloat(fd.get('amount') as string),
				status:        newStatus,
				paymentMethod: fd.get('paymentMethod') as string,
				transactionId: fd.get('transactionId') as string,
				notes:         fd.get('notes') as string,
				dueDate:       fd.get('dueDate') as string,
			});

			// Only log if status actually changed
			if (current && current.status !== newStatus) {
				await writeAuditLog(pb, {
					paymentId:     id,
					fromStatus:    current.status,
					toStatus:      newStatus,
					changedBy:     'admin',
					amount:        parseFloat(fd.get('amount') as string),
					recipient:     current.recipient,
					paymentMethod: fd.get('paymentMethod') as string || undefined,
					notes:         fd.get('notes') as string || undefined,
				});
			}
			return { success: true };
		} catch (e: any) { return fail(400, { error: e.message }); }
	},
};
