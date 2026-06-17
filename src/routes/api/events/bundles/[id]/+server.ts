import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	DEFAULT_BUNDLE_MAX_AMOUNT,
	DEFAULT_BUNDLE_MAX_ITEM_COUNT,
	assertBundleMutable,
	canonicalBundleStatus,
	computeBundleTotals,
	enforceBundleThresholds,
	loadBundlePayments,
	validateSingleDepartmentAndAccount
} from '$lib/server/event-payment-bundles';

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

async function requireBundleManager(locals: App.Locals, url: URL) {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return { ctx: null, error: json({ message: 'Unauthorized' }, { status: 401 }) };
	if (!['admin', 'leader'].includes(ctx.role)) {
		return { ctx: null, error: json({ message: 'Admin or leader access required' }, { status: 403 }) };
	}
	return { ctx, error: null };
}

export const PATCH: RequestHandler = async ({ locals, url, request, params }) => {
	const guard = await requireBundleManager(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	try {
		const body = await request.json();
		const bundle = await pb.collection('event_payment_bundles').getOne(params.id, {
			fields: 'id,bundleNumber,status,department,departmentName,accountLabel,paymentIds,itemCount,totalAmount,maxItemCount,maxAmountThreshold,notes'
		});

		assertBundleMutable(bundle);

		const nextStatus = body?.status !== undefined ? canonicalBundleStatus(body.status) : canonicalBundleStatus(bundle.status);
		if (['posted', 'paid'].includes(nextStatus)) {
			return json({ message: 'Use the posting/payout endpoints for posted/paid transitions.' }, { status: 409 });
		}

		const paymentIds = Array.isArray(body?.paymentIds)
			? body.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
			: Array.isArray(bundle.paymentIds)
				? bundle.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
				: [];

		const rows = await loadBundlePayments(pb, paymentIds);
		const maxItemCount = body?.maxItemCount !== undefined
			? toNumber(body.maxItemCount) || DEFAULT_BUNDLE_MAX_ITEM_COUNT
			: toNumber(bundle.maxItemCount) || DEFAULT_BUNDLE_MAX_ITEM_COUNT;
		const maxAmountThreshold = body?.maxAmountThreshold !== undefined
			? toNumber(body.maxAmountThreshold) || DEFAULT_BUNDLE_MAX_AMOUNT
			: toNumber(bundle.maxAmountThreshold) || DEFAULT_BUNDLE_MAX_AMOUNT;

		const totals = computeBundleTotals(rows);
		enforceBundleThresholds({
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			maxItemCount,
			maxAmountThreshold
		});

		const mix = validateSingleDepartmentAndAccount(rows, {
			departmentId: body?.department !== undefined ? String(body.department || '') || null : bundle.department,
			accountLabel: body?.accountLabel !== undefined ? String(body.accountLabel || '') : bundle.accountLabel
		});

		const updated = await pb.collection('event_payment_bundles').update(params.id, {
			name: body?.name !== undefined ? body.name : bundle.name,
			status: nextStatus,
			department: mix.departmentId,
			departmentName: mix.departmentName,
			accountLabel: mix.accountLabel,
			paymentIds,
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			maxItemCount,
			maxAmountThreshold,
			notes: body?.notes !== undefined ? body.notes : bundle.notes
		});

		return json({ bundle: updated });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update bundle' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const guard = await requireBundleManager(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	try {
		const bundle = await pb.collection('event_payment_bundles').getOne(params.id, {
			fields: 'id,status'
		});
		assertBundleMutable(bundle);
		await pb.collection('event_payment_bundles').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to delete bundle' }, { status: 400 });
	}
};
