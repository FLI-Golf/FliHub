import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// GET /api/trademarks?franchiseId=xxx
export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const franchiseId = url.searchParams.get('franchiseId');

	try {
		const filter = franchiseId ? `franchiseId="${franchiseId}"` : '';
		const filings = await ctx.pb.collection('trademark_filings').getFullList({
			filter,
			sort: 'franchiseId,markType,logoVariant',
			expand: 'franchiseId'
		});
		return json(filings);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// POST /api/trademarks — create a new filing
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.franchiseId?.trim()) return json({ message: 'franchiseId is required' }, { status: 400 });
	if (!body.markType?.trim())    return json({ message: 'markType is required' },    { status: 400 });

	try {
		const filing = await ctx.pb.collection('trademark_filings').create({
			franchiseId:       body.franchiseId.trim(),
			markType:          body.markType.trim(),
			logoVariant:       body.logoVariant       || 'none',
			trademarkClass:    body.trademarkClass    || 'ic_041',
			status:            body.status            || 'not_filed',
			usptoAppNumber:    body.usptoAppNumber?.trim()    || '',
			usptoSerialNumber: body.usptoSerialNumber?.trim() || '',
			filedDate:         body.filedDate         || null,
			publishedDate:     body.publishedDate     || null,
			approvedDate:      body.approvedDate      || null,
			rejectedDate:      body.rejectedDate      || null,
			renewalDate:       body.renewalDate       || null,
			attorneyNotes:     body.attorneyNotes?.trim()  || '',
			internalNotes:     body.internalNotes?.trim()  || '',
			oppositionDetail:  body.oppositionDetail?.trim() || ''
		});
		return json(filing, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
