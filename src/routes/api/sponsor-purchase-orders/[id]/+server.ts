/**
 * PATCH /api/sponsor-purchase-orders/:id
 *
 * PO state machine:
 *   draft → sent → acknowledged → invoiced → partial* → paid  ✅ (creates WO)
 *                                           ↘ overdue → disputed → write_off / bad_debt
 *                                                     ↘ resolved (back to invoiced)
 *
 * Every transition writes to sponsor_audit_log.
 * Write-off / bad_debt require role === 'admin'.
 *
 * DELETE /api/sponsor-purchase-orders/:id — hard delete (draft only)
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { RequestContext } from '$lib/infra/RequestContext';
import { writeAuditLog } from '$lib/server/auditLog';

function sponsorCode(name: string): string {
	return (name ?? '')
		.replace(/[^a-zA-Z\s]/g, '')
		.split(/\s+/)
		.filter(Boolean)
		.map((w: string) => w[0].toUpperCase())
		.join('')
		.slice(0, 6) || 'SP';
}

const VALID_TRANSITIONS: [string, string][] = [
	['draft',        'sent'],
	['sent',         'acknowledged'],
	['sent',         'overdue'],
	['sent',         'cancelled'],
	['acknowledged', 'invoiced'],
	['acknowledged', 'overdue'],
	['invoiced',     'partial'],
	['invoiced',     'paid'],
	['invoiced',     'overdue'],
	['partial',      'paid'],
	['partial',      'overdue'],
	['overdue',      'disputed'],
	['overdue',      'paid'],
	['overdue',      'write_off'],
	['overdue',      'bad_debt'],
	['disputed',     'resolved'],
	['disputed',     'write_off'],
	['disputed',     'bad_debt'],
	['resolved',     'invoiced'],
	['resolved',     'paid'],
	['cancelled',    'draft'],
];

function isValidTransition(from: string, to: string): boolean {
	return VALID_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body    = await request.json().catch(() => ({}));
	const adminPb = await getAdminPocketBase();

	const po = await adminPb.collection('sponsor_purchase_orders')
		.getOne(params.id, { expand: 'sponsorId' })
		.catch(() => null);
	if (!po) return json({ message: 'PO not found' }, { status: 404 });

	const newStatus  = body.status ?? po.status;
	const fromStatus = po.status;

	if (newStatus !== fromStatus && !isValidTransition(fromStatus, newStatus)) {
		return json({ message: `Invalid transition: ${fromStatus} → ${newStatus}` }, { status: 400 });
	}

	if (['write_off', 'bad_debt'].includes(newStatus) && ctx.profile?.role !== 'admin') {
		return json({ message: 'Write-offs require admin approval' }, { status: 403 });
	}

	const updates: Record<string, any> = { status: newStatus };
	let wo: any = null;

	// draft → sent: create invoiced payment record
	if (newStatus === 'sent' && fromStatus === 'draft') {
		updates.sentDate = body.sentDate ?? new Date().toISOString().slice(0, 10);
		await adminPb.collection('sponsor_payments').create({
			sponsor:       po.sponsorId,
			poId:          po.id,
			amount:        po.amount,
			paymentType:   body.paymentType ?? 'annual_fee',
			status:        'invoiced',
			dueDate:       po.dueDate ?? null,
			year:          po.year ?? new Date().getFullYear(),
			invoiceNumber: po.po_number,
			notes:         body.notes ?? '',
			recordedBy:    ctx.profile?.id ?? null,
		}).catch((e: any) => console.warn('payment create failed:', e.message));
	}

	// → partial: record partial payment received
	if (newStatus === 'partial' && fromStatus !== 'partial') {
		const partialAmount = Number(body.partialAmount ?? 0);
		if (partialAmount > 0) {
			await adminPb.collection('sponsor_payments').create({
				sponsor:      po.sponsorId,
				poId:         po.id,
				amount:       partialAmount,
				paymentType:  'installment',
				status:       'received',
				receivedDate: body.receivedDate ?? new Date().toISOString().slice(0, 10),
				notes:        body.notes ?? 'Partial payment',
				recordedBy:   ctx.profile?.id ?? null,
			}).catch(() => {});
		}
		updates.amountReceived = (po.amountReceived ?? 0) + partialAmount;
	}

	// → paid: create Work Order, mark payments received
	if (newStatus === 'paid' && fromStatus !== 'paid') {
		updates.paidDate = body.paidDate ?? new Date().toISOString().slice(0, 10);

		const sponsor = po.expand?.sponsorId ??
			await adminPb.collection('sponsors').getOne(po.sponsorId).catch(() => null);
		const code = sponsorCode(sponsor?.companyName ?? '');

		const projectCode = `SP${code}`;
		const existingWO = await adminPb.collection('work_orders').getFirstListItem(
			`source = "sponsor" && poId = "${po.id}"`
		).catch(() => null) as any;

		if (existingWO) {
			const derivedFromId = `WO-${projectCode}-${String(existingWO.id || '').slice(-4).toLowerCase()}`;
			const woNumber = existingWO.work_order_number || derivedFromId;
			if (existingWO.work_order_number !== woNumber) {
				await adminPb.collection('work_orders').update(existingWO.id, {
					work_order_number: woNumber,
				}).catch((e: any) => console.warn('sponsor WO number backfill failed:', e.message));
			}
			wo = { ...existingWO, work_order_number: woNumber };
		} else {
			const createdWO = await adminPb.collection('work_orders').create({
				work_order_number: `WO-${projectCode}-PENDING-${Date.now()}`,
				source:            'sponsor',
				sponsorId:         po.sponsorId,
				poId:              po.id,
				amount:            body.amount ?? po.amount,
				description:       po.description || `Sponsorship payment — ${sponsor?.companyName ?? ''} (${po.year ?? ''})`,
				status:            'open',
				notes:             `PO: ${po.po_number}${body.notes ? ' — ' + body.notes : ''}`,
				submittedBy:       ctx.profile?.id ?? null,
				approvedBy:        ctx.profile?.id ?? null,
				approvedDate:      new Date().toISOString().slice(0, 10),
				projectCode,
				projectName:       sponsor?.companyName ?? '',
			}).catch((e: any) => { console.warn('WO create failed:', e.message); return null; });

			if (createdWO?.id) {
				const woNumber = `WO-${projectCode}-${String(createdWO.id || '').slice(-4).toLowerCase()}`;
				await adminPb.collection('work_orders').update(createdWO.id, {
					work_order_number: woNumber,
				}).catch((e: any) => console.warn('sponsor WO renumber failed:', e.message));
				wo = { ...createdWO, work_order_number: woNumber };
			}
		}

		const pmts = await adminPb.collection('sponsor_payments').getList(1, 50, {
			filter: `poId = "${po.id}"`,
			fields: 'id,status',
		}).catch(() => ({ items: [] }));
		for (const pmt of pmts.items) {
			if (pmt.status !== 'received') {
				await adminPb.collection('sponsor_payments').update(pmt.id, {
					status:            'received',
					receivedDate:      body.paidDate ?? new Date().toISOString().slice(0, 10),
					qb_transaction_id: body.qb_transaction_id ?? '',
				}).catch(() => {});
			}
		}
	}

	// → overdue: cascade to linked payments
	if (newStatus === 'overdue' && fromStatus !== 'overdue') {
		const pmts = await adminPb.collection('sponsor_payments').getList(1, 50, {
			filter: `poId = "${po.id}" && status != "received"`,
			fields: 'id',
		}).catch(() => ({ items: [] }));
		for (const pmt of pmts.items) {
			await adminPb.collection('sponsor_payments').update(pmt.id, { status: 'overdue' }).catch(() => {});
		}
	}

	// → disputed: freeze payments, record reason
	if (newStatus === 'disputed' && fromStatus !== 'disputed') {
		updates.disputeReason = body.disputeReason ?? '';
		updates.disputeDate   = new Date().toISOString().slice(0, 10);
		const pmts = await adminPb.collection('sponsor_payments').getList(1, 50, {
			filter: `poId = "${po.id}" && status != "received"`,
			fields: 'id',
		}).catch(() => ({ items: [] }));
		for (const pmt of pmts.items) {
			await adminPb.collection('sponsor_payments').update(pmt.id, {
				status: 'disputed',
				notes:  body.disputeReason ?? '',
			}).catch(() => {});
		}
	}

	// → resolved: revert disputed payments to invoiced
	if (newStatus === 'resolved') {
		updates.resolvedDate  = new Date().toISOString().slice(0, 10);
		updates.resolvedNotes = body.resolvedNotes ?? '';
		const pmts = await adminPb.collection('sponsor_payments').getList(1, 50, {
			filter: `poId = "${po.id}" && status = "disputed"`,
			fields: 'id',
		}).catch(() => ({ items: [] }));
		for (const pmt of pmts.items) {
			await adminPb.collection('sponsor_payments').update(pmt.id, { status: 'invoiced' }).catch(() => {});
		}
	}

	// → write_off / bad_debt: admin-only, close all open payments
	if (['write_off', 'bad_debt'].includes(newStatus)) {
		updates.writeOffReason     = body.writeOffReason ?? '';
		updates.writeOffDate       = new Date().toISOString().slice(0, 10);
		updates.writeOffApprovedBy = ctx.profile?.id ?? null;
		const pmts = await adminPb.collection('sponsor_payments').getList(1, 50, {
			filter: `poId = "${po.id}" && status != "received"`,
			fields: 'id,amount',
		}).catch(() => ({ items: [] }));
		for (const pmt of pmts.items) {
			await adminPb.collection('sponsor_payments').update(pmt.id, {
				status: newStatus,
				notes:  body.writeOffReason ?? '',
			}).catch(() => {});
		}
	}

	// Whitelisted direct field updates
	const allowed = ['notes', 'dueDate', 'period_start', 'period_end', 'terms', 'deliverables', 'description', 'year'];
	for (const k of allowed) {
		if (body[k] !== undefined) updates[k] = body[k];
	}

	try {
		const updated = await adminPb.collection('sponsor_purchase_orders').update(params.id, updates);

		await writeAuditLog(adminPb, {
			sponsorId:   po.sponsorId,
			poId:        po.id,
			action:      `po.${newStatus}`,
			fromStatus,
			toStatus:    newStatus,
			amount:      po.amount,
			notes:       body.notes ?? body.disputeReason ?? body.writeOffReason ?? body.resolvedNotes ?? '',
			performedBy: ctx.profile?.id,
		});

		return json({ po: updated, wo: wo ?? undefined });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Update failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const adminPb = await getAdminPocketBase();
	const po = await adminPb.collection('sponsor_purchase_orders')
		.getOne(params.id, { fields: 'id,status,sponsorId' })
		.catch(() => null);
	if (!po) return json({ message: 'PO not found' }, { status: 404 });
	if (po.status !== 'draft') return json({ message: 'Only draft POs can be deleted' }, { status: 400 });

	await adminPb.collection('sponsor_purchase_orders').delete(params.id);

	await writeAuditLog(adminPb, {
		sponsorId:   po.sponsorId,
		poId:        po.id,
		action:      'po.deleted',
		fromStatus:  'draft',
		performedBy: ctx.profile?.id,
	});

	return json({ ok: true });
};
