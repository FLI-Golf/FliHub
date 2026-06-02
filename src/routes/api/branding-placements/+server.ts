/**
 * GET  /api/branding-placements — list all branding placement deals
 * POST /api/branding-placements — create a new placement deal
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const records = await ctx.pb.collection('branding_placements').getFullList({
			sort: 'eventDate,sponsorName'
		});
		return json(records);
	} catch {
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({}));

	if (!body.sponsorName?.trim()) return json({ message: 'sponsorName is required' }, { status: 400 });
	if (!body.eventName?.trim())   return json({ message: 'eventName is required' }, { status: 400 });

	const qty   = Number(body.quantity)         || 0;
	const rate  = Number(body.ratePerPlacement) || 0;
	const gross = body.grossRevenue != null ? Number(body.grossRevenue) : qty * rate;

	try {
		const record = await ctx.pb.collection('branding_placements').create({
			sponsorName:      body.sponsorName.trim(),
			sponsorId:        body.sponsorId?.trim()      ?? '',
			eventName:        body.eventName.trim(),
			eventDate:        body.eventDate               ?? null,
			placementType:    body.placementType           ?? 'other',
			quantity:         qty,
			ratePerPlacement: rate,
			grossRevenue:     gross,
			status:           body.status                  ?? 'proposed',
			invoiceNumber:    body.invoiceNumber?.trim()   ?? '',
			receivedDate:     body.receivedDate             ?? null,
			reconciledDate:   body.reconciledDate           ?? null,
			notes:            body.notes?.trim()            ?? '',
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
