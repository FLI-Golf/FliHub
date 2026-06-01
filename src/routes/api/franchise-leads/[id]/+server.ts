import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	try {
		const record = await ctx.pb.collection('franchise_leads').update(params.id, body);
		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update lead';
		return json({ message: msg }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		await ctx.pb.collection('franchise_leads').delete(params.id);
		return json({ success: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to delete lead' }, { status: 500 });
	}
};
