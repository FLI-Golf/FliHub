import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// GET /api/trademark-billing-groups
export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		const groups = await ctx.pb.collection('trademark_billing_groups').getFullList({
			sort: '-created',
			expand: 'filings'
		});
		return json(groups);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

// POST /api/trademark-billing-groups
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.name?.trim())   return json({ message: 'name is required' },     { status: 400 });
	if (!body.totalFee && body.totalFee !== 0) return json({ message: 'totalFee is required' }, { status: 400 });

	try {
		const group = await ctx.pb.collection('trademark_billing_groups').create({
			name:          body.name.trim(),
			description:   body.description?.trim()   || '',
			attorneyName:  body.attorneyName?.trim()  || '',
			invoiceNumber: body.invoiceNumber?.trim() || '',
			invoiceDate:   body.invoiceDate   || null,
			dueDate:       body.dueDate       || null,
			paidDate:      body.paidDate      || null,
			totalFee:      Number(body.totalFee),
			status:        body.status        || 'quoted',
			notes:         body.notes?.trim() || ''
		});

		// If filingIds provided, link them to this group
		if (Array.isArray(body.filingIds) && body.filingIds.length > 0) {
			const perFiling = Number(body.totalFee) / body.filingIds.length;
			await Promise.all(body.filingIds.map((id: string) =>
				ctx.pb.collection('trademark_filings').update(id, {
					billingGroupId: group.id,
					attorneyFee:    Math.round(perFiling * 100) / 100
				})
			));
		}

		return json(group, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
