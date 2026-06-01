/**
 * DELETE /api/sponsors/[id]/activity/[entryId] — remove an activity log entry
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		await ctx.pb.collection('sponsor_activity').delete(params.entryId);
		return json({ ok: true });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to delete entry';
		return json({ message: msg }, { status: 500 });
	}
};
