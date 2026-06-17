import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import {
	assertBundleMutable,
	buildBundleSnapshot,
	canonicalBundleStatus,
	computeBundleTotals,
	enforceBundleThresholds,
	loadBundlePayments,
	validateSingleDepartmentAndAccount
} from '$lib/server/event-payment-bundles';

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

	try {
		const bundle = await pb.collection('event_payment_bundles').getOne(params.id, {
			fields: 'id,bundleNumber,status,department,departmentName,accountLabel,paymentIds,itemCount,totalAmount,maxItemCount,maxAmountThreshold,snapshotJson,snapshotChecksum,postedAt,paidAt,notes'
		});

		assertBundleMutable(bundle);
		const status = canonicalBundleStatus(bundle.status);
		if (status === 'cancelled') {
			return json({ message: 'Cancelled bundle cannot be posted' }, { status: 409 });
		}

		const paymentIds = Array.isArray(bundle.paymentIds)
			? bundle.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
			: [];
		if (!paymentIds.length) {
			return json({ message: 'Bundle must contain at least one payment before posting' }, { status: 400 });
		}

		const rows = await loadBundlePayments(pb, paymentIds);
		const totals = computeBundleTotals(rows);
		enforceBundleThresholds({
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			maxItemCount: bundle.maxItemCount,
			maxAmountThreshold: bundle.maxAmountThreshold
		});
		validateSingleDepartmentAndAccount(rows, {
			departmentId: bundle.department,
			accountLabel: bundle.accountLabel
		});

		const { snapshot, checksum } = buildBundleSnapshot(bundle, rows);

		const updated = await pb.collection('event_payment_bundles').update(params.id, {
			status: 'posted',
			itemCount: totals.itemCount,
			totalAmount: totals.totalAmount,
			snapshotJson: JSON.stringify(snapshot),
			snapshotChecksum: checksum,
			postedAt: snapshot.postedAt
		});

		return json({ bundle: updated, checksum });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to post bundle' }, { status: 400 });
	}
};
