import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	DEFAULT_BUNDLE_MAX_AMOUNT,
	DEFAULT_BUNDLE_MAX_ITEM_COUNT,
	DEFAULT_EVENT_ACCOUNT_LABEL,
	computeBundleTotals,
	enforceBundleThresholds,
	loadBundlePayments,
	nextBundleNumber,
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

export const GET: RequestHandler = async ({ locals, url }) => {
	const guard = await requireBundleManager(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	const status = String(url.searchParams.get('status') ?? '').trim();
	const filter = status ? `status = '${status}'` : undefined;

	try {
		const rows = await pb.collection('event_payment_bundles').getFullList({
			sort: '-created',
			filter,
			expand: 'department,paymentIds',
			fields: 'id,bundleNumber,name,status,department,departmentName,accountLabel,paymentIds,itemCount,totalAmount,maxItemCount,maxAmountThreshold,snapshotChecksum,postedAt,paidAt,created,updated'
		});
		return json({ bundles: rows });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to load event payment bundles' }, { status: 400 });
	}
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const guard = await requireBundleManager(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	try {
		const body = await request.json();
		const paymentIds = Array.isArray(body?.paymentIds)
			? body.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
			: [];

		const rows = await loadBundlePayments(pb, paymentIds);
		const maxItemCount = toNumber(body?.maxItemCount) || DEFAULT_BUNDLE_MAX_ITEM_COUNT;
		const maxAmountThreshold = toNumber(body?.maxAmountThreshold) || DEFAULT_BUNDLE_MAX_AMOUNT;
		const totals = computeBundleTotals(rows);
		enforceBundleThresholds({
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			maxItemCount,
			maxAmountThreshold
		});

		const mix = validateSingleDepartmentAndAccount(rows, {
			departmentId: body?.department ? String(body.department) : undefined,
			accountLabel: body?.accountLabel ? String(body.accountLabel) : undefined
		});

		const record = await pb.collection('event_payment_bundles').create({
			bundleNumber: body?.bundleNumber || await nextBundleNumber(pb),
			name: body?.name || `Event Payments Bundle ${new Date().toLocaleDateString('en-US')}`,
			status: 'draft',
			department: mix.departmentId,
			departmentName: mix.departmentName,
			accountLabel: mix.accountLabel || DEFAULT_EVENT_ACCOUNT_LABEL,
			paymentIds,
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			maxItemCount,
			maxAmountThreshold,
			snapshotChecksum: '',
			snapshotJson: '',
			postedAt: null,
			paidAt: null,
			notes: body?.notes ?? ''
		});

		return json({ bundle: record }, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to create event payment bundle' }, { status: 400 });
	}
};
