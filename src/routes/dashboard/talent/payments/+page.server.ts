import { RequestContext } from '$lib/infra/RequestContext';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { writeAuditLog, writeAuditLogBatch } from '$lib/domain/services/PaymentWorkOrderService';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { pb } = await RequestContext.from(locals, url);

	const filterStatus    = url.searchParams.get('status') ?? '';
	const filterRecipient = url.searchParams.get('recipient') ?? '';
	const filterSeason    = url.searchParams.get('season') ?? '';

	const filters: string[] = [];
	if (filterStatus)    filters.push(`status = '${filterStatus}'`);
	if (filterRecipient) filters.push(`recipient = '${filterRecipient}'`);
	if (filterSeason)    filters.push(`season = '${filterSeason}'`);

	try {
		const filterStr = filters.join(' && ') || undefined;
		const [payments, pros, seasons, workOrders, auditLogs] = await Promise.all([
			pb.collection('pro_payments').getFullList({
				filter: filterStr,
				sort:   '-created',
				expand: 'pro',
			}),
			pb.collection('talent').getFullList({
				sort:   'name',
				fields: 'id,name,managerName,managerEmail,managerCutPercentage',
			}),
			pb.collection('seasons').getFullList({ sort: '-year' }),
			// Load all pro_payment work orders so we can link them
			pb.collection('work_orders').getFullList({
				filter: `source = 'pro_payment'`,
				fields: 'id,work_order_number,status,amount,projectId,projectName,proPayment',
				sort:   '-created',
			}).catch(() => [] as any[]),
			// Load audit log for all payments in the current filter
			pb.collection('payment_audit_log').getFullList({
				sort: 'changedAt',
				fields: 'id,payment,workOrder,fromStatus,toStatus,changedBy,changedAt,amount,recipient,notes',
			}).catch(() => [] as any[]),
		]);

		const prosMap = Object.fromEntries(pros.map((p: any) => [p.id, p]));

		// Map: paymentId → work order
		const paymentToWO: Record<string, any> = {};
		for (const wo of workOrders) {
			const ids: string[] = Array.isArray(wo.proPayment) ? wo.proPayment : [];
			for (const pid of ids) paymentToWO[pid] = wo;
		}

		// Map: paymentId → audit entries (sorted oldest first)
		const paymentAudit: Record<string, any[]> = {};
		for (const entry of auditLogs) {
			if (!paymentAudit[entry.payment]) paymentAudit[entry.payment] = [];
			paymentAudit[entry.payment].push(entry);
		}

		// Enrich each payment with its WO and audit trail
		const enrichedPayments = payments.map((p: any) => ({
			...p,
			_workOrder: paymentToWO[p.id] ?? null,
			_auditLog:  paymentAudit[p.id] ?? [],
		}));

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
		for (const p of enrichedPayments) {
			const proId = p.pro;
			if (!groups[proId]) {
				groups[proId] = {
					pro: prosMap[proId] ?? p.expand?.pro ?? { id: proId, name: 'Unknown' },
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

		const allGroups = Object.values(groups);
		const summary = {
			totalGross:     allGroups.reduce((s, g) => s + g.totalGross, 0),
			totalNet:       allGroups.reduce((s, g) => s + g.totalNet, 0),
			totalManager:   allGroups.reduce((s, g) => s + g.totalManager, 0),
			pendingPro:     allGroups.reduce((s, g) => s + g.pendingPro, 0),
			pendingManager: allGroups.reduce((s, g) => s + g.pendingManager, 0),
			totalPayments:  payments.length,
		};

		return { payments: enrichedPayments, groups: allGroups, summary, seasons, workOrders, filterStatus, filterRecipient, filterSeason };
	} catch (err: any) {
		console.error('payments load error:', err?.message ?? err);
		return {
			payments: [], groups: [], seasons: [], workOrders: [],
			summary: { totalGross: 0, totalNet: 0, totalManager: 0, pendingPro: 0, pendingManager: 0, totalPayments: 0 },
			filterStatus, filterRecipient, filterSeason,
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
