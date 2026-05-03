import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	const allowed = ['expenseType','amount','status','description','invoiceNumber','invoiceDate','paidDate','notes','filingId','billingGroupId'];
	const patch: Record<string, unknown> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	try {
		const updated = await ctx.pb.collection('trademark_expenses').update(params.id, patch);
		return json(updated);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });
	try {
		await ctx.pb.collection('trademark_expenses').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
