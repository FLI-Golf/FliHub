import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// PATCH /api/sponsor-payments/:id — update status, received date, notes
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json();

	try {
		const existing = await ctx.pb.collection('sponsor_payments').getOne(params.id, { fields: 'id,sponsor,amount,status' });
		const wasReceived = existing.status === 'received';
		const nowReceived = body.status === 'received';

		const record = await ctx.pb.collection('sponsor_payments').update(params.id, {
			...(body.status        !== undefined && { status:        body.status }),
			...(body.paymentType   !== undefined && { paymentType:   body.paymentType }),
			...(body.amount        !== undefined && { amount:        Number(body.amount) }),
			...(body.dueDate       !== undefined && { dueDate:       body.dueDate || null }),
			...(body.receivedDate  !== undefined && { receivedDate:  body.receivedDate || null }),
			...(body.year          !== undefined && { year:          body.year ? Number(body.year) : null }),
			...(body.invoiceNumber !== undefined && { invoiceNumber: body.invoiceNumber }),
			...(body.notes         !== undefined && { notes:         body.notes })
		});

		// Keep sponsor.totalPaid in sync when status transitions to/from received
		if (!wasReceived && nowReceived) {
			const sponsor = await ctx.pb.collection('sponsors').getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await ctx.pb.collection('sponsors').update(existing.sponsor, {
					totalPaid: (sponsor.totalPaid || 0) + (body.amount ?? existing.amount)
				});
			}
		} else if (wasReceived && !nowReceived && body.status !== undefined) {
			// Reversed — subtract
			const sponsor = await ctx.pb.collection('sponsors').getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await ctx.pb.collection('sponsors').update(existing.sponsor, {
					totalPaid: Math.max(0, (sponsor.totalPaid || 0) - existing.amount)
				});
			}
		}

		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update payment';
		return json({ message: msg }, { status: 500 });
	}
};

// DELETE /api/sponsor-payments/:id
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);

	try {
		const existing = await ctx.pb.collection('sponsor_payments').getOne(params.id, { fields: 'id,sponsor,amount,status' });

		await ctx.pb.collection('sponsor_payments').delete(params.id);

		// If it was received, subtract from totalPaid
		if (existing.status === 'received') {
			const sponsor = await ctx.pb.collection('sponsors').getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await ctx.pb.collection('sponsors').update(existing.sponsor, {
					totalPaid: Math.max(0, (sponsor.totalPaid || 0) - existing.amount)
				});
			}
		}

		return json({ ok: true });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to delete payment';
		return json({ message: msg }, { status: 500 });
	}
};
