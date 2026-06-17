import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	canonicalBundleStatus,
	computeBundleTotals,
	loadBundlePayments
} from '$lib/server/event-payment-bundles';
import { checkEventFundingCapacity, findOperationsDepartment } from '$lib/server/event-funding';

async function requireBundleManager(locals: App.Locals, url: URL) {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return { ctx: null, error: json({ message: 'Unauthorized' }, { status: 401 }) };
	if (!['admin', 'leader'].includes(ctx.role)) {
		return { ctx: null, error: json({ message: 'Admin or leader access required' }, { status: 403 }) };
	}
	return { ctx, error: null };
}

export const POST: RequestHandler = async ({ locals, url, params }) => {
	const guard = await requireBundleManager(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;
	const paidBy = (locals as any)?.pb?.authStore?.model?.email ?? guard.ctx.profile?.email ?? guard.ctx.profile?.name ?? 'admin';

	try {
		const bundle = await pb.collection('event_payment_bundles').getOne(params.id, {
			fields: 'id,bundleNumber,status,paymentIds,paidAt'
		});

		const status = canonicalBundleStatus(bundle.status);
		if (status !== 'posted') {
			return json({ message: 'Only posted bundles can transition to paid.' }, { status: 409 });
		}

		const paymentIds = Array.isArray(bundle.paymentIds)
			? bundle.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
			: [];
		if (!paymentIds.length) {
			return json({ message: 'Bundle has no payments to mark paid.' }, { status: 400 });
		}

		const rows = await loadBundlePayments(pb, paymentIds);
		const totals = computeBundleTotals(rows);
		const operations = await findOperationsDepartment(pb);
		const annualBudget = Number(operations?.department_annual_budget ?? 0);
		const actualExpenses = Number(operations?.department_actual_expenses ?? 0);
		const available = annualBudget - actualExpenses;
		if (!operations || annualBudget <= 0) {
			return json({ message: 'Operations department budget is not configured for payout.' }, { status: 409 });
		}
		if (available + 0.00001 < totals.totalAmount) {
			return json({
				message: `Insufficient Operations budget for bundle payout (${totals.totalAmount.toFixed(2)} > ${available.toFixed(2)}).`
			}, { status: 409 });
		}

		for (const row of rows) {
			const check = await checkEventFundingCapacity(pb, {
				eventId: row.eventId,
				paymentAmount: row.amount,
				excludePaymentId: row.id,
				mode: 'pay'
			});
			if (!check.ok) {
				return json({
					message: `Bundle payout blocked by funding checks for payment ${row.id}.`,
					budgetCheck: check
				}, { status: 409 });
			}
		}

		const paidAt = new Date().toISOString().split('T')[0];
		for (const row of rows) {
			const payment = await pb.collection('event_payments').getOne(row.id, {
				fields: 'id,status,eventTalent,isBonus'
			});
			const paymentStatus = String(payment?.status ?? '').toLowerCase();
			if (paymentStatus === 'approval_required') {
				return json({ message: `Payment ${row.id} still requires approval.` }, { status: 409 });
			}
			if (paymentStatus === 'paid') continue;

			await pb.collection('event_payments').update(row.id, {
				status: 'paid',
				paidAt,
				paidBy
			});

			if (payment?.isBonus && payment?.eventTalent) {
				await pb.collection('event_talent').update(payment.eventTalent, { bonusEarned: true }).catch(() => null);
			}
		}

		await pb.collection('departments').update(operations.id, {
			department_actual_expenses: actualExpenses + totals.totalAmount
		}).catch(() => null);

		const updated = await pb.collection('event_payment_bundles').update(params.id, {
			status: 'paid',
			paidAt
		});

		return json({ bundle: updated, paidAt, paymentsMarkedPaid: rows.length });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to mark bundle paid' }, { status: 400 });
	}
};
