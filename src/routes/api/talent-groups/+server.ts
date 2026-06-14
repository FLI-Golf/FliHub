import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	try {
		const guard = await requireAdminApi(locals, url);
		if (guard.error) return guard.error;
		const pb = guard.ctx.pb;
		const body = await request.json().catch(() => ({}));
		const name = String(body.name ?? '').trim();

		if (!name) return json({ message: 'Group name is required' }, { status: 400 });

		const record = await pb.collection('talent_groups').create({
			name,
			groupType: body.groupType ?? 'music_group',
			primaryContactName: String(body.primaryContactName ?? '').trim(),
			primaryContactEmail: String(body.primaryContactEmail ?? '').trim(),
			primaryContactPhone: String(body.primaryContactPhone ?? '').trim(),
			members: Array.isArray(body.members) ? body.members : [],
			memberCount: Number(body.memberCount) || 0,
			defaultFee: body.defaultFee != null && body.defaultFee !== '' ? Number(body.defaultFee) : null,
			notes: String(body.notes ?? '').trim()
		});

		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to create talent group' }, { status: 400 });
	}
};
