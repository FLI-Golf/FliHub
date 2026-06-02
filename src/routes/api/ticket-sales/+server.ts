/**
 * GET  /api/ticket-sales — list all ticket sales records
 * POST /api/ticket-sales — create a new ticket sale record
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const sales = await ctx.pb.collection('ticket_sales').getFullList({ sort: 'eventDate' });
		return json(sales);
	} catch {
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({}));

	if (!body.eventName?.trim()) return json({ message: 'eventName is required' }, { status: 400 });
	if (!body.eventDate)         return json({ message: 'eventDate is required' }, { status: 400 });
	if (body.quantity == null)   return json({ message: 'quantity is required' }, { status: 400 });

	const qty   = Number(body.quantity)       || 0;
	const price = Number(body.pricePerTicket) || 0;
	const fees  = Number(body.platformFees)   || 0;
	const gross = body.grossRevenue != null ? Number(body.grossRevenue) : qty * price;
	const net   = body.netRevenue   != null ? Number(body.netRevenue)   : gross - fees;

	try {
		const record = await ctx.pb.collection('ticket_sales').create({
			eventName:      body.eventName.trim(),
			eventDate:      body.eventDate,
			venue:          body.venue?.trim()        ?? '',
			ticketType:     body.ticketType           ?? 'general_admission',
			quantity:       qty,
			pricePerTicket: price,
			grossRevenue:   gross,
			platformFees:   fees,
			netRevenue:     net,
			status:         body.status               ?? 'projected',
			salesChannel:   body.salesChannel         ?? 'website',
			tournamentId:   body.tournamentId?.trim() ?? '',
			notes:          body.notes?.trim()        ?? '',
			invoiceNumber:  body.invoiceNumber?.trim() ?? '',
			receivedDate:   body.receivedDate          ?? null,
			reconciledDate: body.reconciledDate        ?? null,
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed to create record' }, { status: 500 });
	}
};
