import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json() as { id?: string; key?: string; value: string | number; label?: string };
	const role = ctx.profile?.role;
	if (role !== 'admin' && role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	try {
		let record: any;
		if (body.id) {
			record = await ctx.pb.collection('settings').update(body.id, { value: String(body.value) });
		} else if (body.key) {
			const existing = await ctx.pb.collection('settings')
				.getFirstListItem(`key = "${body.key}"`, { fields: 'id' })
				.catch(() => null);

			if (existing?.id) {
				record = await ctx.pb.collection('settings').update(existing.id, { value: String(body.value) });
			} else {
				record = await ctx.pb.collection('settings').create({
					key: body.key,
					label: body.label ?? body.key,
					value: String(body.value)
				});
			}
		} else {
			return json({ message: 'Missing setting id or key' }, { status: 400 });
		}

		return json(record);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update setting' }, { status: 500 });
	}
};
