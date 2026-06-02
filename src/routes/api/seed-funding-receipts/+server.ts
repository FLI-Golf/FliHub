import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

function numeric(value: unknown): number {
	const next = Number(value);
	return Number.isFinite(next) ? next : 0;
}

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin', 'leader');

	const body = await request.json().catch(() => ({}));
	const grossAmount = numeric(body.grossAmount);
	const netReceived = numeric(body.netReceived);

	if (grossAmount <= 0) return json({ message: 'grossAmount must be greater than 0' }, { status: 400 });
	if (netReceived <= 0) return json({ message: 'netReceived must be greater than 0' }, { status: 400 });
	if (!body.receivedDate) return json({ message: 'receivedDate is required' }, { status: 400 });
	if (netReceived > grossAmount) return json({ message: 'netReceived cannot exceed grossAmount' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('seed_funding_receipts').create({
			grossAmount,
			netReceived,
			bankFees: numeric(body.bankFees),
			brokerCommission: numeric(body.brokerCommission),
			legalClosingFees: numeric(body.legalClosingFees),
			otherDeductions: numeric(body.otherDeductions),
			receivedDate: body.receivedDate,
			bankAccount: body.bankAccount ?? '',
			referenceNumber: body.referenceNumber ?? '',
			status: body.status ?? 'received',
			notes: body.notes ?? '',
			recordedBy: ctx.userId
		});

		return json(record, { status: 201 });
	} catch (err: any) {
		const message = err?.response?.message ?? err?.message ?? 'Failed to record seed funding receipt';
		return json({ message }, { status: 500 });
	}
};
