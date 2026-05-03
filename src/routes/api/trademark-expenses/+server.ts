import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// GET /api/trademark-expenses?filingId=xxx&billingGroupId=xxx
export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx          = await RequestContext.from(locals, url);
	const filingId     = url.searchParams.get('filingId');
	const groupId      = url.searchParams.get('billingGroupId');

	const filters: string[] = [];
	if (filingId) filters.push(`filingId="${filingId}"`);
	if (groupId)  filters.push(`billingGroupId="${groupId}"`);

	try {
		const expenses = await ctx.pb.collection('trademark_expenses').getFullList({
			filter: filters.join(' && ') || '',
			sort:   '-created',
			expand: 'filingId,billingGroupId'
		});
		return json(expenses);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

// POST /api/trademark-expenses
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.expenseType) return json({ message: 'expenseType is required' }, { status: 400 });
	if (body.amount == null) return json({ message: 'amount is required' },    { status: 400 });

	try {
		const expense = await ctx.pb.collection('trademark_expenses').create({
			filingId:       body.filingId       || null,
			billingGroupId: body.billingGroupId || null,
			expenseType:    body.expenseType,
			amount:         Number(body.amount),
			status:         body.status         || 'pending',
			description:    body.description?.trim()   || '',
			invoiceNumber:  body.invoiceNumber?.trim()  || '',
			invoiceDate:    body.invoiceDate    || null,
			paidDate:       body.paidDate       || null,
			notes:          body.notes?.trim()  || ''
		});
		return json(expense, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
