import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	const allowed = ['name','description','attorneyName','invoiceNumber','invoiceDate','dueDate','paidDate','totalFee','status','notes'];
	const patch: Record<string, unknown> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	try {
		const updated = await ctx.pb.collection('trademark_billing_groups').update(params.id, patch);

		// If totalFee changed and filingIds provided, redistribute per-filing attorney fee
		if ('totalFee' in patch && Array.isArray(body.filingIds) && body.filingIds.length > 0) {
			const perFiling = Number(patch.totalFee) / body.filingIds.length;
			await Promise.all(body.filingIds.map((id: string) =>
				ctx.pb.collection('trademark_filings').update(id, {
					attorneyFee: Math.round(perFiling * 100) / 100
				})
			));
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });
	try {
		await ctx.pb.collection('trademark_billing_groups').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
