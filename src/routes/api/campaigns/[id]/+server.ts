import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

const ALLOWED_STATUSES = new Set(['Planning', 'Active', 'Paused', 'Completed']);

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin', 'leader', 'marketing', 'marketing_lead');

	const campaignId = params.id;
	if (!campaignId) return json({ message: 'Campaign id is required' }, { status: 400 });

	const body = await request.json().catch(() => null);
	const status = String(body?.status ?? '').trim();
	if (!status || !ALLOWED_STATUSES.has(status)) {
		return json({ message: 'A valid status is required' }, { status: 400 });
	}

	try {
		const adminPb = await getAdminPocketBase();
		const updated = await adminPb.collection('campaigns').update(campaignId, { status });
		return json({ campaign: updated });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed to update campaign' }, { status: 500 });
	}
};
