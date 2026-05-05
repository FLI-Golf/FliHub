import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json() as { id: string; value: string | number };

	try {
		const record = await ctx.pb.collection('settings').update(body.id, { value: String(body.value) });
		return json(record);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update setting' }, { status: 500 });
	}
};
