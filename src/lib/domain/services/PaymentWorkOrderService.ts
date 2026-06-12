/**
 * PaymentWorkOrderService
 *
 * Manages the relationship between pro_payments, work_orders, and payment_audit_log.
 *
 * Design:
 *   - One work_order per tournament covers all pro + manager payments for that event.
 *   - Each pro_payment record is linked to the work_order via the proPayment multi-relation.
 *   - payment_audit_log is append-only (no update/delete rules in PocketBase).
 *
 * Exception by design:
 *   - pro_payments use a dedicated payout pipeline and are intentionally outside
 *     the standard expense -> approval -> work_order chain.
 */

import type PocketBase from 'pocketbase';

// ─── Work Order ────────────────────────────────────────────────────────────────

/**
 * Returns the existing work order for a tournament, or creates one if none exists.
 * Then appends the given paymentIds to its proPayment relation list.
 */
export async function upsertTournamentWorkOrder(
	pb: PocketBase,
	tournamentId: string,
	tournamentName: string,
	totalAmount: number,
	paymentIds: string[],
	changedBy: string = 'system'
): Promise<string> {
	// Look for an existing WO for this tournament
	const existing = await pb
		.collection('work_orders')
		.getFirstListItem(`projectId = '${tournamentId}' && source = 'pro_payment'`)
		.catch(() => null);

	if (existing) {
		// Merge new payment IDs into the existing relation list (avoid duplicates)
		const current: string[] = Array.isArray(existing.proPayment) ? existing.proPayment : [];
		const merged = Array.from(new Set([...current, ...paymentIds]));
		const newTotal = (existing.amount ?? 0) + totalAmount;

		await pb.collection('work_orders').update(existing.id, {
			proPayment: merged,
			amount: newTotal,
			notes: `${merged.length} payment records · updated ${new Date().toISOString().split('T')[0]}`,
		});
		return existing.id;
	}

	// Generate a work order number: WO-TOUR-{tournamentId slice}-{date}
	const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const woNumber = `WO-TOUR-${tournamentId.slice(-6).toUpperCase()}-${dateStr}`;

	const wo = await pb.collection('work_orders').create({
		work_order_number: woNumber,
		source:            'pro_payment',
		status:            'open',
		projectId:         tournamentId,
		projectName:       tournamentName,
		description:       `Tournament payouts — ${tournamentName}`,
		amount:            totalAmount,
		proPayment:        paymentIds,
		notes:             `${paymentIds.length} payment records · created ${new Date().toISOString().split('T')[0]}`,
		approvedDate:      new Date().toISOString().split('T')[0],
		approvedBy:        changedBy,
	});

	return wo.id;
}

// ─── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
	paymentId:     string;
	workOrderId?:  string;
	fromStatus:    string;
	toStatus:      string;
	changedBy:     string;
	amount?:       number;
	recipient?:    string;
	paymentMethod?: string;
	notes?:        string;
}

export async function writeAuditLog(pb: PocketBase, entry: AuditEntry): Promise<void> {
	await pb.collection('payment_audit_log').create({
		payment:       entry.paymentId,
		workOrder:     entry.workOrderId ?? undefined,
		fromStatus:    entry.fromStatus,
		toStatus:      entry.toStatus,
		changedBy:     entry.changedBy,
		changedAt:     new Date().toISOString(),
		amount:        entry.amount,
		recipient:     entry.recipient,
		paymentMethod: entry.paymentMethod,
		notes:         entry.notes,
	});
}

/**
 * Writes audit log entries for multiple payments in one go (e.g. bulk mark-paid).
 */
export async function writeAuditLogBatch(pb: PocketBase, entries: AuditEntry[]): Promise<void> {
	await Promise.all(entries.map(e => writeAuditLog(pb, e)));
}
