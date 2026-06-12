import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { writeAuditLog } from '$lib/server/auditLog';
import type { RequestHandler } from './$types';

// Exception by design: sponsor_payments are inbound cash collection records,
// so they remain outside the expense approval/work-order pipeline.

// PATCH /api/sponsor-payments/:id
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({}));

	// Write-off / bad_debt require admin
	if (['write_off', 'bad_debt'].includes(body.status) && ctx.profile?.role !== 'admin') {
		return json({ message: 'Write-offs require admin approval' }, { status: 403 });
	}

	try {
		const adminPb = await getAdminPocketBase();
		const existing = await adminPb.collection('sponsor_payments')
			.getOne(params.id, { fields: 'id,sponsor,amount,status,poId' });

		const wasReceived = existing.status === 'received';
		const nowReceived = body.status === 'received';
		const fromStatus  = existing.status;

		const record = await adminPb.collection('sponsor_payments').update(params.id, {
			...(body.status           !== undefined && { status:           body.status }),
			...(body.paymentType      !== undefined && { paymentType:      body.paymentType }),
			...(body.amount           !== undefined && { amount:           Number(body.amount) }),
			...(body.dueDate          !== undefined && { dueDate:          body.dueDate || null }),
			...(body.receivedDate     !== undefined && { receivedDate:     body.receivedDate || null }),
			...(body.year             !== undefined && { year:             body.year ? Number(body.year) : null }),
			...(body.invoiceNumber    !== undefined && { invoiceNumber:    body.invoiceNumber }),
			...(body.notes            !== undefined && { notes:            body.notes }),
			...(body.qbTransactionId  !== undefined && { qb_transaction_id: body.qbTransactionId }),
			...(body.disputeReason    !== undefined && { disputeReason:    body.disputeReason }),
			...(body.writeOffReason   !== undefined && { writeOffReason:   body.writeOffReason }),
			...(body.partialAmount    !== undefined && { partialAmount:    Number(body.partialAmount) }),
		});

		// Keep sponsor.totalPaid in sync
		if (!wasReceived && nowReceived) {
			const sponsor = await adminPb.collection('sponsors')
				.getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await adminPb.collection('sponsors').update(existing.sponsor, {
					totalPaid: (sponsor.totalPaid || 0) + (body.amount ?? existing.amount),
				});
			}
		} else if (wasReceived && !nowReceived && body.status !== undefined) {
			const sponsor = await adminPb.collection('sponsors')
				.getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await adminPb.collection('sponsors').update(existing.sponsor, {
					totalPaid: Math.max(0, (sponsor.totalPaid || 0) - existing.amount),
				});
			}
		}

		// Audit log
		if (body.status && body.status !== fromStatus) {
			await writeAuditLog(adminPb, {
				sponsorId:   existing.sponsor,
				poId:        existing.poId ?? undefined,
				paymentId:   existing.id,
				action:      `payment.${body.status}`,
				fromStatus,
				toStatus:    body.status,
				amount:      body.amount ?? existing.amount,
				notes:       body.notes ?? body.disputeReason ?? body.writeOffReason ?? '',
				performedBy: ctx.profile?.id,
			});
		}

		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update payment';
		return json({ message: msg }, { status: 500 });
	}
};

// DELETE /api/sponsor-payments/:id
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const adminPb = await getAdminPocketBase();
		const existing = await adminPb.collection('sponsor_payments')
			.getOne(params.id, { fields: 'id,sponsor,amount,status' });

		await adminPb.collection('sponsor_payments').delete(params.id);

		if (existing.status === 'received') {
			const sponsor = await adminPb.collection('sponsors')
				.getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await adminPb.collection('sponsors').update(existing.sponsor, {
					totalPaid: Math.max(0, (sponsor.totalPaid || 0) - existing.amount),
				});
			}
		}

		await writeAuditLog(adminPb, {
			sponsorId:   existing.sponsor,
			paymentId:   existing.id,
			action:      'payment.deleted',
			fromStatus:  existing.status,
			amount:      existing.amount,
			performedBy: ctx.profile?.id,
		});

		return json({ ok: true });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to delete payment';
		return json({ message: msg }, { status: 500 });
	}
};
