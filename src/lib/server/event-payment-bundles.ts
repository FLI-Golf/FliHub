import { createHash } from 'node:crypto';
import { findOperationsDepartment } from '$lib/server/event-funding';

export type BundleStatus = 'draft' | 'ready' | 'posted' | 'paid' | 'cancelled';

export type BundlePaymentRow = {
	id: string;
	amount: number;
	status: string;
	eventId: string;
	eventName: string;
	departmentId: string | null;
	departmentName: string;
	accountLabel: string;
};

export const DEFAULT_BUNDLE_MAX_AMOUNT = 5000;
export const DEFAULT_BUNDLE_MAX_ITEM_COUNT = 25;
export const DEFAULT_EVENT_ACCOUNT_LABEL = 'Event Operations Account';

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

export function normalizeLabel(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

export function canonicalBundleStatus(value: unknown): BundleStatus {
	const status = String(value ?? 'draft').trim().toLowerCase();
	if (status === 'ready' || status === 'posted' || status === 'paid' || status === 'cancelled') return status;
	return 'draft';
}

export function assertBundleMutable(bundle: any): void {
	const status = canonicalBundleStatus(bundle?.status);
	if (status === 'posted' || status === 'paid') {
		throw new Error('Bundle is locked and cannot be edited after posted/paid.');
	}
}

export async function loadBundlePayments(pb: any, paymentIds: string[]): Promise<BundlePaymentRow[]> {
	if (!paymentIds.length) return [];

	const uniquePaymentIds = Array.from(new Set(paymentIds.filter(Boolean)));
	const operationsDepartment = await findOperationsDepartment(pb);
	const rows: BundlePaymentRow[] = [];

	for (const paymentId of uniquePaymentIds) {
		const payment = await pb.collection('event_payments').getOne(paymentId, {
			expand: 'event'
		}).catch(() => null);

		if (!payment) {
			throw new Error(`Payment ${paymentId} not found.`);
		}

		const paymentStatus = String(payment.status ?? '').toLowerCase();
		if (['paid', 'cancelled'].includes(paymentStatus)) {
			throw new Error(`Payment ${paymentId} cannot be bundled because it is ${paymentStatus}.`);
		}
		if (paymentStatus === 'approval_required') {
			throw new Error(`Payment ${paymentId} cannot be bundled while waiting approval.`);
		}

		const eventId = String(payment.event ?? '');
		if (!eventId) {
			throw new Error(`Payment ${paymentId} is missing event link.`);
		}

		const event = payment.expand?.event
			?? await pb.collection('special_events').getOne(eventId, { fields: 'id,name,department,payoutAccount' }).catch(() => null);

		const fallbackDepartmentId = operationsDepartment?.id ?? null;
		const deptId = event?.department ?? fallbackDepartmentId;
		const deptName = deptId === operationsDepartment?.id
			? (operationsDepartment?.name ?? 'Operations')
			: 'Mapped Department';

		const accountLabel = String(event?.payoutAccount ?? DEFAULT_EVENT_ACCOUNT_LABEL).trim() || DEFAULT_EVENT_ACCOUNT_LABEL;

		rows.push({
			id: payment.id,
			amount: toNumber(payment.amount),
			status: paymentStatus,
			eventId,
			eventName: String(event?.name ?? 'Event'),
			departmentId: deptId,
			departmentName: deptName,
			accountLabel,
		});
	}

	return rows;
}

export function validateSingleDepartmentAndAccount(rows: BundlePaymentRow[], expected?: { departmentId?: string | null; accountLabel?: string | null }) {
	if (!rows.length) {
		return {
			departmentId: expected?.departmentId ?? null,
			departmentName: 'Operations',
			accountLabel: expected?.accountLabel ?? DEFAULT_EVENT_ACCOUNT_LABEL
		};
	}

	const first = rows[0];
	const baselineDepartmentId = expected?.departmentId ?? first.departmentId;
	const baselineAccount = normalizeLabel(expected?.accountLabel ?? first.accountLabel);

	for (const row of rows) {
		if ((row.departmentId ?? null) !== (baselineDepartmentId ?? null)) {
			throw new Error('Cannot mix departments in one bundle.');
		}
		if (normalizeLabel(row.accountLabel) !== baselineAccount) {
			throw new Error('Cannot mix payout accounts in one bundle.');
		}
	}

	return {
		departmentId: baselineDepartmentId ?? null,
		departmentName: first.departmentName,
		accountLabel: expected?.accountLabel ?? first.accountLabel
	};
}

export function computeBundleTotals(rows: BundlePaymentRow[]) {
	return {
		itemCount: rows.length,
		totalAmount: rows.reduce((sum, row) => sum + row.amount, 0)
	};
}

export function enforceBundleThresholds(input: {
	itemCount: number;
	totalAmount: number;
	maxItemCount?: unknown;
	maxAmountThreshold?: unknown;
}) {
	const maxItemCount = Math.max(1, toNumber(input.maxItemCount) || DEFAULT_BUNDLE_MAX_ITEM_COUNT);
	const maxAmountThreshold = Math.max(1, toNumber(input.maxAmountThreshold) || DEFAULT_BUNDLE_MAX_AMOUNT);

	if (input.itemCount > maxItemCount) {
		throw new Error(`Bundle max item count exceeded (${input.itemCount}/${maxItemCount}).`);
	}
	if (input.totalAmount > maxAmountThreshold) {
		throw new Error(`Bundle max amount threshold exceeded (${input.totalAmount.toFixed(2)}/${maxAmountThreshold.toFixed(2)}).`);
	}

	return { maxItemCount, maxAmountThreshold };
}

export function buildBundleSnapshot(bundle: any, rows: BundlePaymentRow[]) {
	const totals = computeBundleTotals(rows);
	const snapshot = {
		bundleId: String(bundle?.id ?? ''),
		bundleNumber: String(bundle?.bundleNumber ?? ''),
		departmentId: bundle?.department ?? null,
		departmentName: String(bundle?.departmentName ?? 'Operations'),
		accountLabel: String(bundle?.accountLabel ?? DEFAULT_EVENT_ACCOUNT_LABEL),
		maxItemCount: toNumber(bundle?.maxItemCount) || DEFAULT_BUNDLE_MAX_ITEM_COUNT,
		maxAmountThreshold: toNumber(bundle?.maxAmountThreshold) || DEFAULT_BUNDLE_MAX_AMOUNT,
		itemCount: totals.itemCount,
		totalAmount: totals.totalAmount,
		postedAt: new Date().toISOString(),
		payments: rows
			.slice()
			.sort((a, b) => a.id.localeCompare(b.id))
			.map((row) => ({
				id: row.id,
				amount: row.amount,
				status: row.status,
				eventId: row.eventId,
				eventName: row.eventName,
				departmentId: row.departmentId,
				accountLabel: row.accountLabel
			}))
	};

	const payload = JSON.stringify(snapshot);
	const checksum = createHash('sha256').update(payload).digest('hex');

	return { snapshot, checksum };
}

export async function nextBundleNumber(pb: any): Promise<string> {
	const existing = await pb.collection('event_payment_bundles').getFullList({
		fields: 'id'
	}).catch(() => []);
	const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const sequence = String((existing as any[]).length + 1).padStart(4, '0');
	return `EPB-${stamp}-${sequence}`;
}

export async function autoAssignDirectPaymentsToDraftBundles(
	pb: any,
	paymentIds: string[]
): Promise<{ assigned: number; createdBundles: number; skipped: number; bundleIds: string[] }> {
	const uniquePaymentIds = Array.from(new Set((paymentIds ?? []).map((id) => String(id)).filter(Boolean)));
	if (!uniquePaymentIds.length) return { assigned: 0, createdBundles: 0, skipped: 0, bundleIds: [] };

	const [draftBundles, allBundles] = await Promise.all([
		pb.collection('event_payment_bundles').getFullList({
			filter: `status = 'draft'`,
			fields: 'id,bundleNumber,status,department,departmentName,accountLabel,paymentIds,itemCount,totalAmount,maxItemCount,maxAmountThreshold'
		}).catch(() => []),
		pb.collection('event_payment_bundles').getFullList({
			fields: 'id,paymentIds'
		}).catch(() => [])
	]);

	const alreadyAssigned = new Set<string>();
	for (const bundle of allBundles as any[]) {
		for (const id of Array.isArray(bundle?.paymentIds) ? bundle.paymentIds : []) {
			alreadyAssigned.add(String(id));
		}
	}

	let assigned = 0;
	let createdBundles = 0;
	let skipped = 0;
	const touchedBundleIds = new Set<string>();

	for (const paymentId of uniquePaymentIds) {
		if (alreadyAssigned.has(paymentId)) {
			skipped += 1;
			continue;
		}

		const rows = await loadBundlePayments(pb, [paymentId]);
		if (!rows.length) {
			skipped += 1;
			continue;
		}
		const row = rows[0];

		let target = (draftBundles as any[]).find((bundle: any) => {
			const bundlePaymentIds = Array.isArray(bundle.paymentIds)
				? bundle.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
				: [];
			const sameDepartment = (bundle.department ?? null) === (row.departmentId ?? null);
			const sameAccount = normalizeLabel(bundle.accountLabel) === normalizeLabel(row.accountLabel);
			if (!sameDepartment || !sameAccount) return false;

			const nextItemCount = bundlePaymentIds.length + 1;
			const nextTotalAmount = toNumber(bundle.totalAmount) + row.amount;
			try {
				const limits = enforceBundleThresholds({
					itemCount: nextItemCount,
					totalAmount: nextTotalAmount,
					maxItemCount: bundle.maxItemCount,
					maxAmountThreshold: bundle.maxAmountThreshold
				});

				return nextItemCount <= limits.maxItemCount && nextTotalAmount <= limits.maxAmountThreshold;
			} catch {
				return false;
			}
		});

		if (target) {
			const bundlePaymentIds = Array.isArray(target.paymentIds)
				? target.paymentIds.map((id: unknown) => String(id)).filter(Boolean)
				: [];
			const nextPaymentIds = Array.from(new Set([...bundlePaymentIds, paymentId]));
			const allRows = await loadBundlePayments(pb, nextPaymentIds);
			const totals = computeBundleTotals(allRows);
			enforceBundleThresholds({
				itemCount: totals.itemCount,
				totalAmount: totals.totalAmount,
				maxItemCount: target.maxItemCount,
				maxAmountThreshold: target.maxAmountThreshold
			});

			target = await pb.collection('event_payment_bundles').update(target.id, {
				paymentIds: nextPaymentIds,
				itemCount: totals.itemCount,
				totalAmount: totals.totalAmount
			});

			const idx = (draftBundles as any[]).findIndex((b: any) => b.id === target.id);
			if (idx >= 0) (draftBundles as any[])[idx] = target;
			touchedBundleIds.add(String(target.id));
		} else {
			const maxItemCount = DEFAULT_BUNDLE_MAX_ITEM_COUNT;
			const maxAmountThreshold = DEFAULT_BUNDLE_MAX_AMOUNT;
			enforceBundleThresholds({
				itemCount: 1,
				totalAmount: row.amount,
				maxItemCount,
				maxAmountThreshold
			});

			const created = await pb.collection('event_payment_bundles').create({
				bundleNumber: await nextBundleNumber(pb),
				name: `Auto Draft Bundle ${new Date().toLocaleDateString('en-US')}`,
				status: 'draft',
				department: row.departmentId,
				departmentName: row.departmentName,
				accountLabel: row.accountLabel || DEFAULT_EVENT_ACCOUNT_LABEL,
				paymentIds: [paymentId],
				itemCount: 1,
				totalAmount: row.amount,
				maxItemCount,
				maxAmountThreshold,
				snapshotChecksum: '',
				snapshotJson: '',
				postedAt: null,
				paidAt: null,
				notes: 'Auto-assigned from direct event payments'
			});
			(draftBundles as any[]).push(created);
			createdBundles += 1;
			touchedBundleIds.add(String(created.id));
		}

		alreadyAssigned.add(paymentId);
		assigned += 1;
	}

	return {
		assigned,
		createdBundles,
		skipped,
		bundleIds: Array.from(touchedBundleIds)
	};
}
