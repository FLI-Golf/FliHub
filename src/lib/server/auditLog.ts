/**
 * Writes a single entry to the sponsor_audit_log collection.
 * Fails silently — audit logging must never break the primary operation.
 */
import type PocketBase from 'pocketbase';

export interface AuditEntry {
	sponsorId:   string;
	poId?:       string;
	paymentId?:  string;
	action:      string;       // e.g. 'po.sent', 'payment.received', 'po.write_off'
	fromStatus?: string;
	toStatus?:   string;
	amount?:     number;
	notes?:      string;
	performedBy?: string;      // user profile id
}

export async function writeAuditLog(pb: PocketBase, entry: AuditEntry): Promise<void> {
	try {
		await pb.collection('sponsor_audit_log').create({
			sponsorId:   entry.sponsorId,
			poId:        entry.poId        ?? null,
			paymentId:   entry.paymentId   ?? null,
			action:      entry.action,
			fromStatus:  entry.fromStatus  ?? null,
			toStatus:    entry.toStatus    ?? null,
			amount:      entry.amount      ?? null,
			notes:       entry.notes       ?? null,
			performedBy: entry.performedBy ?? null,
		});
	} catch {
		// Intentionally silent — audit log failure must not break the caller
	}
}
