import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// Exception by design: sponsor_payments are inbound revenue records.
// They intentionally do not use the expense -> approval -> work_order chain.

// POST /api/sponsor-payments — log a new payment against a sponsor
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	if (!body.sponsor) return json({ message: 'sponsor is required' }, { status: 400 });
	if (!body.amount || body.amount <= 0) return json({ message: 'amount must be > 0' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('sponsor_payments').create({
			sponsor:       body.sponsor,
			amount:        Number(body.amount),
			paymentType:   body.paymentType   ?? 'installment',
			status:        body.status        ?? 'scheduled',
			dueDate:       body.dueDate       ?? null,
			receivedDate:  body.receivedDate  ?? null,
			year:          body.year          ? Number(body.year) : null,
			invoiceNumber: body.invoiceNumber ?? '',
			notes:         body.notes         ?? '',
			recordedBy:    body.recordedBy    ?? null
		});

		// If payment is received, update sponsor.totalPaid
		if (body.status === 'received') {
			const sponsor = await ctx.pb.collection('sponsors').getOne(body.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
			if (sponsor) {
				await ctx.pb.collection('sponsors').update(body.sponsor, {
					totalPaid: (sponsor.totalPaid || 0) + Number(body.amount)
				});
			}
		}

		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create payment';
		return json({ message: msg }, { status: 500 });
	}
};
